import { chain } from '@/constants/chain';
import { client } from '@/constants/thirdweb';
import { redisCache } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getContract, readContract } from 'thirdweb';

// Function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Function to generate cache key for token images
function getTokenImageCacheKey(chainName: string, tokenAddress: string): string {
  return `token-image:${chainName.toLowerCase()}:${tokenAddress.toLowerCase()}`;
}

// Function to try fetching image from token contract (e.g., Clanker tokens)
async function tryFetchTokenImage(tokenAddress: string): Promise<{ imageBuffer: ArrayBuffer; contentType: string } | null> {
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
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        return { imageBuffer, contentType };
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

    // Check Redis cache first
    const cacheKey = getTokenImageCacheKey(chainName, tokenAddress);
    const cachedData = await redisCache.get<{ image: string; contentType: string }>(cacheKey);
    
    if (cachedData) {
      console.log(`Token image cache hit for ${chainName}:${tokenAddress}`);
      const imageBuffer = base64ToArrayBuffer(cachedData.image);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': cachedData.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache since images are permanent
        },
      });
    }

    console.log(`Token image cache miss for ${chainName}:${tokenAddress}`);

    // Make request to CoinGecko API
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${chainName.toLowerCase()}/contract/${tokenAddress}`;
    
    const res = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {      
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        // Extract the image data and store in Redis
        const imageData = tokenImage.imageBuffer;
        const contentType = tokenImage.contentType;
        
        // Store in Redis permanently
        await redisCache.set(cacheKey, {
          image: arrayBufferToBase64(imageData),
          contentType: contentType,
        });
        
        return new NextResponse(imageData, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
      return new NextResponse(null, { status: 404 });
    }

    const json = await res.json() as { image: { large: string } };
    const imageUrl = json.image?.large;

    if (!imageUrl) {
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        // Extract the image data and store in Redis
        const imageData = tokenImage.imageBuffer;
        const contentType = tokenImage.contentType;
        
        // Store in Redis permanently
        await redisCache.set(cacheKey, {
          image: arrayBufferToBase64(imageData),
          contentType: contentType,
        });
        
        return new NextResponse(imageData, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
      return new NextResponse(null, { status: 404 });
    }

    // Fetch the actual image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      // Try fetching from token contract before returning 404
      const tokenImage = await tryFetchTokenImage(tokenAddress);
      if (tokenImage) {
        // Extract the image data and store in Redis
        const imageData = tokenImage.imageBuffer;
        const contentType = tokenImage.contentType;
        
        // Store in Redis permanently
        await redisCache.set(cacheKey, {
          image: arrayBufferToBase64(imageData),
          contentType: contentType,
        });
        
        return new NextResponse(imageData, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
      return new NextResponse(null, { status: 404 });
    }

    // Get the content type
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Return the image with proper headers
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Store in Redis permanently
    await redisCache.set(cacheKey, {
      image: arrayBufferToBase64(imageBuffer),
      contentType: contentType,
    });
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache since images are permanent
      },
    });

  } catch (error) {
    console.error('Error fetching token image:', error);
    return new NextResponse(null, { status: 500 });
  }
} 