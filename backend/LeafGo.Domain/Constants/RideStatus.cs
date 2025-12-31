using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Domain.Constants
{
    public static class RideStatus
    {
        public const string Pending = "Pending";
        public const string Accepted = "Accepted";
        public const string DriverArriving = "DriverArriving";
        public const string DriverArrived = "DriverArrived";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
    }
}
