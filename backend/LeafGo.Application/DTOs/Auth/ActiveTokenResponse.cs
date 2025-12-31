using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.DTOs.Auth
{
    public class ActiveTokenResponse
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string? CreatedByIp { get; set; }
        public bool IsActive { get; set; }
    }
}
