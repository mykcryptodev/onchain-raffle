import { NextResponse } from 'next/server';
import { owner, token, winner, prizeDistributed, lastRequestId } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { getContract } from "thirdweb";
import { redisCache, redis } from "@/lib/redis";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";

export const dynamic = 'force-dynamic';

const ACTIVE_RAFFLE_TTL = 60; // 60 seconds for active raffles
const RATE_LIMIT_TTL = 2; // 2 seconds rate limit window
const DEDUP_TTL = 5; // 5 seconds for deduplication

interface Params {
  params: Promise<{
    address: string;
  }>;
}

interface RaffleData {
  raffleAddress: string;
  raffleOwner: string;
  raffleToken: string;
  raffleWinner: string;
  prizeDistributed: boolean;
  lastRequestId: bigint | string; // bigint when fresh, string when cached/serialized
  tokenDecimals: number;
  balance: string;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { address } = await params;
    const cacheKey = `raffle:${address}`;
    const rateLimitKey = `ratelimit:raffle:${address}`;
    const dedupKey = `dedup:raffle:${address}`;
    
    // Check rate limit in Redis
    if (redis) {
      const isRateLimited = await redis.exists(rateLimitKey);
      if (isRateLimited) {
        console.log(`Rate limiting request for raffle ${address}`);
        // Try to return from cache if available
        const cached = await redisCache.get(cacheKey) as RaffleData | null;
        if (cached) {
          return NextResponse.json({ 
            raffle: {
              ...cached,
              lastRequestId: cached.lastRequestId?.toString() || "0",
            }, 
            cached: true,
            rateLimited: true 
          });
        }
        // If no cache, return 429 Too Many Requests
        return NextResponse.json(
          { error: 'Too many requests, please try again later' },
          { status: 429 }
        );
      }
    }
    
    // Always try Redis cache first
    const cached = await redisCache.get(cacheKey) as RaffleData | null;
    if (cached) {
      console.log(`Returning raffle ${address} from Redis cache`);
      // Keep lastRequestId as string for JSON serialization
      return NextResponse.json({ 
        raffle: {
          ...cached,
          lastRequestId: cached.lastRequestId?.toString() || "0", // Handle undefined and ensure string
        }, 
        cached: true 
      });
    }

    // Check if another request is already fetching this raffle
    if (redis) {
      const isFetching = await redis.exists(dedupKey);
      if (isFetching) {
        console.log(`Another request is already fetching raffle ${address}, waiting...`);
        // Wait a bit and try to get from cache
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try up to 20 times (2 seconds total)
        for (let i = 0; i < 20; i++) {
          const cached = await redisCache.get(cacheKey) as RaffleData | null;
          if (cached) {
            return NextResponse.json({ 
              raffle: {
                ...cached,
                lastRequestId: cached.lastRequestId?.toString() || "0",
              }, 
              cached: true,
              deduplicated: true
            });
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Mark that we're fetching this raffle
      await redis.set(dedupKey, "1", { ex: DEDUP_TTL });
    }

    // Set rate limit for this address
    if (redis) {
      await redis.set(rateLimitKey, "1", { ex: RATE_LIMIT_TTL });
    }

    try {
      console.log(`Fetching raffle ${address} from blockchain...`);
      
      const raffleContract = getContract({
        chain,
        address: address as `0x${string}`,
        client,
      });

      const [raffleOwner, raffleToken, raffleWinner, rafflePrizeDistributed, raffleLastRequestId] = await Promise.all([
        owner({ contract: raffleContract }),
        token({ contract: raffleContract }),
        winner({ contract: raffleContract }),
        prizeDistributed({ contract: raffleContract }),
        lastRequestId({ contract: raffleContract }),
      ]);

      // Get token contract for additional data
      const tokenContract = getContract({
        chain,
        address: raffleToken,
        client,
      });

      const [tokenDecimals, raffleBalance] = await Promise.all([
        decimals({ contract: tokenContract }),
        balanceOf({ 
          contract: tokenContract,
          address: address as `0x${string}`,
        }),
      ]);

      const raffle: RaffleData = {
        raffleAddress: address,
        raffleOwner,
        raffleToken,
        raffleWinner,
        prizeDistributed: rafflePrizeDistributed,
        lastRequestId: raffleLastRequestId,
        tokenDecimals,
        balance: raffleBalance.toString(),
      };

      // Serialize bigint for storage
      const serializableRaffle = {
        ...raffle,
        lastRequestId: raffle.lastRequestId.toString(),
      };

      // Cache the result in Redis
      // If the raffle is complete (prize distributed), store permanently
      // Otherwise, use TTL for active raffles
      if (rafflePrizeDistributed) {
        // Completed raffle - store permanently (no TTL)
        await redisCache.set(cacheKey, serializableRaffle);
        console.log(`Cached completed raffle ${address} in Redis permanently`);
      } else {
        // Active raffle - store with TTL
        await redisCache.set(cacheKey, serializableRaffle, ACTIVE_RAFFLE_TTL);
        console.log(`Cached active raffle ${address} in Redis with ${ACTIVE_RAFFLE_TTL}s TTL`);
      }

      // Return with bigint serialized as string
      return NextResponse.json({ 
        raffle: {
          ...raffle,
          lastRequestId: raffle.lastRequestId?.toString() || "0",
        }, 
        cached: false 
      });
    } finally {
      // Clean up deduplication key
      if (redis) {
        await redis.del(dedupKey);
      }
    }
  } catch (error) {
    console.error('Error fetching raffle:', error);
    // Make sure to clean up dedup key on error
    try {
      const { address } = await params;
      if (redis) {
        await redis.del(`dedup:raffle:${address}`);
      }
    } catch {}
    return NextResponse.json({ error: 'Failed to fetch raffle' }, { status: 500 });
  }
} 