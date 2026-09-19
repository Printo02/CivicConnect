import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor


MODEL_NAME = "ai4bharat/indictrans2-en-indic-1B"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = model.to("cpu")
model.eval()

print("Loading IndicProcessor...")
ip = IndicProcessor(inference=True)


def translate(text, src_lang, tgt_lang):
    print(f"\nTranslating: {src_lang} -> {tgt_lang}")
    print("Input:", text)

    batch = [text]

    # Preprocess
    batch = ip.preprocess_batch(
        batch,
        src_lang=src_lang,
        tgt_lang=tgt_lang
    )

    print("Processed:", batch)

    # Tokenize
    inputs = tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    # Generate
    with torch.no_grad():
        generated_tokens = model.generate(
            **inputs,
            max_length=256,
            num_beams=5
        )

    # Decode
    decoded = tokenizer.batch_decode(
        generated_tokens,
        skip_special_tokens=True
    )

    print("Raw output:", decoded)

    # Postprocess
    result = ip.postprocess_batch(
        decoded,
        lang=tgt_lang
    )

    print("Translation:", result[0])

    return result[0]


# English -> Malayalam
translate(
    "Hello world, how are you?",
    "eng_Latn",
    "mal_Mlym"
)