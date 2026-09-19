import api from "../../apiClient";

export const getDepartmentBranches = async (departmentId) => {
  const response = await api.get(`/admin/departments/${departmentId}/branches/`);
  return response.data;
};

export const getBranchEmployees = async (branchId) => {
  const response = await api.get(`/admin/branches/${branchId}/employees/`);

  return response.data;
};

