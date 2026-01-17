using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Admin
{
    public class UpdateVehicleTypeRequest
    {
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal BasePrice { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal PricePerKm { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}
