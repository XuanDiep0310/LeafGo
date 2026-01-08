using LeafGo.Application.DTOs.Common;
using LeafGo.Application.DTOs.Driver;
using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LeafGo.API.Controllers
{
    [Authorize(Roles = UserRoles.Driver)]
    [ApiController]
    [Route("api/[controller]")]
    public class DriversController : ControllerBase
    {
        private readonly IDriverService _driverService;
        private readonly ILogger<DriversController> _logger;

        public DriversController(IDriverService driverService, ILogger<DriversController> logger)
        {
            _driverService = driverService;
            _logger = logger;
        }

        /// <summary>
        /// Toggle driver online/offline status
        /// </summary>
        [HttpPut("toggle-online")]
        [ProducesResponseType(typeof(ApiResponse<ToggleOnlineResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ToggleOnline([FromBody] ToggleOnlineRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                var response = await _driverService.ToggleOnlineAsync(driverId, request.IsOnline);

                return Ok(ApiResponse<ToggleOnlineResponse>.SuccessResponse(
                    response,
                    response.Message
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling driver online status");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Update driver location (call every 10-30 seconds when online)
        /// </summary>
        [HttpPost("update-location")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateLocation([FromBody] UpdateLocationRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                await _driverService.UpdateLocationAsync(driverId, request);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Location updated successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating driver location");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get pending rides within radius (default 5km)
        /// </summary>
        [HttpGet("pending-rides")]
        [ProducesResponseType(typeof(ApiResponse<List<PendingRideResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPendingRides(
            [FromQuery] decimal latitude,
            [FromQuery] decimal longitude,
            [FromQuery] int radius = 5)
        {
            try
            {
                var driverId = GetCurrentUserId();
                var rides = await _driverService.GetPendingRidesAsync(driverId, latitude, longitude, radius);

                return Ok(ApiResponse<List<PendingRideResponse>>.SuccessResponse(
                    rides,
                    $"Found {rides.Count} pending rides"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending rides");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Accept a ride request
        /// </summary>
        [HttpPost("accept-ride")]
        [ProducesResponseType(typeof(ApiResponse<AcceptRideResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> AcceptRide([FromBody] AcceptRideRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                var response = await _driverService.AcceptRideAsync(driverId, request);

                return Ok(ApiResponse<AcceptRideResponse>.SuccessResponse(
                    response,
                    "Ride accepted successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting ride");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Update ride status (DriverArriving -> DriverArrived -> InProgress -> Completed)
        /// </summary>
        [HttpPut("update-ride-status")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRideStatus([FromBody] UpdateRideStatusRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                await _driverService.UpdateRideStatusAsync(driverId, request);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    $"Ride status updated to {request.Status}"
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
                _logger.LogError(ex, "Error updating ride status");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get current active ride
        /// </summary>
        [HttpGet("current-ride")]
        [ProducesResponseType(typeof(ApiResponse<CurrentRideResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCurrentRide()
        {
            try
            {
                var driverId = GetCurrentUserId();
                var ride = await _driverService.GetCurrentRideAsync(driverId);

                if (ride == null)
                {
                    return Ok(ApiResponse<CurrentRideResponse?>.SuccessResponse(
                        null,
                        "No active ride"
                    ));
                }

                return Ok(ApiResponse<CurrentRideResponse>.SuccessResponse(
                    ride,
                    "Current ride retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current ride");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get driver statistics (earnings, ratings, ride counts)
        /// </summary>
        [HttpGet("statistics")]
        [ProducesResponseType(typeof(ApiResponse<DriverStatisticsResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var driverId = GetCurrentUserId();
                var stats = await _driverService.GetStatisticsAsync(driverId);

                return Ok(ApiResponse<DriverStatisticsResponse>.SuccessResponse(
                    stats,
                    "Statistics retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting driver statistics");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get driver ride history
        /// </summary>
        [HttpGet("ride-history")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<DriverRideHistoryResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRideHistory([FromQuery] DriverRideHistoryRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                var history = await _driverService.GetRideHistoryAsync(driverId, request);

                return Ok(ApiResponse<PagedResponse<DriverRideHistoryResponse>>.SuccessResponse(
                    history,
                    "Ride history retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ride history");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get driver vehicle information
        /// </summary>
        [HttpGet("vehicle")]
        [ProducesResponseType(typeof(ApiResponse<VehicleInfoResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVehicle()
        {
            try
            {
                var driverId = GetCurrentUserId();
                var vehicle = await _driverService.GetVehicleAsync(driverId);

                if (vehicle == null)
                {
                    return Ok(ApiResponse<VehicleInfoResponse?>.SuccessResponse(
                        null,
                        "No vehicle configured"
                    ));
                }

                return Ok(ApiResponse<VehicleInfoResponse>.SuccessResponse(
                    vehicle,
                    "Vehicle information retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle information");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Update driver vehicle information
        /// </summary>
        [HttpPut("vehicle")]
        [ProducesResponseType(typeof(ApiResponse<VehicleInfoResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateVehicle([FromBody] UpdateVehicleRequest request)
        {
            try
            {
                var driverId = GetCurrentUserId();
                var vehicle = await _driverService.UpdateVehicleAsync(driverId, request);

                return Ok(ApiResponse<VehicleInfoResponse>.SuccessResponse(
                    vehicle,
                    "Vehicle information updated successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle information");
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
