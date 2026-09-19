// api/services/BranchEmployee/Profile.js
import api from '../../apiClient'

export const getProfile = async () => {
  const response = await api.get('/branchemployee/profile/')
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.patch('/branchemployee/profile/', data)
  return response.data
}

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/branchemployee/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data
}