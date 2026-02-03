using LeafGo.Application.DTOs.Common;
using LeafGo.Application.DTOs.Ride;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LeafGo.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly IRideService _rideService;
        private readonly ILogger<RatingsController> _logger;

        public RatingsController(IRideService rideService, ILogger<RatingsController> logger)
        {
            _rideService = rideService;
            _logger = logger;
        }

        /// <summary>
        /// Submit rating for a completed ride (User only)
        /// </summary>
        [Authorize(Roles = UserRoles.User)]
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<RatingResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SubmitRating([FromBody] SubmitRatingRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var rating = await _rideService.SubmitRatingAsync(userId, request);

                return StatusCode(201, ApiResponse<RatingResponse>.SuccessResponse(
                    rating,
                    "Rating submitted successfully. Thank you for your feedback!"
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
                _logger.LogError(ex, "Error submitting rating");
                return StatusCode(500, new ErrorResponse { Error = "An error occurred while submitting rating" });
            }
        }

        /// <summary>
        /// Get driver's ratings and reviews
        /// </summary>
        [HttpGet("driver/{driverId}")]
        [ProducesResponseType(typeof(ApiResponse<DriverRatingsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetDriverRatings(
            Guid driverId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var ratings = await _rideService.GetDriverRatingsAsync(driverId, page, pageSize);

                return Ok(ApiResponse<DriverRatingsResponse>.SuccessResponse(
                    ratings,
                    "Driver ratings retrieved successfully"
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting driver ratings");
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
