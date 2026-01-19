using LeafGo.Application.DTOs.Ride;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using LeafGo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LeafGo.Infrastructure.Services
{
    public class RideService : IRideService
    {
        private readonly LeafGoDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ICacheService _cacheService;
        private readonly ILogger<RideService> _logger;

        public RideService(
            LeafGoDbContext context,
            INotificationService notificationService,
            ICacheService cacheService,
            ILogger<RideService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<CalculatePriceResponse> CalculatePriceAsync(CalculatePriceRequest request)
        {
            // Get vehicle type
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt => vt.Id == request.VehicleTypeId && vt.IsActive);

            if (vehicleType == null)
            {
                throw new KeyNotFoundException("Vehicle type not found or inactive");
            }

            // Calculate distance using Haversine formula
            var distance = CalculateDistance(
                request.PickupLatitude,
                request.PickupLongitude,
                request.DestinationLatitude,
                request.DestinationLongitude
            );

            // Estimate duration (assuming average speed of 30 km/h in city)
            var estimatedDuration = (int)Math.Ceiling(distance / 30.0 * 60); // minutes

            // Calculate price: base price + (distance * price per km)
            var estimatedPrice = vehicleType.BasePrice + ((decimal)distance * vehicleType.PricePerKm);
            estimatedPrice = Math.Round(estimatedPrice / 1000) * 1000; // Round to nearest 1000

            return new CalculatePriceResponse
            {
                Distance = Math.Round((decimal)distance, 2),
                EstimatedDuration = estimatedDuration,
                EstimatedPrice = estimatedPrice,
                VehicleType = new VehicleTypeInfoDto
                {
                    Id = vehicleType.Id,
                    Name = vehicleType.Name,
                    BasePrice = vehicleType.BasePrice,
                    PricePerKm = vehicleType.PricePerKm,
                    Description = vehicleType.Description
                }
            };
        }

        public async Task<CreateRideResponse> CreateRideAsync(Guid userId, CreateRideRequest request)
        {
            // Get user info
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Check if user already has an active ride
            var hasActiveRide = await _context.Rides
                .AnyAsync(r => r.UserId == userId
                    && (r.Status == RideStatus.Pending
                        || r.Status == RideStatus.Accepted
                        || r.Status == RideStatus.DriverArriving
                        || r.Status == RideStatus.DriverArrived
                        || r.Status == RideStatus.InProgress));

            if (hasActiveRide)
            {
                throw new InvalidOperationException("You already have an active ride");
            }

            // Verify vehicle type exists
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt => vt.Id == request.VehicleTypeId && vt.IsActive);

            if (vehicleType == null)
            {
                throw new KeyNotFoundException("Vehicle type not found or inactive");
            }

            // Create ride
            var ride = new Ride
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                VehicleTypeId = request.VehicleTypeId,
                UserName = user.FullName,
                UserPhone = user.PhoneNumber,
                PickupAddress = request.PickupAddress,
                PickupLatitude = request.PickupLatitude,
                PickupLongitude = request.PickupLongitude,
                DestinationAddress = request.DestinationAddress,
                DestinationLatitude = request.DestinationLatitude,
                DestinationLongitude = request.DestinationLongitude,
                Distance = request.Distance,
                EstimatedDuration = request.EstimatedDuration,
                EstimatedPrice = request.EstimatedPrice,
                Notes = request.Notes,
                Status = RideStatus.Pending,
                RequestedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Rides.Add(ride);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Ride created: {RideId} by user {UserId}", ride.Id, userId);

            // Cache the ride and active status
            await _cacheService.SetActiveRideAsync(userId, ride.Id);
            await _cacheService.AddPendingRideAsync(ride.Id, new
            {
                ride.Id,
                ride.PickupLatitude,
                ride.PickupLongitude,
                ride.VehicleTypeId,
                ride.EstimatedPrice
            });

            // Get nearby drivers and notify them
            var nearbyDrivers = await _cacheService.GetNearbyDriversAsync(
                request.PickupLatitude,
                request.PickupLongitude,
                radiusKm: 10 // 10km radius
            );

            if (nearbyDrivers.Any())
            {
                await _notificationService.NotifyNewRideRequestAsync(ride.Id, nearbyDrivers);
            }

            return new CreateRideResponse
            {
                Id = ride.Id,
                Status = ride.Status,
                PickupAddress = ride.PickupAddress,
                DestinationAddress = ride.DestinationAddress,
                Distance = ride.Distance,
                EstimatedDuration = ride.EstimatedDuration,
                EstimatedPrice = ride.EstimatedPrice,
                RequestedAt = ride.RequestedAt,
                VehicleType = new VehicleTypeInfoDto
                {
                    Id = vehicleType.Id,
                    Name = vehicleType.Name,
                    BasePrice = vehicleType.BasePrice,
                    PricePerKm = vehicleType.PricePerKm,
                    Description = vehicleType.Description
                }
            };
        }

        public async Task<RideDetailResponse> GetRideByIdAsync(Guid rideId, Guid userId)
        {
            var ride = await _context.Rides
                .Include(r => r.VehicleType)
                .FirstOrDefaultAsync(r => r.Id == rideId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found");
            }

            // Check if user owns this ride
            if (ride.UserId != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to view this ride");
            }

            var response = new RideDetailResponse
            {
                Id = ride.Id,
                Status = ride.Status,
                PickupAddress = ride.PickupAddress,
                PickupLatitude = ride.PickupLatitude,
                PickupLongitude = ride.PickupLongitude,
                DestinationAddress = ride.DestinationAddress,
                DestinationLatitude = ride.DestinationLatitude,
                DestinationLongitude = ride.DestinationLongitude,
                Distance = ride.Distance,
                EstimatedDuration = ride.EstimatedDuration,
                EstimatedPrice = ride.EstimatedPrice,
                FinalPrice = ride.FinalPrice,
                Notes = ride.Notes,
                VehicleType = new VehicleTypeInfoDto
                {
                    Id = ride.VehicleType.Id,
                    Name = ride.VehicleType.Name,
                    BasePrice = ride.VehicleType.BasePrice,
                    PricePerKm = ride.VehicleType.PricePerKm,
                    Description = ride.VehicleType.Description
                },
                RequestedAt = ride.RequestedAt,
                AcceptedAt = ride.AcceptedAt,
                DriverArrivingAt = ride.DriverArrivingAt,
                DriverArrivedAt = ride.DriverArrivedAt,
                StartedAt = ride.StartedAt,
                CompletedAt = ride.CompletedAt,
                CancelledAt = ride.CancelledAt,
                CancellationReason = ride.CancellationReason,
                CancelledBy = ride.CancelledBy
            };

            // Get driver info if assigned
            if (ride.DriverId != null)
            {
                var driver = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == ride.DriverId);

                var vehicle = await _context.DriverVehicles
                    .FirstOrDefaultAsync(dv => dv.DriverId == ride.DriverId && dv.IsActive);

                var driverStats = await _context.Rides
                    .Where(r => r.DriverId == ride.DriverId && r.Status == RideStatus.Completed)
                    .CountAsync();

                var driverRating = await _context.Ratings
                    .Where(r => r.DriverId == ride.DriverId)
                    .AverageAsync(r => (double?)r.Rating) ?? 0;

                if (driver != null)
                {
                    response.Driver = new RideDriverInfo
                    {
                        Id = driver.Id,
                        FullName = driver.FullName,
                        PhoneNumber = driver.PhoneNumber,
                        Avatar = driver.Avatar,
                        AverageRating = driverRating,
                        TotalRides = driverStats,
                        Vehicle = vehicle != null ? new RideVehicleInfo
                        {
                            LicensePlate = vehicle.LicensePlate,
                            VehicleBrand = vehicle.VehicleBrand,
                            VehicleModel = vehicle.VehicleModel,
                            VehicleColor = vehicle.VehicleColor
                        } : null
                    };
                }
            }

            // Get rating if completed
            if (ride.Status == RideStatus.Completed)
            {
                var rating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.RideId == rideId);

                if (rating != null)
                {
                    response.Rating = new RideRatingInfo
                    {
                        Rating = rating.Rating,
                        Comment = rating.Comment,
                        CreatedAt = rating.CreatedAt
                    };
                }
            }

            return response;
        }

        public async Task<ActiveRideResponse?> GetActiveRideAsync(Guid userId)
        {
            var ride = await _context.Rides
                .FirstOrDefaultAsync(r => r.UserId == userId
                    && (r.Status == RideStatus.Pending
                        || r.Status == RideStatus.Accepted
                        || r.Status == RideStatus.DriverArriving
                        || r.Status == RideStatus.DriverArrived
                        || r.Status == RideStatus.InProgress));

            if (ride == null)
            {
                return null;
            }

            var response = new ActiveRideResponse
            {
                Id = ride.Id,
                Status = ride.Status,
                PickupAddress = ride.PickupAddress,
                PickupLatitude = ride.PickupLatitude,
                PickupLongitude = ride.PickupLongitude,
                DestinationAddress = ride.DestinationAddress,
                DestinationLatitude = ride.DestinationLatitude,
                DestinationLongitude = ride.DestinationLongitude,
                Distance = ride.Distance,
                EstimatedPrice = ride.EstimatedPrice,
                RequestedAt = ride.RequestedAt
            };

            // Get driver info if assigned
            if (ride.DriverId != null)
            {
                var driver = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == ride.DriverId);

                var vehicle = await _context.DriverVehicles
                    .FirstOrDefaultAsync(dv => dv.DriverId == ride.DriverId && dv.IsActive);

                var driverStats = await _context.Rides
                    .Where(r => r.DriverId == ride.DriverId && r.Status == RideStatus.Completed)
                    .CountAsync();

                var driverRating = await _context.Ratings
                    .Where(r => r.DriverId == ride.DriverId)
                    .AverageAsync(r => (double?)r.Rating) ?? 0;

                if (driver != null)
                {
                    response.Driver = new RideDriverInfo
                    {
                        Id = driver.Id,
                        FullName = driver.FullName,
                        PhoneNumber = driver.PhoneNumber,
                        Avatar = driver.Avatar,
                        AverageRating = driverRating,
                        TotalRides = driverStats,
                        Vehicle = vehicle != null ? new RideVehicleInfo
                        {
                            LicensePlate = vehicle.LicensePlate,
                            VehicleBrand = vehicle.VehicleBrand,
                            VehicleModel = vehicle.VehicleModel,
                            VehicleColor = vehicle.VehicleColor
                        } : null
                    };
                }
            }

            return response;
        }

        public async Task CancelRideAsync(Guid userId, Guid rideId, CancelRideRequest request)
        {
            var ride = await _context.Rides
                .FirstOrDefaultAsync(r => r.Id == rideId && r.UserId == userId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found or you don't have permission to cancel it");
            }

            // Can only cancel if not completed
            if (ride.Status == RideStatus.Completed)
            {
                throw new InvalidOperationException("Cannot cancel a completed ride");
            }

            if (ride.Status == RideStatus.Cancelled)
            {
                throw new InvalidOperationException("Ride is already cancelled");
            }

            ride.Status = RideStatus.Cancelled;
            ride.CancelledAt = DateTime.UtcNow;
            ride.CancellationReason = request.Reason;
            ride.CancelledBy = "User";
            ride.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Ride {RideId} cancelled by user {UserId}", rideId, userId);

            // Remove from cache
            await _cacheService.RemovePendingRideAsync(rideId);
            await _cacheService.RemoveActiveRideAsync(userId);

            // Notify via SignalR
            await _notificationService.NotifyRideCancelledAsync(rideId, "User");
        }

        public async Task<List<VehicleTypeListResponse>> GetAvailableVehicleTypesAsync()
        {
            var vehicleTypes = await _context.VehicleTypes
                .Where(vt => vt.IsActive)
                .OrderBy(vt => vt.BasePrice)
                .ToListAsync();

            var result = new List<VehicleTypeListResponse>();

            foreach (var vt in vehicleTypes)
            {
                // Count online drivers with this vehicle type
                var availableDrivers = await _context.DriverVehicles
                    .Where(dv => dv.VehicleTypeId == vt.Id && dv.IsActive)
                    .Join(_context.Users,
                        dv => dv.DriverId,
                        u => u.Id,
                        (dv, u) => new { dv, u })
                    .CountAsync(x => x.u.IsOnline && x.u.IsActive && !x.u.IsDeleted);

                result.Add(new VehicleTypeListResponse
                {
                    Id = vt.Id,
                    Name = vt.Name,
                    BasePrice = vt.BasePrice,
                    PricePerKm = vt.PricePerKm,
                    Description = vt.Description,
                    AvailableDrivers = availableDrivers
                });
            }

            return result;
        }

        public async Task<RatingResponse> SubmitRatingAsync(Guid userId, SubmitRatingRequest request)
        {
            // Get ride and verify ownership
            var ride = await _context.Rides
                .FirstOrDefaultAsync(r => r.Id == request.RideId && r.UserId == userId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found or you don't have permission to rate it");
            }

            // Can only rate completed rides
            if (ride.Status != RideStatus.Completed)
            {
                throw new InvalidOperationException("Can only rate completed rides");
            }

            // Check if already rated
            var existingRating = await _context.Ratings
                .FirstOrDefaultAsync(r => r.RideId == request.RideId);

            if (existingRating != null)
            {
                throw new InvalidOperationException("You have already rated this ride");
            }

            // Driver must be assigned
            if (ride.DriverId == null)
            {
                throw new InvalidOperationException("Cannot rate a ride without a driver");
            }

            // Create rating
            var rating = new Ratings
            {
                Id = Guid.NewGuid(),
                RideId = request.RideId,
                UserId = userId,
                DriverId = ride.DriverId.Value,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Rating submitted for ride {RideId}: {Rating} stars", request.RideId, request.Rating);

            return new RatingResponse
            {
                Id = rating.Id,
                RideId = rating.RideId,
                Rating = rating.Rating,
                Comment = rating.Comment,
                CreatedAt = rating.CreatedAt
            };
        }

        public async Task<DriverRatingsResponse> GetDriverRatingsAsync(Guid driverId, int page = 1, int pageSize = 10)
        {
            var driver = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == driverId && u.Role == UserRoles.Driver && !u.IsDeleted);

            if (driver == null)
            {
                throw new KeyNotFoundException("Driver not found");
            }

            var allRatings = await _context.Ratings
                .Where(r => r.DriverId == driverId)
                .ToListAsync();

            var ratingsQuery = await _context.Ratings
                .Where(r => r.DriverId == driverId)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new DriverRatingItem
                {
                    Id = r.Id,
                    UserName = r.User.FullName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return new DriverRatingsResponse
            {
                DriverId = driverId,
                DriverName = driver.FullName,
                AverageRating = allRatings.Any() ? allRatings.Average(r => r.Rating) : 0,
                TotalReviews = allRatings.Count,
                Ratings = ratingsQuery
            };
        }

        #region Helper Methods

        private double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double earthRadiusKm = 6371;

            var dLat = DegreesToRadians((double)(lat2 - lat1));
            var dLon = DegreesToRadians((double)(lon2 - lon1));

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians((double)lat1)) * Math.Cos(DegreesToRadians((double)lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = earthRadiusKm * c;

            return Math.Round(distance, 2);
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        #endregion
    }
}
