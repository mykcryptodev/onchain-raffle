"use client";

import { useEffect, useRef } from "react";
import { watchContractEvents } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { factoryContract } from "@/constants/contracts";
import { raffleCreatedEvent } from "@/abis/factory";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useInvalidateRaffles } from "@/hooks/useRaffles";
import { useTokenMetadata } from "@/hooks/useTokenMetadata";

export function WatchFactory() {
  const account = useActiveAccount();
  const router = useRouter();
  const processedEvents = useRef<Set<string>>(new Set());
  const invalidateRaffles = useInvalidateRaffles();

  useEffect(() => {
    if (!account?.address) return;

    let isMounted = true;
    let unwatch: (() => void) | undefined;
    
    const setupEventWatcher = async () => {
      try {
        // Get the latest block number to only watch new events
        const { getRpcClient, eth_blockNumber } = await import("thirdweb/rpc");
        const rpc = getRpcClient({ client, chain });
        const currentBlock = await eth_blockNumber(rpc);
        
        if (!isMounted) return;
        
        // Watch for raffle created events
        unwatch = watchContractEvents({
          contract: factoryContract,
          events: [raffleCreatedEvent()],
          latestBlockNumber: currentBlock,
          onEvents: async (events) => {
            for (const event of events) {
              // Create a unique identifier for this event
              const eventId = `${event.transactionHash}-${event.logIndex ?? 0}`;
              
              // Skip if we've already processed this event
              if (processedEvents.current.has(eventId)) {
                console.log(`Skipping already processed ${event.eventName} event:`, eventId);
                continue;
              }
              
              // Mark this event as processed
              processedEvents.current.add(eventId);
              console.log(`Processing ${event.eventName} event:`, eventId);

              if (event.eventName === "RaffleCreated") {
                const args = event.args as { creator: `0x${string}`; raffle: `0x${string}`; index: bigint };
                const { creator, raffle, index } = args;
                
                console.log("Raffle created:", { index, raffle, creator });
                
                // Only show toast and redirect if the creator is the current user
                if (creator.toLowerCase() === account.address.toLowerCase()) {
                  // Invalidate React Query cache
                  invalidateRaffles();
                  
                  // Also invalidate Redis cache
                  try {
                    await fetch('/api/cache/invalidate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    console.log('Cache invalidated after raffle creation');
                  } catch (error) {
                    console.error('Failed to invalidate cache:', error);
                  }
                  
                  toast.success("Raffle created successfully! Redirecting...", {
                    autoClose: 3000,
                  });
                  
                  // Redirect to the new raffle page after a short delay
                  setTimeout(() => {
                    router.push(`/raffle/${raffle}`);
                  }, 2000);
                } else {
                  // If someone else created a raffle, just invalidate the cache
                  try {
                    await fetch('/api/cache/invalidate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                  } catch (error) {
                    console.error('Failed to invalidate cache:', error);
                  }
                }
              }
            }
          },
        });
      } catch (error) {
        console.error("Error setting up event watcher:", error);
      }
    };
    
    setupEventWatcher();

    return () => {
      isMounted = false;
      if (unwatch) {
        unwatch();
      }
    };
  }, [account, router, invalidateRaffles]);

  // This component doesn't render anything
  return null;
} 