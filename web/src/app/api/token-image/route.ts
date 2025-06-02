import { chain } from '@/constants/chain';
import { client } from '@/constants/thirdweb';
import { NextRequest, NextResponse } from 'next/server';
import { getContract, readContract } from 'thirdweb';

// Function to try fetching image from token contract (e.g., Clanker tokens)
async function tryFetchTokenImage(tokenAddress: string): Promise<NextResponse | null> {
  try {
    const tokenContract = getContract({
      chain,
      address: tokenAddress,
      client,
    });

    const image = await readContract({
      contract: tokenContract,
      method: "function image() view returns (string)",
    });

    if (image) {
      const imageResponse = await fetch(image);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });
      }
    }
  } catch (error) {
    // If reading the contract fails, return null
    console.log('Failed to fetch image from token contract:', error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainName = searchParams.get('chainName');
    const tokenAddress = searchParams.get('tokenAddress');

    if (!chainName || !tokenAddress) {
      return new NextResponse('Missing required parameters: chainName and tokenAddress', {
        status: 400,
      });
    }

    // Make request to CoinGecko API
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${chainName.toLowerCase()}/contract/${tokenAddress}`;
    
    const res = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour
      next: { revalidate: 3600 }
    });

    if (!res.ok) {      
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        return tokenImage;
      }
      return new NextResponse(null, { status: 404 });
    }

    const json = await res.json() as { image: { large: string } };
    const imageUrl = json.image?.large;

    if (!imageUrl) {
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        return tokenImage;
      }
      return new NextResponse(null, { status: 404 });
    }

    // Fetch the actual image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        return tokenImage;
      }
      return new NextResponse(null, { status: 404 });
    }

    // Get the content type
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Return the image with proper headers
    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error fetching token image:', error);
    return new NextResponse(null, { status: 500 });
  }
} 