import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

if (!NEYNAR_API_KEY) {
  console.error('NEYNAR_API_KEY is not set');
}

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
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
    let { fids } = body as { fids: any };

    if (!Array.isArray(fids)) {
      return NextResponse.json({ error: 'FIDs must be an array' }, { status: 400 });
    }

    const fidNumbers = [...new Set(fids.map((f: any) => Number(f)).filter(n => !isNaN(n)))];

    if (fidNumbers.length === 0) {
      return NextResponse.json({ error: 'No valid FIDs provided' }, { status: 400 });
    }

    const addresses: string[] = [];

    const cachedUsers: { [fid: number]: NeynarUser } = {};
    const missingFids: number[] = [];

    for (const fid of fidNumbers) {
      const cacheKey = `neynar:fid:${fid}`;
      const cached = await redisCache.get<NeynarUser>(cacheKey);
      if (cached) {
        cachedUsers[fid] = cached;
      } else {
        missingFids.push(fid);
      }
    }

    if (missingFids.length > 0) {
      const url = new URL('https://api.neynar.com/v2/farcaster/user/bulk');
      url.searchParams.set('fids', missingFids.join(','));

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
        const cacheKey = `neynar:fid:${user.fid}`;
        await redisCache.set(cacheKey, user, 3600);
        cachedUsers[user.fid] = user;
      }
    }

    for (const fid of fidNumbers) {
      const user = cachedUsers[fid];
      if (user) {
        const ethAddress = user.verified_addresses?.primary?.eth_address || user.custody_address;
        if (ethAddress) {
          addresses.push(ethAddress);
        }
      }
    }

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error in fid address fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}
