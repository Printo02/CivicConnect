import api from '../../apiClient.js';


// GET 
export const getProfile = async () => {
    const response = await api.get('/user/profile/');
    return  response.data;
}

// POST 
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/user/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data
}


// PATCH 
export const updateProfile = async (data) => {
  const response = await api.patch(
    "/user/profile/",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};