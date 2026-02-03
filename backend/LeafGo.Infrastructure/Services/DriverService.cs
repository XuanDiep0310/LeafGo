using LeafGo.Application.DTOs.Driver;
using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using LeafGo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LeafGo.Infrastructure.Services
{
    public class DriverService : IDriverService
    {
        private readonly LeafGoDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ICacheService _cacheService;
        private readonly ILogger<DriverService> _logger;

        public DriverService(
            LeafGoDbContext context,
            INotificationService notificationService,
            ICacheService cacheService,
            ILogger<DriverService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<ToggleOnlineResponse> ToggleOnlineAsync(Guid driverId, bool isOnline)
        {
            var driver = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == driverId && u.Role == UserRoles.Driver && !u.IsDeleted);

            if (driver == null)
            {
                throw new KeyNotFoundException("Driver not found");
            }

            // Check if driver has vehicle configured
            if (isOnline)
            {
                var hasVehicle = await _context.DriverVehicles
                    .AnyAsync(dv => dv.DriverId == driverId && dv.IsActive);

                if (!hasVehicle)
                {
                    throw new InvalidOperationException("Please configure your vehicle information before going online");
                }
            }

            driver.IsOnline = isOnline;
            driver.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update cache
            if (isOnline)
            {
                await _cacheService.SetDriverOnlineAsync(driverId);
            }
            else
            {
                await _cacheService.SetDriverOfflineAsync(driverId);
            }

            return new ToggleOnlineResponse
            {
                IsOnline = isOnline,
                Message = isOnline ? "You are now online and can receive ride requests" : "You are now offline"
            };
        }

        public async Task UpdateLocationAsync(Guid driverId, UpdateLocationRequest request)
        {
            var driver = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == driverId && u.Role == UserRoles.Driver && !u.IsDeleted);

            if (driver == null)
            {
                throw new KeyNotFoundException("Driver not found");
            }

            // Update or create location
            var location = await _context.DriverLocations
                .FirstOrDefaultAsync(dl => dl.DriverId == driverId);

            if (location == null)
            {
                location = new DriverLocation
                {
                    Id = Guid.NewGuid(),
                    DriverId = driverId,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    LastUpdated = DateTime.UtcNow
                };
                _context.DriverLocations.Add(location);
            }
            else
            {
                location.Latitude = request.Latitude;
                location.Longitude = request.Longitude;
                location.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Driver {DriverId} location updated to ({Lat}, {Lng})",
                driverId, request.Latitude, request.Longitude);

            // Update Redis cache for geospatial queries
            await _cacheService.UpdateDriverLocationAsync(driverId, request.Latitude, request.Longitude);
        }

        public async Task<List<PendingRideResponse>> GetPendingRidesAsync(
            Guid driverId,
            decimal latitude,
            decimal longitude,
            int radiusKm = 5)
        {
            // Get driver's vehicle type
            var driverVehicle = await _context.DriverVehicles
                .FirstOrDefaultAsync(dv => dv.DriverId == driverId && dv.IsActive);

            if (driverVehicle == null)
            {
                return new List<PendingRideResponse>();
            }

            // Get pending rides matching driver's vehicle type within radius
            var pendingRides = await _context.Rides
                .Include(r => r.User)
                .Where(r => r.Status == RideStatus.Pending
                    && r.VehicleTypeId == driverVehicle.VehicleTypeId
                    && r.DriverId == null)
                .OrderBy(r => r.RequestedAt)
                .ToListAsync();

            var result = new List<PendingRideResponse>();

            foreach (var ride in pendingRides)
            {
                // Calculate distance from driver to pickup location
                var distance = CalculateDistance(
                    latitude, longitude,
                    ride.PickupLatitude, ride.PickupLongitude
                );

                // Only include rides within radius
                if (distance <= radiusKm)
                {
                    result.Add(new PendingRideResponse
                    {
                        Id = ride.Id,
                        PickupAddress = ride.PickupAddress,
                        PickupLatitude = ride.PickupLatitude,
                        PickupLongitude = ride.PickupLongitude,
                        DestinationAddress = ride.DestinationAddress,
                        DestinationLatitude = ride.DestinationLatitude,
                        DestinationLongitude = ride.DestinationLongitude,
                        Distance = ride.Distance,
                        EstimatedDuration = ride.EstimatedDuration,
                        EstimatedPrice = ride.EstimatedPrice,
                        RequestedAt = ride.RequestedAt,
                        Version = Convert.ToBase64String(BitConverter.GetBytes(ride.UpdatedAt.Ticks)),
                        User = new UserBasicInfo
                        {
                            Id = ride.UserId,
                            FullName = ride.UserName,
                            PhoneNumber = ride.UserPhone
                        },
                        DistanceFromDriver = Convert.ToDecimal(distance)
                    });
                }
            }

            return result.OrderBy(r => r.DistanceFromDriver).ToList();
        }

        public async Task<AcceptRideResponse> AcceptRideAsync(Guid driverId, AcceptRideRequest request)
        {
            var driver = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == driverId && u.Role == UserRoles.Driver && !u.IsDeleted);

            if (driver == null)
            {
                throw new KeyNotFoundException("Driver not found");
            }

            // Check if driver already has an active ride
            var hasActiveRide = await _context.Rides
                .AnyAsync(r => r.DriverId == driverId
                    && (r.Status == RideStatus.Accepted
                        || r.Status == RideStatus.DriverArriving
                        || r.Status == RideStatus.DriverArrived
                        || r.Status == RideStatus.InProgress));

            if (hasActiveRide)
            {
                throw new InvalidOperationException("You already have an active ride");
            }

            // Get the ride
            var ride = await _context.Rides
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == request.RideId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found");
            }

            if (ride.Status != RideStatus.Pending)
            {
                throw new InvalidOperationException("Ride is no longer available");
            }

            if (ride.DriverId != null)
            {
                throw new InvalidOperationException("Ride already accepted by another driver");
            }

            // Optimistic concurrency check
            var currentVersion = Convert.ToBase64String(BitConverter.GetBytes(ride.UpdatedAt.Ticks));
            if (currentVersion != request.Version)
            {
                throw new InvalidOperationException("Ride has been modified. Please refresh and try again");
            }

            // Accept the ride
            ride.DriverId = driverId;
            ride.DriverName = driver.FullName;
            ride.DriverPhone = driver.PhoneNumber;
            ride.Status = RideStatus.Accepted;
            ride.AcceptedAt = DateTime.UtcNow;
            ride.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Driver {DriverId} accepted ride {RideId}", driverId, request.RideId);

            // Update cache
            await _cacheService.RemovePendingRideAsync(request.RideId);

            // Notify user via SignalR
            var driverInfo = new
            {
                Id = driver.Id,
                FullName = driver.FullName,
                PhoneNumber = driver.PhoneNumber,
                Avatar = driver.Avatar
            };

            await _notificationService.NotifyRideAcceptedAsync(request.RideId, ride.UserId, driverInfo);

            return new AcceptRideResponse
            {
                RideId = ride.Id,
                Status = ride.Status,
                User = new UserBasicInfo
                {
                    Id = ride.UserId,
                    FullName = ride.UserName,
                    PhoneNumber = ride.UserPhone
                },
                PickupAddress = ride.PickupAddress,
                PickupLatitude = ride.PickupLatitude,
                PickupLongitude = ride.PickupLongitude,
                DestinationAddress = ride.DestinationAddress,
                EstimatedPrice = ride.EstimatedPrice
            };
        }

        public async Task UpdateRideStatusAsync(Guid driverId, UpdateRideStatusRequest request)
        {
            var ride = await _context.Rides
                .FirstOrDefaultAsync(r => r.Id == request.RideId && r.DriverId == driverId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found or you are not assigned to this ride");
            }

            // Validate status transition
            ValidateStatusTransition(ride.Status, request.Status);

            // Update status
            ride.Status = request.Status;
            ride.UpdatedAt = DateTime.UtcNow;

            switch (request.Status)
            {
                case RideStatus.DriverArriving:
                    ride.DriverArrivingAt = DateTime.UtcNow;
                    break;
                case RideStatus.DriverArrived:
                    ride.DriverArrivedAt = DateTime.UtcNow;
                    break;
                case RideStatus.InProgress:
                    ride.StartedAt = DateTime.UtcNow;
                    break;
                case RideStatus.Completed:
                    ride.CompletedAt = DateTime.UtcNow;
                    ride.FinalPrice = request.FinalPrice ?? ride.EstimatedPrice;
                    break;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Ride {RideId} status updated to {Status} by driver {DriverId}",
                request.RideId, request.Status, driverId);

            // Notify via SignalR
            await _notificationService.NotifyRideStatusChangedAsync(request.RideId, request.Status);

            // If completed, remove active ride cache
            if (request.Status == RideStatus.Completed)
            {
                await _cacheService.RemoveActiveRideAsync(ride.UserId);
                await _notificationService.NotifyRideCompletedAsync(request.RideId);
            }
        }

        public async Task<CurrentRideResponse?> GetCurrentRideAsync(Guid driverId)
        {
            var ride = await _context.Rides
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.DriverId == driverId
                    && (r.Status == RideStatus.Accepted
                        || r.Status == RideStatus.DriverArriving
                        || r.Status == RideStatus.DriverArrived
                        || r.Status == RideStatus.InProgress));

            if (ride == null)
            {
                return null;
            }

            return new CurrentRideResponse
            {
                Id = ride.Id,
                User = new UserBasicInfo
                {
                    Id = ride.UserId,
                    FullName = ride.UserName,
                    PhoneNumber = ride.UserPhone
                },
                PickupAddress = ride.PickupAddress,
                PickupLatitude = ride.PickupLatitude,
                PickupLongitude = ride.PickupLongitude,
                DestinationAddress = ride.DestinationAddress,
                DestinationLatitude = ride.DestinationLatitude,
                DestinationLongitude = ride.DestinationLongitude,
                Distance = ride.Distance,
                EstimatedDuration = ride.EstimatedDuration,
                EstimatedPrice = ride.EstimatedPrice,
                Status = ride.Status,
                AcceptedAt = ride.AcceptedAt!.Value,
                Notes = ride.Notes
            };
        }

        public async Task<DriverStatisticsResponse> GetStatisticsAsync(Guid driverId)
        {
            var today = DateTime.UtcNow.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);

            var completedRides = await _context.Rides
                .Where(r => r.DriverId == driverId && r.Status == RideStatus.Completed)
                .ToListAsync();

            var ratings = await _context.Ratings
                .Where(r => r.DriverId == driverId)
                .ToListAsync();

            return new DriverStatisticsResponse
            {
                TotalRides = completedRides.Count,
                TotalEarnings = completedRides.Sum(r => r.FinalPrice ?? 0),
                AverageRating = ratings.Any() ? ratings.Average(r => r.Rating) : 0,
                TotalReviews = ratings.Count,
                TodayRides = completedRides.Count(r => r.CompletedAt!.Value.Date == today),
                TodayEarnings = completedRides
                    .Where(r => r.CompletedAt!.Value.Date == today)
                    .Sum(r => r.FinalPrice ?? 0),
                ThisWeekRides = completedRides.Count(r => r.CompletedAt!.Value >= weekStart),
                ThisWeekEarnings = completedRides
                    .Where(r => r.CompletedAt!.Value >= weekStart)
                    .Sum(r => r.FinalPrice ?? 0),
                ThisMonthRides = completedRides.Count(r => r.CompletedAt!.Value >= monthStart),
                ThisMonthEarnings = completedRides
                    .Where(r => r.CompletedAt!.Value >= monthStart)
                    .Sum(r => r.FinalPrice ?? 0)
            };
        }

        public async Task<PagedResponse<DriverRideHistoryResponse>> GetRideHistoryAsync(
            Guid driverId,
            DriverRideHistoryRequest request)
        {
            var query = _context.Rides
                .Where(r => r.DriverId == driverId);

            // Filter by status
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(r => r.Status == request.Status);
            }

            // Filter by date range
            if (request.FromDate.HasValue)
            {
                query = query.Where(r => r.RequestedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                var toDateEnd = request.ToDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(r => r.RequestedAt <= toDateEnd);
            }

            var totalItems = await query.CountAsync();

            var rides = await query
                .OrderByDescending(r => r.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => new
                {
                    Ride = r,
                    Rating = _context.Ratings.FirstOrDefault(rt => rt.RideId == r.Id)
                })
                .ToListAsync();

            var items = rides.Select(r => new DriverRideHistoryResponse
            {
                Id = r.Ride.Id,
                User = new UserBasicInfo
                {
                    Id = r.Ride.UserId,
                    FullName = r.Ride.UserName,
                    PhoneNumber = r.Ride.UserPhone
                },
                PickupAddress = r.Ride.PickupAddress,
                DestinationAddress = r.Ride.DestinationAddress,
                Distance = r.Ride.Distance,
                FinalPrice = r.Ride.FinalPrice ?? r.Ride.EstimatedPrice,
                Status = r.Ride.Status,
                RequestedAt = r.Ride.RequestedAt,
                CompletedAt = r.Ride.CompletedAt,
                Rating = r.Rating != null ? new DriverRatingInfo
                {
                    Rating = r.Rating.Rating,
                    Comment = r.Rating.Comment
                } : null
            }).ToList();

            return new PagedResponse<DriverRideHistoryResponse>
            {
                Items = items,
                TotalItems = totalItems,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        public async Task<VehicleInfoResponse?> GetVehicleAsync(Guid driverId)
        {
            var vehicle = await _context.DriverVehicles
                .Include(dv => dv.VehicleType)
                .FirstOrDefaultAsync(dv => dv.DriverId == driverId && dv.IsActive);

            if (vehicle == null)
            {
                return null;
            }

            return new VehicleInfoResponse
            {
                Id = vehicle.Id,
                VehicleType = new VehicleTypeInfo
                {
                    Id = vehicle.VehicleTypeId,
                    Name = vehicle.VehicleType.Name,
                    BasePrice = vehicle.VehicleType.BasePrice,
                    PricePerKm = vehicle.VehicleType.PricePerKm
                },
                LicensePlate = vehicle.LicensePlate,
                VehicleBrand = vehicle.VehicleBrand,
                VehicleModel = vehicle.VehicleModel,
                VehicleColor = vehicle.VehicleColor,
                IsActive = vehicle.IsActive
            };
        }

        public async Task<VehicleInfoResponse> UpdateVehicleAsync(Guid driverId, UpdateVehicleRequest request)
        {
            // Check if vehicle type exists
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt => vt.Id == request.VehicleTypeId && vt.IsActive);

            if (vehicleType == null)
            {
                throw new KeyNotFoundException("Vehicle type not found");
            }

            // Check if license plate is already used by another driver
            var existingVehicle = await _context.DriverVehicles
                .FirstOrDefaultAsync(dv => dv.LicensePlate == request.LicensePlate && dv.DriverId != driverId);

            if (existingVehicle != null)
            {
                throw new InvalidOperationException("License plate is already registered to another driver");
            }

            // Get or create vehicle
            var vehicle = await _context.DriverVehicles
                .FirstOrDefaultAsync(dv => dv.DriverId == driverId);

            if (vehicle == null)
            {
                vehicle = new DriverVehicle
                {
                    Id = Guid.NewGuid(),
                    DriverId = driverId,
                    VehicleTypeId = request.VehicleTypeId,
                    LicensePlate = request.LicensePlate,
                    VehicleBrand = request.VehicleBrand,
                    VehicleModel = request.VehicleModel,
                    VehicleColor = request.VehicleColor,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.DriverVehicles.Add(vehicle);
            }
            else
            {
                vehicle.VehicleTypeId = request.VehicleTypeId;
                vehicle.LicensePlate = request.LicensePlate;
                vehicle.VehicleBrand = request.VehicleBrand;
                vehicle.VehicleModel = request.VehicleModel;
                vehicle.VehicleColor = request.VehicleColor;
                vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return new VehicleInfoResponse
            {
                Id = vehicle.Id,
                VehicleType = new VehicleTypeInfo
                {
                    Id = vehicleType.Id,
                    Name = vehicleType.Name,
                    BasePrice = vehicleType.BasePrice,
                    PricePerKm = vehicleType.PricePerKm
                },
                LicensePlate = vehicle.LicensePlate,
                VehicleBrand = vehicle.VehicleBrand,
                VehicleModel = vehicle.VehicleModel,
                VehicleColor = vehicle.VehicleColor,
                IsActive = vehicle.IsActive
            };
        }

        #region Helper Methods

        private void ValidateStatusTransition(string currentStatus, string newStatus)
        {
            var validTransitions = new Dictionary<string, string[]>
            {
                [RideStatus.Accepted] = new[] { RideStatus.DriverArriving },
                [RideStatus.DriverArriving] = new[] { RideStatus.DriverArrived },
                [RideStatus.DriverArrived] = new[] { RideStatus.InProgress },
                [RideStatus.InProgress] = new[] { RideStatus.Completed }
            };

            if (!validTransitions.ContainsKey(currentStatus))
            {
                throw new InvalidOperationException($"Invalid current status: {currentStatus}");
            }

            if (!validTransitions[currentStatus].Contains(newStatus))
            {
                throw new InvalidOperationException(
                    $"Cannot transition from {currentStatus} to {newStatus}. " +
                    $"Valid next status: {string.Join(", ", validTransitions[currentStatus])}"
                );
            }
        }

        private double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            // Haversine formula to calculate distance between two coordinates
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
