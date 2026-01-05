using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.DTOs.Auth
{
    public class LoginRequest
    {
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;

        // Custom validation: either email or phone must be provided
        public bool IsValid()
        {
            return !string.IsNullOrWhiteSpace(Email) || !string.IsNullOrWhiteSpace(PhoneNumber);
        }
    }
}
