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
  profile: {
    bio: {
      text: string;
    };
  };
  pfp_url: string;
  verified_addresses?: {
    eth_addresses?: string[];
    primary?: {
      eth_address?: string;
    };
  };
}

interface CastQuotesResponse {
  casts: {
    author: NeynarUser;
  }[];
  next?: {
    cursor: string;
  };
}

export async function POST(request: Request) {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { castHash } = body;

    if (!castHash) {
      return NextResponse.json({ error: 'Cast hash is required' }, { status: 400 });
    }

    // Validate cast hash format (should be 0x followed by hex characters)
    const hashPattern = /^0x[a-fA-F0-9]+$/;
    if (!hashPattern.test(castHash.trim())) {
      return NextResponse.json({ error: 'Invalid cast hash format. Must be a hex string starting with 0x.' }, { status: 400 });
    }

    const cleanHash = castHash.trim();
    const cacheKey = `neynar:cast-quotes:${cleanHash}`;
    
    // Check cache first (cache for 30 seconds since quotes can change frequently)
    const cachedQuotes = await redisCache.get<NeynarUser[]>(cacheKey);
    if (cachedQuotes) {
      console.log(`Cache hit for cast quotes: ${cleanHash}`);
      return NextResponse.json({ users: cachedQuotes });
    }

    console.log(`Fetching cast quotes for hash: ${cleanHash}`);

    const allUsers: NeynarUser[] = [];
    const seenFids = new Set<number>();
    let cursor: string | undefined = undefined;
    let page = 0;

    while (true) {
      const url = new URL('https://api.neynar.com/v2/farcaster/cast/quotes');
      url.searchParams.set('hash', cleanHash);
      url.searchParams.set('limit', '100');
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const quotesResponse = await fetch(url.toString(), {
        headers: {
          'x-api-key': NEYNAR_API_KEY,
        },
      });

      if (!quotesResponse.ok) {
        const errorText = await quotesResponse.text();
        console.error('Neynar API error:', errorText);

        if (quotesResponse.status === 404) {
          return NextResponse.json({ error: 'Cast not found. Please check the hash and try again.' }, { status: 404 });
        }

        return NextResponse.json({
          error: `Failed to fetch cast quotes: ${quotesResponse.status}`,
          details: errorText
        }, { status: quotesResponse.status });
      }

      const quotesData: CastQuotesResponse = await quotesResponse.json();
      const pageUsers = quotesData.casts?.map(cast => cast.author) || [];

      const beforeCount = allUsers.length;
      for (const user of pageUsers) {
        if (!seenFids.has(user.fid)) {
          seenFids.add(user.fid);
          allUsers.push(user);
        }
      }

      const nextCursor = quotesData.next?.cursor;
      const fetchedAll = !nextCursor || pageUsers.length === 0 || allUsers.length === beforeCount;

      if (fetchedAll) {
        break;
      }

      // Stop if Neynar returns the same cursor to avoid infinite loops
      if (cursor && nextCursor === cursor) {
        break;
      }

      cursor = nextCursor;
      page += 1;

      // Safety limit to avoid infinite loops
      if (page > 50) {
        console.warn('Stopping pagination after 50 pages');
        break;
      }
    }

    // Cache results for 30 seconds
    await redisCache.set(cacheKey, allUsers, 30);

    console.log(`Found ${allUsers.length} users who quoted the cast`);

    return NextResponse.json({ users: allUsers });

  } catch (error) {
    console.error('Error in cast quotes fetch:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cast quotes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
