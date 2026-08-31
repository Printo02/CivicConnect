import api from '../../apiClient.js'




// GET
export const getRepresentatives = async () => {const response = await api.get("/admin/representatives/");
    return response.data;
};


// POST
export const promoteUser = async (userProfileId) => {
    const response = await api.post("/admin/representatives/",{user_profile: userProfileId});
    return response.data;
};


// PATCH
export const updateRepresentative = async (representativeId,data) => {
    const response = await api.patch(`/admin/representatives/${representativeId}/`,data);
    return response.data;
};

export const toggleRepresentativeStatus = async (representativeId,isActive) => {
    const response = await api.patch(`/admin/representatives/${representativeId}/status/`,{is_active: isActive});
    return response.data;
};


export const assignRepresentative = async (constituencyId,data) => {
    const response = await api.patch(`/admin/constituencies/${constituencyId}/assign/`,data);
    return response.data;
};


// DELETE
export const deleteRepresentative = async (representativeId) => {
    const response = await api.delete(`/admin/representatives/${representativeId}/`);
    return response.data;
};


