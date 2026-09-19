import api from '../../apiClient'

// ============================================================
// Helpers
// ============================================================

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}


// ============================================================
// MEDIA URL
// ============================================================

export const getMediaUrl = (url) => {
  if (!url) {
    return null
  }

  // Already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

  // Django media is NOT under /api
  const serverBase = apiBase.replace(/\/api\/?$/,'')

  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`
}


// ============================================================
// USER COMPLAINTS
// ============================================================

export const getmycomplaints = async () => {
  const response = await api.get('/complaints/my/')
  return normalizeListResponse(response.data)
}


export const getComplaintDetail = async (complaintId) => {
  if (!complaintId) {
    throw new Error('Complaint ID is required')
  }

  const response = await api.get(`/complaints/${complaintId}/detail/`)
  return response.data
}


// ============================================================
// CREATE COMPLAINT
// ============================================================

export const createComplaint = async (data) => {
  const response = await api.post('/complaints/',data)
  return response.data
}


// ============================================================
// NEARBY
// ============================================================

export const getNearbyAuthorities = async (latitude,longitude,radiusKm = 15) => {
  if ( latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    throw new Error('Latitude and longitude are required')
  }

  const response = await api.get('/nearby/',{params: {lat: latitude,lng: longitude,radius_km: radiusKm}})
  return response.data
}


export const searchBranches = async (search = '') => {
  const response = await api.get('/branches/search/',
    {
      params: {
        search: search.trim(),
      },
    }
  )

  return normalizeListResponse(response.data)
}


// ============================================================
// ATTACHMENTS
// ============================================================

export const uploadComplaintAttachment = async (complaintId,file,fileType,description = '') => {
  if (!complaintId) {
    throw new Error('Complaint ID is required')
  }

  if (!file) {
    throw new Error('File is required')
  }

  if (!(file instanceof File)) {
    throw new Error('Attachment must be a File')
  }

  if (!fileType) {
    throw new Error('File type is required')
  }

  const formData = new FormData()
  formData.append('file',file)
  formData.append('file_type',fileType)

  if (description?.trim()) {
    formData.append('description',description.trim())
  }

  const response = await api.post(`/complaints/${complaintId}/attachments/upload/`,formData)
  return response.data
}


export const getComplaintAttachments = async (complaintId) => {
  if (!complaintId) {
    throw new Error('Complaint ID is required')
  }

  const response = await api.get(`/complaints/${complaintId}/attachments/`)
  return normalizeListResponse(response.data)
}


// ============================================================
// VOICE
// ============================================================

export const uploadComplaintVoice = async (complaintId,voiceFile,voiceLanguage = 'ml') => {
  if (!complaintId) {
    throw new Error('Complaint ID is required')
  }

  if (!voiceFile) {
    throw new Error('Voice file is required')
  }

  let file

  if (voiceFile instanceof File) {
    file = voiceFile
  } else if (voiceFile instanceof Blob) {
    const mimeType = voiceFile.type || 'audio/webm'

    let extension = 'webm'

    if (mimeType.includes('ogg')) {
      extension = 'ogg'
    } else if (mimeType.includes('wav')) {
      extension = 'wav'
    } else if (
      mimeType.includes('mp4') ||
      mimeType.includes('m4a')
    ) {
      extension = 'm4a'
    } else if (
      mimeType.includes('mpeg') ||
      mimeType.includes('mp3')
    ) {
      extension = 'mp3'
    } else if (mimeType.includes('aac')) {
      extension = 'aac'
    }

    file = new File([voiceFile],`voice_${Date.now()}.${extension}`,
      {
        type: mimeType,
      }
    )
  } else {
    throw new Error('Voice file must be a File or Blob')
  }

  const formData = new FormData()
  formData.append('audio_file',file)

  formData.append('voice_language',voiceLanguage)
  const response = await api.post(`/complaints/${complaintId}/voice-upload/`,formData)
  return response.data
}


export const getComplaintVoiceStatus = async (complaintId) => {
  const response = await api.get(`/complaints/${complaintId}/voice-status/`)
  return response.data
}


// ============================================================
// ESCALATION
// ============================================================

export const getComplaintEscalations = async (complaintId) => {
  const response = await api.get(`/complaints/${complaintId}/escalations/`)
  return normalizeListResponse(response.data)
}


export const escalateComplaint = async (complaintId,reason,notes,escalatedTo = null) => {
  const data = {
    complaint: complaintId,
    reason,
    notes,
  }

  if (escalatedTo) {
    data.escalated_to = escalatedTo
  }

  const response = await api.post('/complaints/escalate/',data)
  return response.data
}


// ============================================================
// SUPPORT / LIKE
// ============================================================

export const likeComplaint = async (complaintId) => {
  const response = await api.post('/complaints/like/',{complaint: complaintId,})
  return response.data
}


export const unlikeComplaint = async (complaintId) => {
  const response = await api.delete(`/complaints/${complaintId}/unlike/`)
  return response.data
}


// ============================================================
// TRANSLATION
// ============================================================

export const translateComplaint = async (complaintId) => {
  const response = await api.post(`/complaints/${complaintId}/translate/`)
  return response.data
}


export const translateText = async (text,sourceLanguage,targetLanguage) => {
  const response = await api.post('/translate/',{ text,source_language: sourceLanguage,target_language: targetLanguage})
  return response.data
}


// ============================================================
// FEEDBACK
// ============================================================

export const submitComplaintFeedback = async (
  complaintId,
  rating,
  comment = '',
  wouldRecommend = true
) => {
  const response = await api.post(
    '/complaints/feedback/',
    {
      complaint: complaintId,
      rating,
      comment,
      would_recommend: wouldRecommend,
    }
  )

  return response.data
}



export const getAuthoritiesByDistrict = (districtId, { search = '', lat, lng } = {}) => {
  const params = new URLSearchParams()
  params.set('district', districtId)
  if (search) params.set('search', search)
  if (lat && lng) {
    params.set('lat', lat)
    params.set('lng', lng)
  }
  return api.get(`/authorities/by-district/?${params.toString()}`).then((res) => res.data)
}

export const getDistricts = () => api.get('/district/').then((res) => res.data)