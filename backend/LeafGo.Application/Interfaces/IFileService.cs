namespace LeafGo.Application.Interfaces
{
    public interface IFileService
    {
        Task<string> UploadAvatarAsync(Stream fileStream, string fileName, string contentType);
        Task<bool> DeleteFileAsync(string fileUrl);
        string GetFileUrl(string fileName);
        Task<byte[]?> GetFileAsync(string fileName);
    }
}
