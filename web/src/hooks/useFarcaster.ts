'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface FarcasterContext {
  user: any | null;
  isLoading: boolean;
  error: Error | null;
  shareRaffle: (raffleAddress: string) => Promise<void>;
}

export function useFarcaster(): FarcasterContext {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getContext = async () => {
      try {
        setIsLoading(true);
        // Get the Farcaster context which includes user info
        const context = await sdk.context;
        setUser(context?.user || null);
      } catch (err) {
        console.error('Error getting Farcaster context:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    getContext();
  }, []);

  const shareRaffle = async (raffleAddress: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      const raffleUrl = `${baseUrl}/raffle/${raffleAddress}`;
      
      // Use native Farcaster composer with the raffle URL as an embed
      await sdk.actions.composeCast({
        text: `Check out this raffle! 🎟️`,
        embeds: [raffleUrl],
      });
    } catch (err) {
      console.error('Error sharing raffle:', err);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    shareRaffle,
  };
} 