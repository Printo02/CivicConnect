import api from "../../apiClient";

export const getAdminUserDashboard = async () => {
  const response = await api.get('/admin/dashboard/users/')
  return response.data
}