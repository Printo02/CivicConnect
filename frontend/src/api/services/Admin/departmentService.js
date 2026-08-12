import api from "../../apiClient";

export const getDepartments = async () => {
    const response = await api.get("/admin/departments/");
    return response.data;
};

export const addDepartment = async(data)=>{
    const response = await api.post("/admin/departments/",data);
    return response.data;
};

export const getDepartmentBranches = async(id)=>{
    const response = await api.get(`/admin/departments/${id}/branches/`);
    return response.data;
};

export const verifyBranch = async(id)=>{
    const response = await api.patch(`/admin/branches/${id}/verify/`);
    return response.data;
};


export const addDepartmentBranch = async (deptId, data) => {
  const response = await api.post(
    `/admin/departments/${deptId}/branches/`,
    data
  );

  return response.data;
};



export const deleteDepartment = async (id) => {
  const response = await api.delete(`/admin/departments/${id}/`);
  return response.data;
};



