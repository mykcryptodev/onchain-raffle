import { NextResponse } from 'next/server';
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { getContract } from "thirdweb";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import { redisCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const CACHE_TTL = 300; // 5 minutes for token metadata (rarely changes)

interface Params {
  params: Promise<{
    address: string;
  }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { address } = await params;
    const cacheKey = `token:metadata:${address}`;
    
    // Try to get from Redis cache first
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      console.log(`Returning token metadata for ${address} from Redis cache`);
      return NextResponse.json({ metadata: cached, cached: true });
    }

    console.log(`Fetching token metadata for ${address} from blockchain...`);
    
    const tokenContract = getContract({
      chain,
      address: address as `0x${string}`,
      client,
    });

    const metadata = await getCurrencyMetadata({ contract: tokenContract });

    // Cache the result in Redis
    await redisCache.set(cacheKey, metadata, CACHE_TTL);
    console.log(`Cached token metadata for ${address} in Redis`);

    return NextResponse.json({ metadata, cached: false });
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch token metadata' }, { status: 500 });
  }
} 