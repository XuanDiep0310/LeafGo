using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Admin
{
    public class CreateVehicleTypeRequest
    {
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Base price must be greater than 0")]
        public decimal BasePrice { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Price per km must be greater than 0")]
        public decimal PricePerKm { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}
