using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LeafGo.Domain.Entities;

public partial class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // User, Driver, Admin
    public string? Avatar { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public bool IsOnline { get; set; } = false;
    public string? ResetPasswordToken { get; set; }
    public DateTime? ResetPasswordExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    //public virtual ICollection<Ride> RidesAsUser { get; set; } = new List<Ride>();
    //public virtual ICollection<Ride> RidesAsDriver { get; set; } = new List<Ride>();
    //public virtual ICollection<Rating> RatingsAsUser { get; set; } = new List<Rating>();
    //public virtual ICollection<Rating> RatingsAsDriver { get; set; } = new List<Rating>();
}
