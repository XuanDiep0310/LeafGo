// services/bookingService.js
import apiClient from './apiClient';

/**
 * Get available vehicle types
 * GET /api/Rides/vehicle-types
 */
export const getVehicleTypes = async () => {
    try {
        const response = await apiClient.get('/api/Rides/vehicle-types');
        return response.data?.data || [];
    } catch (error) {
        console.error('Error fetching vehicle types:', error);
        throw error;
    }
};

/**
 * Calculate trip price
 * POST /api/Rides/calculate-price
 */
export const calculateTripPrice = async (pickupLat, pickupLng, destLat, destLng, vehicleTypeId) => {
    try {
        const response = await apiClient.post('/api/Rides/calculate-price', {
            pickupLatitude: pickupLat,
            pickupLongitude: pickupLng,
            destinationLatitude: destLat,
            destinationLongitude: destLng,
            vehicleTypeId: vehicleTypeId
        });
        return response.data?.data;
    } catch (error) {
        console.error('Error calculating price:', error);
        const errorMessage = error.response?.data?.error || 'Không thể tính toán giá';
        throw new Error(errorMessage);
    }
};

/**
 * Create a new ride booking
 * POST /api/Rides
 */
export const createRide = async (rideData) => {
    try {
        const response = await apiClient.post('/api/Rides', {
            vehicleTypeId: rideData.vehicleTypeId,
            pickupAddress: rideData.pickupAddress,
            pickupLatitude: rideData.pickupLatitude,
            pickupLongitude: rideData.pickupLongitude,
            destinationAddress: rideData.destinationAddress,
            destinationLatitude: rideData.destinationLatitude,
            destinationLongitude: rideData.destinationLongitude,
            distance: rideData.distance,
            estimatedDuration: rideData.estimatedDuration,
            estimatedPrice: rideData.estimatedPrice,
            notes: rideData.notes || ''
        });
        return response.data?.data;
    } catch (error) {
        console.error('Error creating ride:', error);
        const errorMessage = error.response?.data?.error || 'Không thể tạo chuyến đi';
        throw new Error(errorMessage);
    }
};

/**
 * Get ride details by ID
 * GET /api/Rides/{id}
 */
export const getRideById = async (rideId) => {
    try {
        const response = await apiClient.get(`/api/Rides/${rideId}`);
        return response.data?.data;
    } catch (error) {
        console.error('Error fetching ride details:', error);
        const errorMessage = error.response?.data?.error || 'Không thể lấy thông tin chuyến đi';
        throw new Error(errorMessage);
    }
};

/**
 * Get active ride
 * GET /api/Rides/active
 */
export const getActiveRide = async () => {
    try {
        const response = await apiClient.get('/api/Rides/active');
        return response.data?.data;
    } catch (error) {
        // 404 means no active ride, not an error
        if (error.response?.status === 404) {
            return null;
        }
        console.error('Error fetching active ride:', error);
        return null;
    }
};

/**
 * Cancel a ride
 * PUT /api/Rides/{id}/cancel
 */
export const cancelRide = async (rideId, reason) => {
    try {
        const response = await apiClient.put(`/api/Rides/${rideId}/cancel`, {
            reason: reason || 'Người dùng hủy chuyến'
        });
        return response.data?.data;
    } catch (error) {
        console.error('Error cancelling ride:', error);
        const errorMessage = error.response?.data?.error || 'Không thể hủy chuyến đi';
        throw new Error(errorMessage);
    }
};

/**
 * Submit rating for a ride
 * POST /api/Ratings
 */
export const submitRating = async (rideId, rating, comment) => {
    try {
        const response = await apiClient.post('/api/Ratings', {
            rideId: rideId,
            rating: rating,
            comment: comment || ''
        });
        return response.data?.data;
    } catch (error) {
        console.error('Error submitting rating:', error);
        const errorMessage = error.response?.data?.error || 'Không thể gửi đánh giá';
        throw new Error(errorMessage);
    }
};

/**
 * Get driver ratings
 * GET /api/Ratings/driver/{driverId}
 */
export const getDriverRatings = async (driverId, page = 1, pageSize = 10) => {
    try {
        const response = await apiClient.get(`/api/Ratings/driver/${driverId}`, {
            params: { page, pageSize }
        });
        return response.data?.data;
    } catch (error) {
        console.error('Error fetching driver ratings:', error);
        const errorMessage = error.response?.data?.error || 'Không thể lấy đánh giá tài xế';
        throw new Error(errorMessage);
    }
};

/**
 * Poll ride status - helper function for real-time updates
 * Calls getRideById at intervals
 */
export const pollRideStatus = (rideId, onUpdate, interval = 3000) => {
    const pollInterval = setInterval(async () => {
        try {
            const ride = await getRideById(rideId);
            if (ride) {
                onUpdate(ride);

                // Stop polling if ride is completed or cancelled
                if (ride.status === 'Completed' || ride.status === 'Cancelled') {
                    clearInterval(pollInterval);
                }
            }
        } catch (error) {
            console.error('Error polling ride status:', error);
        }
    }, interval);

    // Return function to stop polling
    return () => clearInterval(pollInterval);
};

export default {
    getVehicleTypes,
    calculateTripPrice,
    createRide,
    getRideById,
    getActiveRide,
    cancelRide,
    submitRating,
    getDriverRatings,
    pollRideStatus
};