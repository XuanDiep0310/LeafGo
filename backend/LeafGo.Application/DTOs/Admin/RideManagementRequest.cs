namespace LeafGo.Application.DTOs.Admin
{
    public class RideManagementRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public Guid? UserId { get; set; }
        public Guid? DriverId { get; set; }
    }
}
