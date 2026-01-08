using LeafGo.Application.DTOs.Driver;
using LeafGo.Application.DTOs.User;

namespace LeafGo.Application.Interfaces
{
    public interface IDriverService
    {
        Task<ToggleOnlineResponse> ToggleOnlineAsync(Guid driverId, bool isOnline);
        Task UpdateLocationAsync(Guid driverId, UpdateLocationRequest request);
        Task<List<PendingRideResponse>> GetPendingRidesAsync(Guid driverId, decimal latitude, decimal longitude, int radiusKm = 5);
        Task<AcceptRideResponse> AcceptRideAsync(Guid driverId, AcceptRideRequest request);
        Task UpdateRideStatusAsync(Guid driverId, UpdateRideStatusRequest request);
        Task<CurrentRideResponse?> GetCurrentRideAsync(Guid driverId);
        Task<DriverStatisticsResponse> GetStatisticsAsync(Guid driverId);
        Task<PagedResponse<DriverRideHistoryResponse>> GetRideHistoryAsync(Guid driverId, DriverRideHistoryRequest request);
        Task<VehicleInfoResponse?> GetVehicleAsync(Guid driverId);
        Task<VehicleInfoResponse> UpdateVehicleAsync(Guid driverId, UpdateVehicleRequest request);
    }
}
