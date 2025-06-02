import { NextRequest, NextResponse } from "next/server";
import { redisCache } from "@/lib/redis";
import { isAddress } from "thirdweb";

export const dynamic = 'force-dynamic';

// This route can be called to invalidate cache when needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid raffle address" },
        { status: 400 }
      );
    }

    const cacheKey = `raffle:${address}`;
    
    // Delete the cache entry
    await redisCache.del(cacheKey);
    console.log(`Invalidated cache for raffle ${address}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
} 