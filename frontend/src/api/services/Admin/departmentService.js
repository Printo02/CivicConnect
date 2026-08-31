import api from "../../apiClient";



// GET 

export const getDepartmentBranches = async(id)=>{
    const response = await api.get(`/admin/departments/${id}/branches/`);
    return response.data;
};

export const getDepartments = async () => {
    const response = await api.get("/admin/departments/");
    return response.data;
};

export const getDepartment = async (id) => {
    const response = await api.get(`/admin/departments/${id}/`);
    return response.data;
};

// export const getDepartments = async () => {
//     const response = await api.get("/admin/departments/");
//     return response.data;
// };



// POST 

export const addDepartment = async (departmentData) => {
    const response = await api.post("/admin/departments/add/",departmentData);
    return response.data;
};


export const addDepartmentBranch = async (deptId, data) => {
  const response = await api.post(
    `/admin/departments/${deptId}/branches/`,
    data
  );

  return response.data;
};

// export const generateDeptCredentials = async (id) => {
//   const res = await api.post(`/admin/depts/${id}/generate/`);
//   return res.data;
// };

// export const addDepartment = async(data)=>{
//     const response = await api.post("/admin/departments/",data);
//     return response.data;
// };




// PATCH 
export const verifyBranch = async(id)=>{
    const response = await api.patch(`/admin/branches/${id}/verify/`);
    return response.data;
};


// DELETE 
export const deleteDepartment = async (id) => {
  const response = await api.delete(
    `/admin/departments/${id}/delete/`
  );

  return response.data;
};

