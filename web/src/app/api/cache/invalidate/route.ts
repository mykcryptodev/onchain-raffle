import { NextResponse } from 'next/server';
import { redisCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

// This route can be called to invalidate cache when needed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pattern, keys } = body;

    if (pattern) {
      // Invalidate by pattern (e.g., "raffles:*")
      await redisCache.invalidatePattern(pattern);
      console.log(`Invalidated cache pattern: ${pattern}`);
      return NextResponse.json({ success: true, pattern });
    }

    if (keys && Array.isArray(keys)) {
      // Invalidate specific keys
      for (const key of keys) {
        await redisCache.del(key);
      }
      console.log(`Invalidated cache keys: ${keys.join(', ')}`);
      return NextResponse.json({ success: true, keys });
    }

    // Default: only invalidate the raffles list cache
    // Individual raffle caches are either:
    // - Permanent (if completed/prizeDistributed)
    // - Will expire naturally with TTL (if active)
    await redisCache.del('raffles:all');
    
    // Also invalidate token metadata cache as it might be stale
    await redisCache.invalidatePattern('token:metadata:*');
    
    console.log('Invalidated raffles list and token metadata cache');
    return NextResponse.json({ success: true, message: 'Raffles list cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 });
  }
} 