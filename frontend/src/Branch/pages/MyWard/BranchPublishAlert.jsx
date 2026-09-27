import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  FaBell,
  FaBuilding,
  FaBullhorn,
  FaClock,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaSearch,
  FaSyncAlt,
  FaUserTie,
} from 'react-icons/fa'

import BranchLayout from '../../components/BranchLayout'
import Styles from './BranchPublishAlert.module.css'

import {
  getProfile,
} from '../../../api/services/Branch/Profile.js'

import {
  getBranchPublishedAlerts,
} from '../../../api/services/Branch/MyWard.js'


const POST_TYPE_LABELS = {
  alert: 'Alert',
  update: 'Update',
  action: 'Action / Work Notice',
  general: 'General',
}

const PUBLISH_UPDATE_TYPES = [
  'alert',
  'update',
  'action',
  'general',
]


const normalizePosts = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.posts)) return data.posts
  if (Array.isArray(data?.results)) return data.results
  return []
}


const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


const getAuthorLabel = (type) => {
  if (type === 'representative') return 'Representative'
  if (type === 'branch') return 'Branch'
  return 'Authority'
}


const getPostTypeLabel = (type) => {
  return POST_TYPE_LABELS[type] || 'Update'
}


const extractError = (err) => {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    'Unable to load published updates.'
  )
}


export default function BranchPublishAlert() {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [postTypeFilter, setPostTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('latest')


  const loadPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const branchProfile = await getProfile()
      setProfile(branchProfile)

      const latitude = branchProfile?.latitude
      const longitude = branchProfile?.longitude

      if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
      ) {
        setPosts([])
        setError(
          'Branch location is not configured. Set the current location from Branch Settings first.'
        )
        return
      }

      const data = await getBranchPublishedAlerts(
        latitude,
        longitude
      )

      const myWardPosts = normalizePosts(data)

      const authorityPublishedPosts = myWardPosts.filter(
        (post) =>
          (
            post.author_type === 'branch' ||
            post.author_type === 'representative'
          ) &&
          PUBLISH_UPDATE_TYPES.includes(post.post_type)
      )

      setPosts(authorityPublishedPosts)

    } catch (err) {
      console.error('Failed to load published updates:', err)
      setPosts([])
      setError(extractError(err))

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])


  useEffect(() => {
    loadPosts()
  }, [loadPosts])


  const counts = useMemo(() => {
    const branches = posts.filter(
      (item) => item.author_type === 'branch'
    ).length

    const representatives = posts.filter(
      (item) => item.author_type === 'representative'
    ).length

    return {
      total: posts.length,
      branches,
      representatives,
    }
  }, [posts])


  const filteredPosts = useMemo(() => {
    let result = [...posts]

    if (sourceFilter !== 'all') {
      result = result.filter(
        (post) => post.author_type === sourceFilter
      )
    }

    if (postTypeFilter !== 'all') {
      result = result.filter(
        (post) => post.post_type === postTypeFilter
      )
    }

    const query = search.trim().toLowerCase()

    if (query) {
      result = result.filter((post) => {
        const content = [
          post.title,
          post.description,
          post.author_name,
          post.location,
          post.ward_name,
          post.ward_number,
          post.local_body_name,
          post.constituency_name,
          getPostTypeLabel(post.post_type),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return content.includes(query)
      })
    }

    result.sort((a, b) => {
      const first = new Date(a.created_at || 0).getTime()
      const second = new Date(b.created_at || 0).getTime()

      return sortOrder === 'oldest'
        ? first - second
        : second - first
    })

    return result
  }, [
    posts,
    search,
    sourceFilter,
    postTypeFilter,
    sortOrder,
  ])


  return (
    <BranchLayout>
      <div className={Styles.page}>

        <header className={Styles.header}>
          <div>
            <div className={Styles.eyebrow}>
              <FaBullhorn />
              MyWard
            </div>

            <h1>Published Updates</h1>

            <p>
              View alerts, updates and public notices published by branches
              and representatives serving your area.
            </p>
          </div>

          <button
            type="button"
            className={Styles.refreshButton}
            onClick={() => loadPosts(true)}
            disabled={refreshing}
          >
            <FaSyncAlt
              className={refreshing ? Styles.spinning : ''}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>


        {profile?.latitude != null &&
          profile?.longitude != null && (
            <div className={Styles.locationNotice}>
              <FaMapMarkerAlt />

              <div>
                <strong>Updates for your branch area</strong>
                <span>
                  {profile.placename ||
                    profile.location ||
                    'Branch location'}
                </span>
              </div>
            </div>
          )}

        <section className={Styles.filters}>
          <div className={Styles.searchBox}>
            <FaSearch />

            <input
              type="search"
              value={search}
              placeholder="Search published updates..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={Styles.select}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Publishers</option>
            <option value="branch">Branches</option>
            <option value="representative">Representatives</option>
          </select>

          <select
            className={Styles.select}
            value={postTypeFilter}
            onChange={(e) => setPostTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="alert">Alerts</option>
            <option value="update">Updates</option>
            <option value="action">Action / Work Notices</option>
            <option value="general">General</option>
          </select>

          <select
            className={Styles.select}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </section>


        {error && (
          <div className={Styles.errorMessage}>
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}


        {loading ? (
          <div className={Styles.stateCard}>
            Loading published updates...
          </div>

        ) : filteredPosts.length === 0 ? (
          <div className={Styles.emptyState}>
            <FaBullhorn />

            <h3>No published updates found</h3>

            <p>
              {posts.length === 0
                ? 'There are currently no Branch or Representative updates published for this area.'
                : 'No published updates match your current filters.'}
            </p>
          </div>

        ) : (
          <section className={Styles.alertList}>
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className={Styles.alertCard}
              >
                <div className={Styles.cardHeader}>
                  <div className={Styles.publisher}>
                    <span
                      className={
                        post.author_type === 'representative'
                          ? Styles.repAvatar
                          : Styles.branchAvatar
                      }
                    >
                      {post.author_type === 'representative'
                        ? <FaUserTie />
                        : <FaBuilding />
                      }
                    </span>

                    <div>
                      <strong>
                        {post.author_name ||
                          getAuthorLabel(post.author_type)}
                      </strong>

                      <span>
                        {getAuthorLabel(post.author_type)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`${Styles.postTypeBadge} ${
                      Styles[`postType_${post.post_type}`] || ''
                    }`}
                  >
                    {post.post_type === 'alert'
                      ? <FaBell />
                      : <FaBullhorn />
                    }

                    {getPostTypeLabel(post.post_type)}
                  </span>
                </div>


                <div className={Styles.alertContent}>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                </div>


                {(post.location ||
                  post.ward_name ||
                  post.local_body_name ||
                  post.constituency_name) && (
                    <div className={Styles.areaInfo}>
                      <FaMapMarkerAlt />

                      <div>
                        {post.location && (
                          <strong>{post.location}</strong>
                        )}

                        <span>
                          {[
                            post.ward_name
                              ? `${
                                  post.ward_number
                                    ? `Ward ${post.ward_number} - `
                                    : ''
                                }${post.ward_name}`
                              : null,
                            post.local_body_name,
                            post.constituency_name,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                    </div>
                  )}


                <div className={Styles.cardFooter}>
                  <span>
                    <FaClock />
                    {formatDate(post.created_at)}
                  </span>

                  {Array.isArray(post.attachments) &&
                    post.attachments.length > 0 && (
                      <span>
                        {post.attachments.length}{' '}
                        attachment
                        {post.attachments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                </div>


                {Array.isArray(post.attachments) &&
                  post.attachments.length > 0 && (
                    <div className={Styles.attachments}>
                      {post.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.file}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.original_filename ||
                            'View attachment'}
                        </a>
                      ))}
                    </div>
                  )}
              </article>
            ))}
          </section>
        )}

      </div>
    </BranchLayout>
  )
}
