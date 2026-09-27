import React, {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  FaBell,
  FaBullhorn,
  FaTools,
  FaInfoCircle,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa'

import RepresentativeLayout from '../../components/RepresentativeLayout'

import {
  getRepresentativeMyWardPosts
} from '../../../api/services/Representative/MyWard.js'


// ============================================================
// FILTERS
// ============================================================

const FILTERS = [
  {
    key: 'all',
    label: 'All',
    icon: <FaLayerGroup />
  },
  {
    key: 'alert',
    label: 'Alerts',
    icon: <FaBell />
  },
  {
    key: 'update',
    label: 'Updates',
    icon: <FaBullhorn />
  },
  {
    key: 'work_notice',
    label: 'Work Notices',
    icon: <FaTools />
  },
  {
    key: 'general',
    label: 'General',
    icon: <FaInfoCircle />
  }
]


// ============================================================
// HELPERS
// ============================================================

const normalizePostType = (post) => {
  const value = String(
    post?.post_type ||
    post?.type ||
    post?.category ||
    post?.category_type ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')


  if (value === 'alerts') {
    return 'alert'
  }


  if (value === 'updates') {
    return 'update'
  }


  // Backend:
  // action = Action / Work Notice
  if (
    value === 'action' ||
    value === 'actions' ||
    value === 'work_notice' ||
    value === 'work_notices'
  ) {
    return 'work_notice'
  }


  return value
}


const getTypeLabel = (post) => {
  const type = normalizePostType(post)

  switch (type) {

    case 'alert':
      return 'Alert'

    case 'update':
      return 'Update'

    case 'work_notice':
      return 'Work Notice'

    case 'general':
      return 'General'

    default:
      return 'General'
  }
}


const getTypeIcon = (post) => {
  const type = normalizePostType(post)

  switch (type) {

    case 'alert':
      return <FaBell />

    case 'update':
      return <FaBullhorn />

    case 'work_notice':
      return <FaTools />

    default:
      return <FaInfoCircle />
  }
}


const formatDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}


// ============================================================
// COMPONENT
// ============================================================

const RepAlerts = () => {

  const [activeFilter, setActiveFilter] =
    useState('all')

  const [posts, setPosts] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ==========================================================
  // LOAD POSTS
  // ==========================================================

  useEffect(() => {

    let mounted = true

    const loadPosts = async () => {

      try {

        setLoading(true)
        setError('')

        const data =
          await getRepresentativeMyWardPosts()

        console.log(
          'Representative MyWard posts:',
          data
        )

        if (mounted) {
          setPosts(
            Array.isArray(data)
              ? data
              : []
          )
        }

      } catch (err) {

        console.error(
          'Failed to load representative MyWard posts:',
          err
        )

        if (mounted) {

          setPosts([])

          setError(
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            'Failed to load alerts and notices.'
          )
        }

      } finally {

        if (mounted) {
          setLoading(false)
        }

      }

    }


    loadPosts()


    return () => {
      mounted = false
    }

  }, [])


  // ==========================================================
  // FILTER POSTS
  // ==========================================================

  const filteredPosts = useMemo(() => {

    if (activeFilter === 'all') {
      return posts
    }

    return posts.filter(
      (post) =>
        normalizePostType(post) === activeFilter
    )

  }, [
    posts,
    activeFilter
  ])


  // ==========================================================
  // CATEGORY COUNT
  // ==========================================================

  const getCount = (filterKey) => {

    if (filterKey === 'all') {
      return posts.length
    }

    return posts.filter(
      (post) =>
        normalizePostType(post) === filterKey
    ).length
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <RepresentativeLayout>

      <div
        style={{
          padding: '28px',
          width: '100%'
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}
          >

            <FaBell />

            Representative

          </div>


          <h1
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '28px'
            }}
          >
            Alerts & Notices
          </h1>


          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}
          >
            View alerts, public updates,
            work notices and general announcements.
          </p>

        </div>


        {/* ==================================================
            FILTERS
        ================================================== */}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}
        >

          {FILTERS.map((filter) => {

            const isActive =
              activeFilter === filter.key

            return (

              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  setActiveFilter(filter.key)
                }
                style={{

                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',

                  padding: '10px 16px',

                  borderRadius: '9px',

                  border: isActive
                    ? '1px solid #7C5CFC'
                    : '1px solid var(--border)',

                  background: isActive
                    ? '#7C5CFC'
                    : 'var(--surface)',

                  color: isActive
                    ? '#FFFFFF'
                    : 'var(--text-secondary)',

                  fontWeight: '600',

                  cursor: 'pointer',

                  transition: '0.2s ease'
                }}
              >

                {filter.icon}

                <span>
                  {filter.label}
                </span>


                <span
                  style={{
                    minWidth: '22px',
                    height: '22px',

                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    padding: '0 6px',

                    borderRadius: '999px',

                    background: isActive
                      ? 'rgba(255,255,255,0.18)'
                      : 'var(--surface-sunken)',

                    fontSize: '12px'
                  }}
                >
                  {getCount(filter.key)}
                </span>

              </button>

            )

          })}

        </div>


        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: '20px'
              }}
            >
              {
                FILTERS.find(
                  (filter) =>
                    filter.key === activeFilter
                )?.label
              }
            </h2>


            <p
              style={{
                margin: '5px 0 0',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}
            >

              {loading
                ? 'Loading...'
                : (
                  <>
                    {filteredPosts.length}{' '}
                    {
                      filteredPosts.length === 1
                        ? 'post'
                        : 'posts'
                    }
                  </>
                )
              }

            </p>

          </div>

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',

              padding: '55px 25px',

              textAlign: 'center',

              color: 'var(--text-secondary)'
            }}
          >

            <div
              style={{
                width: '54px',
                height: '54px',

                borderRadius: '50%',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                margin: '0 auto 16px',

                background:
                  'var(--surface-sunken)',

                color: '#7C5CFC',

                fontSize: '22px'
              }}
            >
              <FaBell />
            </div>


            <h3
              style={{
                margin: '0 0 8px',
                color: 'var(--text-primary)'
              }}
            >
              Loading posts
            </h3>


            <p
              style={{
                margin: 0
              }}
            >
              Loading alerts and notices...
            </p>

          </div>

        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading && error && (

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid #EF4444',

              borderRadius: '12px',

              padding: '22px',

              color: '#EF4444'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',

                fontWeight: '700',

                marginBottom: '7px'
              }}
            >
              <FaInfoCircle />

              Unable to load posts
            </div>


            <div
              style={{
                fontSize: '14px'
              }}
            >
              {error}
            </div>

          </div>

        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {
          !loading &&
          !error &&
          filteredPosts.length === 0 &&
          (

            <div
              style={{
                background: 'var(--surface)',

                border:
                  '1px solid var(--border)',

                borderRadius: '12px',

                padding: '55px 25px',

                textAlign: 'center'
              }}
            >

              <div
                style={{
                  width: '54px',
                  height: '54px',

                  borderRadius: '50%',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  margin: '0 auto 16px',

                  background:
                    'var(--surface-sunken)',

                  color: '#7C5CFC',

                  fontSize: '22px'
                }}
              >
                <FaBell />
              </div>


              <h3
                style={{
                  margin: '0 0 8px',
                  color: 'var(--text-primary)'
                }}
              >
                No posts available
              </h3>


              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)'
                }}
              >

                No {
                  activeFilter === 'all'

                    ? 'alerts or notices'

                    : FILTERS.find(
                        (filter) =>
                          filter.key ===
                          activeFilter
                      )?.label.toLowerCase()
                } are available right now.

              </p>

            </div>

          )
        }


        {/* ==================================================
            POST LIST
        ================================================== */}

        {
          !loading &&
          !error &&
          filteredPosts.length > 0 &&
          (

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >

              {filteredPosts.map((post) => (

                <article
                  key={post.id}
                  style={{
                    position: 'relative',

                    background:
                      'var(--surface)',

                    border:
                      '1px solid var(--border)',

                    borderRadius: '12px',

                    padding: '22px',

                    overflow: 'hidden'
                  }}
                >

                  {/* LEFT ACCENT */}

                  <div
                    style={{
                      position: 'absolute',

                      left: 0,
                      top: 0,
                      bottom: 0,

                      width: '4px',

                      background: '#7C5CFC'
                    }}
                  />


                  {/* POST TOP */}

                  <div
                    style={{
                      display: 'flex',

                      justifyContent:
                        'space-between',

                      alignItems:
                        'flex-start',

                      gap: '20px'
                    }}
                  >

                    <div
                      style={{
                        flex: 1
                      }}
                    >

                      {/* TYPE */}

                      <div
                        style={{
                          display: 'flex',

                          alignItems:
                            'center',

                          gap: '7px',

                          color:
                            '#7C5CFC',

                          fontWeight:
                            '700',

                          fontSize:
                            '13px',

                          marginBottom:
                            '10px'
                        }}
                      >

                        {getTypeIcon(post)}

                        {getTypeLabel(post)}

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


                      {/* DESCRIPTION */}

                      <p
                        style={{
                          margin: 0,

                          color:
                            'var(--text-secondary)',

                          lineHeight:
                            '1.6'
                        }}
                      >
                        {post.description}
                      </p>

                    </div>


                    {/* DATE */}

                    {post.created_at && (

                      <div
                        style={{
                          display: 'flex',

                          alignItems:
                            'center',

                          gap: '6px',

                          color:
                            'var(--text-secondary)',

                          fontSize:
                            '13px',

                          fontWeight:
                            '600',

                          whiteSpace:
                            'nowrap'
                        }}
                      >

                        <FaClock />

                        {formatDate(
                          post.created_at
                        )}

                      </div>

                    )}

                  </div>


                  {/* LOCATION */}

                  {(
                    post.location ||
                    post.location_name ||
                    post.local_body_name ||
                    post.constituency_name
                  ) && (

                    <div
                      style={{
                        display: 'flex',

                        alignItems:
                          'center',

                        gap: '6px',

                        marginTop:
                          '16px',

                        color:
                          'var(--text-secondary)',

                        fontSize:
                          '13px'
                      }}
                    >

                      <FaMapMarkerAlt />


                      {
                        post.location ||
                        post.location_name ||
                        post.local_body_name ||
                        post.constituency_name
                      }

                    </div>

                  )}

                </article>

              ))}

            </div>

          )
        }

      </div>

    </RepresentativeLayout>

  )

}


export default RepAlerts