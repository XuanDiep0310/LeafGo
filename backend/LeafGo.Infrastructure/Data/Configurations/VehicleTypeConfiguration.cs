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
    public class VehicleTypeConfiguration : IEntityTypeConfiguration<VehicleType>
    {
        public void Configure(EntityTypeBuilder<VehicleType> builder)
        {
            builder.ToTable("VehicleTypes");

            builder.HasKey(vt => vt.Id);

            builder.Property(vt => vt.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(vt => vt.BasePrice)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(vt => vt.PricePerKm)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(vt => vt.Description)
                .HasMaxLength(500);

            builder.Property(vt => vt.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            builder.Property(vt => vt.UpdatedAt)
                .HasDefaultValueSql("GETDATE()");
        }
    }
}
