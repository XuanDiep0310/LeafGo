namespace LeafGo.Application.Interfaces
{
    public interface IRedisService
    {
        // Key-Value operations
        Task<T?> GetAsync<T>(string key);
        Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null);
        Task<bool> DeleteAsync(string key);
        Task<bool> ExistsAsync(string key);

        // List operations
        Task<bool> AddToListAsync<T>(string key, T value);
        Task<List<T>> GetListAsync<T>(string key);
        Task<bool> RemoveFromListAsync<T>(string key, T value);

        // Set operations
        Task<bool> AddToSetAsync(string key, string value);
        Task<bool> RemoveFromSetAsync(string key, string value);
        Task<List<string>> GetSetMembersAsync(string key);

        // Geospatial operations
        Task<bool> GeoAddAsync(string key, double longitude, double latitude, string member);
        Task<List<string>> GeoRadiusAsync(string key, double longitude, double latitude, double radiusKm);
        Task<bool> GeoRemoveAsync(string key, string member);

        // Lock operations (for race conditions)
        Task<bool> AcquireLockAsync(string key, string value, TimeSpan expiry);
        Task<bool> ReleaseLockAsync(string key, string value);
    }
}
