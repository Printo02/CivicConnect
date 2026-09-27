import api from '../../apiClient.js'

export const getMyWardFeed = async (lat, lng, type = '') => {
  const response = await api.get('/myward/feed/', {
    params: { lat, lng, ...(type ? { type } : {}) },
  })
  return response.data
}

export const shareComplaintToMyWard = async (complaintId) => {
  const response = await api.post(`/myward/complaints/${complaintId}/share/`)
  return response.data
}

export const unshareComplaintFromMyWard = async (complaintId) => {
  await api.delete(`/myward/complaints/${complaintId}/share/`)
}

export const supportComplaint = async (complaintId) => {
  const response = await api.post('/complaints/like/', { complaint: complaintId })
  return response.data
}

export const removeComplaintSupport = async (complaintId) => {
  await api.delete(`/complaints/${complaintId}/unlike/`)
}

export const getMyComplaints = async () => {
  const response = await api.get('/complaints/my/')
  return response.data
}

export const createDisasterReport = async (formData) => {
    const response = await api.post('/myward/disasters/',formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      })
    return response.data
}

export const getWardDisasters = async (lat, lng) => {
    const response = await api.get('/myward/disasters/feed/',
      {
        params: {lat,lng},
      }
    )
    return response.data
}

export const verifyDisaster = async (disasterId,vote,latitude,longitude) => {
  const response = await api.post(`/myward/disasters/${disasterId}/verify/`,{vote,latitude,longitude})
  return response.data
}

export const removeDisasterVerification = async (disasterId) => {
    const response = await api.delete(`/myward/disasters/${disasterId}/verification/`)
    return response.data
  }


export const reviewDisasterByAuthority = async (disasterId,{comment = '',is_verified = false}) => {
    const response = await api.post(`/myward/disasters/${disasterId}/authority-review/`,{comment,is_verified})
    return response.data
  }


export const getUserPublishedAlerts = async (latitude,longitude) => {
  const response = await api.get('/myward/feed/',
    {
      params: {
        lat: latitude,
        lng: longitude,
      },
    }
  )
  return response.data
}
