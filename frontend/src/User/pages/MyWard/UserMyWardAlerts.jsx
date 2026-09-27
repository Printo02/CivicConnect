import { useCallback, useEffect, useMemo, useState } from 'react'

import {

  FaBell,

  FaCheckCircle,

  FaChevronDown,

  FaChevronUp,

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



import MyWardSidebar from '../../components/MyWardSidebar'

import Styles from './MyWard.module.css'



import {

  getMyWardFeed,

  verifyDisaster,

} from '../../../api/services/User/MyWard'





const SORT_OPTIONS = [

  { value: 'latest', label: 'Latest first' },

  { value: 'oldest', label: 'Oldest first' },

]





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





const looksLikeCoordinates = (value) => {

  if (!value) return false



  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(

    String(value).trim()

  )

}





const getLocationText = (post) => {

  if (post.ward_name) {

    const ward = post.ward_number

      ? `Ward ${post.ward_number} - ${post.ward_name}`

      : post.ward_name



    return post.local_body_name

      ? `${ward}, ${post.local_body_name}`

      : ward

  }



  if (

    post.location &&

    !looksLikeCoordinates(post.location)

  ) {

    return post.location

  }



  return post.constituency_name || ''

}





const getCoordinates = (post) => {

  const latitude = Number(post.latitude)

  const longitude = Number(post.longitude)



  if (

    Number.isFinite(latitude) &&

    Number.isFinite(longitude)

  ) {

    return {

      lat: latitude,

      lng: longitude,

    }

  }



  if (looksLikeCoordinates(post.location)) {

    const [lat, lng] = String(post.location)

      .split(',')

      .map((part) =>

        Number(part.trim())

      )



    if (

      Number.isFinite(lat) &&

      Number.isFinite(lng)

    ) {

      return { lat, lng }

    }

  }



  return null

}





const getAuthorName = (post) => {

  if (post.author_name) {

    return post.author_name

  }



  return post.post_type === 'disaster'

    ? 'Citizen report'

    : 'CivicConnect Authority'

}





const getMapEmbedUrl = (lat, lng) =>

  `https://maps.google.com/maps?q=${encodeURIComponent(

    `${lat},${lng}`

  )}&z=16&output=embed`





const getMapOpenUrl = (lat, lng) =>

  `https://www.google.com/maps?q=${encodeURIComponent(

    `${lat},${lng}`

  )}`





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

  return (
    backendBase +
    (value.startsWith('/') ? value : `/${value}`)
  )
}


function AlertCard({

  post,

  viewerLocation,

  mapOpen,

  onToggleMap,

  verificationId,

  verificationError,

  onVerify,

}) {

  const isDisaster =

    post.post_type === 'disaster'



  const location =

    getLocationText(post)



  const coordinates =

    getCoordinates(post)



  const attachments =

    Array.isArray(post.attachments)

      ? post.attachments

      : []



  const authorityReviews =

    Array.isArray(post.authority_reviews)

      ? post.authority_reviews

      : []



  const isVerifying =

    verificationId === post.id





  return (

    <article

      className={`${Styles.alertCard} ${

        isDisaster

          ? Styles.disasterAlertCard

          : Styles.officialAlertCard

      }`}

    >

      <div className={Styles.alertCardHeader}>

        <div className={Styles.alertCardIdentity}>

          <div

            className={`${Styles.alertKindIcon} ${

              isDisaster

                ? Styles.disasterKindIcon

                : Styles.officialKindIcon

            }`}

          >

            {isDisaster

              ? <FaExclamationTriangle />

              : <FaBell />}

          </div>



          <div>

            <div className={Styles.alertBadgeRow}>

              <span

                className={`${Styles.alertKindBadge} ${

                  isDisaster

                    ? Styles.disasterKindBadge

                    : Styles.officialKindBadge

                }`}

              >

                {isDisaster

                  ? 'Citizen Disaster Report'

                  : 'Official Alert'}

              </span>



              {post.is_mine && (

                <span className={Styles.mineAlertBadge}>

                  Added by you

                </span>

              )}



              {isDisaster &&

                post.officially_verified && (

                  <span

                    className={

                      Styles.officialVerifiedBadge

                    }

                  >

                    <FaShieldAlt />

                    Authority Verified

                  </span>

                )}

            </div>



            <h2 className={Styles.alertTitle}>

              {post.title ||

                (

                  isDisaster

                    ? 'Disaster Report'

                    : 'Local Alert'

                )}

            </h2>

          </div>

        </div>



        {post.created_at && (

          <div className={Styles.alertTime}>

            <FaClock />



            <span>

              {formatDateTime(

                post.created_at

              )}

            </span>

          </div>

        )}

      </div>





      <p className={Styles.alertDescription}>

        {post.description ||

          'No additional details provided.'}

      </p>





      {attachments.length > 0 && (

        <div className={Styles.alertMediaGrid}>

          {attachments.map(

            (attachment) => {

              const fileUrl =

                resolveMediaUrl(

                  attachment.file

                )



              const mimeType =

                (

                  attachment.mime_type ||

                  ''

                ).toLowerCase()



              const isVideo =

                mimeType.startsWith(

                  'video/'

                )



              return (

                <div

                  key={attachment.id}

                  className={

                    Styles.alertMediaItem

                  }

                >

                  {isVideo ? (

                    <video

                      src={fileUrl}

                      controls

                      preload="metadata"

                    />

                  ) : (

                    <img

                      src={fileUrl}

                      alt={

                        attachment.original_filename ||

                        'Disaster evidence'

                      }

                      loading="lazy"

                    />

                  )}

                </div>

              )

            }

          )}

        </div>

      )}





      <div className={Styles.alertMetaGrid}>

        <div className={Styles.alertMetaItem}>

          <FaUser />



          <span>

            {isDisaster

              ? 'Reported by '

              : 'Posted by '}



            <strong>

              {getAuthorName(post)}

            </strong>

          </span>

        </div>



        {location && (

          <div className={Styles.alertMetaItem}>

            <FaMapMarkerAlt />



            <span>{location}</span>

          </div>

        )}

      </div>





      {isDisaster &&

        coordinates && (

          <div className={Styles.locationPanel}>

            <div

              className={

                Styles.locationPanelTop

              }

            >

              <div

                className={

                  Styles.locationPanelLabel

                }

              >

                <FaMapMarkerAlt />



                <div>

                  <span>

                    Disaster location

                  </span>



                  <strong>

                    {location ||

                      'Location selected on map'}

                  </strong>

                </div>

              </div>



              <div

                className={

                  Styles.locationActions

                }

              >

                <button

                  type="button"

                  className={

                    Styles.secondaryActionButton

                  }

                  onClick={onToggleMap}

                >

                  {mapOpen ? (

                    <>

                      <FaChevronUp />

                      Hide map

                    </>

                  ) : (

                    <>

                      <FaChevronDown />

                      View map

                    </>

                  )}

                </button>



                <a

                  className={

                    Styles.mapLinkButton

                  }

                  href={

                    getMapOpenUrl(

                      coordinates.lat,

                      coordinates.lng

                    )

                  }

                  target="_blank"

                  rel="noreferrer"

                >

                  Open Maps

                </a>

              </div>

            </div>



            {mapOpen && (

              <iframe

                className={

                  Styles.disasterMapFrame

                }

                title={`Map for ${post.title || 'disaster report'}`}

                src={

                  getMapEmbedUrl(

                    coordinates.lat,

                    coordinates.lng

                  )

                }

                loading="lazy"

                referrerPolicy="no-referrer-when-downgrade"

              />

            )}

          </div>

        )}





      {isDisaster && (

        <div className={Styles.verificationPanel}>

          <div

            className={

              Styles.verificationPanelHeader

            }

          >

            <div>

              <h3>

                Community verification

              </h3>



              <p>

                People in the same ward can

                confirm whether this report

                is accurate.

              </p>

            </div>



            <div

              className={

                Styles.verificationSummary

              }

            >

              <span

                className={

                  Styles.verifiedSummary

                }

              >

                <FaCheckCircle />

                {post.verified_count ?? 0}

                {' '}

                verified

              </span>



              <span

                className={

                  Styles.notVerifiedSummary

                }

              >

                <FaTimesCircle />

                {post.not_verified_count ?? 0}

                {' '}

                not verified

              </span>

            </div>

          </div>





          {!post.is_mine ? (

            <div

              className={

                Styles.verificationActions

              }

            >

              <button

                type="button"

                className={`${Styles.verifyButton} ${

                  post.my_verification ===

                  'verified'

                    ? Styles.verifyButtonActive

                    : ''

                }`}

                disabled={

                  isVerifying ||

                  !viewerLocation

                }

                onClick={() =>

                  onVerify(

                    post,

                    'verified'

                  )

                }

              >

                <FaCheckCircle />



                {post.my_verification ===

                'verified'

                  ? 'You verified this'

                  : 'Verify report'}

              </button>





              <button

                type="button"

                className={`${Styles.notVerifyButton} ${

                  post.my_verification ===

                  'not_verified'

                    ? Styles.notVerifyButtonActive

                    : ''

                }`}

                disabled={

                  isVerifying ||

                  !viewerLocation

                }

                onClick={() =>

                  onVerify(

                    post,

                    'not_verified'

                  )

                }

              >

                <FaTimesCircle />



                {post.my_verification ===

                'not_verified'

                  ? 'You marked this not verified'

                  : 'Not verified'}

              </button>

            </div>

          ) : (

            <div

              className={

                Styles.ownReportNotice

              }

            >

              This is your report. Verification

              is available to other users in

              the ward.

            </div>

          )}





          {verificationError && (

            <div

              className={

                Styles.verificationError

              }

            >

              {verificationError}

            </div>

          )}

        </div>

      )}





      {isDisaster &&

        authorityReviews.length > 0 && (

          <div

            className={

              Styles.authorityReviewSection

            }

          >

            <div

              className={

                Styles.authorityReviewHeading

              }

            >

              <FaCommentDots />



              <div>

                <strong>

                  Authority responses

                </strong>



                <span>

                  Updates from branches or

                  representatives

                </span>

              </div>

            </div>



            <div

              className={

                Styles.authorityReviewList

              }

            >

              {authorityReviews.map(

                (review) => (

                  <div

                    key={review.id}

                    className={

                      Styles.authorityReview

                    }

                  >

                    <div

                      className={

                        Styles.authorityReviewTop

                      }

                    >

                      <strong>

                        {review.reviewer_name ||

                          'Authority'}

                      </strong>



                      {review.is_verified && (

                        <span

                          className={

                            Styles.authorityVerifiedMini

                          }

                        >

                          <FaCheckCircle />

                          Verified

                        </span>

                      )}

                    </div>



                    {review.comment && (

                      <p>

                        {review.comment}

                      </p>

                    )}



                    {review.updated_at && (

                      <small>

                        {formatDateTime(

                          review.updated_at

                        )}

                      </small>

                    )}

                  </div>

                )

              )}

            </div>

          </div>

        )}

    </article>

  )

}





export default function UserMyWardAlerts() {

  const [posts, setPosts] =

    useState([])



  const [loading, setLoading] =

    useState(true)



  const [refreshing, setRefreshing] =

    useState(false)



  const [error, setError] =

    useState('')



  const [viewMode, setViewMode] =

    useState('feed')



  const [sortOrder, setSortOrder] =

    useState('latest')



  const [

    viewerLocation,

    setViewerLocation,

  ] = useState(null)



  const [

    verificationId,

    setVerificationId,

  ] = useState(null)



  const [

    verificationErrors,

    setVerificationErrors,

  ] = useState({})



  const [

    openMapId,

    setOpenMapId,

  ] = useState(null)





  const loadAlerts = useCallback(

    (isRefresh = false) => {

      if (!navigator.geolocation) {

        setError(

          'Location is not supported by your browser.'

        )

        setLoading(false)

        return

      }



      if (isRefresh) {

        setRefreshing(true)

      } else {

        setLoading(true)

      }



      setError('')



      navigator.geolocation.getCurrentPosition(

        async ({ coords }) => {

          const location = {

            lat: coords.latitude,

            lng: coords.longitude,

          }



          setViewerLocation(location)



          try {

            // The backend alert feed already includes:

            // - official alerts

            // - citizen disaster reports

            const data =

              await getMyWardFeed(

                coords.latitude,

                coords.longitude,

                'alert'

              )



            setPosts(

              Array.isArray(data?.posts)

                ? data.posts

                : []

            )

          } catch (err) {

            console.error(

              'Failed to load MyWard alerts:',

              err

            )



            setPosts([])



            setError(

              err?.code === 'ERR_NETWORK'

                ? 'Unable to connect to the server.'

                : (

                    err?.response?.data?.detail ||

                    'Unable to load alerts.'

                  )

            )

          } finally {

            setLoading(false)

            setRefreshing(false)

          }

        },



        (locationError) => {

          console.error(

            'Location error:',

            locationError

          )



          const messages = {

            [locationError.PERMISSION_DENIED]:

              'Location permission is required to view alerts for your ward.',



            [locationError.POSITION_UNAVAILABLE]:

              'Your current location is unavailable.',



            [locationError.TIMEOUT]:

              'Location request timed out.',

          }



          setError(

            messages[locationError.code] ||

            'Unable to access your current location.'

          )



          setLoading(false)

          setRefreshing(false)

        },



        {

          enableHighAccuracy: true,

          timeout: 15000,

          maximumAge: 60000,

        }

      )

    },

    []

  )





  useEffect(() => {

    loadAlerts()

  }, [loadAlerts])





  const visiblePosts =

    useMemo(() => {

      const filtered =

        viewMode === 'mine'

          ? posts.filter(

              (post) =>

                post.is_mine === true

            )

          : [...posts]



      return filtered.sort(

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

    }, [

      posts,

      viewMode,

      sortOrder,

    ])





  const ownPostCount =

    useMemo(

      () =>

        posts.filter(

          (post) =>

            post.is_mine === true

        ).length,

      [posts]

    )





  const handleVerification =

    async (

      post,

      vote

    ) => {

      if (!viewerLocation) {

        return

      }



      if (post.is_mine) {

        return

      }



      try {

        setVerificationId(

          post.id

        )



        setVerificationErrors(

          (current) => ({

            ...current,

            [post.id]: '',

          })

        )



        const result =

          await verifyDisaster(

            post.id,

            vote,

            viewerLocation.lat,

            viewerLocation.lng

          )



        setPosts((current) =>

          current.map((item) =>

            item.id === post.id

              ? {

                  ...item,



                  verified_count:

                    result?.verified_count ??

                    item.verified_count ??

                    0,



                  not_verified_count:

                    result?.not_verified_count ??

                    item.not_verified_count ??

                    0,



                  my_verification:

                    result?.my_verification ??

                    vote,

                }

              : item

          )

        )

      } catch (err) {

        console.error(

          'Disaster verification failed:',

          err

        )



        setVerificationErrors(

          (current) => ({

            ...current,



            [post.id]:

              err?.response?.data?.detail ||

              err?.response?.data?.vote ||

              'Unable to update verification.',

          })

        )

      } finally {

        setVerificationId(

          null

        )

      }

    }





  return (

    <div className={Styles.page}>

      <aside className={Styles.sidebarStretch}>

        <div className={Styles.sidebarInner}>

          <MyWardSidebar />

        </div>

      </aside>



      <main className={Styles.content}>



        <header

          className={

            Styles.alertPageHeader

          }

        >

          <div>

            <div

              className={

                Styles.alertEyebrow

              }

            >

              <FaBell />

              MyWard Notifications

            </div>



            <h1>

              Alerts

            </h1>



            <p>

              Local emergency reports and

              official notices in one place.

            </p>

          </div>



          <button

            type="button"

            className={

              Styles.refreshButton

            }

            onClick={() =>

              loadAlerts(true)

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

              : 'Refresh'}

          </button>

        </header>





        <div

          className={

            Styles.alertsToolbar

          }

        >

          <div

            className={

              Styles.alertViewToggle

            }

          >

            <button

              type="button"

              className={`${Styles.alertToggleButton} ${

                viewMode === 'feed'

                  ? Styles.alertToggleActive

                  : ''

              }`}

              onClick={() =>

                setViewMode('feed')

              }

            >

              <FaBell />

              Alert Feed



              <span

                className={

                  Styles.toggleCount

                }

              >

                {posts.length}

              </span>

            </button>



            <button

              type="button"

              className={`${Styles.alertToggleButton} ${

                viewMode === 'mine'

                  ? Styles.alertToggleActive

                  : ''

              }`}

              onClick={() =>

                setViewMode('mine')

              }

            >

              <FaUser />

              Added by Me



              <span

                className={

                  Styles.toggleCount

                }

              >

                {ownPostCount}

              </span>

            </button>

          </div>





          <label

            className={

              Styles.alertSortControl

            }

          >

            <FaSortAmountDown />



            <span>

              Sort by

            </span>



            <select

              value={sortOrder}

              onChange={(event) =>

                setSortOrder(

                  event.target.value

                )

              }

            >

              {SORT_OPTIONS.map(

                (option) => (

                  <option

                    key={option.value}

                    value={option.value}

                  >

                    {option.label}

                  </option>

                )

              )}

            </select>

          </label>

        </div>





        {loading && (

          <div

            className={

              Styles.alertStateCard

            }

          >

            <div

              className={

                Styles.loadingSpinner

              }

            />



            <h3>

              Loading alerts

            </h3>



            <p>

              Finding reports and notices

              for your locality...

            </p>

          </div>

        )}





        {!loading && error && (

          <div

            className={`

              ${Styles.alertStateCard}

              ${Styles.alertErrorCard}

            `}

          >

            <div

              className={

                Styles.alertErrorIcon

              }

            >

              <FaExclamationTriangle />

            </div>



            <h3>

              Unable to load alerts

            </h3>



            <p>

              {error}

            </p>



            <button

              type="button"

              className={

                Styles.stateButton

              }

              onClick={() =>

                loadAlerts()

              }

            >

              <FaSyncAlt />

              Try Again

            </button>

          </div>

        )}





        {!loading &&

          !error &&

          visiblePosts.length === 0 && (

            <div

              className={

                Styles.alertStateCard

              }

            >

              <div

                className={

                  Styles.emptyAlertIcon

                }

              >

                <FaBell />

              </div>



              <h3>

                {viewMode === 'mine'

                  ? 'No alerts added by you'

                  : 'No alerts available'}

              </h3>



              <p>

                {viewMode === 'mine'

                  ? 'Disaster reports you submit will appear here.'

                  : 'No official alerts or citizen disaster reports are available for this locality right now.'}

              </p>

            </div>

          )}





        {!loading &&

          !error &&

          visiblePosts.length > 0 && (

            <div

              className={

                Styles.alertList

              }

            >

              {visiblePosts.map(

                (post) => (

                  <AlertCard

                    key={post.id}

                    post={post}

                    viewerLocation={

                      viewerLocation

                    }

                    mapOpen={

                      openMapId ===

                      post.id

                    }

                    onToggleMap={() =>

                      setOpenMapId(

                        (current) =>

                          current ===

                          post.id

                            ? null

                            : post.id

                      )

                    }

                    verificationId={

                      verificationId

                    }

                    verificationError={

                      verificationErrors[

                        post.id

                      ]

                    }

                    onVerify={

                      handleVerification

                    }

                  />

                )

              )}

            </div>

          )}

      </main>

    </div>

  )

}
