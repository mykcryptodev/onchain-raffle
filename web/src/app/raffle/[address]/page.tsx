import { getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import RaffleManagement from "./RaffleManagement";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";
import { RaffleData } from "@/types/raffle";

interface PageProps {
  params: Promise<{
    address: `0x${string}`;
  }>;
}

export default async function RafflePage({ params }: PageProps) {
  const { address } = await params;
  
  const raffleContract = getContract({
    client,
    chain,
    address,
  });

  try {
    // Fetch all raffle data on the server
    const [owner, token, winner, prizeDistributed, lastRequestId] = await Promise.all([
      raffleAbi.owner({ contract: raffleContract }),
      raffleAbi.token({ contract: raffleContract }),
      raffleAbi.winner({ contract: raffleContract }),
      raffleAbi.prizeDistributed({ contract: raffleContract }),
      raffleAbi.lastRequestId({ contract: raffleContract }),
    ]);

    const tokenContract = getContract({
      client,
      chain,
      address: token,
    });

    const [tokenDecimals, balance] = await Promise.all([
      decimals({
        contract: tokenContract,
      }),
      balanceOf({
        contract: tokenContract,
        address: address,
      }),
    ]);

    const raffleData: RaffleData = {
      owner: owner as `0x${string}`,
      token: token as `0x${string}`,
      tokenDecimals,
      winner: winner as `0x${string}`,
      prizeDistributed,
      balance: balance.toString(),
      lastRequestId,
    };

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