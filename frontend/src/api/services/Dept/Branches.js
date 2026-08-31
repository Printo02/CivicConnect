import api from "../../apiClient";

// GET 
export const getDeptBranches = async () => {
    const response =  await api.get("/dept/branches/");
    return  response.data;
}

export const getDistricts = async () => {
    const response = await api.get("district/");
    return response.data;
};


// POST 
export const addDeptBranch = async (data) => {
    const response =  await api.post("/dept/branches/addbranches/",data);
    return  response.data;
}

// PATCH 
export const updateBranch = async (id, data) => (await api.patch(`/dept/branches/${id}/`, data)).data


// DELETE 
export const deleteBranch = async (id) => (await api.delete(`/dept/branches/${id}/`)).data

export const deleteDeptBranch = async (data) => {
    const response =  await api.delete("/dept/branches/addbranches/{`id`}",data);
    return  response.data;
}
