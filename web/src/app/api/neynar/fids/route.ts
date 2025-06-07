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

interface UserResponse {
  result?: { user: NeynarUser };
  user?: NeynarUser;
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

    for (const fid of fidNumbers) {
      const cacheKey = `neynar:fid:${fid}`;
      let user = await redisCache.get<NeynarUser>(cacheKey);

      if (!user) {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/user?fid=${fid}`, {
          headers: { 'x-api-key': NEYNAR_API_KEY },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Neynar API error:', errorText);

          if (response.status === 404) {
            continue; // skip unknown fid
          }

          return NextResponse.json({ error: `Failed to fetch user for fid ${fid}` }, { status: response.status });
        }

        const data: UserResponse = await response.json();
        user = data.result?.user || data.user;

        if (user) {
          await redisCache.set(cacheKey, user, 3600);
        }
      }

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
