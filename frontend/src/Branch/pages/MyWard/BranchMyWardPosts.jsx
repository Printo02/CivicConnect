import { useCallback,useEffect,useMemo,useState} from 'react'
import { FaBell,FaBullhorn,FaClock,FaExclamationCircle,FaMapMarkerAlt,FaSearch,FaSortAmountDown,FaSyncAlt } from 'react-icons/fa'
import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'
import {getBranchMyWardPosts} from '../../../api/services/Branch/MyWard'
import BranchSidebar from '../../components/BranchSidebar'

const POST_TYPE_LABELS = { alert: 'Alert',update: 'Update',action: 'Action / Work Notice',general: 'General'}

const normalizePosts = (data) => {
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.results)) {
    return data.results
  }
  if (Array.isArray(data?.data)) {
    return data.data
  }
  return []
}


const formatDateTime = (value) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
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


const getPostTypeLabel = (type) => {
  return (
    POST_TYPE_LABELS[type] ||
    type ||
    'Update'
  )
}


export default function BranchMyWardPosts() {

  /* ============================================================
     STATE
  ============================================================ */

  const [posts, setPosts] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [typeFilter, setTypeFilter] =
    useState('all')

  const [sortOrder, setSortOrder] =
    useState('latest')


  /* ============================================================
     LOAD POSTS
  ============================================================ */

  const loadPosts = useCallback(
    async (isRefresh = false) => {

      try {

        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError('')


        const data =
          await getBranchMyWardPosts()


        console.log(
          'Branch MyWard posts:',
          data
        )


        setPosts(
          normalizePosts(data)
        )

      } catch (err) {

        console.error(
          'Failed to load Branch MyWard posts:',
          err
        )


        if (
          err?.code === 'ERR_NETWORK'
        ) {

          setError(
            'Unable to connect to the server.'
          )

        } else {

          setError(
            err?.response?.data?.detail ||
            'Unable to load published updates.'
          )

        }


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


  /* ============================================================
     FILTER + SEARCH + SORT
  ============================================================ */

  const filteredPosts =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase()


      let result =
        [...posts]


      if (
        typeFilter !== 'all'
      ) {

        result =
          result.filter(
            (post) =>
              post.post_type ===
              typeFilter
          )

      }


      if (searchValue) {

        result =
          result.filter(
            (post) => {

              const searchable =
                [
                  post.title,
                  post.description,
                  post.location,
                  post.ward_name,
                  post.local_body_name,
                  getPostTypeLabel(
                    post.post_type
                  ),
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()


              return searchable.includes(
                searchValue
              )

            }
          )

      }


      result.sort(
        (a, b) => {

          const first =
            new Date(
              a.created_at || 0
            ).getTime()

          const second =
            new Date(
              b.created_at || 0
            ).getTime()


          return (
            sortOrder === 'oldest'
              ? first - second
              : second - first
          )

        }
      )


      return result

    }, [
      posts,
      search,
      typeFilter,
      sortOrder,
    ])


  /* ============================================================
     COUNTS
  ============================================================ */

  const counts =
    useMemo(() => {

      return {
        total:
          posts.length,

        alerts:
          posts.filter(
            (post) =>
              post.post_type ===
              'alert'
          ).length,

        updates:
          posts.filter(
            (post) =>
              post.post_type ===
              'update'
          ).length,

        actions:
          posts.filter(
            (post) =>
              post.post_type ===
              'action'
          ).length,
      }

    }, [posts])


  /* UI */

  return (

    <div className={Styles.page}>
      <BranchSidebar />
      <main className={Styles.content}>
        {/* HEADER  */}
        <header className={Styles.header}>
          <div>
            <div className={Styles.eyebrow}>
              <FaBullhorn />
              MyWard
            </div>
            <h1>
              Published Updates
            </h1>


            <p>
              View alerts, updates and public
              work notices published by your
              branch.
            </p>

          </div>


          <button
            type="button"
            className={Styles.refreshButton}
            onClick={() =>
              loadPosts(true)
            }
            disabled={refreshing}
          >

            <FaSyncAlt
              className={
                refreshing
                  ? Styles.spinning
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}

          </button>

        </header>


        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <section
          className={
            Styles.summaryGrid
          }
        >

          <div
            className={
              Styles.summaryCard
            }
          >

            <span
              className={
                Styles.summaryIcon
              }
            >
              <FaBullhorn />
            </span>

            <div>
              <strong>
                {counts.total}
              </strong>

              <span>
                Total Published
              </span>
            </div>

          </div>


          <div
            className={
              Styles.summaryCard
            }
          >

            <span
              className={
                Styles.summaryIcon
              }
            >
              <FaBell />
            </span>

            <div>
              <strong>
                {counts.alerts}
              </strong>

              <span>
                Alerts
              </span>
            </div>

          </div>


          <div
            className={
              Styles.summaryCard
            }
          >

            <span
              className={
                Styles.summaryIcon
              }
            >
              <FaBullhorn />
            </span>

            <div>
              <strong>
                {counts.updates}
              </strong>

              <span>
                Updates
              </span>
            </div>

          </div>


          <div
            className={
              Styles.summaryCard
            }
          >

            <span
              className={
                Styles.summaryIcon
              }
            >
              <FaClock />
            </span>

            <div>
              <strong>
                {counts.actions}
              </strong>

              <span>
                Work Notices
              </span>
            </div>

          </div>

        </section>


        {/* ======================================================
            FILTERS
        ====================================================== */}

        <section
          className={
            Styles.filterBar
          }
        >

          <div
            className={
              Styles.searchBox
            }
          >

            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search published updates..."
            />

          </div>


          <div
            className={
              Styles.filterControl
            }
          >

            <FaBullhorn />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All types
              </option>

              <option value="alert">
                Alerts
              </option>

              <option value="update">
                Updates
              </option>

              <option value="action">
                Action / Work Notice
              </option>

              <option value="general">
                General
              </option>

            </select>

          </div>


          <div
            className={
              Styles.filterControl
            }
          >

            <FaSortAmountDown />

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >

              <option value="latest">
                Latest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

            </select>

          </div>

        </section>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div
            className={
              Styles.errorMessage
            }
          >

            <FaExclamationCircle />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading ? (

          <div
            className={
              Styles.loadingState
            }
          >
            Loading published updates...
          </div>

        ) : filteredPosts.length === 0 ? (

          /* ====================================================
             EMPTY
          ==================================================== */

          <div
            className={
              Styles.emptyState
            }
          >

            <FaBullhorn />

            <h3>
              No published updates
            </h3>

            <p>
              {posts.length === 0
                ? 'Your branch has not published any MyWard updates yet.'
                : 'No posts match the selected filters.'}
            </p>

          </div>

        ) : (

          /* ====================================================
             POSTS
          ==================================================== */

          <section
            className={
              Styles.postsList
            }
          >

            {filteredPosts.map(
              (post) => (

                <article
                  key={post.id}
                  className={
                    Styles.postCard
                  }
                >

                  {/* ============================================
                      CARD HEADER
                  ============================================ */}

                  <div
                    className={
                      Styles.postCardHeader
                    }
                  >

                    <div>

                      <span
                        className={`${Styles.postTypeBadge} ${
                          Styles[
                            `postType_${post.post_type}`
                          ] || ''
                        }`}
                      >
                        {getPostTypeLabel(
                          post.post_type
                        )}
                      </span>


                      <h2>
                        {post.title ||
                          'Untitled update'}
                      </h2>

                    </div>


                    <span
                      className={
                        post.is_active === false
                          ? Styles.inactiveBadge
                          : Styles.activeBadge
                      }
                    >

                      {post.is_active === false
                        ? 'Inactive'
                        : 'Published'}

                    </span>

                  </div>


                  {/* ============================================
                      DESCRIPTION
                  ============================================ */}

                  <p
                    className={
                      Styles.postDescription
                    }
                  >
                    {post.description ||
                      'No description provided.'}
                  </p>


                  {/* ============================================
                      META
                  ============================================ */}

                  <div
                    className={
                      Styles.postMeta
                    }
                  >

                    <span>
                      <FaClock />

                      {formatDateTime(
                        post.created_at
                      )}
                    </span>


                    {(post.location ||
                      post.ward_name ||
                      post.local_body_name) && (

                      <span>
                        <FaMapMarkerAlt />

                        {post.ward_name
                          ? (
                              post.ward_number
                                ? `Ward ${post.ward_number} - ${post.ward_name}`
                                : post.ward_name
                            )
                          : (
                              post.location ||
                              post.local_body_name
                            )}
                      </span>

                    )}

                  </div>

                </article>

              )
            )}

          </section>

        )}

      </main>

    </div>

  )
}