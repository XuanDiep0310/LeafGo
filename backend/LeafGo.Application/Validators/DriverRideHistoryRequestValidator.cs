using FluentValidation;
using LeafGo.Application.DTOs.Driver;

namespace LeafGo.Application.Validators
{
    public class DriverRideHistoryRequestValidator : AbstractValidator<DriverRideHistoryRequest>
    {
        private readonly string[] _validStatuses =
        {
        "Pending",
        "Accepted",
        "DriverArriving",
        "DriverArrived",
        "InProgress",
        "Completed",
        "Cancelled"
    };

        public DriverRideHistoryRequestValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page must be greater than 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0).WithMessage("Page size must be greater than 0")
                .LessThanOrEqualTo(100).WithMessage("Page size must not exceed 100");

            RuleFor(x => x.Status)
                .Must(status => string.IsNullOrEmpty(status) || _validStatuses.Contains(status))
                .WithMessage($"Status must be one of: {string.Join(", ", _validStatuses)}");

            RuleFor(x => x.FromDate)
                .LessThanOrEqualTo(DateTime.UtcNow)
                .When(x => x.FromDate.HasValue)
                .WithMessage("From date cannot be in the future");

            RuleFor(x => x.ToDate)
                .GreaterThanOrEqualTo(x => x.FromDate)
                .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
                .WithMessage("To date must be after or equal to from date");
        }
    }
}
