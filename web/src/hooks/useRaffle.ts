import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RaffleCardData } from '@/types/raffle';

export function useRaffle(address: string) {
  return useQuery<RaffleCardData, Error>({
    queryKey: ['raffle', address],
    queryFn: async () => {
      const response = await fetch(`/api/raffles/${address}`);
      if (!response.ok) throw new Error('Failed to fetch raffle');
      const data = await response.json();
      return data.raffle;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!address,
  });
}

// Hook for invalidating the cache when needed
export function useInvalidateRaffles() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['raffles'] });
  };
}