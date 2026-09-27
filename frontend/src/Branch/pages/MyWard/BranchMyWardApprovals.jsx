import React, {
  useEffect,
  useState
} from 'react'

import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaBell,
  FaBullhorn,
  FaTools,
  FaInfoCircle,
  FaBuilding,
  FaSyncAlt
} from 'react-icons/fa'

import BranchLayout from '../../components/BranchLayout'

import {
  getMyWardApprovalPosts,
  reviewMyWardPost
} from '../../../api/services/Branch/MyWardApproval.js'


// ============================================================
// CONSTANTS
// ============================================================

const FILTERS = [
  {
    key: 'pending',
    label: 'Pending'
  },
  {
    key: 'approved',
    label: 'Approved'
  },
  {
    key: 'rejected',
    label: 'Rejected'
  },
  {
    key: 'all',
    label: 'All'
  }
]


const STATUS_COLORS = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444'
}


const STATUS_BACKGROUNDS = {
  pending: 'rgba(245, 158, 11, 0.15)',
  approved: 'rgba(34, 197, 94, 0.15)',
  rejected: 'rgba(239, 68, 68, 0.15)'
}


// ============================================================
// HELPERS
// ============================================================

const getPostTypeLabel = (post) => {

  if (post?.post_type_display) {
    return post.post_type_display
  }

  switch (post?.post_type) {

    case 'alert':
      return 'Alert'

    case 'update':
      return 'Update'

    case 'action':
      return 'Work Notice'

    case 'general':
      return 'General'

    default:
      return 'Post'
  }
}


const getPostTypeIcon = (post) => {

  switch (post?.post_type) {

    case 'alert':
      return <FaBell />

    case 'update':
      return <FaBullhorn />

    case 'action':
      return <FaTools />

    case 'general':
      return <FaInfoCircle />

    default:
      return <FaInfoCircle />
  }
}


const formatDate = (value) => {

  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}


// ============================================================
// COMPONENT
// ============================================================

const BranchMyWardApprovals = () => {

  const [posts, setPosts] = useState([])

  const [filter, setFilter] = useState('pending')

  const [loading, setLoading] = useState(true)

  const [processingId, setProcessingId] =
    useState(null)

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')


  // ----------------------------------------------------------
  // REJECT MODAL
  // ----------------------------------------------------------

  const [
    rejectPost,
    setRejectPost
  ] = useState(null)

  const [
    rejectionReason,
    setRejectionReason
  ] = useState('')


  // ==========================================================
  // LOAD POSTS
  // ==========================================================

  const loadPosts = async () => {

    try {

      setLoading(true)
      setError('')

      const data =
        await getMyWardApprovalPosts(filter)

      console.log(
        'Branch MyWard approval posts:',
        data
      )

      setPosts(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(
        'Failed to load approval posts:',
        err?.response?.status,
        err?.response?.data,
        err
      )

      const data = err?.response?.data

      setError(
        data?.detail ||
        data?.message ||
        'Failed to load approval requests.'
      )

      setPosts([])

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {

    loadPosts()

  }, [filter])


  // ==========================================================
  // APPROVE
  // ==========================================================

  const handleApprove = async (postId) => {

    if (processingId) {
      return
    }

    try {

      setProcessingId(postId)

      setError('')
      setSuccess('')


      const response =
        await reviewMyWardPost(
          postId,
          'approved',
          ''
        )


      console.log(
        'Approval response:',
        response
      )


      setSuccess(
        response?.message ||
        'Post approved and published successfully.'
      )


      await loadPosts()

    } catch (err) {

      console.error(
        'Approve MyWard post failed:',
        err?.response?.status,
        err?.response?.data,
        err
      )

      const data =
        err?.response?.data


      setError(
        data?.detail ||
        data?.decision ||
        data?.message ||
        'Unable to approve post.'
      )

    } finally {

      setProcessingId(null)

    }
  }


  // ==========================================================
  // OPEN REJECT MODAL
  // ==========================================================

  const openRejectModal = (post) => {

    setRejectPost(post)

    setRejectionReason('')

    setError('')
    setSuccess('')
  }


  const closeRejectModal = () => {

    if (processingId) {
      return
    }

    setRejectPost(null)
    setRejectionReason('')
  }


  // ==========================================================
  // REJECT
  // ==========================================================

  const handleReject = async () => {

    if (!rejectPost) {
      return
    }


    const reason =
      rejectionReason.trim()


    if (!reason) {

      setError(
        'Please enter a reason for rejection.'
      )

      return
    }


    try {

      setProcessingId(
        rejectPost.id
      )

      setError('')
      setSuccess('')


      const response =
        await reviewMyWardPost(
          rejectPost.id,
          'rejected',
          reason
        )


      console.log(
        'Rejection response:',
        response
      )


      setSuccess(
        response?.message ||
        'Post rejected successfully.'
      )


      setRejectPost(null)
      setRejectionReason('')


      await loadPosts()

    } catch (err) {

      console.error(
        'Reject MyWard post failed:',
        err?.response?.status,
        err?.response?.data,
        err
      )

      const data =
        err?.response?.data


      let message =
        data?.detail ||
        data?.decision ||
        data?.message ||
        'Unable to reject post.'


      if (
        Array.isArray(
          data?.rejection_reason
        )
      ) {

        message =
          data.rejection_reason[0]

      } else if (
        data?.rejection_reason
      ) {

        message =
          data.rejection_reason
      }


      setError(message)

    } finally {

      setProcessingId(null)

    }
  }


  // ==========================================================
  // COUNT
  // ==========================================================

  const getStatusCount = (statusValue) => {

    if (filter !== 'all') {
      return null
    }

    return posts.filter(
      (post) =>
        post.approval_status ===
        statusValue
    ).length
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <BranchLayout>

      <div
        style={{
          padding: '28px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            background: 'var(--surface)',
            border:
              '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '22px'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}
          >

            <div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color:
                    'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}
              >

                <FaBuilding />

                Branch

              </div>


              <h1
                style={{
                  margin: 0,
                  color:
                    'var(--text-primary)',
                  fontSize: '28px'
                }}
              >
                MyWard Post Approvals
              </h1>


              <p
                style={{
                  margin: '8px 0 0',
                  color:
                    'var(--text-secondary)',
                  lineHeight: '1.6'
                }}
              >
                Review alerts, updates,
                work notices and general
                announcements submitted by
                branch employees.
              </p>

            </div>


            <button
              type="button"
              onClick={loadPosts}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',

                padding: '10px 15px',

                border:
                  '1px solid var(--border)',

                borderRadius: '8px',

                background:
                  'var(--surface-sunken)',

                color:
                  'var(--text-primary)',

                cursor:
                  loading
                    ? 'not-allowed'
                    : 'pointer',

                fontWeight: '600'
              }}
            >

              <FaSyncAlt />

              Refresh

            </button>

          </div>

        </div>


        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (

          <div
            style={{
              marginBottom: '18px',
              padding: '13px 16px',

              background:
                'rgba(34, 197, 94, 0.15)',

              border:
                '1px solid rgba(34, 197, 94, 0.35)',

              borderRadius: '8px',

              color: '#22C55E',

              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {success}
          </div>

        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            style={{
              marginBottom: '18px',
              padding: '13px 16px',

              background:
                'rgba(239, 68, 68, 0.15)',

              border:
                '1px solid rgba(239, 68, 68, 0.35)',

              borderRadius: '8px',

              color: '#EF4444',

              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {error}
          </div>

        )}


        {/* ==================================================
            FILTERS
        ================================================== */}

        <div
          style={{
            display: 'flex',
            gap: '9px',
            flexWrap: 'wrap',
            marginBottom: '22px'
          }}
        >

          {FILTERS.map((item) => {

            const active =
              filter === item.key

            return (

              <button
                key={item.key}
                type="button"
                onClick={() => {

                  setFilter(item.key)

                  setError('')
                  setSuccess('')

                }}
                style={{
                  padding: '10px 16px',

                  borderRadius: '8px',

                  border:
                    active
                      ? '1px solid #7C5CFC'
                      : '1px solid var(--border)',

                  background:
                    active
                      ? '#7C5CFC'
                      : 'var(--surface)',

                  color:
                    active
                      ? '#FFFFFF'
                      : 'var(--text-secondary)',

                  cursor: 'pointer',

                  fontWeight: '600',

                  textTransform:
                    'capitalize'
                }}
              >

                {item.label}

              </button>

            )

          })}

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (

          <div
            style={{
              background:
                'var(--surface)',

              border:
                '1px solid var(--border)',

              borderRadius:
                '12px',

              padding:
                '50px 20px',

              textAlign:
                'center',

              color:
                'var(--text-secondary)'
            }}
          >

            Loading approval requests...

          </div>

        )}


        {/* ==================================================
            EMPTY
        ================================================== */}

        {
          !loading &&
          posts.length === 0 &&
          (

            <div
              style={{
                background:
                  'var(--surface)',

                border:
                  '1px solid var(--border)',

                borderRadius:
                  '12px',

                padding:
                  '50px 20px',

                textAlign:
                  'center',

                color:
                  'var(--text-secondary)'
              }}
            >

              <FaInfoCircle
                style={{
                  fontSize:
                    '28px',

                  marginBottom:
                    '12px',

                  color:
                    '#7C5CFC'
                }}
              />


              <h3
                style={{
                  margin:
                    '0 0 6px',

                  color:
                    'var(--text-primary)'
                }}
              >
                No posts found
              </h3>


              <p
                style={{
                  margin: 0
                }}
              >
                No {
                  filter === 'all'
                    ? ''
                    : `${filter} `
                }
                approval requests are available.
              </p>

            </div>

          )
        }


        {/* ==================================================
            POSTS
        ================================================== */}

        {
          !loading &&
          posts.length > 0 &&
          (

            <div
              style={{
                display: 'grid',
                gap: '14px'
              }}
            >

              {posts.map((post) => {

                const statusValue =
                  post.approval_status ||
                  'pending'

                const processing =
                  processingId === post.id


                return (

                  <article
                    key={post.id}
                    style={{
                      position:
                        'relative',

                      overflow:
                        'hidden',

                      background:
                        'var(--surface)',

                      border:
                        '1px solid var(--border)',

                      borderRadius:
                        '12px',

                      padding:
                        '22px'
                    }}
                  >

                    {/* STATUS LINE */}

                    <div
                      style={{
                        position:
                          'absolute',

                        left: 0,
                        top: 0,
                        bottom: 0,

                        width: '4px',

                        background:
                          STATUS_COLORS[
                            statusValue
                          ] ||
                          '#7C5CFC'
                      }}
                    />


                    {/* TOP */}

                    <div
                      style={{
                        display:
                          'flex',

                        justifyContent:
                          'space-between',

                        alignItems:
                          'flex-start',

                        gap:
                          '20px',

                        flexWrap:
                          'wrap'
                      }}
                    >

                      <div
                        style={{
                          flex: 1,
                          minWidth:
                            '220px'
                        }}
                      >

                        {/* TYPE */}

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '7px',

                            color:
                              '#7C5CFC',

                            fontSize:
                              '13px',

                            fontWeight:
                              '700',

                            marginBottom:
                              '7px'
                          }}
                        >

                          {
                            getPostTypeIcon(
                              post
                            )
                          }

                          {
                            getPostTypeLabel(
                              post
                            )
                          }

                        </div>


                        {/* TITLE */}

                        <h3
                          style={{
                            margin:
                              '0 0 10px',

                            color:
                              'var(--text-primary)',

                            fontSize:
                              '18px'
                          }}
                        >
                          {post.title}
                        </h3>

                      </div>


                      {/* STATUS */}

                      <span
                        style={{
                          display:
                            'inline-flex',

                          alignItems:
                            'center',

                          padding:
                            '6px 10px',

                          borderRadius:
                            '999px',

                          background:
                            STATUS_BACKGROUNDS[
                              statusValue
                            ] ||
                            'var(--surface-sunken)',

                          color:
                            STATUS_COLORS[
                              statusValue
                            ] ||
                            'var(--text-secondary)',

                          fontSize:
                            '12px',

                          fontWeight:
                            '700',

                          textTransform:
                            'capitalize'
                        }}
                      >
                        {
                          post.approval_status_display ||
                          statusValue
                        }
                      </span>

                    </div>


                    {/* EMPLOYEE */}

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '7px',

                        color:
                          'var(--text-secondary)',

                        fontSize:
                          '13px',

                        marginBottom:
                          '13px'
                      }}
                    >

                      <FaUser />

                      <span>
                        {post.employee_name ||
                          'Branch Employee'}
                      </span>


                      {
                        post.employee_designation &&
                        (
                          <>
                            <span>
                              •
                            </span>

                            <span>
                              {
                                post.employee_designation
                              }
                            </span>
                          </>
                        )
                      }

                    </div>


                    {/* BRANCH */}

                    {
                      post.branch_name &&
                      (

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '7px',

                            color:
                              'var(--text-secondary)',

                            fontSize:
                              '13px',

                            marginBottom:
                              '13px'
                          }}
                        >

                          <FaBuilding />

                          {
                            post.branch_name
                          }

                          {
                            post.branch_placename &&
                            (
                              <span>
                                • {
                                  post.branch_placename
                                }
                              </span>
                            )
                          }

                        </div>

                      )
                    }


                    {/* DESCRIPTION */}

                    <p
                      style={{
                        margin:
                          '0 0 16px',

                        color:
                          'var(--text-secondary)',

                        lineHeight:
                          '1.6',

                        whiteSpace:
                          'pre-wrap'
                      }}
                    >
                      {post.description}
                    </p>


                    {/* DATE */}

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '7px',

                        color:
                          'var(--text-muted)',

                        fontSize:
                          '13px'
                      }}
                    >

                      <FaClock />

                      Submitted {
                        formatDate(
                          post.created_at
                        )
                      }

                    </div>


                    {/* REJECTION REASON */}

                    {
                      statusValue ===
                        'rejected' &&
                      post.rejection_reason &&
                      (

                        <div
                          style={{
                            marginTop:
                              '16px',

                            padding:
                              '13px',

                            background:
                              'rgba(239, 68, 68, 0.10)',

                            border:
                              '1px solid rgba(239, 68, 68, 0.25)',

                            borderRadius:
                              '8px',

                            color:
                              '#EF4444',

                            fontSize:
                              '14px'
                          }}
                        >

                          <strong>
                            Rejection reason:
                          </strong>{' '}

                          {
                            post.rejection_reason
                          }

                        </div>

                      )
                    }


                    {/* REVIEW INFO */}

                    {
                      statusValue !==
                        'pending' &&
                      post.reviewed_at &&
                      (

                        <div
                          style={{
                            marginTop:
                              '13px',

                            color:
                              'var(--text-muted)',

                            fontSize:
                              '12px'
                          }}
                        >

                          Reviewed by {
                            post.reviewed_by_name ||
                            'Branch'
                          } on {
                            formatDate(
                              post.reviewed_at
                            )
                          }

                        </div>

                      )
                    }


                    {/* ACTIONS */}

                    {
                      statusValue ===
                        'pending' &&
                      (

                        <div
                          style={{
                            display:
                              'flex',

                            gap:
                              '10px',

                            marginTop:
                              '20px',

                            flexWrap:
                              'wrap'
                          }}
                        >

                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              handleApprove(
                                post.id
                              )
                            }
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap:
                                '7px',

                              padding:
                                '10px 16px',

                              border:
                                'none',

                              borderRadius:
                                '8px',

                              background:
                                '#22C55E',

                              color:
                                '#FFFFFF',

                              fontWeight:
                                '700',

                              cursor:
                                processing
                                  ? 'not-allowed'
                                  : 'pointer',

                              opacity:
                                processing
                                  ? 0.6
                                  : 1
                            }}
                          >

                            <FaCheck />

                            {
                              processing
                                ? 'Processing...'
                                : 'Approve'
                            }

                          </button>


                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              openRejectModal(
                                post
                              )
                            }
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap:
                                '7px',

                              padding:
                                '10px 16px',

                              border:
                                'none',

                              borderRadius:
                                '8px',

                              background:
                                '#EF4444',

                              color:
                                '#FFFFFF',

                              fontWeight:
                                '700',

                              cursor:
                                processing
                                  ? 'not-allowed'
                                  : 'pointer',

                              opacity:
                                processing
                                  ? 0.6
                                  : 1
                            }}
                          >

                            <FaTimes />

                            Reject

                          </button>

                        </div>

                      )
                    }

                  </article>

                )

              })}

            </div>

          )
        }


        {/* ==================================================
            REJECT MODAL
        ================================================== */}

        {rejectPost && (

          <div
            style={{
              position: 'fixed',

              inset: 0,

              zIndex: 9999,

              display: 'flex',

              alignItems: 'center',

              justifyContent:
                'center',

              padding: '20px',

              background:
                'rgba(0,0,0,0.55)',

              backdropFilter:
                'blur(2px)'
            }}
          >

            <div
              style={{
                width: '100%',

                maxWidth:
                  '500px',

                background:
                  'var(--surface)',

                border:
                  '1px solid var(--border)',

                borderRadius:
                  '12px',

                padding:
                  '24px'
              }}
            >

              <h2
                style={{
                  margin:
                    '0 0 8px',

                  color:
                    'var(--text-primary)',

                  fontSize:
                    '20px'
                }}
              >
                Reject Post
              </h2>


              <p
                style={{
                  margin:
                    '0 0 18px',

                  color:
                    'var(--text-secondary)',

                  fontSize:
                    '14px',

                  lineHeight:
                    '1.5'
                }}
              >
                Enter the reason for rejecting
                <strong>
                  {' '}
                  {rejectPost.title}
                </strong>.
                The employee will be able to
                see this reason.
              </p>


              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Enter rejection reason..."
                style={{
                  width: '100%',

                  boxSizing:
                    'border-box',

                  resize:
                    'vertical',

                  padding:
                    '12px',

                  background:
                    'var(--surface-sunken)',

                  color:
                    'var(--text-primary)',

                  border:
                    '1px solid var(--border)',

                  borderRadius:
                    '8px',

                  outline:
                    'none',

                  fontFamily:
                    'inherit'
                }}
              />


              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  gap:
                    '10px',

                  marginTop:
                    '20px'
                }}
              >

                <button
                  type="button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    processingId ===
                    rejectPost.id
                  }
                  style={{
                    padding:
                      '10px 16px',

                    border:
                      '1px solid var(--border)',

                    borderRadius:
                      '8px',

                    background:
                      'var(--surface-sunken)',

                    color:
                      'var(--text-primary)',

                    cursor:
                      'pointer',

                    fontWeight:
                      '600'
                  }}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    handleReject
                  }
                  disabled={
                    processingId ===
                    rejectPost.id
                  }
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      '7px',

                    padding:
                      '10px 16px',

                    border:
                      'none',

                    borderRadius:
                      '8px',

                    background:
                      '#EF4444',

                    color:
                      '#FFFFFF',

                    cursor:
                      processingId ===
                      rejectPost.id
                        ? 'not-allowed'
                        : 'pointer',

                    fontWeight:
                      '700'
                  }}
                >

                  <FaTimes />

                  {
                    processingId ===
                      rejectPost.id
                      ? 'Rejecting...'
                      : 'Reject Post'
                  }

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </BranchLayout>

  )
}


export default BranchMyWardApprovals