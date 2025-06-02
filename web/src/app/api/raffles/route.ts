import { NextResponse } from 'next/server';
import { getRaffles } from "@/abis/factory";
import { owner, token, winner, prizeDistributed } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";
import { redisCache } from "@/lib/redis";

// Remove Next.js cache to rely on Redis
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'raffles:all';
const LIST_CACHE_TTL = 30; // 30 seconds for the list
const ACTIVE_RAFFLE_TTL = 60; // 60 seconds for active raffles

interface Raffle {
  raffleAddress: string;
  raffleOwner: string;
  raffleToken: string;
  raffleWinner: string;
  prizeDistributed: boolean;
}

export async function GET() {
  try {
    // Try to get the list from Redis cache first
    const cachedList = await redisCache.get(CACHE_KEY);
    if (cachedList) {
      console.log('Returning raffles list from Redis cache');
      return NextResponse.json({ raffles: cachedList, cached: true });
    }

    console.log('Fetching raffle addresses from blockchain...');
    
    const raffleAddresses = await getRaffles({
      contract: factoryContract,
    });
    
    const reversedAddresses = [...raffleAddresses].reverse();
    
    // Check Redis for each raffle individually
    const raffles: Raffle[] = [];
    const missingAddresses: string[] = [];
    
    // First pass: check what we have in Redis
    for (const address of reversedAddresses) {
      const cacheKey = `raffle:${address}`;
      const cachedRaffle = await redisCache.get(cacheKey) as Raffle | null;
      
      if (cachedRaffle) {
        console.log(`Found raffle ${address} in Redis cache`);
        raffles.push(cachedRaffle);
      } else {
        missingAddresses.push(address);
      }
    }
    
    console.log(`Found ${raffles.length} raffles in cache, need to fetch ${missingAddresses.length} from RPC`);
    
    // Second pass: fetch missing raffles from RPC
    if (missingAddresses.length > 0) {
      const fetchedRaffles = await Promise.all(
        missingAddresses.map(async (raffleAddress) => {
          const raffleContract = getContract({
            chain,
            address: raffleAddress,
            client,
          });

          const [raffleOwner, raffleToken, raffleWinner, rafflePrizeDistributed] = await Promise.all([
            owner({ contract: raffleContract }),
            token({ contract: raffleContract }),
            winner({ contract: raffleContract }),
            prizeDistributed({ contract: raffleContract }),
          ]);

          const raffle = {
            raffleAddress,
            raffleOwner,
            raffleToken,
            raffleWinner,
            prizeDistributed: rafflePrizeDistributed,
          };

          // Cache individual raffle
          const cacheKey = `raffle:${raffleAddress}`;
          if (rafflePrizeDistributed) {
            // Completed raffle - store permanently
            await redisCache.set(cacheKey, raffle);
            console.log(`Cached completed raffle ${raffleAddress} permanently`);
          } else {
            // Active raffle - store with TTL
            await redisCache.set(cacheKey, raffle, ACTIVE_RAFFLE_TTL);
            console.log(`Cached active raffle ${raffleAddress} with ${ACTIVE_RAFFLE_TTL}s TTL`);
          }

          return raffle;
        })
      );
      
      raffles.push(...fetchedRaffles);
    }
    
    // Sort raffles to maintain order (newest first)
    const sortedRaffles = reversedAddresses.map(address => 
      raffles.find(r => r.raffleAddress === address)
    ).filter(Boolean);

    // Cache the complete list with short TTL
    await redisCache.set(CACHE_KEY, sortedRaffles, LIST_CACHE_TTL);
    console.log(`Cached complete raffles list with ${LIST_CACHE_TTL}s TTL`);

    return NextResponse.json({ raffles: sortedRaffles, cached: false });
  } catch (error) {
    console.error('Error fetching raffles:', error);
    return NextResponse.json({ error: 'Failed to fetch raffles' }, { status: 500 });
  }
} 