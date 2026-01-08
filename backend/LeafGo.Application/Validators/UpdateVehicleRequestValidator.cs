using FluentValidation;
using LeafGo.Application.DTOs.Driver;

namespace LeafGo.Application.Validators
{
    public class UpdateVehicleRequestValidator : AbstractValidator<UpdateVehicleRequest>
    {
        public UpdateVehicleRequestValidator()
        {
            RuleFor(x => x.VehicleTypeId)
                .NotEmpty().WithMessage("Vehicle type is required");

            RuleFor(x => x.LicensePlate)
                .NotEmpty().WithMessage("License plate is required")
                .Matches(@"^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$")
                .WithMessage("Invalid license plate format. Example: 59A-12345 or 51B-12345");

            RuleFor(x => x.VehicleBrand)
                .MaximumLength(100).WithMessage("Vehicle brand must not exceed 100 characters");

            RuleFor(x => x.VehicleModel)
                .MaximumLength(100).WithMessage("Vehicle model must not exceed 100 characters");

            RuleFor(x => x.VehicleColor)
                .MaximumLength(50).WithMessage("Vehicle color must not exceed 50 characters");
        }
    }
}
