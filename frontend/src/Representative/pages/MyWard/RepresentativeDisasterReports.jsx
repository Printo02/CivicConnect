import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaCheckCircle,
  FaClock,
  FaCommentDots,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaSortAmountDown,
  FaSyncAlt,
  FaTimesCircle,
  FaUser,
} from 'react-icons/fa'

import RepresentativeLayout from '../../components/RepresentativeLayout'
import Styles from './RepresentativeMyWardDisasters.module.css'

import {
  getRepresentativeDisasters,
  reviewRepresentativeDisaster,
} from '../../../api/services/Representative/MyWard'


const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'verified', label: 'Authority Verified' },
]


const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


const resolveMediaUrl = (value) => {
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000'

  const backendBase = configuredBase
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '')

  return backendBase + (
    value.startsWith('/')
      ? value
      : `/${value}`
  )
}


const getMapUrl = (lat, lng) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(
    `${lat},${lng}`
  )}&z=16&output=embed`


const getGoogleMapsUrl = (lat, lng) =>
  `https://www.google.com/maps?q=${encodeURIComponent(
    `${lat},${lng}`
  )}`


const getLocationText = (post) => {
  if (post.ward_name) {
    const ward = post.ward_number
      ? `Ward ${post.ward_number} - ${post.ward_name}`
      : post.ward_name

    return post.local_body_name
      ? `${ward}, ${post.local_body_name}`
      : ward
  }

  return (
    post.location ||
    post.constituency_name ||
    'Location unavailable'
  )
}


const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data === 'object' && data) {
    const firstValue = Object.values(data)[0]

    if (Array.isArray(firstValue)) {
      return firstValue[0] || fallback
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return fallback
}


export default function RepresentativeDisasterReports() {
  const [disasters, setDisasters] = useState([])
  const [representative, setRepresentative] = useState(null)

  const [filter, setFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('latest')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [reviewDrafts, setReviewDrafts] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [actionMessage, setActionMessage] = useState({})


  const loadDisasters = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError('')

        const params = {
          sort: sortOrder,
        }

        if (filter !== 'all') {
          params.status = filter
        }

        const data = await getRepresentativeDisasters(params)

        setRepresentative(data?.representative || null)

        setDisasters(
          Array.isArray(data?.disasters)
            ? data.disasters
            : []
        )
      } catch (err) {
        console.error(
          'Failed to load representative disaster reports:',
          err
        )

        setError(
          getErrorMessage(
            err,
            'Unable to load disaster reports.'
          )
        )

        setDisasters([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filter, sortOrder]
  )


  useEffect(() => {
    loadDisasters()
  }, [loadDisasters])


  const stats = useMemo(() => {
    const total = disasters.length

    const verified = disasters.filter(
      (item) => item.officially_verified === true
    ).length

    const needsReview = disasters.filter((item) => {
      const reviews = Array.isArray(item.authority_reviews)
        ? item.authority_reviews
        : []

      return reviews.length === 0
    }).length

    return {
      total,
      verified,
      needsReview,
    }
  }, [disasters])


  const setDraft = (disasterId, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [disasterId]: value,
    }))
  }


  const updatePostFromReview = (disasterId, result) => {
    setDisasters((current) =>
      current.map((item) => {
        if (item.id !== disasterId) {
          return item
        }

        const review = result?.review

        const nextReviews = Array.isArray(item.authority_reviews)
          ? [...item.authority_reviews]
          : []

        /*
         * Backend now creates a NEW authority-review row for every
         * comment / verification action. Therefore the frontend must
         * append to history rather than replace an existing entry.
         */
        if (review) {
          nextReviews.unshift(review)
        }

        return {
          ...item,
          officially_verified:
            result?.officially_verified ??
            item.officially_verified,
          authority_reviews: nextReviews,
        }
      })
    )
  }


  const submitReview = async (
    disaster,
    { verification = null } = {}
  ) => {
    const comment = (
      reviewDrafts[disaster.id] || ''
    ).trim()

    /*
     * Comment-only:
     *   verification === null
     *
     * Verified:
     *   verification === true
     *
     * Not Verified:
     *   verification === false
     */
    if (!comment && verification === null) {
      setActionMessage((current) => ({
        ...current,
        [disaster.id]: {
          type: 'error',
          text: 'Add a comment before saving.',
        },
      }))

      return
    }

    try {
      setSubmittingId(disaster.id)

      setActionMessage((current) => ({
        ...current,
        [disaster.id]: null,
      }))

      const payload = {}

      if (comment) {
        payload.comment = comment
      }

      if (verification !== null) {
        payload.is_verified = verification
      }

      const result = await reviewRepresentativeDisaster(
        disaster.id,
        payload
      )

      updatePostFromReview(
        disaster.id,
        result
      )

      setReviewDrafts((current) => ({
        ...current,
        [disaster.id]: '',
      }))

      let successText = 'Comment added.'

      if (verification === true) {
        successText = 'Report marked as verified.'
      }

      if (verification === false) {
        successText = 'Report marked as not verified.'
      }

      setActionMessage((current) => ({
        ...current,
        [disaster.id]: {
          type: 'success',
          text: successText,
        },
      }))
    } catch (err) {
      console.error(
        'Failed to review disaster:',
        err
      )

      setActionMessage((current) => ({
        ...current,
        [disaster.id]: {
          type: 'error',
          text: getErrorMessage(
            err,
            'Unable to save your review.'
          ),
        },
      }))
    } finally {
      setSubmittingId(null)
    }
  }


  return (
    <RepresentativeLayout>
      <div className={Styles.page}>

        <header className={Styles.pageHeader}>
          <div>
            <div className={Styles.eyebrow}>
              <FaExclamationTriangle />
              MyWard
            </div>

            <h1>Disaster Reports</h1>

            <p>
              Review citizen-reported disasters within your
              constituency, record verification decisions,
              and add official comments.
            </p>

            {representative?.constituency_name && (
              <div className={Styles.constituencyChip}>
                <FaMapMarkerAlt />
                {representative.constituency_name}
              </div>
            )}
          </div>

          <button
            type="button"
            className={Styles.refreshButton}
            onClick={() => loadDisasters(true)}
            disabled={loading || refreshing}
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
              : 'Refresh'}
          </button>
        </header>


        <section className={Styles.statsGrid}>
          <div className={Styles.statCard}>
            <span>Total reports</span>
            <strong>{stats.total}</strong>
          </div>

          <div className={Styles.statCard}>
            <span>Needs review</span>
            <strong>{stats.needsReview}</strong>
          </div>

          <div className={Styles.statCard}>
            <span>Authority verified</span>
            <strong>{stats.verified}</strong>
          </div>
        </section>


        <div className={Styles.toolbar}>
          <div className={Styles.filterGroup}>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`${Styles.filterButton} ${
                  filter === item.value
                    ? Styles.filterButtonActive
                    : ''
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className={Styles.sortControl}>
            <FaSortAmountDown />

            <span>Sort</span>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
            >
              <option value="latest">
                Latest first
              </option>

              <option value="oldest">
                Oldest first
              </option>
            </select>
          </label>
        </div>


        {loading && (
          <div className={Styles.stateCard}>
            <div className={Styles.loader} />

            <h3>Loading disaster reports</h3>

            <p>
              Fetching reports for your constituency.
            </p>
          </div>
        )}


        {!loading && error && (
          <div
            className={`${Styles.stateCard} ${Styles.errorState}`}
          >
            <FaExclamationTriangle />

            <h3>Unable to load reports</h3>

            <p>{error}</p>

            <button
              type="button"
              className={Styles.primaryButton}
              onClick={() => loadDisasters()}
            >
              Try Again
            </button>
          </div>
        )}


        {!loading &&
          !error &&
          disasters.length === 0 && (
            <div className={Styles.stateCard}>
              <FaShieldAlt />

              <h3>No disaster reports found</h3>

              <p>
                There are no reports matching the
                selected filter.
              </p>
            </div>
          )}


        {!loading &&
          !error &&
          disasters.length > 0 && (
            <div className={Styles.disasterList}>
              {disasters.map((disaster) => {
                const attachments =
                  Array.isArray(disaster.attachments)
                    ? disaster.attachments
                    : []

                const reviews =
                  Array.isArray(disaster.authority_reviews)
                    ? disaster.authority_reviews
                    : []

                const latitude =
                  Number(disaster.latitude)

                const longitude =
                  Number(disaster.longitude)

                const hasCoordinates =
                  Number.isFinite(latitude) &&
                  Number.isFinite(longitude)

                const feedback =
                  actionMessage[disaster.id]

                const isSubmitting =
                  submittingId === disaster.id

                const hasExplicitNotVerified =
                  reviews.some(
                    (review) =>
                      review.is_verified === false
                  )

                return (
                  <article
                    key={disaster.id}
                    className={Styles.disasterCard}
                  >

                    <div className={Styles.cardHeader}>
                      <div className={Styles.cardIdentity}>
                        <div className={Styles.disasterIcon}>
                          <FaExclamationTriangle />
                        </div>

                        <div>
                          <div className={Styles.badgeRow}>
                            <span
                              className={Styles.disasterBadge}
                            >
                              Citizen Disaster Report
                            </span>

                            {disaster.officially_verified === true && (
                              <span
                                className={Styles.verifiedBadge}
                              >
                                <FaShieldAlt />
                                Authority Verified
                              </span>
                            )}

                            {disaster.officially_verified === false &&
                              hasExplicitNotVerified && (
                                <span
                                  className={
                                    Styles.notVerifiedBadge
                                  }
                                >
                                  <FaTimesCircle />
                                  Authority Not Verified
                                </span>
                              )}
                          </div>

                          <h2>
                            {disaster.title ||
                              'Disaster Report'}
                          </h2>
                        </div>
                      </div>

                      {disaster.created_at && (
                        <div className={Styles.cardTime}>
                          <FaClock />

                          {formatDateTime(
                            disaster.created_at
                          )}
                        </div>
                      )}
                    </div>


                    <p className={Styles.description}>
                      {disaster.description ||
                        'No additional details provided.'}
                    </p>


                    <div className={Styles.metaGrid}>
                      <div className={Styles.metaItem}>
                        <FaUser />

                        <div>
                          <span>Reported by</span>

                          <strong>
                            {disaster.author_name ||
                              'Citizen'}
                          </strong>
                        </div>
                      </div>

                      <div className={Styles.metaItem}>
                        <FaMapMarkerAlt />

                        <div>
                          <span>Location</span>

                          <strong>
                            {getLocationText(disaster)}
                          </strong>
                        </div>
                      </div>
                    </div>


                    {attachments.length > 0 && (
                      <section className={Styles.mediaSection}>
                        <h3>Evidence</h3>

                        <div className={Styles.mediaGrid}>
                          {attachments.map((attachment) => {
                            const url =
                              resolveMediaUrl(
                                attachment.file
                              )

                            const mime = (
                              attachment.mime_type || ''
                            ).toLowerCase()

                            const isVideo =
                              mime.startsWith('video/')

                            return (
                              <div
                                key={attachment.id}
                                className={Styles.mediaItem}
                              >
                                {isVideo
                                  ? (
                                      <video
                                        src={url}
                                        controls
                                        preload="metadata"
                                      />
                                    )
                                  : (
                                      <img
                                        src={url}
                                        alt={
                                          attachment.original_filename ||
                                          'Disaster evidence'
                                        }
                                        loading="lazy"
                                      />
                                    )}
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )}


                    <div
                      className={
                        Styles.locationVerificationGrid
                      }
                    >
                      {hasCoordinates
                        ? (
                            <section
                              className={Styles.mapSection}
                            >
                              <div
                                className={
                                  Styles.sectionHeader
                                }
                              >
                                <div>
                                  <FaMapMarkerAlt />
                                  <span>
                                    Disaster location
                                  </span>
                                </div>

                                <a
                                  href={getGoogleMapsUrl(
                                    latitude,
                                    longitude
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open in Google Maps
                                </a>
                              </div>

                              <iframe
                                className={Styles.mapFrame}
                                src={getMapUrl(
                                  latitude,
                                  longitude
                                )}
                                title={`Map for ${
                                  disaster.title ||
                                  'disaster'
                                }`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            </section>
                          )
                        : (
                            <section
                              className={
                                Styles.mapUnavailable
                              }
                            >
                              <FaMapMarkerAlt />

                              <h3>
                                Map unavailable
                              </h3>

                              <p>
                                No location coordinates were
                                supplied with this report.
                              </p>
                            </section>
                          )}

                      <section className={Styles.communitySection}>
                        <div>
                          <h3>Community verification</h3>
                          <p>Verification submitted by citizens in the ward.</p>
                        </div>
                        <div className={Styles.communityCounts}>
                          <span className={Styles.positiveCount}>
                            <FaCheckCircle />
                            <strong>{disaster.verified_count ?? 0}</strong>
                            Verified
                          </span>
                          <span className={Styles.negativeCount}>
                            <FaTimesCircle />
                            <strong>{disaster.not_verified_count ?? 0}</strong>
                            Not Verified
                          </span>
                          <div className={Styles.badgeRow}>
                            <h3>Authority verififcation status: </h3> 
                            {disaster.officially_verified === true && (
                              <span className={Styles.verifiedBadge}>
                                <FaShieldAlt />
                                Authority Verified
                              </span>
                            )}

                            {disaster.officially_verified === false &&
                              hasExplicitNotVerified && (
                                <span className={Styles.notVerifiedBadge}>
                                  <FaTimesCircle />
                                  Authority Not Verified
                                </span>
                              )}
                          </div>
                        </div>
                      </section>
                    </div>

                    {reviews.length > 0 && (
                      <section
                        className={Styles.reviewsSection}
                      >
                        <div className={Styles.sectionTitle}>
                          <FaCommentDots />
                          Authority responses
                        </div>

                        <div className={Styles.reviewList}>
                          {reviews.map((review) => (
                            <div
                              key={`${review.id}-${review.created_at || review.updated_at || ''}`}
                              className={Styles.reviewItem}
                            >
                              <div
                                className={Styles.reviewTop}
                              >
                                <div>
                                  <strong>
                                    {review.reviewer_name ||
                                      'Authority'}
                                  </strong>

                                  <span>
                                    {review.reviewer_type ===
                                    'representative'
                                      ? 'Representative'
                                      : 'Branch'}
                                  </span>
                                </div>

                                {review.is_verified === true && (
                                  <span
                                    className={
                                      Styles.reviewVerified
                                    }
                                  >
                                    <FaCheckCircle />
                                    Verified
                                  </span>
                                )}

                                {review.is_verified === false && (
                                  <span
                                    className={
                                      Styles.reviewNotVerified
                                    }
                                  >
                                    <FaTimesCircle />
                                    Not Verified
                                  </span>
                                )}
                              </div>

                              {review.comment && (
                                <p>{review.comment}</p>
                              )}

                              {(review.created_at ||
                                review.updated_at) && (
                                <small>
                                  {formatDateTime(
                                    review.created_at ||
                                    review.updated_at
                                  )}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}


                    <section
                      className={Styles.reviewComposer}
                    >
                      <div
                        className={
                          Styles.reviewComposerHeader
                        }
                      >
                        <div>
                          <h3>
                            Representative review
                          </h3>

                          <p>
                            Add a new comment or record an
                            explicit verification decision.
                            Previous responses remain in the
                            history above.
                          </p>
                        </div>

                        <FaShieldAlt />
                      </div>

                      <textarea
                        rows={4}
                        value={
                          reviewDrafts[disaster.id] || ''
                        }
                        onChange={(event) =>
                          setDraft(
                            disaster.id,
                            event.target.value
                          )
                        }
                        placeholder="Add an official comment about the reported incident..."
                        maxLength={2000}
                        disabled={isSubmitting}
                      />

                      <div
                        className={Styles.composerFooter}
                      >
                        <span>
                          {
                            (
                              reviewDrafts[
                                disaster.id
                              ] || ''
                            ).length
                          }
                          /2000
                        </span>

                        <div
                          className={Styles.reviewActions}
                        >
                          <button
                            type="button"
                            className={
                              Styles.secondaryButton
                            }
                            disabled={isSubmitting}
                            onClick={() =>
                              submitReview(disaster)
                            }
                          >
                            <FaCommentDots />
                            Add Comment
                          </button>

                          <button
                            type="button"
                            className={
                              Styles.notVerifyButton
                            }
                            disabled={isSubmitting}
                            onClick={() =>
                              submitReview(
                                disaster,
                                {
                                  verification: false,
                                }
                              )
                            }
                          >
                            <FaTimesCircle />

                            {isSubmitting
                              ? 'Saving...'
                              : 'Not Verified'}
                          </button>

                          <button
                            type="button"
                            className={
                              Styles.verifyButton
                            }
                            disabled={isSubmitting}
                            onClick={() =>
                              submitReview(
                                disaster,
                                {
                                  verification: true,
                                }
                              )
                            }
                          >
                            <FaCheckCircle />

                            {isSubmitting
                              ? 'Saving...'
                              : 'Verified'}
                          </button>
                        </div>
                      </div>

                      {feedback?.text && (
                        <div
                          className={
                            feedback.type === 'success'
                              ? Styles.successMessage
                              : Styles.errorMessage
                          }
                        >
                          {feedback.type === 'success'
                            ? <FaCheckCircle />
                            : <FaExclamationTriangle />
                          }

                          <span>
                            {feedback.text}
                          </span>
                        </div>
                      )}
                    </section>

                  </article>
                )
              })}
            </div>
          )}

      </div>
    </RepresentativeLayout>
  )
}
