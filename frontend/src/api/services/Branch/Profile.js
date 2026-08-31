import api from "../../apiClient";

// GET 
export const getProfile = async () => {
    const response = await api.get('/branch/profile/');
    return  response.data;
}

// POST 
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/branch/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data
}

// PATCH 
export const updateProfile = async (data) => {
  const response = await api.patch('/branch/profile/', data)
  return response.data
}