using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.DTOs.Driver
{
    public class AcceptRideRequest
    {
        [Required]
        public Guid RideId { get; set; }

        [Required]
        public string Version { get; set; } = string.Empty; // For optimistic locking
    }
}
