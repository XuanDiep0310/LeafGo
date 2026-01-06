namespace LeafGo.Application.DTOs.User
{
    public class RideHistoryResponse
    {
        public Guid Id { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public decimal FinalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DriverInfoDto? Driver { get; set; }
        public RatingDto? Rating { get; set; }
    }

    public class DriverInfoDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public VehicleInfoDto? Vehicle { get; set; }
    }

    public class VehicleInfoDto
    {
        public string LicensePlate { get; set; } = string.Empty;
        public string? VehicleBrand { get; set; }
        public string? VehicleModel { get; set; }
        public string? VehicleColor { get; set; }
        public string VehicleTypeName { get; set; } = string.Empty;
    }

    public class RatingDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
