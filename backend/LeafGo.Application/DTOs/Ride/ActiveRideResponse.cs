namespace LeafGo.Application.DTOs.Ride
{
    public class ActiveRideResponse
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal DestinationLatitude { get; set; }
        public decimal DestinationLongitude { get; set; }
        public decimal Distance { get; set; }
        public decimal EstimatedPrice { get; set; }
        public DateTime RequestedAt { get; set; }
        public RideDriverInfo? Driver { get; set; }
    }
}
