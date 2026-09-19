import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {getMyComplaints} from '../../api/services/Complaint/Complaint.js'

import styles from '../components/module.css/Complaints.module.css'

export default function Complaints() {

  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    try {

      setLoading(true)
      setError('')

      const data = await getMyComplaints()

      /*
       * Depending on your backend response,
       * complaints may be returned directly as an array
       * or inside a results field.
       */
      if (Array.isArray(data)) {
        setComplaints(data)
      } else if (Array.isArray(data.results)) {
        setComplaints(data.results)
      } else {
        setComplaints([])
      }

    } catch (err) {

      console.error('Failed to load complaints:', err)

      setError(
        err.response?.data?.detail ||
        'Failed to load complaints.'
      )

    } finally {
      setLoading(false)
    }
  }


  const getStatusClass = (status) => {

    switch (status) {

      case 'pending':
        return styles.pending

      case 'assigned':
        return styles.assigned

      case 'in_progress':
        return styles.inProgress

      case 'resolved':
        return styles.resolved

      case 'rejected':
        return styles.rejected

      case 'reassigned':
        return styles.reassigned

      default:
        return styles.defaultStatus
    }
  }


  const formatStatus = (status) => {

    if (!status) {
      return 'Unknown'
    }

    return status
      .replaceAll('_', ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }


  const handleComplaintClick = (complaintId) => {

    navigate(
      `/user/complaints/${complaintId}`
    )
  }


  if (loading) {

    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Loading complaints...
        </div>
      </div>
    )
  }


  return (

    <div className={styles.container}>

      {/* HEADER */}

      <div className={styles.header}>

        <div>
          <h2>My Complaints</h2>

          <p>
            View and track the complaints you have submitted.
          </p>
        </div>

        <button
          className={styles.createBtn}
          onClick={() =>
            navigate('/user/complaints/create')
          }
        >
          + Create Complaint
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className={styles.error}>
          {error}
        </div>

      )}


      {/* EMPTY */}

      {!error && complaints.length === 0 && (

        <div className={styles.empty}>

          <h3>No complaints found</h3>

          <p>
            You have not submitted any complaints yet.
          </p>

          <button
            className={styles.createBtn}
            onClick={() =>
              navigate('/user/complaints/create')
            }
          >
            Create Your First Complaint
          </button>

        </div>

      )}


      {/* COMPLAINT LIST */}

      {complaints.length > 0 && (

        <div className={styles.list}>

          {complaints.map((complaint) => (

            <div
              key={complaint.id}
              className={styles.card}
              onClick={() =>
                handleComplaintClick(complaint.id)
              }
            >

              <div className={styles.cardHeader}>

                <div>

                  <h3>
                    {complaint.complaint_number ||
                     `Complaint #${complaint.id}`}
                  </h3>

                  <span className={styles.category}>
                    {complaint.category || 'Public Issue'}
                  </span>

                </div>


                <span
                  className={`${styles.status} ${
                    getStatusClass(complaint.status)
                  }`}
                >
                  {formatStatus(complaint.status)}
                </span>

              </div>


              <p className={styles.description}>

                {complaint.description ||
                 'No description available.'}

              </p>


              <div className={styles.cardFooter}>

                <span>
                  {complaint.created_at
                    ? new Date(
                        complaint.created_at
                      ).toLocaleDateString()
                    : ''}
                </span>

                {complaint.target_branch_name && (

                  <span>
                    {complaint.target_branch_name}
                  </span>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}