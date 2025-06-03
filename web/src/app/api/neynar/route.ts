import { NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

if (!NEYNAR_API_KEY) {
  console.error('NEYNAR_API_KEY is not set');
}

// Hardcoded list of usernames who quote-casted
const QUOTE_CASTER_USERNAMES = [
  'keremgurel',
  'calmo', 
  'jake',
  'rkass.eth',
  'brianethier',
  'chunter',
  'tamastorok.eth',
  'polak.eth',
  'basedbraden',
  'zexrtw',
  'olorunsniper',
  'basevip',
  'vsck',
  'ghostbo4.eth',
  'abdullaalkamil',
  'zeck',
  'chidz',
  'cryptobeijing',
  'basedkeren'
];

interface UserResponse {
  user?: {
    fid: number;
    custody_address: string;
    verified_addresses?: {
      eth_addresses?: string[];
      primary?: {
        eth_address?: string;
      };
    };
  };
}

interface BulkUserResponse {
  users: Array<{
    fid: number;
    custody_address: string;
    verified_addresses?: {
      eth_addresses?: string[];
      primary?: {
        eth_address?: string;
      };
    };
  }>;
}

export async function POST(request: Request) {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY is not configured' }, { status: 500 });
  }

  try {
    console.log(`Fetching addresses for ${QUOTE_CASTER_USERNAMES.length} hardcoded quote casters`);

    const addresses: string[] = [];
    const successfulUsers: string[] = [];
    const failedUsers: string[] = [];

    // Fetch user data for each username
    for (const username of QUOTE_CASTER_USERNAMES) {
      try {
        console.log(`Looking up user: ${username}`);
        
        const userResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/by_username?username=${encodeURIComponent(username)}`, {
          headers: {
            'api_key': NEYNAR_API_KEY,
          },
        });

        if (!userResponse.ok) {
          console.log(`Failed to fetch user ${username}: ${userResponse.status}`);
          failedUsers.push(username);
          continue;
        }

        const userData: UserResponse = await userResponse.json();
        
        if (!userData.user) {
          console.log(`No user data found for ${username}`);
          failedUsers.push(username);
          continue;
        }

        let address: string | null = null;
        
        // Try to get primary eth address first
        if (userData.user.verified_addresses?.primary?.eth_address) {
          address = userData.user.verified_addresses.primary.eth_address;
        } 
        // Fallback to custody address
        else if (userData.user.custody_address) {
          address = userData.user.custody_address;
        }
        
        if (address && !addresses.includes(address)) {
          addresses.push(address);
          successfulUsers.push(username);
          console.log(`✅ Found address for ${username}: ${address}`);
        } else {
          console.log(`❌ No address found for ${username}`);
          failedUsers.push(username);
        }

        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error fetching user ${username}:`, error);
        failedUsers.push(username);
      }
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`✅ Successfully fetched ${addresses.length} addresses from ${successfulUsers.length} users`);
    console.log(`❌ Failed to fetch ${failedUsers.length} users: ${failedUsers.join(', ')}`);

    return NextResponse.json({ 
      addresses,
      totalUsers: QUOTE_CASTER_USERNAMES.length,
      successfulUsers: successfulUsers.length,
      failedUsers: failedUsers.length,
      searchMethod: 'hardcoded_quote_casters',
      usernames: {
        successful: successfulUsers,
        failed: failedUsers
      }
    });

  } catch (error) {
    console.error('Error fetching quote caster addresses:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch quote caster addresses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 