import api from '../../apiClient.js';

// GET 
export const getUsers = async () => {
  const response = await api.get("admin/users/");
  return response.data;
};


// DELETE 
export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}/`)
  return response.data
}


// PATCH 
export const deactivateUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/`, {
    is_active: false,
  });
  return response.data;
};

export const reactivateUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/`, {
    is_active: true,
  });
  return response.data;
};