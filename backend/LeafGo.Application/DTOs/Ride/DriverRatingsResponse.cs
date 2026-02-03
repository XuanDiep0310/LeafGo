namespace LeafGo.Application.DTOs.Ride
{
    public class DriverRatingsResponse
    {
        public Guid DriverId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<DriverRatingItem> Ratings { get; set; } = new();
    }

    public class DriverRatingItem
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
