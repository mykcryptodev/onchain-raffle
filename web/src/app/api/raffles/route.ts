import { NextResponse } from 'next/server';
import { getRaffles } from "@/abis/factory";
import { getRaffleInfo } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";
import { redisCache, redis } from "@/lib/redis";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";

// Remove Next.js cache to rely on Redis
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'raffles:all';
const LIST_CACHE_TTL = 30; // 30 seconds for the list
const ACTIVE_RAFFLE_TTL = 60; // 60 seconds for active raffles
const DEDUP_KEY = 'dedup:raffles:all';
const DEDUP_TTL = 10; // 10 seconds for list deduplication
const FAILED_RAFFLE_TTL = 3600; // 1 hour for failed raffles

interface Raffle {
  raffleAddress: string;
  raffleOwner: string;
  raffleToken: string;
  raffleWinner: string;
  prizeDistributed: boolean;
  lastRequestId?: bigint | string; // bigint when fresh, string when cached/serialized
  tokenDecimals?: number;
  balance?: string;
  finalPrizeAmount?: string;
}

export async function GET() {
  try {
    // Try to get the list from Redis cache first
    const cachedList = await redisCache.get(CACHE_KEY);
    if (cachedList) {
      console.log('Returning raffles list from Redis cache');
      // Ensure all lastRequestIds are strings for JSON serialization
      const serializedList = (cachedList as any[]).map(raffle => ({
        ...raffle,
        lastRequestId: raffle.lastRequestId?.toString(),
      }));
      return NextResponse.json({ raffles: serializedList, cached: true });
    }

    // Check if another request is already fetching the list
    if (redis) {
      const isFetching = await redis.exists(DEDUP_KEY);
      if (isFetching) {
        console.log('Another request is already fetching raffles list, waiting...');
        // Wait and try to get from cache
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Try up to 15 times (3 seconds total)
        for (let i = 0; i < 15; i++) {
          const cached = await redisCache.get(CACHE_KEY);
          if (cached) {
            const serializedList = (cached as any[]).map(raffle => ({
              ...raffle,
              lastRequestId: raffle.lastRequestId?.toString(),
            }));
            return NextResponse.json({ raffles: serializedList, cached: true, deduplicated: true });
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Mark that we're fetching the list
      await redis.set(DEDUP_KEY, "1", { ex: DEDUP_TTL });
    }

    try {
      console.log('Fetching raffle addresses from blockchain...');
      
      const raffleAddresses = await getRaffles({
        contract: factoryContract,
      });
      
      const reversedAddresses = [...raffleAddresses].reverse();
      
      // Check Redis for each raffle individually
      const raffles: Raffle[] = [];
      const missingAddresses: string[] = [];
      const skippedAddresses: string[] = [];
      
      // First pass: check what we have in Redis
      for (const address of reversedAddresses) {
        const cacheKey = `raffle:${address}`;
        const failedKey = `failed:${address}`;
        
        // Check if this raffle is known to fail
        const isFailed = await redisCache.get(failedKey);
        if (isFailed) {
          console.log(`Skipping known-failed raffle ${address}`);
          skippedAddresses.push(address);
          continue;
        }
        
        const cachedRaffle = await redisCache.get(cacheKey) as Raffle | null;
        
        if (cachedRaffle) {
          console.log(`Found raffle ${address} in Redis cache`);
          raffles.push(cachedRaffle);
        } else {
          missingAddresses.push(address);
        }
      }
      
      console.log(`Found ${raffles.length} raffles in cache, skipped ${skippedAddresses.length} known-failed, need to fetch ${missingAddresses.length} from RPC`);
      
      // Second pass: fetch missing raffles from RPC
      if (missingAddresses.length > 0) {
        const fetchedRaffles = await Promise.all(
          missingAddresses.map(async (raffleAddress) => {
            try {
              const raffleContract = getContract({
                chain,
                address: raffleAddress,
                client,
              });

              // Get all raffle info in one call
              const raffleInfo = await getRaffleInfo({ contract: raffleContract });

              // Destructure the response
              const [
                raffleOwner,
                raffleToken,
                raffleWinner,
                isPrizeDistributed,
                lastRequestId,
                finalPrizeAmount
              ] = raffleInfo;

              // Get token info for complete data
              const tokenContract = getContract({
                chain,
                address: raffleToken,
                client,
              });

              const [tokenDecimals, raffleBalance] = await Promise.all([
                decimals({ contract: tokenContract }),
                balanceOf({ 
                  contract: tokenContract,
                  address: raffleAddress as `0x${string}`,
                }),
              ]);

              const raffle: Raffle = {
                raffleAddress,
                raffleOwner,
                raffleToken,
                raffleWinner,
                prizeDistributed: isPrizeDistributed,
                lastRequestId: lastRequestId,
                tokenDecimals,
                balance: raffleBalance.toString(),
                finalPrizeAmount: finalPrizeAmount.toString(),
              };

              // Cache individual raffle with bigint serialized
              const cacheKey = `raffle:${raffleAddress}`;
              const serializableRaffle = {
                ...raffle,
                lastRequestId: raffle.lastRequestId?.toString(),
              };

              if (isPrizeDistributed) {
                // Completed raffle - store permanently
                await redisCache.set(cacheKey, serializableRaffle);
                console.log(`Cached completed raffle ${raffleAddress} permanently`);
              } else {
                // Active raffle - store with TTL
                await redisCache.set(cacheKey, serializableRaffle, ACTIVE_RAFFLE_TTL);
                console.log(`Cached active raffle ${raffleAddress} with ${ACTIVE_RAFFLE_TTL}s TTL`);
              }

              return raffle;
            } catch (error) {
              console.error(`Failed to fetch raffle ${raffleAddress}:`, error);
              
              // Cache the failed raffle address to avoid repeated attempts
              const failedKey = `failed:${raffleAddress}`;
              const failureReason = error instanceof Error ? error.message : 'Unknown error';
              
              // Store failed raffle with reason and timestamp
              await redisCache.set(failedKey, {
                reason: failureReason,
                timestamp: new Date().toISOString(),
                errorType: error?.constructor?.name || 'Unknown'
              }, FAILED_RAFFLE_TTL);
              
              console.log(`Cached failed raffle ${raffleAddress} for ${FAILED_RAFFLE_TTL} seconds`);
              
              return null; // Return null for failed fetches
            }
          })
        );
        
        // Filter out failed fetches (null values)
        const successfulFetches = fetchedRaffles.filter((raffle): raffle is Raffle => raffle !== null);
        
        if (fetchedRaffles.length !== successfulFetches.length) {
          console.warn(`Failed to fetch ${fetchedRaffles.length - successfulFetches.length} raffles out of ${fetchedRaffles.length}`);
        }
        
        raffles.push(...successfulFetches);
      }
      
      // Sort raffles to maintain order (newest first)
      const sortedRaffles = reversedAddresses.map(address => 
        raffles.find(r => r.raffleAddress === address)
      ).filter(Boolean);

      // Serialize bigints before caching and returning
      const serializedRaffles = sortedRaffles.map(raffle => ({
        ...raffle,
        lastRequestId: raffle?.lastRequestId?.toString(),
      }));

      // Cache the complete list with short TTL
      await redisCache.set(CACHE_KEY, serializedRaffles, LIST_CACHE_TTL);
      console.log(`Cached complete raffles list with ${LIST_CACHE_TTL}s TTL`);

      return NextResponse.json({ raffles: serializedRaffles, cached: false });
    } finally {
      // Clean up deduplication key
      if (redis) {
        await redis.del(DEDUP_KEY);
      }
    }
  } catch (error) {
    console.error('Error fetching raffles:', error);
    // Make sure to clean up dedup key on error
    try {
      if (redis) {
        await redis.del(DEDUP_KEY);
      }
    } catch {}
    return NextResponse.json({ error: 'Failed to fetch raffles' }, { status: 500 });
  }
} 