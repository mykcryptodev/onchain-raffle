"use client";

import { useState } from "react";
import { useActiveAccount, AccountAvatar, AccountName, AccountProvider, TokenProvider, TokenIcon, TokenName, TokenSymbol, ConnectButton, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { getContract, sendTransaction, toTokens, ZERO_ADDRESS } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import Link from "next/link";
import { TokenIconFallback } from "@/components/fallbacks/TokenIcon";
import { AccountAvatarFallback } from "@/components/fallbacks/AccountAvatar";
import { AccountNameFallback } from "@/components/fallbacks/AccountName";
import { FundRaffle } from "@/components/manage/FundRaffle";
import { SelectRandomWinner } from "@/components/manage/SelectRandomWinner";

interface RaffleData {
  owner: `0x${string}`;
  token: `0x${string}`;
  tokenDecimals: number;
  winner: `0x${string}`;
  prizeDistributed: boolean;
  balance: string;
}

interface RaffleManagementProps {
  address: `0x${string}`;
  initialRaffleData: RaffleData;
}

export default function RaffleManagement({ address, initialRaffleData }: RaffleManagementProps) {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  
  const [raffleData, setRaffleData] = useState<RaffleData>(initialRaffleData);
  const [isProcessing, setIsProcessing] = useState(false);

  const raffleContract = getContract({
    client,
    chain,
    address,
  });

  const isOwner = account?.address === raffleData.owner;
  const hasWinner = raffleData.winner !== ZERO_ADDRESS;
  const balanceAsBigInt = BigInt(raffleData.balance);
  console.log({ raffleData })

  const switchChainIfNecessary = async () => {
    if (activeChain?.id !== chain.id) {
      await switchChain(chain);
    }
  };

  const handleDistributePrize = async () => {
    if (!account) return;
    await switchChainIfNecessary();
    
    setIsProcessing(true);
    try {
      const distributeTx = raffleAbi.distributePrize({
        contract: raffleContract,
      });
      
      await sendTransaction({
        transaction: distributeTx,
        account,
      });
      
      // Update prize distributed status
      setRaffleData({ ...raffleData, prizeDistributed: true });
    } catch (error) {
      console.error("Error distributing prize:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Link href="/" className="text-zinc-400 hover:text-zinc-300 mb-4 inline-block">
            ← Back to all raffles
          </Link>
          <h1 className="text-3xl font-bold mb-2">Raffle Management</h1>
          <p className="text-zinc-500 font-mono text-sm">
            {address}
          </p>
        </div>
        <ConnectButton client={client} />
      </div>

      {/* Raffle Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Prize Token */}
        <div className="border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Prize Token</p>
          <TokenProvider address={raffleData.token} client={client} chain={chain}>
            <div className="flex items-center gap-3">
              <TokenIcon 
                loadingComponent={<TokenIconFallback />}
                fallbackComponent={<TokenIconFallback />}
                className="w-10 h-10" 
              />
              <div>
                <div className="flex items-baseline gap-2">
                  <TokenName className="font-medium" />
                  <TokenSymbol className="text-sm text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500">
                  Prize Pool: {toTokens(BigInt(raffleData.balance), raffleData.tokenDecimals)}
                </p>
              </div>
            </div>
          </TokenProvider>
        </div>

        {/* Owner */}
        <div className="border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Owner</p>
          <AccountProvider address={raffleData.owner} client={client}>
            <div className="flex items-center gap-3">
              <AccountAvatar 
                loadingComponent={<AccountAvatarFallback />}
                fallbackComponent={<AccountAvatarFallback />}
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <AccountName 
                  loadingComponent={<AccountNameFallback address={raffleData.owner} />}
                  fallbackComponent={<AccountNameFallback address={raffleData.owner} />}
                  className="font-medium" 
                />
                <p className="text-xs text-zinc-500">
                  {isOwner ? "You are the owner" : "Not the owner"}
                </p>
              </div>
            </div>
          </AccountProvider>
        </div>

        {/* Winner */}
        <div className="border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-zinc-400 uppercase tracking-wide mb-3">Winner</p>
          {!hasWinner ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                <span className="text-xl">🎲</span>
              </div>
              <div>
                <p className="font-medium">No winner yet</p>
                <p className="text-xs text-zinc-500">Awaiting selection</p>
              </div>
            </div>
          ) : (
            <AccountProvider address={raffleData.winner} client={client}>
              <div className="flex items-center gap-3">
                <AccountAvatar className="w-10 h-10 rounded-lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <span>🎉</span>
                    <AccountName className="font-medium" />
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

      {/* Management Actions - Only for Owner */}
      {isOwner && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Management Actions</h2>

          {/* Fund Prize */}
          {!hasWinner && (
            <FundRaffle raffleContract={raffleContract} tokenAddress={raffleData.token} tokenDecimals={raffleData.tokenDecimals} />
          )}

          {/* Select Winner */}
          {!hasWinner && balanceAsBigInt > 0n && (
            <SelectRandomWinner
              raffleContract={raffleContract}
              balance={raffleData.balance}
              hasWinner={hasWinner}
            />
          )}

          {/* Distribute Prize */}
          {hasWinner && !raffleData.prizeDistributed && (
            <div className="border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3">Distribute Prize</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Send the prize pool to the winner
              </p>
              <button
                onClick={handleDistributePrize}
                disabled={isProcessing}
                className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors rounded-lg font-medium"
              >
                {isProcessing ? "Processing..." : "Distribute Prize to Winner"}
              </button>
            </div>
          )}

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
      {!isOwner && account && (
        <div className="border border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400 mb-2">You are not the owner of this raffle.</p>
          <p className="text-sm text-zinc-500">
            Only the raffle owner can manage this raffle.
          </p>
        </div>
      )}

      {/* Connect Wallet Message */}
      {!account && (
        <div className="border border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400 mb-2">Connect your wallet to manage this raffle.</p>
          <ConnectButton client={client} />
          <p className="text-sm text-zinc-500 mt-2">
            If you are the owner, you&apos;ll be able to manage the raffle after connecting.
          </p>
        </div>
      )}
    </div>
  );
} 