using LeafGo.Application.DTOs.User;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileResponse> GetProfileAsync(Guid userId);
        Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<UploadAvatarResponse> UploadAvatarAsync(Guid userId, IFormFile file);
        Task<PagedResponse<RideHistoryResponse>> GetRideHistoryAsync(Guid userId, RideHistoryRequest request);
    }
}
