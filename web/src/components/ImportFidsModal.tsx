"use client";
import { FC, useState } from "react";

interface ImportFidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportFidsModal: FC<ImportFidsModalProps> = ({ isOpen, onClose, onImport }) => {
  const [fidInput, setFidInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    const fids = fidInput
      .split(/[\n,]/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (fids.length === 0) {
      setError("Please enter at least one FID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/neynar/fids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fids }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch addresses");
      }

      const addresses = (data.addresses || []) as string[];
      if (addresses.length > 0) {
        onImport(addresses);
        handleClose();
      } else {
        setError("No addresses found for the provided FIDs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFidInput("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-zinc-900 rounded-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-4">Import FIDs</h2>
          <p className="text-sm text-zinc-400 mb-3">
            Paste Farcaster FIDs (comma or newline separated) to fetch their Ethereum addresses.
          </p>
          <textarea
            className="w-full h-32 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500 mb-3"
            placeholder="123\n456\n789"
            value={fidInput}
            onChange={(e) => setFidInput(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || fidInput.trim().length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {isLoading ? "Loading..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
