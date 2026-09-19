/**
 * Branch Dashboard API Services
 * All endpoints used by the enhanced BranchDashboard component
 */

import api from "../../apiClient.js";

// ============================================
// PROFILE ENDPOINTS
// ============================================

/**
 * Get current branch admin profile
 * @returns {Object} Profile data with name, email, branch_name, etc.
 */
export const getProfile = async () => {
  try {
    const response = await api.get("/branch/profile/");
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// ============================================
// COMPLAINTS ENDPOINTS
// ============================================

/**
 * Get all complaints for this branch
 * @returns {Array} List of complaints with pagination
 * @example
 * {
 *   results: [
 *     {
 *       id: 1,
 *       title: "Pothole",
 *       status: "pending",
 *       priority: "high",
 *       category: { name: "Road" },
 *       created_at: "2024-01-22",
 *       assigned_employee: { ... }
 *     }
 *   ],
 *   count: 45,
 *   next: null,
 *   previous: null
 * }
 */
export const getBranchComplaints = async (page = 1, filters = {}) => {
  try {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/branch/complaints/?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching branch complaints:", error);
    throw error;
  }
};

/**
 * Get full details of a specific complaint
 * IMPORTANT: Use this for detailed view, NOT /branch/complaints/:id/
 * That endpoint only handles status/action updates
 * @param {number} complaintId - The complaint ID
 * @returns {Object} Complete complaint data with nested relationships
 */
export const getBranchComplaint = async (complaintId) => {
  try {
    const response = await api.get(`/complaints/${complaintId}/detail/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching complaint ${complaintId}:`, error);
    throw error;
  }
};

/**
 * Update complaint status and action taken
 * @param {number} complaintId - Complaint ID
 * @param {Object} data - { status: string, action_taken: string }
 * @returns {Object} Updated complaint data
 * @example
 * updateComplaintStatus(1, {
 *   status: 'resolved',
 *   action_taken: 'Pothole filled and leveled'
 * })
 */
export const updateComplaintStatus = async (complaintId, data) => {
  try {
    const response = await api.patch(`/branch/complaints/${complaintId}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating complaint ${complaintId}:`, error);
    throw error;
  }
};

// ============================================
// EMPLOYEE & ASSIGNMENT ENDPOINTS
// ============================================

/**
 * Get all employees in this branch available for assignment
 * @returns {Array} List of branch employees
 * @example
 * [
 *   {
 *     id: 1,
 *     name: "Raj Kumar",
 *     email: "raj@civicconnect.com",
 *     branch_name: "Downtown",
 *     placename: "Central",
 *     designation: "supervisor"
 *   }
 * ]
 */
export const getAssignableEmployees = async () => {
  try {
    const response = await api.get("/branch/branchemployee/assignable/");
    return response.data;
  } catch (error) {
    console.error("Error fetching assignable employees:", error);
    throw error;
  }
};

/**
 * Assign a complaint to a branch employee
 * First assignment automatically moves status: PENDING -> IN_PROGRESS
 * @param {number} complaintId - Complaint ID
 * @param {number} employeeId - Employee ID
 * @returns {Object} Updated complaint data
 * @example
 * assignComplaint(1, 5)
 * // Result: complaint.assigned_employee = employee with id 5
 * // Result: complaint.status = 'in_progress' (if was pending)
 */
export const assignComplaint = async (complaintId, employeeId) => {
  try {
    const response = await api.patch(
      `/branch/complaints/${complaintId}/assign/`,
      {
        assigned_employee: employeeId,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error assigning complaint ${complaintId}:`, error);
    throw error;
  }
};

// ============================================
// STATISTICS & ANALYTICS HELPERS
// ============================================

/**
 * Calculate dashboard statistics from complaints
 * @param {Array} complaints - Array of complaint objects
 * @returns {Object} Calculated statistics
 */
export const calculateDashboardStats = (complaints) => {
  if (!complaints || complaints.length === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      avgResolutionTime: "N/A",
      satisfactionRate: "N/A",
    };
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    closed: complaints.filter((c) => c.status === "closed").length,
    rejected: complaints.filter((c) => c.status === "rejected").length,
    critical: complaints.filter((c) => c.priority === "critical").length,
    high: complaints.filter((c) => c.priority === "high").length,
    medium: complaints.filter((c) => c.priority === "medium").length,
    low: complaints.filter((c) => c.priority === "low").length,
  };

  // Calculate average resolution time
  const resolvedComplaints = complaints.filter((c) => c.resolved_at);
  if (resolvedComplaints.length > 0) {
    let totalDays = 0;
    resolvedComplaints.forEach((c) => {
      const created = new Date(c.created_at);
      const resolved = new Date(c.resolved_at);
      const days = (resolved - created) / (1000 * 60 * 60 * 24);
      totalDays += days;
    });
    const avgDays = (totalDays / resolvedComplaints.length).toFixed(1);
    stats.avgResolutionTime = `${avgDays} days`;
  }

  // Calculate satisfaction rate from feedback (if available)
  const complaintsWithFeedback = complaints.filter((c) => c.feedback);
  if (complaintsWithFeedback.length > 0) {
    const totalRating = complaintsWithFeedback.reduce(
      (sum, c) => sum + (c.feedback?.rating || 0),
      0
    );
    const avgRating = (totalRating / complaintsWithFeedback.length) * 20; // Convert to %
    stats.satisfactionRate = `${Math.round(avgRating)}%`;
  }

  return stats;
};

/**
 * Group complaints by status for chart data
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} Chart data array
 */
export const getStatusChartData = (complaints) => {
  const statusCounts = {
    pending: complaints.filter((c) => c.status === "pending").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    closed: complaints.filter((c) => c.status === "closed").length,
    rejected: complaints.filter((c) => c.status === "rejected").length,
  };

  return [
    { name: "Pending", value: statusCounts.pending, color: "#FFA500" },
    { name: "In Progress", value: statusCounts.in_progress, color: "#3B82F6" },
    { name: "Resolved", value: statusCounts.resolved, color: "#10B981" },
    { name: "Closed", value: statusCounts.closed, color: "#6B7280" },
    { name: "Rejected", value: statusCounts.rejected, color: "#EF4444" },
  ];
};

/**
 * Group complaints by priority for chart data
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} Chart data array
 */
export const getPriorityChartData = (complaints) => {
  const priorityCounts = {
    critical: complaints.filter((c) => c.priority === "critical").length,
    high: complaints.filter((c) => c.priority === "high").length,
    medium: complaints.filter((c) => c.priority === "medium").length,
    low: complaints.filter((c) => c.priority === "low").length,
  };

  return [
    { name: "Critical", value: priorityCounts.critical, color: "#EF4444" },
    { name: "High", value: priorityCounts.high, color: "#FFA500" },
    { name: "Medium", value: priorityCounts.medium, color: "#F59E0B" },
    { name: "Low", value: priorityCounts.low, color: "#10B981" },
  ];
};

/**
 * Group complaints by category for chart data
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} Chart data array
 */
export const getCategoryChartData = (complaints) => {
  const categoryMap = {};
  const colorMap = {
    Road: "#8B4513",
    Water: "#00B4D8",
    Waste: "#90EE90",
    Electricity: "#FFD700",
    Sanitation: "#708090",
  };

  complaints.forEach((c) => {
    const category = c.category?.name || "Others";
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  return Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      color: Object.values(colorMap)[idx] || "#A9A9A9",
    }));
};

/**
 * Get employee performance metrics
 * @param {Array} complaints - Array of complaint objects
 * @param {Array} employees - Array of employee objects
 * @returns {Array} Performance data sorted by satisfaction
 */
export const getEmployeePerformance = (complaints, employees) => {
  return employees
    .map((emp) => {
      const empComplaints = complaints.filter(
        (c) => c.assigned_employee?.id === emp.id
      );

      const resolved = empComplaints.filter(
        (c) => c.status === "resolved"
      ).length;
      const pending = empComplaints.filter(
        (c) => c.status === "in_progress" || c.status === "pending"
      ).length;

      // Calculate satisfaction from feedback
      const withFeedback = empComplaints.filter((c) => c.feedback);
      let satisfaction = 0;
      if (withFeedback.length > 0) {
        const avgRating =
          withFeedback.reduce((sum, c) => sum + (c.feedback?.rating || 0), 0) /
          withFeedback.length;
        satisfaction = avgRating * 20; // Convert to percentage
      }

      return {
        id: emp.id,
        name: emp.name || emp.emp_name || "Unknown",
        resolved,
        pending,
        satisfaction: Math.round(satisfaction) || 0,
        totalComplaints: empComplaints.length,
      };
    })
    .sort((a, b) => b.satisfaction - a.satisfaction)
    .slice(0, 4); // Top 4 employees
};

/**
 * Get resolution trend data (last 5 weeks)
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} Weekly trend data
 */
export const getResolutionTrend = (complaints) => {
  const weeks = [];
  const today = new Date();

  // Generate last 5 weeks
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekComplaints = complaints.filter((c) => {
      const date = new Date(c.created_at);
      return date >= weekStart && date <= weekEnd;
    });

    const resolved = weekComplaints.filter(
      (c) => c.status === "resolved"
    ).length;
    const pending = weekComplaints.filter(
      (c) => c.status === "pending" || c.status === "in_progress"
    ).length;

    weeks.push({
      week: `Week ${5 - i}`,
      resolved,
      pending,
      total: weekComplaints.length,
    });
  }

  return weeks;
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle API errors gracefully
 * @param {Error} error - Error object from API
 * @returns {Object} Formatted error object
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data?.detail || "Server error occurred",
      errors: error.response.data?.errors || {},
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: "No response from server. Check your connection.",
      errors: {},
    };
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message || "An unexpected error occurred",
      errors: {},
    };
  }
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Bulk update multiple complaints
 * @param {Array} complaintIds - Array of complaint IDs
 * @param {Object} updates - { status, action_taken, priority, etc. }
 * @returns {Promise} Array of update results
 */
export const bulkUpdateComplaints = async (complaintIds, updates) => {
  try {
    const promises = complaintIds.map((id) =>
      updateComplaintStatus(id, updates)
    );
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error in bulk update:", error);
    throw error;
  }
};

/**
 * Bulk assign complaints to employees
 * @param {Array} assignmentPairs - Array of { complaintId, employeeId }
 * @returns {Promise} Array of assignment results
 */
export const bulkAssignComplaints = async (assignmentPairs) => {
  try {
    const promises = assignmentPairs.map(({ complaintId, employeeId }) =>
      assignComplaint(complaintId, employeeId)
    );
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error in bulk assign:", error);
    throw error;
  }
};

// ============================================
// EXPORT
// ============================================

export default {
  // Profile
  getProfile,

  // Complaints
  getBranchComplaints,
  getBranchComplaint,
  updateComplaintStatus,

  // Employees
  getAssignableEmployees,
  assignComplaint,

  // Statistics
  calculateDashboardStats,
  getStatusChartData,
  getPriorityChartData,
  getCategoryChartData,
  getEmployeePerformance,
  getResolutionTrend,

  // Utilities
  handleApiError,
  bulkUpdateComplaints,
  bulkAssignComplaints,
};