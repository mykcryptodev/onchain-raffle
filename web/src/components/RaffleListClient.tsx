"use client";

import { useRaffles } from "@/hooks/useRaffles";
import { RaffleCard } from "./RaffleCard";

export function RaffleListClient() {
  const { data: raffles, isLoading, error } = useRaffles();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-zinc-800 rounded-lg mb-4"></div>
          <div className="h-32 bg-zinc-800 rounded-lg mb-4"></div>
          <div className="h-32 bg-zinc-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">Error loading raffles: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(!raffles || raffles.length === 0) ? (
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