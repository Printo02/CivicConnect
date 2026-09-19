import api from "../../apiClient";

// Get complaints created by the logged-in user
export const getMyComplaints = async () => {
  const response = await api.get('/complaints/')
  return response.data
}

// Get a single complaint
export const getComplaint = async (complaintId) => {
  const response = await api.get(`/complaints/${complaintId}/`)
  return response.data
}

// Create a complaint
export const createComplaint = async (data) => {
  const response = await api.post('/complaints/', data)
  return response.data
}

// Update complaint details
export const updateComplaint = async (complaintId, data) => {
  const response = await api.patch(
    `/complaints/${complaintId}/`,
    data
  )
  return response.data
}

// Upload complaint attachment
export const uploadComplaintAttachment = async (
  complaintId,
  formData
) => {
  const response = await api.post(
    `/complaints/${complaintId}/attachments/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data
}

// Get complaint responses
export const getComplaintResponses = async (complaintId) => {
  const response = await api.get(
    `/complaints/${complaintId}/responses/`
  )

  return response.data
}

// Add response to complaint
export const addComplaintResponse = async (
  complaintId,
  responseText
) => {
  const response = await api.post(
    `/complaints/${complaintId}/responses/`,
    {
      response_text: responseText,
    }
  )

  return response.data
}

// Support complaint
export const supportComplaint = async (complaintId) => {
  const response = await api.post(
    `/complaints/${complaintId}/support/`
  )

  return response.data
}

// Remove support
export const removeComplaintSupport = async (complaintId) => {
  const response = await api.delete(
    `/complaints/${complaintId}/support/`
  )

  return response.data
}

