using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Domain.Entities
{
    public class VehicleType
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<DriverVehicle> DriverVehicles { get; set; } = new List<DriverVehicle>();
        public virtual ICollection<Ride> Rides { get; set; } = new List<Ride>();
    }
}
