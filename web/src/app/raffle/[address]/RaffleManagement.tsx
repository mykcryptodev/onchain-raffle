"use client";

import { useEffect, useState } from "react";
import { useActiveAccount, AccountAvatar, AccountName, AccountProvider, TokenProvider, TokenIcon, TokenName, TokenSymbol, ConnectButton } from "thirdweb/react";
import { getContract, toTokens, ZERO_ADDRESS } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import Link from "next/link";
import { TokenIconFallback } from "@/components/fallbacks/TokenIcon";
import { AccountAvatarFallback } from "@/components/fallbacks/AccountAvatar";
import { AccountNameFallback } from "@/components/fallbacks/AccountName";
import { FundRaffle } from "@/components/manage/FundRaffle";
import { SelectRandomWinner } from "@/components/manage/SelectRandomWinner";
import { DistributePrize } from "@/components/manage/DistributePrize";
import { RaffleData } from "@/types/raffle";
import * as raffleAbi from "@/abis/raffle";
import { balanceOf, decimals } from "thirdweb/extensions/erc20";
import { WatchRaffle } from "@/components/WatchRaffle";
import { useFarcaster } from "@/hooks/useFarcaster";
import { shortenAddress } from "thirdweb/utils";

interface RaffleManagementProps {
  address: `0x${string}`;
  initialRaffleData: RaffleData;
}

export default function RaffleManagement({ address, initialRaffleData }: RaffleManagementProps) {
  const account = useActiveAccount();
  const { shareRaffle } = useFarcaster();
  
  const [raffleData, setRaffleData] = useState<RaffleData>(initialRaffleData);

  const raffleContract = getContract({
    client,
    chain,
    address,
  });

  // Watch for raffle events
  const handleWinnerSelected = (winner: `0x${string}`) => {
    setRaffleData(prev => ({
      ...prev,
      winner,
      lastRequestId: 0n, // Clear the request ID once winner is selected
    }));
  };

  const handlePrizeDistributed = () => {
    setRaffleData(prev => ({
      ...prev,
      prizeDistributed: true,
      balance: "0", // Prize has been distributed, balance is now 0
    }));
  };

  const handleBalanceUpdate = (balance: string) => {
    setRaffleData(prev => ({
      ...prev,
      balance,
    }));
  };

  const handleRandomRequested = (requestId: bigint) => {
    setRaffleData(prev => ({
      ...prev,
      lastRequestId: requestId,
    }));
  };

  useEffect(() => {
    // on mount, fetch the raffle data on the client side to make sure it's up to date
    const fetchRaffleData = async () => {
      const raffleContract = getContract({
        client,
        chain,
        address,
      });

      const [owner, token, winner, prizeDistributed, lastRequestId] = await Promise.all([
        raffleAbi.owner({ contract: raffleContract }),
        raffleAbi.token({ contract: raffleContract }),
        raffleAbi.winner({ contract: raffleContract }),
        raffleAbi.prizeDistributed({ contract: raffleContract }),
        raffleAbi.lastRequestId({ contract: raffleContract }),
      ]);

      const tokenContract = getContract({
        client,
        chain,
        address: token,
      });

      const [tokenDecimals, balance] = await Promise.all([
        decimals({
          contract: tokenContract,
        }),
        balanceOf({
        contract: tokenContract,
        address: address,
      })]);

      setRaffleData({
        owner: owner as `0x${string}`,
        token: token as `0x${string}`,
        winner: winner as `0x${string}`,
        prizeDistributed: prizeDistributed as boolean,
        tokenDecimals: Number(tokenDecimals),
        balance: balance.toString(),
        lastRequestId,
      });
    }
    fetchRaffleData();
  }, [address])

  const isOwner = account?.address === raffleData.owner;
  const hasWinner = raffleData.winner !== ZERO_ADDRESS;
  const isSelectingWinner = raffleData.lastRequestId > 0n && !hasWinner;
  const balanceAsBigInt = BigInt(raffleData.balance);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Event watcher component */}
      <WatchRaffle
        raffleAddress={address}
        tokenAddress={raffleData.token}
        onWinnerSelected={handleWinnerSelected}
        onPrizeDistributed={handlePrizeDistributed}
        onBalanceUpdate={handleBalanceUpdate}
        onRandomRequested={handleRandomRequested}
      />
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div className="min-w-0 flex-1 mr-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-300 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">Raffle Management</h1>
          <p className="text-zinc-500 font-mono text-sm truncate">
            {address}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => shareRaffle(address)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>📤</span>
            Share
          </button>
          <ConnectButton client={client} />
        </div>
      </div>

      {/* Raffle Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Prize Token */}
        <div className="border border-zinc-800 rounded-lg p-6 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Prize Token</p>
          <TokenProvider address={raffleData.token} client={client} chain={chain}>
            <div className="flex items-center gap-3 min-w-0">
              <TokenIcon 
                loadingComponent={<TokenIconFallback />}
                fallbackComponent={<TokenIconFallback />}
                iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${raffleData.token}`}
                className="w-10 h-10 rounded-lg flex-shrink-0" 
              />
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-baseline gap-2">
                  <TokenName className="font-medium truncate" />
                  <TokenSymbol className="text-sm text-zinc-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  Prize Pool: {toTokens(BigInt(raffleData.balance), raffleData.tokenDecimals)}
                </p>
              </div>
            </div>
          </TokenProvider>
        </div>

        {/* Owner */}
        <div className="border border-zinc-800 rounded-lg p-6 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Owner</p>
          <AccountProvider address={raffleData.owner} client={client}>
            <div className="flex items-center gap-3 min-w-0">
              <AccountAvatar 
                loadingComponent={<AccountAvatarFallback />}
                fallbackComponent={<AccountAvatarFallback />}
                className="w-10 h-10 rounded-lg flex-shrink-0"
              />
              <div className="min-w-0 overflow-hidden">
                <AccountName 
                  loadingComponent={<AccountNameFallback address={raffleData.owner} />}
                  fallbackComponent={<AccountNameFallback address={raffleData.owner} />}
                  className="font-medium truncate block" 
                />
                <p className="text-xs text-zinc-500">
                  {isOwner ? "You are the owner" : shortenAddress(raffleData.owner)}
                </p>
              </div>
            </div>
          </AccountProvider>
        </div>

        {/* Winner */}
        <div className="border border-zinc-800 rounded-lg p-6 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Winner</p>
          {isSelectingWinner ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xl animate-spin-slow inline-block">🎲</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium">Selecting winner...</p>
                <p className="text-xs text-zinc-500">Random selection in progress</p>
              </div>
            </div>
          ) : !hasWinner ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎲</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium">No winner yet</p>
                <p className="text-xs text-zinc-500">Awaiting selection</p>
              </div>
            </div>
          ) : (
            <AccountProvider address={raffleData.winner} client={client}>
              <div className="flex items-center gap-3 min-w-0">
                <AccountAvatar className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0">🎉</span>
                    <AccountName className="font-medium truncate" />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {raffleData.prizeDistributed ? "Prize sent" : "Prize pending"}
                  </p>
                </div>
              </div>
            </AccountProvider>
          )}
        </div>
      </div>

      {/* Public Actions - Available to everyone */}
      {account && !hasWinner && (
        <div className="space-y-6 mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Contribute to Raffle</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Anyone can add funds to increase the prize pool! Note: this does not make you eligible to win.
            </p>
          </div>

          {/* Fund Prize - Available to everyone */}
          <FundRaffle 
            raffleContract={raffleContract} 
            tokenAddress={raffleData.token} 
            tokenDecimals={raffleData.tokenDecimals} 
            onFunded={async () => {               
              try {
                const tokenContract = getContract({
                  client,
                  chain,
                  address: raffleData.token,
                });
                
                const { balanceOf } = await import("thirdweb/extensions/erc20");
                const newBalance = await balanceOf({
                  contract: tokenContract,
                  address: address,
                });
                
                setRaffleData(prev => ({
                  ...prev,
                  balance: newBalance.toString()
                }));
              } catch (error) {
                console.error("Error fetching new balance:", error);
              }
            }}
          />
        </div>
      )}

      {/* Management Actions - Only for Owner */}
      {isOwner && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Owner Actions</h2>

          {/* Select Winner */}
          {!hasWinner && balanceAsBigInt > 0n && (
            <SelectRandomWinner
              raffleContract={raffleContract}
              balance={raffleData.balance}
              hasWinner={hasWinner}
            />
          )}

          {/* Distribute Prize */}
          <DistributePrize
            raffleContract={raffleContract}
            hasWinner={hasWinner}
            winner={raffleData.winner}
            prizeDistributed={raffleData.prizeDistributed}
            onSuccess={() => {
              setRaffleData({ ...raffleData, prizeDistributed: true });
            }}
          />

          {/* Completed Raffle */}
          {hasWinner && raffleData.prizeDistributed && (
            <div className="border border-green-800 bg-green-900/20 rounded-lg p-6 text-center">
              <span className="text-4xl mb-3 block">✅</span>
              <h3 className="text-lg font-medium mb-2">Raffle Completed!</h3>
              <p className="text-sm text-zinc-400">
                The prize has been distributed to the winner.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Non-Owner View */}
      {!isOwner && account && hasWinner && !raffleData.prizeDistributed && (
        <div className="border border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400 mb-2">The raffle has ended!</p>
          <p className="text-sm text-zinc-500">
            Waiting for the owner to distribute the prize to the winner.
          </p>
        </div>
      )}

      {/* Connect Wallet Message */}
      {!account && (
        <div className="border border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400 mb-2">Connect your wallet to interact with this raffle.</p>
          <ConnectButton client={client} />
          <p className="text-sm text-zinc-500 mt-2">
            {!hasWinner ? "Once connected, you can contribute to the prize pool!" : "View the raffle results."}
          </p>
        </div>
      )}
    </div>
  );
} 