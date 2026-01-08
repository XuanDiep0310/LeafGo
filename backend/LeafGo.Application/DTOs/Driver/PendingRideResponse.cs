namespace LeafGo.Application.DTOs.Driver
{
    public class PendingRideResponse
    {
        public Guid Id { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal DestinationLatitude { get; set; }
        public decimal DestinationLongitude { get; set; }
        public decimal Distance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal EstimatedPrice { get; set; }
        public DateTime RequestedAt { get; set; }
        public string Version { get; set; } = string.Empty; // For optimistic locking
        public UserBasicInfo User { get; set; } = null!;
        public decimal DistanceFromDriver { get; set; } // Distance from driver's current location
    }

    public class UserBasicInfo
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
