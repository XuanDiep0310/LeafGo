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
    public class RideConfiguration : IEntityTypeConfiguration<Ride>
    {
        public void Configure(EntityTypeBuilder<Ride> builder)
        {
            builder.ToTable("Rides");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.UserName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(r => r.UserPhone)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(r => r.DriverName)
                .HasMaxLength(255);

            builder.Property(r => r.DriverPhone)
                .HasMaxLength(20);

            builder.Property(r => r.PickupAddress)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(r => r.PickupLatitude)
                .HasColumnType("decimal(10,8)")
                .IsRequired();

            builder.Property(r => r.PickupLongitude)
                .HasColumnType("decimal(11,8)")
                .IsRequired();

            builder.Property(r => r.DestinationAddress)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(r => r.DestinationLatitude)
                .HasColumnType("decimal(10,8)")
                .IsRequired();

            builder.Property(r => r.DestinationLongitude)
                .HasColumnType("decimal(11,8)")
                .IsRequired();

            builder.Property(r => r.Distance)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            builder.Property(r => r.EstimatedPrice)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(r => r.FinalPrice)
                .HasColumnType("decimal(18,2)");

            builder.Property(r => r.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            builder.Property(r => r.CancellationReason)
                .HasMaxLength(500);

            builder.Property(r => r.CancelledBy)
                .HasMaxLength(20);

            builder.Property(r => r.Notes)
                .HasMaxLength(1000);

            builder.Property(r => r.RequestedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.Property(r => r.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            // Rowversion for optimistic concurrency
            builder.Property(r => r.UpdatedAt)
                .IsConcurrencyToken();

            builder.HasOne(r => r.VehicleType)
                .WithMany(vt => vt.Rides)
                .HasForeignKey(r => r.VehicleTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(r => r.Rating)
                .WithOne(rt => rt.Ride)
                .HasForeignKey<Ratings>(rt => rt.RideId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
