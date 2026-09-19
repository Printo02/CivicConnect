"""
Voice transcription and translation service using:

- faster-whisper
    Automatically detects English/Malayalam and transcribes
    in the SAME language as the spoken audio.

- IndicTrans2
    Translates the original transcript separately:
        English -> Malayalam
        Malayalam -> English
"""

import logging

import torch
from django.utils import timezone
from faster_whisper import WhisperModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from IndicTransToolkit import IndicProcessor

from civicconnectapp.models import (
    Complaint,
    ComplaintTranslation,
    Constituency,
)


logger = logging.getLogger(__name__)


# ============================================================
# GLOBAL MODEL CACHES
# ============================================================

# IndicTrans2 model cache
_TRANSLATOR_MODEL = None
_TRANSLATOR_TOKENIZER = None
_TRANSLATOR_PROCESSOR = None

# Whisper model cache
_WHISPER_MODEL = None


# ============================================================
# LANGUAGE CONFIGURATION
# ============================================================

# Whisper language codes
WHISPER_MALAYALAM = "ml"
WHISPER_ENGLISH = "en"

# IndicTrans2 language codes
INDIC_ENGLISH = "eng_Latn"
INDIC_MALAYALAM = "mal_Mlym"

# HuggingFace IndicTrans2 model
# This model handles English <-> Indic languages including Malayalam.
INDICTRANS_MODEL_NAME = (
    "ai4bharat/indictrans2-en-indic-dist-200M"
)


# ============================================================
# MAIN VOICE PROCESSING
# ============================================================

def process_complaint_voice(complaint_id):
    """
    Process complaint voice:

    1. Load complaint.
    2. Mark voice processing as PROCESSING.
    3. Transcribe using Whisper with automatic language detection.
    4. Preserve the spoken language in the transcript.
    5. Save detected language.
    6. Translate separately using IndicTrans2.
    7. Create ComplaintTranslation record.
    8. Auto-link constituency.
    9. Mark processing as COMPLETED.
    """

    start_time = timezone.now()
    complaint = None

    # --------------------------------------------------------
    # Get complaint
    # --------------------------------------------------------

    try:
        complaint = Complaint.objects.get(id=complaint_id)

    except Complaint.DoesNotExist:
        logger.error(
            f"Complaint {complaint_id} not found"
        )
        return

    try:
        # ----------------------------------------------------
        # Mark PROCESSING
        # ----------------------------------------------------

        complaint.voice_processing_status = (
            Complaint.VoiceProcessingStatus.PROCESSING
        )

        complaint.save(
            update_fields=[
                "voice_processing_status"
            ]
        )

        logger.info(
            f"Complaint {complaint_id}: "
            f"voice processing started"
        )

        # ----------------------------------------------------
        # Verify audio
        # ----------------------------------------------------

        if not complaint.audio_file:
            logger.error(
                f"Complaint {complaint_id}: "
                f"No audio file"
            )

            _mark_failed(complaint)
            return

        audio_path = complaint.audio_file.path

        logger.info(
            f"Complaint {complaint_id}: "
            f"audio path = {audio_path}"
        )

        # ----------------------------------------------------
        # TRANSCRIBE
        #
        # IMPORTANT:
        # Do NOT pass complaint.voice_language to Whisper.
        #
        # Whisper will automatically detect whether the user
        # spoke Malayalam or English.
        # ----------------------------------------------------

        logger.info(
            f"Complaint {complaint_id}: "
            f"starting automatic language detection..."
        )

        transcription_result = transcribe_audio(
            audio_path
        )

        transcript = transcription_result["text"]

        source_language = (
            transcription_result["language"]
        )

        language_probability = (
            transcription_result["language_probability"]
        )

        # ----------------------------------------------------
        # Validate transcription
        # ----------------------------------------------------

        if not transcript or not transcript.strip():
            logger.error(
                f"Complaint {complaint_id}: "
                f"Transcription returned empty text"
            )

            _mark_failed(complaint)
            return

        # ----------------------------------------------------
        # Normalize detected language
        #
        # CivicConnect currently supports English + Malayalam.
        # If Whisper detects another language, we keep the
        # transcript but log a warning.
        # ----------------------------------------------------

        if source_language not in {
            WHISPER_ENGLISH,
            WHISPER_MALAYALAM,
        }:

            logger.warning(
                f"Complaint {complaint_id}: "
                f"Whisper detected unsupported language "
                f"'{source_language}'. "
                f"Probability={language_probability:.3f}"
            )

        logger.info(
            f"Complaint {complaint_id}: "
            f"transcription successful"
        )

        logger.info(
            f"Detected language: {source_language}"
        )

        logger.info(
            f"Language probability: "
            f"{language_probability:.3f}"
        )

        logger.info(
            f"Transcript: {transcript}"
        )

        # ----------------------------------------------------
        # Save detected/original language
        # ----------------------------------------------------

        complaint.original_language = source_language

        # Keep voice_language synchronized with the actual
        # detected language.
        complaint.voice_language = source_language

        # ----------------------------------------------------
        # Determine translation language
        #
        # Malayalam -> English
        # English   -> Malayalam
        # ----------------------------------------------------

        if source_language == WHISPER_MALAYALAM:
            target_language = WHISPER_ENGLISH

        elif source_language == WHISPER_ENGLISH:
            target_language = WHISPER_MALAYALAM

        else:
            # Unsupported language:
            # Do not attempt an incorrect translation.
            target_language = None

        translated_text = transcript

        # ----------------------------------------------------
        # TRANSLATION
        # ----------------------------------------------------

        if target_language:

            logger.info(
                f"Complaint {complaint_id}: "
                f"translating "
                f"{source_language} -> {target_language}"
            )

            try:
                translated_text = translate_text(
                    transcript,
                    source_language,
                    target_language,
                )

                if not translated_text:
                    translated_text = transcript

            except Exception as e:

                logger.exception(
                    f"Complaint {complaint_id}: "
                    f"translation failed: {str(e)}"
                )

                # Translation failure should NOT destroy
                # the successful original transcript.
                translated_text = transcript

        else:

            logger.info(
                f"Complaint {complaint_id}: "
                f"translation skipped because detected "
                f"language '{source_language}' "
                f"is not currently supported"
            )

        # ----------------------------------------------------
        # Update complaint title/description if empty
        #
        # IMPORTANT:
        # The ORIGINAL transcript is stored in the complaint,
        # not the translated text.
        # ----------------------------------------------------

        title_text = (
            transcript[:200]
            if len(transcript) > 200
            else transcript
        ).split("\n")[0].strip()

        fields_to_update = [
            "original_language",
            "voice_language",
            "updated_at",
        ]

        if not complaint.title or not complaint.title.strip():

            complaint.title = title_text

            fields_to_update.append("title")

        if (
            not complaint.description
            or not complaint.description.strip()
        ):

            complaint.description = transcript

            fields_to_update.append("description")

        complaint.save(
            update_fields=fields_to_update
        )

        # ----------------------------------------------------
        # CREATE TRANSLATION RECORD
        # ----------------------------------------------------

        if target_language and translated_text:

            try:

                translation_title = (
                    translated_text[:200]
                    if len(translated_text) > 200
                    else translated_text
                ).split("\n")[0].strip()

                ComplaintTranslation.objects.update_or_create(
                    complaint=complaint,
                    language=target_language,
                    defaults={
                        "title": translation_title[:255],
                        "description": translated_text,
                        "translated_by": "indictrans2",
                    },
                )

                logger.info(
                    f"Complaint {complaint_id}: "
                    f"translation record saved"
                )

            except Exception as e:

                logger.exception(
                    f"Complaint {complaint_id}: "
                    f"translation record failed: {str(e)}"
                )

        # ----------------------------------------------------
        # AUTO-LINK CONSTITUENCY
        # ----------------------------------------------------

        if (
            hasattr(complaint, "location_point")
            and complaint.location_point
        ):

            try:

                _link_constituency(
                    complaint
                )

            except Exception as e:

                logger.warning(
                    f"Complaint {complaint_id}: "
                    f"constituency link failed: {str(e)}"
                )

        # ----------------------------------------------------
        # MARK COMPLETED
        # ----------------------------------------------------

        complaint.voice_processing_status = (
            Complaint.VoiceProcessingStatus.COMPLETED
        )

        complaint.save(
            update_fields=[
                "voice_processing_status"
            ]
        )

        elapsed = (
            timezone.now() - start_time
        ).total_seconds()

        logger.info(
            f"Complaint {complaint_id}: "
            f"VOICE PROCESSING COMPLETED "
            f"in {elapsed:.2f}s"
        )

    except Exception as e:

        logger.exception(
            f"Complaint {complaint_id}: "
            f"voice processing error: {str(e)}"
        )

        if complaint:
            _mark_failed(complaint)


# ============================================================
# MARK FAILED
# ============================================================

def _mark_failed(complaint):
    """
    Mark complaint voice processing as FAILED.
    """

    try:

        complaint.voice_processing_status = (
            Complaint.VoiceProcessingStatus.FAILED
        )

        complaint.save(
            update_fields=[
                "voice_processing_status"
            ]
        )

    except Exception:

        logger.exception(
            "Unable to mark complaint voice processing "
            "as FAILED"
        )


# ============================================================
# AUTO-LINK CONSTITUENCY
# ============================================================

def _link_constituency(complaint):
    """
    Auto-link complaint to constituency based on
    complaint.location_point.
    """

    if not complaint.location_point:
        return

    matching = (
        Constituency.objects.filter(
            boundary__contains=complaint.location_point,
            is_active=True,
        )
        .first()
    )

    if matching:

        complaint.constituency = matching

        complaint.save(
            update_fields=[
                "constituency"
            ]
        )

        logger.info(
            f"Complaint {complaint.id} "
            f"linked to constituency "
            f"{matching.name}"
        )


# ============================================================
# WHISPER TRANSCRIPTION
# ============================================================

def transcribe_audio(audio_path):
    """
    Transcribe audio using faster-whisper.

    IMPORTANT:
    The language is NOT forced.

    Whisper automatically detects the spoken language.

    Malayalam speech:
        "റോഡ് വളരെ മോശമാണ് ഇവിടെ"

    becomes:
        "റോഡ് വളരെ മോശമാണ് ഇവിടെ"

    English speech:
        "The road is very bad here."

    becomes:
        "The road is very bad here."

    Returns:
        {
            "text": str,
            "language": str,
            "language_probability": float
        }
    """

    global _WHISPER_MODEL

    try:

        # ----------------------------------------------------
        # Load Whisper only once
        # ----------------------------------------------------

        if _WHISPER_MODEL is None:

            logger.info(
                "Loading faster-whisper model "
                "(small, CPU, int8)..."
            )

            _WHISPER_MODEL = WhisperModel(
                "small",
                device="cpu",
                compute_type="int8",
            )

            logger.info(
                "Whisper model loaded successfully"
            )

        # ----------------------------------------------------
        # Automatic language detection
        # ----------------------------------------------------

        logger.info(
            "Starting Whisper transcription "
            "with automatic language detection"
        )

        segments, info = (
            _WHISPER_MODEL.transcribe(
                audio_path,

                # IMPORTANT:
                # transcribe = preserve original language
                # translate = convert to English
                task="transcribe",

                # Better accuracy
                beam_size=5,

                # Helps remove long periods of silence
                vad_filter=True,
            )
        )

        # ----------------------------------------------------
        # Combine segments
        # ----------------------------------------------------

        transcript_parts = []

        for segment in segments:

            text = segment.text.strip()

            if text:
                transcript_parts.append(text)

        transcript = " ".join(
            transcript_parts
        ).strip()

        # ----------------------------------------------------
        # Get detected language
        # ----------------------------------------------------

        detected_language = (
            info.language
            if info and info.language
            else None
        )

        language_probability = (
            float(info.language_probability)
            if info and info.language_probability is not None
            else 0.0
        )

        # ----------------------------------------------------
        # Logging
        # ----------------------------------------------------

        logger.info(
            f"Whisper detected language: "
            f"{detected_language}"
        )

        logger.info(
            f"Language probability: "
            f"{language_probability:.3f}"
        )

        if transcript:

            logger.info(
                f"Transcription successful "
                f"({len(transcript)} characters)"
            )

            return {
                "text": transcript,
                "language": detected_language,
                "language_probability": (
                    language_probability
                ),
            }

        logger.warning(
            f"Whisper returned empty transcript: "
            f"{audio_path}"
        )

        return {
            "text": "",
            "language": detected_language,
            "language_probability": (
                language_probability
            ),
        }

    except FileNotFoundError:

        logger.error(
            f"Audio file not found: "
            f"{audio_path}"
        )

        return {
            "text": "",
            "language": None,
            "language_probability": 0.0,
        }

    except Exception as e:

        logger.exception(
            f"Transcription failed: {str(e)}"
        )

        return {
            "text": "",
            "language": None,
            "language_probability": 0.0,
        }


# ============================================================
# INDIC TRANS2 TRANSLATION
# ============================================================

def _load_translation_model():
    """
    Load IndicTrans2 model only once.

    Uses:
        ai4bharat/indictrans2-en-indic-dist-200M

    The IndicTransToolkit package provides IndicProcessor.
    The actual translation model is loaded through Transformers.
    """

    global _TRANSLATOR_MODEL
    global _TRANSLATOR_TOKENIZER
    global _TRANSLATOR_PROCESSOR

    if (
        _TRANSLATOR_MODEL is not None
        and _TRANSLATOR_TOKENIZER is not None
        and _TRANSLATOR_PROCESSOR is not None
    ):
        return (
            _TRANSLATOR_MODEL,
            _TRANSLATOR_TOKENIZER,
            _TRANSLATOR_PROCESSOR,
        )

    logger.info(
        f"Loading IndicTrans2 model: "
        f"{INDICTRANS_MODEL_NAME}"
    )

    device = (
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    logger.info(
        f"IndicTrans2 device: {device}"
    )

    # --------------------------------------------------------
    # Tokenizer
    # --------------------------------------------------------

    _TRANSLATOR_TOKENIZER = (
        AutoTokenizer.from_pretrained(
            INDICTRANS_MODEL_NAME,
            trust_remote_code=True,
        )
    )

    # --------------------------------------------------------
    # Model
    # --------------------------------------------------------

    _TRANSLATOR_MODEL = (
        AutoModelForSeq2SeqLM.from_pretrained(
            INDICTRANS_MODEL_NAME,
            trust_remote_code=True,
        )
    )

    _TRANSLATOR_MODEL = (
        _TRANSLATOR_MODEL.to(device)
    )

    _TRANSLATOR_MODEL.eval()

    # --------------------------------------------------------
    # IndicProcessor
    # --------------------------------------------------------

    _TRANSLATOR_PROCESSOR = (
        IndicProcessor(
            inference=True
        )
    )

    logger.info(
        "IndicTrans2 model loaded successfully"
    )

    return (
        _TRANSLATOR_MODEL,
        _TRANSLATOR_TOKENIZER,
        _TRANSLATOR_PROCESSOR,
    )


# ============================================================
# TRANSLATE TEXT
# ============================================================

def translate_text(
    text,
    source_lang,
    target_lang,
):
    """
    Translate English <-> Malayalam using IndicTrans2.

    Arguments:

        text:
            Text to translate.

        source_lang:
            Whisper language:
                'en'
                'ml'

        target_lang:
            Whisper language:
                'en'
                'ml'

    Returns:
        Translated text.
        Original text if translation fails.
    """

    # --------------------------------------------------------
    # Empty text
    # --------------------------------------------------------

    if not text or not text.strip():
        return text

    # --------------------------------------------------------
    # Same language
    # --------------------------------------------------------

    if source_lang == target_lang:
        return text

    # --------------------------------------------------------
    # Convert language codes
    #
    # Whisper:
    #     en -> eng_Latn
    #     ml -> mal_Mlym
    #
    # IndicTrans2:
    #     eng_Latn
    #     mal_Mlym
    # --------------------------------------------------------

    language_map = {
        "en": INDIC_ENGLISH,
        "ml": INDIC_MALAYALAM,
    }

    src_lang = language_map.get(
        source_lang
    )

    tgt_lang = language_map.get(
        target_lang
    )

    if not src_lang or not tgt_lang:

        logger.warning(
            f"Unsupported translation language: "
            f"{source_lang} -> {target_lang}"
        )

        return text

    try:

        # ----------------------------------------------------
        # Load model
        # ----------------------------------------------------

        (
            model,
            tokenizer,
            processor,
        ) = _load_translation_model()

        device = next(
            model.parameters()
        ).device

        # ----------------------------------------------------
        # IndicTrans2 preprocessing
        # ----------------------------------------------------

        sentences = [
            text.strip()
        ]

        batch = processor.preprocess_batch(
            sentences,
            src_lang=src_lang,
            tgt_lang=tgt_lang,
        )

        # ----------------------------------------------------
        # Tokenization
        # ----------------------------------------------------

        inputs = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt",
        )

        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }

        # ----------------------------------------------------
        # Generate translation
        # ----------------------------------------------------

        with torch.inference_mode():

            outputs = model.generate(
                **inputs,
                num_beams=5,
                max_new_tokens=256,
            )

        # ----------------------------------------------------
        # Decode
        # ----------------------------------------------------

        decoded = tokenizer.batch_decode(
            outputs,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True,
        )

        # ----------------------------------------------------
        # IndicTrans2 post-processing
        # ----------------------------------------------------

        translated = (
            processor.postprocess_batch(
                decoded,
                lang=tgt_lang,
            )
        )

        if translated and translated[0].strip():

            result = translated[0].strip()

            logger.info(
                f"Translation successful: "
                f"{source_lang} -> {target_lang} "
                f"({len(result)} chars)"
            )

            return result

        logger.warning(
            "IndicTrans2 returned empty translation"
        )

        return text

    except Exception as e:

        logger.exception(
            f"IndicTrans2 translation failed: "
            f"{source_lang} -> {target_lang}: "
            f"{str(e)}"
        )

        # IMPORTANT:
        # Never destroy the original Whisper transcript
        # because translation failed.
        return text


