using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Domain.Entities
{
    public class DriverVehicle
    {
        public Guid Id { get; set; }
        public Guid DriverId { get; set; }
        public Guid VehicleTypeId { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string? VehicleBrand { get; set; }
        public string? VehicleModel { get; set; }
        public string? VehicleColor { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual User Driver { get; set; } = null!;
        public virtual VehicleType VehicleType { get; set; } = null!;
    }
}
