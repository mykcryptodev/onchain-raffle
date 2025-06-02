import { useQuery } from '@tanstack/react-query';
import { ZERO_ADDRESS } from 'thirdweb';

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export function useTokenMetadata(tokenAddress: string) {
  return useQuery<TokenMetadata, Error>({
    queryKey: ['token', 'metadata', tokenAddress],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/${tokenAddress}`);
      if (!response.ok) throw new Error('Failed to fetch token metadata');
      const data = await response.json();
      return data.metadata;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!tokenAddress && tokenAddress !== ZERO_ADDRESS,
  });
} 