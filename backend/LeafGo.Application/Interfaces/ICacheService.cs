namespace LeafGo.Application.Interfaces
{
    public interface ICacheService
    {
        // Driver location caching
        Task UpdateDriverLocationAsync(Guid driverId, decimal latitude, decimal longitude);
        Task<(decimal latitude, decimal longitude)?> GetDriverLocationAsync(Guid driverId);
        Task<List<Guid>> GetNearbyDriversAsync(decimal latitude, decimal longitude, double radiusKm = 5);
        Task RemoveDriverLocationAsync(Guid driverId);

        // Driver online status
        Task SetDriverOnlineAsync(Guid driverId);
        Task SetDriverOfflineAsync(Guid driverId);
        Task<bool> IsDriverOnlineAsync(Guid driverId);

        // Pending rides cache
        Task AddPendingRideAsync(Guid rideId, object rideData);
        Task RemovePendingRideAsync(Guid rideId);
        Task<List<Guid>> GetPendingRidesAsync();

        // Active ride cache
        Task SetActiveRideAsync(Guid userId, Guid rideId);
        Task<Guid?> GetActiveRideAsync(Guid userId);
        Task RemoveActiveRideAsync(Guid userId);

        // Ride lock (race condition handling)
        Task<bool> AcquireRideLockAsync(Guid rideId, Guid driverId);
        Task<bool> ReleaseRideLockAsync(Guid rideId, Guid driverId);
    }
}
