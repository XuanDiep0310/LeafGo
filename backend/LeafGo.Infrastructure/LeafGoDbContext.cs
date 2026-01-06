using Microsoft.EntityFrameworkCore;
using LeafGo.Domain.Entities;

namespace LeafGo.Infrastructure;

public partial class LeafGoDbContext : DbContext
{
    public LeafGoDbContext()
    {
    }

    public LeafGoDbContext(DbContextOptions<LeafGoDbContext> options)
        : base(options)
    {
    }

    // DbSets
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<VehicleType> VehicleTypes { get; set; }
    public DbSet<DriverVehicle> DriverVehicles { get; set; }
    public DbSet<Ride> Rides { get; set; }
    public DbSet<Ratings> Ratings { get; set; }
    public DbSet<DriverLocation> DriverLocations { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LeafGoDbContext).Assembly);

        // Configure indexes
        ConfigureIndexes(modelBuilder);
    }

    private void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        // User indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Role);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.IsOnline);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.IsDeleted);

        // RefreshToken indexes
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.UserId);

        // DriverVehicle indexes
        modelBuilder.Entity<DriverVehicle>()
            .HasIndex(dv => dv.DriverId);

        modelBuilder.Entity<DriverVehicle>()
            .HasIndex(dv => dv.LicensePlate)
            .IsUnique();

        // Ride indexes
        modelBuilder.Entity<Ride>()
            .HasIndex(r => r.UserId);

        modelBuilder.Entity<Ride>()
            .HasIndex(r => r.DriverId);

        modelBuilder.Entity<Ride>()
            .HasIndex(r => r.Status);

        modelBuilder.Entity<Ride>()
            .HasIndex(r => r.RequestedAt);

        modelBuilder.Entity<Ride>()
            .HasIndex(r => new { r.UserId, r.Status });

        modelBuilder.Entity<Ride>()
            .HasIndex(r => new { r.DriverId, r.Status });

        // Rating indexes
        modelBuilder.Entity<Ratings>()
            .HasIndex(r => r.RideId)
            .IsUnique();

        modelBuilder.Entity<Ratings>()
            .HasIndex(r => r.DriverId);

        // DriverLocation indexes
        modelBuilder.Entity<DriverLocation>()
            .HasIndex(dl => dl.DriverId)
            .IsUnique();

        modelBuilder.Entity<DriverLocation>()
            .HasIndex(dl => dl.LastUpdated);

        // Notification indexes
        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.UserId);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.IsRead);
    }
}
