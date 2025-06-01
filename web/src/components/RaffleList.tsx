import { getRaffles } from "@/abis/factory";
import { owner, token, winner } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";
import { RaffleCard } from "./RaffleCard";

export async function RaffleList() {
  const raffleAddresses = await getRaffles({
    contract: factoryContract,
  });
  const raffles = await Promise.all(
    raffleAddresses.map(async (raffleAddress) => {
      const raffleContract = getContract({
        chain,
        address: raffleAddress,
        client,
      });

      const [raffleOwner, raffleToken, raffleWinner] = await Promise.all([
        owner({
          contract: raffleContract,
        }),
        token({
          contract: raffleContract,
        }),
        winner({
          contract: raffleContract,
        }),
      ]);

      return {
        raffleAddress,
        raffleOwner,
        raffleToken,
        raffleWinner,
      };
    })
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Raffles</h2>
      {raffles.length === 0 ? (
        <p className="text-gray-500">No raffles found</p>
      ) : (
        <div className="grid gap-4">
          {raffles.map((raffle, index) => (
            <RaffleCard
              key={raffle.raffleAddress}
              raffleAddress={raffle.raffleAddress}
              raffleOwner={raffle.raffleOwner}
              raffleToken={raffle.raffleToken}
              raffleWinner={raffle.raffleWinner}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}