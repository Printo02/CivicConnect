import api from '../../apiClient.js'

export const getRepresentativeComplaints = async () => {
  const response = await api.get('/representative/complaints/')

  return response.data
}