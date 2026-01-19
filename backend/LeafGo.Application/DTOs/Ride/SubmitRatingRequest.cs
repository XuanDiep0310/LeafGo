using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Ride
{
    public class SubmitRatingRequest
    {
        [Required]
        public Guid RideId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}
