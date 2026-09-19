import React, { useEffect, useMemo, useState } from 'react'
import { FaArrowLeft,FaCheckCircle,FaClock,FaHourglassHalf,FaUserTie,
  FaBuilding,FaMapMarkerAlt,FaCalendarAlt,FaFileAlt,FaImage,FaVideo,FaVolumeUp,FaPaperclip,
  FaExclamationTriangle,FaTimes,FaExternalLinkAlt,FaIdCard } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import UserLayout from '../components/UserLayout'
import Styles from '../components/module.css/UserComplaintDetail.module.css'
import { getComplaintDetail,getMediaUrl } from '../../api/services/User/Complaint.js'


const UserComplaintDetail = () => {

  const { id } = useParams()
  const navigate = useNavigate()

  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Attachment lightbox
  const [preview, setPreview] = useState(null)


  // ==========================================================
  // LOAD COMPLAINT
  // ==========================================================

  useEffect(() => {
    loadComplaint()
  }, [id])


  const loadComplaint = async () => {

    try {

      setLoading(true)
      setError('')

      const data = await getComplaintDetail(id)

      setComplaint(data)

    } catch (err) {

      console.error(
        'Failed to load complaint:',
        err
      )

      setError(
        err?.response?.data?.detail ||
        'Unable to load complaint.'
      )

    } finally {

      setLoading(false)

    }
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  const status = complaint?.status

  const statusLabel =
    complaint?.status_display ||
    status
      ?.replace(/_/g, ' ')
      ?.replace(
        /\b\w/g,
        char => char.toUpperCase()
      ) ||
    'Unknown'


  // ==========================================================
  // ATTACHMENTS
  // ==========================================================

  const attachments = Array.isArray(
    complaint?.attachments
  )
    ? complaint.attachments
    : []


  const images = attachments.filter(
    item => item.file_type === 'image'
  )


  const videos = attachments.filter(
    item => item.file_type === 'video'
  )


  const documents = attachments.filter(
    item =>
      item.file_type === 'document' ||
      item.file_type === 'other'
  )

  // IMPORTANT:
  // Audio attachments are intentionally NOT rendered.
  // Voice complaint is shown separately near description.


  // ==========================================================
  // FORMATTERS
  // ==========================================================

  const formatDateTime = value => {

    if (!value) {
      return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }


  const formatDate = value => {

    if (!value) {
      return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }


  const formatFileSize = bytes => {

    if (!bytes) {
      return '0 KB'
    }

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`
  }


  // ==========================================================
  // REPRESENTATIVE DESIGNATION
  // ==========================================================

  const getRepresentativeDesignation = type => {

    if (!type) {
      return 'Representative'
    }

    const normalized = type
      .toString()
      .toLowerCase()


    if (
      normalized.includes('legislative') ||
      normalized.includes('assembly') ||
      normalized === 'niyama sabha'
    ) {
      return 'MLA'
    }


    if (
      normalized.includes('lok sabha') ||
      normalized.includes('parliament')
    ) {
      return 'MP'
    }


    if (
      normalized.includes('grama') ||
      normalized.includes('gram')
    ) {
      return 'Member'
    }


    if (
      normalized.includes('block')
    ) {
      return 'Member'
    }


    if (
      normalized.includes('district panchayat')
    ) {
      return 'Member'
    }


    if (
      normalized.includes('municipality') ||
      normalized.includes('corporation')
    ) {
      return 'Councilor'
    }


    return 'Representative'
  }


  // ==========================================================
  // REPRESENTATIVE INFORMATION
  // ==========================================================

  const representativeInfo = useMemo(() => {

    if (!complaint?.representative_name) {
      return null
    }

    const constituencyType =
      complaint.representative_constituency_type ||
      complaint.constituency_type

    const constituency =
      complaint.representative_constituency ||
      complaint.constituency_name

    const designation =
      getRepresentativeDesignation(
        constituencyType
      )

    return {
      name: complaint.representative_name,
      designation,
      constituency,
      constituencyType,
      startDate:
        complaint.representative_start_date ||
        complaint.start_date,
      endDate:
        complaint.representative_end_date ||
        complaint.end_date,
    }

  }, [complaint])


  // ==========================================================
  // AMAZON-STYLE TRACKING
  // ==========================================================

  const trackingSteps = useMemo(() => {

    const steps = [
      {
        key: 'submitted',
        title: 'Submitted',
        description:
          'Complaint submitted successfully.',
        date: complaint?.created_at,
      },

      {
        key: 'assigned',
        title: 'Assigned',
        description:
          complaint?.assigned_employee_name
            ? `Assigned to ${complaint.assigned_employee_name}.`
            : complaint?.branch_name
              ? complaint.branch_name
              : complaint?.representative_name
                ? complaint.representative_name
                : 'Waiting for assignment.',
        date:
          complaint?.assigned_employee_name ||
          complaint?.branch_name ||
          complaint?.representative_name
            ? complaint?.updated_at
            : null,
      },

      {
        key: 'in_progress',
        title: 'In Progress',
        description:
          'Authority is working on your complaint.',
        date:
          complaint?.status === 'in_progress'
            ? complaint.updated_at
            : null,
      },

      {
        key: 'resolved',
        title: 'Resolved',
        description:
          'Complaint has been resolved.',
        date: complaint?.resolved_at,
      },

      {
        key: 'closed',
        title: 'Closed',
        description:
          'Complaint has been closed.',
        date:
          complaint?.status === 'closed'
            ? complaint.updated_at
            : null,
      },
    ]


    let currentIndex = 0

    if (status === 'in_progress') {
      currentIndex = 2
    } else if (status === 'resolved') {
      currentIndex = 3
    } else if (status === 'closed') {
      currentIndex = 4
    }


    return steps.map(
      (step, index) => ({
        ...step,
        completed:
          index <= currentIndex,
        active:
          index === currentIndex,
      })
    )

  }, [
    complaint,
    status,
  ])


  // ==========================================================
  // AUTHORITY RESPONSES
  // ==========================================================

  /*
   * Future-friendly:
   *
   * If backend starts returning:
   *
   * responses: [
   *   {
   *      id,
   *      authority_name,
   *      authority_type,
   *      response,
   *      created_at
   *   }
   * ]
   *
   * they will automatically be rendered.
   *
   * Current API only exposes action_taken and
   * resolution_notes on ComplaintDetailSerializer.
   */

  const responses = useMemo(() => {

    if (!complaint) {
      return []
    }


    if (
      Array.isArray(
        complaint.responses
      ) &&
      complaint.responses.length > 0
    ) {

      return complaint.responses.map(
        item => ({
          id: item.id,
          authorityName:
            item.authority_name ||
            item.responder_name ||
            item.representative_name ||
            item.branch_employee_name ||
            item.authority ||
            item.uploaded_by_name ||
            'Authority',
          authorityType:
            item.authority_type ||
            (item.responder_type === 'branch_employee'
              ? 'Branch Employee'
              : item.responder_type === 'representative'
                ? 'Representative'
                : item.responder_type || ''),
          text:
            item.response ||
            item.message ||
            item.action_taken ||
            '',
          date:
            item.created_at ||
            item.updated_at,
          attachments:
            Array.isArray(item.attachments)
              ? item.attachments
              : [],
        })
      )

    }


    const fallback = []


    const authorityName =
      complaint.assigned_employee_name ||
      complaint.representative_name ||
      complaint.branch_name ||
      'Authority'


    const authorityType =
      complaint.assigned_employee_name
        ? 'Branch Employee'
        : complaint.representative_name
          ? getRepresentativeDesignation(
              complaint.representative_constituency_type ||
              complaint.constituency_type
            )
          : 'Branch'


    if (complaint.action_taken) {

      fallback.push({
        id: 'action',
        authorityName,
        authorityType,
        text: complaint.action_taken,
        date: complaint.updated_at,
        attachments: [],
      })

    }


    if (complaint.resolution_notes) {

      fallback.push({
        id: 'resolution',
        authorityName,
        authorityType,
        text: complaint.resolution_notes,
        date:
          complaint.resolved_at ||
          complaint.updated_at,
        attachments: [],
      })

    }


    return fallback

  }, [complaint])


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <UserLayout>

        <div className={Styles.page}>

          <div className={Styles.loading}>
            Loading complaint...
          </div>

        </div>

      </UserLayout>
    )
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !complaint) {

    return (
      <UserLayout>

        <div className={Styles.page}>

          <button
            className={Styles.backButton}
            onClick={() =>
              navigate(
                '/user/complaint-history'
              )
            }
          >
            <FaArrowLeft />
            Back
          </button>


          <div className={Styles.errorCard}>

            <FaExclamationTriangle />

            <h2>
              Complaint unavailable
            </h2>

            <p>
              {error ||
                'Complaint not found.'}
            </p>

          </div>

        </div>

      </UserLayout>
    )
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <UserLayout>

      <div className={Styles.page}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className={Styles.topBar}>

          <button
            className={Styles.backButton}
            onClick={() =>
              navigate(
                '/user/complaint-history'
              )
            }
          >
            <FaArrowLeft />
            Back
          </button>


          <div className={Styles.headerInfo}>

            <span
              className={
                Styles.complaintNumber
              }
            >
              Complaint #{complaint.id}
            </span>

            <h1>
              {complaint.title}
            </h1>

          </div>


          <span
            className={`
              ${Styles.statusBadge}
              ${Styles[`status_${status}`] || ''}
            `}
          >
            {statusLabel}
          </span>

        </div>


        {/* ==================================================
            AMAZON STYLE TRACKING
        ================================================== */}

        <section className={Styles.card}>

          <div className={Styles.sectionHeader}>

            <div>

              <h2>
                Complaint Tracking
              </h2>

              <p>
                Follow the progress of your complaint
              </p>

            </div>

            <FaClock />

          </div>


          <div className={Styles.horizontalTracking}>

            {trackingSteps.map(
              (step, index) => (

                <React.Fragment
                  key={step.key}
                >

                  <div
                    className={`
                      ${Styles.trackStep}
                      ${step.completed
                        ? Styles.trackCompleted
                        : ''}
                      ${step.active
                        ? Styles.trackActive
                        : ''}
                    `}
                  >

                    <div
                      className={
                        Styles.trackCircle
                      }
                    >

                      {step.completed
                        ? <FaCheckCircle />
                        : <FaHourglassHalf />
                      }

                    </div>


                    <div
                      className={
                        Styles.trackText
                      }
                    >

                      <strong>
                        {step.title}
                      </strong>

                      <span>
                        {step.description}
                      </span>

                      {step.date && (
                        <small>
                          {formatDateTime(
                            step.date
                          )}
                        </small>
                      )}

                    </div>

                  </div>


                  {index <
                    trackingSteps.length - 1 && (
                    <div
                      className={`
                        ${Styles.trackLine}
                        ${index <
                          trackingSteps.findIndex(
                            item => item.active
                          )
                          ? Styles.trackLineCompleted
                          : ''}
                      `}
                    />
                  )}

                </React.Fragment>

              )
            )}

          </div>

        </section>


        {/* ==================================================
            DESCRIPTION + VOICE
        ================================================== */}

        <section className={Styles.card}>

          <div className={Styles.sectionHeader}>

            <div>

              <h2>
                Complaint Details
              </h2>

              <p>
                Your complaint description and voice recording
              </p>

            </div>

          </div>


          <div className={Styles.detailsGrid}>

            <div>

              <span>
                Category
              </span>

              <strong>
                {complaint.category_name || '-'}
              </strong>

            </div>


            <div>

              <span>
                Priority
              </span>

              <strong>
                {complaint.priority_display || '-'}
              </strong>

            </div>


            <div>

              <span>
                Created
              </span>

              <strong>
                <FaCalendarAlt />
                {formatDateTime(
                  complaint.created_at
                )}
              </strong>

            </div>


            <div>

              <span>
                Location
              </span>

              <strong>
                <FaMapMarkerAlt />
                {complaint.location ||
                  'Not provided'}
              </strong>

            </div>

          </div>


          {/* DESCRIPTION */}

          <div className={Styles.descriptionBlock}>

            <h3>
              Description
            </h3>

            <p>
              {complaint.description ||
                'No description provided.'}
            </p>

          </div>


          {/* VOICE COMPLAINT */}

          {complaint.audio_file && (

            <div
              className={
                Styles.voiceComplaint
              }
            >

              <div
                className={
                  Styles.voiceHeader
                }
              >

                <div
                  className={
                    Styles.voiceIcon
                  }
                >
                  <FaVolumeUp />
                </div>

                <div>
                  <h3>Voice Complaint</h3>
                  {/* <p>
                    Original voice recording
                  </p> */}
                </div>
              </div>

              <audio className={Styles.audioPlayer} controls
                src={getMediaUrl(complaint.audio_file)} />


              <div className={Styles.voiceMeta}>

                {/* <span>
                  Language:{' '}
                  {complaint.voice_language === 'ml'
                    ? 'Malayalam'
                    : 'English'}
                </span> */}
                {complaint.voice_processing_status && (
                  <span>Processing:{' '} {complaint.voice_processing_status}</span>
                )}
              </div>

            </div>

          )}

        </section>


        {/* ==================================================
            RESPONSIBLE AUTHORITY
        ================================================== */}

        <section className={Styles.card}>

          <div className={Styles.sectionHeader}>

            <div>

              <h2>
                Responsible Authority
              </h2>

              <p>
                Authority responsible for handling this complaint
              </p>

            </div>

          </div>


          {complaint.branch_name && (

            <div className={Styles.authorityCard}>

              <div className={Styles.authorityIcon}>
                <FaBuilding />
              </div>

              <div className={Styles.authorityMain}>

                <span>
                  Branch
                </span>

                <strong>
                  {complaint.branch_name}
                </strong>

              </div>

            </div>

          )}


          {representativeInfo && (

            <div
              className={
                Styles.representativeCard
              }
            >

              <div
                className={
                  Styles.representativeIcon
                }
              >
                <FaUserTie />
              </div>


              <div
                className={
                  Styles.representativeMain
                }
              >

                <div
                  className={
                    Styles.representativeName
                  }
                >

                  <span>
                    {representativeInfo.designation}
                  </span>

                  <strong>
                    {representativeInfo.name}
                  </strong>

                </div>


                {representativeInfo.constituency && (

                  <div
                    className={
                      Styles.representativeMeta
                    }
                  >

                    <div>
                      <FaMapMarkerAlt />

                      <span>
                        Constituency
                      </span>

                      <strong>
                        {representativeInfo.constituency}
                      </strong>
                    </div>


                    {representativeInfo.constituencyType && (

                      <div>
                        <FaIdCard />

                        <span>
                          Government Type
                        </span>

                        <strong>
                          {representativeInfo.constituencyType}
                        </strong>
                      </div>

                    )}


                    {(representativeInfo.startDate ||
                      representativeInfo.endDate) && (

                      <div>

                        <FaCalendarAlt />

                        <span>
                          Term
                        </span>

                        <strong>

                          {formatDate(
                            representativeInfo.startDate
                          )}

                          {' — '}

                          {representativeInfo.endDate
                            ? formatDate(
                                representativeInfo.endDate
                              )
                            : 'Present'}

                        </strong>

                      </div>

                    )}

                  </div>

                )}

              </div>

            </div>

          )}


          {complaint.assigned_employee_name && (

            <div
              className={
                Styles.employeeBox
              }
            >

              <span>
                Assigned Branch Employee
              </span>

              <strong>
                {complaint.assigned_employee_name}
              </strong>

            </div>

          )}


          {!complaint.branch_name &&
            !representativeInfo && (
              <div
                className={
                  Styles.noAuthority
                }
              >
                No authority assigned.
              </div>
            )}

        </section>


        {/* ==================================================
            AUTHORITY RESPONSES
        ================================================== */}

        {responses.length > 0 && (

          <section className={Styles.card}>

            <div className={Styles.sectionHeader}>

              <div>
                <h2>Authority Responses</h2>
                <p>Responses and actions recorded for this complaint</p>
              </div>
              <FaCheckCircle />
            </div>


            <div
              className={
                Styles.responseTimeline
              }
            >

              {responses.map((response, index) => (

                  <div key={response.id} className={Styles.responseItem}>
                    <div className={Styles.responseMarker}>
                      <FaCheckCircle />
                    </div>

                    <div className={Styles.responseContent}>
                      <div className={Styles.responseTop}>
                        <div>
                          <strong>{response.authorityName}</strong>
                          {response.authorityType && (

                            <span>{response.authorityType}</span>

                          )}
                        </div>
                        <small>{formatDateTime(response.date)}</small>
                      </div>


                      <div className={Styles.responseMessage}>
                        {response.text}
                      </div>


                      {/* RESPONSE ATTACHMENTS */}

                      {response.attachments?.length > 0 && (

                        <div
                          className={
                            Styles.attachmentGrid
                          }
                        >

                          {response.attachments.map(
                            attachment => {

                              const url = getMediaUrl(
                                attachment.file
                              )

                              const isImage =
                                attachment.file_type === 'image' ||
                                attachment.mime_type?.startsWith(
                                  'image/'
                                )

                              if (isImage) {

                                return (

                                  <button
                                    type="button"
                                    key={attachment.id}
                                    className={
                                      Styles.attachmentCard
                                    }
                                    onClick={() =>
                                      setPreview({
                                        type: 'image',
                                        url,
                                        name:
                                          attachment.original_filename ||
                                          'Response attachment',
                                      })
                                    }
                                  >

                                    <div
                                      className={
                                        Styles.attachmentPreview
                                      }
                                    >

                                      <img
                                        src={url}
                                        alt={
                                          attachment.original_filename ||
                                          'Response attachment'
                                        }
                                      />

                                      <div
                                        className={
                                          Styles.previewOverlay
                                        }
                                      >
                                        Click to expand
                                      </div>

                                    </div>


                                    <div
                                      className={
                                        Styles.attachmentInfo
                                      }
                                    >

                                      <FaImage />

                                      <div>

                                        <strong>
                                          {attachment.original_filename ||
                                            'Image'}
                                        </strong>

                                        <small>
                                          {formatFileSize(
                                            attachment.file_size
                                          )}
                                        </small>

                                      </div>

                                    </div>

                                  </button>
                                )
                              }


                              return (

                                <a
                                  key={attachment.id}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={
                                    Styles.documentAttachment
                                  }
                                >

                                  <FaFileAlt />

                                  <div>

                                    <strong>
                                      {attachment.original_filename ||
                                        'Attachment'}
                                    </strong>

                                    <small>
                                      {formatFileSize(
                                        attachment.file_size
                                      )}
                                    </small>

                                  </div>

                                  <FaExternalLinkAlt
                                    className={
                                      Styles.externalIcon
                                    }
                                  />

                                </a>
                              )
                            }
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* ==================================================
            ATTACHMENTS
        ================================================== */}

        <section className={Styles.card}>

          <div className={Styles.sectionHeader}>

            <div>

              <h2>
                Attachments
              </h2>

              <p>
                Photos, videos and documents attached to this complaint
              </p>

            </div>

            <FaPaperclip />

          </div>


          {attachments.length === 0 ? (

            <div
              className={
                Styles.noAttachments
              }
            >

              <FaPaperclip />

              <p>
                No attachments uploaded.
              </p>

            </div>

          ) : (

            <div
              className={
                Styles.attachmentGrid
              }
            >

              {/* =========================
                  IMAGES
              ========================= */}

              {images.map(
                attachment => {

                  const url =
                    getMediaUrl(
                      attachment.file
                    )

                  return (

                    <button
                      type="button"
                      key={attachment.id}
                      className={
                        Styles.attachmentCard
                      }
                      onClick={() =>
                        setPreview({
                          type: 'image',
                          url,
                          name:
                            attachment.original_filename ||
                            'Image',
                        })
                      }
                    >

                      <div
                        className={
                          Styles.attachmentPreview
                        }
                      >

                        <img
                          src={url}
                          alt={
                            attachment.original_filename ||
                            'Complaint attachment'
                          }
                        />

                        <div
                          className={
                            Styles.previewOverlay
                          }
                        >
                          Click to expand
                        </div>

                      </div>


                      <div
                        className={
                          Styles.attachmentInfo
                        }
                      >

                        <FaImage />

                        <div>

                          <strong>
                            {attachment.original_filename ||
                              'Image'}
                          </strong>

                          <small>
                            {formatFileSize(
                              attachment.file_size
                            )}
                          </small>

                        </div>

                      </div>

                    </button>

                  )
                }
              )}


              {/* =========================
                  VIDEOS
              ========================= */}

              {videos.map(
                attachment => {

                  const url =
                    getMediaUrl(
                      attachment.file
                    )

                  return (

                    <button
                      type="button"
                      key={attachment.id}
                      className={
                        Styles.attachmentCard
                      }
                      onClick={() =>
                        setPreview({
                          type: 'video',
                          url,
                          name:
                            attachment.original_filename ||
                            'Video',
                        })
                      }
                    >

                      <div
                        className={
                          Styles.attachmentPreview
                        }
                      >

                        <video
                          src={url}
                          muted
                          preload="metadata"
                        />

                        <div
                          className={
                            Styles.previewOverlay
                          }
                        >
                          Click to expand
                        </div>

                      </div>


                      <div
                        className={
                          Styles.attachmentInfo
                        }
                      >

                        <FaVideo />

                        <div>

                          <strong>
                            {attachment.original_filename ||
                              'Video'}
                          </strong>

                          <small>
                            {formatFileSize(
                              attachment.file_size
                            )}
                          </small>

                        </div>

                      </div>

                    </button>

                  )
                }
              )}


              {/* =========================
                  DOCUMENTS
              ========================= */}

              {documents.map(
                attachment => {

                  const url =
                    getMediaUrl(
                      attachment.file
                    )

                  return (

                    <a
                      key={attachment.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        Styles.documentAttachment
                      }
                    >

                      <FaFileAlt />

                      <div>

                        <strong>
                          {attachment.original_filename ||
                            'Document'}
                        </strong>

                        <small>
                          {formatFileSize(
                            attachment.file_size
                          )}
                        </small>

                      </div>


                      <FaExternalLinkAlt
                        className={
                          Styles.externalIcon
                        }
                      />

                    </a>

                  )
                }
              )}

            </div>

          )}

        </section>


        {/* ==================================================
            ESCALATIONS
        ================================================== */}

        {complaint.escalations?.length > 0 && (

          <section className={Styles.card}>

            <div className={Styles.sectionHeader}>

              <h2>
                Escalation History
              </h2>

              <FaExclamationTriangle />

            </div>


            <div
              className={
                Styles.escalationList
              }
            >

              {complaint.escalations.map(
                item => (

                  <div
                    key={item.id}
                    className={
                      Styles.escalationItem
                    }
                  >

                    <strong>
                      {item.reason_display ||
                        item.reason}
                    </strong>

                    <p>
                      {item.notes}
                    </p>

                    <small>
                      {formatDateTime(
                        item.created_at
                      )}
                    </small>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* ==================================================
            IMAGE / VIDEO EXPAND MODAL
        ================================================== */}

        {preview && (

          <div
            className={
              Styles.previewModal
            }
            onClick={() =>
              setPreview(null)
            }
          >

            <button
              type="button"
              className={
                Styles.previewClose
              }
              onClick={() =>
                setPreview(null)
              }
              aria-label="Close preview"
            >
              <FaTimes />
            </button>


            <div
              className={
                Styles.previewModalContent
              }
              onClick={event =>
                event.stopPropagation()
              }
            >

              {preview.type === 'image' ? (

                <img
                  src={preview.url}
                  alt={preview.name}
                />

              ) : (

                <video
                  src={preview.url}
                  controls
                  autoPlay
                />

              )}

              <div
                className={
                  Styles.previewModalName
                }
              >
                {preview.name}
              </div>

            </div>

          </div>

        )}

      </div>

    </UserLayout>
  )
}


export default UserComplaintDetail