using System.ComponentModel.DataAnnotations;

namespace LeafGo.Application.DTOs.Admin
{
    public class UpdateUserRequest
    {
        [Required]
        [MinLength(2)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public bool IsActive { get; set; }
    }
}
