using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Ride
{
    public class CreateRideRequest
    {
        [Required]
        public Guid VehicleTypeId { get; set; }

        [Required]
        [MaxLength(500)]
        public string PickupAddress { get; set; } = string.Empty;

        [Required]
        [Range(-90, 90)]
        public decimal PickupLatitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal PickupLongitude { get; set; }

        [Required]
        [MaxLength(500)]
        public string DestinationAddress { get; set; } = string.Empty;

        [Required]
        [Range(-90, 90)]
        public decimal DestinationLatitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal DestinationLongitude { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Distance { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int EstimatedDuration { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal EstimatedPrice { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
