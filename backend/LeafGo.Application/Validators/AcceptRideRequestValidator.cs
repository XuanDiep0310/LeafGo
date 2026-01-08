using FluentValidation;
using LeafGo.Application.DTOs.Driver;

namespace LeafGo.Application.Validators
{
    public class AcceptRideRequestValidator : AbstractValidator<AcceptRideRequest>
    {
        public AcceptRideRequestValidator()
        {
            RuleFor(x => x.RideId)
                .NotEmpty().WithMessage("Ride ID is required");

            RuleFor(x => x.Version)
                .NotEmpty().WithMessage("Version is required for concurrency check");
        }
    }
}
