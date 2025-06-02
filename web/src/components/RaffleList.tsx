import { getRaffles } from "@/abis/factory";
import { getRaffleInfo } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";
import { RaffleCard } from "./RaffleCard";
import { RaffleCardData } from "@/types/raffle";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";

export async function RaffleList() {
  const raffleAddresses = await getRaffles({
    contract: factoryContract,
  });
  
  // Reverse the array to show most recent raffles first
  const reversedAddresses = [...raffleAddresses].reverse();
  
  const raffles: RaffleCardData[] = await Promise.all(
    reversedAddresses.map(async (raffleAddress) => {
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

      // Get token contract for balance and decimals
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

      return {
        raffleAddress: raffleAddress as `0x${string}`,
        raffleOwner: raffleOwner as `0x${string}`,
        raffleToken: raffleToken as `0x${string}`,
        raffleWinner: raffleWinner as `0x${string}`,
        prizeDistributed: isPrizeDistributed,
        finalPrizeAmount: finalPrizeAmount.toString(),
        balance: raffleBalance.toString(),
        tokenDecimals,
      };
    })
  );

  return (
    <div className="space-y-4">
      {raffles.length === 0 ? (
        <p className="text-gray-500">No raffles found</p>
      ) : (
        <div className="grid gap-4">
          {raffles.map((raffle) => (
            <RaffleCard
              key={raffle.raffleAddress}
              raffleAddress={raffle.raffleAddress}
              raffleOwner={raffle.raffleOwner}
              raffleToken={raffle.raffleToken}
              raffleWinner={raffle.raffleWinner}
              prizeDistributed={raffle.prizeDistributed}
              finalPrizeAmount={raffle.finalPrizeAmount}
              balance={raffle.balance}
              tokenDecimals={raffle.tokenDecimals}
            />
          ))}
        </div>
      )}
    </div>
  );
}