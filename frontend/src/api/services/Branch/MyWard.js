import api from '../../apiClient.js'

// BRANCH MYWARD POSTS
export const getBranchMyWardPosts =async () => {
    const response =await api.get('/branch/myward/posts/')
    return response.data
  }

export const createBranchMyWardPost =async (data) => {
    const response =await api.post('/branch/myward/posts/',data)
    return response.data
  }

// BRANCH DISASTERS
export const getBranchDisasters =async (params = {}) => {
    const response =await api.get('/branch/myward/disasters/',{params})
    return response.data
  }

export const getBranchDisaster =async (disasterId) => {
    const response =await api.get(`/branch/myward/disasters/${disasterId}/`)
    return response.data
  }

export const reviewBranchDisaster =async (disasterId,data) => {
    const response =
      await api.post(`/branch/myward/disasters/${disasterId}/review/`,data)
    return response.data
  }


export const getBranchPublishedAlerts = async (latitude,longitude) => {
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