"use client";

import { useEffect, useRef } from "react";
import { getContract, watchContractEvents } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import { balanceOf } from "thirdweb/extensions/erc20";
import { toast } from "react-toastify";

interface WatchRaffleProps {
  raffleAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  onWinnerSelected: (winner: `0x${string}`) => void;
  onPrizeDistributed: () => void;
  onBalanceUpdate: (balance: string) => void;
  onRandomRequested?: (requestId: bigint) => void;
  prizeDistributed?: boolean; // Add this to know if we should stop watching
  hasWinner?: boolean; // Add this to reduce watching after winner is selected
}

export function WatchRaffle({ 
  raffleAddress, 
  tokenAddress, 
  onWinnerSelected, 
  onPrizeDistributed,
  onBalanceUpdate,
  onRandomRequested,
  prizeDistributed = false,
  hasWinner = false
}: WatchRaffleProps) {
  const processedEvents = useRef<Set<string>>(new Set());
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const raffleContract = getContract({
    client,
    chain,
    address: raffleAddress,
  });

  useEffect(() => {
    // Don't watch events if the raffle is completed
    if (prizeDistributed) {
      console.log('Raffle is completed, not watching events');
      return;
    }

    let isMounted = true;
    let unwatch: (() => void) | undefined;
    
    const setupEventWatcher = async () => {
      try {
        // Get the latest block number to only watch new events
        const { getRpcClient, eth_blockNumber } = await import("thirdweb/rpc");
        const rpc = getRpcClient({ client, chain });
        const currentBlock = await eth_blockNumber(rpc);
        
        if (!isMounted) return;
        
        // Determine which events to watch based on raffle state
        const eventsToWatch = [];
        
        // Always watch for winner selection unless we have a winner
        if (!hasWinner) {
          eventsToWatch.push(raffleAbi.winnerSelectedEvent());
          eventsToWatch.push(raffleAbi.randomRequestedEvent());
          eventsToWatch.push(raffleAbi.prizeFundedEvent());
        } else {
          // If we have a winner, only watch for prize distribution
          eventsToWatch.push(raffleAbi.prizeDistributedEvent());
        }
        
        // Only set up watcher if we have events to watch
        if (eventsToWatch.length === 0) {
          console.log('No events to watch');
          return;
        }
        
        // Watch for the events
        unwatch = watchContractEvents({
          contract: raffleContract,
          events: eventsToWatch,
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

              if (event.eventName === "WinnerSelected") {
                const args = event.args as { winner: `0x${string}` };
                const winnerAddress = args.winner;
                console.log("Winner selected:", winnerAddress);
                
                // Update the parent component
                onWinnerSelected(winnerAddress);
                
                // Invalidate Redis cache for this raffle
                try {
                  await fetch('/api/cache/invalidate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: raffleAddress }),
                  });
                  console.log('Invalidated cache for raffle after winner selection');
                } catch (error) {
                  console.error('Failed to invalidate cache:', error);
                }

                toast.dismiss();
                
                // Show a toast notification
                toast.success(`Winner selected: ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}!`, {
                  autoClose: 8000,
                });
                
                // Stop watching other events now that we have a winner
                if (unwatch) {
                  unwatch();
                }
              } else if (event.eventName === "RandomRequested") {
                const args = event.args as { requestId: bigint };
                const requestId = args.requestId;
                console.log("Random requested with ID:", requestId);
                
                // Notify parent component if callback is provided
                if (onRandomRequested) {
                  onRandomRequested(requestId);
                }
                
                // Show a toast notification
                toast.loading("Requesting randomness from Chainlink VRF...", {
                  autoClose: 5000,
                });
              } else if (event.eventName === "PrizeDistributed") {
                const args = event.args as { winner: `0x${string}`; amount: bigint };
                const winnerAddress = args.winner;
                const amount = args.amount;
                console.log("Prize distributed:", winnerAddress, amount);
                
                // Update the parent component
                onPrizeDistributed();
                
                // Invalidate Redis cache for this raffle
                // Note: After this, the raffle will be cached permanently as completed
                try {
                  await fetch('/api/cache/invalidate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: raffleAddress }),
                  });
                  console.log('Invalidated cache for raffle after prize distribution');
                } catch (error) {
                  console.error('Failed to invalidate cache:', error);
                }
                
                // Show a toast notification
                toast.success(`Prize distributed to ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}!`, {
                  autoClose: 8000,
                });
                
                // Stop watching - raffle is complete
                if (unwatch) {
                  unwatch();
                }
              } else if (event.eventName === "PrizeFunded") {
                const args = event.args as { from: `0x${string}`; amount: bigint };
                const from = args.from;
                const amount = args.amount;
                console.log("Prize funded by:", from, "amount:", amount);
                
                // Clear any existing timeout
                if (balanceUpdateTimeoutRef.current) {
                  clearTimeout(balanceUpdateTimeoutRef.current);
                }
                
                // Debounce balance updates to prevent rapid successive fetches
                balanceUpdateTimeoutRef.current = setTimeout(async () => {
                  // Fetch the new balance
                  try {
                    const tokenContract = getContract({
                      client,
                      chain,
                      address: tokenAddress,
                    });
                    
                    const newBalance = await balanceOf({
                      contract: tokenContract,
                      address: raffleAddress,
                    });
                    
                    // Update the parent component
                    onBalanceUpdate(newBalance.toString());
                    
                    // Show a toast notification
                    toast.success(`Raffle funded by ${from.slice(0, 6)}...${from.slice(-4)}`, {
                      autoClose: 5000,
                    });
                  } catch (error) {
                    console.error("Error fetching new balance:", error);
                  }
                }, 1000); // Wait 1 second before fetching balance to batch multiple events
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
      // Clear any pending balance update timeout
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current);
      }
    };
  }, [raffleContract, raffleAddress, tokenAddress, onWinnerSelected, onPrizeDistributed, onBalanceUpdate, onRandomRequested, prizeDistributed, hasWinner]);

  // This component doesn't render anything
  return null;
} 