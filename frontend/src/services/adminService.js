import apiClient from "./apiClient";

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} [params.Page] - Page number
 * @param {number} [params.PageSize] - Items per page
 * @param {string} [params.Role] - Filter by role (User/Driver/Admin)
 * @param {string} [params.Search] - Search by name, email, or phone
 * @param {boolean} [params.IsActive] - Filter by active status
 * @param {boolean} [params.IsOnline] - Filter by online status
 * @returns {Promise} Paginated list of users
 */
export async function getUsers(params = {}) {
    const res = await apiClient.get("/api/Admin/users", { params });
    return res.data;
}

/**
 * Create new user
 * @param {Object} payload - User data
 * @param {string} payload.email - User email (e.g., "user@example.com")
 * @param {string} payload.password - User password
 * @param {string} payload.fullName - Full name
 * @param {string} payload.phoneNumber - Phone number
 * @param {string} payload.role - User role (User/Driver)
 * @returns {Promise} Created user details
 */
export async function createUser(payload) {
    const res = await apiClient.post("/api/Admin/users", payload);
    return res.data;
}

/**
 * Get user by ID
 * @param {string} id - User UUID
 * @returns {Promise} User details
 */
export async function getUserById(id) {
    const res = await apiClient.get(`/api/Admin/users/${id}`);
    return res.data;
}

/**
 * Update user
 * @param {string} id - User UUID
 * @param {Object} payload - Update data
 * @param {string} [payload.fullName] - Full name
 * @param {string} [payload.phoneNumber] - Phone number
 * @param {boolean} [payload.isActive] - Active status
 * @returns {Promise} Updated user details
 */
export async function updateUser(id, payload) {
    const res = await apiClient.put(`/api/Admin/users/${id}`, payload);
    return res.data;
}

/**
 * Delete user
 * @param {string} id - User UUID
 * @returns {Promise} API response
 */
export async function deleteUser(id) {
    const res = await apiClient.delete(`/api/Admin/users/${id}`);
    return res.data;
}

/**
 * Toggle user active status
 * @param {string} id - User UUID
 * @param {boolean} isActive - Active status
 * @returns {Promise} API response
 */
export async function toggleUserStatus(id, isActive) {
    const res = await apiClient.put(`/api/Admin/users/${id}/toggle-status`, {
        isActive
    });
    return res.data;
}

// ==================== RIDE MANAGEMENT ====================

/**
 * Get all rides with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} [params.Page] - Page number
 * @param {number} [params.PageSize] - Items per page
 * @param {string} [params.Status] - Filter by status
 * @param {string} [params.FromDate] - Start date (ISO 8601)
 * @param {string} [params.ToDate] - End date (ISO 8601)
 * @param {string} [params.UserId] - Filter by user UUID
 * @param {string} [params.DriverId] - Filter by driver UUID
 * @returns {Promise} Paginated list of rides
 */
export async function getRides(params = {}) {
    const res = await apiClient.get("/api/Admin/rides", { params });
    return res.data;
}

/**
 * Get ride by ID
 * @param {string} id - Ride UUID
 * @returns {Promise} Ride details
 */
export async function getRideById(id) {
    const res = await apiClient.get(`/api/Admin/rides/${id}`);
    return res.data;
}

// ==================== STATISTICS ====================

/**
 * Get dashboard statistics
 * @returns {Promise} Dashboard statistics including:
 * - Total users, drivers, online drivers
 * - Total/pending/today rides
 * - Revenue stats
 * - Top drivers
 * - Revenue by month
 * - Rides by status
 */
export async function getStatistics() {
    const res = await apiClient.get("/api/Admin/statistics");
    return res.data;
}

// ==================== VEHICLE TYPES ====================

/**
 * Get all vehicle types
 * @returns {Promise} List of vehicle types with pricing and stats
 */
export async function getVehicleTypes() {
    const res = await apiClient.get("/api/Admin/vehicle-types");
    return res.data;
}

/**
 * Create new vehicle type
 * @param {Object} payload - Vehicle type data
 * @param {string} payload.name - Vehicle type name
 * @param {number} payload.basePrice - Base price
 * @param {number} payload.pricePerKm - Price per kilometer
 * @param {string} [payload.description] - Description
 * @returns {Promise} Created vehicle type
 */
export async function createVehicleType(payload) {
    const res = await apiClient.post("/api/Admin/vehicle-types", payload);
    return res.data;
}

/**
 * Get vehicle type by ID
 * @param {string} id - Vehicle type UUID
 * @returns {Promise} Vehicle type details
 */
export async function getVehicleTypeById(id) {
    const res = await apiClient.get(`/api/Admin/vehicle-types/${id}`);
    return res.data;
}

/**
 * Update vehicle type
 * @param {string} id - Vehicle type UUID
 * @param {Object} payload - Update data
 * @param {string} [payload.name] - Vehicle type name
 * @param {number} [payload.basePrice] - Base price
 * @param {number} [payload.pricePerKm] - Price per kilometer
 * @param {string} [payload.description] - Description
 * @param {boolean} [payload.isActive] - Active status
 * @returns {Promise} Updated vehicle type
 */
export async function updateVehicleType(id, payload) {
    const res = await apiClient.put(`/api/Admin/vehicle-types/${id}`, payload);
    return res.data;
}

/**
 * Delete vehicle type
 * @param {string} id - Vehicle type UUID
 * @returns {Promise} API response
 */
export async function deleteVehicleType(id) {
    const res = await apiClient.delete(`/api/Admin/vehicle-types/${id}`);
    return res.data;
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Activate user
 * @param {string} id - User UUID
 * @returns {Promise} API response
 */
export async function activateUser(id) {
    return toggleUserStatus(id, true);
}

/**
 * Deactivate user
 * @param {string} id - User UUID
 * @returns {Promise} API response
 */
export async function deactivateUser(id) {
    return toggleUserStatus(id, false);
}

/**
 * Get drivers only
 * @param {Object} params - Additional query params
 * @returns {Promise} List of drivers
 */
export async function getDrivers(params = {}) {
    return getUsers({ ...params, Role: "Driver" });
}

/**
 * Get customers only
 * @param {Object} params - Additional query params
 * @returns {Promise} List of customers
 */
export async function getCustomers(params = {}) {
    return getUsers({ ...params, Role: "User" });
}

/**
 * Get online drivers
 * @param {Object} params - Additional query params
 * @returns {Promise} List of online drivers
 */
export async function getOnlineDrivers(params = {}) {
    return getUsers({ ...params, Role: "Driver", IsOnline: true });
}

/**
 * Get active vehicle types only
 * @returns {Promise} List of active vehicle types
 */
export async function getActiveVehicleTypes() {
    const response = await getVehicleTypes();
    if (response.success && response.data) {
        return {
            ...response,
            data: response.data.filter(vt => vt.isActive)
        };
    }
    return response;
}

/**
 * Calculate ride price
 * @param {string} vehicleTypeId - Vehicle type UUID
 * @param {number} distance - Distance in km
 * @returns {Promise<number>} Calculated price
 */
export async function calculateRidePrice(vehicleTypeId, distance) {
    const response = await getVehicleTypeById(vehicleTypeId);
    if (response.success && response.data) {
        const vt = response.data;
        return vt.basePrice + (distance * vt.pricePerKm);
    }
    return 0;
}

// Default export with all functions
export default {
    // User Management
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus,
    activateUser,
    deactivateUser,
    getDrivers,
    getCustomers,
    getOnlineDrivers,

    // Ride Management
    getRides,
    getRideById,

    // Statistics
    getStatistics,

    // Vehicle Types
    getVehicleTypes,
    createVehicleType,
    getVehicleTypeById,
    updateVehicleType,
    deleteVehicleType,
    getActiveVehicleTypes,
    calculateRidePrice,
};