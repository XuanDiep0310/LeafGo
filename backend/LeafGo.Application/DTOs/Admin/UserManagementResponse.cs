namespace LeafGo.Application.DTOs.Admin
{
    public class UserManagementResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public bool IsActive { get; set; }
        public bool IsOnline { get; set; }
        public DateTime CreatedAt { get; set; }
        public VehicleInfo? Vehicle { get; set; }
        public UserStats? Stats { get; set; }
    }

    public class VehicleInfo
    {
        public string LicensePlate { get; set; } = string.Empty;
        public string VehicleTypeName { get; set; } = string.Empty;
        public string? VehicleBrand { get; set; }
    }

    public class UserStats
    {
        public int TotalRides { get; set; }
        public decimal TotalSpent { get; set; } // For users
        public decimal TotalEarnings { get; set; } // For drivers
        public double AverageRating { get; set; } // For drivers
    }
}
