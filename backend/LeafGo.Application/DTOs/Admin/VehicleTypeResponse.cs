namespace LeafGo.Application.DTOs.Admin
{
    public class VehicleTypeResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int TotalDrivers { get; set; }
        public int TotalRides { get; set; }
    }
}
