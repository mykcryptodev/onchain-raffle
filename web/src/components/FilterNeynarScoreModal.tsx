"use client";
import { FC, useState } from "react";

interface FilterNeynarScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: string[];
  onFilter: (addresses: string[]) => void;
}

export const FilterNeynarScoreModal: FC<FilterNeynarScoreModalProps> = ({ isOpen, onClose, addresses, onFilter }) => {
  const [minScore, setMinScore] = useState("0.9");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isValidScore = minScore && !isNaN(Number(minScore)) && Number(minScore) >= 0 && Number(minScore) <= 1;

  const handleClose = () => {
    setMinScore("0.9");
    setError("");
    onClose();
  };

  const handleFilter = async () => {
    if (!isValidScore) {
      setError("Please enter a valid score between 0 and 1");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/neynar/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses, minScore: Number(minScore) }),
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
          <h2 className="text-2xl font-bold mb-4">Filter by Neynar Score</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Minimum Neynar Score</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.9"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-zinc-500 text-sm mt-1">Enter a score between 0 and 1 (e.g., 0.9 for 90%)</p>
              {minScore && !isValidScore && <p className="text-red-500 text-sm mt-1">Please enter a valid score between 0 and 1</p>}
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-sm text-zinc-400">
                <strong className="text-zinc-200">Neynar Score:</strong> A reputation score based on Farcaster activity, 
                engagement, and social connections. Higher scores indicate more established and active users.
              </p>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleFilter}
                disabled={!isValidScore || isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
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
