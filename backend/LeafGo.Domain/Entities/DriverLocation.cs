using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Domain.Entities
{
    public class DriverLocation
    {
        public Guid Id { get; set; }
        public Guid DriverId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public DateTime LastUpdated { get; set; }

        // Navigation property
        public virtual User Driver { get; set; } = null!;
    }
}
