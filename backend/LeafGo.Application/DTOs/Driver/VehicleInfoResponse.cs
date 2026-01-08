namespace LeafGo.Application.DTOs.Driver
{
    public class VehicleInfoResponse
    {
        public Guid Id { get; set; }
        public VehicleTypeInfo VehicleType { get; set; } = null!;
        public string LicensePlate { get; set; } = string.Empty;
        public string? VehicleBrand { get; set; }
        public string? VehicleModel { get; set; }
        public string? VehicleColor { get; set; }
        public bool IsActive { get; set; }
    }

    public class VehicleTypeInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
    }
}
