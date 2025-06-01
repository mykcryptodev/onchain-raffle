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
}

export function WatchRaffle({ 
  raffleAddress, 
  tokenAddress, 
  onWinnerSelected, 
  onPrizeDistributed,
  onBalanceUpdate 
}: WatchRaffleProps) {
  const processedEvents = useRef<Set<string>>(new Set());

  const raffleContract = getContract({
    client,
    chain,
    address: raffleAddress,
  });

  useEffect(() => {
    let isMounted = true;
    let unwatch: (() => void) | undefined;
    
    const setupEventWatcher = async () => {
      try {
        // Get the latest block number to only watch new events
        const { getRpcClient, eth_blockNumber } = await import("thirdweb/rpc");
        const rpc = getRpcClient({ client, chain });
        const currentBlock = await eth_blockNumber(rpc);
        
        if (!isMounted) return;
        
        // Watch for the events
        unwatch = watchContractEvents({
          contract: raffleContract,
          events: [
            raffleAbi.winnerSelectedEvent(),
            raffleAbi.prizeDistributedEvent(),
            raffleAbi.prizeFundedEvent(),
          ],
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
                const winnerAddress = event.args.winner as `0x${string}`;
                console.log("Winner selected:", winnerAddress);
                
                // Update the parent component
                onWinnerSelected(winnerAddress);
                
                // Show a toast notification
                toast.success(`Winner selected: ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}`, {
                  autoClose: 8000,
                });
              } else if (event.eventName === "PrizeDistributed") {
                const winnerAddress = event.args.winner as `0x${string}`;
                const amount = event.args.amount as bigint;
                console.log("Prize distributed:", winnerAddress, amount);
                
                // Update the parent component
                onPrizeDistributed();
                
                // Show a toast notification
                toast.success(`Prize distributed to ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}!`, {
                  autoClose: 8000,
                });
              } else if (event.eventName === "PrizeFunded") {
                const from = event.args.from as `0x${string}`;
                const amount = event.args.amount as bigint;
                console.log("Prize funded by:", from, "amount:", amount);
                
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
                  toast.info(`Raffle funded by ${from.slice(0, 6)}...${from.slice(-4)}`, {
                    autoClose: 5000,
                  });
                } catch (error) {
                  console.error("Error fetching new balance:", error);
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
  }, [raffleContract, raffleAddress, tokenAddress, onWinnerSelected, onPrizeDistributed, onBalanceUpdate]);

  // This component doesn't render anything
  return null;
} 