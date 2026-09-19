import api from "../../apiClient.js";

// Get complaints belonging to the logged-in branch
export const getBranchComplaints = async () => {
    const response = await api.get("/branch/complaints/");
    return response.data;
};

// Get FULL complaint details
// IMPORTANT: Do NOT use /branch/complaints/:id/ here.
// That endpoint is only for status/action updates.
export const getBranchComplaint = async (complaintId) => {
    const response = await api.get(
        `/complaints/${complaintId}/detail/`
    );
    return response.data;
};

// Update complaint status/action_taken
export const updateComplaintStatus = async (complaintId, data) => {
    const response = await api.patch(
        `/branch/complaints/${complaintId}/`,
        data
    );
    return response.data;
};

// Employees available for assignment
export const getAssignableEmployees = async () => {
    const response = await api.get(
        "/branch/branchemployee/assignable/"
    );
    return response.data;
};

// Assign complaint to branch employee
export const assignComplaint = async (complaintId, employeeId) => {
    const response = await api.patch(
        `/branch/complaints/${complaintId}/assign/`,
        {
            assigned_employee: employeeId,
        }
    );

    return response.data;
};