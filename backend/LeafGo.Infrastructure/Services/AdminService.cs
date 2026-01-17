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
    }
}
