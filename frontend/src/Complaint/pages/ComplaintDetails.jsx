import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft,FaMapMarkerAlt,FaUser,FaBuilding,FaClock,FaCheckCircle,
  FaPaperclip,FaComments,FaThumbsUp,} from 'react-icons/fa'
import Styles from '../components/module.css/ComplaintDetails.module.css'
import { getComplaintDetails,getComplaintResponses,getComplaintAssignmentHistory,supportComplaint,
  removeComplaintSupport,} from '../../api/services/Complaint/complaintService.js'

export const ComplaintDetails = () => {
  const { complaintId, id } = useParams()
  const navigate = useNavigate()

  const currentComplaintId = complaintId || id

  const [complaint, setComplaint] = useState(null)
  const [responses, setResponses] = useState([])
  const [assignmentHistory, setAssignmentHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [supportLoading, setSupportLoading] = useState(false)

  // --------------------------------------------------
  // LOAD COMPLAINT
  // --------------------------------------------------

  const loadComplaint = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getComplaintDetails(currentComplaintId)

      setComplaint(data)
    } catch (err) {
      console.error('Failed to load complaint:', err)

      setError(
        err?.response?.data?.detail ||
          'Failed to load complaint details.'
      )
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // LOAD RESPONSES
  // --------------------------------------------------

  const loadResponses = async () => {
    try {
      const data = await getComplaintResponses(currentComplaintId)

      setResponses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load responses:', err)
    }
  }

  // --------------------------------------------------
  // LOAD ASSIGNMENT HISTORY
  // --------------------------------------------------

  const loadAssignmentHistory = async () => {
    try {
      const data = await getComplaintAssignmentHistory(
        currentComplaintId
      )

      setAssignmentHistory(data?.assignment_history || [])
    } catch (err) {
      console.error(
        'Failed to load assignment history:',
        err
      )
    }
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    if (!currentComplaintId) {
      setError('Complaint ID is missing.')
      setLoading(false)
      return
    }

    loadComplaint()
    loadResponses()
    loadAssignmentHistory()
  }, [currentComplaintId])

  // --------------------------------------------------
  // SUPPORT
  // --------------------------------------------------

  const handleSupport = async () => {
    if (!complaint || supportLoading) return

    try {
      setSupportLoading(true)

      if (complaint.has_supported) {
        const data = await removeComplaintSupport(
          currentComplaintId
        )

        setComplaint((previous) => ({
          ...previous,
          has_supported: false,
          support_count: data.support_count,
        }))
      } else {
        const data = await supportComplaint(
          currentComplaintId
        )

        setComplaint((previous) => ({
          ...previous,
          has_supported: true,
          support_count: data.support_count,
        }))
      }
    } catch (err) {
      console.error('Support action failed:', err)

      alert(
        err?.response?.data?.detail ||
          'Unable to update support.'
      )
    } finally {
      setSupportLoading(false)
    }
  }

  // --------------------------------------------------
  // STATUS CLASS
  // --------------------------------------------------

  const getStatusClass = (status) => {
    switch (status) {
      case 'open':
        return Styles.statusOpen

      case 'in_progress':
        return Styles.statusProgress

      case 'resolved':
        return Styles.statusResolved

      case 'closed':
        return Styles.statusClosed

      default:
        return Styles.statusDefault
    }
  }

  // --------------------------------------------------
  // PRIORITY CLASS
  // --------------------------------------------------

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return Styles.priorityHigh

      case 'medium':
        return Styles.priorityMedium

      case 'low':
        return Styles.priorityLow

      default:
        return Styles.priorityDefault
    }
  }

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString()
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className={Styles.page}>
        <div className={Styles.loading}>
          Loading complaint...
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error || !complaint) {
    return (
      <div className={Styles.page}>
        <div className={Styles.errorBox}>
          <h3>Unable to load complaint</h3>

          <p>{error || 'Complaint not found.'}</p>

          <button
            className={Styles.backButton}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={Styles.page}>

      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <div className={Styles.header}>

        <button
          className={Styles.backButton}
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <h1>Complaint Details</h1>

          <p>
            Complaint #{complaint.complaint_number}
          </p>
        </div>

      </div>

      {/* --------------------------------------------------
          MAIN GRID
      -------------------------------------------------- */}

      <div className={Styles.grid}>

        {/* --------------------------------------------------
            MAIN CONTENT
        -------------------------------------------------- */}

        <div className={Styles.mainColumn}>

          {/* Complaint information */}

          <section className={Styles.card}>

            <div className={Styles.cardHeader}>

              <div>
                <span className={Styles.smallLabel}>
                  Complaint
                </span>

                <h2>{complaint.title}</h2>
              </div>

              <div className={Styles.statusContainer}>

                <span
                  className={`${Styles.status} ${
                    getStatusClass(complaint.status)
                  }`}
                >
                  {complaint.status_display ||
                    complaint.status}
                </span>

                <span
                  className={`${Styles.priority} ${
                    getPriorityClass(complaint.priority)
                  }`}
                >
                  {complaint.priority_display ||
                    complaint.priority}
                </span>

              </div>

            </div>

            {/* Description */}

            <div className={Styles.descriptionSection}>

              <h3>Description</h3>

              <p>
                {complaint.description ||
                  'No description provided.'}
              </p>

            </div>

            {/* Translation */}

            {complaint.translated_description && (
              <div className={Styles.translationBox}>

                <h3>
                  Translated Description
                </h3>

                <p>
                  {complaint.translated_description}
                </p>

              </div>
            )}

          </section>


          {/* --------------------------------------------------
              LOCATION
          -------------------------------------------------- */}

          <section className={Styles.card}>

            <div className={Styles.sectionTitle}>
              <FaMapMarkerAlt />
              <h3>Location</h3>
            </div>

            <div className={Styles.infoGrid}>

              <div className={Styles.infoItem}>
                <span>Locality</span>
                <strong>
                  {complaint.locality || '-'}
                </strong>
              </div>

              <div className={Styles.infoItem}>
                <span>Latitude</span>
                <strong>
                  {complaint.latitude || '-'}
                </strong>
              </div>

              <div className={Styles.infoItem}>
                <span>Longitude</span>
                <strong>
                  {complaint.longitude || '-'}
                </strong>
              </div>

            </div>

          </section>


          {/* --------------------------------------------------
              ATTACHMENTS
          -------------------------------------------------- */}

          <section className={Styles.card}>

            <div className={Styles.sectionTitle}>
              <FaPaperclip />
              <h3>Attachments</h3>
            </div>

            {complaint.attachments?.length > 0 ? (

              <div className={Styles.attachments}>

                {complaint.attachments.map(
                  (attachment) => (

                    <a
                      key={attachment.id}
                      href={attachment.file}
                      target="_blank"
                      rel="noreferrer"
                      className={Styles.attachment}
                    >

                      <FaPaperclip />

                      <div>
                        <strong>
                          {attachment.file_type}
                        </strong>

                        <span>
                          Uploaded by{' '}
                          {attachment.uploaded_by_name ||
                            'User'}
                        </span>
                      </div>

                    </a>

                  )
                )}

              </div>

            ) : (

              <p className={Styles.empty}>
                No attachments available.
              </p>

            )}

          </section>


          {/* --------------------------------------------------
              RESPONSES
          -------------------------------------------------- */}

          <section className={Styles.card}>

            <div className={Styles.sectionTitle}>
              <FaComments />
              <h3>Responses</h3>
            </div>

            {responses.length > 0 ? (

              <div className={Styles.responses}>

                {responses.map((response) => (

                  <div
                    key={response.id}
                    className={Styles.response}
                  >

                    <div className={Styles.responseHeader}>

                      <div className={Styles.responseUser}>

                        <FaUser />

                        <strong>
                          {response.responded_by_name ||
                            'User'}
                        </strong>

                      </div>

                      <span>
                        {formatDate(
                          response.created_at
                        )}
                      </span>

                    </div>

                    <p>
                      {response.response_text}
                    </p>

                    {response.attachments?.length >
                      0 && (

                      <div
                        className={
                          Styles.responseAttachments
                        }
                      >

                        {response.attachments.map(
                          (attachment) => (

                            <a
                              key={attachment.id}
                              href={attachment.file}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FaPaperclip />
                              {attachment.file_type}
                            </a>

                          )
                        )}

                      </div>

                    )}

                  </div>

                ))}

              </div>

            ) : (

              <p className={Styles.empty}>
                No responses yet.
              </p>

            )}

          </section>


          {/* --------------------------------------------------
              ASSIGNMENT HISTORY
          -------------------------------------------------- */}

          <section className={Styles.card}>

            <div className={Styles.sectionTitle}>
              <FaClock />
              <h3>Assignment History</h3>
            </div>

            {assignmentHistory.length > 0 ? (

              <div className={Styles.timeline}>

                {assignmentHistory.map(
                  (assignment) => (

                    <div
                      key={assignment.id}
                      className={Styles.timelineItem}
                    >

                      <div
                        className={
                          Styles.timelineIcon
                        }
                      >
                        <FaCheckCircle />
                      </div>

                      <div
                        className={
                          Styles.timelineContent
                        }
                      >

                        <strong>
                          {assignment.employee_name ||
                            'Employee'}
                        </strong>

                        <span>
                          {assignment.branch_name ||
                            'Branch'}
                        </span>

                        <small>
                          {assignment.status}
                          {' • '}
                          {formatDate(
                            assignment.created_at
                          )}
                        </small>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className={Styles.empty}>
                No assignment history available.
              </p>

            )}

          </section>

        </div>


        {/* --------------------------------------------------
            SIDEBAR
        -------------------------------------------------- */}

        <aside className={Styles.sidebar}>

          {/* Target */}

          <section className={Styles.card}>

            <h3>Complaint Target</h3>

            <div className={Styles.targetBox}>

              {complaint.target_type ===
                'representative' ? (

                <>
                  <FaUser />

                  <div>
                    <span>
                      Representative
                    </span>

                    <strong>
                      {complaint
                        .target_representative_name ||
                        '-'}
                    </strong>
                  </div>
                </>

              ) : (

                <>
                  <FaBuilding />

                  <div>
                    <span>
                      Branch
                    </span>

                    <strong>
                      {complaint
                        .target_branch_name ||
                        '-'}
                    </strong>
                  </div>
                </>

              )}

            </div>

          </section>


          {/* Complaint creator */}

          <section className={Styles.card}>

            <h3>Submitted By</h3>

            <div className={Styles.creator}>

              <div className={Styles.avatar}>
                <FaUser />
              </div>

              <div>
                <strong>
                  {complaint.created_by_name ||
                    'User'}
                </strong>

                <span>
                  Complaint creator
                </span>
              </div>

            </div>

          </section>


          {/* Complaint information */}

          <section className={Styles.card}>

            <h3>Complaint Information</h3>

            <div className={Styles.detailsList}>

              <div>
                <span>Complaint No.</span>
                <strong>
                  {complaint.complaint_number}
                </strong>
              </div>

              <div>
                <span>Language</span>
                <strong>
                  {complaint.original_language_display ||
                    complaint.original_language ||
                    '-'}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    complaint.created_at
                  )}
                </strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>
                  {formatDate(
                    complaint.updated_at
                  )}
                </strong>
              </div>

              {complaint.resolved_at && (
                <div>
                  <span>Resolved</span>
                  <strong>
                    {formatDate(
                      complaint.resolved_at
                    )}
                  </strong>
                </div>
              )}

              {complaint.closed_at && (
                <div>
                  <span>Closed</span>
                  <strong>
                    {formatDate(
                      complaint.closed_at
                    )}
                  </strong>
                </div>
              )}

            </div>

          </section>


          {/* Support */}

          <section className={Styles.supportCard}>

            <div className={Styles.supportCount}>
              <FaThumbsUp />

              <strong>
                {complaint.support_count || 0}
              </strong>

              <span>
                people support this complaint
              </span>
            </div>

            <button
              className={
                complaint.has_supported
                  ? Styles.supportedButton
                  : Styles.supportButton
              }
              onClick={handleSupport}
              disabled={supportLoading}
            >
              <FaThumbsUp />

              {supportLoading
                ? 'Updating...'
                : complaint.has_supported
                ? 'Supported'
                : 'Support Complaint'}
            </button>

          </section>

        </aside>

      </div>

    </div>
  )
}

export default ComplaintDetails

