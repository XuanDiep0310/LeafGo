using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Ride
{
    public class CalculatePriceRequest
    {
        [Required]
        [Range(-90, 90)]
        public decimal PickupLatitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal PickupLongitude { get; set; }

        [Required]
        [Range(-90, 90)]
        public decimal DestinationLatitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal DestinationLongitude { get; set; }

        [Required]
        public Guid VehicleTypeId { get; set; }
    }
}
