namespace LeafGo.Application.DTOs.Admin
{
    public class RideManagementResponse
    {
        public Guid Id { get; set; }
        public UserInfo User { get; set; } = null!;
        public DriverInfo? Driver { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public decimal EstimatedPrice { get; set; }
        public decimal? FinalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public string? CancelledBy { get; set; }
        public RatingInfo? Rating { get; set; }
    }

    public class UserInfo
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class DriverInfo
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? LicensePlate { get; set; }
    }

    public class RatingInfo
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
