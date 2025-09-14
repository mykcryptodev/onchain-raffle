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
      if (cached && typeof cached.score === 'number') {
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

      const fids: number[] = [];
      const addressToUser: Record<string, NeynarUser> = {};
      const missingSet = new Set(missing);

      for (const user of users) {
        const possible = [
          user.custody_address?.toLowerCase(),
          ...(user.verified_addresses?.eth_addresses?.map(a => a.toLowerCase()) || []),
          user.verified_addresses?.primary?.eth_address?.toLowerCase(),
        ].filter(Boolean) as string[];

        const matched = possible.find((a) => missingSet.has(a));
        if (matched && typeof user.fid === 'number') {
          fids.push(user.fid);
          addressToUser[matched] = user;
          missingSet.delete(matched);
        }
      }

      if (fids.length > 0) {
        const scoreUrl = new URL('https://api.neynar.com/v2/farcaster/users');
        scoreUrl.searchParams.set('fids', fids.join(','));

        const scoreResp = await fetch(scoreUrl.toString(), {
          headers: {
            'x-api-key': NEYNAR_API_KEY,
          },
        });

        if (!scoreResp.ok) {
          const errorText = await scoreResp.text();
          console.error('Neynar score API error:', errorText);
          return NextResponse.json({ error: 'Failed to fetch scores' }, { status: scoreResp.status });
        }

        const scoreData: UsersResponse = await scoreResp.json();
        const scoreUsers = scoreData.result?.users || scoreData.users || [];
        const scoreMap: Record<number, number> = {};
        for (const u of scoreUsers) {
          if (typeof u.fid === 'number') {
            scoreMap[u.fid] = u.score ?? 0;
          }
        }

        for (const [addr, user] of Object.entries(addressToUser)) {
          user.score = scoreMap[user.fid] ?? 0;
          cachedUsers[addr] = user;
          await redisCache.set(`neynar:address:${addr}`, user, 3600);
        }
      }
    }

    const filtered = uniqueAddresses.filter((addr) => {
      const user = cachedUsers[addr];
      return user && (user.score ?? 0) >= threshold;
    });

    return NextResponse.json({ addresses: filtered });
  } catch (error) {
    console.error('Error filtering by Neynar score:', error);
    return NextResponse.json({ error: 'Failed to filter addresses' }, { status: 500 });
  }
}
