namespace LeafGo.Domain.Entities
{
    public class Ride
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? DriverId { get; set; }
        public Guid VehicleTypeId { get; set; }

        // Snapshot info
        public string UserName { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string? DriverName { get; set; }
        public string? DriverPhone { get; set; }

        // Location info
        public string PickupAddress { get; set; } = string.Empty;
        public decimal PickupLatitude { get; set; }
        public decimal PickupLongitude { get; set; }
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal DestinationLatitude { get; set; }
        public decimal DestinationLongitude { get; set; }

        // Price & distance
        public decimal Distance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal EstimatedPrice { get; set; }
        public decimal? FinalPrice { get; set; }

        // Status
        public string Status { get; set; } = "Pending";

        // Timestamps
        public DateTime RequestedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? DriverArrivingAt { get; set; }
        public DateTime? DriverArrivedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        public string? CancellationReason { get; set; }
        public string? CancelledBy { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual User? Driver { get; set; }
        public virtual VehicleType VehicleType { get; set; } = null!;
        public virtual Ratings? Rating { get; set; }
    }
}
