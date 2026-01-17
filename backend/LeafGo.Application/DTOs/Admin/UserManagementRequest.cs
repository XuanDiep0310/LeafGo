namespace LeafGo.Application.DTOs.Admin
{
    public class UserManagementRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Role { get; set; }
        public string? Search { get; set; } // Search by name, email, phone
        public bool? IsActive { get; set; }
        public bool? IsOnline { get; set; }
    }
}
