import { NextResponse } from 'next/server';
import { chain } from '@/constants/chain';
import { getContract, isAddress } from 'thirdweb';
import { client } from '@/constants/thirdweb';
import { getCurrencyMetadata } from 'thirdweb/extensions/erc20';
import { redisCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

if (!MORALIS_API_KEY) {
  console.error('MORALIS_API_KEY is not set');
}

interface Holder {
  address: string;
  balance: string;
}

export async function POST(request: Request) {
  if (!MORALIS_API_KEY) {
    return NextResponse.json({ error: 'MORALIS_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { tokenAddress, minBalance } = body as { tokenAddress?: string; minBalance?: string };

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const cacheKey = `token-holders:${tokenAddress}:${minBalance || 'all'}`;

    const cached = await redisCache.get<string[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ holders: cached, cached: true });
    }

    const tokenContract = getContract({
      chain,
      address: tokenAddress as `0x${string}`,
      client,
    });

    const metadata = await getCurrencyMetadata({ contract: tokenContract });
    const decimals = metadata.decimals;

    const threshold = minBalance ? BigInt(Math.floor(Number(minBalance) * 10 ** decimals)) : 0n;

    const holders: string[] = [];
    let cursor: string | null = null;
    let iterations = 0;

    while (iterations < 5) {
      const params = new URLSearchParams({
        chain: `0x${chain.id.toString(16)}`,
        limit: '100',
      });
      if (cursor) {
        params.set('cursor', cursor);
      }
      const url = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/holders?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Moralis API error:', errorText);
        return NextResponse.json({ error: 'Failed to fetch token holders' }, { status: 500 });
      }
      const data = await res.json();
      const items: Holder[] = data.result || [];
      items.forEach(item => {
        try {
          const balance = BigInt(item.balance);
          if (balance >= threshold) {
            holders.push(item.address);
          }
        } catch {}
      });
      cursor = data.cursor || null;
      if (!cursor) {
        break;
      }
      iterations += 1;
    }

    await redisCache.set(cacheKey, holders, 300);

    return NextResponse.json({ holders, cached: false });
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return NextResponse.json({ error: 'Failed to fetch token holders' }, { status: 500 });
  }
}
