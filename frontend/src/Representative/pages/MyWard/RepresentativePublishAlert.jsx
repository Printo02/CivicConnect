import { useCallback,useEffect,useMemo,useState } from 'react'
import { FaBell,FaBullhorn,FaClock,FaExclamationTriangle,FaInfoCircle,FaListAlt,FaMapMarkerAlt,FaSyncAlt,FaTools } from 'react-icons/fa'
import RepresentativeSidebar from '../../components/RepresentativeSidebar'
import Styles from '../../components/module.css/MyWard.module.css'
import {getRepresentativeMyWardPosts} from '../../../api/services/Representative/MyWard'


const POST_TYPES = {
  alert: { label: 'Alert',icon: <FaBell />},
  update: { label: 'Update',icon: <FaBullhorn />},
  action: { label: 'Action / Work Notice',icon: <FaTools />},
  general: {label: 'General',icon: <FaInfoCircle />},
}


const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


const getErrorMessage = (err) => {
  const data = err?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }
  return 'Unable to load published MyWard posts.'
}


export default function RepresentativePublishAlert() {

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')


  //  LOAD REPRESENTATIVE POSTS

  const loadPosts = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError('')
        const data = await getRepresentativeMyWardPosts()
        setPosts(Array.isArray(data) ? data : [])

      } catch (err) {

        console.error('Failed to load representative MyWard posts:',err)
        setError(getErrorMessage(err))
        setPosts([])

      } finally {

        setLoading(false)
        setRefreshing(false)

      }

    },
    []
  )


  useEffect(() => {
    loadPosts()
  }, [loadPosts])


  // ============================================================
  // FILTER
  // ============================================================

  const filteredPosts = useMemo(() => {

    if (filter === 'all') {
      return posts
    }

    return posts.filter(
      (post) =>
        post.post_type === filter
    )

  }, [posts, filter])


  // ============================================================
  // COUNTS
  // ============================================================

  const stats = useMemo(() => {

    return {
      total: posts.length,

      alerts: posts.filter(
        (post) =>
          post.post_type === 'alert'
      ).length,

      updates: posts.filter(
        (post) =>
          post.post_type === 'update'
      ).length,

      actions: posts.filter(
        (post) =>
          post.post_type === 'action'
      ).length,
    }

  }, [posts])


  return (
    <div className={Styles.page}>

      <RepresentativeSidebar />


      <main className={Styles.content}>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className={Styles.publishHeader}>

          <div>

            <div className={Styles.eyebrow}>
              <FaBullhorn />
              MyWard
            </div>

            <h1>
              Published Updates
            </h1>

            <p>
              View alerts, updates and public notices
              you have published to MyWard.
            </p>

          </div>


          <button
            type="button"
            className={Styles.refreshButton}
            onClick={() =>
              loadPosts(true)
            }
            disabled={
              loading ||
              refreshing
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

        </header>


        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section className={Styles.publishStats}>

          <div className={Styles.publishStatCard}>
            <span>
              Total Posts
            </span>

            <strong>
              {stats.total}
            </strong>
          </div>


          <div className={Styles.publishStatCard}>
            <span>
              Alerts
            </span>

            <strong>
              {stats.alerts}
            </strong>
          </div>


          <div className={Styles.publishStatCard}>
            <span>
              Updates
            </span>

            <strong>
              {stats.updates}
            </strong>
          </div>


          <div className={Styles.publishStatCard}>
            <span>
              Work Notices
            </span>

            <strong>
              {stats.actions}
            </strong>
          </div>

        </section>


        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className={Styles.postFilterBar}>

          <button
            type="button"
            className={`${Styles.postFilterButton} ${
              filter === 'all'
                ? Styles.postFilterActive
                : ''
            }`}
            onClick={() =>
              setFilter('all')
            }
          >
            All
          </button>


          <button
            type="button"
            className={`${Styles.postFilterButton} ${
              filter === 'alert'
                ? Styles.postFilterActive
                : ''
            }`}
            onClick={() =>
              setFilter('alert')
            }
          >
            Alerts
          </button>


          <button
            type="button"
            className={`${Styles.postFilterButton} ${
              filter === 'update'
                ? Styles.postFilterActive
                : ''
            }`}
            onClick={() =>
              setFilter('update')
            }
          >
            Updates
          </button>


          <button
            type="button"
            className={`${Styles.postFilterButton} ${
              filter === 'action'
                ? Styles.postFilterActive
                : ''
            }`}
            onClick={() =>
              setFilter('action')
            }
          >
            Work Notices
          </button>


          <button
            type="button"
            className={`${Styles.postFilterButton} ${
              filter === 'general'
                ? Styles.postFilterActive
                : ''
            }`}
            onClick={() =>
              setFilter('general')
            }
          >
            General
          </button>

        </div>


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (

          <div className={Styles.publishState}>

            <div className={Styles.loader} />

            <h3>
              Loading published posts
            </h3>

            <p>
              Fetching your MyWard updates.
            </p>

          </div>

        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {!loading && error && (

          <div
            className={`${Styles.publishState} ${Styles.publishError}`}
          >

            <FaExclamationTriangle />

            <h3>
              Unable to load posts
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className={Styles.primary}
              onClick={() =>
                loadPosts()
              }
            >
              Try Again
            </button>

          </div>

        )}


        {/* =====================================================
            EMPTY
        ===================================================== */}

        {!loading &&
          !error &&
          filteredPosts.length === 0 && (

            <div className={Styles.publishState}>

              <FaListAlt />

              <h3>
                No posts found
              </h3>

              <p>
                You have not published any posts
                matching this category.
              </p>

            </div>

          )}


        {/* =====================================================
            POSTS
        ===================================================== */}

        {!loading &&
          !error &&
          filteredPosts.length > 0 && (

            <div className={Styles.publishedPostList}>

              {filteredPosts.map(
                (post) => {

                  const config =
                    POST_TYPES[
                      post.post_type
                    ] ||
                    POST_TYPES.general

                  return (

                    <article
                      key={post.id}
                      className={
                        Styles.publishedPostCard
                      }
                    >

                      {/* HEADER */}

                      <div
                        className={
                          Styles.publishedPostHeader
                        }
                      >

                        <div
                          className={
                            Styles.publishedPostIdentity
                          }
                        >

                          <div
                            className={
                              Styles.postTypeIcon
                            }
                          >
                            {config.icon}
                          </div>


                          <div>

                            <span
                              className={
                                Styles.postTypeBadge
                              }
                            >
                              {config.label}
                            </span>

                            <h2>
                              {post.title}
                            </h2>

                          </div>

                        </div>


                        {post.created_at && (

                          <div
                            className={
                              Styles.postCreatedTime
                            }
                          >

                            <FaClock />

                            {formatDateTime(
                              post.created_at
                            )}

                          </div>

                        )}

                      </div>


                      {/* DESCRIPTION */}

                      <p
                        className={
                          Styles.publishedPostDescription
                        }
                      >
                        {post.description}
                      </p>


                      {/* META */}

                      <div
                        className={Styles.publishedPostMeta}
                      >

                        {post.author_name && (
                          <span>
                            <FaBullhorn />
                            Published by
                            <strong>{post.author_name}</strong>
                          </span>
                        )}


                        {post.constituency_name && (
                          <span>
                            <FaMapMarkerAlt />
                            <strong>{post.constituency_name}</strong>
                          </span>
                        )}
                      </div>


                      {/* UPDATED */}
                      {post.updated_at &&
                        post.updated_at !==
                          post.created_at && (
                          <div className={Styles.updatedText}>
                            Last updated{' '}
                            {formatDateTime(post.updated_at)}
                          </div>
                        )}
                    </article>
                  )
                }
              )}
            </div>
          )}
      </main>
    </div>
  )
}