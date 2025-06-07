import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';
import { client } from '@/constants/thirdweb';
import { chain } from '@/constants/chain';
import { getContract, toUnits } from 'thirdweb';
import { decimals } from 'thirdweb/extensions/erc20';
import { isAddress } from 'thirdweb/utils';
import { createPublicClient, http, erc20Abi } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const CACHE_TTL = 60; // 1 minute

interface FilterRequest {
  addresses: string[];
  token: string;
  amount: string;
}

export async function POST(req: Request) {
  try {
    const { addresses, token, amount } = (await req.json()) as FilterRequest;

    if (!token || !isAddress(token)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: 'Addresses are required' }, { status: 400 });
    }

    const validAddresses = addresses.filter(a => isAddress(a)) as `0x${string}`[];

    if (validAddresses.length === 0) {
      return NextResponse.json({ addresses: [] });
    }

    const tokenContract = getContract({ client, chain, address: token as `0x${string}` });
    const tokenDecimals = await decimals({ contract: tokenContract });
    const amountWei = toUnits(amount || '0', tokenDecimals);

    const filtered: string[] = [];

    const toFetch: { addr: `0x${string}`; cacheKey: string }[] = [];
    const cachedBalances = new Map<string, string>();

    for (const addr of validAddresses) {
      const cacheKey = `holder:${token}:${addr.toLowerCase()}`;
      const balanceStr = await redisCache.get<string>(cacheKey);
      if (balanceStr) {
        cachedBalances.set(addr, balanceStr);
      } else {
        toFetch.push({ addr, cacheKey });
      }
    }

    if (toFetch.length > 0) {
      const contracts = toFetch.map(({ addr }) => ({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      }));

      const results = await publicClient.multicall({ contracts });

      for (let i = 0; i < results.length; i++) {
        const { addr, cacheKey } = toFetch[i];
        const result = results[i];
        const bal = result.status === 'success' ? (result.result as bigint) : 0n;
        const balStr = bal.toString();
        cachedBalances.set(addr, balStr);
        await redisCache.set(cacheKey, balStr, CACHE_TTL);
      }
    }

    for (const addr of validAddresses) {
      const balStr = cachedBalances.get(addr) ?? '0';
      if (BigInt(balStr) >= amountWei) {
        filtered.push(addr);
      }
    }

    return NextResponse.json({ addresses: filtered });
  } catch (error) {
    console.error('Error filtering holders:', error);
    return NextResponse.json({ error: 'Failed to filter addresses' }, { status: 500 });
  }
}
