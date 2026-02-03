using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Driver
{
    public class ToggleOnlineRequest
    {
        [Required]
        public bool IsOnline { get; set; }
    }
}
