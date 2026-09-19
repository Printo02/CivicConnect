import api from "../../apiClient.js";

/* ============================================================
   REPRESENTATIVE COMPLAINT API
   ============================================================ */

/* ------------------------------------------------------------
   Get assigned complaints
------------------------------------------------------------ */
export const getRepresentativeComplaints = async () => {
  const response = await api.get(
    "/representative/complaints/"
  );

  return response.data;
};

/* ------------------------------------------------------------
   Get one complaint
------------------------------------------------------------ */
export const getRepresentativeComplaint = async (id) => {
  const response = await api.get(
    `/representative/complaints/${id}/detail/`
  );

  return response.data;
};

/* ------------------------------------------------------------
   Get complaint responses
------------------------------------------------------------ */
export const getRepresentativeComplaintResponses = async (
  complaintId
) => {
  const response = await api.get(
    `/representative/complaints/${complaintId}/responses/`
  );

  return response.data;
};

/* ------------------------------------------------------------
   Create representative response

   Backend expects:

   response
   attachments[]   optional

   Backend parser supports:
   - JSON
   - multipart/form-data
------------------------------------------------------------ */
export const createRepresentativeComplaintResponse = async (
  complaintId,
  responseText,
  files = []
) => {
  const formData = new FormData();

  formData.append(
    "response",
    responseText.trim()
  );

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await api.post(
    `/representative/complaints/${complaintId}/responses/`,
    formData
  );

  return response.data;
};

/* ------------------------------------------------------------
   Update complaint status + action taken

   Backend expects:

   {
     status: "...",
     action_taken: "..."
   }
------------------------------------------------------------ */
export const updateRepresentativeComplaint = async (
  id,
  data
) => {
  const response = await api.patch(
    `/representative/complaints/${id}/`,
    data
  );

  return response.data;
};