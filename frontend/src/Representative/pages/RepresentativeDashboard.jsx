import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  FaBell,
  FaBullhorn,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaEnvelope,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaIdBadge,
  FaMapMarkerAlt,
  FaPlus,
  FaSyncAlt,
  FaUserTie,
  FaArrowRight,
} from 'react-icons/fa'

import RepresentativeLayout
  from '../components/RepresentativeLayout'

import Styles
  from '../components/module.css/RepresentativeDashboard.module.css'

import {
  getProfile,
} from '../../api/services/Representative/Profile'

import {
  getRepresentativeMyWardPosts,
  getRepresentativeDisasters,
} from '../../api/services/Representative/MyWard'

import {
  getRepresentativeComplaints,
} from '../../api/services/Representative/Compliant'

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'

  return 'Good evening'
}


const formatDate = (value) => {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
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


const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}


const resolveImageUrl = (value) => {
  if (!value) return null

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000'

  const backendBase =
    configuredBase
      .replace(/\/api\/?$/i, '')
      .replace(/\/$/, '')

  return `${backendBase}${
    value.startsWith('/')
      ? value
      : `/${value}`
  }`
}


const getPostTypeLabel = (type) => {
  const labels = {
    alert: 'Alert',
    update: 'Update',
    action: 'Work Notice',
    general: 'General',
  }

  return labels[type] || 'Update'
}


function RepresentativeDashboard() {

  const navigate = useNavigate()


  // ============================================================
  // PROFILE
  // ============================================================

  const [profile, setProfile] =
    useState(null)

  const [loadingProfile, setLoadingProfile] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [profileError, setProfileError] =
    useState('')

  const [now, setNow] =
    useState(() => new Date())


  // ============================================================
  // DASHBOARD DATA
  // ============================================================

  const [posts, setPosts] =
    useState([])

  const [disasters, setDisasters] =
    useState([])

  const [complaints, setComplaints] =
    useState([])

  const [activityLoading, setActivityLoading] =
    useState(true)


  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile = useCallback(
    async () => {

      try {

        setProfileError('')

        const data =
          await getProfile()

        setProfile(data)

      } catch (err) {

        console.error(
          'Failed to load representative profile:',
          err
        )

        setProfileError(
          err?.response?.data?.detail ||
          'Could not load your profile.'
        )

      } finally {

        setLoadingProfile(false)

      }

    },
    []
  )


  // ============================================================
  // LOAD DASHBOARD MODULE DATA
  // ============================================================

  const loadDashboardActivity =
    useCallback(
      async () => {

        try {

          setActivityLoading(true)

          /*
           * Promise.allSettled means one API can fail
           * without breaking the entire dashboard.
           */
          const [
            postsResult,
            disastersResult,
            complaintsResult,
          ] = await Promise.allSettled([

            getRepresentativeMyWardPosts(),

            getRepresentativeDisasters({
              sort: 'latest',
            }),

            getRepresentativeComplaints(),

          ])


          // ---------------- POSTS ----------------

          if (
            postsResult.status ===
            'fulfilled'
          ) {

            const data =
              postsResult.value

            setPosts(
              Array.isArray(data)
                ? data
                : []
            )

          } else {

            console.error(
              'Dashboard posts failed:',
              postsResult.reason
            )

            setPosts([])

          }


          // ---------------- DISASTERS ----------------

          if (
            disastersResult.status ===
            'fulfilled'
          ) {

            const data =
              disastersResult.value

            setDisasters(
              Array.isArray(
                data?.disasters
              )
                ? data.disasters
                : Array.isArray(data)
                  ? data
                  : []
            )

          } else {

            console.error(
              'Dashboard disasters failed:',
              disastersResult.reason
            )

            setDisasters([])

          }


          // ---------------- COMPLAINTS ----------------

          if (
            complaintsResult.status ===
            'fulfilled'
          ) {

            const data =
              complaintsResult.value

            /*
             * Supports:
             *
             * [...]
             *
             * or DRF pagination:
             *
             * {
             *   count,
             *   results: [...]
             * }
             */
            setComplaints(
              Array.isArray(data)
                ? data
                : Array.isArray(
                    data?.results
                  )
                  ? data.results
                  : []
            )

          } else {

            console.error(
              'Dashboard complaints failed:',
              complaintsResult.reason
            )

            setComplaints([])

          }

        } finally {

          setActivityLoading(false)

        }

      },
      []
    )


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadProfile()
    loadDashboardActivity()

  }, [
    loadProfile,
    loadDashboardActivity,
  ])


  // ============================================================
  // CLOCK
  // ============================================================

  useEffect(() => {

    const interval =
      setInterval(
        () => setNow(new Date()),
        60 * 1000
      )

    return () =>
      clearInterval(interval)

  }, [])


  // ============================================================
  // REFRESH EVERYTHING
  // ============================================================

  const refreshDashboard =
    async () => {

      try {

        setRefreshing(true)

        await Promise.all([
          loadProfile(),
          loadDashboardActivity(),
        ])

      } finally {

        setRefreshing(false)

      }

    }


  // ============================================================
  // PROFILE VALUES
  // ============================================================

  const greeting =
    getGreeting(
      now.getHours()
    )


  const displayName =
    profile?.name ||
    'Representative'


  const constituency =
    profile?.constituency_name ||
    'Constituency not assigned'


  const formattedDate =
    now.toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    )


  const formattedTime =
    now.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )


  const profileImage =
    resolveImageUrl(
      profile?.image
    )


  const initials =
    useMemo(
      () => {

        const parts =
          displayName
            .trim()
            .split(/\s+/)
            .filter(Boolean)

        if (!parts.length) {
          return 'R'
        }

        return parts
          .slice(0, 2)
          .map(
            (part) =>
              part[0]?.toUpperCase()
          )
          .join('')

      },
      [displayName]
    )


  // ============================================================
  // DASHBOARD COUNTS
  // ============================================================

  const dashboardCounts =
    useMemo(
      () => ({

        posts:
          posts.length,

        disasters:
          disasters.length,

        complaints:
          complaints.length,

        pendingDisasters:
          disasters.filter(
            (item) => {

              const reviews =
                Array.isArray(
                  item.authority_reviews
                )
                  ? item.authority_reviews
                  : []

              return (
                reviews.length === 0
              )

            }
          ).length,

        pendingComplaints:
          complaints.filter(
            (item) =>
              item.status === 'pending'
          ).length,

      }),
      [
        posts,
        disasters,
        complaints,
      ]
    )


  // ============================================================
  // MERGED NOTIFICATIONS
  // ============================================================

  const notifications =
    useMemo(
      () => {

        const postNotifications =
          posts.map(
            (post) => ({

              id:
                `post-${post.id}`,

              type: 'post',

              title:
                `${getPostTypeLabel(
                  post.post_type
                )} published`,

              message:
                post.title ||
                'MyWard update',

              date:
                post.created_at,

              route:
                '/representative/myward/alerts',

            })
          )


        const disasterNotifications =
          disasters.map(
            (disaster) => ({

              id:
                `disaster-${disaster.id}`,

              type: 'disaster',

              title:
                'Disaster report received',

              message:
                disaster.title ||
                'New disaster report',

              date:
                disaster.created_at,

              route:
                '/representative/myward/disasters',

            })
          )


        const complaintNotifications =
          complaints.map(
            (complaint) => ({

              id:
                `complaint-${complaint.id}`,

              type: 'complaint',

              title:
                'Complaint received',

              message:
                complaint.title ||
                `Complaint #${complaint.id}`,

              date:
                complaint.created_at,

              route:
                '/representative/complaints/',

            })
          )


        return [
          ...postNotifications,
          ...disasterNotifications,
          ...complaintNotifications,
        ]
          .sort(
            (a, b) =>
              new Date(
                b.date || 0
              ).getTime() -
              new Date(
                a.date || 0
              ).getTime()
          )
          .slice(0, 8)

      },
      [
        posts,
        disasters,
        complaints,
      ]
    )


  // ============================================================
  // NOTIFICATION ICON
  // ============================================================

  const notificationIcon =
    (type) => {

      if (
        type === 'disaster'
      ) {
        return (
          <FaExclamationTriangle />
        )
      }

      if (
        type === 'complaint'
      ) {
        return (
          <FaClipboardList />
        )
      }

      return (
        <FaBullhorn />
      )

    }


  // ============================================================
  // ACTION
  // ============================================================

  const actions = (

    <button
      type="button"
      className={
        Styles.refreshButton
      }
      onClick={
        refreshDashboard
      }
      disabled={
        refreshing ||
        loadingProfile
      }
    >

      <FaSyncAlt
        className={
          refreshing
            ? Styles.spin
            : ''
        }
      />

      {refreshing
        ? 'Refreshing...'
        : 'Refresh'
      }

    </button>

  )


  return (

    <RepresentativeLayout
      title="Dashboard"
      actions={actions}
    >


      {/* =====================================================
          ERROR
      ===================================================== */}

      {profileError && (

        <div
          className={
            Styles.errorBanner
          }
        >

          <FaExclamationCircle />

          <div>

            <strong>
              Unable to load profile
            </strong>

            <span>
              {profileError}
            </span>

          </div>

        </div>

      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loadingProfile ? (

        <div
          className={
            Styles.dashboardSkeleton
          }
        >

          <div
            className={
              Styles.skeletonHero
            }
          />

          <div
            className={
              Styles.skeletonGrid
            }
          >
            <div />
            <div />
            <div />
          </div>

        </div>

      ) : (

        <>


          {/* =================================================
              WELCOME
          ================================================= */}

          <section className={Styles.hero}>

            <div
              className={
                Styles.heroProfile
              }
            >

              <div
                className={
                  Styles.avatar
                }
              >

                {profileImage
                  ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                      />
                    )
                  : (
                      <span>
                        {initials}
                      </span>
                    )
                }

              </div>


              <div
                className={
                  Styles.heroContent
                }
              >

                <span
                  className={
                    Styles.heroEyebrow
                  }
                >
                  <FaUserTie />

                  Representative Dashboard
                </span>


                <h1>
                  {greeting},{' '}
                  {displayName}
                </h1>


                <p>
                  Manage constituency updates,
                  disaster reports and citizen
                  complaints from one place.
                </p>


                <div
                  className={
                    Styles.heroMeta
                  }
                >

                  <span>
                    <FaMapMarkerAlt />

                    {constituency}
                  </span>


                  <span
                    className={
                      profile?.is_current
                        ? Styles.activeStatus
                        : Styles.inactiveStatus
                    }
                  >

                    <FaCheckCircle />

                    {profile?.is_current
                      ? 'Active Representative'
                      : 'Inactive'
                    }

                  </span>

                </div>

              </div>

            </div>


            <div
              className={
                Styles.dateTimeCard
              }
            >

              <span
                className={
                  Styles.clockLabel
                }
              >

                <FaClock />

                Current time

              </span>


              <strong>
                {formattedTime}
              </strong>


              <p>
                {formattedDate}
              </p>

            </div>

          </section>


          {/* =================================================
              QUICK ACCESS
          ================================================= */}

          <section
            className={
              Styles.quickSection
            }
          >

            <div
              className={
                Styles.sectionHeading
              }
            >

              <div>

                <h2>
                  Quick Access
                </h2>

                <p>
                  Manage your most important
                  representative activities.
                </p>

              </div>

            </div>


            <div
              className={
                Styles.quickGrid
              }
            >


              {/* PUBLISH UPDATE */}

              <button
                type="button"
                className={
                  Styles.quickCard
                }
                onClick={() =>
                  navigate(
                    '/representative/myward/create'
                  )
                }
              >

                <div
                  className={
                    Styles.quickIcon
                  }
                >
                  <FaBullhorn />
                </div>


                <div
                  className={
                    Styles.quickContent
                  }
                >

                  <span>
                    Publish Update
                  </span>

                  <strong>
                    {dashboardCounts.posts}
                  </strong>

                  <small>
                    Published MyWard posts
                  </small>

                </div>


                <FaArrowRight
                  className={
                    Styles.quickArrow
                  }
                />

              </button>


              {/* DISASTERS */}

              <button
                type="button"
                className={
                  Styles.quickCard
                }
                onClick={() =>
                  navigate(
                    '/representative/myward/disasters'
                  )
                }
              >

                <div
                  className={`${Styles.quickIcon} ${Styles.disasterIcon}`}
                >
                  <FaExclamationTriangle />
                </div>


                <div
                  className={
                    Styles.quickContent
                  }
                >

                  <span>
                    Disaster Reports
                  </span>

                  <strong>
                    {dashboardCounts.disasters}
                  </strong>

                  <small>
                    {
                      dashboardCounts
                        .pendingDisasters
                    }{' '}
                    need review
                  </small>

                </div>


                <FaArrowRight
                  className={
                    Styles.quickArrow
                  }
                />

              </button>


              {/* COMPLAINTS */}

              <button
                type="button"
                className={
                  Styles.quickCard
                }
                onClick={() =>
                  navigate(
                    '/representative/complaints/'
                  )
                }
              >

                <div
                  className={`${Styles.quickIcon} ${Styles.complaintIcon}`}
                >
                  <FaClipboardList />
                </div>


                <div
                  className={
                    Styles.quickContent
                  }
                >

                  <span>
                    Complaints
                  </span>

                  <strong>
                    {dashboardCounts.complaints}
                  </strong>

                  <small>
                    {
                      dashboardCounts
                        .pendingComplaints
                    }{' '}
                    pending
                  </small>

                </div>


                <FaArrowRight
                  className={
                    Styles.quickArrow
                  }
                />

              </button>

            </div>

          </section>


          {/* =================================================
              MAIN DASHBOARD GRID
          ================================================= */}

          <section
            className={
              Styles.dashboardMainGrid
            }
          >


            {/* ===============================================
                NOTIFICATIONS
            =============================================== */}

            <div
              className={
                Styles.notificationPanel
              }
            >

              <div
                className={
                  Styles.panelHeaderRow
                }
              >

                <div>

                  <h2>
                    Notifications
                  </h2>

                  <p>
                    Recent activity across
                    your representative modules.
                  </p>

                </div>


                <div
                  className={
                    Styles.notificationBadge
                  }
                >

                  <FaBell />

                  {
                    notifications.length
                  }

                </div>

              </div>


              {activityLoading ? (

                <div
                  className={
                    Styles.activityLoading
                  }
                >

                  <div
                    className={
                      Styles.smallLoader
                    }
                  />

                  Loading activity...

                </div>

              ) : notifications.length === 0 ? (

                <div
                  className={
                    Styles.emptyActivity
                  }
                >

                  <FaBell />

                  <strong>
                    No recent activity
                  </strong>

                  <span>
                    Updates, disaster reports
                    and complaints will appear
                    here.
                  </span>

                </div>

              ) : (

                <div
                  className={
                    Styles.notificationList
                  }
                >

                  {notifications.map(
                    (notification) => (

                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        className={
                          Styles.notificationItem
                        }
                        onClick={() =>
                          navigate(
                            notification.route
                          )
                        }
                      >

                        <div
                          className={`${Styles.notificationIcon} ${
                            notification.type ===
                            'disaster'
                              ? Styles.notificationDisaster
                              : notification.type ===
                                'complaint'
                                ? Styles.notificationComplaint
                                : Styles.notificationPost
                          }`}
                        >

                          {notificationIcon(
                            notification.type
                          )}

                        </div>


                        <div
                          className={
                            Styles.notificationContent
                          }
                        >

                          <div
                            className={
                              Styles.notificationTop
                            }
                          >

                            <strong>
                              {
                                notification.title
                              }
                            </strong>


                            <span>
                              {formatDateTime(
                                notification.date
                              )}
                            </span>

                          </div>


                          <p>
                            {
                              notification.message
                            }
                          </p>

                        </div>


                        <FaArrowRight
                          className={
                            Styles.notificationArrow
                          }
                        />

                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ===============================================
                PROFILE SUMMARY
            =============================================== */}

            <div
              className={
                Styles.profilePanel
              }
            >

              <div
                className={
                  Styles.panelHeader
                }
              >

                <div>

                  <h2>
                    Profile Information
                  </h2>

                  <p>
                    Representative account
                    details.
                  </p>

                </div>

              </div>


              <div
                className={
                  Styles.profileDetails
                }
              >


                <div
                  className={
                    Styles.detailRow
                  }
                >

                  <div
                    className={
                      Styles.detailIcon
                    }
                  >
                    <FaUserTie />
                  </div>


                  <div>

                    <span>
                      Representative
                    </span>

                    <strong>
                      {displayName}
                    </strong>

                  </div>

                </div>


                <div
                  className={
                    Styles.detailRow
                  }
                >

                  <div
                    className={
                      Styles.detailIcon
                    }
                  >
                    <FaEnvelope />
                  </div>


                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {profile?.email ||
                        'Not available'}
                    </strong>

                  </div>

                </div>


                <div
                  className={
                    Styles.detailRow
                  }
                >

                  <div
                    className={
                      Styles.detailIcon
                    }
                  >
                    <FaMapMarkerAlt />
                  </div>


                  <div>

                    <span>
                      Constituency
                    </span>

                    <strong>
                      {constituency}
                    </strong>

                  </div>

                </div>


                <div
                  className={
                    Styles.detailRow
                  }
                >

                  <div
                    className={
                      Styles.detailIcon
                    }
                  >
                    <FaCalendarAlt />
                  </div>


                  <div>

                    <span>
                      Term started
                    </span>

                    <strong>
                      {formatDate(
                        profile?.start_date
                      )}
                    </strong>

                  </div>

                </div>


                <div
                  className={
                    Styles.detailRow
                  }
                >

                  <div
                    className={
                      Styles.detailIcon
                    }
                  >
                    <FaIdBadge />
                  </div>


                  <div>

                    <span>
                      Status
                    </span>

                    <strong
                      className={
                        profile?.is_current
                          ? Styles.statusActive
                          : Styles.statusInactive
                      }
                    >
                      {profile?.is_current
                        ? 'Active'
                        : 'Inactive'
                      }
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </section>

        </>

      )}

    </RepresentativeLayout>
  )
}


export default RepresentativeDashboard