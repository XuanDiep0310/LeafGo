using LeafGo.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace LeafGo.Infrastructure.Services
{
    public class RedisService : IRedisService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly StackExchange.Redis.IDatabase _db;
        private readonly ILogger<RedisService> _logger;

        public RedisService(
            IConnectionMultiplexer redis,
            ILogger<RedisService> logger)
        {
            _redis = redis;
            _db = redis.GetDatabase();
            _logger = logger;
        }

        #region Key-Value Operations

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var value = await _db.StringGetAsync(key);

                if (!value.HasValue)
                    return default;

                return JsonSerializer.Deserialize<T>(value!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting key {Key} from Redis", key);
                return default;
            }
        }

        public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            try
            {
                var serialized = JsonSerializer.Serialize(value);
                return await _db.StringSetAsync(key, serialized, expiry ?? TimeSpan.FromMinutes(30));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting key {Key} in Redis", key);
                return false;
            }
        }

        public async Task<bool> DeleteAsync(string key)
        {
            try
            {
                return await _db.KeyDeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting key {Key} from Redis", key);
                return false;
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                return await _db.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking existence of key {Key} in Redis", key);
                return false;
            }
        }

        #endregion

        #region List Operations

        public async Task<bool> AddToListAsync<T>(string key, T value)
        {
            try
            {
                var serialized = JsonSerializer.Serialize(value);
                await _db.ListRightPushAsync(key, serialized);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding to list {Key} in Redis", key);
                return false;
            }
        }

        public async Task<List<T>> GetListAsync<T>(string key)
        {
            try
            {
                var values = await _db.ListRangeAsync(key);
                var result = new List<T>();

                foreach (var value in values)
                {
                    if (value.HasValue)
                    {
                        var deserialized = JsonSerializer.Deserialize<T>(value!);
                        if (deserialized != null)
                            result.Add(deserialized);
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting list {Key} from Redis", key);
                return new List<T>();
            }
        }

        public async Task<bool> RemoveFromListAsync<T>(string key, T value)
        {
            try
            {
                var serialized = JsonSerializer.Serialize(value);
                await _db.ListRemoveAsync(key, serialized);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing from list {Key} in Redis", key);
                return false;
            }
        }

        #endregion

        #region Set Operations

        public async Task<bool> AddToSetAsync(string key, string value)
        {
            try
            {
                return await _db.SetAddAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding to set {Key} in Redis", key);
                return false;
            }
        }

        public async Task<bool> RemoveFromSetAsync(string key, string value)
        {
            try
            {
                return await _db.SetRemoveAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing from set {Key} in Redis", key);
                return false;
            }
        }

        public async Task<List<string>> GetSetMembersAsync(string key)
        {
            try
            {
                var members = await _db.SetMembersAsync(key);
                return members.Select(m => m.ToString()).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting set members {Key} from Redis", key);
                return new List<string>();
            }
        }

        #endregion

        #region Geospatial Operations

        public async Task<bool> GeoAddAsync(string key, double longitude, double latitude, string member)
        {
            try
            {
                var result = await _db.GeoAddAsync(key, longitude, latitude, member);
                return result == true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding geo location for {Member} to {Key}", member, key);
                return false;
            }
        }

        public async Task<List<string>> GeoRadiusAsync(
            string key,
            double longitude,
            double latitude,
            double radiusKm)
        {
            try
            {
                var results = await _db.GeoRadiusAsync(
                    key,
                    longitude,
                    latitude,
                    radiusKm,
                    GeoUnit.Kilometers,
                    order: Order.Ascending
                );

                return results.Select(r => r.Member.ToString()).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting geo radius from {Key}", key);
                return new List<string>();
            }
        }

        public async Task<bool> GeoRemoveAsync(string key, string member)
        {
            try
            {
                return await _db.GeoRemoveAsync(key, member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing geo member {Member} from {Key}", member, key);
                return false;
            }
        }

        #endregion

        #region Lock Operations

        public async Task<bool> AcquireLockAsync(string key, string value, TimeSpan expiry)
        {
            try
            {
                return await _db.StringSetAsync(key, value, expiry, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acquiring lock {Key}", key);
                return false;
            }
        }

        public async Task<bool> ReleaseLockAsync(string key, string value)
        {
            try
            {
                var script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end";

                var result = await _db.ScriptEvaluateAsync(
                    script,
                    new RedisKey[] { key },
                    new RedisValue[] { value }
                );

                return (int)result == 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error releasing lock {Key}", key);
                return false;
            }
        }

        #endregion
    }
}
