import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from '@react-google-maps/api'

import {
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaCamera,
  FaVideo,
  FaTrash,
  FaPaperPlane,
  FaCloudUploadAlt,
  FaTimes,
} from 'react-icons/fa'

import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './ReportDisaster.module.css'

import { createDisasterReport } from '../../../api/services/User/MyWard.js'


const DEFAULT_LOCATION = {
  lat: 9.9312,
  lng: 76.2673,
}


const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILES = 5


const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '360px',
}


export default function UserReportDisaster() {
  const mapRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
  })

  const [location, setLocation] =
    useState(DEFAULT_LOCATION)

  const [address, setAddress] = useState('')

  const [media, setMedia] = useState([])

  const [gettingLocation, setGettingLocation] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('')


  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey:
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })


  const handleInputChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }


  const reverseGeocode = useCallback(
    async (lat, lng) => {
      if (!window.google) return

      try {
        const geocoder =
          new window.google.maps.Geocoder()

        const response =
          await geocoder.geocode({
            location: {
              lat,
              lng,
            },
          })

        const result = response.results?.[0]

        setAddress(
          result?.formatted_address ||
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        )
      } catch {
        setAddress(
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        )
      }
    },
    []
  )


  const setSelectedLocation = useCallback(
    (lat, lng) => {
      const nextLocation = {
        lat,
        lng,
      }

      setLocation(nextLocation)

      reverseGeocode(lat, lng)
    },
    [reverseGeocode]
  )


  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage(
        'Location is not supported by your browser.'
      )

      setMessageType('error')

      return
    }

    setGettingLocation(true)
    setMessage('')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
        }

        setLocation(nextLocation)

        mapRef.current?.panTo(nextLocation)

        mapRef.current?.setZoom(17)

        reverseGeocode(
          coords.latitude,
          coords.longitude
        )

        setGettingLocation(false)
      },

      () => {
        setGettingLocation(false)

        setMessage(
          'Unable to access your current location.'
        )

        setMessageType('error')
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [reverseGeocode])


  useEffect(() => {
    if (isLoaded) {
      useCurrentLocation()
    }
  }, [isLoaded, useCurrentLocation])


  const handleMapClick = (event) => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()

    setSelectedLocation(lat, lng)
  }


  const handleFiles = (event) => {
    const selectedFiles =
      Array.from(event.target.files || [])

    setMessage('')

    const remaining =
      MAX_FILES - media.length

    if (remaining <= 0) {
      setMessage(
        `You can upload a maximum of ${MAX_FILES} files.`
      )

      setMessageType('error')

      return
    }

    const acceptedFiles = []

    for (const file of selectedFiles) {
      const isImage =
        file.type.startsWith('image/')

      const isVideo =
        file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        setMessage(
          'Only image and video files are allowed.'
        )

        setMessageType('error')

        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        setMessage(
          `${file.name} exceeds the 25 MB limit.`
        )

        setMessageType('error')

        continue
      }

      acceptedFiles.push({
        id: crypto.randomUUID(),
        file,
        type: isImage
          ? 'image'
          : 'video',
        preview: URL.createObjectURL(file),
      })
    }


    setMedia((previous) => [
      ...previous,
      ...acceptedFiles.slice(0, remaining),
    ])

    event.target.value = ''
  }


  const removeMedia = (id) => {
    setMedia((previous) => {
      const item =
        previous.find(
          (mediaItem) =>
            mediaItem.id === id
        )

      if (item) {
        URL.revokeObjectURL(
          item.preview
        )
      }

      return previous.filter(
        (mediaItem) =>
          mediaItem.id !== id
      )
    })
  }


  const validate = () => {
    if (!form.title.trim()) {
      return 'Please enter a disaster title.'
    }

    if (!form.description.trim()) {
      return 'Please describe the disaster.'
    }

    if (!location?.lat || !location?.lng) {
      return 'Please select the disaster location.'
    }

    return ''
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationMessage =
      validate()

    if (validationMessage) {
      setMessage(validationMessage)
      setMessageType('error')

      return
    }

    try {
      setSubmitting(true)
      setMessage('')

      const formData =
        new FormData()

      formData.append(
        'title',
        form.title.trim()
      )

      formData.append(
        'description',
        form.description.trim()
      )

      formData.append(
        'latitude',
        location.lat
      )

      formData.append(
        'longitude',
        location.lng
      )

      formData.append(
        'location',
        address
      )


      media.forEach((item) => {
        formData.append(
          'attachments',
          item.file
        )
      })


      await createDisasterReport(
        formData
      )


      setMessage(
        'Disaster alert shared successfully with your ward.'
      )

      setMessageType('success')


      setForm({
        title: '',
        description: '',
      })


      media.forEach((item) => {
        URL.revokeObjectURL(
          item.preview
        )
      })

      setMedia([])
        } catch (error) {

    console.error('Disaster report failed:',error)

    console.error('Backend response:',error?.response?.data)

    let errorMessage = 'Unable to share the disaster alert.'

    const data = error?.response?.data

    if (data?.detail) {
      errorMessage = data.detail

    } else if (data) {
      if (typeof data === 'string') {
        errorMessage = data
      } else {
        const firstKey = Object.keys(data)[0]
        const firstError = data[firstKey]
        if (Array.isArray(firstError)) {
          errorMessage = `${firstKey}: ${firstError[0]}`
        } else if (firstError) {
          errorMessage = `${firstKey}: ${firstError}`
        }
      }

    } else if (error?.message) {

      errorMessage =
        error.message
    }

    setMessage(errorMessage)
    setMessageType('error')

  } finally {

    setSubmitting(false)
  }
}


  return (
    <div className={Styles.page}>
      <div className={Styles.sidebarSticky}>
        <MyWardSidebar />
      </div>


      <main className={Styles.content}>

        {/* HEADER */}

        <header className={Styles.header}>

          <div
            className={
              Styles.headerIcon
            }
          >
            <FaExclamationTriangle />
          </div>


          <div>
            <span
              className={
                Styles.eyebrow
              }
            >
              Ward Emergency Alert
            </span>

            <h1>
              Report a Disaster
            </h1>

            <p>
              Alert people in your ward about
              floods, landslides, fires,
              accidents, fallen trees or other
              immediate local hazards.
            </p>
          </div>

        </header>


        {/* ALERT */}

        {message && (
          <div
            className={
              messageType === 'success'
                ? Styles.successMessage
                : Styles.errorMessage
            }
          >
            {message}
          </div>
        )}


        <form
          className={Styles.form}
          onSubmit={handleSubmit}
        >

          {/* INFORMATION */}

          <section
            className={Styles.card}
          >
            <div
              className={
                Styles.cardHeader
              }
            >
              <div>
                <span
                  className={
                    Styles.stepNumber
                  }
                >
                  1
                </span>

                <h2>
                  Disaster Information
                </h2>
              </div>
            </div>


            <div
              className={
                Styles.formGroup
              }
            >
              <label htmlFor="title">
                Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={
                  handleInputChange
                }
                placeholder="Example: Flooding near Main Road"
                maxLength={150}
              />

              <span
                className={
                  Styles.characterCount
                }
              >
                {form.title.length}/150
              </span>
            </div>


            <div
              className={
                Styles.formGroup
              }
            >
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={6}
                value={form.description}
                onChange={
                  handleInputChange
                }
                placeholder="Describe what happened, the current situation and any danger people nearby should know about..."
              />

              <span
                className={
                  Styles.helpText
                }
              >
                Include useful details such as
                blocked roads, water level,
                damaged structures or immediate
                risks.
              </span>
            </div>
          </section>


          {/* MEDIA */}

          <section
            className={Styles.card}
          >
            <div
              className={
                Styles.cardHeader
              }
            >
              <div>
                <span
                  className={
                    Styles.stepNumber
                  }
                >
                  2
                </span>

                <h2>
                  Images or Videos
                </h2>
              </div>

              <span
                className={
                  Styles.optional
                }
              >
                Optional
              </span>
            </div>


            <label
              className={
                Styles.uploadBox
              }
            >
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
              />

              <FaCloudUploadAlt />

              <strong>
                Add images or videos
              </strong>

              <span>
                Maximum 5 files ·
                25 MB each
              </span>
            </label>


            {!!media.length && (
              <div
                className={
                  Styles.mediaGrid
                }
              >
                {media.map((item) => (
                  <div
                    key={item.id}
                    className={
                      Styles.mediaItem
                    }
                  >

                    {item.type ===
                    'image' ? (
                      <img
                        src={
                          item.preview
                        }
                        alt="Disaster preview"
                      />
                    ) : (
                      <video
                        src={
                          item.preview
                        }
                        controls
                      />
                    )}


                    <div
                      className={
                        Styles.mediaBadge
                      }
                    >
                      {item.type ===
                      'image' ? (
                        <>
                          <FaCamera />
                          Image
                        </>
                      ) : (
                        <>
                          <FaVideo />
                          Video
                        </>
                      )}
                    </div>


                    <button
                      type="button"
                      className={
                        Styles.removeMedia
                      }
                      onClick={() =>
                        removeMedia(
                          item.id
                        )
                      }
                    >
                      <FaTrash />
                    </button>

                  </div>
                ))}
              </div>
            )}
          </section>


          {/* LOCATION */}

          <section
            className={Styles.card}
          >
            <div
              className={
                Styles.locationHeader
              }
            >

              <div
                className={
                  Styles.cardHeader
                }
              >
                <div>
                  <span
                    className={
                      Styles.stepNumber
                    }
                  >
                    3
                  </span>

                  <h2>
                    Disaster Location
                  </h2>
                </div>
              </div>


              <button
                type="button"
                className={
                  Styles.locationButton
                }
                onClick={
                  useCurrentLocation
                }
                disabled={
                  gettingLocation
                }
              >
                <FaLocationArrow />

                {gettingLocation
                  ? 'Locating...'
                  : 'Use My Location'}
              </button>

            </div>


            <p
              className={
                Styles.mapHelp
              }
            >
              Click anywhere on the map to
              select the exact disaster
              location.
            </p>


            <div
              className={
                Styles.mapContainer
              }
            >

              {loadError && (
                <div
                  className={
                    Styles.mapError
                  }
                >
                  Unable to load Google Maps.
                </div>
              )}


              {!isLoaded &&
                !loadError && (
                  <div
                    className={
                      Styles.mapLoading
                    }
                  >
                    Loading Google Map...
                  </div>
                )}


              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={
                    MAP_CONTAINER_STYLE
                  }
                  center={location}
                  zoom={16}
                  onLoad={(map) => {
                    mapRef.current =
                      map
                  }}
                  onClick={
                    handleMapClick
                  }
                  options={{
                    streetViewControl:
                      false,
                    mapTypeControl:
                      false,
                    fullscreenControl:
                      false,
                  }}
                >
                  <MarkerF
                    position={
                      location
                    }
                    draggable
                    onDragEnd={(
                      event
                    ) => {
                      setSelectedLocation(
                        event.latLng.lat(),
                        event.latLng.lng()
                      )
                    }}
                  />
                </GoogleMap>
              )}

            </div>


            <div
              className={
                Styles.selectedLocation
              }
            >
              <div
                className={
                  Styles.locationIcon
                }
              >
                <FaMapMarkerAlt />
              </div>

              <div>
                <span>
                  Selected location
                </span>

                <strong>
                  {address ||
                    'Select a location on the map'}
                </strong>

                <small>
                  {location.lat.toFixed(
                    6
                  )}
                  {' , '}
                  {location.lng.toFixed(
                    6
                  )}
                </small>
              </div>
            </div>

          </section>


          {/* FOOTER */}

          <div
            className={
              Styles.formFooter
            }
          >

            <div
              className={
                Styles.warning
              }
            >
              <FaExclamationTriangle />

              <span>
                Only report genuine local
                hazards or emergencies.
              </span>
            </div>


            <button
              type="submit"
              className={
                Styles.submitButton
              }
              disabled={submitting}
            >
              <FaPaperPlane />

              {submitting
                ? 'Sharing Alert...'
                : 'Share Disaster Alert'}
            </button>

          </div>

        </form>

      </main>

    </div>
  )
}