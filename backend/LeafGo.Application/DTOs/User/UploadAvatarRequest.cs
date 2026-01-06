using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace LeafGo.Application.DTOs.User
{
    public class UploadAvatarRequest
    {
        [Required(ErrorMessage = "File is required")]
        public IFormFile File { get; set; } = null!;
    }
}
