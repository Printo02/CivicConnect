import api from "../../apiClient";

// Get employees belonging to the logged-in branch
export const getBranchEmployees = async () => {
  const response = await api.get(`/branch/branchemployee/`)
  return response.data
}


// Add employee to the logged-in branch
export const addBranchEmployee = async (data) => {
  const response = await api.post('/branch/branchemployee/add/',data)
  return response.data
}

export const toggleBranchEmployeeStatus = async (employeeId, isActive) => {
  const response = await api.patch(`/branch/branchemployee/${employeeId}/status/`,{is_active: isActive})
  return response.data
}

// Delete employee
export const deleteBranchEmployee = async (id) => {
  const response = await api.delete(`/branch/branchemployee/${id}/`)
  return response.data
}

