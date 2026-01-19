namespace LeafGo.Application.DTOs.Ride
{
    public class VehicleTypeListResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
        public string? Description { get; set; }
        public int AvailableDrivers { get; set; }
    }
}
