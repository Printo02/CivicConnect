import api from '../../apiClient'

// Get single complaint details
export const getComplaintDetails = async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}/`)
    return response.data
}

// Get complaint responses
export const getComplaintResponses = async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}/responses/`)
    return response.data
}

// Get complaint assignment history
export const getComplaintAssignmentHistory = async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}/assignment/history/`)
    return response.data
}

// Support / unsupport complaint
export const supportComplaint = async (complaintId) => {
    const response = await api.post(`/complaints/${complaintId}/support/`)
    return response.data
}

export const removeComplaintSupport = async (complaintId) => {
    const response = await api.delete(`/complaints/${complaintId}/support/`)
    return response.data
}

