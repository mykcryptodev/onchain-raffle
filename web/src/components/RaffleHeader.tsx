"use client";

import { useState } from "react";
import { CreateRaffleModal } from "./CreateRaffleModal";
import { useRouter } from "next/navigation";

export function RaffleHeader() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Raffles</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg font-medium"
        >
          Create Raffle
        </button>
      </div>

      <CreateRaffleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Refresh the page to show the new raffle
          router.refresh();
        }}
      />
    </>
  );
} 