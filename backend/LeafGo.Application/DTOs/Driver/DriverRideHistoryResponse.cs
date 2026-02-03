namespace LeafGo.Application.DTOs.Driver
{
    public class DriverRideHistoryResponse
    {
        public Guid Id { get; set; }
        public UserBasicInfo User { get; set; } = null!;
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public decimal FinalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DriverRatingInfo? Rating { get; set; }
    }

    public class DriverRatingInfo
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
