import { NextResponse } from 'next/server';
import { owner, token, winner, prizeDistributed } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { getContract } from "thirdweb";
import { redisCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const ACTIVE_RAFFLE_TTL = 60; // 60 seconds for active raffles

interface Params {
  params: Promise<{
    address: string;
  }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { address } = await params;
    const cacheKey = `raffle:${address}`;
    
    // Always try Redis first
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      console.log(`Returning raffle ${address} from Redis cache`);
      return NextResponse.json({ raffle: cached, cached: true });
    }

    console.log(`Fetching raffle ${address} from blockchain...`);
    
    const raffleContract = getContract({
      chain,
      address: address as `0x${string}`,
      client,
    });

    const [raffleOwner, raffleToken, raffleWinner, rafflePrizeDistributed] = await Promise.all([
      owner({ contract: raffleContract }),
      token({ contract: raffleContract }),
      winner({ contract: raffleContract }),
      prizeDistributed({ contract: raffleContract }),
    ]);

    const raffle = {
      raffleAddress: address,
      raffleOwner,
      raffleToken,
      raffleWinner,
      prizeDistributed: rafflePrizeDistributed,
    };

    // Cache the result in Redis
    // If the raffle is complete (prize distributed), store permanently
    // Otherwise, use TTL for active raffles
    if (rafflePrizeDistributed) {
      // Completed raffle - store permanently (no TTL)
      await redisCache.set(cacheKey, raffle);
      console.log(`Cached completed raffle ${address} in Redis permanently`);
    } else {
      // Active raffle - store with TTL
      await redisCache.set(cacheKey, raffle, ACTIVE_RAFFLE_TTL);
      console.log(`Cached active raffle ${address} in Redis with ${ACTIVE_RAFFLE_TTL}s TTL`);
    }

    return NextResponse.json({ raffle, cached: false });
  } catch (error) {
    console.error('Error fetching raffle:', error);
    return NextResponse.json({ error: 'Failed to fetch raffle' }, { status: 500 });
  }
} 