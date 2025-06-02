import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RaffleCardData } from '@/types/raffle';

export function useRaffles() {
  return useQuery<RaffleCardData[], Error>({
    queryKey: ['raffles'],
    queryFn: async () => {
      const response = await fetch('/api/raffles');
      if (!response.ok) throw new Error('Failed to fetch raffles');
      const data = await response.json();
      return data.raffles;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 60 * 1000, // Keep in cache for 60 seconds (formerly cacheTime)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Hook for invalidating the cache when needed
export function useInvalidateRaffles() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['raffles'] });
  };
} 