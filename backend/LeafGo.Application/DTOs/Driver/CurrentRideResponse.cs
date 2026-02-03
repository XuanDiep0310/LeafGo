namespace LeafGo.Application.DTOs.Driver
{
    public class CurrentRideResponse
    {
        public Guid Id { get; set; }
        public UserBasicInfo User { get; set; } = null!;
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal DestinationLatitude { get; set; }
        public decimal DestinationLongitude { get; set; }
        public decimal Distance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal EstimatedPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AcceptedAt { get; set; }
        public string? Notes { get; set; }
    }
}
