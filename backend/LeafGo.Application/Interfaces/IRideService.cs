using LeafGo.Application.DTOs.Ride;

namespace LeafGo.Application.Interfaces
{
    public interface IRideService
    {
        // Price calculation
        Task<CalculatePriceResponse> CalculatePriceAsync(CalculatePriceRequest request);

        // Ride management
        Task<CreateRideResponse> CreateRideAsync(Guid userId, CreateRideRequest request);
        Task<RideDetailResponse> GetRideByIdAsync(Guid rideId, Guid userId);
        Task<ActiveRideResponse?> GetActiveRideAsync(Guid userId);
        Task CancelRideAsync(Guid userId, Guid rideId, CancelRideRequest request);

        // Vehicle types
        Task<List<VehicleTypeListResponse>> GetAvailableVehicleTypesAsync();

        // Ratings
        Task<RatingResponse> SubmitRatingAsync(Guid userId, SubmitRatingRequest request);
        Task<DriverRatingsResponse> GetDriverRatingsAsync(Guid driverId, int page = 1, int pageSize = 10);
    }
}
