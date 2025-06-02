import { isAddress } from "thirdweb";
import RaffleManagement from "./RaffleManagement";
import { RaffleData } from "@/types/raffle";

// Force dynamic rendering to prevent 404s during cold starts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    address: `0x${string}`;
  }>;
}

export default async function RafflePage({ params }: PageProps) {
  const { address } = await params;
  
  // Validate address format
  if (!address || !isAddress(address)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Invalid raffle address</p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  try {
    // Fetch from our cached API route instead of making direct RPC calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/raffles/${address}`, {
      cache: 'no-store', // Ensure fresh data on server-side
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch raffle: ${response.statusText}`);
    }

    const { raffle } = await response.json();

    // The API returns all fields we need now
    const raffleData: RaffleData = {
      owner: raffle.raffleOwner as `0x${string}`,
      token: raffle.raffleToken as `0x${string}`,
      tokenDecimals: raffle.tokenDecimals,
      winner: raffle.raffleWinner as `0x${string}`,
      prizeDistributed: raffle.prizeDistributed,
      balance: raffle.balance,
      lastRequestId: BigInt(raffle.lastRequestId || 0), // Convert string to bigint
    };

    return <RaffleManagement address={address} initialRaffleData={raffleData} />;
  } catch (error) {
    console.error("Error fetching raffle data:", error);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load raffle data</p>
          <p className="text-zinc-400 text-sm mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    );
  }
} 