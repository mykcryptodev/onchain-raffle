import { isAddress } from "thirdweb";
import RaffleManagement from "./RaffleManagement";
import { RaffleData } from "@/types/raffle";
import { getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { getRaffleInfo } from "@/abis/raffle";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";
import { redisCache } from "@/lib/redis";

// Force dynamic rendering to prevent 404s during cold starts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    address: `0x${string}`;
  }>;
}

export default async function RafflePage({ params }: PageProps) {
  const { address } = await params;
  
  // Validate address format
  if (!address || !isAddress(address)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Invalid raffle address</p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  try {
    const cacheKey = `raffle:${address}`;
    
    // Try to get from Redis cache first
    const cached = await redisCache.get(cacheKey) as any;
    if (cached) {
      console.log(`Using cached data for raffle ${address}`);
      const raffleData: RaffleData = {
        owner: cached.raffleOwner as `0x${string}`,
        token: cached.raffleToken as `0x${string}`,
        tokenDecimals: cached.tokenDecimals,
        winner: cached.raffleWinner as `0x${string}`,
        prizeDistributed: cached.prizeDistributed,
        balance: cached.balance,
        lastRequestId: BigInt(cached.lastRequestId || 0),
        finalPrizeAmount: cached.finalPrizeAmount || "0",
      };
      return <RaffleManagement address={address} initialRaffleData={raffleData} />;
    }
    
    // If not cached, fetch from blockchain
    console.log(`Fetching raffle ${address} from blockchain...`);
    
    const raffleContract = getContract({
      chain,
      address: address as `0x${string}`,
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

    const raffleData: RaffleData = {
      owner: raffleOwner as `0x${string}`,
      token: raffleToken as `0x${string}`,
      tokenDecimals,
      winner: raffleWinner as `0x${string}`,
      prizeDistributed: isPrizeDistributed,
      balance: raffleBalance.toString(),
      lastRequestId: lastRequestId,
      finalPrizeAmount: finalPrizeAmount.toString(),
    };
    
    // Cache the result
    const serializableRaffle = {
      raffleAddress: address,
      raffleOwner,
      raffleToken,
      raffleWinner,
      prizeDistributed: isPrizeDistributed,
      lastRequestId: lastRequestId.toString(),
      tokenDecimals,
      balance: raffleBalance.toString(),
      finalPrizeAmount: finalPrizeAmount.toString(),
    };
    
    if (isPrizeDistributed) {
      // Completed raffle - store permanently
      await redisCache.set(cacheKey, serializableRaffle);
      console.log(`Cached completed raffle ${address} permanently`);
    } else {
      // Active raffle - store with TTL
      await redisCache.set(cacheKey, serializableRaffle, 60);
      console.log(`Cached active raffle ${address} with 60s TTL`);
    }

    return <RaffleManagement address={address} initialRaffleData={raffleData} />;
  } catch (error) {
    console.error("Error fetching raffle data:", error);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load raffle data</p>
          <p className="text-zinc-400 text-sm mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    );
  }
} 