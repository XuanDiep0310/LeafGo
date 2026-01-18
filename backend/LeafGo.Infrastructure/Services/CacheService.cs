using LeafGo.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace LeafGo.Infrastructure.Services
{
    public class CacheService : ICacheService
    {
        private readonly IRedisService _redis;
        private readonly ILogger<CacheService> _logger;

        // Redis key prefixes
        private const string DRIVER_LOCATIONS_KEY = "driver:locations";
        private const string DRIVER_ONLINE_PREFIX = "driver:online:";
        private const string PENDING_RIDES_KEY = "rides:pending";
        private const string ACTIVE_RIDE_PREFIX = "ride:active:";
        private const string RIDE_LOCK_PREFIX = "ride:lock:";

        public CacheService(IRedisService redis, ILogger<CacheService> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        #region Driver Location

        public async Task UpdateDriverLocationAsync(Guid driverId, decimal latitude, decimal longitude)
        {
            try
            {
                // Store in Redis Geo
                await _redis.GeoAddAsync(
                    DRIVER_LOCATIONS_KEY,
                    (double)longitude,
                    (double)latitude,
                    driverId.ToString()
                );

                // Update online status with 5 min TTL
                await _redis.SetAsync(
                    $"{DRIVER_ONLINE_PREFIX}{driverId}",
                    true,
                    TimeSpan.FromMinutes(5)
                );

                _logger.LogDebug("Updated location for driver {DriverId}", driverId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating driver location");
            }
        }

        public async Task<(decimal latitude, decimal longitude)?> GetDriverLocationAsync(Guid driverId)
        {
            // Note: Redis doesn't have a direct "get position" command
            // In production, store separately or use GeoPos command
            return null; // Placeholder
        }

        public async Task<List<Guid>> GetNearbyDriversAsync(
            decimal latitude,
            decimal longitude,
            double radiusKm = 5)
        {
            try
            {
                var members = await _redis.GeoRadiusAsync(
                    DRIVER_LOCATIONS_KEY,
                    (double)longitude,
                    (double)latitude,
                    radiusKm
                );

                return members
                    .Select(m => Guid.TryParse(m, out var guid) ? guid : Guid.Empty)
                    .Where(g => g != Guid.Empty)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting nearby drivers");
                return new List<Guid>();
            }
        }

        public async Task RemoveDriverLocationAsync(Guid driverId)
        {
            try
            {
                await _redis.GeoRemoveAsync(DRIVER_LOCATIONS_KEY, driverId.ToString());
                await _redis.DeleteAsync($"{DRIVER_ONLINE_PREFIX}{driverId}");

                _logger.LogDebug("Removed location for driver {DriverId}", driverId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing driver location");
            }
        }

        #endregion

        #region Driver Online Status

        public async Task SetDriverOnlineAsync(Guid driverId)
        {
            await _redis.SetAsync(
                $"{DRIVER_ONLINE_PREFIX}{driverId}",
                true,
                TimeSpan.FromMinutes(5)
            );
        }

        public async Task SetDriverOfflineAsync(Guid driverId)
        {
            await _redis.DeleteAsync($"{DRIVER_ONLINE_PREFIX}{driverId}");
            await RemoveDriverLocationAsync(driverId);
        }

        public async Task<bool> IsDriverOnlineAsync(Guid driverId)
        {
            return await _redis.ExistsAsync($"{DRIVER_ONLINE_PREFIX}{driverId}");
        }

        #endregion

        #region Pending Rides

        public async Task AddPendingRideAsync(Guid rideId, object rideData)
        {
            await _redis.AddToSetAsync(PENDING_RIDES_KEY, rideId.ToString());
            await _redis.SetAsync(
                $"ride:{rideId}",
                rideData,
                TimeSpan.FromMinutes(10) // TTL 10 minutes
            );
        }

        public async Task RemovePendingRideAsync(Guid rideId)
        {
            await _redis.RemoveFromSetAsync(PENDING_RIDES_KEY, rideId.ToString());
            await _redis.DeleteAsync($"ride:{rideId}");
        }

        public async Task<List<Guid>> GetPendingRidesAsync()
        {
            var members = await _redis.GetSetMembersAsync(PENDING_RIDES_KEY);
            return members
                .Select(m => Guid.TryParse(m, out var guid) ? guid : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();
        }

        #endregion

        #region Active Ride

        public async Task SetActiveRideAsync(Guid userId, Guid rideId)
        {
            await _redis.SetAsync(
                $"{ACTIVE_RIDE_PREFIX}{userId}",
                rideId,
                TimeSpan.FromHours(1)
            );
        }

        public async Task<Guid?> GetActiveRideAsync(Guid userId)
        {
            return await _redis.GetAsync<Guid?>($"{ACTIVE_RIDE_PREFIX}{userId}");
        }

        public async Task RemoveActiveRideAsync(Guid userId)
        {
            await _redis.DeleteAsync($"{ACTIVE_RIDE_PREFIX}{userId}");
        }

        #endregion

        #region Ride Lock

        public async Task<bool> AcquireRideLockAsync(Guid rideId, Guid driverId)
        {
            var lockKey = $"{RIDE_LOCK_PREFIX}{rideId}";
            return await _redis.AcquireLockAsync(
                lockKey,
                driverId.ToString(),
                TimeSpan.FromSeconds(10) // Lock for 10 seconds
            );
        }

        public async Task<bool> ReleaseRideLockAsync(Guid rideId, Guid driverId)
        {
            var lockKey = $"{RIDE_LOCK_PREFIX}{rideId}";
            return await _redis.ReleaseLockAsync(lockKey, driverId.ToString());
        }

        #endregion
    }
}
