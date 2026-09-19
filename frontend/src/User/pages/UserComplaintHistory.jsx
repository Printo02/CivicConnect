import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  FaEye,
  FaSearch,
  FaFilter,
  FaUserTie,
  FaBuilding,
} from 'react-icons/fa'

import { useNavigate } from 'react-router-dom'

import Styles from '../components/module.css/UserComplaintHistory.module.css'
import UserLayout from '../components/UserLayout'

import {
  getmycomplaints,
} from '../../api/services/User/Complaint.js'


const UserComplaintHistory = () => {
  const navigate = useNavigate()

  const [complaints, setComplaints] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [status, setStatus] =
    useState('')


  useEffect(() => {
    fetchComplaints()
  }, [])


  const fetchComplaints = async () => {
    try {
      setLoading(true)

      const data =
        await getmycomplaints()

      setComplaints(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      console.error(
        'Failed to fetch complaints:',
        error
      )

      setComplaints([])
    } finally {
      setLoading(false)
    }
  }


  const filteredComplaints =
    useMemo(() => {
      const searchValue =
        search
          .toLowerCase()
          .trim()

      return complaints.filter(
        (complaint) => {
          const matchesSearch =
            !searchValue ||
            complaint.title
              ?.toLowerCase()
              .includes(searchValue) ||
            complaint.description
              ?.toLowerCase()
              .includes(searchValue) ||
            complaint.location
              ?.toLowerCase()
              .includes(searchValue) ||
            complaint.branch_name
              ?.toLowerCase()
              .includes(searchValue) ||
            complaint.representative_name
              ?.toLowerCase()
              .includes(searchValue)

          const matchesStatus =
            !status ||
            complaint.status === status

          return (
            matchesSearch &&
            matchesStatus
          )
        }
      )
    }, [
      complaints,
      search,
      status,
    ])


  const getStatusClass = (
    value
  ) => {
    return (
      Styles[`status_${value}`] ||
      Styles.status_default
    )
  }


  const getStatusLabel = (
    complaint
  ) => {
    if (
      complaint.status_display
    ) {
      return complaint.status_display
    }

    if (!complaint.status) {
      return '-'
    }

    return complaint.status
      .replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )
  }


  const formatDate = (
    value
  ) => {
    if (!value) {
      return '-'
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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


  return (
    <UserLayout>
      <div className={Styles.container}>

        {/* Header */}

        <div className={Styles.header}>
          <div>
            <h1>
              Complaint History
            </h1>

            <p>
              View and monitor
              the complaints you
              have submitted
            </p>
          </div>
        </div>


        {/* Filters */}

        <div className={Styles.filters}>

          <div
            className={
              Styles.searchBox
            }
          >
            <FaSearch />

            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>


          <div
            className={
              Styles.filterBox
            }
          >
            <FaFilter />

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >
              <option value="">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="resolved">
                Resolved
              </option>

              <option value="closed">
                Closed
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>

        </div>


        {/* Table */}

        <div
          className={
            Styles.tableCard
          }
        >

          {loading ? (
            <div
              className={
                Styles.loading
              }
            >
              Loading complaints...
            </div>
          ) : filteredComplaints.length === 0 ? (

            <div
              className={
                Styles.empty
              }
            >
              <h3>
                No complaints found
              </h3>

              <p>
                {search || status
                  ? 'Try changing your search or filter.'
                  : 'You have not submitted any complaints yet.'}
              </p>
            </div>

          ) : (

            <div
              className={
                Styles.tableWrapper
              }
            >
              <table>

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Authority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>


                <tbody>

                  {filteredComplaints.map(
                    (complaint) => (

                      <tr
                        key={
                          complaint.id
                        }
                      >

                        {/* ID */}

                        <td>
                          <span
                            className={
                              Styles.complaintId
                            }
                          >
                            #
                            {
                              complaint.id
                            }
                          </span>
                        </td>


                        {/* Complaint */}

                        <td>

                          <div
                            className={
                              Styles.complaintTitle
                            }
                          >
                            {
                              complaint.title ||
                              'Untitled complaint'
                            }
                          </div>

                          <div
                            className={
                              Styles.description
                            }
                          >
                            {
                              complaint.description
                                ? complaint.description.length > 70
                                  ? `${complaint.description.substring(0, 70)}...`
                                  : complaint.description
                                : 'No description'
                            }
                          </div>

                          {complaint.location && (
                            <div
                              className={
                                Styles.location
                              }
                            >
                              {
                                complaint.location
                              }
                            </div>
                          )}

                        </td>


                        {/* Authority */}

                        <td>

                          {complaint.branch_name ? (
                            <div
                              className={
                                Styles.authority
                              }
                            >
                              <FaBuilding />

                              <span>
                                {
                                  complaint.branch_name
                                }
                              </span>
                            </div>
                          ) : complaint.representative_name ? (
                            <div
                              className={
                                Styles.authority
                              }
                            >
                              <FaUserTie />

                              <span>
                                {
                                  complaint.representative_name
                                }
                              </span>
                            </div>
                          ) : (
                            <span>
                              -
                            </span>
                          )}

                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={`
                              ${Styles.badge}
                              ${getStatusClass(
                                complaint.status
                              )}
                            `}
                          >
                            {
                              getStatusLabel(
                                complaint
                              )
                            }
                          </span>

                        </td>


                        {/* Created */}

                        <td>
                          {
                            formatDate(
                              complaint.created_at
                            )
                          }
                        </td>


                        {/* View */}

                        <td>

                          <button
                            type="button"
                            className={
                              Styles.viewButton
                            }
                            onClick={() =>
                              navigate(
                                `/user/complaint-history/${complaint.id}`
                              )
                            }
                          >
                            <FaEye />

                            <span>
                              View
                            </span>
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>
            </div>

          )}

        </div>

      </div>
    </UserLayout>
  )
}


export default UserComplaintHistory

