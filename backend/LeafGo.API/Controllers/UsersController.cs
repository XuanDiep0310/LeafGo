using LeafGo.Application.DTOs.Common;
using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LeafGo.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Get current user profile
        /// </summary>
        [HttpGet("profile")]
        [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                var profile = await _userService.GetProfileAsync(userId);

                return Ok(ApiResponse<UserProfileResponse>.SuccessResponse(
                    profile,
                    "Profile retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while retrieving profile" });
            }
        }

        /// <summary>
        /// Update current user profile
        /// </summary>
        [HttpPut("profile")]
        [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var profile = await _userService.UpdateProfileAsync(userId, request);

                return Ok(ApiResponse<UserProfileResponse>.SuccessResponse(
                    profile,
                    "Profile updated successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while updating profile" });
            }
        }

        /// <summary>
        /// Upload user avatar
        /// </summary>
        [HttpPost("avatar")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(ApiResponse<UploadAvatarResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request)
        {
            var file = request.File;
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ErrorResponse { Error = "File is required" });
                }

                var userId = GetCurrentUserId();
                var result = await _userService.UploadAvatarAsync(userId, file);

                return Ok(ApiResponse<UploadAvatarResponse>.SuccessResponse(
                    result,
                    "Avatar uploaded successfully"
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
                _logger.LogError(ex, "Error uploading avatar");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while uploading avatar" });
            }
        }

        /// <summary>
        /// Get ride history for current user
        /// </summary>
        [HttpGet("ride-history")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<RideHistoryResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRideHistory([FromQuery] RideHistoryRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var history = await _userService.GetRideHistoryAsync(userId, request);

                return Ok(ApiResponse<PagedResponse<RideHistoryResponse>>.SuccessResponse(
                    history,
                    "Ride history retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ride history");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while retrieving ride history" });
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
