"use client";

import { useState } from "react";
import { CreateAuctionModal } from "./CreateAuctionModal";

export function AuctionsHeader() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Auctions</h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg font-medium"
        >
          Create Auction
        </button>
      </div>
      <CreateAuctionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          console.log("Auction created successfully");
        }}
      />
    </>
  );
}
