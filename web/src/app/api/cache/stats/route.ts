import { NextResponse } from 'next/server';
import { redis, redisCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

// This route provides cache statistics for monitoring
export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }
    
    // Get all keys matching our patterns
    const raffleKeys = await redis.keys('raffle:*');
    const tokenKeys = await redis.keys('token:metadata:*');
    const listKey = await redis.exists('raffles:all');
    
    // Categorize raffle keys by checking their TTL
    const permanentRaffles: string[] = [];
    const activeRaffles: string[] = [];
    
    for (const key of raffleKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        // No expiration = permanent (completed raffle)
        permanentRaffles.push(key);
      } else if (ttl > 0) {
        // Has TTL = active raffle
        activeRaffles.push(key);
      }
    }
    
    // Get some sample data to show what's cached
    const samples: any = {};
    if (permanentRaffles.length > 0) {
      const sampleKey = permanentRaffles[0];
      samples.completedRaffle = {
        key: sampleKey,
        data: await redisCache.get(sampleKey),
      };
    }
    if (activeRaffles.length > 0) {
      const sampleKey = activeRaffles[0];
      const ttl = await redis.ttl(sampleKey);
      samples.activeRaffle = {
        key: sampleKey,
        ttl,
        data: await redisCache.get(sampleKey),
      };
    }
    
    const stats = {
      summary: {
        totalRaffles: raffleKeys.length,
        completedRaffles: permanentRaffles.length,
        activeRaffles: activeRaffles.length,
        tokenMetadata: tokenKeys.length,
        hasRafflesList: listKey === 1,
      },
      keys: {
        permanent: permanentRaffles,
        active: activeRaffles,
        tokens: tokenKeys,
      },
      samples,
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
} 