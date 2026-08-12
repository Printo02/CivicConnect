import api from "../../apiClient";

export const getDistricts = async () => {
  const response = await api.get("district/");
  return response.data;
};