import { useEffect, useState } from 'react'
import {
  FaBullhorn,
  FaMapMarkerAlt,
  FaClock,
  FaUserTie,
  FaExclamationCircle
} from 'react-icons/fa'

import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'

import { getMyWardFeed } from '../../../api/services/User/MyWard'
import { getNearbyAuthorities } from '../../../api/services/User/Complaint'


// ============================================================
// ALLOWED CATEGORIES
// ============================================================

const CATEGORY_CONFIG = {
  update: 'Updates',
  work_notice: 'Work Notices',
  general: 'General'
}


// ============================================================
// HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}


const getInitial = (name) => {
  return name?.trim()?.charAt(0)?.toUpperCase() || 'A'
}


const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
}


const normalizeCategory = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')

  if (normalized === 'updates') return 'update'
  if (normalized === 'work_notices') return 'work_notice'

  return normalized
}


const getPostCategoryKey = (post) => {
  return normalizeCategory(
    post?._feedCategory ||
    post?.category_slug ||
    post?.category_key ||
    post?.post_type ||
    post?.type ||
    post?.category?.slug ||
    post?.category?.name ||
    post?.category ||
    ''
  )
}


const getPostCategoryLabel = (post) => {
  const key = getPostCategoryKey(post)
  return CATEGORY_CONFIG[key] || ''
}


const getPostsFromFeed = (data, fallbackCategory) => {
  const items = Array.isArray(data?.posts)
    ? data.posts
    : []

  return items.map((post) => ({
    ...post,
    _feedCategory:
      getPostCategoryKey(post) ||
      fallbackCategory
  }))
}


// ============================================================
// GET REPRESENTATIVE NAME
// ============================================================

const getRepresentativeName = (representative) => {
  return (
    representative?.name ||
    representative?.full_name ||
    representative?.representative_name ||
    representative?.user_name ||
    representative?.user?.name ||
    representative?.user?.full_name ||
    representative?.user_details?.name ||
    representative?.user_details?.full_name ||
    representative?.user_profile?.name ||
    representative?.user_profile?.full_name ||
    ''
  )
}


// ============================================================
// GET BRANCH NAME
// ============================================================

const getBranchName = (branch) => {
  return (
    branch?.name ||
    branch?.branch_name ||
    branch?.username ||
    branch?.user?.username ||
    branch?.user_details?.user?.username ||
    ''
  )
}


// ============================================================
// FIND AUTHORITY FOR A POST
// ============================================================

const findAuthorityForPost = (
  post,
  representatives = [],
  branches = []
) => {
  const authorName = normalizeText(post?.author_name)

  const representativeId =
    post?.representative_id ||
    post?.author_representative_id ||
    post?.target_representative_id ||
    null

  const branchId =
    post?.branch_id ||
    post?.author_branch_id ||
    post?.target_branch_id ||
    null


  // Representative ID match
  if (representativeId) {
    const representative = representatives.find(
      (item) =>
        String(item?.id) === String(representativeId)
    )

    if (representative) {
      return {
        type: 'REPRESENTATIVE',
        data: representative
      }
    }
  }


  // Branch ID match
  if (branchId) {
    const branch = branches.find(
      (item) =>
        String(item?.id) === String(branchId)
    )

    if (branch) {
      return {
        type: 'BRANCH',
        data: branch
      }
    }
  }


  // Representative name match
  if (authorName) {
    const representative = representatives.find((item) => {
      const name = normalizeText(
        getRepresentativeName(item)
      )

      return (
        name &&
        (
          name === authorName ||
          name.includes(authorName) ||
          authorName.includes(name)
        )
      )
    })

    if (representative) {
      return {
        type: 'REPRESENTATIVE',
        data: representative
      }
    }
  }


  // Branch name / username match
  if (authorName) {
    const branch = branches.find((item) => {
      const name = normalizeText(
        getBranchName(item)
      )

      return (
        name &&
        (
          name === authorName ||
          name.includes(authorName) ||
          authorName.includes(name)
        )
      )
    })

    if (branch) {
      return {
        type: 'BRANCH',
        data: branch
      }
    }
  }

  return null
}


// ============================================================
// ENRICH POST WITH AUTHORITY DETAILS
// ============================================================

const enrichPost = (
  post,
  representatives,
  branches
) => {
  const matchedAuthority = findAuthorityForPost(
    post,
    representatives,
    branches
  )

  if (!matchedAuthority) {
    return post
  }

  const authority = matchedAuthority.data

  const constituency =
    authority?.constituency ||
    authority?.current_constituency ||
    {}

  const department =
    authority?.department ||
    authority?.dept ||
    {}

  const user =
    authority?.user ||
    authority?.user_details?.user ||
    authority?.user_profile?.user ||
    {}


  // Representative
  if (matchedAuthority.type === 'REPRESENTATIVE') {
    return {
      ...post,

      author_type:
        post.author_type ||
        'REPRESENTATIVE',

      constituency_type:
        post.constituency_type ||
        authority?.constituency_type ||
        constituency?.type ||
        '',

      constituency_name:
        post.constituency_name ||
        authority?.constituency_name ||
        constituency?.name ||
        authority?.local_body_name ||
        '',

      district_name:
        post.district_name ||
        authority?.district_name ||
        constituency?.district_name ||
        constituency?.district?.name ||
        ''
    }
  }


  // Branch
  return {
    ...post,

    author_type:
      post.author_type ||
      'BRANCH',

    branch_username:
      post.branch_username ||
      authority?.branch_username ||
      authority?.username ||
      user?.username ||
      authority?.user_details?.user?.username ||
      '',

    branch_abbreviation:
      post.branch_abbreviation ||
      authority?.branch_abbreviation ||
      authority?.abbreviation ||
      authority?.abv ||
      department?.abbreviation ||
      department?.abv ||
      '',

    branch_name:
      post.branch_name ||
      authority?.branch_name ||
      authority?.name ||
      '',

    district_name:
      post.district_name ||
      authority?.district_name ||
      authority?.district?.name ||
      ''
  }
}


// ============================================================
// AUTHORITY LABEL
// ============================================================

const getAuthorityLabel = (post) => {
  if (!post) return ''

  const authorType = String(
    post.author_type ||
    post.author_role ||
    post.role ||
    ''
  )
    .trim()
    .toUpperCase()

  const constituencyType = String(
    post.constituency_type ||
    post.representative_type ||
    ''
  )
    .trim()
    .toUpperCase()

  const constituencyName =
    post.constituency_name ||
    post.local_body_name ||
    post.constituency?.name ||
    ''


  // Legislative Assembly -> MLA
  if (
    constituencyType === 'LEGISLATIVE_ASSEMBLY' ||
    constituencyType === 'LEGISLATIVE ASSEMBLY'
  ) {
    return constituencyName
      ? `MLA • ${constituencyName}`
      : 'MLA'
  }


  // Lok Sabha -> MP
  if (
    constituencyType === 'LOK_SABHA' ||
    constituencyType === 'LOK SABHA'
  ) {
    return constituencyName
      ? `MP • ${constituencyName}`
      : 'MP'
  }


  // Municipality / Corporation -> Councillor
  if (
    constituencyType === 'MUNICIPALITY' ||
    constituencyType === 'CORPORATION' ||
    constituencyType === 'MUNICIPAL_CORPORATION'
  ) {
    return constituencyName
      ? `Councillor • ${constituencyName}`
      : 'Councillor'
  }


  // Panchayats -> Member
  if (
    constituencyType === 'GRAMA_PANCHAYAT' ||
    constituencyType === 'GRAMA PANCHAYAT' ||
    constituencyType === 'BLOCK_PANCHAYAT' ||
    constituencyType === 'BLOCK PANCHAYAT' ||
    constituencyType === 'DISTRICT_PANCHAYAT' ||
    constituencyType === 'DISTRICT PANCHAYAT'
  ) {
    return constituencyName
      ? `Member • ${constituencyName}`
      : 'Member'
  }


  // Branch -> username • abbreviation
  if (
    authorType === 'BRANCH' ||
    post.branch_username ||
    post.branch_abbreviation
  ) {
    const username =
      post.branch_username ||
      post.author_username ||
      post.username ||
      ''

    const abbreviation =
      post.branch_abbreviation ||
      post.department_abbreviation ||
      post.department_abv ||
      post.abbreviation ||
      ''

    if (username && abbreviation) {
      return `${username} • ${abbreviation}`
    }

    if (username) {
      return username
    }

    if (abbreviation) {
      return abbreviation
    }

    return 'Government Branch'
  }


  if (authorType === 'REPRESENTATIVE') {
    return constituencyName
      ? `Representative • ${constituencyName}`
      : 'Representative'
  }

  return ''
}


// ============================================================
// LOCATION LABEL
// ============================================================

const getLocationLabel = (post) => {
  if (!post) return 'Your locality'

  if (post.ward_name && post.local_body_name) {
    return `${post.ward_name} • ${post.local_body_name}`
  }

  if (post.ward_number && post.local_body_name) {
    return `Ward ${post.ward_number} • ${post.local_body_name}`
  }

  if (post.ward_name) {
    return post.ward_name
  }

  if (post.local_body_name) {
    return post.local_body_name
  }

  if (post.constituency_name) {
    return post.constituency_name
  }

  if (post.location_name) {
    return post.location_name
  }

  if (
    typeof post.location === 'string' &&
    post.location.trim()
  ) {
    return post.location
  }

  if (post.district_name) {
    return post.district_name
  }

  return 'Your locality'
}


// ============================================================
// COMPONENT
// ============================================================

export default function UserMyWardUpdates() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    if (!navigator.geolocation) {
      setError(
        'Location is not supported by your browser.'
      )
      setLoading(false)
      return
    }


    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setLoading(true)
          setError('')

          const latitude = coords.latitude
          const longitude = coords.longitude


          // Only these three categories are loaded:
          // Updates, Work Notices, General
          const [
            updatesData,
            workNoticesData,
            generalData,
            nearbyData
          ] = await Promise.all([
            getMyWardFeed(
              latitude,
              longitude,
              'update'
            ),

            getMyWardFeed(
              latitude,
              longitude,
              'work_notice'
            ),

            getMyWardFeed(
              latitude,
              longitude,
              'general'
            ),

            getNearbyAuthorities(
              latitude,
              longitude,
              15
            ).catch(() => ({}))
          ])


          const feedPosts = [
            ...getPostsFromFeed(
              updatesData,
              'update'
            ),
            ...getPostsFromFeed(
              workNoticesData,
              'work_notice'
            ),
            ...getPostsFromFeed(
              generalData,
              'general'
            )
          ]


          // Keep only Updates, Work Notices and General.
          const allowedPosts = feedPosts.filter((post) =>
            Object.prototype.hasOwnProperty.call(
              CATEGORY_CONFIG,
              getPostCategoryKey(post)
            )
          )


          // Remove duplicate posts by ID.
          const uniquePosts = Array.from(
            new Map(
              allowedPosts.map((post) => [
                String(post.id),
                post
              ])
            ).values()
          )


          const representatives =
            nearbyData?.representatives ||
            nearbyData?.representative ||
            nearbyData?.nearby_representatives ||
            []

          const branches =
            nearbyData?.branches ||
            nearbyData?.branch ||
            nearbyData?.nearby_branches ||
            []


          const enrichedPosts = uniquePosts.map((post) =>
            enrichPost(
              post,
              Array.isArray(representatives)
                ? representatives
                : [],
              Array.isArray(branches)
                ? branches
                : []
            )
          )


          const sortedPosts = [...enrichedPosts].sort(
            (a, b) =>
              new Date(b?.created_at || 0) -
              new Date(a?.created_at || 0)
          )


          setPosts(sortedPosts)

        } catch (err) {
          console.error(
            'Failed to load ward posts:',
            err
          )

          setPosts([])

          setError(
            err?.response?.data?.detail ||
            'Unable to load posts right now.'
          )

        } finally {
          setLoading(false)
        }
      },


      (locationError) => {
        console.error(
          'Location error:',
          locationError
        )

        const locationErrors = {
          [locationError.PERMISSION_DENIED]:
            'Location access is required to show posts from your ward.',

          [locationError.POSITION_UNAVAILABLE]:
            'Your current location is unavailable.',

          [locationError.TIMEOUT]:
            'Location request timed out.'
        }

        setError(
          locationErrors[locationError.code] ||
          'Unable to access your current location.'
        )

        setLoading(false)
      },


      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }, [])


  return (
    <div className={Styles.page}>

      <aside className={Styles.sidebarStretch}>
        <div className={Styles.sidebarInner}>
          <MyWardSidebar />
        </div>
      </aside>


      <main className={Styles.content}>

        {/* Header */}
        <div className={Styles.header}>
          <div>
            <div className={Styles.headerLabel}>
              <FaMapMarkerAlt />
              <span>My Ward</span>
            </div>

            <h1>Updates</h1>

            <p>
              Stay informed about Updates, Work Notices and
              General announcements from your locality.
            </p>
          </div>

          <div className={Styles.headerIcon}>
            <FaBullhorn />
          </div>
        </div>


        {/* Section title */}
        <div className={Styles.sectionHeader}>
          <div>
            <h2>Latest Posts</h2>

            {!loading && !error && (
              <span>
                {posts.length}{' '}
                {posts.length === 1 ? 'post' : 'posts'}
              </span>
            )}
          </div>
        </div>


        {/* Loading */}
        {loading && (
          <div className={Styles.loading}>
            <div className={Styles.spinner}></div>
            <p>Finding posts from your ward...</p>
          </div>
        )}


        {/* Error */}
        {!loading && error && (
          <div className={Styles.errorState}>
            <div className={Styles.errorIcon}>
              <FaExclamationCircle />
            </div>

            <h3>Couldn't load posts</h3>
            <p>{error}</p>
          </div>
        )}


        {/* Empty */}
        {!loading && !error && posts.length === 0 && (
          <div className={Styles.empty}>
            <div className={Styles.emptyIcon}>
              <FaBullhorn />
            </div>

            <h3>No posts yet</h3>

            <p>
              There are currently no Updates, Work Notices
              or General posts available for your locality.
            </p>
          </div>
        )}


        {/* Feed */}
        {!loading && !error && posts.length > 0 && (
          <div className={Styles.feed}>
            {posts.map((post) => {
              const authorityLabel =
                getAuthorityLabel(post)

              const locationLabel =
                getLocationLabel(post)

              const categoryLabel =
                getPostCategoryLabel(post)

              return (
                <article
                  className={Styles.card}
                  key={`${getPostCategoryKey(post)}-${post.id}`}
                >
                  <div className={Styles.cardAccent}></div>

                  <div className={Styles.cardContent}>

                    {/* Author */}
                    <div className={Styles.cardTop}>
                      <div className={Styles.author}>
                        <div className={Styles.avatar}>
                          {getInitial(post.author_name)}
                        </div>

                        <div>
                          <div className={Styles.authorName}>
                            {post.author_name || 'Local Authority'}
                          </div>

                          {authorityLabel && (
                            <div className={Styles.authorRole}>
                              <FaUserTie />
                              <span>{authorityLabel}</span>
                            </div>
                          )}

                          {post.created_at && (
                            <div
                              className={Styles.authorRole}
                              style={{ fontWeight: 700 }}
                            >
                              <FaClock />
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Only: Updates / Work Notices / General */}
                      <span className={Styles.updateBadge}>
                        <FaBullhorn />
                        {categoryLabel}
                      </span>
                    </div>


                    {/* Content */}
                    <div className={Styles.cardBody}>
                      <h3>{post.title}</h3>
                      <p>{post.description}</p>
                    </div>


                    {/* Footer */}
                    <div className={Styles.cardFooter}>
                      <span className={Styles.localBadge}>
                        <FaMapMarkerAlt />
                        {locationLabel}
                      </span>
                    </div>

                  </div>
                </article>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
