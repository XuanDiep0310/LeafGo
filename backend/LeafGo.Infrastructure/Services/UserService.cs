using LeafGo.Application.DTOs.User;
using LeafGo.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace LeafGo.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly LeafGoDbContext _context;
        private readonly IFileService _fileService;

        public UserService(LeafGoDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<UserProfileResponse> GetProfileAsync(Guid userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            return new UserProfileResponse
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
        }

        public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Update fields
            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            // Don't update avatar here - use separate upload endpoint
            await _context.SaveChangesAsync();

            return new UserProfileResponse
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
        }

        public async Task<UploadAvatarResponse> UploadAvatarAsync(Guid userId, IFormFile file)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Delete old avatar if exists
            if (!string.IsNullOrEmpty(user.Avatar))
            {
                await _fileService.DeleteFileAsync(user.Avatar);
            }

            // Upload new avatar
            using var stream = file.OpenReadStream();
            var avatarUrl = await _fileService.UploadAvatarAsync(stream, file.FileName, file.ContentType);

            // Update user avatar
            user.Avatar = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new UploadAvatarResponse
            {
                AvatarUrl = avatarUrl
            };
        }

        public async Task<PagedResponse<RideHistoryResponse>> GetRideHistoryAsync(
    Guid userId,
    RideHistoryRequest request)
        {
            // 1. Khởi tạo query từ bảng Rides
            var query = _context.Rides.AsNoTracking() // Dùng AsNoTracking để tăng tốc độ đọc
                .Where(r => r.UserId == userId);

            // 2. Áp dụng các bộ lọc linh hoạt
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(r => r.Status == request.Status);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(r => r.RequestedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                // Tối ưu hóa: Kết thúc ngày tại 23:59:59.999
                var toDateEnd = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(r => r.RequestedAt <= toDateEnd);
            }

            // 3. Đếm tổng số lượng (trước khi phân trang)
            var totalItems = await query.CountAsync();

            // 4. Phân trang và Mapping trực tiếp sang DTO (Projection)
            // Việc Select trực tiếp giúp EF chỉ lấy những cột cần thiết thay vì lấy toàn bộ bảng
            var items = await query
                .OrderByDescending(r => r.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => new RideHistoryResponse
                {
                    Id = r.Id,
                    PickupAddress = r.PickupAddress,
                    DestinationAddress = r.DestinationAddress,
                    Distance = r.Distance,
                    FinalPrice = r.FinalPrice ?? r.EstimatedPrice,
                    Status = r.Status,
                    RequestedAt = r.RequestedAt,
                    CompletedAt = r.CompletedAt,

                    // Mapping Driver từ Navigation Property
                    Driver = r.Driver != null ? new DriverInfoDto
                    {
                        Id = r.Driver.Id,
                        FullName = r.Driver.FullName,
                        PhoneNumber = r.Driver.PhoneNumber,
                        Avatar = r.Driver.Avatar,
                        // Lấy thông tin xe đang hoạt động của tài xế
                        Vehicle = _context.DriverVehicles
                            .Where(dv => dv.DriverId == r.DriverId && dv.IsActive)
                            .Select(dv => new VehicleInfoDto
                            {
                                LicensePlate = dv.LicensePlate,
                                VehicleBrand = dv.VehicleBrand,
                                VehicleModel = dv.VehicleModel,
                                VehicleColor = dv.VehicleColor,
                                VehicleTypeName = dv.VehicleType.Name
                            }).FirstOrDefault()
                    } : null,

                    // Mapping Rating từ Navigation Property
                    Rating = r.Rating != null ? new RatingDto
                    {
                        Rating = r.Rating.Rating,
                        Comment = r.Rating.Comment
                    } : null
                })
                .ToListAsync();

            return new PagedResponse<RideHistoryResponse>
            {
                Items = items,
                TotalItems = totalItems,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}
