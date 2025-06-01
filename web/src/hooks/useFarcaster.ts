'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { toast } from 'react-toastify';

interface FarcasterContext {
  user: any | null;
  isLoading: boolean;
  error: Error | null;
  shareRaffle: (raffleAddress: string) => Promise<void>;
  isInFarcasterContext: boolean;
}

export function useFarcaster(): FarcasterContext {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInFarcasterContext, setIsInFarcasterContext] = useState(false);

  useEffect(() => {
    const getContext = async () => {
      try {
        setIsLoading(true);
        // Get the Farcaster context which includes user info
        const context = await sdk.context;
        setUser(context?.user || null);
        // Check if we're in a Farcaster frame by checking if context exists
        setIsInFarcasterContext(!!context);
      } catch (err) {
        console.error('Error getting Farcaster context:', err);
        setError(err as Error);
        setIsInFarcasterContext(false);
      } finally {
        setIsLoading(false);
      }
    };

    getContext();
  }, []);

  const shareRaffle = async (raffleAddress: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
    const raffleUrl = `${baseUrl}/raffle/${raffleAddress}`;
    const shareText = `Check out this raffle on rofl.house! 🎟️`;
    
    try {
      // Check if we're in a Farcaster context
      if (isInFarcasterContext) {
        // Use native Farcaster composer with the raffle URL as an embed
        await sdk.actions.composeCast({
          text: shareText,
          embeds: [raffleUrl],
        });
        return;
      }
      
      // Not in Farcaster context, try native sharing
      if (navigator.share && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'Rofl House Raffle',
            text: shareText,
            url: raffleUrl,
          });
          return;
        } catch (shareError) {
          // User cancelled share or error occurred, fall through to clipboard
          if ((shareError as Error).name !== 'AbortError') {
            console.error('Error with native share:', shareError);
          }
        }
      }
      
      // Fall back to copying to clipboard
      try {
        await navigator.clipboard.writeText(raffleUrl);
        toast.success('Raffle link copied to clipboard!');
      } catch (clipboardError) {
        // Final fallback: create a temporary input element
        const input = document.createElement('input');
        input.value = raffleUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast.success('Raffle link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing raffle:', err);
      toast.error('Failed to share raffle. Please try again.');
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    shareRaffle,
    isInFarcasterContext,
  };
} 