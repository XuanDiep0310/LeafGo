import apiClient from "./apiClient";

// ==================== USER PROFILE ====================

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export async function getUserProfile() {
    const res = await apiClient.get("/api/Users/profile");
    return res.data;
}

/**
 * Update current user profile
 * @param {Object} payload - Update data
 * @param {string} [payload.fullName] - Full name
 * @param {string} [payload.phoneNumber] - Phone number
 * @returns {Promise} Updated user profile
 */
export async function updateUserProfile(payload) {
    const res = await apiClient.put("/api/Users/profile", payload);
    return res.data;
}

/**
 * Upload user avatar
 * @param {File} file - Image file
 * @returns {Promise} Avatar URL
 */
export async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append("File", file);

    const res = await apiClient.post("/api/Users/avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
}

// ==================== RIDE HISTORY ====================

/**
 * Get user ride history with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} [params.Page] - Page number
 * @param {number} [params.PageSize] - Items per page
 * @param {string} [params.Status] - Filter by status (Completed/Cancelled/InProgress)
 * @param {string} [params.FromDate] - Start date (ISO 8601)
 * @param {string} [params.ToDate] - End date (ISO 8601)
 * @returns {Promise} Paginated ride history
 */
export async function getRideHistory(params = {}) {
    const res = await apiClient.get("/api/Users/ride-history", {
        params
    });
    return res.data;
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Get completed rides only
 * @param {Object} params - Additional query params
 * @returns {Promise} List of completed rides
 */
export async function getCompletedRides(params = {}) {
    return getRideHistory({ ...params, Status: "Completed" });
}

/**
 * Get rides within date range
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {Object} params - Additional query params
 * @returns {Promise} List of rides in date range
 */
export async function getRidesByDateRange(fromDate, toDate, params = {}) {
    return getRideHistory({
        ...params,
        FromDate: fromDate.toISOString(),
        ToDate: toDate.toISOString(),
    });
}

/**
 * Get rides for current month
 * @param {Object} params - Additional query params
 * @returns {Promise} List of rides this month
 */
export async function getThisMonthRides(params = {}) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return getRidesByDateRange(firstDay, lastDay, params);
}

/**
 * Get rides for today
 * @param {Object} params - Additional query params
 * @returns {Promise} List of today's rides
 */
export async function getTodayRides(params = {}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getRidesByDateRange(today, tomorrow, params);
}

// Default export with all functions
export default {
    // Profile
    getUserProfile,
    updateUserProfile,
    uploadAvatar,

    // Ride History
    getRideHistory,
    getCompletedRides,
    getRidesByDateRange,
    getThisMonthRides,
    getTodayRides,
};