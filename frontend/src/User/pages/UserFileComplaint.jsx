import { useEffect, useRef, useState } from 'react'
import {
  FaMapMarkerAlt,
  FaPaperPlane,
  FaTimes,
  FaBuilding,
  FaUserTie,
  FaCheckCircle,
  FaSearch,
  FaCamera,
  FaVideo,
  FaFileAlt,
  FaMicrophone,
  FaStop,
  FaTrash,
  FaUpload,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

import Styles from '../components/module.css/UserFileComplaint.module.css'
import UserLayout from '../components/UserLayout'

import {
  createComplaint,
  getNearbyAuthorities,
  searchBranches,
  getAuthoritiesByDistrict,
  getDistricts,
  uploadComplaintAttachment,
  uploadComplaintVoice,
} from '../../api/services/User/Complaint.js'

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024
const MAX_VOICE_SIZE = 15 * 1024 * 1024

const ATTACHMENT_ACCEPT =
  'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.txt'

const getFileType = (file) => {
  if (!file?.type) {
    const extension = file?.name?.split('.').pop()?.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return 'image'
    }

    if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      return 'video'
    }

    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return 'document'
    }

    return 'other'
  }

  if (file.type.startsWith('image/')) {
    return 'image'
  }

  if (file.type.startsWith('video/')) {
    return 'video'
  }

  if (
    file.type === 'application/pdf' ||
    file.type.startsWith('text/') ||
    file.type.includes('word') ||
    /\.(pdf|doc|docx|txt)$/i.test(file.name)
  ) {
    return 'document'
  }

  return 'other'
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )

  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

const getFileIcon = (type) => {
  if (type === 'image') return <FaCamera />
  if (type === 'video') return <FaVideo />
  return <FaFileAlt />
}

const getDistrictName = (district) =>
  district?.dname ||
  district?.name ||
  district?.district_name ||
  district?.districtName ||
  ''

const extractError = (err, fallback) => {
  const data = err?.response?.data

  if (!data) {
    return fallback
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  if (data.non_field_errors) {
    return data.non_field_errors.join(' ')
  }

  const messages = Object.values(data)
    .flat()
    .filter(Boolean)
    .map(String)

  return messages.length ? messages.join(' ') : fallback
}

const UserFileComplaint = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    branch: '',
    representative: '',
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
  })

  const [nearbyBranches, setNearbyBranches] = useState([])
  const [nearbyRepresentatives, setNearbyRepresentatives] = useState([])

  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [districtQuery, setDistrictQuery] = useState('')
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)

  const [manualMode, setManualMode] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [repSearch, setRepSearch] = useState('')
  const [branchSearchWithinDistrict, setBranchSearchWithinDistrict] =
    useState('')

  const [branchSearch, setBranchSearch] = useState('')
  const [showBranchSearch, setShowBranchSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchingBranches, setSearchingBranches] = useState(false)

  const [filteredRepresentatives, setFilteredRepresentatives] = useState([])
  const [filteredBranches, setFilteredBranches] = useState([])

  const [attachments, setAttachments] = useState([])

  /*
   * Voice is intentionally English-only.
   * No language selector is displayed.
   */
  const voiceLanguage = 'en'

  const [voiceFile, setVoiceFile] = useState(null)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState(null)

  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const districtDropdownRef = useRef(null)

  /*
   * ============================================================
   * LOAD DISTRICTS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true

    const loadDistricts = async () => {
      try {
        const data = await getDistricts()

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
              ? data.data
              : []

        if (mounted) {
          setDistricts(results)
        }
      } catch (err) {
        console.error('Failed to load districts:', err)
      }
    }

    loadDistricts()

    return () => {
      mounted = false
    }
  }, [])

  /*
   * ============================================================
   * OUTSIDE CLICK
   * ============================================================
   */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        districtDropdownRef.current &&
        !districtDropdownRef.current.contains(event.target)
      ) {
        setShowDistrictDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  /*
   * ============================================================
   * CLEANUP
   * ============================================================
   */

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      attachments.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl)
      }
    }

    // Cleanup only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /*
   * ============================================================
   * FILTER AUTHORITIES
   * ============================================================
   */

  useEffect(() => {
    const source = nearbyRepresentatives
    const searchTerm = repSearch.trim().toLowerCase()

    if (!searchTerm) {
      setFilteredRepresentatives(source)
      return
    }

    setFilteredRepresentatives(
      source.filter((representative) => {
        const name =
          representative.name ||
          representative.user_profile?.user?.first_name ||
          ''

        const constituency =
          representative.constituency_name ||
          representative.constituency?.name ||
          ''

        return (
          name.toLowerCase().includes(searchTerm) ||
          constituency.toLowerCase().includes(searchTerm)
        )
      })
    )
  }, [repSearch, nearbyRepresentatives])

  useEffect(() => {
    const source = nearbyBranches
    const searchTerm = branchSearchWithinDistrict.trim().toLowerCase()

    if (!searchTerm) {
      setFilteredBranches(source)
      return
    }

    setFilteredBranches(
      source.filter((branch) => {
        const name = branch.branch_name || branch.name || ''
        const place = branch.placename || ''
        const department =
          branch.department_name ||
          branch.deptid?.deptname ||
          ''

        return (
          name.toLowerCase().includes(searchTerm) ||
          place.toLowerCase().includes(searchTerm) ||
          department.toLowerCase().includes(searchTerm)
        )
      })
    )
  }, [branchSearchWithinDistrict, nearbyBranches])

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  const selectBranch = (branchId) => {
    setFormData((previous) => ({
      ...previous,
      branch: String(branchId),
      representative: '',
    }))

    setError('')
  }

  const selectRepresentative = (representativeId) => {
    setFormData((previous) => ({
      ...previous,
      representative: String(representativeId),
      branch: '',
    }))

    setError('')
  }

  /*
   * ============================================================
   * CURRENT LOCATION
   * ============================================================
   */

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setGettingLocation(true)
    setManualMode(false)
    setError('')
    setSuccess('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        setFormData((previous) => ({
          ...previous,
          latitude: String(latitude),
          longitude: String(longitude),
        }))

        try {
          const data = await getNearbyAuthorities(
            latitude,
            longitude,
            15
          )

          const representatives = Array.isArray(data?.representatives)
            ? data.representatives
            : []

          const branches = Array.isArray(data?.branches)
            ? data.branches
            : []

          setNearbyRepresentatives(representatives)
          setNearbyBranches(branches)

          setSelectedDistrict(null)
          setDistrictQuery('')
          setShowDistrictDropdown(false)
          setShowBranchSearch(false)
          setSearchResults([])
          setRepSearch('')
          setBranchSearchWithinDistrict('')

          if (!representatives.length && !branches.length) {
            setError(
              'No representatives or branches were found near your current location.'
            )
          }
        } catch (err) {
          console.error('Failed to get nearby authorities:', err)

          setNearbyRepresentatives([])
          setNearbyBranches([])

          setError(
            'Unable to find representatives or branches near your location.'
          )
        } finally {
          setGettingLocation(false)
        }
      },
      () => {
        setError(
          'Unable to get your current location. Please allow location access and try again.'
        )

        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  /*
   * ============================================================
   * DISTRICT SEARCH
   * ============================================================
   */

  const filteredDistricts = districts.filter((district) =>
    getDistrictName(district)
      .toLowerCase()
      .includes(districtQuery.trim().toLowerCase())
  )

  const handleDistrictSelect = async (district) => {
    const districtId = district?.id
    const districtName = getDistrictName(district)

    if (!districtId) {
      setError('Selected district does not have a valid ID.')
      return
    }

    setSelectedDistrict(district)
    setDistrictQuery(districtName)
    setShowDistrictDropdown(false)
    setManualLoading(true)

    setError('')
    setSuccess('')
    setSearchResults([])
    setShowBranchSearch(false)
    setBranchSearch('')
    setRepSearch('')
    setBranchSearchWithinDistrict('')

    try {
      const data = await getAuthoritiesByDistrict(districtId, {
        lat: formData.latitude || undefined,
        lng: formData.longitude || undefined,
      })

      const representatives = Array.isArray(data?.representatives)
        ? data.representatives
        : []

      const branches = Array.isArray(data?.branches)
        ? data.branches
        : []

      setNearbyRepresentatives(representatives)
      setNearbyBranches(branches)

      if (!representatives.length && !branches.length) {
        setError(`No representatives or branches found in ${districtName}.`)
      }
    } catch (err) {
      console.error('District authority lookup failed:', err)

      setNearbyRepresentatives([])
      setNearbyBranches([])

      setError(
        extractError(
          err,
          `Unable to fetch authorities for ${districtName}. Please try again.`
        )
      )
    } finally {
      setManualLoading(false)
    }
  }

  const clearDistrictSelection = () => {
    setSelectedDistrict(null)
    setDistrictQuery('')
    setShowDistrictDropdown(false)

    setNearbyRepresentatives([])
    setNearbyBranches([])

    setFilteredRepresentatives([])
    setFilteredBranches([])

    setRepSearch('')
    setBranchSearchWithinDistrict('')
    setError('')
  }

  /*
   * ============================================================
   * BRANCH SEARCH
   * ============================================================
   */

  const handleBranchSearch = async () => {
    const value = branchSearch.trim()

    if (!value) {
      setError('Enter a branch, place, district or department.')
      return
    }

    try {
      setSearchingBranches(true)
      setError('')

      const data = await searchBranches(value)

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : []

      setSearchResults(results)

      if (!results.length) {
        setError(`No branches found for "${value}".`)
      }
    } catch (err) {
      console.error('Branch search failed:', err)

      setSearchResults([])
      setError('Unable to search branches. Please try again.')
    } finally {
      setSearchingBranches(false)
    }
  }

  /*
   * ============================================================
   * ATTACHMENTS
   * ============================================================
   */

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || [])

    const accepted = []
    const rejected = []

    incoming.forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        rejected.push(`${file.name} is larger than 25 MB.`)
        return
      }

      const fileType = getFileType(file)

      if (fileType === 'other') {
        rejected.push(`${file.name}: unsupported file type.`)
        return
      }

      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        fileType,
        previewUrl:
          fileType === 'image' || fileType === 'video'
            ? URL.createObjectURL(file)
            : null,
      })
    })

    setAttachments((previous) => [
      ...previous,
      ...accepted,
    ])

    setError(
      rejected.length
        ? rejected.join(' ')
        : ''
    )
  }

  const removeAttachment = (id) => {
    setAttachments((previous) => {
      const item = previous.find((entry) => entry.id === id)

      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }

      return previous.filter((entry) => entry.id !== id)
    })
  }

  /*
   * ============================================================
   * VOICE RECORDING
   * ============================================================
   */

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Voice recording is not supported by this browser.'
      )
      return
    }

    try {
      setError('')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg',
      ]

      const mimeType = preferredTypes.find((type) =>
        window.MediaRecorder?.isTypeSupported(type)
      )

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      recordedChunksRef.current = []
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())

        const blob = new Blob(
          recordedChunksRef.current,
          {
            type: recorder.mimeType || 'audio/webm',
          }
        )

        if (blob.size > MAX_VOICE_SIZE) {
          setError('Voice recording must be under 15 MB.')
          setVoiceFile(null)
          return
        }

        /*
         * IMPORTANT:
         *
         * Use the existing voicePreviewUrl state.
         * There is no voicePreviewUrlRef anymore.
         */
        setVoicePreviewUrl((previousUrl) => {
          if (previousUrl) {
            URL.revokeObjectURL(previousUrl)
          }

          return URL.createObjectURL(blob)
        })

        setVoiceFile(blob)
      }

      recorder.start()

      setRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((value) => value + 1)
      }, 1000)
    } catch (err) {
      console.error('Voice recording failed:', err)

      setError(
        'Microphone access was denied or recording could not be started.'
      )
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    setRecording(false)
  }

  const removeVoice = () => {
    if (voicePreviewUrl) {
      URL.revokeObjectURL(voicePreviewUrl)
    }

    setVoicePreviewUrl(null)
    setVoiceFile(null)
    setRecordingSeconds(0)
  }

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(
      2,
      '0'
    )}`
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!formData.branch && !formData.representative) {
      setError('Please select a branch or representative.')
      return
    }

    if (formData.branch && formData.representative) {
      setError('Please select only one authority.')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a complaint title.')
      return
    }

    if (!formData.description.trim()) {
      setError('Please enter a complaint description.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
      }

      if (formData.branch) {
        payload.branch = Number(formData.branch)
      }

      if (formData.representative) {
        payload.representative = Number(formData.representative)
      }

      if (formData.latitude && formData.longitude) {
        payload.latitude = Number(formData.latitude)
        payload.longitude = Number(formData.longitude)
      }

      /*
       * 1. CREATE COMPLAINT
       */

      const complaint = await createComplaint(payload)
      const complaintId = complaint?.id

      if (!complaintId) {
        throw new Error(
          'Complaint was created but the server did not return its ID.'
        )
      }

      const failedUploads = []

      /*
       * 2. ATTACHMENTS
       */

      if (attachments.length) {
        setUploadingFiles(true)

        for (const item of attachments) {
          try {
            await uploadComplaintAttachment(
              complaintId,
              item.file,
              item.fileType
            )
          } catch (err) {
            console.error(
              `Attachment upload failed: ${item.file.name}`,
              err?.response?.data || err
            )

            failedUploads.push(item.file.name)
          }
        }

        setUploadingFiles(false)
      }

      /*
       * 3. VOICE
       *
       * English is always sent.
       */

      if (voiceFile) {
        try {
          await uploadComplaintVoice(
            complaintId,
            voiceFile,
            voiceLanguage
          )
        } catch (err) {
          console.error(
            'Voice upload failed:',
            err?.response?.data || err
          )

          failedUploads.push('voice recording')
        }
      }

      /*
       * 4. SUCCESS
       */

      if (failedUploads.length) {
        setSuccess(
          `Complaint #${complaintId} was submitted, but some files could not be uploaded: ${failedUploads.join(
            ', '
          )}.`
        )
      } else {
        setSuccess(
          `Complaint #${complaintId} submitted successfully${
            attachments.length || voiceFile
              ? ` with ${attachments.length} attachment${
                  attachments.length === 1 ? '' : 's'
                }${voiceFile ? ' and voice input' : ''}`
              : ''
          }.`
        )
      }

      setTimeout(() => {
        navigate('/user/complaint-history')
      }, 1800)
    } catch (err) {
      console.error('Failed to create complaint:', err)

      setError(
        extractError(
          err,
          'Unable to submit complaint. Please try again.'
        )
      )
    } finally {
      setLoading(false)
      setUploadingFiles(false)
    }
  }

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  const handleReset = () => {
    attachments.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })

    if (recording) {
      stopRecording()
    }

    if (voicePreviewUrl) {
      URL.revokeObjectURL(voicePreviewUrl)
    }

    setFormData({
      branch: '',
      representative: '',
      title: '',
      description: '',
      location: '',
      latitude: '',
      longitude: '',
    })

    setNearbyBranches([])
    setNearbyRepresentatives([])

    setDistrictQuery('')
    setSelectedDistrict(null)
    setShowDistrictDropdown(false)

    setRepSearch('')
    setBranchSearchWithinDistrict('')

    setBranchSearch('')
    setSearchResults([])
    setShowBranchSearch(false)

    setAttachments([])

    setVoiceFile(null)
    setVoicePreviewUrl(null)
    setRecordingSeconds(0)

    setError('')
    setSuccess('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <UserLayout>
      <div className={Styles.container}>
        <header className={Styles.header}>
          <div>
            <h1>File a Complaint</h1>
            <p>
              Report an issue to the appropriate authority.
            </p>
          </div>
        </header>

        <div className={Styles.formCard}>
          {error && (
            <div className={Styles.errorMessage}>
              {error}
            </div>
          )}

          {success && (
            <div className={Styles.successMessage}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ==================================================
                AUTHORITY
            ================================================== */}

            <section className={Styles.section}>
              <div className={Styles.sectionHeader}>
                <div>
                  <h2>Select Complaint Authority</h2>
                  <p className={Styles.helpText}>
                    Find an authority using your location or select
                    a district manually.
                  </p>
                </div>
              </div>

              <div className={Styles.authorityMethod}>
                <button
                  type="button"
                  className={Styles.locationButton}
                  onClick={() => {
                    setManualMode(false)
                    setSelectedDistrict(null)
                    setDistrictQuery('')
                    setShowDistrictDropdown(false)
                    setRepSearch('')
                    setBranchSearchWithinDistrict('')
                    getCurrentLocation()
                  }}
                  disabled={
                    gettingLocation ||
                    manualLoading ||
                    loading
                  }
                >
                  <FaMapMarkerAlt />

                  {gettingLocation
                    ? 'Finding Authorities...'
                    : 'Use My Current Location'}
                </button>

                <div className={Styles.methodDivider}>
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className={Styles.manualButton}
                  onClick={() => {
                    setManualMode(true)
                    setError('')
                    setSuccess('')

                    setNearbyRepresentatives([])
                    setNearbyBranches([])
                    setFilteredRepresentatives([])
                    setFilteredBranches([])

                    setSearchResults([])
                    setShowBranchSearch(false)
                    setBranchSearch('')

                    setRepSearch('')
                    setBranchSearchWithinDistrict('')
                  }}
                  disabled={
                    gettingLocation ||
                    manualLoading ||
                    loading
                  }
                >
                  <FaSearch />
                  Find Manually
                </button>
              </div>

              {/* MANUAL DISTRICT */}

              {manualMode && (
                <div className={Styles.districtSearchBox}>
                  <div className={Styles.subsectionHeader}>
                    <h3>Search by District</h3>
                    <p className={Styles.helpText}>
                      Select a district to view its representatives
                      and branches.
                    </p>
                  </div>

                  <div
                    ref={districtDropdownRef}
                    className={Styles.districtDropdownWrapper}
                  >
                    <div className={Styles.searchRow}>
                      <FaSearch />

                      <input
                        type="text"
                        value={districtQuery}
                        placeholder="Search district..."
                        className={Styles.districtInput}
                        onChange={(event) => {
                          const value = event.target.value

                          setDistrictQuery(value)
                          setShowDistrictDropdown(true)
                          setError('')

                          if (
                            selectedDistrict &&
                            value !==
                              getDistrictName(selectedDistrict)
                          ) {
                            setSelectedDistrict(null)
                            setNearbyRepresentatives([])
                            setNearbyBranches([])
                          }
                        }}
                        onFocus={() =>
                          setShowDistrictDropdown(true)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setShowDistrictDropdown(false)
                          }

                          if (
                            event.key === 'Enter' &&
                            filteredDistricts.length === 1
                          ) {
                            event.preventDefault()
                            handleDistrictSelect(
                              filteredDistricts[0]
                            )
                          }
                        }}
                        disabled={manualLoading || loading}
                        autoComplete="off"
                      />

                      {districtQuery && !manualLoading && (
                        <button
                          type="button"
                          className={Styles.clearSearchButton}
                          onClick={clearDistrictSelection}
                          aria-label="Clear district"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>

                    {showDistrictDropdown && (
                      <div className={Styles.districtDropdown}>
                        {filteredDistricts.length ? (
                          filteredDistricts.map((district) => {
                            const id = district?.id
                            const name = getDistrictName(district)

                            return (
                              <button
                                type="button"
                                key={id}
                                className={Styles.districtOption}
                                onClick={() =>
                                  handleDistrictSelect(district)
                                }
                              >
                                <FaMapMarkerAlt />
                                <span>{name}</span>
                              </button>
                            )
                          })
                        ) : (
                          <div className={Styles.noDistrictResults}>
                            No districts found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {manualLoading && (
                    <div className={Styles.loadingHint}>
                      Finding authorities in{' '}
                      {districtQuery || 'selected district'}...
                    </div>
                  )}

                  {selectedDistrict && !manualLoading && (
                    <>
                      <div className={Styles.locationDetected}>
                        <FaCheckCircle />

                        <span>
                          Showing authorities in{' '}
                          <strong>
                            {getDistrictName(selectedDistrict)}
                          </strong>
                          {formData.latitude &&
                          formData.longitude
                            ? ' • Branches are sorted using your current location.'
                            : ''}
                        </span>
                      </div>

                      <div className={Styles.districtSearchSection}>
                        {/* REPRESENTATIVE */}

                        <div className={Styles.selectionField}>
                          <label
                            className={Styles.selectionLabel}
                          >
                            <FaUserTie />
                            Representative
                          </label>

                          <div className={Styles.searchDropdown}>
                            <div
                              className={
                                Styles.districtSearchItem
                              }
                            >
                              <FaSearch />

                              <input
                                type="text"
                                value={repSearch}
                                placeholder="Search representatives..."
                                onChange={(event) =>
                                  setRepSearch(event.target.value)
                                }
                                className={
                                  Styles.districtSearchInput
                                }
                              />

                              {repSearch && (
                                <button
                                  type="button"
                                  className={
                                    Styles.clearSearchButton
                                  }
                                  onClick={() =>
                                    setRepSearch('')
                                  }
                                  aria-label="Clear representative search"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>

                            <div
                              className={
                                Styles.selectionDropdown
                              }
                            >
                              {filteredRepresentatives.length ? (
                                filteredRepresentatives.map(
                                  (representative) => {
                                    const id = representative.id
                                    const selected =
                                      formData.representative ===
                                      String(id)

                                    return (
                                      <button
                                        type="button"
                                        key={id}
                                        className={`${Styles.selectionOption} ${
                                          selected
                                            ? Styles.selectionOptionSelected
                                            : ''
                                        }`}
                                        onClick={() =>
                                          selectRepresentative(id)
                                        }
                                      >
                                        <span
                                          className={
                                            Styles.optionIcon
                                          }
                                        >
                                          <FaUserTie />
                                        </span>

                                        <span
                                          className={
                                            Styles.optionContent
                                          }
                                        >
                                          <strong>
                                            {representative.name ||
                                              `Representative #${id}`}
                                          </strong>

                                          <small>
                                            {representative.constituency_name ||
                                              'Constituency not available'}
                                          </small>
                                        </span>

                                        {selected && (
                                          <FaCheckCircle />
                                        )}
                                      </button>
                                    )
                                  }
                                )
                              ) : (
                                <div
                                  className={
                                    Styles.noSelectionResults
                                  }
                                >
                                  No representatives found.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* BRANCH */}

                        <div className={Styles.selectionField}>
                          <label
                            className={Styles.selectionLabel}
                          >
                            <FaBuilding />
                            Branch
                          </label>

                          <div className={Styles.searchDropdown}>
                            <div
                              className={
                                Styles.districtSearchItem
                              }
                            >
                              <FaSearch />

                              <input
                                type="text"
                                value={
                                  branchSearchWithinDistrict
                                }
                                placeholder="Search branches..."
                                onChange={(event) =>
                                  setBranchSearchWithinDistrict(
                                    event.target.value
                                  )
                                }
                                className={
                                  Styles.districtSearchInput
                                }
                              />

                              {branchSearchWithinDistrict && (
                                <button
                                  type="button"
                                  className={
                                    Styles.clearSearchButton
                                  }
                                  onClick={() =>
                                    setBranchSearchWithinDistrict(
                                      ''
                                    )
                                  }
                                  aria-label="Clear branch search"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>

                            <div
                              className={
                                Styles.selectionDropdown
                              }
                            >
                              {filteredBranches.length ? (
                                filteredBranches.map((branch) => {
                                  const id = branch.id
                                  const selected =
                                    formData.branch === String(id)

                                  return (
                                    <button
                                      type="button"
                                      key={id}
                                      className={`${Styles.selectionOption} ${
                                        selected
                                          ? Styles.selectionOptionSelected
                                          : ''
                                      }`}
                                      onClick={() =>
                                        selectBranch(id)
                                      }
                                    >
                                      <span
                                        className={
                                          Styles.optionIcon
                                        }
                                      >
                                        <FaBuilding />
                                      </span>

                                      <span
                                        className={
                                          Styles.optionContent
                                        }
                                      >
                                        <strong>
                                          {branch.branch_name ||
                                            branch.name ||
                                            `Branch #${id}`}
                                        </strong>

                                        <small>
                                          {branch.placename ||
                                            branch.address ||
                                            branch.district_name ||
                                            'Location unavailable'}
                                          {branch.distance_km != null
                                            ? ` • ${branch.distance_km} km`
                                            : ''}
                                        </small>
                                      </span>

                                      {selected && (
                                        <FaCheckCircle />
                                      )}
                                    </button>
                                  )
                                })
                              ) : (
                                <div
                                  className={
                                    Styles.noSelectionResults
                                  }
                                >
                                  No branches found.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* LOCATION REPRESENTATIVES */}

              {!manualMode &&
                filteredRepresentatives.length > 0 && (
                  <div className={Styles.authorityGroup}>
                    <div className={Styles.groupTitle}>
                      <FaUserTie />
                      <span>Representatives</span>
                    </div>

                    <div className={Styles.authorityList}>
                      {filteredRepresentatives.map(
                        (representative) => {
                          const id = representative.id
                          const selected =
                            formData.representative === String(id)

                          return (
                            <button
                              type="button"
                              key={id}
                              className={`${Styles.authorityCard} ${
                                selected
                                  ? Styles.selectedAuthority
                                  : ''
                              }`}
                              onClick={() =>
                                selectRepresentative(id)
                              }
                            >
                              <div className={Styles.authorityIcon}>
                                <FaUserTie />
                              </div>

                              <div className={Styles.authorityInfo}>
                                <div className={Styles.authorityName}>
                                  {representative.name ||
                                    `Representative #${id}`}
                                </div>

                                <div
                                  className={
                                    Styles.authorityDetail
                                  }
                                >
                                  <strong>Constituency:</strong>{' '}
                                  {representative.constituency_name ||
                                    '-'}
                                </div>

                                <div
                                  className={
                                    Styles.authorityDetail
                                  }
                                >
                                  <strong>Government Type:</strong>{' '}
                                  {representative.constituency_type_display ||
                                    '-'}
                                </div>

                                <div
                                  className={
                                    Styles.authorityDetail
                                  }
                                >
                                  <strong>District:</strong>{' '}
                                  {representative.district_name ||
                                    '-'}
                                </div>
                              </div>

                              {selected && (
                                <FaCheckCircle
                                  className={Styles.selectedIcon}
                                />
                              )}
                            </button>
                          )
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* LOCATION BRANCHES */}

              {!manualMode &&
                filteredBranches.length > 0 && (
                  <div className={Styles.authorityGroup}>
                    <div className={Styles.groupTitle}>
                      <FaBuilding />
                      <span>Nearby Branches</span>
                    </div>

                    <div className={Styles.authorityList}>
                      {filteredBranches.map((branch) => {
                        const id = branch.id
                        const selected =
                          formData.branch === String(id)

                        return (
                          <button
                            type="button"
                            key={id}
                            className={`${Styles.authorityCard} ${
                              selected
                                ? Styles.selectedAuthority
                                : ''
                            }`}
                            onClick={() =>
                              selectBranch(id)
                            }
                          >
                            <div className={Styles.authorityIcon}>
                              <FaBuilding />
                            </div>

                            <div className={Styles.authorityInfo}>
                              <div className={Styles.authorityName}>
                                {branch.branch_name ||
                                  `Branch #${id}`}
                              </div>

                              <div
                                className={
                                  Styles.authorityDetail
                                }
                              >
                                <strong>Department:</strong>{' '}
                                {branch.department_name || '-'}
                              </div>

                              <div
                                className={
                                  Styles.authorityDetail
                                }
                              >
                                <strong>Place:</strong>{' '}
                                {branch.placename || '-'}
                              </div>

                              <div
                                className={
                                  Styles.authorityDetail
                                }
                              >
                                <strong>District:</strong>{' '}
                                {branch.district_name || '-'}
                              </div>

                              {branch.distance_km != null && (
                                <div className={Styles.distance}>
                                  {Number(
                                    branch.distance_km
                                  ).toFixed(2)}{' '}
                                  km away
                                </div>
                              )}
                            </div>

                            {selected && (
                              <FaCheckCircle
                                className={Styles.selectedIcon}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              {/* BRANCH FALLBACK SEARCH */}

              {!manualMode &&
                !gettingLocation &&
                formData.latitude &&
                nearbyBranches.length === 0 && (
                  <div className={Styles.branchSearchBox}>
                    <div className={Styles.noAuthorities}>
                      <FaBuilding />

                      <div>
                        <strong>No nearby branch found</strong>
                        <span>
                          Search for a branch manually.
                        </span>
                      </div>
                    </div>

                    {!showBranchSearch ? (
                      <button
                        type="button"
                        className={
                          Styles.searchBranchButton
                        }
                        onClick={() => {
                          setShowBranchSearch(true)
                          setError('')
                        }}
                      >
                        <FaSearch />
                        Search Branch
                      </button>
                    ) : (
                      <div className={Styles.branchSearch}>
                        <div className={Styles.searchRow}>
                          <input
                            type="text"
                            value={branchSearch}
                            onChange={(event) =>
                              setBranchSearch(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                handleBranchSearch()
                              }
                            }}
                            placeholder="Branch, place, district or department..."
                          />

                          <button
                            type="button"
                            className={
                              Styles.searchBranchButton
                            }
                            onClick={handleBranchSearch}
                            disabled={searchingBranches}
                          >
                            <FaSearch />

                            {searchingBranches
                              ? 'Searching...'
                              : 'Search'}
                          </button>
                        </div>

                        {searchResults.length > 0 && (
                          <div className={Styles.searchResults}>
                            {searchResults.map((branch) => {
                              const id = branch.id
                              const selected =
                                formData.branch === String(id)

                              return (
                                <button
                                  type="button"
                                  key={id}
                                  className={`${Styles.authorityCard} ${
                                    selected
                                      ? Styles.selectedAuthority
                                      : ''
                                  }`}
                                  onClick={() =>
                                    selectBranch(id)
                                  }
                                >
                                  <div
                                    className={
                                      Styles.authorityIcon
                                    }
                                  >
                                    <FaBuilding />
                                  </div>

                                  <div
                                    className={
                                      Styles.authorityInfo
                                    }
                                  >
                                    <div
                                      className={
                                        Styles.authorityName
                                      }
                                    >
                                      {branch.branch_name ||
                                        `Branch #${id}`}
                                    </div>

                                    <div
                                      className={
                                        Styles.authorityDetail
                                      }
                                    >
                                      <strong>
                                        Department:
                                      </strong>{' '}
                                      {branch.department_name ||
                                        '-'}
                                    </div>

                                    <div
                                      className={
                                        Styles.authorityDetail
                                      }
                                    >
                                      <strong>Place:</strong>{' '}
                                      {branch.placename || '-'}
                                    </div>

                                    <div
                                      className={
                                        Styles.authorityDetail
                                      }
                                    >
                                      <strong>District:</strong>{' '}
                                      {branch.district_name || '-'}
                                    </div>
                                  </div>

                                  {selected && (
                                    <FaCheckCircle
                                      className={
                                        Styles.selectedIcon
                                      }
                                    />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </section>

            {/* ==================================================
                DETAILS
            ================================================== */}

            <section className={Styles.section}>
              <div className={Styles.sectionHeader}>
                <div>
                  <h2>Complaint Details</h2>
                  <p className={Styles.helpText}>
                    Provide a clear description of the issue.
                  </p>
                </div>
              </div>

              <div className={Styles.formGroup}>
                <label htmlFor="title">
                  Complaint Title
                  <span className={Styles.required}>*</span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a short title"
                  maxLength={255}
                  required
                />
              </div>

              <div className={Styles.formGroup}>
                <label htmlFor="description">
                  Description
                  <span className={Styles.required}>*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your complaint in detail..."
                  rows={7}
                  required
                />
              </div>

            {/* ==================================================
                VOICE
            ================================================== */}

            <section className={Styles.section}>
              <div className={Styles.voicePanel}>
                <div className={Styles.voiceInfo}>
                  <div className={Styles.voiceIcon}>
                    <FaMicrophone />
                  </div>

                  <div>
                    <strong>Upload Voice Complaint</strong>
                    <span>
                      Maximum recording size: 15 MB
                    </span>
                  </div>
                </div>

                {!recording ? (
                  <button
                    type="button"
                    className={Styles.recordButton}
                    onClick={startRecording}
                    disabled={loading}
                  >
                    <FaMicrophone />
                    Record Voice
                  </button>
                ) : (
                  <button
                    type="button"
                    className={Styles.stopRecordButton}
                    onClick={stopRecording}
                  >
                    <FaStop />
                    Stop {formatRecordingTime(recordingSeconds)}
                  </button>
                )}
              </div>

              {voiceFile && !recording && (
                <div className={Styles.voicePreview}>
                  <audio
                    controls
                    src={voicePreviewUrl || undefined}
                  />

                  <button
                    type="button"
                    className={Styles.removeVoiceButton}
                    onClick={removeVoice}
                    disabled={loading}
                  >
                    <FaTrash />
                    Remove Recording
                  </button>
                </div>
              )}
            </section>

            {/* ==================================================
                ATTACHMENTS
            ================================================== */}

            <section className={Styles.section}>
              <div className={Styles.sectionHeader}>
                <div>
                  <h2>Attachments</h2>
                  <p className={Styles.helpText}>
                    Add photos, videos or supporting documents.
                    Maximum 25 MB per file.
                  </p>
                </div>
              </div>

              <div className={Styles.uploadOptions}>
                <button
                  type="button"
                  className={Styles.uploadOption}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={loading}
                >
                  <FaUpload />
                  Add Files
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  multiple
                  hidden
                  onChange={(event) => {
                    addFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
              </div>

              {attachments.length > 0 && (
                <div className={Styles.attachmentList}>
                  {attachments.map((item) => (
                    <div
                      key={item.id}
                      className={Styles.attachmentCard}
                    >
                      {item.previewUrl &&
                      item.fileType === 'image' ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className={
                            Styles.attachmentPreview
                          }
                        />
                      ) : item.previewUrl &&
                        item.fileType === 'video' ? (
                        <video
                          src={item.previewUrl}
                          className={
                            Styles.attachmentPreview
                          }
                          controls
                        />
                      ) : (
                        <div className={Styles.fileIcon}>
                          {getFileIcon(item.fileType)}
                        </div>
                      )}

                      <div className={Styles.attachmentInfo}>
                        <strong>{item.file.name}</strong>

                        <span>
                          {item.fileType} ·{' '}
                          {formatBytes(item.file.size)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          Styles.removeFileButton
                        }
                        onClick={() =>
                          removeAttachment(item.id)
                        }
                        disabled={loading}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
              <div className={Styles.formGroup}>
                <label htmlFor="location">
                  Issue Location
                </label>

                <textarea
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Describe where the issue occurred..."
                  rows={3}
                />
              </div>
            </section>


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className={Styles.actions}>
              <button
                type="button"
                className={Styles.cancelButton}
                onClick={handleReset}
                disabled={loading || recording}
              >
                <FaTimes />
                Clear
              </button>

              <button
                type="submit"
                className={Styles.submitButton}
                disabled={loading || recording}
              >
                {uploadingFiles ? (
                  <FaUpload />
                ) : (
                  <FaPaperPlane />
                )}

                {loading
                  ? uploadingFiles
                    ? 'Uploading Files...'
                    : 'Submitting...'
                  : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserLayout>
  )
}

export default UserFileComplaint