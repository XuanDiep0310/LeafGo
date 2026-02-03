using LeafGo.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace LeafGo.Infrastructure.Hubs
{
    [Authorize]
    public class RideHub : Hub
    {
        private readonly ILogger<RideHub> _logger;

        public RideHub(ILogger<RideHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            _logger.LogInformation("User {UserId} ({Role}) connected to RideHub", userId, userRole);

            // Join user-specific group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // Join role-specific group
            if (userRole == UserRoles.Driver)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "drivers");
            }
            else if (userRole == UserRoles.User)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "users");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} disconnected from RideHub", userId);

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a specific ride group to receive real-time updates
        /// </summary>
        public async Task JoinRideGroup(string rideId)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} joined ride group: {RideId}", userId, rideId);

            await Groups.AddToGroupAsync(Context.ConnectionId, $"ride_{rideId}");
        }

        /// <summary>
        /// Leave a ride group
        /// </summary>
        public async Task LeaveRideGroup(string rideId)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} left ride group: {RideId}", userId, rideId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"ride_{rideId}");
        }

        /// <summary>
        /// Driver sends location update during active ride
        /// </summary>
        [Authorize(Roles = UserRoles.Driver)]
        public async Task UpdateDriverLocation(string rideId, double latitude, double longitude)
        {
            var driverId = GetUserId();

            // Broadcast to ride group (user is listening)
            await Clients.Group($"ride_{rideId}").SendAsync("DriverLocationUpdated", new
            {
                DriverId = driverId,
                Latitude = latitude,
                Longitude = longitude,
                Timestamp = DateTime.UtcNow
            });
        }

        #region Helper Methods

        private string GetUserId()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }
            return userId;
        }

        private string GetUserRole()
        {
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            return role ?? "Unknown";
        }

        #endregion
    }
}
