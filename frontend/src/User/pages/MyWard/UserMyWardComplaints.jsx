import { useEffect, useState } from 'react'
import {
  FaShareAlt,
  FaUndoAlt,
  FaHashtag,
  FaExclamationCircle,
  FaClipboardList,
} from 'react-icons/fa'

import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'

import {
  getMyComplaints,
  shareComplaintToMyWard,
  unshareComplaintFromMyWard,
} from '../../../api/services/User/MyWard'


export default function UserMyWardComplaints() {
  const [complaints, setComplaints] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)


  const loadComplaints = async () => {
    try {
      setLoading(true)
      setMessage('')

      const data = await getMyComplaints()

      setComplaints(
        Array.isArray(data)
          ? data
          : data?.results || []
      )
    } catch {
      setMessage('Unable to load complaints.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadComplaints()
  }, [])


  const share = async (id) => {
    try {
      setProcessingId(id)
      setMessage('')

      await shareComplaintToMyWard(id)

      setMessage(
        `Complaint #${id} shared to MyWard successfully.`
      )

      setMessageType('success')
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
        'Unable to share complaint.'
      )

      setMessageType('error')
    } finally {
      setProcessingId(null)
    }
  }


  const unshare = async (id) => {
    try {
      setProcessingId(id)
      setMessage('')

      await unshareComplaintFromMyWard(id)

      setMessage(
        `Complaint #${id} removed from MyWard.`
      )

      setMessageType('success')
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
        'Unable to remove complaint.'
      )

      setMessageType('error')
    } finally {
      setProcessingId(null)
    }
  }


  return (
    <div className={Styles.page}>

    <div className={Styles.sidebarSticky}>
      <MyWardSidebar />
    </div>
      <main className={Styles.content}>

        {/* HEADER */}

        <header className={Styles.complaintsPageHeader}>
          <div>
            <span className={Styles.sectionEyebrow}>
              My Ward
            </span>

            <h1>My Complaints</h1>

            <p>
              Choose which of your complaints should be
              visible to other citizens in your ward.
            </p>
          </div>

          <div className={Styles.complaintTotal}>
            <FaClipboardList />

            <span>
              {complaints.length}
            </span>

            <small>
              {complaints.length === 1
                ? 'Complaint'
                : 'Complaints'}
            </small>
          </div>
        </header>


        {/* MESSAGE */}

        {message && (
          <div
            className={
              messageType === 'error'
                ? Styles.alertError
                : Styles.alertSuccess
            }
          >
            <FaExclamationCircle />

            <span>{message}</span>
          </div>
        )}


        {/* LOADING */}

        {loading && (
          <div className={Styles.loadingCard}>
            <div className={Styles.spinner} />

            <div>
              <strong>
                Loading complaints
              </strong>

              <span>
                Fetching your complaint history...
              </span>
            </div>
          </div>
        )}


        {/* EMPTY */}

        {!loading && complaints.length === 0 && (
          <div className={Styles.emptyState}>
            <FaClipboardList />

            <h3>No complaints found</h3>

            <p>
              You have not filed any complaints yet.
            </p>
          </div>
        )}


        {/* COMPLAINT LIST */}

        {!loading && complaints.length > 0 && (
          <div className={Styles.myComplaintList}>

            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className={Styles.myComplaintCard}
              >

                {/* CARD TOP */}

                <div className={Styles.myComplaintTop}>

                  <div className={Styles.myComplaintInfo}>

                    <span className={Styles.myComplaintId}>
                      <FaHashtag />

                      Complaint ID: #{complaint.id}
                    </span>

                    <h2>
                      {complaint.title}
                    </h2>

                  </div>


                  <span
                    className={`
                      ${Styles.status}
                      ${
                        complaint.status === 'pending'
                          ? Styles.statusPending
                          : complaint.status === 'in_progress'
                            ? Styles.statusProgress
                            : complaint.status === 'resolved'
                              ? Styles.statusResolved
                              : complaint.status === 'rejected'
                                ? Styles.statusRejected
                                : Styles.statusClosed
                      }
                    `}
                  >
                    {complaint.status_display ||
                      complaint.status}
                  </span>

                </div>


                {/* DESCRIPTION */}

                <div className={Styles.myComplaintBody}>
                  <p>
                    {complaint.description ||
                      'No description provided.'}
                  </p>
                </div>


                {/* ACTIONS */}

                <div className={Styles.myComplaintActions}>

                  <button
                    type="button"
                    className={Styles.shareButton}
                    onClick={() =>
                      share(complaint.id)
                    }
                    disabled={
                      processingId === complaint.id
                    }
                  >
                    <FaShareAlt />

                    {processingId === complaint.id
                      ? 'Please wait...'
                      : 'Share to MyWard'}
                  </button>


                  <button
                    type="button"
                    className={Styles.unshareButton}
                    onClick={() =>
                      unshare(complaint.id)
                    }
                    disabled={
                      processingId === complaint.id
                    }
                  >
                    <FaUndoAlt />

                    Remove Share
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </main>
    </div>
  )
}