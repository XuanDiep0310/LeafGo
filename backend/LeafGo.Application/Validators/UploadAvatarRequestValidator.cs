using FluentValidation;
using LeafGo.Application.DTOs.User;

namespace LeafGo.Application.Validators
{
    public class UploadAvatarRequestValidator : AbstractValidator<UploadAvatarRequest>
    {
        private readonly long _maxFileSize = 5 * 1024 * 1024; // 5MB
        private readonly string[] _allowedContentTypes =
        {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    };

        public UploadAvatarRequestValidator()
        {
            RuleFor(x => x.File)
                .NotNull().WithMessage("File is required")
                .Must(file => file != null && file.Length > 0).WithMessage("File cannot be empty")
                .Must(file => file == null || file.Length <= _maxFileSize)
                    .WithMessage($"File size must not exceed {_maxFileSize / 1024 / 1024}MB")
                .Must(file => file == null || _allowedContentTypes.Contains(file.ContentType.ToLower()))
                    .WithMessage($"File type must be one of: {string.Join(", ", _allowedContentTypes)}");
        }
    }
}
