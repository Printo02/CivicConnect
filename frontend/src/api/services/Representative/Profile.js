import api from "../../apiClient";


// GET 
export const getProfile = async () => {
  const response = await api.get("/representative/profile/");
  return response.data;
};

export const getConstituency = async () => {
    const response = await api.get("/representative/constituency/");
    return response.data;
}



// PATCH 
export const updateProfile = async (data) => {
  const response = await api.patch("/representative/profile/",
    data,{
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};


// POST 
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/representative/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return response.data;
}




