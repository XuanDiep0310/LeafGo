using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Ride
{
    public class CancelRideRequest
    {
        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }
}
