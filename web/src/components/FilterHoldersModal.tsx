"use client";
import { FC, useState } from "react";
import { isAddress } from "thirdweb/utils";

interface FilterHoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: string[];
  onFilter: (addresses: string[]) => void;
}

export const FilterHoldersModal: FC<FilterHoldersModalProps> = ({ isOpen, onClose, addresses, onFilter }) => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isValidToken = tokenAddress && isAddress(tokenAddress);

  const handleClose = () => {
    setTokenAddress("");
    setAmount("");
    setError("");
    onClose();
  };

  const handleFilter = async () => {
    if (!isValidToken) {
      setError("Invalid token address");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/holders/filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses, token: tokenAddress, amount }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to filter addresses");
      }
      onFilter(data.addresses || []);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter addresses");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-4">Filter by Holders</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Token Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              {tokenAddress && !isValidToken && <p className="text-red-500 text-sm mt-1">Invalid address format</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Minimum Amount</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleFilter}
                disabled={!isValidToken || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {isLoading ? "Filtering..." : "Apply Filter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
