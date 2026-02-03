using FluentValidation;
using LeafGo.Application.DTOs.User;

namespace LeafGo.Application.Validators
{
    public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
    {
        public UpdateProfileRequestValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full name is required")
                .MinimumLength(2).WithMessage("Full name must be at least 2 characters")
                .MaximumLength(255).WithMessage("Full name must not exceed 255 characters");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Phone number is required")
                .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Invalid Vietnamese phone number format");
        }
    }
}
