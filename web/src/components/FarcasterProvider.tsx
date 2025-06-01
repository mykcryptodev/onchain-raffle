'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the Farcaster SDK when the component mounts
    const initializeSDK = async () => {
      try {
        // Call ready when the app is ready to be displayed
        // This will hide the Farcaster splash screen
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized');
      } catch (error) {
        console.error('Error initializing Farcaster SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  return <>{children}</>;
} 