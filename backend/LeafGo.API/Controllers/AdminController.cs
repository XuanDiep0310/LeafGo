using LeafGo.Application.DTOs.Admin;
using LeafGo.Application.DTOs.Common;
using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LeafGo.API.Controllers
{
    [Authorize(Roles = UserRoles.Admin)]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        #region User Management

        /// <summary>
        /// Get all users with filtering and pagination
        /// </summary>
        [HttpGet("users")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<UserManagementResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers([FromQuery] UserManagementRequest request)
        {
            try
            {
                var users = await _adminService.GetUsersAsync(request);
                return Ok(ApiResponse<PagedResponse<UserManagementResponse>>.SuccessResponse(
                    users,
                    "Users retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("users/{id}")]
        [ProducesResponseType(typeof(ApiResponse<UserManagementResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            try
            {
                var user = await _adminService.GetUserByIdAsync(id);
                return Ok(ApiResponse<UserManagementResponse>.SuccessResponse(
                    user,
                    "User retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Create new user
        /// </summary>
        [HttpPost("users")]
        [ProducesResponseType(typeof(ApiResponse<UserManagementResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                var user = await _adminService.CreateUserAsync(request);
                return StatusCode(201, ApiResponse<UserManagementResponse>.SuccessResponse(
                    user,
                    "User created successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Update user information
        /// </summary>
        [HttpPut("users/{id}")]
        [ProducesResponseType(typeof(ApiResponse<UserManagementResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = await _adminService.UpdateUserAsync(id, request);
                return Ok(ApiResponse<UserManagementResponse>.SuccessResponse(
                    user,
                    "User updated successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Toggle user active status (lock/unlock account)
        /// </summary>
        [HttpPut("users/{id}/toggle-status")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleUserStatus(Guid id, [FromBody] ToggleUserStatusRequest request)
        {
            try
            {
                await _adminService.ToggleUserStatusAsync(id, request.IsActive);
                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    $"User {(request.IsActive ? "activated" : "deactivated")} successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Delete user (soft delete)
        /// </summary>
        [HttpDelete("users/{id}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                await _adminService.DeleteUserAsync(id);
                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "User deleted successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        #endregion

        #region Ride Management

        /// <summary>
        /// Get all rides with filtering and pagination
        /// </summary>
        [HttpGet("rides")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<RideManagementResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRides([FromQuery] RideManagementRequest request)
        {
            try
            {
                var rides = await _adminService.GetRidesAsync(request);
                return Ok(ApiResponse<PagedResponse<RideManagementResponse>>.SuccessResponse(
                    rides,
                    "Rides retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rides");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get ride by ID
        /// </summary>
        [HttpGet("rides/{id}")]
        [ProducesResponseType(typeof(ApiResponse<RideManagementResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRideById(Guid id)
        {
            try
            {
                var ride = await _adminService.GetRideByIdAsync(id);
                return Ok(ApiResponse<RideManagementResponse>.SuccessResponse(
                    ride,
                    "Ride retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ride by ID");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        #endregion

        #region Statistics

        /// <summary>
        /// Get system statistics (dashboard data)
        /// </summary>
        [HttpGet("statistics")]
        [ProducesResponseType(typeof(ApiResponse<SystemStatisticsResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _adminService.GetSystemStatisticsAsync();
                return Ok(ApiResponse<SystemStatisticsResponse>.SuccessResponse(
                    stats,
                    "Statistics retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        #endregion

        #region Vehicle Type Management

        /// <summary>
        /// Get all vehicle types
        /// </summary>
        [AllowAnonymous]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Driver}")]
        [HttpGet("vehicle-types")]
        [ProducesResponseType(typeof(ApiResponse<List<VehicleTypeResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVehicleTypes()
        {
            try
            {
                var vehicleTypes = await _adminService.GetVehicleTypesAsync();
                return Ok(ApiResponse<List<VehicleTypeResponse>>.SuccessResponse(
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
        /// Get vehicle type by ID
        /// </summary>
        [AllowAnonymous]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Driver}")]
        [HttpGet("vehicle-types/{id}")]
        [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetVehicleTypeById(Guid id)
        {
            try
            {
                var vehicleType = await _adminService.GetVehicleTypeByIdAsync(id);
                return Ok(ApiResponse<VehicleTypeResponse>.SuccessResponse(
                    vehicleType,
                    "Vehicle type retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle type");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Create new vehicle type
        /// </summary>
        [HttpPost("vehicle-types")]
        [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateVehicleType([FromBody] CreateVehicleTypeRequest request)
        {
            try
            {
                var vehicleType = await _adminService.CreateVehicleTypeAsync(request);
                return StatusCode(201, ApiResponse<VehicleTypeResponse>.SuccessResponse(
                    vehicleType,
                    "Vehicle type created successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle type");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Update vehicle type
        /// </summary>
        [HttpPut("vehicle-types/{id}")]
        [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateVehicleType(Guid id, [FromBody] UpdateVehicleTypeRequest request)
        {
            try
            {
                var vehicleType = await _adminService.UpdateVehicleTypeAsync(id, request);
                return Ok(ApiResponse<VehicleTypeResponse>.SuccessResponse(
                    vehicleType,
                    "Vehicle type updated successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle type");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Delete vehicle type
        /// </summary>
        [HttpDelete("vehicle-types/{id}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteVehicleType(Guid id)
        {
            try
            {
                await _adminService.DeleteVehicleTypeAsync(id);
                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Vehicle type deleted successfully"
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
                _logger.LogError(ex, "Error deleting vehicle type");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        #endregion
    }
}
