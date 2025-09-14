import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

if (!NEYNAR_API_KEY) {
  console.error('NEYNAR_API_KEY is not set');
}

interface NeynarUser {
  fid: number;
  custody_address: string;
  score?: number;
  verified_addresses?: {
    eth_addresses?: string[];
    primary?: {
      eth_address?: string;
    };
  };
}

interface UsersResponse {
  result?: { users: NeynarUser[] };
  users?: NeynarUser[];
}

export async function POST(request: Request) {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    let { addresses, minScore } = body as { addresses: any; minScore?: number };

    if (!Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Addresses must be an array' }, { status: 400 });
    }

    const uniqueAddresses = [...new Set(
      addresses
        .map((a: any) => (typeof a === 'string' ? a.trim().toLowerCase() : ''))
        .filter((a: string) => a.length > 0)
    )];

    if (uniqueAddresses.length === 0) {
      return NextResponse.json({ error: 'No valid addresses provided' }, { status: 400 });
    }

    const threshold = typeof minScore === 'number' ? minScore : 0.9;

    const cachedUsers: Record<string, NeynarUser> = {};
    const missing: string[] = [];

    for (const addr of uniqueAddresses) {
      const cacheKey = `neynar:address:${addr}`;
      const cached = await redisCache.get<NeynarUser>(cacheKey);
      if (cached) {
        cachedUsers[addr] = cached;
      } else {
        missing.push(addr);
      }
    }

    if (missing.length > 0) {
      const url = new URL('https://api.neynar.com/v2/farcaster/user/bulk-by-address');
      url.searchParams.set('addresses', missing.join(','));

      const response = await fetch(url.toString(), {
        headers: {
          'x-api-key': NEYNAR_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Neynar API error:', errorText);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: response.status });
      }

      const data: UsersResponse = await response.json();
      const users = data.result?.users || data.users || [];

      for (const user of users) {
        const ethAddress = user.verified_addresses?.primary?.eth_address || user.custody_address;
        if (ethAddress) {
          const addrLower = ethAddress.toLowerCase();
          cachedUsers[addrLower] = user;
          const cacheKey = `neynar:address:${addrLower}`;
          await redisCache.set(cacheKey, user, 3600);
        }
      }
    }

    const filtered: string[] = [];

    for (const addr of uniqueAddresses) {
      const user = cachedUsers[addr];
      if (user) {
        const ethAddress = user.verified_addresses?.primary?.eth_address || user.custody_address;
        const score = user.score ?? 0;
        if (ethAddress && score >= threshold) {
          filtered.push(ethAddress);
        }
      }
    }

    return NextResponse.json({ addresses: filtered });
  } catch (error) {
    console.error('Error filtering by Neynar score:', error);
    return NextResponse.json({ error: 'Failed to filter addresses' }, { status: 500 });
  }
}
