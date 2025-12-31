using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.DTOs.Common
{
    public class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
        public Dictionary<string, string>? Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
