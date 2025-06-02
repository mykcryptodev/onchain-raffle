# RPC Optimization Guide

## Current Issues

Your app is making too many RPC requests due to:
1. **RaffleList**: 4 RPC calls per raffle (owner, token, winner, prizeDistributed)
2. **RaffleCard**: Additional calls for token metadata and account data via TokenProvider/AccountProvider
3. **Event Watchers**: Continuous polling from WatchRaffle and WatchFactory
4. **OG Images**: Additional calls for social profiles

## Solutions

### 0. Upstash Redis Caching (IMPLEMENTED) ✅

We've integrated Upstash Redis for persistent, distributed caching:

#### Setup
1. Add environment variables:
   ```env
   UPSTASH_URL=your_upstash_url
   UPSTASH_TOKEN=your_upstash_token
   ```

2. Redis is now used for:
   - **Raffle List Caching**: `/api/raffles` - caches all raffles for 30 seconds
   - **Individual Raffle Caching**: `/api/raffles/[address]` - caches single raffle for 60 seconds
   - **Token Metadata Caching**: `/api/tokens/[address]` - caches token metadata for 5 minutes
   - **Cache Invalidation**: `/api/cache/invalidate` - invalidates cache when needed

#### Benefits
- **Persistent Cache**: Survives server restarts
- **Distributed**: Works across multiple server instances
- **Automatic TTL**: Data expires automatically
- **Pattern-based Invalidation**: Can clear related cache entries

#### Usage Example
```typescript
import { redisCache } from "@/lib/redis";

// Set cache
await redisCache.set('key', data, 60); // 60 seconds TTL

// Get cache
const data = await redisCache.get('key');

// Invalidate pattern
await redisCache.invalidatePattern('raffle:*');
```

### 1. Implement Request Caching

Create a simple cache layer for frequently accessed data:

```typescript
// web/src/lib/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const rpcCache = new SimpleCache();
```

### 2. Optimize Event Watching

Update WatchRaffle and WatchFactory to reduce polling frequency:

```typescript
// In WatchRaffle.tsx and WatchFactory.tsx
unwatch = watchContractEvents({
  contract: raffleContract,
  events: [...],
  latestBlockNumber: currentBlock,
  pollingInterval: 10000, // Poll every 10 seconds instead of default (faster)
  onEvents: async (events) => {
    // ... handle events
  },
});
```

### 3. Create a Server-Side Data Fetcher (IMPLEMENTED) ✅

Create an API route to fetch raffle data server-side:

```typescript
// web/src/app/api/raffles/route.ts
import { NextResponse } from 'next/server';
import { getRaffles } from "@/abis/factory";
import { owner, token, winner, prizeDistributed } from "@/abis/raffle";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { getContract } from "thirdweb";

export const revalidate = 30; // Cache for 30 seconds

export async function GET() {
  try {
    const raffleAddresses = await getRaffles({
      contract: factoryContract,
    });
    
    const reversedAddresses = [...raffleAddresses].reverse();
    
    const raffles = await Promise.all(
      reversedAddresses.map(async (raffleAddress) => {
        const raffleContract = getContract({
          chain,
          address: raffleAddress,
          client,
        });

        const [raffleOwner, raffleToken, raffleWinner, rafflePrizeDistributed] = await Promise.all([
          owner({ contract: raffleContract }),
          token({ contract: raffleContract }),
          winner({ contract: raffleContract }),
          prizeDistributed({ contract: raffleContract }),
        ]);

        return {
          raffleAddress,
          raffleOwner,
          raffleToken,
          raffleWinner,
          prizeDistributed: rafflePrizeDistributed,
        };
      })
    );

    return NextResponse.json({ raffles });
  } catch (error) {
    console.error('Error fetching raffles:', error);
    return NextResponse.json({ error: 'Failed to fetch raffles' }, { status: 500 });
  }
}
```

### 4. Use React Query for Client-Side Caching

```typescript
// web/src/hooks/useRaffles.ts
import { useQuery } from '@tanstack/react-query';

export function useRaffles() {
  return useQuery({
    queryKey: ['raffles'],
    queryFn: async () => {
      const response = await fetch('/api/raffles');
      if (!response.ok) throw new Error('Failed to fetch raffles');
      const data = await response.json();
      return data.raffles;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 60000, // Keep in cache for 60 seconds
  });
}
```

### 5. Optimize Token/Account Providers

Create wrapper components that batch and cache metadata:

```typescript
// web/src/components/CachedTokenProvider.tsx
import { TokenProvider } from "thirdweb/react";
import { rpcCache } from "@/lib/cache";

export function CachedTokenProvider({ address, client, chain, children }: any) {
  const cacheKey = `token-${chain.id}-${address}`;
  const cached = rpcCache.get(cacheKey);
  
  if (cached) {
    return <>{children}</>;
  }
  
  return (
    <TokenProvider 
      address={address} 
      client={client} 
      chain={chain}
      onLoad={(data) => {
        rpcCache.set(cacheKey, data, 300000); // Cache for 5 minutes
      }}
    >
      {children}
    </TokenProvider>
  );
}
```

### 6. Implement Pagination

Instead of loading all raffles at once, implement pagination:

```typescript
// web/src/components/RaffleListPaginated.tsx
export function RaffleListPaginated() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const { data: allRaffles } = useRaffles();
  const paginatedRaffles = allRaffles?.slice(page * pageSize, (page + 1) * pageSize);
  
  return (
    <div>
      {/* Render only visible raffles */}
      {paginatedRaffles?.map(raffle => (
        <RaffleCard key={raffle.raffleAddress} {...raffle} />
      ))}
      
      {/* Pagination controls */}
      <button onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

### 7. Use Server Components (Next.js 13+)

Convert RaffleList to a server component:

```typescript
// web/src/app/raffles/page.tsx
import { RaffleList } from "@/components/RaffleList";

export default async function RafflesPage() {
  // This runs on the server, no client-side RPC calls
  return <RaffleList />;
}
```

### 8. Configure RPC Rate Limiting

Add a rate limiter to your client configuration:

```typescript
// web/src/constants/thirdweb.ts
import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  config: {
    rpc: {
      // Add batch configuration
      batchMaxCount: 100,
      batchMaxSize: 1024 * 1024, // 1MB
      batchWaitTime: 16, // 16ms
    },
  },
});
```

## Implementation Priority

1. **High Priority** (COMPLETED ✅): 
   - Implement server-side data fetching (Solution 3)
   - Add Upstash Redis caching (Solution 0)
   - Cache invalidation on raffle creation

2. **Medium Priority**:
   - Add pagination (Solution 6)
   - Add client-side caching with React Query (Solution 4)

3. **Low Priority**:
   - Optimize TokenProvider/AccountProvider (Solution 5)
   - Convert to server components where possible (Solution 7)
   - Reduce event watcher polling frequency (Solution 2)

## Expected Results

Implementing these solutions should reduce your RPC calls by:
- **95%+** with Upstash Redis caching
- **70-80%** with server-side fetching and caching
- **90%** with pagination (only load visible raffles)
- **50%** reduction in event watcher calls with increased polling intervals

Total expected reduction: **~95-98%** of current RPC load with Redis caching enabled. 