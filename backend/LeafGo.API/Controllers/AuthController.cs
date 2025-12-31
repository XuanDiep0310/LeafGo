using LeafGo.Application.DTOs.Auth;
using LeafGo.Application.DTOs.Common;
using LeafGo.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LeafGo.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                var response = await _authService.RegisterAsync(request, ipAddress);

                return StatusCode(201, ApiResponse<AuthResponse>.SuccessResponse(
                    response,
                    "User registered successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred during registration" });
            }
        }

        /// <summary>
        /// Login to get access and refresh tokens
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                var response = await _authService.LoginAsync(request, ipAddress);

                return Ok(ApiResponse<AuthResponse>.SuccessResponse(
                    response,
                    "Login successful"
                ));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred during login" });
            }
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        [HttpPost("refresh-token")]
        [ProducesResponseType(typeof(ApiResponse<RefreshTokenResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                var response = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);

                return Ok(ApiResponse<RefreshTokenResponse>.SuccessResponse(
                    response,
                    "Token refreshed successfully"
                ));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred during token refresh" });
            }
        }

        /// <summary>
        /// Revoke refresh token (logout)
        /// </summary>
        [Authorize]
        [HttpPost("revoke-token")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                await _authService.RevokeTokenAsync(request.RefreshToken, ipAddress);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Token revoked successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token revocation");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred during token revocation" });
            }
        }

        /// <summary>
        /// Revoke all refresh tokens for current user (logout all devices)
        /// </summary>
        [Authorize]
        [HttpPost("revoke-all-tokens")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> RevokeAllTokens()
        {
            try
            {
                var userId = GetCurrentUserId();
                var ipAddress = GetIpAddress();

                await _authService.RevokeAllTokensAsync(userId, ipAddress);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "All tokens revoked successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during revoke all tokens");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Get active refresh tokens for current user
        /// </summary>
        [Authorize]
        [HttpGet("tokens")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ActiveTokenResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveTokens()
        {
            try
            {
                var userId = GetCurrentUserId();
                var tokens = await _authService.GetActiveTokensAsync(userId);

                return Ok(ApiResponse<IEnumerable<ActiveTokenResponse>>.SuccessResponse(
                    tokens,
                    "Active tokens retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active tokens");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Change password for current user
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _authService.ChangePasswordAsync(userId, request);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Password changed successfully"
                ));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponse { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Request password reset email
        /// </summary>
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                await _authService.ForgotPasswordAsync(request);

                // Always return success to prevent email enumeration
                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "If your email exists in our system, you will receive a password reset link"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred" });
            }
        }

        /// <summary>
        /// Reset password using reset token
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                await _authService.ResetPasswordAsync(request);

                return Ok(ApiResponse<object>.SuccessResponse(
                    null,
                    "Password reset successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
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

        private string? GetIpAddress()
        {
            // Get IP from X-Forwarded-For header if behind proxy
            if (Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                return Request.Headers["X-Forwarded-For"].FirstOrDefault();
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        #endregion
    }
}
