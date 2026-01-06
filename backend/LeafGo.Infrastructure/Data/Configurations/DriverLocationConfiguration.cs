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
    public class DriverLocationConfiguration : IEntityTypeConfiguration<DriverLocation>
    {
        public void Configure(EntityTypeBuilder<DriverLocation> builder)
        {
            builder.ToTable("DriverLocations");

            builder.HasKey(dl => dl.Id);

            builder.Property(dl => dl.Latitude)
                .HasColumnType("decimal(10,8)")
                .IsRequired();

            builder.Property(dl => dl.Longitude)
                .HasColumnType("decimal(11,8)")
                .IsRequired();

            builder.Property(dl => dl.LastUpdated)
                .HasDefaultValueSql("GETDATE()");
        }
    }
}
