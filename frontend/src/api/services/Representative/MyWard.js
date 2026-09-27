import api from '../../apiClient.js'



export const createRepresentativeMyWardPost = async (data) => {
  const response = await api.post('/representative/myward/posts/', data)
  return response.data
}




// REPRESENTATIVE - MYWARD DISASTER REPORTS

export const getRepresentativeDisasters = async ({status,sort = 'latest',} = {}) => {
    const params = {sort}
    if (status) {
      params.status = status
    }

    const response = await api.get('/representative/myward/disasters/',{params})
    return response.data
  }


// REPRESENTATIVE - DISASTER DETAIL
export const getRepresentativeDisaster = async (disasterId) => {
    const response = await api.get(`/representative/myward/disasters/${disasterId}/`)
    return response.data
  }


// REPRESENTATIVE - COMMENT / AUTHORITY VERIFY
export const reviewRepresentativeDisaster = async (disasterId,{comment,is_verified}) => {
    const payload = {}
    if (typeof comment === 'string') {
      payload.comment = comment
    }

    if (typeof is_verified === 'boolean') {
      payload.is_verified =is_verified
    }

    const response = await api.post(`/representative/myward/disasters/${disasterId}/review/`,payload)
    return response.data
  }



  export const getRepresentativePublishedAlerts = async (latitude,longitude) => {
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

export const getRepresentativeMyWardPosts = async () => {
  const response = await api.get('/representative/myward/posts/')

  const data = response.data

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}