namespace LeafGo.Application.DTOs.Ride
{
    public class RatingResponse
    {
        public Guid Id { get; set; }
        public Guid RideId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
