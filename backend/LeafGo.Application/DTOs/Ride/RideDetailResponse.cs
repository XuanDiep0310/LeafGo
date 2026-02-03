namespace LeafGo.Application.DTOs.Ride
{
    public class RideDetailResponse
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;

        // Location info
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal DestinationLatitude { get; set; }
        public decimal DestinationLongitude { get; set; }

        // Trip info
        public decimal Distance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal EstimatedPrice { get; set; }
        public decimal? FinalPrice { get; set; }
        public string? Notes { get; set; }

        // Vehicle type
        public VehicleTypeInfoDto VehicleType { get; set; } = null!;

        // Driver info (null if no driver assigned yet)
        public RideDriverInfo? Driver { get; set; }

        // Timestamps
        public DateTime RequestedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? DriverArrivingAt { get; set; }
        public DateTime? DriverArrivedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        // Cancellation
        public string? CancellationReason { get; set; }
        public string? CancelledBy { get; set; }

        // Rating (if completed)
        public RideRatingInfo? Rating { get; set; }
    }

    public class RideDriverInfo
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public double AverageRating { get; set; }
        public int TotalRides { get; set; }
        public RideVehicleInfo? Vehicle { get; set; }
    }

    public class RideVehicleInfo
    {
        public string LicensePlate { get; set; } = string.Empty;
        public string? VehicleBrand { get; set; }
        public string? VehicleModel { get; set; }
        public string? VehicleColor { get; set; }
    }

    public class RideRatingInfo
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
