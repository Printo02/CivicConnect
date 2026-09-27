import { useEffect, useMemo, useState } from 'react'
import { FaBullhorn,FaChevronDown,FaChevronUp,FaRegHeart,FaHeart,
  FaPaperclip,FaUserCircle,FaBuilding,FaLandmark,FaClock,FaReply,FaSearch,FaMapMarkerAlt,FaTimes } from 'react-icons/fa'
import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'
import api from '../../../api/apiClient.js'
import { getMyWardFeed,supportComplaint,removeComplaintSupport } from '../../../api/services/User/MyWard'

const REPRESENTATIVE_TYPES = {
  LEGISLATIVE_ASSEMBLY: 'MLA',
  LOK_SABHA: 'MP',
}


const formatDate = (date) => {
  if (!date) return ''

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}


const getStatusClass = (status) => {
  const classes = {
    pending: Styles.statusPending,
    in_progress: Styles.statusProgress,
    resolved: Styles.statusResolved,
    closed: Styles.statusClosed,
    rejected: Styles.statusRejected,
  }

  return classes[status] || Styles.statusDefault
}


const getAuthorityDetails = (complaint) => {
  if (
    complaint.authority_name &&
    complaint.authority_designation
  ) {
    return {
      name: complaint.authority_name,
      designation: complaint.authority_designation,
      type: complaint.authority_type,
    }
  }

  if (complaint.local_body_representative_name) {
    return {
      name: complaint.local_body_representative_name,
      designation:
        complaint.local_body_representative_designation_display ||
        complaint.local_body_representative_designation ||
        'Ward Representative',
      type: 'representative',
    }
  }

  if (complaint.representative_name) {
    return {
      name: complaint.representative_name,
      designation:
        REPRESENTATIVE_TYPES[
          complaint.representative_constituency_type
        ] || 'Representative',
      type: 'representative',
    }
  }

  if (complaint.branch_name) {
    return {
      name: complaint.branch_name,
      designation: 'Branch',
      type: 'branch',
    }
  }

  return {
    name: 'Authority',
    designation: 'Authority',
    type: 'authority',
  }
}


const getMediaAttachments = (attachments = []) =>
  attachments.filter(
    (attachment) =>
      attachment.file_type === 'image' ||
      attachment.file_type === 'video'
  )


const AttachmentList = ({
  attachments = [],
  onImageClick,
}) => {
  const mediaAttachments =
    getMediaAttachments(attachments)

  if (!mediaAttachments.length) return null

  return (
    <div className={Styles.mediaSection}>
      <div className={Styles.sectionLabel}>
        <FaPaperclip />
        Media
        <span className={Styles.countBadge}>
          {mediaAttachments.length}
        </span>
      </div>

      <div className={Styles.mediaGrid}>
        {mediaAttachments.map((attachment) => {
          if (attachment.file_type === 'image') {
            return (
              <button
                type="button"
                key={attachment.id}
                className={Styles.imageThumbnailButton}
                onClick={() =>
                  onImageClick?.(attachment.file)
                }
              >
                <img
                  src={attachment.file}
                  alt={
                    attachment.original_filename ||
                    'Complaint attachment'
                  }
                  className={Styles.mediaImage}
                />
              </button>
            )
          }

          return (
            <div
              key={attachment.id}
              className={Styles.videoThumbnail}
            >
              <video
                className={Styles.mediaVideo}
                controls
                preload="metadata"
              >
                <source
                  src={attachment.file}
                  type={
                    attachment.mime_type ||
                    'video/mp4'
                  }
                />

                Your browser does not support video playback.
              </video>
            </div>
          )
        })}
      </div>
    </div>
  )
}


export default function UserMyWardHome() {
  const [feed, setFeed] = useState({
    posts: [],
    complaints: [],
  })

  const [myPosts, setMyPosts] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [openResponses, setOpenResponses] = useState({})

  const [activeView, setActiveView] = useState('feed')

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [sortBy, setSortBy] = useState('newest')

  const [previewImage, setPreviewImage] = useState(null)


  const loadFeed = async (latitude, longitude) => {
    try {
      setError('')

      const [feedResponse, myPostsResponse] = await Promise.all([
        getMyWardFeed(latitude, longitude),
        api.get('/complaints/my/'),
      ])

      setFeed({
        posts: feedResponse?.posts || [],
        complaints: feedResponse?.complaints || [],
      })

      const myPostsData = myPostsResponse?.data

      setMyPosts(
        Array.isArray(myPostsData)
          ? myPostsData
          : myPostsData?.results || []
      )
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Unable to load MyWard.'
      )
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        loadFeed(
          coords.latitude,
          coords.longitude
        )
      },

      () => {
        setLoading(false)

        setError(
          'Location permission is required to identify your ward.'
        )
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [])


  useEffect(() => {
    if (!previewImage) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setPreviewImage(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener(
        'keydown',
        closeOnEscape
      )
    }
  }, [previewImage])


  const toggleResponse = (complaintId) => {
    setOpenResponses((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }))
  }


  const handleSearch = () => {
    setSearchTerm(searchInput.trim())
  }


  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
  }


  const toggleSupport = async (complaint) => {
    const wasSupported = complaint.has_liked

    setFeed((prev) => ({
      ...prev,

      complaints: prev.complaints.map((item) => {
        if (item.complaint_detail?.id !== complaint.id) {
          return item
        }

        return {
          ...item,

          complaint_detail: {
            ...item.complaint_detail,
            has_liked: !wasSupported,

            like_count: Math.max(
              0,
              (item.complaint_detail.like_count || 0) +
                (wasSupported ? -1 : 1)
            ),
          },
        }
      }),
    }))

    try {
      setError('')

      if (wasSupported) {
        await removeComplaintSupport(complaint.id)
      } else {
        await supportComplaint(complaint.id)
      }
    } catch (err) {
      setFeed((prev) => ({
        ...prev,

        complaints: prev.complaints.map((item) => {
          if (item.complaint_detail?.id !== complaint.id) {
            return item
          }

          return {
            ...item,

            complaint_detail: {
              ...item.complaint_detail,
              has_liked: wasSupported,

              like_count: Math.max(
                0,
                (item.complaint_detail.like_count || 0) +
                  (wasSupported ? 1 : -1)
              ),
            },
          }
        }),
      }))

      setError(
        err?.response?.data?.detail ||
        'Unable to update support.'
      )
    }
  }


  const visibleComplaints = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    const filtered = feed.complaints.filter((item) => {
      const complaint = item.complaint_detail

      if (!complaint) return false
      if (!normalizedSearch) return true

      const authority = getAuthorityDetails(complaint)

      const values = [
        complaint.id,
        `#${complaint.id}`,
        complaint.title,
        complaint.description,
        complaint.citizen_name,
        complaint.location,
        complaint.constituency_name,
        complaint.status_display,
        authority.name,
        authority.designation,
      ]

      return values.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    })

    return [...filtered].sort((a, b) => {
      const complaintA = a.complaint_detail || {}
      const complaintB = b.complaint_detail || {}

      if (sortBy === 'support') {
        const difference =
          (complaintB.like_count || 0) -
          (complaintA.like_count || 0)

        if (difference !== 0) {
          return difference
        }
      }

      const dateA = new Date(
        a.shared_at ||
        a.created_at ||
        complaintA.shared_at ||
        complaintA.created_at ||
        0
      ).getTime()

      const dateB = new Date(
        b.shared_at ||
        b.created_at ||
        complaintB.shared_at ||
        complaintB.created_at ||
        0
      ).getTime()

      if (sortBy === 'oldest') {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [feed.complaints, searchTerm, sortBy])


  return (
    <div className={Styles.page}>
      <aside className={Styles.sidebarStretch}>
        <div className={Styles.sidebarInner}>
          <MyWardSidebar />
        </div>
      </aside>

      <main className={Styles.content}>
        <header className={Styles.header}>
          <div>
            <div className={Styles.headerEyebrow}>
              <FaLandmark />
              CivicConnect Community
            </div>

            <h1>My Ward</h1>

            <p>
              View posts and complaints shared in your
              ward, track authority responses and support
              issues that affect your area.
            </p>
          </div>
        </header>


        <div className={Styles.viewToggle}>
          <button
            type="button"
            className={
              activeView === 'feed'
                ? Styles.viewToggleActive
                : Styles.viewToggleButton
            }
            onClick={() => setActiveView('feed')}
          >
            Feed
          </button>

          <button
            type="button"
            className={
              activeView === 'posts'
                ? Styles.viewToggleActive
                : Styles.viewToggleButton
            }
            onClick={() => setActiveView('posts')}
          >
            My Posts
          </button>
        </div>


        {error && (
          <div className={Styles.errorBox}>
            {error}
          </div>
        )}


        {loading && (
          <div className={Styles.loadingCard}>
            <div className={Styles.spinner} />

            <div>
              <strong>Loading your ward</strong>

              <span>
                Finding local updates and complaints...
              </span>
            </div>
          </div>
        )}


        {!loading && activeView === 'posts' && (
          <section className={Styles.feedSection}>
            <div className={Styles.sectionHeader}>
              <div>
                <span className={Styles.sectionEyebrow}>
                  My Posts
                </span>

                <h2>Complaints posted by you</h2>
              </div>

              <span className={Styles.resultCount}>
                {myPosts.length}{' '}
                {myPosts.length === 1
                  ? 'complaint'
                  : 'complaints'}
              </span>
            </div>


            {!myPosts.length && (
              <div className={Styles.emptyState}>
                <FaBullhorn />

                <h3>No posts yet</h3>

                <p>
                  You have not posted any complaints yet.
                </p>
              </div>
            )}


            <div className={Styles.complaintList}>
              {myPosts.map((complaint) => (
                <article
                  className={Styles.complaintCard}
                  key={`my-${complaint.id}`}
                >
                  <div className={Styles.complaintHeader}>
                    <div className={Styles.complaintIdentity}>
                      <div className={Styles.complaintId}>
                        Complaint ID: #{complaint.id}
                      </div>

                      <div className={Styles.citizen}>
                        <FaUserCircle />

                        <span>
                          <small>Posted by</small>

                          <strong>
                            {complaint.citizen_name || 'You'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`
                        ${Styles.status}
                        ${getStatusClass(complaint.status)}
                      `}
                    >
                      {complaint.status_display || complaint.status}
                    </span>
                  </div>


                  <div className={Styles.complaintMain}>
                    <h2 className={Styles.complaintTitle}>
                      {complaint.title}
                    </h2>

                    <p className={Styles.description}>
                      {complaint.description ||
                        'No description provided.'}
                    </p>
                  </div>


                  <div className={Styles.locationRow}>
                    <span className={Styles.locationIcon}>
                      <FaMapMarkerAlt />
                    </span>

                    <div>
                      <small>Location</small>

                      <strong>
                        {complaint.location ||
                          complaint.constituency_name ||
                          'Location not provided'}
                      </strong>
                    </div>
                  </div>


                  <div className={Styles.complaintFooter}>
                    <div className={Styles.footerInfo}>
                      {complaint.created_at && (
                        <span>
                          <FaClock />
                          {formatDate(complaint.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}



        {!loading && activeView === 'feed' && (
          <section className={Styles.feedSection}>
            <div className={Styles.sectionHeader}>
              <div>
                <span className={Styles.sectionEyebrow}>
                  Community Feed
                </span>

                <h2>Complaints shared near you</h2>
              </div>

              <span className={Styles.resultCount}>
                {visibleComplaints.length}{' '}
                {visibleComplaints.length === 1
                  ? 'complaint'
                  : 'complaints'}
              </span>
            </div>


            <div className={Styles.feedToolbar}>
              <div className={Styles.searchGroup}>
                <div className={Styles.searchBox}>
                  <FaSearch />

                  <input
                    type="text"
                    value={searchInput}
                    placeholder="Search complaint ID, title, citizen or location..."
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                  />

                  {searchInput && (
                    <button
                      type="button"
                      className={Styles.clearSearchButton}
                      onClick={clearSearch}
                      aria-label="Clear complaint search"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={Styles.searchButton}
                  onClick={handleSearch}
                >
                  <FaSearch />
                  Search
                </button>
              </div>


              <div className={Styles.sortBox}>
                <label htmlFor="ward-sort">
                  Sort by
                </label>

                <select
                  id="ward-sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="oldest">
                    Oldest
                  </option>

                  <option value="support">
                    Most supported
                  </option>
                </select>
              </div>
            </div>


            {searchTerm && (
              <div className={Styles.searchSummary}>
                Showing results for
                <strong> “{searchTerm}”</strong>

                <button
                  type="button"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              </div>
            )}


            {!visibleComplaints.length && (
              <div className={Styles.emptyState}>
                <FaBullhorn />

                <h3>
                  {searchTerm
                    ? 'No matching complaints'
                    : 'No shared complaints'}
                </h3>

                <p>
                  {searchTerm
                    ? 'Try another complaint ID, title, citizen name or location.'
                    : 'There are currently no complaints shared in your ward.'}
                </p>
              </div>
            )}


            <div className={Styles.complaintList}>
              {visibleComplaints.map((item) => {
                const complaint =
                  item.complaint_detail

                if (!complaint) return null

                const responses =
                  complaint.responses || []

                const authority =
                  getAuthorityDetails(complaint)

                const responseOpen =
                  !!openResponses[complaint.id]

                const mediaCount =
                  getMediaAttachments(
                    complaint.attachments || []
                  ).length

                return (
                  <article
                    className={Styles.complaintCard}
                    key={`c-${complaint.id}`}
                  >
                    <div className={Styles.complaintHeader}>
                      <div className={Styles.complaintIdentity}>
                        <div className={Styles.complaintId}>
                          Complaint ID: #{complaint.id}
                        </div>

                        <div className={Styles.citizen}>
                          <FaUserCircle />

                          <span>
                            <small>
                              Complaint by
                            </small>

                            <strong>
                              {complaint.citizen_name ||
                                'Citizen'}
                            </strong>
                          </span>
                        </div>
                      </div>


                      <span
                        className={`
                          ${Styles.status}
                          ${getStatusClass(
                            complaint.status
                          )}
                        `}
                      >
                        {complaint.status_display ||
                          complaint.status}
                      </span>
                    </div>


                    <div className={Styles.complaintMain}>
                      <h2 className={Styles.complaintTitle}>
                        {complaint.title}
                      </h2>

                      <p className={Styles.description}>
                        {complaint.description ||
                          'No description provided.'}
                      </p>
                    </div>


                    <div className={Styles.locationRow}>
                      <span className={Styles.locationIcon}>
                        <FaMapMarkerAlt />
                      </span>

                      <div>
                        <small>Location</small>

                        <strong>
                          {complaint.location ||
                            complaint.constituency_name ||
                            'Location not provided'}
                        </strong>
                      </div>
                    </div>


                    <div className={Styles.authorityBox}>
                      <div className={Styles.authorityIcon}>
                        {authority.type === 'branch'
                          ? <FaBuilding />
                          : <FaLandmark />}
                      </div>

                      <div className={Styles.authorityContent}>
                        <span className={Styles.authorityLabel}>
                          Complaint addressed to
                        </span>

                        <strong>
                          {authority.name}
                        </strong>

                        <span className={Styles.designation}>
                          {authority.designation}

                          {complaint.constituency_name && (
                            <>
                              {' · '}
                              {complaint.constituency_name}
                            </>
                          )}
                        </span>
                      </div>
                    </div>


                    <AttachmentList
                      attachments={
                        complaint.attachments || []
                      }
                      onImageClick={setPreviewImage}
                    />


                    <div className={Styles.responseSection}>
                      <button
                        type="button"
                        className={Styles.responseToggle}
                        onClick={() =>
                          toggleResponse(complaint.id)
                        }
                        aria-expanded={responseOpen}
                      >
                        <span className={Styles.responseToggleLeft}>
                          <span className={Styles.responseIcon}>
                            <FaReply />
                          </span>

                          <span>
                            <strong>
                              Authority responses
                            </strong>

                            <small>
                              {responses.length
                                ? `${responses.length} response${
                                    responses.length > 1
                                      ? 's'
                                      : ''
                                  } received`
                                : 'No response received yet'}
                            </small>
                          </span>
                        </span>

                        {responseOpen
                          ? <FaChevronUp />
                          : <FaChevronDown />}
                      </button>


                      {responseOpen && (
                        <div className={Styles.responseDropdown}>
                          {!responses.length ? (
                            <div className={Styles.noResponse}>
                              <FaReply />

                              <div>
                                <strong>
                                  Awaiting authority response
                                </strong>

                                <p>
                                  No official response has been
                                  published for this complaint yet.
                                </p>
                              </div>
                            </div>
                          ) : (
                            responses.map(
                              (response, index) => (
                                <div
                                  className={Styles.responseCard}
                                  key={
                                    response.id ||
                                    `${complaint.id}-${index}`
                                  }
                                >
                                  <div className={Styles.responseHead}>
                                    <div className={Styles.responseAvatar}>
                                      {response.authority_type ===
                                        'Branch' ||
                                      response.authority_type ===
                                        'Branch Employee'
                                        ? <FaBuilding />
                                        : <FaLandmark />}
                                    </div>

                                    <div className={Styles.responseAuthority}>
                                      <strong>
                                        {response.authority_name ||
                                          'Authority'}
                                      </strong>

                                      <span>
                                        {response.authority_designation ||
                                          response.authority_type ||
                                          'Authority'}
                                      </span>
                                    </div>

                                    {response.created_at && (
                                      <span className={Styles.responseDate}>
                                        {formatDate(
                                          response.created_at
                                        )}
                                      </span>
                                    )}
                                  </div>


                                  <p className={Styles.responseText}>
                                    {response.response}
                                  </p>


                                  <AttachmentList
                                    attachments={
                                      response.attachments || []
                                    }
                                    onImageClick={
                                      setPreviewImage
                                    }
                                  />
                                </div>
                              )
                            )
                          )}
                        </div>
                      )}
                    </div>


                    <div className={Styles.complaintFooter}>
                      <div className={Styles.footerInfo}>
                        {complaint.created_at && (
                          <span>
                            <FaClock />

                            {formatDate(
                              complaint.created_at
                            )}
                          </span>
                        )}

                        {!!mediaCount && (
                          <span>
                            <FaPaperclip />

                            {mediaCount}{' '}
                            {mediaCount === 1
                              ? 'media file'
                              : 'media files'}
                          </span>
                        )}
                      </div>


                      <button
                        type="button"
                        className={
                          complaint.has_liked
                            ? Styles.supportedButton
                            : Styles.supportButton
                        }
                        onClick={() =>
                          toggleSupport(complaint)
                        }
                      >
                        {complaint.has_liked
                          ? <FaHeart />
                          : <FaRegHeart />}

                        <span>
                          {complaint.has_liked
                            ? 'Supported'
                            : 'Support'}
                        </span>

                        <span className={Styles.supportCount}>
                          {complaint.like_count || 0}
                        </span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>


      {previewImage && (
        <div
          className={Styles.imageModalBackdrop}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className={Styles.imageModal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className={Styles.imageModalClose}
              onClick={() =>
                setPreviewImage(null)
              }
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>

            <img
              src={previewImage}
              alt="Complaint attachment preview"
              className={Styles.previewImage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
