using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Admin
{
    public class ToggleUserStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
