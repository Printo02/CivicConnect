import api from '../../apiClient'

export const getProfile = async () => {
  const response = await api.get('/profile/')
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.patch('/profile/', data)
  return response.data
}

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data
}