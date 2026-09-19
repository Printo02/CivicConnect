import api from "../../apiClient.js";


//  BRANCH EMPLOYEE - COMPLAINT SERVICES


// GET ASSIGNED COMPLAINTS
export const getBranchEmployeeComplaints = async () => {
  const response = await api.get("/branchemployee/complaints/");
  return response.data;
};



// GET COMPLAINT DETAIL
export const getBranchEmployeeComplaint = async (complaintId) => {
  const response = await api.get(`/branchemployee/complaints/${complaintId}/detail/`);
  return response.data;
};



/* UPDATE COMPLAINT STATUS*/

export const updateBranchEmployeeComplaint = async (complaintId,data) => {
  const response = await api.patch(`/branchemployee/complaints/${complaintId}/`,data);
  return response.data;
};



/* GET COMPLAINT RESPONSES*/
export const getBranchEmployeeComplaintResponses = async (complaintId) => {
  const response = await api.get(`/branchemployee/complaints/${complaintId}/responses/`);
  return response.data;
};



/* CREATE COMPLAINT RESPONSE */

export const createBranchEmployeeComplaintResponse = async (complaintId,responseText,files = []) => {
  const formData = new FormData();
  formData.append("response",responseText);
  files.forEach((file) => {
    formData.append("attachments",file);
  });

  const response = await api.post(`/branchemployee/complaints/${complaintId}/responses/`,formData);

  return response.data;
};