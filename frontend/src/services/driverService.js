import apiClient from "./apiClient";

// ==================== DRIVER STATUS ====================

/**
 * Toggle driver online/offline status
 * @param {boolean} isOnline - true to go online, false to go offline
 * @returns {Promise} API response with updated status
 */
export async function toggleDriverOnline(isOnline) {
    const res = await apiClient.put("/api/Drivers/toggle-online", {
        isOnline
    });
    return res.data;
}

/**
 * Update driver's current location
 * @param {number} latitude - Latitude coordinate (range: -90 to 90)
 * @param {number} longitude - Longitude coordinate (range: -180 to 180)
 * @returns {Promise} API response
 */
export async function updateDriverLocation(latitude, longitude) {
    const res = await apiClient.post("/api/Drivers/update-location", {
        latitude,
        longitude
    });
    return res.data;
}

// ==================== RIDE MANAGEMENT ====================

/**
 * Get pending rides near driver's location
 * @param {number} latitude - Driver's current latitude
 * @param {number} longitude - Driver's current longitude
 * @param {number} [radius=5] - Search radius in km (default: 5)
 * @returns {Promise} List of pending rides
 */
export async function getPendingRides(latitude, longitude, radius = 5) {
    const res = await apiClient.get("/api/Drivers/pending-rides", {
        params: { latitude, longitude, radius }
    });
    return res.data;
}

/**
 * Accept a ride request
 * @param {string} rideId - UUID of the ride to accept
 * @param {string} version - Version string for optimistic concurrency
 * @returns {Promise} Accepted ride details
 */
export async function acceptRide(rideId, version) {
    const res = await apiClient.post("/api/Drivers/accept-ride", {
        rideId,
        version
    });
    return res.data;
}

/**
 * Update ride status
 * @param {string} rideId - UUID of the ride
 * @param {string} status - New status (e.g., "Completed", "InProgress", "Cancelled")
 * @param {number} [finalPrice] - Final price if completing the ride
 * @returns {Promise} API response
 */
export async function updateRideStatus(rideId, status, finalPrice) {
    const payload = { RideId: rideId, Status: status };
    if (finalPrice !== undefined) {
        payload.FinalPrice = finalPrice;
    }
    const res = await apiClient.put("/api/Drivers/update-ride-status", payload);
    return res.data;
}

/**
 * Get driver's current active ride
 * @returns {Promise} Current ride details or null
 */
export async function getCurrentRide() {
    const res = await apiClient.get("/api/Drivers/current-ride");
    return res.data;
}

// ==================== HISTORY & STATISTICS ====================

/**
 * Get driver statistics
 * @returns {Promise} Statistics including total rides, earnings, ratings, etc.
 */
export async function getDriverStatistics() {
    const res = await apiClient.get("/api/Drivers/statistics");
    return res.data;
}

/**
 * Get ride history with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} [params.Page] - Page number
 * @param {number} [params.PageSize] - Items per page
 * @param {string} [params.Status] - Filter by status
 * @param {string} [params.FromDate] - Start date (ISO 8601)
 * @param {string} [params.ToDate] - End date (ISO 8601)
 * @returns {Promise} Paginated ride history
 */
export async function getRideHistory(params = {}) {
    const res = await apiClient.get("/api/Drivers/ride-history", {
        params
    });
    return res.data;
}

// ==================== VEHICLE MANAGEMENT ====================

/**
 * Get all available vehicle types
 * @returns {Promise} List of vehicle types with pricing
 */
export async function getVehicleTypes() {
    const res = await apiClient.get("/api/Admin/vehicle-types");
    return res.data;
}

/**
 * Get driver's vehicle information
 * @returns {Promise} Vehicle details
 */
export async function getDriverVehicle() {
    const res = await apiClient.get("/api/Drivers/vehicle");
    return res.data;
}

/**
 * Update driver's vehicle information
 * @param {Object} payload - Vehicle data
 * @param {string} payload.vehicleTypeId - UUID of vehicle type
 * @param {string} payload.licensePlate - License plate (e.g., "00LG-67552")
 * @param {string} payload.vehicleBrand - Vehicle brand
 * @param {string} payload.vehicleModel - Vehicle model
 * @param {string} payload.vehicleColor - Vehicle color
 * @returns {Promise} Updated vehicle details
 */
export async function updateDriverVehicle(payload) {
    const res = await apiClient.put("/api/Drivers/vehicle", payload);
    return res.data;
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Start a ride (update status to InProgress)
 * @param {string} rideId - UUID of the ride
 * @returns {Promise} API response
 */
export async function startRide(rideId) {
    return updateRideStatus(rideId, "InProgress");
}

/**
 * Complete a ride
 * @param {string} rideId - UUID of the ride
 * @param {number} finalPrice - Final price for the ride
 * @returns {Promise} API response
 */
export async function completeRide(rideId, finalPrice) {
    return updateRideStatus(rideId, "Completed", finalPrice);
}

/**
 * Cancel a ride
 * @param {string} rideId - UUID of the ride
 * @returns {Promise} API response
 */
export async function cancelRide(rideId) {
    return updateRideStatus(rideId, "Cancelled");
}

// Default export with all functions
export default {
    // Status
    toggleDriverOnline,
    updateDriverLocation,

    // Rides
    getPendingRides,
    acceptRide,
    updateRideStatus,
    getCurrentRide,
    startRide,
    completeRide,
    cancelRide,

    // History & Stats
    getDriverStatistics,
    getRideHistory,

    // Vehicle
    getVehicleTypes,
    getDriverVehicle,
    updateDriverVehicle
};