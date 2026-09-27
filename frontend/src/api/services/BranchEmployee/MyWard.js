import api from '../../apiClient.js'



// GET EMPLOYEE'S MYWARD SUBMISSIONS

export const getMyWardPosts = async (status = '') => {
  const params = {}
  if (status && status !== 'all') {
    params.status = status
  }

  const response = await api.get('/branchemployee/myward/posts/',{params})
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}


// CREATE POST

export const createMyWardPost = async (payload) => {
  const response = await api.post('/branchemployee/myward/posts/',payload)
  return response.data
}