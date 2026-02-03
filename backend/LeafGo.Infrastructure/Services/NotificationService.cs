using LeafGo.Application.Interfaces;
using LeafGo.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace LeafGo.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<RideHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IHubContext<RideHub> hubContext,
            ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyNewRideRequestAsync(Guid rideId, List<Guid> nearbyDriverIds)
        {
            _logger.LogInformation("Notifying {Count} drivers about new ride {RideId}",
                nearbyDriverIds.Count, rideId);

            // Send to specific drivers
            foreach (var driverId in nearbyDriverIds)
            {
                await _hubContext.Clients
                    .Group($"user_{driverId}")
                    .SendAsync("NewRideRequest", new
                    {
                        RideId = rideId,
                        Timestamp = DateTime.UtcNow
                    });
            }

            // Also broadcast to all online drivers
            await _hubContext.Clients
                .Group("drivers")
                .SendAsync("RideRequestCreated", new
                {
                    RideId = rideId,
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task NotifyRideAcceptedAsync(Guid rideId, Guid userId, object driverInfo)
        {
            _logger.LogInformation("Notifying user {UserId} that ride {RideId} was accepted",
                userId, rideId);

            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("RideAccepted", new
                {
                    RideId = rideId,
                    Driver = driverInfo,
                    Timestamp = DateTime.UtcNow
                });

            await _hubContext.Clients
                .Group($"ride_{rideId}")
                .SendAsync("RideStatusChanged", new
                {
                    RideId = rideId,
                    Status = "Accepted",
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task NotifyRideStatusChangedAsync(Guid rideId, string status)
        {
            _logger.LogInformation("Ride {RideId} status changed to {Status}", rideId, status);

            await _hubContext.Clients
                .Group($"ride_{rideId}")
                .SendAsync("RideStatusChanged", new
                {
                    RideId = rideId,
                    Status = status,
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task NotifyRideCancelledAsync(Guid rideId, string cancelledBy)
        {
            _logger.LogInformation("Ride {RideId} cancelled by {CancelledBy}", rideId, cancelledBy);

            await _hubContext.Clients
                .Group($"ride_{rideId}")
                .SendAsync("RideCancelled", new
                {
                    RideId = rideId,
                    CancelledBy = cancelledBy,
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task NotifyRideCompletedAsync(Guid rideId)
        {
            _logger.LogInformation("Ride {RideId} completed", rideId);

            await _hubContext.Clients
                .Group($"ride_{rideId}")
                .SendAsync("RideCompleted", new
                {
                    RideId = rideId,
                    Timestamp = DateTime.UtcNow
                });
        }

        public async Task BroadcastDriverLocationAsync(
            Guid rideId,
            Guid driverId,
            decimal latitude,
            decimal longitude)
        {
            await _hubContext.Clients
                .Group($"ride_{rideId}")
                .SendAsync("DriverLocationUpdated", new
                {
                    DriverId = driverId,
                    Latitude = latitude,
                    Longitude = longitude,
                    Timestamp = DateTime.UtcNow
                });
        }
    }
}
