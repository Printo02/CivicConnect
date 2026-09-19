import React, { useEffect, useState } from "react";
import { FaArrowLeft,FaMapMarkerAlt,FaUser,FaCalendarAlt,FaPlay,FaFileAlt,
  FaImage,FaTimes,FaPaperclip,FaVolumeUp,FaGlobe,FaReply,FaPaperPlane,FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import { getBranchEmployeeComplaint,getBranchEmployeeComplaintResponses,
  createBranchEmployeeComplaintResponse,updateBranchEmployeeComplaint } from "../../api/services/BranchEmployee/Complaint.js";
import styles from "../components/module.css/BranchEmployeeComplaintDetail.module.css";
import BranchEmployeeLayout from "../components/BranchEmployeeLayout";



/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  ["pending", "Pending"],
  ["in_progress", "In Progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
  ["rejected", "Rejected"],
];


/* =========================================================
   HELPERS
========================================================= */

const getFileType = (file) => {
  const mime = String(file?.mime_type || "").toLowerCase();
  const type = String(file?.file_type || "").toLowerCase();

  const filename = String(
    file?.original_filename ||
      file?.file ||
      ""
  ).toLowerCase();

  if (
    mime.startsWith("image/") ||
    type === "image" ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename)
  ) {
    return "image";
  }

  if (
    mime.startsWith("video/") ||
    type === "video" ||
    /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(filename)
  ) {
    return "video";
  }

  if (
    mime.startsWith("audio/") ||
    type === "audio" ||
    /\.(mp3|wav|ogg|aac|m4a|webm)$/i.test(filename)
  ) {
    return "audio";
  }

  return "file";
};


const formatDate = (date) => {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};


const getLanguageLabel = (language) => {
  if (!language) {
    return null;
  }

  const labels = {
    en: "English",
    ml: "Malayalam",
  };

  return labels[language] || String(language).toUpperCase();
};


/* =========================================================
   NORMALIZE RESPONSES
========================================================= */

const normalizeResponses = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};


/* =========================================================
   COMPONENT
========================================================= */

export default function BranchEmployeeComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();


  /* =======================================================
     COMPLAINT STATE
  ======================================================= */

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =======================================================
     RESPONSE / STATUS STATE
  ======================================================= */

  const [status, setStatus] = useState("");


  /* =======================================================
     RESPONSE STATE
  ======================================================= */

  const [responses, setResponses] = useState([]);

  const [responsesLoading, setResponsesLoading] =
    useState(true);

  const [responseText, setResponseText] =
    useState("");

  const [responseFile, setResponseFile] =
    useState(null);

  const [sendingResponse, setSendingResponse] =
    useState(false);

  const [responseError, setResponseError] =
    useState("");

  const [responseSuccess, setResponseSuccess] =
    useState("");

  const [historyOpen, setHistoryOpen] = useState(false);

  const [responseFormOpen, setResponseFormOpen] = useState(false);


  /* =======================================================
     MEDIA PREVIEW
  ======================================================= */

  const [previewFile, setPreviewFile] =
    useState(null);


  /* =======================================================
     LOAD COMPLAINT
  ======================================================= */

  const loadComplaint = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getBranchEmployeeComplaint(id);

      setComplaint(data);

      setStatus(data?.status || "");
    } catch (err) {
      console.error(
        "Failed to load branch employee complaint:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load complaint."
      );
    } finally {
      setLoading(false);
    }
  };


  /* =======================================================
     LOAD RESPONSES
  ======================================================= */

  const loadResponses = async () => {
    try {
      setResponsesLoading(true);

      const data =
        await getBranchEmployeeComplaintResponses(id);

      setResponses(
        normalizeResponses(data)
      );

      setResponseError("");
    } catch (err) {
      console.error(
        "Failed to load complaint responses:",
        err
      );

      setResponses([]);

      setResponseError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load complaint responses."
      );
    } finally {
      setResponsesLoading(false);
    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (!id) {
      setError("Invalid complaint ID.");
      setLoading(false);
      return;
    }

    loadComplaint();
    loadResponses();
  }, [id]);


  /* =======================================================
     SEND BRANCH EMPLOYEE RESPONSE
     
     IMPORTANT:
     The current API service accepts:
     
     createBranchEmployeeComplaintResponse(
       complaintId,
       responseText,
       files
     )

     Therefore the attachment is sent together
     with the response.
  ======================================================= */

  const submitResponse = async (event) => {
    event.preventDefault();

    setResponseError("");
    setResponseSuccess("");

    const trimmedResponse = responseText.trim();

    if (!trimmedResponse) {
      setResponseError(
        "Please enter a response to the citizen."
      );
      return;
    }

    if (!status) {
      setResponseError(
        "Please select a complaint status."
      );
      return;
    }

    try {
      setSendingResponse(true);

      await createBranchEmployeeComplaintResponse(
        id,
        trimmedResponse,
        responseFile ? [responseFile] : []
      );

      await updateBranchEmployeeComplaint(id, {
        status,
      });

      await Promise.all([
        loadComplaint(),
        loadResponses(),
      ]);

      setResponseText("");
      setResponseFile(null);

      const fileInput =
        document.getElementById(
          "branch-employee-response-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setResponseSuccess(
        "Response sent and complaint status updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to create branch employee response:",
        err
      );

      const data = err?.response?.data;

      setResponseError(
        data?.detail ||
          data?.message ||
          data?.status?.[0] ||
          data?.response?.[0] ||
          data?.response_text?.[0] ||
          err?.message ||
          "Unable to send response."
      );
    } finally {
      setSendingResponse(false);
    }
  };


  /* =======================================================
     ATTACHMENT PREVIEW
  ======================================================= */

  const openPreview = (file) => {
    const type = getFileType(file);

    if (
      type === "image" ||
      type === "video"
    ) {
      setPreviewFile(file);
    }
  };


  const closePreview = () => {
    setPreviewFile(null);
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <BranchEmployeeLayout>
        <div className={styles.page}>
          <div className={styles.state}>
            Loading complaint...
          </div>
        </div>
      </BranchEmployeeLayout>
    );
  }


  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (!complaint) {
    return (
      <BranchEmployeeLayout>
        <div className={styles.page}>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>

          <div className={styles.error}>
            {error || "Complaint not found."}
          </div>

        </div>
      </BranchEmployeeLayout>
    );
  }


  /* =======================================================
     ATTACHMENTS
  ======================================================= */

  const attachments =
    Array.isArray(complaint.attachments)
      ? complaint.attachments
      : [];

  const mediaAttachments =
    attachments.filter((file) => {
      const type = getFileType(file);

      return (
        type === "image" ||
        type === "video"
      );
    });

  const otherAttachments =
    attachments.filter(
      (file) =>
        getFileType(file) === "file"
    );

  const audioAttachments =
    attachments.filter(
      (file) =>
        getFileType(file) === "audio"
    );


  /* =======================================================
     TRANSLATION
  ======================================================= */

  const alternateTranslation =
    Array.isArray(complaint.translations)
      ? complaint.translations.find(
          (translation) =>
            translation.language !==
            complaint.original_language
        )
      : null;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <BranchEmployeeLayout>
      <div className={styles.page}>

        {/* =================================================
            BACK
        ================================================= */}

        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back to complaints
        </button>


        {/* =================================================
            HEADER
        ================================================= */}

        <div className={styles.detailHeader}>
          <div>

            <h1>
              {complaint.title ||
                "Untitled complaint"}
            </h1>

          </div>
        </div>


        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className={styles.detailGrid}>

          <div className={styles.complaintMediaRow}>
          {/* =================================================
              COMPLAINT DETAILS
          ================================================= */}

          <section
            className={`${styles.cardPanel} ${styles.fullWidth}`}
          >

            <div className={styles.sectionHeader}>
              <div>

                <h2>
                  Complaint details
                </h2>

                <p>
                  Information submitted by the citizen.
                </p>

              </div>

              <button
                type="button"
                className={styles.complaintRespondButton}
                onClick={() => {
                  setResponseFormOpen(true);
                  setTimeout(() => {
                    document
                      .getElementById("respond-to-citizen")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
              >
                <FaReply />
                Respond
              </button>
            </div>


            {/* META */}

            <div className={styles.complaintMetaGrid}>

              {/* Citizen */}

              <div className={styles.complaintMetaItem}>
                <FaUser />

                <div>
                  <small>
                    Complaint posted by
                  </small>

                  <strong>
                    {complaint.citizen_name ||
                      "Not available"}
                  </strong>
                </div>
              </div>


              {/* Date */}

              <div className={styles.complaintMetaItem}>
                <FaCalendarAlt />

                <div>
                  <small>
                    Posted on
                  </small>

                  <strong>
                    {formatDate(
                      complaint.created_at
                    )}
                  </strong>
                </div>
              </div>


              {/* Location */}

              <div className={styles.complaintMetaItem}>
                <FaMapMarkerAlt />

                <div>
                  <small>
                    Location
                  </small>

                  <strong>
                    {complaint.location ||
                      "Not available"}
                  </strong>
                </div>
              </div>


              {/* Complaint ID */}

              <div className={styles.complaintMetaItem}>
                <FaPaperclip />

                <div>
                  <small>
                    Complaint ID
                  </small>

                  <strong>
                    #{complaint.id}
                  </strong>
                </div>
              </div>


              {/* Status */}

              <div className={styles.complaintMetaItem}>
                <span
                  className={styles.infoDot}
                />

                <div>
                  <small>
                    Current status
                  </small>

                  <div
                    className={
                      styles.detailsStatus
                    }
                  >
                    <ComplaintStatusBadge
                      status={complaint.status}
                      label={
                        complaint.status_display ||
                        complaint.status
                      }
                    />
                  </div>
                </div>
              </div>



              {/* Priority */}

              <div className={styles.complaintMetaItem}>
                <span
                  className={styles.infoDot}
                />

                <div>
                  <small>
                    Priority
                  </small>

                  <strong>
                    {complaint.priority_display ||
                      "Not specified"}
                  </strong>
                </div>
              </div>
            </div>


            {/* CATEGORY */}

            {/* {complaint.category_name && (
              <div className={styles.category}>
                Category:{" "}
                <strong>
                  {complaint.category_name}
                </strong>
              </div>
            )} */}


            {/* REPRESENTATIVE */}

            {/* {complaint.representative_name && (
              <div className={styles.assignment}>
                Assigned representative:{" "}
                <strong>
                  {complaint.representative_name}
                </strong>
              </div>
            )} */}


            {/* BRANCH */}

            {/* {complaint.branch_name && (
              <div className={styles.assignment}>
                Assigned branch:{" "}
                <strong>
                  {complaint.branch_name}
                </strong>
              </div>
            )} */}


            {/* ASSIGNED EMPLOYEE */}

            {/* {complaint.assigned_employee_name && (
              <div className={styles.assignment}>
                Assigned employee:{" "}
                <strong>
                  {complaint.assigned_employee_name}
                </strong>
              </div>
            )} */}


            {/* DESCRIPTION */}

            <div
              className={
                styles.descriptionBlock
              }
            >
              <small><b>Description</b></small>

              <div
                className={
                  styles.descriptionLarge
                }
              >
                {complaint.description ||
                  "No description provided."}
              </div>
            </div>


            {/* VOICE COMPLAINT */}

            {complaint.audio_file && (
              <div
                className={
                  styles.voiceComplaint
                }
              >

                <div
                  className={
                    styles.voiceHeader
                  }
                >

                  <div
                    className={
                      styles.voiceIcon
                    }
                  >
                    <FaVolumeUp />
                  </div>

                  <div>
                    <strong>
                      Voice complaint
                    </strong>

                    <small>
                      Audio submitted by the
                      citizen
                    </small>
                  </div>

                </div>

                <audio
                  className={
                    styles.audioPlayer
                  }
                  controls
                  preload="metadata"
                >
                  <source
                    src={
                      complaint.audio_file
                    }
                  />

                  Your browser does not
                  support audio playback.
                </audio>

              </div>
            )}
            {/* ACTION TAKEN */}

            {complaint.action_taken && (
              <div
                className={
                  styles.actionTaken
                }
              >
                <small>
                  Latest action taken
                </small>

                <p>
                  {complaint.action_taken}
                </p>
              </div>
            )}


            {/* RESOLUTION NOTES */}

            {complaint.resolution_notes && (
              <div
                className={
                  styles.actionTaken
                }
              >
                <small>
                  Resolution notes
                </small>

                <p>
                  {complaint.resolution_notes}
                </p>
              </div>
            )}

          

          {/* =================================================
              MEDIA ATTACHMENTS
          ================================================= */}

          <section
            className={`${styles.mediaPanel} ${styles.complaintDetailsMedia}`}
          >

            <div
              className={
                styles.sectionHeader
              }
            >

              <div>

                <h2>
                  Media attachments
                </h2>

                <p>
                  Images and videos attached
                  by the citizen.
                </p>

              </div>

              <span
                className={
                  styles.attachmentCount
                }
              >
                {mediaAttachments.length}
              </span>

            </div>


            {mediaAttachments.length > 0 ? (

              <div
                className={
                  styles.mediaGrid
                }
              >

                {mediaAttachments.map(
                  (file) => {

                    const type =
                      getFileType(file);

                    return (
                      <button
                        key={file.id || file.file}
                        type="button"
                        className={
                          styles.mediaCard
                        }
                        onClick={() =>
                          openPreview(file)
                        }
                      >

                        <div
                          className={
                            styles.mediaThumbnail
                          }
                        >

                          {type === "image" ? (

                            <img
                              src={file.file}
                              alt={
                                file.original_filename ||
                                "Complaint attachment"
                              }
                            />

                          ) : (

                            <video
                              src={file.file}
                              muted
                              preload="metadata"
                            />

                          )}

                          <div
                            className={
                              styles.mediaOverlay
                            }
                          >

                            {type === "image" ? (
                              <FaImage />
                            ) : (
                              <FaPlay />
                            )}

                          </div>

                        </div>


                        <div
                          className={
                            styles.mediaInfo
                          }
                        >

                          <strong>
                            {file.original_filename ||
                              "Attachment"}
                          </strong>

                          <span>
                            {type === "image"
                              ? "Image • Click to view"
                              : "Video • Click to play"}
                          </span>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            ) : (

              <p className={styles.muted}>
                No image or video attachments.
              </p>

            )}


            {/* AUDIO */}

            {audioAttachments.length > 0 && (

              <div
                className={
                  styles.otherFiles
                }
              >

                <h3>
                  <FaVolumeUp /> Audio attachments
                </h3>

                <div
                  className={
                    styles.attachments
                  }
                >

                  {audioAttachments.map(
                    (file) => (

                      <div
                        key={file.id || file.file}
                        className={
                          styles.attachment
                        }
                      >

                        <FaVolumeUp />

                        <div>

                          <strong>
                            {file.original_filename ||
                              "Audio attachment"}
                          </strong>

                          <span>
                            {file.mime_type ||
                              "Audio"}
                          </span>

                          <audio
                            controls
                            preload="metadata"
                            src={file.file}
                          />

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {/* OTHER FILES */}

            {otherAttachments.length > 0 && (

              <div
                className={
                  styles.otherFiles
                }
              >

                <h3>
                  <FaPaperclip /> Other attachments
                </h3>

                <div
                  className={
                    styles.attachments
                  }
                >

                  {otherAttachments.map(
                    (file) => (

                      <a
                        key={
                          file.id ||
                          file.file
                        }
                        href={file.file}
                        target="_blank"
                        rel="noreferrer"
                        className={
                          styles.attachment
                        }
                      >

                        <FaFileAlt />

                        <div>

                          <strong>
                            {file.original_filename ||
                              "Attachment"}
                          </strong>

                          <span>
                            {file.mime_type ||
                              file.file_type ||
                              "File"}
                          </span>

                        </div>

                      </a>

                    )
                  )}

                </div>

              </div>

            )}

          </section>

          </section>





          </div>

          {/* =================================================
              BRANCH EMPLOYEE RESPONSE
          ================================================= */}

          {responseFormOpen && (
          <section
            id="respond-to-citizen"
            className={`${styles.cardPanel} ${styles.fullWidth} ${styles.responseSection}`}
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2>
                  <FaReply /> Respond to citizen
                </h2>
                <p>
                  Send a response and update the complaint status.
                </p>
              </div>

              <ComplaintStatusBadge
                status={complaint.status}
                label={
                  complaint.status_display ||
                  complaint.status
                }
              />

              <button
                type="button"
                className={styles.closeResponseButton}
                onClick={() => setResponseFormOpen(false)}
                disabled={sendingResponse}
                aria-label="Close response form"
              >
                <FaTimes />
              </button>
            </div>

            <form
              className={styles.responseForm}
              onSubmit={submitResponse}
            >
              <div className={styles.responseTopGrid}>
                <div className={styles.responseField}>
                  <label htmlFor="complaint-status">
                    Complaint status
                  </label>

                  <select
                    id="complaint-status"
                    className={styles.statusSelect}
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    disabled={sendingResponse}
                  >
                    <option value="">
                      Select status
                    </option>

                    {STATUS_OPTIONS.map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className={styles.responseStatusInfo}>
                  <span>Current status</span>
                  <ComplaintStatusBadge
                    status={complaint.status}
                    label={
                      complaint.status_display ||
                      complaint.status
                    }
                  />
                </div>
              </div>

              <div className={styles.responseField}>
                <label htmlFor="branch-employee-response">
                  Response
                </label>

                <textarea
                  id="branch-employee-response"
                  value={responseText}
                  onChange={(event) =>
                    setResponseText(event.target.value)
                  }
                  placeholder="Write your response to the citizen..."
                  rows={5}
                  disabled={sendingResponse}
                />
              </div>

              <div className={styles.responseAttachmentField}>
                <label htmlFor="branch-employee-response-file">
                  Attachment
                </label>

                <div className={styles.fileUploadBox}>
                  <FaPaperclip />

                  <div>
                    <strong>
                      {responseFile
                        ? responseFile.name
                        : "Attach supporting document"}
                    </strong>
                    <span>
                      {responseFile
                        ? "File selected"
                        : "Optional • PDF, DOC, images and other supported files"}
                    </span>
                  </div>

                  <label
                    htmlFor="branch-employee-response-file"
                    className={styles.chooseFileButton}
                  >
                    {responseFile ? "Change file" : "Choose file"}
                  </label>

                  <input
                    id="branch-employee-response-file"
                    type="file"
                    className={styles.hiddenFileInput}
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] || null;
                      setResponseFile(file);
                    }}
                    disabled={sendingResponse}
                  />
                </div>

                {responseFile && (
                  <button
                    type="button"
                    className={styles.removeSelectedFile}
                    onClick={() => {
                      setResponseFile(null);
                      const input = document.getElementById(
                        "branch-employee-response-file"
                      );
                      if (input) input.value = "";
                    }}
                    disabled={sendingResponse}
                  >
                    <FaTrash />
                    Remove attachment
                  </button>
                )}
              </div>

              {responseError && (
                <div className={styles.error}>
                  {responseError}
                </div>
              )}

              {responseSuccess && (
                <div className={styles.successMessage}>
                  {responseSuccess}
                </div>
              )}

              <div className={styles.responseFormFooter}>
                <small>
                  The response and selected status will be recorded against this complaint.
                </small>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    sendingResponse ||
                    !responseText.trim() ||
                    !status
                  }
                >
                  <FaPaperPlane />
                  {sendingResponse
                    ? "Sending..."
                    : "Send response"}
                </button>
              </div>
            </form>
          </section>
          )}


          {/* =================================================
              RESPONSE HISTORY
          ================================================= */}

          <section
            className={`${styles.cardPanel} ${styles.fullWidth}`}
          >
            <button
              type="button"
              className={styles.historyToggle}
              onClick={() =>
                setHistoryOpen((previous) => !previous)
              }
              aria-expanded={historyOpen}
            >
              <div className={styles.historyToggleLeft}>
                <span className={styles.historyIcon}>
                  <FaReply />
                </span>
                <div>
                  <h2>Response history</h2>
                  <p>
                    {responses.length === 0
                      ? "No responses yet"
                      : `${responses.length} response${
                          responses.length === 1 ? "" : "s"
                        } recorded`}
                  </p>
                </div>
              </div>

              <div className={styles.historyToggleRight}>
                <span className={styles.attachmentCount}>
                  {responses.length}
                </span>
                <span
                  className={`${styles.historyChevron} ${
                    historyOpen
                      ? styles.historyChevronOpen
                      : ""
                  }`}
                >
                  ▾
                </span>
              </div>
            </button>

            {historyOpen && (
              <div className={styles.historyContent}>
                {responsesLoading ? (
              <div className={styles.state}>
                Loading responses...
              </div>
            ) : responseError &&
              responses.length === 0 ? (
              <div className={styles.error}>
                {responseError}
              </div>
            ) : responses.length === 0 ? (
              <p className={styles.muted}>
                No responses have been added yet.
              </p>
            ) : (

              <div
                className={
                  styles.responseHistory
                }
              >

                {responses.map(
                  (response, index) => {

                    const responseAttachments =
                      Array.isArray(
                        response.attachments
                      )
                        ? response.attachments
                        : [];

                    const responseAuthor =
                      response.responder_name ||
                      response.branch_employee_name ||
                      response.representative_name ||
                      response.created_by_name ||
                      response.user_name ||
                      response.author_name ||
                      "Response";

                    const responseTextValue =
                      response.response_text ||
                      response.response ||
                      response.text ||
                      response.message ||
                      "";

                    const responseDate =
                      response.created_at ||
                      response.created ||
                      response.responded_at;

                    return (
                      <article
                        key={
                          response.id ||
                          `response-${index}`
                        }
                        className={
                          styles.responseItem
                        }
                      >

                        <div
                          className={
                            styles.responseItemHeader
                          }
                        >

                          <div
                            className={
                              styles.responseAuthor
                            }
                          >

                            <span
                              className={
                                styles.responseAvatar
                              }
                            >
                              <FaUser />
                            </span>

                            <div>

                              <strong>
                                {responseAuthor}
                              </strong>

                              <small>
                                {formatDate(
                                  responseDate
                                )}
                              </small>

                            </div>

                          </div>

                        </div>


                        <div
                          className={
                            styles.responseText
                          }
                        >
                          {responseTextValue ||
                            "No response text."}
                        </div>


                        {/* RESPONSE ATTACHMENTS */}

                        {responseAttachments.length >
                          0 && (

                          <div
                            className={
                              styles.responseAttachments
                            }
                          >

                            {responseAttachments.map(
                              (file) => {

                                const type =
                                  getFileType(file);

                                return (
                                  <div
                                    key={
                                      file.id ||
                                      file.file
                                    }
                                    className={
                                      styles.responseAttachment
                                    }
                                  >

                                    {/* IMAGE / VIDEO */}

                                    {type === "image" ||
                                    type === "video" ? (

                                      <button
                                        type="button"
                                        className={
                                          styles.mediaCard
                                        }
                                        onClick={() =>
                                          openPreview(
                                            file
                                          )
                                        }
                                      >

                                        <div
                                          className={
                                            styles.mediaThumbnail
                                          }
                                        >

                                          {type ===
                                          "image" ? (

                                            <img
                                              src={
                                                file.file
                                              }
                                              alt={
                                                file.original_filename ||
                                                "Response attachment"
                                              }
                                            />

                                          ) : (

                                            <video
                                              src={
                                                file.file
                                              }
                                              muted
                                              preload="metadata"
                                            />

                                          )}

                                          <div
                                            className={
                                              styles.mediaOverlay
                                            }
                                          >

                                            {type ===
                                            "image" ? (
                                              <FaImage />
                                            ) : (
                                              <FaPlay />
                                            )}

                                          </div>

                                        </div>

                                      </button>

                                    ) : type === "audio" ? (

                                      /* AUDIO */

                                      <div
                                        className={
                                          styles.attachment
                                        }
                                      >

                                        <FaVolumeUp />

                                        <div>

                                          <strong>
                                            {file.original_filename ||
                                              "Audio attachment"}
                                          </strong>

                                          <audio
                                            controls
                                            preload="metadata"
                                            src={
                                              file.file
                                            }
                                          />

                                        </div>

                                      </div>

                                    ) : (

                                      /* OTHER FILE */

                                      <a
                                        href={
                                          file.file
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className={
                                          styles.attachment
                                        }
                                      >

                                        <FaFileAlt />

                                        <div>

                                          <strong>
                                            {file.original_filename ||
                                              "Attachment"}
                                          </strong>

                                          <span>
                                            {file.mime_type ||
                                              file.file_type ||
                                              "File"}
                                          </span>

                                        </div>

                                      </a>

                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                        )}

                      </article>
                    );
                  }
                )}

              </div>
            )}


              </div>
            )}
          </section>


        </div>
      </div>

      {/* =====================================================
          MEDIA PREVIEW MODAL
      ===================================================== */}

      {previewFile && (

        <div
          className={
            styles.modalBackdrop
          }
          onClick={closePreview}
        >

          <div
            className={
              styles.mediaModal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className={
                styles.modalHeader
              }
            >

              <div>

                <strong>
                  {previewFile.original_filename ||
                    "Attachment"}
                </strong>

                <span>
                  {getFileType(previewFile) ===
                  "image"
                    ? "Image"
                    : "Video"}
                </span>

              </div>


              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={closePreview}
                aria-label="Close preview"
              >
                <FaTimes />
              </button>

            </div>
            <div
              className={
                styles.modalContent
              }
            >

              {getFileType(previewFile) ===
              "image" ? (

                <img
                  src={previewFile.file}
                  alt={
                    previewFile.original_filename ||
                    "Complaint attachment"
                  }
                  className={
                    styles.previewImage
                  }
                />

              ) : (

                <video
                  src={previewFile.file}
                  controls
                  autoPlay
                  className={
                    styles.previewVideo
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </BranchEmployeeLayout>
  );
}
