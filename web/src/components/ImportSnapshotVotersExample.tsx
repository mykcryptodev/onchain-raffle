"use client";

import { useState } from 'react';
import { ImportSnapshotVotersModal } from './ImportSnapshotVotersModal';

export const ImportSnapshotVotersExample = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importedAddresses, setImportedAddresses] = useState<string[]>([]);

  const handleImport = (addresses: string[]) => {
    setImportedAddresses(addresses);
    console.log('Imported addresses:', addresses);
    // Here you would typically update your raffle participants or handle the addresses
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Snapshot Voters Import Example</h2>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
      >
        Import from Snapshot Proposal
      </button>

      {importedAddresses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Imported Addresses ({importedAddresses.length})</h3>
          <div className="max-h-64 overflow-y-auto bg-zinc-800 p-4 rounded-lg">
            {importedAddresses.map((address, index) => (
              <div key={index} className="font-mono text-sm text-zinc-300 py-1">
                {address}
              </div>
            ))}
          </div>
        </div>
      )}

      <ImportSnapshotVotersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}; 