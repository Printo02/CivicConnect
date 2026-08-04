import api from '../api/apiClient'

export const loginUser = async (email, password) => {
  const response = await api.post('/login/', { email, password })
  return response.data
}

export const registerUser = async (name, email, password) => {
  const response = await api.post('/register/', { first_name:name, email, password })
  return response.data
}
