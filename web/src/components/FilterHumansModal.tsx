"use client";
import { FC, useState } from "react";

interface FilterHumansModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: string[];
  onFilter: (addresses: string[]) => void;
}

export const FilterHumansModal: FC<FilterHumansModalProps> = ({ isOpen, onClose, addresses, onFilter }) => {
  const [humanCertainty, setHumanCertainty] = useState("90");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isValidPercentage = humanCertainty && !isNaN(Number(humanCertainty)) && Number(humanCertainty) >= 0 && Number(humanCertainty) <= 100;

  const handleClose = () => {
    setHumanCertainty("90");
    setError("");
    onClose();
  };

  const handleFilter = async () => {
    if (!isValidPercentage) {
      setError("Please enter a valid percentage between 0 and 100");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Convert percentage to Neynar score (90% -> 0.9)
      const neynarScore = Number(humanCertainty) / 100;
      
      const response = await fetch("/api/neynar/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses, minScore: neynarScore }),
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
          <h2 className="text-2xl font-bold mb-4">Filter by Humans</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Human Certainty Percentage</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="90"
                value={humanCertainty}
                onChange={(e) => setHumanCertainty(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-zinc-500 text-sm mt-1">Enter a percentage between 0 and 100 (e.g., 90 for 90% certainty)</p>
              {humanCertainty && !isValidPercentage && <p className="text-red-500 text-sm mt-1">Please enter a valid percentage between 0 and 100</p>}
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-sm text-zinc-400">
                <strong className="text-zinc-200">Human Detection:</strong> Filters addresses based on Farcaster activity patterns 
                to identify likely human users. Higher percentages mean more certainty that users are real humans rather than bots.
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Note: Addresses without Farcaster activity will be filtered out as we cannot determine if they are human or not.
              </p>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleFilter}
                disabled={!isValidPercentage || isLoading}
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
