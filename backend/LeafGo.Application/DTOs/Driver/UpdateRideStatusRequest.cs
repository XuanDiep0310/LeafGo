using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Driver
{
    public class UpdateRideStatusRequest
    {
        [Required]
        public Guid RideId { get; set; }

        [Required]
        [RegularExpression("^(DriverArriving|DriverArrived|InProgress|Completed)$")]
        public string Status { get; set; } = string.Empty;

        public decimal? FinalPrice { get; set; } // Required when Status = Completed
    }
}
