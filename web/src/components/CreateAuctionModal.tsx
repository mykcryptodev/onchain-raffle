"use client";

import { FC, useState } from "react";
import { TransactionButton } from "thirdweb/react";
import { createAuction } from "thirdweb/extensions/marketplace";
import { auctionsContract } from "@/constants/contracts";
import { isAddress } from "thirdweb/utils";
import { toast } from "react-toastify";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateAuctionModal: FC<CreateAuctionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nftAddress, setNftAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [buyoutPrice, setBuyoutPrice] = useState("");
  const [minimumBid, setMinimumBid] = useState("");

  if (!isOpen) return null;

  const isValidNft = nftAddress && isAddress(nftAddress);
  const isValidTokenId = tokenId !== "";

  const auctionTx = createAuction({
    contract: auctionsContract,
    assetContractAddress: nftAddress as `0x${string}`,
    tokenId: BigInt(tokenId || 0),
    buyoutBidAmount: buyoutPrice || "0",
    minimumBidAmount: minimumBid || "0",
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-zinc-900 rounded-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-4">Create New Auction</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="nftAddress" className="block text-sm font-medium text-zinc-400 mb-2">
                NFT Address
              </label>
              <input
                id="nftAddress"
                type="text"
                placeholder="0x..."
                value={nftAddress}
                onChange={(e) => setNftAddress(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              {nftAddress && !isValidNft && (
                <p className="text-red-500 text-sm mt-1">Invalid address format</p>
              )}
            </div>
            <div>
              <label htmlFor="tokenId" className="block text-sm font-medium text-zinc-400 mb-2">
                Token ID
              </label>
              <input
                id="tokenId"
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="buyoutPrice" className="block text-sm font-medium text-zinc-400 mb-2">
                Buyout Price (ETH)
              </label>
              <input
                id="buyoutPrice"
                type="text"
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="minBid" className="block text-sm font-medium text-zinc-400 mb-2">
                Minimum Bid (ETH)
              </label>
              <input
                id="minBid"
                type="text"
                value={minimumBid}
                onChange={(e) => setMinimumBid(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <TransactionButton
                transaction={() => auctionTx}
                disabled={!isValidNft || !isValidTokenId}
                onTransactionSent={() => toast.loading("Creating auction...")}
                onTransactionConfirmed={() => {
                  toast.dismiss();
                  onSuccess?.();
                  onClose();
                  setNftAddress("");
                  setTokenId("");
                  setBuyoutPrice("");
                  setMinimumBid("");
                }}
                onError={(error) => {
                  toast.dismiss();
                  console.error("Error creating auction:", error);
                  toast.error("Failed to create auction. Please try again.");
                }}
              >
                Create Auction
              </TransactionButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
