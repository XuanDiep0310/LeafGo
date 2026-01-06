using LeafGo.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;

namespace LeafGo.Infrastructure.Services
{
    public class LocalFileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LocalFileService> _logger;
        private readonly string _uploadPath;
        private readonly string _avatarFolder = "avatars";
        private readonly long _maxFileSize = 5 * 1024 * 1024; // 5MB
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        public LocalFileService(
            IWebHostEnvironment environment,
            IConfiguration configuration,
            ILogger<LocalFileService> logger)
        {
            _environment = environment;
            _configuration = configuration;
            _logger = logger;

            // Get upload path from config or use default
            _uploadPath = _configuration["FileUpload:Path"] ?? Path.Combine(_environment.WebRootPath, "uploads");

            // Ensure upload directory exists
            EnsureDirectoryExists();
        }

        public async Task<string> UploadAvatarAsync(Stream fileStream, string fileName, string contentType)
        {
            try
            {
                // Validate file size
                if (fileStream.Length > _maxFileSize)
                {
                    throw new InvalidOperationException($"File size exceeds maximum allowed size of {_maxFileSize / 1024 / 1024}MB");
                }

                // Validate file extension
                var extension = Path.GetExtension(fileName).ToLowerInvariant();
                if (!_allowedExtensions.Contains(extension))
                {
                    throw new InvalidOperationException($"File type {extension} is not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var avatarPath = Path.Combine(_uploadPath, _avatarFolder);

                // Ensure avatar directory exists
                if (!Directory.Exists(avatarPath))
                {
                    Directory.CreateDirectory(avatarPath);
                }

                var filePath = Path.Combine(avatarPath, uniqueFileName);

                // Save file
                using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
                {
                    await fileStream.CopyToAsync(fileStreamOutput);
                }

                _logger.LogInformation("File uploaded successfully: {FileName}", uniqueFileName);

                // Return relative URL
                return $"/uploads/{_avatarFolder}/{uniqueFileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file: {FileName}", fileName);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(fileUrl))
                    return false;

                // Extract filename from URL
                var fileName = Path.GetFileName(fileUrl);
                var filePath = Path.Combine(_uploadPath, _avatarFolder, fileName);

                if (File.Exists(filePath))
                {
                    await Task.Run(() => File.Delete(filePath));
                    _logger.LogInformation("File deleted successfully: {FileName}", fileName);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FileUrl}", fileUrl);
                return false;
            }
        }

        public string GetFileUrl(string fileName)
        {
            return $"/uploads/{_avatarFolder}/{fileName}";
        }

        public async Task<byte[]?> GetFileAsync(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_uploadPath, _avatarFolder, fileName);

                if (!File.Exists(filePath))
                    return null;

                return await File.ReadAllBytesAsync(filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading file: {FileName}", fileName);
                return null;
            }
        }

        private void EnsureDirectoryExists()
        {
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
                _logger.LogInformation("Created upload directory: {Path}", _uploadPath);
            }

            var avatarPath = Path.Combine(_uploadPath, _avatarFolder);
            if (!Directory.Exists(avatarPath))
            {
                Directory.CreateDirectory(avatarPath);
                _logger.LogInformation("Created avatar directory: {Path}", avatarPath);
            }
        }
    }
}
