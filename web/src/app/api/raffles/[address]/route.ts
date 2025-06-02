import { NextResponse } from 'next/server';
import { owner, token, winner, prizeDistributed, lastRequestId } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { getContract } from "thirdweb";
import { redisCache } from "@/lib/redis";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";

export const dynamic = 'force-dynamic';

const ACTIVE_RAFFLE_TTL = 60; // 60 seconds for active raffles

// In-memory promise cache for request deduplication
const fetchPromises = new Map<string, Promise<any>>();

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
    
    // Always try Redis first
    const cached = await redisCache.get(cacheKey) as RaffleData | null;
    if (cached) {
      console.log(`Returning raffle ${address} from Redis cache`);
      // Keep lastRequestId as string for JSON serialization
      return NextResponse.json({ 
        raffle: {
          ...cached,
          lastRequestId: cached.lastRequestId.toString(), // Ensure it's serialized as string
        }, 
        cached: true 
      });
    }

    // Check if we're already fetching this raffle
    const existingPromise = fetchPromises.get(address);
    if (existingPromise) {
      console.log(`Deduplicating request for raffle ${address}`);
      const raffle = await existingPromise;
      return NextResponse.json({ 
        raffle: {
          ...raffle,
          lastRequestId: raffle.lastRequestId.toString(),
        }, 
        cached: false 
      });
    }

    // Create a new fetch promise
    const fetchPromise = (async () => {
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

      return raffle;
    })();

    // Store the promise for deduplication
    fetchPromises.set(address, fetchPromise);

    try {
      const raffle = await fetchPromise;
      
      // Return with bigint serialized as string
      return NextResponse.json({ 
        raffle: {
          ...raffle,
          lastRequestId: raffle.lastRequestId.toString(),
        }, 
        cached: false 
      });
    } finally {
      // Clean up the promise cache
      fetchPromises.delete(address);
    }
  } catch (error) {
    console.error('Error fetching raffle:', error);
    // Make sure to clean up on error
    const { address } = await params;
    fetchPromises.delete(address);
    return NextResponse.json({ error: 'Failed to fetch raffle' }, { status: 500 });
  }
} 