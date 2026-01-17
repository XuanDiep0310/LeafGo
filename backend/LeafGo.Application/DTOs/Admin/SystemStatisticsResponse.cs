namespace LeafGo.Application.DTOs.Admin
{
    public class SystemStatisticsResponse
    {
        public int TotalUsers { get; set; }
        public int TotalDrivers { get; set; }
        public int OnlineDrivers { get; set; }
        public int TotalCompletedRides { get; set; }
        public int TotalPendingRides { get; set; }
        public int TodayRides { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal ThisMonthRevenue { get; set; }
        public List<TopDriverResponse> TopDrivers { get; set; } = new();
        public List<RevenueByMonthResponse> RevenueByMonth { get; set; } = new();
        public List<RidesByStatusResponse> RidesByStatus { get; set; } = new();
    }

    public class TopDriverResponse
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public int TotalRides { get; set; }
        public decimal TotalEarnings { get; set; }
        public double AverageRating { get; set; }
    }

    public class RevenueByMonthResponse
    {
        public string Month { get; set; } = string.Empty; // YYYY-MM
        public decimal Revenue { get; set; }
        public int TotalRides { get; set; }
    }

    public class RidesByStatusResponse
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
