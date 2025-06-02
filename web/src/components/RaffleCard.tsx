import { AccountAvatar, AccountName, AccountProvider, TokenIcon, TokenName, TokenProvider, TokenSymbol } from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { ZERO_ADDRESS } from "thirdweb";
import Link from "next/link";
import AccountAvatarFallback from "./fallbacks/AccountAvatar";
import AccountNameFallback from "./fallbacks/AccountName";
import { TokenIconFallback } from "./fallbacks/TokenIcon";
import { RaffleCardData } from "@/types/raffle";
import { shortenAddress } from "thirdweb/utils";

type RaffleCardProps = Omit<RaffleCardData, 'raffleAddress'> & {
  raffleAddress: string;
};

export function RaffleCard({ raffleAddress, raffleOwner, raffleToken, raffleWinner, prizeDistributed }: RaffleCardProps) {
  const hasWinner = raffleWinner !== ZERO_ADDRESS;
  
  return (
    <div className="p-6 border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link 
            className="text-lg font-semibold"
            href={`${chain.blockExplorers?.[0]?.url}/address/${raffleAddress}`} 
            target="_blank">
            {shortenAddress(raffleAddress)}
          </Link>
        </div>
        <Link
          href={`/raffle/${raffleAddress}`}
          className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg font-medium text-sm"
          prefetch={false}
        >
          View Raffle
        </Link>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Section */}
        <Link href={`${chain.blockExplorers?.[0]?.url}/token/${raffleToken}`} className="space-y-2 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide">Prize Token</p>
          <TokenProvider address={raffleToken} client={client} chain={chain}>
            <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg min-w-0">
              <TokenIcon 
                loadingComponent={<TokenIconFallback />}
                fallbackComponent={<TokenIconFallback />}
                iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${raffleToken}`}
                className="w-10 h-10 rounded-lg flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <TokenName className="font-medium text-base truncate" />
                  <TokenSymbol className="text-sm text-zinc-400 flex-shrink-0" />
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {raffleToken.slice(0, 6)}...{raffleToken.slice(-4)}
                </span>
              </div>
            </div>
          </TokenProvider>
        </Link>

        {/* Owner Section */}
        <Link href={`${chain.blockExplorers?.[0]?.url}/address/${raffleOwner}`} className="space-y-2 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide">Created By</p>
          <AccountProvider address={raffleOwner} client={client}>
            <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg min-w-0">
              <AccountAvatar 
                loadingComponent={<AccountAvatarFallback />}
                fallbackComponent={<AccountAvatarFallback />} 
                className="w-10 h-10 rounded-lg flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <AccountName 
                  loadingComponent={<AccountNameFallback address={raffleOwner} />}
                  fallbackComponent={<AccountNameFallback address={raffleOwner} />}
                  className="font-medium text-base truncate"
                />
                <span className="text-xs text-zinc-500 font-mono">
                  {raffleOwner.slice(0, 6)}...{raffleOwner.slice(-4)}
                </span>
              </div>
            </div>
          </AccountProvider>
        </Link>

        {/* Winner Section */}
        <Link href={`${chain.blockExplorers?.[0]?.url}/address/${raffleWinner}`} className="space-y-2 min-w-0">
          <p className="text-sm text-zinc-400 uppercase tracking-wide">
            Winner {prizeDistributed && hasWinner && <span className="text-green-500">✓</span>}
          </p>
          {!hasWinner ? (
            <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg min-w-0">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎲</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-base text-zinc-400">No winner yet</span>
                <span className="text-xs text-zinc-500">Raffle still active</span>
              </div>
            </div>
          ) : (
            <AccountProvider address={raffleWinner} client={client}>
              <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg min-w-0">
                <AccountAvatar 
                  loadingComponent={<AccountAvatarFallback />}
                  fallbackComponent={<AccountAvatarFallback />}
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl flex-shrink-0">🎉</span>
                    <AccountName 
                      loadingComponent={<AccountNameFallback address={raffleWinner} />}
                      fallbackComponent={<AccountNameFallback address={raffleWinner} />}
                      className="font-medium text-base truncate"
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {raffleWinner.slice(0, 6)}...{raffleWinner.slice(-4)}
                  </span>
                </div>
              </div>
            </AccountProvider>
          )}
        </Link>
      </div>
    </div>
  );
} 