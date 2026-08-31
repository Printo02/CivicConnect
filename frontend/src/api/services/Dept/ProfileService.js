import api from '../../apiClient'

// GET 
export const getProfile = async () => {
  const response = await api.get('/dept/profile/')
  return response.data
}

// PATCH 
export const updateProfile = async (data) => {
  const response = await api.patch('/dept/profile/', data)
  return response.data
}

// POST 
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/dept/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data
}