import api from "../../apiClient";


export const getDeptBranches = async () => {
    const response =  await api.get("/dept/branches/");
    return  response.data;
}

export const addDeptBranch = async (data) => {
    const response =  await api.post("/dept/branches/addbranches/",data);
    return  response.data;
}



export const deleteDeptBranch = async (data) => {
    const response =  await api.delete("/dept/branches/addbranches/{`id`}",data);
    return  response.data;
}





export const getDistricts = async () => {
    const response = await api.get("district/");
    return response.data;
};



export const updateBranch = async (id, data) => (
    await api.patch(`/dept/branches/${id}/`, data)
    ).data


export const deleteBranch = async (id) => (
    await api.delete(`/dept/branches/${id}/`)
    ).data


