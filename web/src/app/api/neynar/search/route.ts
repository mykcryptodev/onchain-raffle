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

interface SearchResponse {
  result: {
    users: NeynarUser[];
  };
}

interface UserResponse {
  user: NeynarUser;
}

export async function GET(request: Request) {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const getUserDetails = url.searchParams.get('getUserDetails') === 'true';
  const username = url.searchParams.get('username');

  if (!query && !username) {
    return NextResponse.json({ error: 'Query parameter "q" or "username" is required' }, { status: 400 });
  }

  try {
    // If requesting user details by username
    if (getUserDetails && username) {
      const cacheKey = `neynar:user:${username}`;
      
      // Check cache first
      const cachedUser = await redisCache.get<NeynarUser>(cacheKey);
      if (cachedUser) {
        console.log(`Cache hit for user: ${username}`);
        return NextResponse.json({ user: cachedUser });
      }

      console.log(`Fetching user details for: ${username}`);
      
      const userResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/by_username?username=${encodeURIComponent(username)}`, {
        headers: {
          'api_key': NEYNAR_API_KEY,
        },
      });

      if (!userResponse.ok) {
        return NextResponse.json({ error: `Failed to fetch user: ${userResponse.status}` }, { status: userResponse.status });
      }

      const userData: UserResponse = await userResponse.json();
      
      if (!userData.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Cache user data for 1 hour
      await redisCache.set(cacheKey, userData.user, 3600);
      
      return NextResponse.json({ user: userData.user });
    }

    // If searching for users
    if (query) {
      const cacheKey = `neynar:search:${query.toLowerCase()}`;
      
      // Check cache first (cache for 10 minutes)
      const cachedResults = await redisCache.get<NeynarUser[]>(cacheKey);
      if (cachedResults) {
        console.log(`Cache hit for search: ${query}`);
        return NextResponse.json({ users: cachedResults });
      }

      console.log(`Searching for users: ${query}`);
      
      const searchResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'api_key': NEYNAR_API_KEY,
        },
      });

      if (!searchResponse.ok) {
        return NextResponse.json({ error: `Search failed: ${searchResponse.status}` }, { status: searchResponse.status });
      }

      const searchData: SearchResponse = await searchResponse.json();
      const users = searchData.result?.users || [];

      // Cache search results for 10 minutes
      await redisCache.set(cacheKey, users, 600);
      
      return NextResponse.json({ users });
    }

  } catch (error) {
    console.error('Error in user search:', error);
    return NextResponse.json({ 
      error: 'Failed to search users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 