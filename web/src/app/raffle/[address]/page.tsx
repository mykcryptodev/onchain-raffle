import { isAddress } from "thirdweb";
import RaffleManagement from "./RaffleManagement";
import { RaffleData } from "@/types/raffle";
import { getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { owner, token, winner, prizeDistributed, lastRequestId } from "@/abis/raffle";
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

    const raffleData: RaffleData = {
      owner: raffleOwner as `0x${string}`,
      token: raffleToken as `0x${string}`,
      tokenDecimals,
      winner: raffleWinner as `0x${string}`,
      prizeDistributed: rafflePrizeDistributed,
      balance: raffleBalance.toString(),
      lastRequestId: raffleLastRequestId,
    };
    
    // Cache the result
    const serializableRaffle = {
      raffleAddress: address,
      raffleOwner,
      raffleToken,
      raffleWinner,
      prizeDistributed: rafflePrizeDistributed,
      lastRequestId: raffleLastRequestId.toString(),
      tokenDecimals,
      balance: raffleBalance.toString(),
    };
    
    if (rafflePrizeDistributed) {
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