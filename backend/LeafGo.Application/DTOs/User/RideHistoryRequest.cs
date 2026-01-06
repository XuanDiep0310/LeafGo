using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.DTOs.User
{
    public class RideHistoryRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; } // null = all, "Completed", "Cancelled"
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
