namespace LeafGo.Application.DTOs.Driver
{
    public class DriverStatisticsResponse
    {
        public int TotalRides { get; set; }
        public decimal TotalEarnings { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int TodayRides { get; set; }
        public decimal TodayEarnings { get; set; }
        public int ThisWeekRides { get; set; }
        public decimal ThisWeekEarnings { get; set; }
        public int ThisMonthRides { get; set; }
        public decimal ThisMonthEarnings { get; set; }
    }
}
