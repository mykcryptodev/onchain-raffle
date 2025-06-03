"use client";

import { useState } from "react";
import { CreateRaffleModal } from "./CreateRaffleModal";
import { WatchFactory } from "./WatchFactory";

export function RaffleHeader() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWatchingForCreation, setIsWatchingForCreation] = useState(false);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
    // Start watching when modal opens
    setIsWatchingForCreation(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    // Stop watching after a delay if modal is closed without creating
    setTimeout(() => {
      setIsWatchingForCreation(false);
    }, 2000); // Give 2 seconds in case transaction is still processing
  };

  const handleWatchComplete = () => {
    // Stop watching when redirect happens or timeout occurs
    setIsWatchingForCreation(false);
  };

  return (
    <>
      {/* Only watch when user is creating a raffle */}
      <WatchFactory 
        isWatching={isWatchingForCreation}
        onWatchComplete={handleWatchComplete}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Raffles</h2>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg font-medium"
        >
          Create Raffle
        </button>
      </div>

      <CreateRaffleModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={() => {
          // WatchFactory component will handle the redirect
          console.log("Raffle created successfully");
          // Keep watching active - it will auto-stop after redirect
        }}
      />
    </>
  );
} 