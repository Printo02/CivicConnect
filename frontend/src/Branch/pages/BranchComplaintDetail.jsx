import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft,FaUser,FaCalendarAlt,FaMapMarkerAlt,FaHashtag,FaBuilding,FaUserTie,
  FaImage,FaVideo,FaFileAlt,FaExternalLinkAlt,FaChevronDown,FaEdit,FaCheckCircle,FaExclamationCircle,FaVolumeUp,} from "react-icons/fa";
import BranchLayout from "../components/BranchLayout";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import Styles from "../components/module.css/BranchComplaintDetail.module.css";
import { getBranchComplaint,updateComplaintStatus } from "../../api/services/Branch/BranchComplaintApi";


const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];


const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


const getFileUrl = (file) => {
  if (!file) return "";

  if (typeof file === "string") {
    return file;
  }

  return file.file || file.url || "";
};


/*
 * Get the filename from different possible
 * attachment serializer formats.
 */
const getAttachmentName = (attachment) => {
  return (
    attachment?.original_filename ||
    attachment?.filename ||
    attachment?.file ||
    attachment?.url ||
    ""
  ).toLowerCase();
};


/*
 * Get MIME type from different possible
 * attachment serializer formats.
 */
const getAttachmentMime = (attachment) => {
  return (
    attachment?.mime_type ||
    attachment?.content_type ||
    ""
  )
    .toLowerCase()
    .trim();
};


/*
 * IMPORTANT:
 * Audio attachments must NEVER appear
 * inside the Photos & Videos section.
 */
const isAudio = (attachment) => {
  const mime = getAttachmentMime(attachment);
  const name = getAttachmentName(attachment);

  const audioExtensions =
    /\.(mp3|wav|ogg|oga|aac|m4a|flac|wma)$/i;

  return (
    mime.startsWith("audio/") ||
    audioExtensions.test(name)
  );
};


const isImage = (attachment) => {
  /*
   * Explicitly reject audio first.
   */
  if (isAudio(attachment)) {
    return false;
  }

  const mime = getAttachmentMime(attachment);
  const name = getAttachmentName(attachment);

  const imageExtensions =
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

  return (
    mime.startsWith("image/") ||
    imageExtensions.test(name)
  );
};


const isVideo = (attachment) => {
  /*
   * Explicitly reject audio first.
   */
  if (isAudio(attachment)) {
    return false;
  }

  const mime = getAttachmentMime(attachment);
  const name = getAttachmentName(attachment);

  const videoExtensions =
    /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i;

  return (
    mime.startsWith("video/") ||
    videoExtensions.test(name)
  );
};


const BranchComplaintDetail = () => {
  /*
   * Router:
   * /branch/complaints/:id
   *
   * Therefore the parameter MUST be "id".
   */
  const { id } = useParams();

  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [responsesOpen, setResponsesOpen] = useState(false);


  /*
   * Load complaint whenever route ID changes.
   */
  useEffect(() => {
    if (!id) {
      console.error("Complaint ID is missing from route.");

      setLoading(false);
      setError("Complaint ID is missing.");

      return;
    }

    loadComplaint(id);
  }, [id]);


  const loadComplaint = async (complaintId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading branch complaint:", complaintId);

      const data = await getBranchComplaint(complaintId);

      console.log("Complaint details:", data);

      setComplaint(data);
      setStatus(data?.status || "");
      setActionTaken(data?.action_taken || "");
    } catch (err) {
      console.error("Failed to load complaint:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load complaint details."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * Branch employee assignment information.
   *
   * IMPORTANT:
   * `assigned_employee` can be only the database ID.
   * For display we always prefer the employee NAME returned by
   * ComplaintDetailSerializer as `assigned_employee_name`.
   */
  const assignedEmployeeName = useMemo(() => {
    if (!complaint) return "";

    /*
     * Primary source from ComplaintDetailSerializer.
     */
    if (
      typeof complaint.assigned_employee_name === "string" &&
      complaint.assigned_employee_name.trim()
    ) {
      return complaint.assigned_employee_name.trim();
    }

    /*
     * Support nested employee objects if the API later returns one.
     */
    const employee = complaint.assigned_employee;

    if (employee && typeof employee === "object") {
      const nestedName =
        employee.employee_name ||
        employee.branch_employee_name ||
        employee.emp_name ||
        employee.fullname ||
        employee.name ||
        employee.user_details?.first_name ||
        employee.user_details?.user?.first_name ||
        "";

      if (
        typeof nestedName === "string" &&
        nestedName.trim()
      ) {
        return nestedName.trim();
      }
    }

    /*
     * Final fallback:
     * if the assigned employee has already responded, the response
     * payload contains the responder's real name.
     */
    const employeeResponse = Array.isArray(complaint.responses)
      ? complaint.responses.find((item) => {
          const type = String(
            item?.authority_type ||
            item?.responder_type ||
            ""
          )
            .toLowerCase()
            .replace(/\s+/g, "_");

          return (
            type === "branch_employee" ||
            Boolean(item?.branch_employee_name)
          );
        })
      : null;

    const responseName =
      employeeResponse?.authority_name ||
      employeeResponse?.responder_name ||
      employeeResponse?.branch_employee_name ||
      "";

    return typeof responseName === "string"
      ? responseName.trim()
      : "";
  }, [complaint]);


  const isAssigned = Boolean(
    complaint?.assigned_employee ||
    assignedEmployeeName
  );


  /*
   * Amazon-style complaint tracking.
   *
   * The Complaint model does not keep a full status-history table,
   * so exact timestamps are only shown when the current data contains
   * a trustworthy timestamp for that step.
   */
  const trackingSteps = useMemo(() => {
    if (!complaint) return [];

    const currentStatus = complaint.status || "pending";
    const rejected = currentStatus === "rejected";

    const steps = [
      {
        key: "submitted",
        title: "Submitted",
        description: "Complaint submitted by the citizen.",
        date: complaint.created_at,
        completed: true,
      },
      {
        key: "assigned",
        title: "Assigned",
        description: assignedEmployeeName
          ? `Assigned to ${assignedEmployeeName}.`
          : complaint.branch_name
            ? `Assigned to ${complaint.branch_name}.`
            : "Waiting for authority assignment.",
        date: complaint.assigned_employee
          ? complaint.updated_at
          : complaint.branch_name
            ? complaint.created_at
            : null,
        completed: Boolean(
          complaint.branch_name ||
          complaint.assigned_employee ||
          assignedEmployeeName
        ),
      },
      {
        key: "in_progress",
        title: "In Progress",
        description: assignedEmployeeName
          ? `${assignedEmployeeName} is handling the complaint.`
          : "The authority is working on the complaint.",
        date:
          currentStatus === "in_progress"
            ? complaint.updated_at
            : null,
        completed: [
          "in_progress",
          "resolved",
          "closed",
        ].includes(currentStatus),
      },
      {
        key: "resolved",
        title: "Resolved",
        description: "The complaint has been resolved.",
        date: complaint.resolved_at,
        completed: [
          "resolved",
          "closed",
        ].includes(currentStatus),
      },
      {
        key: rejected ? "rejected" : "closed",
        title: rejected ? "Rejected" : "Closed",
        description: rejected
          ? "The complaint was rejected."
          : "The complaint has been closed.",
        date:
          currentStatus === "closed" ||
          currentStatus === "rejected"
            ? complaint.updated_at
            : null,
        completed:
          currentStatus === "closed" ||
          currentStatus === "rejected",
      },
    ];

    let activeIndex = 0;

    if (currentStatus === "closed" || currentStatus === "rejected") {
      activeIndex = 4;
    } else if (currentStatus === "resolved") {
      activeIndex = 3;
    } else if (currentStatus === "in_progress") {
      activeIndex = 2;
    } else if (
      complaint.branch_name ||
      complaint.assigned_employee ||
      assignedEmployeeName
    ) {
      activeIndex = 1;
    }

    return steps.map((step, index) => ({
      ...step,
      active: index === activeIndex,
    }));
  }, [complaint, assignedEmployeeName]);


  /*
   * Complaint attachments shown to the branch.
   *
   * Voice/audio is displayed separately in the voice section,
   * therefore only audio is removed here. Images, videos, PDFs,
   * Word documents and any other files remain visible.
   */
  const visibleAttachments = useMemo(() => {
    const attachments = Array.isArray(complaint?.attachments)
      ? complaint.attachments
      : [];

    return attachments.filter(
      (attachment) => !isAudio(attachment)
    );
  }, [complaint]);


  /*
   * Responses are displayed if the backend provides them.
   */
  const responses = useMemo(() => {
    return complaint?.responses || [];
  }, [complaint]);


  /*
   * Update branch complaint.
   *
   * This action is only available while the complaint
   * has NOT been assigned to a branch employee.
   */
  const handleStatusUpdate = async (event) => {
    event.preventDefault();

    if (!id) {
      setError("Complaint ID is missing.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateComplaintStatus(id, {
        status,
        action_taken: actionTaken,
      });

      setComplaint((previous) => ({
        ...previous,
        ...updated,
      }));

      setStatus(updated?.status || status);

      setActionTaken(
        updated?.action_taken ?? actionTaken
      );

      setSuccess("Complaint updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to update complaint:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to update complaint."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
   * Loading
   */
  if (loading) {
    return (
      <BranchLayout title="Complaint Details">
        <div className={Styles.loadingState}>
          <div className={Styles.loadingSpinner} />
          <p>Loading complaint details...</p>
        </div>
      </BranchLayout>
    );
  }


  /*
   * Error without complaint data
   */
  if (error && !complaint) {
    return (
      <BranchLayout title="Complaint Details">
        <div className={Styles.errorState}>
          <FaExclamationCircle />

          <h3>Unable to load complaint</h3>

          <p>{error}</p>

          <button
            type="button"
            className={Styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>
        </div>
      </BranchLayout>
    );
  }


  return (
    <BranchLayout title="Complaint Details">

      <div className={Styles.page}>

        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className={Styles.pageHeader}>

          <button
            type="button"
            className={Styles.backButton}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>
        </div>


        {/* =========================================================
            ALERTS
        ========================================================= */}

        {success && (
          <div className={Styles.successMessage}>
            <FaCheckCircle />
            {success}
          </div>
        )}

        {error && complaint && (
          <div className={Styles.errorMessage}>
            <FaExclamationCircle />
            {error}
          </div>
        )}


        {/* =========================================================
            AMAZON-STYLE COMPLAINT TRACKING
        ========================================================= */}

        <section className={Styles.card}>
          <div className={Styles.sectionTitle}>
            <div>
              <span className={Styles.sectionEyebrow}>
                COMPLAINT PROGRESS
              </span>
              <h2>Complaint Tracking</h2>
            </div>

            <ComplaintStatusBadge
              status={complaint?.status}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              overflowX: "auto",
              padding: "18px 4px 8px",
            }}
          >
            {trackingSteps.map((step, index) => {
              const reached = step.completed || step.active;

              return (
                <React.Fragment key={step.key}>
                  <div
                    style={{
                      minWidth: "150px",
                      flex: "1 0 150px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        margin: "0 auto 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: reached
                          ? "2px solid #22c55e"
                          : "2px solid #6b7280",
                        background: step.active
                          ? "#7c3aed"
                          : step.completed
                            ? "#22c55e"
                            : "transparent",
                        color: reached
                          ? "#ffffff"
                          : "inherit",
                        boxShadow: step.active
                          ? "0 0 0 5px rgba(124, 58, 237, 0.15)"
                          : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {step.completed ? (
                        <FaCheckCircle />
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <strong
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontSize: "13px",
                      }}
                    >
                      {step.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        lineHeight: 1.4,
                        opacity: 0.72,
                        minHeight: "31px",
                      }}
                    >
                      {step.description}
                    </span>

                    {step.date && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "6px",
                          fontSize: "10px",
                          opacity: 0.58,
                        }}
                      >
                        {formatDate(step.date)}
                      </small>
                    )}
                  </div>

                  {index < trackingSteps.length - 1 && (
                    <div
                      aria-hidden="true"
                      style={{
                        height: "2px",
                        minWidth: "48px",
                        flex: "1 1 80px",
                        marginTop: "16px",
                        background:
                          trackingSteps[index + 1]?.completed ||
                          trackingSteps[index + 1]?.active
                            ? "#22c55e"
                            : "rgba(107, 114, 128, 0.45)",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>


        {/* =========================================================
            COMPLAINT OVERVIEW
        ========================================================= */}

        <section className={Styles.card}>

          <div className={Styles.cardHeader}>

            <div>

              <span className={Styles.sectionEyebrow}>
                COMPLAINT OVERVIEW
              </span>

              <h2>
                {complaint?.title || "Complaint"}
              </h2>

            </div>

            <ComplaintStatusBadge
              status={complaint?.status}
            />

          </div>


          <div className={Styles.overviewGrid}>

            {/* Citizen */}

            <div className={Styles.overviewItem}>

              <div className={Styles.iconBox}>
                <FaUser />
              </div>

              <div>

                <span>Posted by</span>

                <strong>
                  {complaint?.citizen_name || "Citizen"}
                </strong>

              </div>

            </div>


            {/* Date */}

            <div className={Styles.overviewItem}>

              <div className={Styles.iconBox}>
                <FaCalendarAlt />
              </div>

              <div>

                <span>Posted on</span>

                <strong>
                  {formatDate(
                    complaint?.created_at
                  )}
                </strong>

              </div>

            </div>


            {/* Complaint ID */}

            <div className={Styles.overviewItem}>

              <div className={Styles.iconBox}>
                <FaHashtag />
              </div>

              <div>

                <span>Complaint ID</span>

                <strong>
                  #{complaint?.id || id}
                </strong>

              </div>

            </div>


            {/* Location */}

            <div className={Styles.overviewItem}>

              <div className={Styles.iconBox}>
                <FaMapMarkerAlt />
              </div>

              <div>

                <span>Location</span>

                <strong>
                  {complaint?.location ||
                    "Location not provided"}
                </strong>

              </div>

            </div>

          </div>


          {/* =====================================================
              AUTHORITIES
          ===================================================== */}

          <div className={Styles.authoritySection}>

            <div className={Styles.authorityHeader}>

              <div>

                <span className={Styles.sectionEyebrow}>
                  AUTHORITIES
                </span>

              </div>

            </div>


            <div className={Styles.authorityGrid}>

              {/* Branch */}

              <div className={Styles.authorityCard}>

                <div className={Styles.authorityIcon}>
                  <FaBuilding />
                </div>

                <div className={Styles.authorityContent}>

                  <span className={Styles.authorityLabel}>
                    Branch
                  </span>

                  <strong>
                    {complaint?.branch_name ||
                      "Branch"}
                  </strong>

                  {/* <span className={Styles.authorityLocation}>
                    <FaMapMarkerAlt />
                    {complaint?.location || "Location unavailable"}
                  </span> */}

                </div>

              </div>


              {/* Assigned Employee */}

              <div
                className={`${Styles.authorityCard} ${
                  isAssigned
                    ? Styles.assignedCard
                    : Styles.unassignedCard
                }`}
              >

                <div className={Styles.authorityIcon}>
                  <FaUserTie />
                </div>

                <div className={Styles.authorityContent}>

                  <span className={Styles.authorityLabel}>
                    Assigned employee
                  </span>

                  {isAssigned ? (

                    <strong>
                      {assignedEmployeeName ||
                        "Employee name unavailable"}
                    </strong>

                  ) : (

                    <>
                      <strong
                        className={Styles.notAssigned}
                      >
                        Not assigned
                      </strong>

                      <span className={Styles.assignmentHint}>
                        This complaint is currently handled by the branch.
                      </span>
                    </>

                  )}

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =========================================================
            DESCRIPTION
        ========================================================= */}

        <section className={Styles.card}>

          <div className={Styles.sectionTitle}>

            <div>

              <h2>COMPLAINT DESCRIPTION</h2>

            </div>

          </div>


          <div className={Styles.descriptionBox}>

            {complaint?.description ? (

              <p>
                {complaint.description}
              </p>

            ) : (

              <span className={Styles.emptyText}>
                No description was provided.
              </span>

            )}

          </div>

        </section>


        {/* =========================================================
            VOICE COMPLAINT
            NOTE:
            This is the ONLY place where complaint audio
            is displayed.
        ========================================================= */}

        {complaint?.audio_file && (

          <section className={Styles.card}>

            <div className={Styles.sectionTitle}>

              <div>

                <h2>COMPLAINT VOICE</h2>

              </div>

            </div>


            <div className={Styles.audioPlayer}>

              <div className={Styles.audioIcon}>
                <FaVolumeUp />
              </div>

              <div className={Styles.audioContent}>

                <span>
                  Citizen voice recording
                </span>

                {complaint?.voice_processing_status && (

                  <small>
                    {complaint.voice_processing_status}
                  </small>

                )}

              </div>


              <audio
                controls
                src={complaint.audio_file}
                className={Styles.audio}
              />

            </div>

          </section>

        )}


        {/* =========================================================
            PHOTOS & VIDEOS
            AUDIO IS EXCLUDED
        ========================================================= */}

        <section className={Styles.card}>

          <div className={Styles.sectionTitle}>

            <div>

              <h2>ATTACHMENTS</h2>

            </div>

            <span className={Styles.mediaCount}>
              {visibleAttachments.length} attachment{visibleAttachments.length === 1 ? "" : "s"}
            </span>

          </div>


          {visibleAttachments.length > 0 ? (

            <div className={Styles.mediaGrid}>

              {visibleAttachments.map(
                (attachment, index) => {

                  /*
                   * Extra safety check.
                   * Even if an attachment somehow enters
                   * this array, audio will never render.
                   */
                  if (isAudio(attachment)) {
                    return null;
                  }


                  const url =
                    getFileUrl(attachment);


                  if (!url) {
                    return null;
                  }


                  const key =
                    attachment?.id ||
                    attachment?.pk ||
                    `attachment-${index}`;


                  {/* IMAGE */}

                  if (isImage(attachment)) {

                    return (

                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={
                          Styles.mediaItem
                        }
                      >

                        <img
                          src={url}
                          alt={
                            attachment
                              ?.original_filename ||
                            "Complaint attachment"
                          }
                        />

                        <div
                          className={
                            Styles.mediaOverlay
                          }
                        >

                          <FaImage />

                          <span>
                            View image
                          </span>

                        </div>

                      </a>

                    );
                  }


                  {/* VIDEO */}

                  if (isVideo(attachment)) {

                    return (

                      <div
                        key={key}
                        className={
                          Styles.mediaItem
                        }
                      >

                        <video
                          src={url}
                          controls
                          preload="metadata"
                        />

                        <div
                          className={
                            Styles.videoBadge
                          }
                        >

                          <FaVideo />

                          Video

                        </div>

                      </div>

                    );
                  }


                  /*
                   * DOCUMENT / OTHER FILE
                   *
                   * Anything that is not audio, image or video is shown
                   * as an openable document/file card.
                   */
                  const documentName =
                    attachment?.original_filename ||
                    attachment?.filename ||
                    "Attachment";

                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={Styles.mediaItem}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "140px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "18px",
                          textAlign: "center",
                        }}
                      >
                        <FaFileAlt size={30} />

                        <strong
                          style={{
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={documentName}
                        >
                          {documentName}
                        </strong>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            opacity: 0.75,
                          }}
                        >
                          <FaExternalLinkAlt />
                          Open document
                        </span>
                      </div>
                    </a>
                  );

                }

              )}

            </div>

          ) : (

            <div className={Styles.emptyMedia}>

              <div
                className={
                  Styles.emptyMediaIcon
                }
              >
                <FaImage />
              </div>

              <p>
                No attachments were added to
                this complaint.
              </p>

            </div>

          )}

        </section>


        {/* =========================================================
            RESPONSES
        ========================================================= */}

        <section className={Styles.card}>

          <button
            type="button"
            className={Styles.dropdownHeader}
            onClick={() =>
              setResponsesOpen(
                (value) => !value
              )
            }
          >

            <div className={Styles.dropdownTitle}>

              <div className={Styles.responseIcon}>
                <FaVolumeUp />
              </div>

              <div>

                <span
                  className={
                    Styles.sectionEyebrow
                  }
                >
                  COMMUNICATION
                </span>

                <h2>Responses</h2>

              </div>

            </div>


            <div className={Styles.dropdownRight}>

              <span>
                {responses.length}
              </span>

              <FaChevronDown
                className={
                  responsesOpen
                    ? Styles.chevronOpen
                    : ""
                }
              />

            </div>

          </button>


          {responsesOpen && (

            <div className={Styles.responseList}>

              {responses.length > 0 ? (responses.map((item) => (
                  <div key={item.id} className={Styles.responseItem}>
                    <div
                      className={Styles.responseMeta}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          minWidth: 0,
                        }}
                      >
                        <strong>
                          {item.authority_name ||
                            item.responder_name ||
                            item.branch_employee_name ||
                            item.representative_name ||
                            "Authority"}
                        </strong>

                        {(item.authority_type ||
                          item.responder_type) && (
                          <small
                            style={{
                              display: "block",
                              opacity: 0.72,
                              fontSize: "12px",
                              color: "#db39e4"
                            }}> 
                            {item.authority_type || (item.responder_type === "branch_employee"
                                ? "Branch Employee" : item.responder_type ==="representative"
                                  ? "Representative": item.responder_type)}
                          </small>
                        )}
                      </div>

                      <span
                        style={{
                          marginLeft: "auto",
                          whiteSpace: "nowrap",
                          opacity: 0.68,
                          fontSize: "12px",
                        }}
                      >
                        {formatDate(
                          item.created_at
                        )}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "12px 0 0",
                        lineHeight: 1.6,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.response ||
                        item.message ||
                        "No response text available."}
                    </p>

                    {Array.isArray(item.attachments) &&
                      item.attachments.length > 0 && (

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          marginTop: "12px",
                        }}
                      >
                        {item.attachments.map(
                          (attachment, attachmentIndex) => {
                            const url =
                              getFileUrl(attachment);

                            if (!url) {
                              return null;
                            }

                            const attachmentKey =
                              attachment?.id ||
                              attachment?.pk ||
                              `${item.id}-attachment-${attachmentIndex}`;

                            const attachmentName =
                              attachment?.original_filename ||
                              attachment?.filename ||
                              "Response attachment";

                            if (isImage(attachment)) {
                              return (
                                <a
                                  key={attachmentKey}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "block",
                                    width: "120px",
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt={attachmentName}
                                    style={{
                                      width: "120px",
                                      height: "90px",
                                      objectFit: "cover",
                                      borderRadius: "8px",
                                    }}
                                  />
                                </a>
                              );
                            }

                            if (isVideo(attachment)) {
                              return (
                                <video
                                  key={attachmentKey}
                                  src={url}
                                  controls
                                  preload="metadata"
                                  style={{
                                    width: "180px",
                                    borderRadius: "8px",
                                  }}
                                />
                              );
                            }

                            if (isAudio(attachment)) {
                              return null;
                            }

                            return (
                              <a
                                key={attachmentKey}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  textDecoration: "none",
                                }}
                                title={attachmentName}
                              >
                                <FaFileAlt />
                                <span>{attachmentName}</span>
                                <FaExternalLinkAlt />
                              </a>
                            );
                          }
                        )}
                      </div>

                    )}

                  </div>

                ))

              ) : (

                <div
                  className={
                    Styles.noResponses
                  }
                >

                  <p>
                    No responses have been
                    recorded.
                  </p>

                </div>

              )}

            </div>

          )}

        </section>


        {/* =========================================================
            BRANCH UPDATE
            Hidden after employee assignment
        ========================================================= */}

        {!isAssigned && (

          <section className={Styles.actionCard}>

            <div className={Styles.actionHeader}>

              <div>

                <span
                  className={
                    Styles.sectionEyebrow
                  }
                >
                  BRANCH ACTION
                </span>

                <h2>Update Complaint</h2>

                <p>
                  Update the status and record
                  the action taken by the branch.
                </p>

              </div>

              <FaEdit />

            </div>


            <form
              onSubmit={handleStatusUpdate}
              className={Styles.updateForm}
            >

              <div className={Styles.formGroup}>

                <label htmlFor="complaint-status">
                  Current status
                </label>

                <select
                  id="complaint-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                >

                  {STATUS_OPTIONS.map(
                    (option) => (

                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className={Styles.formGroup}>

                <label htmlFor="action-taken">
                  Action taken
                </label>

                <textarea
                  id="action-taken"
                  value={actionTaken}
                  onChange={(event) =>
                    setActionTaken(
                      event.target.value
                    )
                  }
                  placeholder="Describe the action taken by the branch..."
                  rows={5}
                />

              </div>


              <div className={Styles.formActions}>

                <button
                  type="button"
                  className={
                    Styles.secondaryButton
                  }
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className={
                    Styles.primaryButton
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Update Complaint"}
                </button>

              </div>

            </form>

          </section>

        )}


        {/* =========================================================
            ASSIGNED NOTICE
        ========================================================= */}

        {isAssigned && (

          <div
            className={
              Styles.assignedNotice
            }
          >

            <div
              className={
                Styles.assignedNoticeIcon
              }
            >
              <FaUserTie />
            </div>

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >

              <strong>
                Complaint assigned to employee
              </strong>

              <p
                style={{
                  margin: "6px 0 0",
                  lineHeight: 1.55,
                }}
              >
                This complaint is being handled by{" "}
                <strong>
                  {assignedEmployeeName ||
                    "the assigned employee"}
                </strong>
                . Branch status updates are disabled while it is assigned.
              </p>

            </div>

          </div>

        )}

      </div>

    </BranchLayout>
  );
};


export default BranchComplaintDetail;