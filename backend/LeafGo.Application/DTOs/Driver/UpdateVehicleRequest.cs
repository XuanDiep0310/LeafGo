using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Driver
{
    public class UpdateVehicleRequest
    {
        [Required]
        public Guid VehicleTypeId { get; set; }

        [Required]
        [RegularExpression(@"^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$",
            ErrorMessage = "Invalid license plate format. Example: 59A-12345")]
        public string LicensePlate { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? VehicleBrand { get; set; }

        [MaxLength(100)]
        public string? VehicleModel { get; set; }

        [MaxLength(50)]
        public string? VehicleColor { get; set; }
    }
}
