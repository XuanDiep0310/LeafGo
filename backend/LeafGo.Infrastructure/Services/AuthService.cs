﻿using LeafGo.Application.DTOs.Auth;
using LeafGo.Application.Interfaces;
using LeafGo.Domain.Constants;
using LeafGo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LeafGo.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly LeafGoDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IEmailService _emailService;

        public AuthService(
            LeafGoDbContext context,
            IJwtService jwtService,
            IPasswordHasher passwordHasher,
            IEmailService emailService)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress)
        {
            // Check if email already exists
            var existingUser = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Validate role
            if (request.Role != UserRoles.User && request.Role != UserRoles.Driver)
            {
                throw new InvalidOperationException("Invalid role. Must be User or Driver");
            }

            // Create new user
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

            _context.Set<User>().Add(user);
            await _context.SaveChangesAsync();

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token
            await SaveRefreshTokenAsync(user.Id, refreshToken, ipAddress);

            // Send welcome email (fire and forget)
            _ = _emailService.SendWelcomeEmailAsync(user.Email, user.FullName);

            return new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsOnline = user.IsOnline
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress)
        {
            // Find user by email
            var user = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Verify password
            if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Check if account is active
            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Account is locked. Please contact administrator");
            }

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token
            await SaveRefreshTokenAsync(user.Id, refreshToken, ipAddress);

            return new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsOnline = user.IsOnline
            };
        }

        public async Task<RefreshTokenResponse> RefreshTokenAsync(string token, string? ipAddress)
        {
            var refreshToken = await _context.Set<RefreshToken>()
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            if (!refreshToken.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token");
            }

            // Check if user is still active
            if (!refreshToken.User.IsActive || refreshToken.User.IsDeleted)
            {
                throw new UnauthorizedAccessException("User account is not active");
            }

            // Generate new tokens
            var newAccessToken = _jwtService.GenerateAccessToken(refreshToken.User);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Revoke old token and save new one
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            refreshToken.ReplacedByToken = newRefreshToken;

            await SaveRefreshTokenAsync(refreshToken.UserId, newRefreshToken, ipAddress);
            await _context.SaveChangesAsync();

            return new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };
        }

        public async Task RevokeTokenAsync(string token, string? ipAddress)
        {
            var refreshToken = await _context.Set<RefreshToken>()
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null || !refreshToken.IsActive)
            {
                throw new InvalidOperationException("Invalid refresh token");
            }

            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            await _context.SaveChangesAsync();
        }

        public async Task RevokeAllTokensAsync(Guid userId, string? ipAddress)
        {
            var activeTokens = await _context.Set<RefreshToken>()
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = ipAddress;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<ActiveTokenResponse>> GetActiveTokensAsync(Guid userId)
        {
            var tokens = await _context.Set<RefreshToken>()
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(rt => rt.CreatedAt)
                .Select(rt => new ActiveTokenResponse
                {
                    Id = rt.Id,
                    CreatedAt = rt.CreatedAt,
                    ExpiresAt = rt.ExpiresAt,
                    CreatedByIp = rt.CreatedByIp,
                    IsActive = rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow
                })
                .ToListAsync();

            return tokens;
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Verify current password
            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Current password is incorrect");
            }

            // Update password
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

            // Don't reveal if user exists or not
            if (user == null)
            {
                return;
            }

            // Generate reset token (simple GUID for now, could use more secure method)
            var resetToken = Guid.NewGuid().ToString("N");
            user.ResetPasswordToken = _passwordHasher.HashPassword(resetToken); // Hash the token
            user.ResetPasswordExpiry = DateTime.UtcNow.AddHours(1); // 1 hour expiry
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send reset email
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken);
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            // Find user with valid reset token
            var users = await _context.Set<User>()
                .Where(u => !u.IsDeleted
                    && u.ResetPasswordToken != null
                    && u.ResetPasswordExpiry > DateTime.UtcNow)
                .ToListAsync();

            User? user = null;
            foreach (var u in users)
            {
                if (_passwordHasher.VerifyPassword(request.Token, u.ResetPasswordToken!))
                {
                    user = u;
                    break;
                }
            }

            if (user == null)
            {
                throw new InvalidOperationException("Invalid or expired reset token");
            }

            // Update password and clear reset token
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.ResetPasswordToken = null;
            user.ResetPasswordExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task SaveRefreshTokenAsync(Guid userId, string token, string? ipAddress)
        {
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = ipAddress
            };

            _context.Set<RefreshToken>().Add(refreshToken);
            await _context.SaveChangesAsync();
        }
    }
}