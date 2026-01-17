using LeafGo.Application.DTOs.Admin;
using LeafGo.Application.DTOs.User;

namespace LeafGo.Application.Interfaces
{
    public interface IAdminService
    {
        // User Management
        Task<PagedResponse<UserManagementResponse>> GetUsersAsync(UserManagementRequest request);
        Task<UserManagementResponse> GetUserByIdAsync(Guid userId);
        Task<UserManagementResponse> CreateUserAsync(CreateUserRequest request);
        Task<UserManagementResponse> UpdateUserAsync(Guid userId, UpdateUserRequest request);
        Task ToggleUserStatusAsync(Guid userId, bool isActive);
        Task DeleteUserAsync(Guid userId);

        // Ride Management
        Task<PagedResponse<RideManagementResponse>> GetRidesAsync(RideManagementRequest request);
        Task<RideManagementResponse> GetRideByIdAsync(Guid rideId);

        // Statistics
        Task<SystemStatisticsResponse> GetSystemStatisticsAsync();

        // Vehicle Type Management
        Task<List<VehicleTypeResponse>> GetVehicleTypesAsync();
        Task<VehicleTypeResponse> GetVehicleTypeByIdAsync(Guid vehicleTypeId);
        Task<VehicleTypeResponse> CreateVehicleTypeAsync(CreateVehicleTypeRequest request);
        Task<VehicleTypeResponse> UpdateVehicleTypeAsync(Guid vehicleTypeId, UpdateVehicleTypeRequest request);
        Task DeleteVehicleTypeAsync(Guid vehicleTypeId);
    }
}
