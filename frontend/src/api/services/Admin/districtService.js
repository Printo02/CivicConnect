import api from "../../apiClient";

// GET
export const getDistricts = async () => {
  const response = await api.get("district/");
  return response.data;
};