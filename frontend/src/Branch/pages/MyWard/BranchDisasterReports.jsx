import { useCallback,useEffect,useMemo,useState} from 'react'
import { FaCheckCircle,FaClock,FaExclamationCircle,FaExternalLinkAlt,FaFileAlt,FaMapMarkerAlt,FaSearch,
  FaSyncAlt,FaTimes,FaTimesCircle,FaUser } from 'react-icons/fa'
import {FaTriangleExclamation} from 'react-icons/fa6'
import BranchLayout from '../../components/BranchLayout'
import Styles from './BranchDisasterReports.module.css'
import { getBranchDisasters,reviewBranchDisaster} from '../../../api/services/Branch/MyWard'
import {getProfile} from '../../../api/services/Branch/Profile.js'


/* HELPERS  */

const normalizeDisasters = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.disasters)) {
    return data.disasters
  }

  if (Array.isArray(data?.results)) {
    return data.results
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


const getLatestBranchDecision = (
  disaster,
  userId
) => {
  if (!userId) {
    return null
  }

  const reviews =
    Array.isArray(
      disaster?.authority_reviews
    )
      ? disaster.authority_reviews
      : []

  const ownReviews =
    reviews
      .filter(
        (review) =>
          Number(review.reviewer) ===
            Number(userId) &&
          review.is_verified !== null &&
          review.is_verified !== undefined
      )
      .sort(
        (a, b) =>
          new Date(
            b.created_at || 0
          ).getTime() -
          new Date(
            a.created_at || 0
          ).getTime()
      )

  return ownReviews[0] || null
}


const getReviewStatus = (
  disaster,
  userId
) => {
  const review =
    getLatestBranchDecision(
      disaster,
      userId
    )

  if (!review) {
    return 'needs_review'
  }

  return review.is_verified
    ? 'verified'
    : 'not_verified'
}


const extractError = (err) => {
  const data =
    err?.response?.data

  if (!data) {
    return 'Something went wrong.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  if (data.message) {
    return data.message
  }

  if (data.non_field_errors?.length) {
    return data.non_field_errors[0]
  }

  for (
    const value
    of Object.values(data)
  ) {
    if (
      Array.isArray(value) &&
      value.length
    ) {
      return String(value[0])
    }
  }

  return 'Something went wrong.'
}


/* ============================================================
   COMPONENT
============================================================ */

export default function BranchDisasterReports() {

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    disasters,
    setDisasters,
  ] = useState([])

  const [
    profile,
    setProfile,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    sortOrder,
    setSortOrder,
  ] = useState('latest')

  const [
    selectedDisaster,
    setSelectedDisaster,
  ] = useState(null)

  const [
    comment,
    setComment,
  ] = useState('')

  const [
    reviewing,
    setReviewing,
  ] = useState(false)

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState('')

  const [
    reviewError,
    setReviewError,
  ] = useState('')


  /* ==========================================================
     LOAD
  ========================================================== */

  const loadData =
    useCallback(
      async (
        isRefresh = false
      ) => {

        try {

          if (isRefresh) {
            setRefreshing(true)
          } else {
            setLoading(true)
          }

          setError('')


          const [
            profileResult,
            disasterResult,
          ] =
            await Promise.allSettled([
              getProfile(),

              getBranchDisasters({
                sort: 'latest',
              }),
            ])


          if (
            profileResult.status ===
            'fulfilled'
          ) {
            setProfile(
              profileResult.value
            )
          }


          if (
            disasterResult.status ===
            'fulfilled'
          ) {

            setDisasters(
              normalizeDisasters(
                disasterResult.value
              )
            )

          } else {

            throw (
              disasterResult.reason
            )

          }

        } catch (err) {

          console.error(
            'Failed to load Branch disasters:',
            err
          )

          setError(
            extractError(err)
          )

        } finally {

          setLoading(false)
          setRefreshing(false)

        }

      },
      []
    )


  useEffect(() => {
    loadData()
  }, [loadData])


  /* ==========================================================
     COUNTS
  ========================================================== */

  const counts =
    useMemo(() => {

      const userId =
        profile?.user_id

      const needsReview =
        disasters.filter(
          (disaster) =>
            getReviewStatus(
              disaster,
              userId
            ) === 'needs_review'
        ).length


      const verifiedByBranch =
        disasters.filter(
          (disaster) =>
            getReviewStatus(
              disaster,
              userId
            ) === 'verified'
        ).length


      const officiallyVerified =
        disasters.filter(
          (disaster) =>
            disaster.officially_verified
        ).length


      return {
        total:
          disasters.length,

        needsReview,

        verifiedByBranch,

        officiallyVerified,
      }

    }, [
      disasters,
      profile,
    ])


  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredDisasters =
    useMemo(() => {

      const userId =
        profile?.user_id

      const query =
        search
          .trim()
          .toLowerCase()


      let result =
        [...disasters]


      if (
        statusFilter !== 'all'
      ) {

        result =
          result.filter(
            (disaster) => {

              if (
                statusFilter ===
                'official'
              ) {
                return (
                  disaster
                    .officially_verified ===
                  true
                )
              }


              return (
                getReviewStatus(
                  disaster,
                  userId
                ) ===
                statusFilter
              )

            }
          )

      }


      if (query) {

        result =
          result.filter(
            (disaster) => {

              const value =
                [
                  disaster.title,
                  disaster.description,
                  disaster.location,
                  disaster.author_name,
                  disaster.ward_name,
                  disaster.ward_number,
                  disaster.local_body_name,
                  disaster.constituency_name,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()


              return value.includes(
                query
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
      disasters,
      profile,
      search,
      statusFilter,
      sortOrder,
    ])


  /* ==========================================================
     OPEN DETAILS
  ========================================================== */

  const openDisaster =
    (disaster) => {

      setSelectedDisaster(
        disaster
      )

      setComment('')
      setReviewMessage('')
      setReviewError('')

    }


  const closeDisaster = () => {

    if (reviewing) {
      return
    }

    setSelectedDisaster(null)

    setComment('')
    setReviewMessage('')
    setReviewError('')

  }


  /* ==========================================================
     REVIEW
  ========================================================== */

  const submitReview =
    async (
      verificationValue
    ) => {

      if (!selectedDisaster) {
        return
      }


      const cleanComment =
        comment.trim()


      if (
        verificationValue === null &&
        !cleanComment
      ) {

        setReviewError(
          'Enter a comment before submitting.'
        )

        return

      }


      try {

        setReviewing(true)
        setReviewError('')
        setReviewMessage('')


        const payload = {
          comment:
            cleanComment,
        }


        /*
         * null = comment only.
         *
         * true  = verified.
         * false = not verified.
         */
        if (
          verificationValue !== null
        ) {
          payload.is_verified =
            verificationValue
        }


        await reviewBranchDisaster(
          selectedDisaster.id,
          payload
        )


        setReviewMessage(
          verificationValue === true
            ? 'Disaster marked as verified.'
            : verificationValue === false
              ? 'Disaster marked as not verified.'
              : 'Comment added successfully.'
        )


        setComment('')


        /*
         * Reload so verification status and
         * history stay synchronized with API.
         */
        const updated =
          await getBranchDisasters({
            sort: 'latest',
          })


        const updatedDisasters =
          normalizeDisasters(
            updated
          )


        setDisasters(
          updatedDisasters
        )


        const refreshed =
          updatedDisasters.find(
            (item) =>
              item.id ===
              selectedDisaster.id
          )


        if (refreshed) {
          setSelectedDisaster(
            refreshed
          )
        }

      } catch (err) {

        console.error(
          'Branch disaster review failed:',
          err
        )

        setReviewError(
          extractError(err)
        )

      } finally {

        setReviewing(false)

      }

    }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <BranchLayout>

      <div className={Styles.page}>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          className={Styles.header}
        >

          <div>

            <div
              className={
                Styles.eyebrow
              }
            >
              <FaTriangleExclamation />

              MyWard
            </div>


            <h1>
              Disaster Reports
            </h1>


            <p>
              Review disaster reports
              submitted from the area served
              by your branch.
            </p>

          </div>


          <button
            type="button"
            className={
              Styles.refreshButton
            }
            onClick={() =>
              loadData(true)
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


        {/* ====================================================
            STATS
        ==================================================== */}

        <section
          className={
            Styles.statsGrid
          }
        >

          <div
            className={
              Styles.statCard
            }
          >
            <span
              className={
                Styles.statIcon
              }
            >
              <FaTriangleExclamation />
            </span>

            <div>
              <strong>
                {counts.total}
              </strong>

              <span>
                Total Reports
              </span>
            </div>
          </div>


          <div
            className={
              Styles.statCard
            }
          >
            <span
              className={
                `${Styles.statIcon} ${Styles.warningIcon}`
              }
            >
              <FaClock />
            </span>

            <div>
              <strong>
                {counts.needsReview}
              </strong>

              <span>
                Need Review
              </span>
            </div>
          </div>


          <div
            className={
              Styles.statCard
            }
          >
            <span
              className={
                `${Styles.statIcon} ${Styles.successIcon}`
              }
            >
              <FaCheckCircle />
            </span>

            <div>
              <strong>
                {counts.verifiedByBranch}
              </strong>

              <span>
                Verified by Branch
              </span>
            </div>
          </div>


          <div
            className={
              Styles.statCard
            }
          >
            <span
              className={
                `${Styles.statIcon} ${Styles.infoIcon}`
              }
            >
              <FaCheckCircle />
            </span>

            <div>
              <strong>
                {counts.officiallyVerified}
              </strong>

              <span>
                Officially Verified
              </span>
            </div>
          </div>

        </section>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <section
          className={
            Styles.filters
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
              placeholder="Search disaster reports..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          <select
            className={
              Styles.select
            }
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All reports
            </option>

            <option value="needs_review">
              Needs Review
            </option>

            <option value="verified">
              Verified by Branch
            </option>

            <option value="not_verified">
              Not Verified
            </option>

            <option value="official">
              Officially Verified
            </option>
          </select>


          <select
            className={
              Styles.select
            }
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value
              )
            }
          >
            <option value="latest">
              Latest First
            </option>

            <option value="oldest">
              Oldest First
            </option>
          </select>

        </section>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div
            className={
              Styles.errorMessage
            }
          >
            <FaExclamationCircle />

            {error}
          </div>

        )}


        {/* ====================================================
            CONTENT
        ==================================================== */}

        {loading ? (

          <div
            className={
              Styles.stateCard
            }
          >
            Loading disaster reports...
          </div>

        ) : filteredDisasters.length === 0 ? (

          <div
            className={
              Styles.emptyState
            }
          >

            <FaTriangleExclamation />

            <h3>
              No disaster reports
            </h3>

            <p>
              {disasters.length
                ? 'No disaster reports match the selected filters.'
                : 'There are currently no disaster reports for your branch area.'}
            </p>

          </div>

        ) : (

          <section
            className={
              Styles.disasterList
            }
          >

            {filteredDisasters.map(
              (disaster) => {

                const status =
                  getReviewStatus(
                    disaster,
                    profile?.user_id
                  )


                return (

                  <article
                    key={
                      disaster.id
                    }
                    className={
                      Styles.disasterCard
                    }
                  >

                    <div
                      className={
                        Styles.cardTop
                      }
                    >

                      <div
                        className={
                          Styles.cardTitleArea
                        }
                      >

                        <div
                          className={
                            Styles.badges
                          }
                        >

                          {disaster.is_important && (
                            <span
                              className={
                                Styles.importantBadge
                              }
                            >
                              Important
                            </span>
                          )}


                          {disaster.officially_verified && (
                            <span
                              className={
                                Styles.officialBadge
                              }
                            >
                              <FaCheckCircle />

                              Officially Verified
                            </span>
                          )}


                          {status ===
                            'needs_review' && (
                            <span
                              className={
                                Styles.pendingBadge
                              }
                            >
                              Need Review
                            </span>
                          )}


                          {status ===
                            'verified' && (
                            <span
                              className={
                                Styles.verifiedBadge
                              }
                            >
                              Branch Verified
                            </span>
                          )}


                          {status ===
                            'not_verified' && (
                            <span
                              className={
                                Styles.rejectedBadge
                              }
                            >
                              Not Verified
                            </span>
                          )}

                        </div>


                        <h2>
                          {disaster.title}
                        </h2>

                      </div>


                      <button
                        type="button"
                        className={
                          Styles.viewButton
                        }
                        onClick={() =>
                          openDisaster(
                            disaster
                          )
                        }
                      >
                        Review
                      </button>

                    </div>


                    <p
                      className={
                        Styles.description
                      }
                    >
                      {disaster.description}
                    </p>


                    {/* LOCATION */}

                    <div
                      className={
                        Styles.metaGrid
                      }
                    >

                      <span>
                        <FaMapMarkerAlt />

                        {disaster.location ||
                          disaster.local_body_name ||
                          'Location unavailable'}
                      </span>


                      <span>
                        <FaClock />

                        {formatDateTime(
                          disaster.created_at
                        )}
                      </span>


                      <span>
                        <FaUser />

                        {disaster.author_name ||
                          'Citizen'}
                      </span>

                    </div>


                    {/* WARD */}

                    {(disaster.ward_name ||
                      disaster.local_body_name) && (

                      <div
                        className={
                          Styles.locationLine
                        }
                      >

                        {disaster.ward_name && (
                          <span>
                            Ward{' '}
                            {disaster.ward_number
                              ? `${disaster.ward_number} - `
                              : ''}
                            {disaster.ward_name}
                          </span>
                        )}


                        {disaster.local_body_name && (
                          <span>
                            {
                              disaster.local_body_name
                            }
                          </span>
                        )}

                      </div>

                    )}


                    {/* COMMUNITY VERIFICATION */}

                    <div
                      className={
                        Styles.verificationBar
                      }
                    >

                      <div>
                        <span
                          className={
                            Styles.verificationLabel
                          }
                        >
                          Community verification
                        </span>
                      </div>


                      <div
                        className={
                          Styles.voteCounts
                        }
                      >

                        <span
                          className={
                            Styles.verifiedCount
                          }
                        >
                          <FaCheckCircle />

                          {
                            disaster.verified_count ||
                            0
                          } Verified
                        </span>


                        <span
                          className={
                            Styles.notVerifiedCount
                          }
                        >
                          <FaTimesCircle />

                          {
                            disaster.not_verified_count ||
                            0
                          } Not Verified
                        </span>

                      </div>

                    </div>

                  </article>

                )

              }
            )}

          </section>

        )}


        {/* ====================================================
            DETAIL / REVIEW MODAL
        ==================================================== */}

        {selectedDisaster && (

          <div
            className={
              Styles.modalOverlay
            }
            onMouseDown={(e) => {

              if (
                e.target ===
                e.currentTarget
              ) {
                closeDisaster()
              }

            }}
          >

            <div
              className={
                Styles.modal
              }
            >

              {/* HEADER */}

              <div
                className={
                  Styles.modalHeader
                }
              >

                <div>

                  <div
                    className={
                      Styles.eyebrow
                    }
                  >
                    Disaster Report
                  </div>

                  <h2>
                    {
                      selectedDisaster.title
                    }
                  </h2>

                </div>


                <button
                  type="button"
                  className={
                    Styles.closeButton
                  }
                  onClick={
                    closeDisaster
                  }
                  disabled={
                    reviewing
                  }
                >
                  <FaTimes />
                </button>

              </div>


              <div
                className={
                  Styles.modalBody
                }
              >

                {/* STATUS */}

                <div
                  className={
                    Styles.detailStatus
                  }
                >

                  {selectedDisaster
                    .officially_verified ? (

                    <span
                      className={
                        Styles.officialBadge
                      }
                    >
                      <FaCheckCircle />

                      Officially Verified
                    </span>

                  ) : (

                    <span
                      className={
                        Styles.pendingBadge
                      }
                    >
                      Awaiting official verification
                    </span>

                  )}

                </div>


                {/* DESCRIPTION */}

                <section
                  className={
                    Styles.detailSection
                  }
                >

                  <h3>
                    Description
                  </h3>

                  <p>
                    {
                      selectedDisaster
                        .description
                    }
                  </p>

                </section>


                {/* LOCATION */}

                <section
                  className={
                    Styles.detailSection
                  }
                >

                  <h3>
                    Location
                  </h3>


                  <div
                    className={
                      Styles.detailRows
                    }
                  >

                    <div>
                      <span>
                        Address
                      </span>

                      <strong>
                        {
                          selectedDisaster
                            .location ||
                          'Not available'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Ward
                      </span>

                      <strong>
                        {
                          selectedDisaster
                            .ward_name
                            ? `${
                                selectedDisaster
                                  .ward_number
                                  ? `Ward ${selectedDisaster.ward_number} - `
                                  : ''
                              }${selectedDisaster.ward_name}`
                            : 'Not available'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Local Body
                      </span>

                      <strong>
                        {
                          selectedDisaster
                            .local_body_name ||
                          selectedDisaster
                            .constituency_name ||
                          'Not available'
                        }
                      </strong>
                    </div>

                  </div>


                  {selectedDisaster
                    .latitude != null &&
                    selectedDisaster
                      .longitude != null && (

                    <a
                      className={
                        Styles.mapButton
                      }
                      href={`https://www.google.com/maps?q=${selectedDisaster.latitude},${selectedDisaster.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaMapMarkerAlt />

                      View on Map

                      <FaExternalLinkAlt />
                    </a>

                  )}

                </section>


                {/* COMMUNITY */}

                <section
                  className={
                    Styles.detailSection
                  }
                >

                  <h3>
                    Community Verification
                  </h3>


                  <div
                    className={
                      Styles.communityCards
                    }
                  >

                    <div
                      className={
                        Styles.communityVerified
                      }
                    >

                      <FaCheckCircle />

                      <strong>
                        {
                          selectedDisaster
                            .verified_count ||
                          0
                        }
                      </strong>

                      <span>
                        Verified
                      </span>

                    </div>


                    <div
                      className={
                        Styles.communityRejected
                      }
                    >

                      <FaTimesCircle />

                      <strong>
                        {
                          selectedDisaster
                            .not_verified_count ||
                          0
                        }
                      </strong>

                      <span>
                        Not Verified
                      </span>

                    </div>

                  </div>

                </section>


                {/* ATTACHMENTS */}

                {Array.isArray(
                  selectedDisaster.attachments
                ) &&
                  selectedDisaster.attachments.length >
                    0 && (

                  <section
                    className={
                      Styles.detailSection
                    }
                  >

                    <h3>
                      Evidence / Attachments
                    </h3>


                    <div
                      className={
                        Styles.attachments
                      }
                    >

                      {selectedDisaster
                        .attachments
                        .map(
                          (
                            attachment
                          ) => (

                            <a
                              key={
                                attachment.id
                              }
                              href={
                                attachment.file
                              }
                              target="_blank"
                              rel="noreferrer"
                              className={
                                Styles.attachment
                              }
                            >

                              <FaFileAlt />

                              <span>
                                {
                                  attachment.original_filename ||
                                  'Attachment'
                                }
                              </span>

                              <FaExternalLinkAlt />

                            </a>

                          )
                        )}

                    </div>

                  </section>

                )}


                {/* AUTHORITY HISTORY */}

                <section
                  className={
                    Styles.detailSection
                  }
                >

                  <h3>
                    Authority Response History
                  </h3>


                  {Array.isArray(
                    selectedDisaster
                      .authority_reviews
                  ) &&
                  selectedDisaster
                    .authority_reviews
                    .length > 0 ? (

                    <div
                      className={
                        Styles.history
                      }
                    >

                      {selectedDisaster
                        .authority_reviews
                        .map(
                          (
                            review
                          ) => (

                            <div
                              key={
                                review.id
                              }
                              className={
                                Styles.historyItem
                              }
                            >

                              <div
                                className={
                                  Styles.historyTop
                                }
                              >

                                <strong>
                                  {
                                    review.reviewer_name ||
                                    'Authority'
                                  }
                                </strong>


                                {review.is_verified ===
                                  true && (

                                  <span
                                    className={
                                      Styles.verifiedBadge
                                    }
                                  >
                                    Verified
                                  </span>

                                )}


                                {review.is_verified ===
                                  false && (

                                  <span
                                    className={
                                      Styles.rejectedBadge
                                    }
                                  >
                                    Not Verified
                                  </span>

                                )}


                                {review.is_verified ===
                                  null && (

                                  <span
                                    className={
                                      Styles.commentBadge
                                    }
                                  >
                                    Comment
                                  </span>

                                )}

                              </div>


                              {review.comment && (
                                <p>
                                  {
                                    review.comment
                                  }
                                </p>
                              )}


                              <small>
                                {
                                  review.reviewer_type ===
                                  'branch'
                                    ? 'Branch'
                                    : 'Representative'
                                }

                                {' · '}

                                {formatDateTime(
                                  review.created_at
                                )}
                              </small>

                            </div>

                          )
                        )}

                    </div>

                  ) : (

                    <p
                      className={
                        Styles.muted
                      }
                    >
                      No authority responses
                      have been added yet.
                    </p>

                  )}

                </section>


                {/* BRANCH RESPONSE */}

                <section
                  className={
                    Styles.reviewSection
                  }
                >

                  <div
                    className={
                      Styles.reviewHeading
                    }
                  >

                    <div>
                      <h3>
                        Branch Response
                      </h3>

                      <p>
                        Add an official comment
                        or verification decision.
                      </p>
                    </div>

                  </div>


                  <textarea
                    className={
                      Styles.textarea
                    }
                    placeholder="Add an official comment..."
                    value={comment}
                    onChange={(e) =>
                      setComment(
                        e.target.value
                      )
                    }
                    disabled={
                      reviewing
                    }
                    maxLength={2000}
                  />


                  {reviewMessage && (

                    <div
                      className={
                        Styles.successMessage
                      }
                    >
                      <FaCheckCircle />

                      {reviewMessage}
                    </div>

                  )}


                  {reviewError && (

                    <div
                      className={
                        Styles.errorMessage
                      }
                    >
                      <FaExclamationCircle />

                      {reviewError}
                    </div>

                  )}


                  <div
                    className={
                      Styles.reviewActions
                    }
                  >

                    <button
                      type="button"
                      className={
                        Styles.commentButton
                      }
                      onClick={() =>
                        submitReview(
                          null
                        )
                      }
                      disabled={
                        reviewing
                      }
                    >
                      Add Comment
                    </button>


                    <button
                      type="button"
                      className={
                        Styles.notVerifiedButton
                      }
                      onClick={() =>
                        submitReview(
                          false
                        )
                      }
                      disabled={
                        reviewing
                      }
                    >
                      <FaTimesCircle />

                      Not Verified
                    </button>


                    <button
                      type="button"
                      className={
                        Styles.verifyButton
                      }
                      onClick={() =>
                        submitReview(
                          true
                        )
                      }
                      disabled={
                        reviewing
                      }
                    >
                      <FaCheckCircle />

                      {reviewing
                        ? 'Submitting...'
                        : 'Verified'}

                    </button>

                  </div>

                </section>

              </div>

            </div>

          </div>

        )}

      </div>

    </BranchLayout>

  )
}