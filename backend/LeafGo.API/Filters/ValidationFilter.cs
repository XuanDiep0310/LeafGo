using FluentValidation;
using LeafGo.Application.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LeafGo.API.Filters
{
    public class ValidationFilter : IAsyncActionFilter
    {
        private readonly IServiceProvider _serviceProvider;

        public ValidationFilter(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Check if ModelState is valid
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => string.Join(", ", kvp.Value!.Errors.Select(e => e.ErrorMessage))
                    );

                var errorResponse = new ErrorResponse
                {
                    Error = "Validation failed",
                    Details = errors
                };

                context.Result = new BadRequestObjectResult(errorResponse);
                return;
            }

            // Run FluentValidation if validator exists
            foreach (var arg in context.ActionArguments.Values)
            {
                if (arg == null) continue;

                var validatorType = typeof(IValidator<>).MakeGenericType(arg.GetType());
                var validator = _serviceProvider.GetService(validatorType) as IValidator;

                if (validator != null)
                {
                    var validationContext = new ValidationContext<object>(arg);
                    var validationResult = await validator.ValidateAsync(validationContext);

                    if (!validationResult.IsValid)
                    {
                        var errors = validationResult.Errors
                            .GroupBy(e => e.PropertyName)
                            .ToDictionary(
                                g => g.Key,
                                g => string.Join(", ", g.Select(e => e.ErrorMessage))
                            );

                        var errorResponse = new ErrorResponse
                        {
                            Error = "Validation failed",
                            Details = errors
                        };

                        context.Result = new BadRequestObjectResult(errorResponse);
                        return;
                    }
                }
            }

            await next();
        }
    }

}
