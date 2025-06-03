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

interface CastLikesResponse {
  reactions: {
    user: NeynarUser;
  }[];
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
    const cacheKey = `neynar:cast-likes:${cleanHash}`;
    
    // Check cache first (cache for 30 seconds since likes can change frequently)
    const cachedLikes = await redisCache.get<NeynarUser[]>(cacheKey);
    if (cachedLikes) {
      console.log(`Cache hit for cast likes: ${cleanHash}`);
      return NextResponse.json({ users: cachedLikes });
    }

    console.log(`Fetching cast likes for hash: ${cleanHash}`);

    // Fetch the cast reactions (likes)
    const likesResponse = await fetch(`https://api.neynar.com/v2/farcaster/reactions/cast?hash=${encodeURIComponent(cleanHash)}&types=likes&limit=100`, {
      headers: {
        'x-api-key': NEYNAR_API_KEY,
      },
    });

    if (!likesResponse.ok) {
      const errorText = await likesResponse.text();
      console.error('Neynar API error:', errorText);
      
      if (likesResponse.status === 404) {
        return NextResponse.json({ error: 'Cast not found. Please check the hash and try again.' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: `Failed to fetch cast likes: ${likesResponse.status}`,
        details: errorText
      }, { status: likesResponse.status });
    }

    const likesData: CastLikesResponse = await likesResponse.json();
    const users = likesData.reactions?.map(reaction => reaction.user) || [];

    // Cache results for 30 seconds
    await redisCache.set(cacheKey, users, 30);
    
    console.log(`Found ${users.length} users who liked the cast`);
    
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error in cast likes fetch:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cast likes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 