import api from "../../apiClient";

export const getConstituencies = async () => (
  await api.get('/admin/constituencies/')).data


export const getConstituencyTypes = async () => (
  await api.get('/admin/constituencies/types/')).data


export const createConstituency = async (data) => (
  await api.post('/admin/constituencies/', data)).data


export const updateConstituency = async (id, data) => (
  await api.patch(`/admin/constituencies/${id}/`, data)).data

export const deleteConstituency = async (id) => (
  await api.delete(`/admin/constituencies/${id}/`)).data
  
export const assignRepresentative = async (id, userId) =>
  (await api.patch(`/admin/constituencies/${id}/assign/`, { representative: userId })).data




