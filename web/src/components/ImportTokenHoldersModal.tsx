"use client";
import { FC, useState } from "react";

interface ImportTokenHoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportTokenHoldersModal: FC<ImportTokenHoldersModalProps> = ({ isOpen, onClose, onImport }) => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHolders = async () => {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/token-holders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAddress: tokenAddress.trim(), minBalance: minBalance.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch token holders");
      }
      setAddresses(data.holders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch token holders");
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (addresses.length > 0) {
      onImport(addresses);
      handleClose();
    }
  };

  const handleClose = () => {
    setTokenAddress("");
    setMinBalance("");
    setAddresses([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-lg w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold mb-2">Import ERC20 Holders</h2>
            <p className="text-sm text-zinc-400">Enter a token address and optional minimum balance.</p>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-1">Token Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Balance</label>
              <input
                type="number"
                min="0"
                step="any"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                placeholder="Leave blank for all"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={fetchHolders}
              disabled={isLoading || !tokenAddress.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
            >
              {isLoading ? "Loading..." : "Fetch Holders"}
            </button>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {addresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Addresses ({addresses.length})</label>
                <textarea
                  readOnly
                  value={addresses.join("\n")}
                  className="w-full h-40 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs"
                />
              </div>
            )}
          </div>
          <div className="p-6 border-t border-zinc-700 flex justify-between">
            <button onClick={handleClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">Cancel</button>
            <button
              onClick={handleImport}
              disabled={addresses.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
            >
              Import {addresses.length}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
