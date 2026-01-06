using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Domain.Constants
{
    public static class NotificationType
    {
        public const string RideRequest = "RideRequest";
        public const string RideAccepted = "RideAccepted";
        public const string RideStarted = "RideStarted";
        public const string RideCompleted = "RideCompleted";
        public const string RideCancelled = "RideCancelled";
        public const string DriverArriving = "DriverArriving";
        public const string DriverArrived = "DriverArrived";
    }
}
