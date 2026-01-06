using FluentValidation;
using LeafGo.Application.DTOs.User;

namespace LeafGo.Application.Validators
{
    public class RideHistoryRequestValidator : AbstractValidator<RideHistoryRequest>
    {
        public RideHistoryRequestValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page must be greater than 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0).WithMessage("Page size must be greater than 0")
                .LessThanOrEqualTo(100).WithMessage("Page size must not exceed 100");

            RuleFor(x => x.Status)
                .Must(status => string.IsNullOrEmpty(status) ||
                       new[] { "Pending", "Accepted", "DriverArriving", "DriverArrived", "InProgress", "Completed", "Cancelled" }
                       .Contains(status))
                .WithMessage("Invalid status value");

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
