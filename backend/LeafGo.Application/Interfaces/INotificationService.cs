using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.Interfaces
{
    public interface INotificationService
    {
        // Ride notifications
        Task NotifyNewRideRequestAsync(Guid rideId, List<Guid> nearbyDriverIds);
        Task NotifyRideAcceptedAsync(Guid rideId, Guid userId, object driverInfo);
        Task NotifyRideStatusChangedAsync(Guid rideId, string status);
        Task NotifyRideCancelledAsync(Guid rideId, string cancelledBy);
        Task NotifyRideCompletedAsync(Guid rideId);

        // Driver location updates
        Task BroadcastDriverLocationAsync(Guid rideId, Guid driverId, decimal latitude, decimal longitude);
    }
}
