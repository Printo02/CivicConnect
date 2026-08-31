import api from "../../apiClient";

// GET 
export const getConstituencies = async () => (await api.get('/admin/constituencies/')).data

export const getConstituencyTypes = async () => (await api.get('/admin/constituencies/types/')).data

// POST 
export const createConstituency = async (data) => (await api.post('/admin/constituencies/', data)).data


// PATCH 
export const updateConstituency = async (id, data) => (await api.patch(`/admin/constituencies/${id}/`, data)).data

export const assignRepresentative = async (constituencyId,userId) => {
  const response = await api.patch(`/admin/constituencies/${constituencyId}/assign/`,{representative: userId,})
  return response.data
}

// DELETE 
export const deleteConstituency = async (id) => (
  await api.delete(`/admin/constituencies/${id}/`)).data
