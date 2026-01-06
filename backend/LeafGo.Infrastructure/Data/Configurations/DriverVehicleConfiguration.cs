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
    public class DriverVehicleConfiguration : IEntityTypeConfiguration<DriverVehicle>
    {
        public void Configure(EntityTypeBuilder<DriverVehicle> builder)
        {
            builder.ToTable("DriverVehicles");

            builder.HasKey(dv => dv.Id);

            builder.Property(dv => dv.LicensePlate)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(dv => dv.VehicleBrand)
                .HasMaxLength(100);

            builder.Property(dv => dv.VehicleModel)
                .HasMaxLength(100);

            builder.Property(dv => dv.VehicleColor)
                .HasMaxLength(50);

            builder.Property(dv => dv.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.Property(dv => dv.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.HasOne(dv => dv.VehicleType)
                .WithMany(vt => vt.DriverVehicles)
                .HasForeignKey(dv => dv.VehicleTypeId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
