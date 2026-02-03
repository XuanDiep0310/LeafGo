namespace LeafGo.Domain.Entities
{
    public class Ratings
    {
        public Guid Id { get; set; }
        public Guid RideId { get; set; }
        public Guid UserId { get; set; }
        public Guid DriverId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Ride Ride { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual User Driver { get; set; } = null!;
    }
}
