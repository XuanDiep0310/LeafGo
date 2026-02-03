using LeafGo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Infrastructure.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(u => u.PhoneNumber)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(u => u.Avatar)
                .HasMaxLength(500);

            builder.Property(u => u.ResetPasswordToken)
                .HasMaxLength(500);

            builder.Property(u => u.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.Property(u => u.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            // Relationships
            builder.HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(u => u.RidesAsUser)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(u => u.RidesAsDriver)
                .WithOne(r => r.Driver!)
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(u => u.RatingsAsUser)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(u => u.RatingsAsDriver)
                .WithOne(r => r.Driver)
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(u => u.Notifications)
                .WithOne(n => n.User)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(u => u.DriverVehicle)
                .WithOne(dv => dv.Driver)
                .HasForeignKey<DriverVehicle>(dv => dv.DriverId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(u => u.DriverLocation)
                .WithOne(dl => dl.Driver)
                .HasForeignKey<DriverLocation>(dl => dl.DriverId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
