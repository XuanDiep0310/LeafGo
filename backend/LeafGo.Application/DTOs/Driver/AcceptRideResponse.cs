namespace LeafGo.Application.DTOs.Driver
{
    public class AcceptRideResponse
    {
        public Guid RideId { get; set; }
        public string Status { get; set; } = string.Empty;
        public UserBasicInfo User { get; set; } = null!;
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal EstimatedPrice { get; set; }
    }
}
