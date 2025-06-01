"use client";

import { FC, useState } from "react";
import { TransactionButton, TokenIcon, TokenName, TokenProvider, TokenSymbol } from "thirdweb/react";
import { createRaffle } from "@/abis/factory";
import { factoryContract } from "@/constants/contracts";
import { isAddress } from "thirdweb/utils";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { TokenIconFallback } from "./fallbacks/TokenIcon";

interface CreateRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateRaffleModal: FC<CreateRaffleModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const [tokenAddress, setTokenAddress] = useState("");

  if (!isOpen) return null;

  const isValidAddress = tokenAddress && isAddress(tokenAddress);

  const createRaffleTx = createRaffle({
    contract: factoryContract,
    token: tokenAddress as `0x${string}`,
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-zinc-900 rounded-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <h2 className="text-2xl font-bold mb-4">Create New Raffle</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="tokenAddress" className="block text-sm font-medium text-zinc-400 mb-2">
                Prize Token Address
              </label>
              <input
                id="tokenAddress"
                type="text"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              {tokenAddress && !isValidAddress && (
                <p className="text-red-500 text-sm mt-1">Invalid address format</p>
              )}
            </div>

            {/* Token Preview */}
            {isValidAddress && (
              <div className="p-4 bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-400 mb-2">Token Preview</p>
                <TokenProvider address={tokenAddress as `0x${string}`} client={client} chain={chain}>
                  <div className="flex items-center gap-3">
                    <TokenIcon 
                      className="w-10 h-10"
                      iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${tokenAddress}`}
                      loadingComponent={<TokenIconFallback />}
                      fallbackComponent={<TokenIconFallback />}
                    />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <TokenName className="font-medium" />
                        <TokenSymbol className="text-sm text-zinc-400" />
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                </TokenProvider>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <TransactionButton
                transaction={() => createRaffleTx}
                disabled={!isValidAddress}
                onTransactionConfirmed={async (receipt) => {
                  console.log("Raffle created!", receipt);
                  onSuccess?.();
                  onClose();
                  setTokenAddress("");
                }}
                onError={(error) => {
                  console.error("Error creating raffle:", error);
                }}
              >
                Create Raffle
              </TransactionButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 