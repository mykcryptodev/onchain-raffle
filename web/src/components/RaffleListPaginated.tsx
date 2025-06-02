"use client";

import { useState } from "react";
import { useRaffles } from "@/hooks/useRaffles";
import { RaffleCard } from "./RaffleCard";

const RAFFLES_PER_PAGE = 10;

export function RaffleListPaginated() {
  const { data: raffles, isLoading, error } = useRaffles();
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination
  const totalPages = Math.ceil((raffles?.length || 0) / RAFFLES_PER_PAGE);
  const startIndex = currentPage * RAFFLES_PER_PAGE;
  const endIndex = startIndex + RAFFLES_PER_PAGE;
  const currentRaffles = raffles?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-lg mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">Error loading raffles: {error.message}</p>
      </div>
    );
  }

  if (!raffles || raffles.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">No raffles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Raffle count and page info */}
      <div className="flex justify-between items-center text-sm text-zinc-400">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, raffles.length)} of {raffles.length} raffles
        </span>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
      </div>

      {/* Raffle list */}
      <div className="grid gap-4">
        {currentRaffles.map((raffle) => (
          <RaffleCard
            key={raffle.raffleAddress}
            raffleAddress={raffle.raffleAddress}
            raffleOwner={raffle.raffleOwner}
            raffleToken={raffle.raffleToken}
            raffleWinner={raffle.raffleWinner}
            prizeDistributed={raffle.prizeDistributed}
            finalPrizeAmount={raffle.finalPrizeAmount}
            balance={raffle.balance}
            tokenDecimals={raffle.tokenDecimals}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 0}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Previous
          </button>

          {/* Page numbers */}
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, index) => {
              // Show first page, last page, current page, and pages around current
              const showPage = 
                index === 0 || 
                index === totalPages - 1 || 
                Math.abs(index - currentPage) <= 1;

              if (!showPage && index === 1 && currentPage > 3) {
                return <span key={index} className="px-2 text-zinc-500">...</span>;
              }

              if (!showPage && index === totalPages - 2 && currentPage < totalPages - 4) {
                return <span key={index} className="px-2 text-zinc-500">...</span>;
              }

              if (!showPage) return null;

              return (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`
                    px-3 py-1 rounded-lg transition-colors
                    ${index === currentPage 
                      ? 'bg-zinc-600 text-white' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
