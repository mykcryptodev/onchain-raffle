import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = process.env.UPSTASH_URL && process.env.UPSTASH_TOKEN;

if (!isRedisConfigured) {
  console.warn('Redis not configured: Missing UPSTASH_URL or UPSTASH_TOKEN');
}

// Initialize Redis client only if configured
export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_URL!,
      token: process.env.UPSTASH_TOKEN!,
    })
  : null;

// Helper functions for common operations
export const redisCache = {
  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache get');
      return null;
    }
    
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Redis get error:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });
      }
      return null;
    }
  },

  // Set data in cache with TTL (in seconds)
  // If no TTL is provided, data is stored permanently
  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache set');
      return;
    }
    
    try {
      if (ttlSeconds) {
        await redis.set(key, JSON.stringify(data), {
          ex: ttlSeconds,
        });
      } else {
        // Store permanently (no expiration)
        await redis.set(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  // Delete data from cache
  async del(key: string): Promise<void> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache delete');
      return;
    }
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache exists check');
      return false;
    }
    
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  // Set multiple keys at once (for batch operations)
  async mset(data: Record<string, any>, ttlSeconds?: number): Promise<void> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache mset');
      return;
    }
    
    try {
      const pipeline = redis.pipeline();
      Object.entries(data).forEach(([key, value]) => {
        if (ttlSeconds) {
          pipeline.set(key, JSON.stringify(value), {
            ex: ttlSeconds,
          });
        } else {
          pipeline.set(key, JSON.stringify(value));
        }
      });
      await pipeline.exec();
    } catch (error) {
      console.error('Redis mset error:', error);
    }
  },

  // Get multiple keys at once
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache mget');
      return keys.map(() => null);
    }
    
    try {
      const results = await redis.mget(...keys);
      return results.map(result => result ? JSON.parse(result as string) as T : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  },

  // Invalidate cache by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache invalidation');
      return;
    }
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  },
};

// Export a function to check if Redis is available
export function isRedisAvailable(): boolean {
  return !!isRedisConfigured;
} 