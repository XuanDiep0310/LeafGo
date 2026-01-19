namespace LeafGo.Application.DTOs.Ride
{
    public class CalculatePriceResponse
    {
        public decimal Distance { get; set; } // km
        public int EstimatedDuration { get; set; } // minutes
        public decimal EstimatedPrice { get; set; }
        public VehicleTypeInfoDto VehicleType { get; set; } = null!;
    }

    public class VehicleTypeInfoDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
        public string? Description { get; set; }
    }
}
