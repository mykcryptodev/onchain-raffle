import { getRaffles } from "@/abis/factory";
import { owner, token, winner, prizeDistributed } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";
import { RaffleCard } from "./RaffleCard";
import { RaffleCardData } from "@/types/raffle";

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

      const [raffleOwner, raffleToken, raffleWinner, rafflePrizeDistributed] = await Promise.all([
        owner({
          contract: raffleContract,
        }),
        token({
          contract: raffleContract,
        }),
        winner({
          contract: raffleContract,
        }),
        prizeDistributed({
          contract: raffleContract,
        }),
      ]);

      return {
        raffleAddress: raffleAddress as `0x${string}`,
        raffleOwner: raffleOwner as `0x${string}`,
        raffleToken: raffleToken as `0x${string}`,
        raffleWinner: raffleWinner as `0x${string}`,
        prizeDistributed: rafflePrizeDistributed,
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
            />
          ))}
        </div>
      )}
    </div>
  );
}