using LeafGo.Application.DTOs.Admin;
using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using LeafGo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly LeafGoDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            LeafGoDbContext context,
            IPasswordHasher passwordHasher,
            ILogger<AdminService> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        #region User Management

        public async Task<PagedResponse<UserManagementResponse>> GetUsersAsync(UserManagementRequest request)
        {
            var query = _context.Users.Where(u => !u.IsDeleted);

            // Filter by role
            if (!string.IsNullOrEmpty(request.Role))
            {
                query = query.Where(u => u.Role == request.Role);
            }

            // Filter by active status
            if (request.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == request.IsActive.Value);
            }

            // Filter by online status
            if (request.IsOnline.HasValue)
            {
                query = query.Where(u => u.IsOnline == request.IsOnline.Value);
            }

            // Search
            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchLower = request.Search.ToLower();
                query = query.Where(u =>
                    u.FullName.ToLower().Contains(searchLower) ||
                    u.Email.ToLower().Contains(searchLower) ||
                    u.PhoneNumber.Contains(searchLower)
                );
            }

            var totalItems = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var items = new List<UserManagementResponse>();

            foreach (var user in users)
            {
                var response = new UserManagementResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    IsActive = user.IsActive,
                    IsOnline = user.IsOnline,
                    CreatedAt = user.CreatedAt
                };

                // Get vehicle info for drivers
                if (user.Role == UserRoles.Driver)
                {
                    var vehicle = await _context.DriverVehicles
                        .Include(dv => dv.VehicleType)
                        .FirstOrDefaultAsync(dv => dv.DriverId == user.Id && dv.IsActive);

                    if (vehicle != null)
                    {
                        response.Vehicle = new VehicleInfo
                        {
                            LicensePlate = vehicle.LicensePlate,
                            VehicleTypeName = vehicle.VehicleType.Name,
                            VehicleBrand = vehicle.VehicleBrand
                        };
                    }
                }

                // Get stats
                var rides = await _context.Rides
                    .Where(r => user.Role == UserRoles.Driver ? r.DriverId == user.Id : r.UserId == user.Id)
                    .Where(r => r.Status == RideStatus.Completed)
                    .ToListAsync();

                response.Stats = new UserStats
                {
                    TotalRides = rides.Count,
                    TotalSpent = user.Role == UserRoles.User ? rides.Sum(r => r.FinalPrice ?? 0) : 0,
                    TotalEarnings = user.Role == UserRoles.Driver ? rides.Sum(r => r.FinalPrice ?? 0) : 0,
                    AverageRating = user.Role == UserRoles.Driver
                        ? await _context.Ratings.Where(r => r.DriverId == user.Id).AverageAsync(r => (double?)r.Rating) ?? 0
                        : 0
                };

                items.Add(response);
            }

            return new PagedResponse<UserManagementResponse>
            {
                Items = items,
                TotalItems = totalItems,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        public async Task<UserManagementResponse> GetUserByIdAsync(Guid userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var response = new UserManagementResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                Avatar = user.Avatar,
                IsActive = user.IsActive,
                IsOnline = user.IsOnline,
                CreatedAt = user.CreatedAt
            };

            if (user.Role == UserRoles.Driver)
            {
                var vehicle = await _context.DriverVehicles
                    .Include(dv => dv.VehicleType)
                    .FirstOrDefaultAsync(dv => dv.DriverId == user.Id && dv.IsActive);

                if (vehicle != null)
                {
                    response.Vehicle = new VehicleInfo
                    {
                        LicensePlate = vehicle.LicensePlate,
                        VehicleTypeName = vehicle.VehicleType.Name,
                        VehicleBrand = vehicle.VehicleBrand
                    };
                }
            }

            var rides = await _context.Rides
                .Where(r => user.Role == UserRoles.Driver ? r.DriverId == user.Id : r.UserId == user.Id)
                .Where(r => r.Status == RideStatus.Completed)
                .ToListAsync();

            response.Stats = new UserStats
            {
                TotalRides = rides.Count,
                TotalSpent = user.Role == UserRoles.User ? rides.Sum(r => r.FinalPrice ?? 0) : 0,
                TotalEarnings = user.Role == UserRoles.Driver ? rides.Sum(r => r.FinalPrice ?? 0) : 0,
                AverageRating = user.Role == UserRoles.Driver
                    ? await _context.Ratings.Where(r => r.DriverId == user.Id).AverageAsync(r => (double?)r.Rating) ?? 0
                    : 0
            };

            return response;
        }

        public async Task<UserManagementResponse> CreateUserAsync(CreateUserRequest request)
        {
            // Check if email exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Role = request.Role,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin created new user: {Email} with role {Role}", request.Email, request.Role);

            return new UserManagementResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                IsOnline = user.IsOnline,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserManagementResponse> UpdateUserAsync(Guid userId, UpdateUserRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetUserByIdAsync(userId);
        }

        public async Task ToggleUserStatusAsync(Guid userId, bool isActive)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;

            // If deactivating, set offline
            if (!isActive)
            {
                user.IsOnline = false;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} status changed to {IsActive}", userId, isActive);
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Soft delete
            user.IsDeleted = true;
            user.IsActive = false;
            user.IsOnline = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} soft deleted", userId);
        }

        #endregion

        #region Ride Management

        public async Task<PagedResponse<RideManagementResponse>> GetRidesAsync(RideManagementRequest request)
        {
            var query = _context.Rides.AsQueryable();

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

            // Filter by user
            if (request.UserId.HasValue)
            {
                query = query.Where(r => r.UserId == request.UserId.Value);
            }

            // Filter by driver
            if (request.DriverId.HasValue)
            {
                query = query.Where(r => r.DriverId == request.DriverId.Value);
            }

            var totalItems = await query.CountAsync();

            var rides = await query
                .OrderByDescending(r => r.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => new
                {
                    Ride = r,
                    User = _context.Users.FirstOrDefault(u => u.Id == r.UserId),
                    Driver = r.DriverId != null ? _context.Users.FirstOrDefault(u => u.Id == r.DriverId) : null,
                    DriverVehicle = r.DriverId != null
                        ? _context.DriverVehicles.FirstOrDefault(dv => dv.DriverId == r.DriverId && dv.IsActive)
                        : null,
                    Rating = _context.Ratings.FirstOrDefault(rt => rt.RideId == r.Id)
                })
                .ToListAsync();

            var items = rides.Select(r => new RideManagementResponse
            {
                Id = r.Ride.Id,
                User = new UserInfo
                {
                    Id = r.User!.Id,
                    FullName = r.User.FullName,
                    PhoneNumber = r.User.PhoneNumber,
                    Email = r.User.Email
                },
                Driver = r.Driver != null ? new DriverInfo
                {
                    Id = r.Driver.Id,
                    FullName = r.Driver.FullName,
                    PhoneNumber = r.Driver.PhoneNumber,
                    LicensePlate = r.DriverVehicle?.LicensePlate
                } : null,
                PickupAddress = r.Ride.PickupAddress,
                DestinationAddress = r.Ride.DestinationAddress,
                Distance = r.Ride.Distance,
                EstimatedPrice = r.Ride.EstimatedPrice,
                FinalPrice = r.Ride.FinalPrice,
                Status = r.Ride.Status,
                RequestedAt = r.Ride.RequestedAt,
                AcceptedAt = r.Ride.AcceptedAt,
                CompletedAt = r.Ride.CompletedAt,
                CancelledAt = r.Ride.CancelledAt,
                CancellationReason = r.Ride.CancellationReason,
                CancelledBy = r.Ride.CancelledBy,
                Rating = r.Rating != null ? new RatingInfo
                {
                    Rating = r.Rating.Rating,
                    Comment = r.Rating.Comment
                } : null
            }).ToList();

            return new PagedResponse<RideManagementResponse>
            {
                Items = items,
                TotalItems = totalItems,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        public async Task<RideManagementResponse> GetRideByIdAsync(Guid rideId)
        {
            var ride = await _context.Rides
                .Include(r => r.User)
                .Include(r => r.Driver)
                .Include(r => r.Rating)
                .FirstOrDefaultAsync(r => r.Id == rideId);

            if (ride == null)
            {
                throw new KeyNotFoundException("Ride not found");
            }

            DriverVehicle? vehicle = null;
            if (ride.DriverId != null)
            {
                vehicle = await _context.DriverVehicles
                    .FirstOrDefaultAsync(dv => dv.DriverId == ride.DriverId && dv.IsActive);
            }

            return new RideManagementResponse
            {
                Id = ride.Id,
                User = new UserInfo
                {
                    Id = ride.User.Id,
                    FullName = ride.User.FullName,
                    PhoneNumber = ride.User.PhoneNumber,
                    Email = ride.User.Email
                },
                Driver = ride.Driver != null ? new DriverInfo
                {
                    Id = ride.Driver.Id,
                    FullName = ride.Driver.FullName,
                    PhoneNumber = ride.Driver.PhoneNumber,
                    LicensePlate = vehicle?.LicensePlate
                } : null,
                PickupAddress = ride.PickupAddress,
                DestinationAddress = ride.DestinationAddress,
                Distance = ride.Distance,
                EstimatedPrice = ride.EstimatedPrice,
                FinalPrice = ride.FinalPrice,
                Status = ride.Status,
                RequestedAt = ride.RequestedAt,
                AcceptedAt = ride.AcceptedAt,
                CompletedAt = ride.CompletedAt,
                CancelledAt = ride.CancelledAt,
                CancellationReason = ride.CancellationReason,
                CancelledBy = ride.CancelledBy,
                Rating = ride.Rating != null ? new RatingInfo
                {
                    Rating = ride.Rating.Rating,
                    Comment = ride.Rating.Comment
                } : null
            };
        }

        #endregion

        #region Statistics

        public async Task<SystemStatisticsResponse> GetSystemStatisticsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var twelveMonthsAgo = today.AddMonths(-12);

            // 1. Lấy thống kê cơ bản 
            var totalUsers = await _context.Users.CountAsync(u => u.Role == UserRoles.User && !u.IsDeleted && u.IsActive);
            var totalDrivers = await _context.Users.CountAsync(u => u.Role == UserRoles.Driver && !u.IsDeleted && u.IsActive);
            var onlineDrivers = await _context.Users.CountAsync(u => u.Role == UserRoles.Driver && u.IsOnline && !u.IsDeleted);

            var rideStats = await _context.Rides
                .Select(r => new { r.Status, r.RequestedAt, r.CompletedAt, r.FinalPrice })
                .ToListAsync(); // Nếu dữ liệu quá lớn, không nên ToList ở đây. Hãy dùng GroupBy dưới DB.

            var response = new SystemStatisticsResponse
            {
                TotalUsers = totalUsers,
                TotalDrivers = totalDrivers,
                OnlineDrivers = onlineDrivers,

                TotalCompletedRides = await _context.Rides.CountAsync(r => r.Status == RideStatus.Completed),
                TotalPendingRides = await _context.Rides.CountAsync(r => r.Status == RideStatus.Pending),

                // Sửa lỗi .Date bằng cách so sánh khoảng
                TodayRides = await _context.Rides.CountAsync(r => r.RequestedAt >= today && r.RequestedAt < tomorrow),

                TotalRevenue = await _context.Rides
                    .Where(r => r.Status == RideStatus.Completed)
                    .SumAsync(r => r.FinalPrice ?? 0),

                TodayRevenue = await _context.Rides
                    .Where(r => r.Status == RideStatus.Completed && r.CompletedAt >= today && r.CompletedAt < tomorrow)
                    .SumAsync(r => r.FinalPrice ?? 0),

                ThisMonthRevenue = await _context.Rides
                    .Where(r => r.Status == RideStatus.Completed && r.CompletedAt >= monthStart)
                    .SumAsync(r => r.FinalPrice ?? 0)
            };

            // 2. Refactor Top Drivers: Thực hiện OrderBy và Take TRƯỚC khi ToList
            response.TopDrivers = await _context.Users
                .Where(u => u.Role == UserRoles.Driver && !u.IsDeleted)
                .Select(d => new
                {
                    d.Id,
                    d.FullName,
                    d.Avatar,
                    // Tính toán trực tiếp để EF dịch sang SQL (Subqueries)
                    TotalRides = _context.Rides.Count(r => r.DriverId == d.Id && r.Status == RideStatus.Completed),
                    TotalEarnings = _context.Rides
                        .Where(r => r.DriverId == d.Id && r.Status == RideStatus.Completed)
                        .Sum(r => r.FinalPrice ?? 0),
                    AverageRating = _context.Ratings
                        .Where(rat => rat.DriverId == d.Id)
                        .Average(rat => (double?)rat.Rating) ?? 0
                })
                .OrderByDescending(x => x.TotalEarnings)
                .Take(10)
                .Select(x => new TopDriverResponse
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Avatar = x.Avatar,
                    TotalRides = x.TotalRides,
                    TotalEarnings = x.TotalEarnings,
                    AverageRating = x.AverageRating
                })
                .ToListAsync();

            // 3. Revenue by month 
            var revenueDataRaw = await _context.Rides
                .Where(r => r.Status == RideStatus.Completed && r.CompletedAt >= twelveMonthsAgo)
                .GroupBy(r => new { r.CompletedAt!.Value.Year, r.CompletedAt!.Value.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(r => r.FinalPrice ?? 0),
                    TotalRides = g.Count()
                })
                .OrderBy(r => r.Year)
                .ThenBy(r => r.Month)
                .ToListAsync();

            // Chuyển đổi sang List<RevenueByMonthResponse> sau khi đã tải dữ liệu về RAM
            response.RevenueByMonth = revenueDataRaw.Select(r => new RevenueByMonthResponse
            {
                Month = $"{r.Year}-{r.Month:D2}", // Format "2023-01"
                Revenue = r.Revenue,
                TotalRides = r.TotalRides
            }).ToList();

            // 4. Rides by status
            response.RidesByStatus = await _context.Rides
                .GroupBy(r => r.Status)
                .Select(g => new RidesByStatusResponse
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return response;
        }

        #endregion

        #region Vehicle Type Management

        public async Task<List<VehicleTypeResponse>> GetVehicleTypesAsync()
        {
            var vehicleTypes = await _context.VehicleTypes
                .OrderBy(vt => vt.Name)
                .ToListAsync();

            var result = new List<VehicleTypeResponse>();

            foreach (var vt in vehicleTypes)
            {
                var totalDrivers = await _context.DriverVehicles
                    .CountAsync(dv => dv.VehicleTypeId == vt.Id && dv.IsActive);

                var totalRides = await _context.Rides
                    .CountAsync(r => r.VehicleTypeId == vt.Id);

                result.Add(new VehicleTypeResponse
                {
                    Id = vt.Id,
                    Name = vt.Name,
                    BasePrice = vt.BasePrice,
                    PricePerKm = vt.PricePerKm,
                    Description = vt.Description,
                    IsActive = vt.IsActive,
                    TotalDrivers = totalDrivers,
                    TotalRides = totalRides
                });
            }

            return result;
        }

        public async Task<VehicleTypeResponse> GetVehicleTypeByIdAsync(Guid vehicleTypeId)
        {
            var vt = await _context.VehicleTypes
                .FirstOrDefaultAsync(v => v.Id == vehicleTypeId);

            if (vt == null)
            {
                throw new KeyNotFoundException("Vehicle type not found");
            }

            return new VehicleTypeResponse
            {
                Id = vt.Id,
                Name = vt.Name,
                BasePrice = vt.BasePrice,
                PricePerKm = vt.PricePerKm,
                Description = vt.Description,
                IsActive = vt.IsActive,
                TotalDrivers = await _context.DriverVehicles.CountAsync(dv => dv.VehicleTypeId == vt.Id && dv.IsActive),
                TotalRides = await _context.Rides.CountAsync(r => r.VehicleTypeId == vt.Id)
            };
        }

        public async Task<VehicleTypeResponse> CreateVehicleTypeAsync(CreateVehicleTypeRequest request)
        {
            var vehicleType = new VehicleType
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                BasePrice = request.BasePrice,
                PricePerKm = request.PricePerKm,
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.VehicleTypes.Add(vehicleType);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Vehicle type created: {Name}", request.Name);

            return new VehicleTypeResponse
            {
                Id = vehicleType.Id,
                Name = vehicleType.Name,
                BasePrice = vehicleType.BasePrice,
                PricePerKm = vehicleType.PricePerKm,
                Description = vehicleType.Description,
                IsActive = vehicleType.IsActive,
                TotalDrivers = 0,
                TotalRides = 0
            };
        }

        public async Task<VehicleTypeResponse> UpdateVehicleTypeAsync(Guid vehicleTypeId, UpdateVehicleTypeRequest request)
        {
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt => vt.Id == vehicleTypeId);

            if (vehicleType == null)
            {
                throw new KeyNotFoundException("Vehicle type not found");
            }

            vehicleType.Name = request.Name;
            vehicleType.BasePrice = request.BasePrice;
            vehicleType.PricePerKm = request.PricePerKm;
            vehicleType.Description = request.Description;
            vehicleType.IsActive = request.IsActive;
            vehicleType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetVehicleTypeByIdAsync(vehicleTypeId);
        }

        public async Task DeleteVehicleTypeAsync(Guid vehicleTypeId)
        {
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt => vt.Id == vehicleTypeId);

            if (vehicleType == null)
            {
                throw new KeyNotFoundException("Vehicle type not found");
            }

            // Check if any drivers are using this vehicle type
            var hasDrivers = await _context.DriverVehicles
                .AnyAsync(dv => dv.VehicleTypeId == vehicleTypeId && dv.IsActive);

            if (hasDrivers)
            {
                throw new InvalidOperationException("Cannot delete vehicle type. It is currently being used by drivers");
            }

            _context.VehicleTypes.Remove(vehicleType);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Vehicle type deleted: {VehicleTypeId}", vehicleTypeId);
        }

        #endregion
    }
}
