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
    }
}
