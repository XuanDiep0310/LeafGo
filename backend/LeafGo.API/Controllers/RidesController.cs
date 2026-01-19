using LeafGo.Application.DTOs.Common;
using LeafGo.Application.DTOs.Ride;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LeafGo.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RidesController : ControllerBase
    {
        private readonly IRideService _rideService;
        private readonly ILogger<RidesController> _logger;

        public RidesController(IRideService rideService, ILogger<RidesController> logger)
        {
            _rideService = rideService;
            _logger = logger;
        }

        /// <summary>
        /// Calculate price for a ride (no database save)
        /// </summary>
        [HttpPost("calculate-price")]
        [ProducesResponseType(typeof(ApiResponse<CalculatePriceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CalculatePrice([FromBody] CalculatePriceRequest request)
        {
            try
            {
                var result = await _rideService.CalculatePriceAsync(request);
                return Ok(ApiResponse<CalculatePriceResponse>.SuccessResponse(
                    result,
                    "Price calculated successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating price");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while calculating price" });
            }
        }

        /// <summary>
        /// Get available vehicle types with online driver counts
        /// </summary>
        [HttpGet("vehicle-types")]
        [ProducesResponseType(typeof(ApiResponse<List<VehicleTypeListResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVehicleTypes()
        {
            try
            {
                var vehicleTypes = await _rideService.GetAvailableVehicleTypesAsync();
                return Ok(ApiResponse<List<VehicleTypeListResponse>>.SuccessResponse(
                    vehicleTypes,
                    "Vehicle types retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle types");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Create a new ride request (User only)
        /// </summary>
        [Authorize(Roles = UserRoles.User)]
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CreateRideResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateRide([FromBody] CreateRideRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var ride = await _rideService.CreateRideAsync(userId, request);

                return StatusCode(201, ApiResponse<CreateRideResponse>.SuccessResponse(
                    ride,
                    "Ride created successfully. Searching for drivers..."
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ride");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while creating ride" });
            }
        }

        /// <summary>
        /// Get ride details by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<RideDetailResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetRideById(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var ride = await _rideService.GetRideByIdAsync(id, userId);

                return Ok(ApiResponse<RideDetailResponse>.SuccessResponse(
                    ride,
                    "Ride details retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ride details");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get user's current active ride
        /// </summary>
        [Authorize(Roles = UserRoles.User)]
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponse<ActiveRideResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveRide()
        {
            try
            {
                var userId = GetCurrentUserId();
                var ride = await _rideService.GetActiveRideAsync(userId);

                if (ride == null)
                {
                    return Ok(ApiResponse<ActiveRideResponse?>.SuccessResponse(
                        null,
                        "No active ride found"
                    ));
                }

                return Ok(ApiResponse<ActiveRideResponse>.SuccessResponse(
                    ride,
                    "Active ride retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active ride");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Cancel a ride (User only)
        /// </summary>
        [Authorize(Roles = UserRoles.User)]
        [HttpPut("{id}/cancel")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelRide(Guid id, [FromBody] CancelRideRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _rideService.CancelRideAsync(userId, id, request);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Ride cancelled successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling ride");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        #region Helper Methods

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        #endregion
    }
}
