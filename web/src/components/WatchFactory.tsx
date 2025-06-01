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

export function WatchFactory() {
  const account = useActiveAccount();
  const router = useRouter();
  const processedEvents = useRef<Set<string>>(new Set());

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
        
        // Watch for RaffleCreated events
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
                console.log(`Skipping already processed RaffleCreated event:`, eventId);
                continue;
              }
              
              // Mark this event as processed
              processedEvents.current.add(eventId);
              console.log(`Processing RaffleCreated event:`, eventId);
              
              const creator = event.args.creator as `0x${string}`;
              const raffleAddress = event.args.raffle as `0x${string}`;
              
              console.log("Raffle created by:", creator, "at address:", raffleAddress);
              
              // Check if the creator is the connected address
              if (creator.toLowerCase() === account.address.toLowerCase()) {
                console.log("Raffle created by connected user, redirecting...");                
                // Redirect to the raffle page
                router.push(`/raffle/${raffleAddress}`);
              }
            }
          },
        });
      } catch (error) {
        console.error("Error setting up factory event watcher:", error);
      }
    };
    
    setupEventWatcher();

    return () => {
      isMounted = false;
      if (unwatch) {
        unwatch();
      }
    };
  }, [account?.address, router]);

  // This component doesn't render anything
  return null;
} 