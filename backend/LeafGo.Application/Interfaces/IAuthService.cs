using LeafGo.Application.DTOs.Auth;

namespace LeafGo.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress);
        Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress);
        Task<RefreshTokenResponse> RefreshTokenAsync(string token, string? ipAddress);
        Task RevokeTokenAsync(string token, string? ipAddress);
        Task RevokeAllTokensAsync(Guid userId, string? ipAddress);
        Task<IEnumerable<ActiveTokenResponse>> GetActiveTokensAsync(Guid userId);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
        Task ForgotPasswordAsync(ForgotPasswordRequest request);
        Task ResetPasswordAsync(ResetPasswordRequest request);
    }
}
