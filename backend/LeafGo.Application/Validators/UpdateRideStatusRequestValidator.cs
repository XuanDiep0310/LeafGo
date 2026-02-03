using FluentValidation;
using LeafGo.Application.DTOs.Driver;

namespace LeafGo.Application.Validators
{
    public class UpdateRideStatusRequestValidator : AbstractValidator<UpdateRideStatusRequest>
    {
        private readonly string[] _validStatuses =
        {
        "DriverArriving",
        "DriverArrived",
        "InProgress",
        "Completed"
    };

        public UpdateRideStatusRequestValidator()
        {
            RuleFor(x => x.RideId)
                .NotEmpty().WithMessage("Ride ID is required");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required")
                .Must(status => _validStatuses.Contains(status))
                .WithMessage($"Status must be one of: {string.Join(", ", _validStatuses)}");

            RuleFor(x => x.FinalPrice)
                .GreaterThan(0).WithMessage("Final price must be greater than 0")
                .When(x => x.Status == "Completed")
                .WithMessage("Final price is required when completing a ride");
        }
    }
}
