"use client";

import { FC, useState } from 'react';

interface ImportQuoteCastersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportQuoteCastersModal: FC<ImportQuoteCastersModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ 
    addresses: string[]; 
    successfulUsers?: number; 
    failedUsers?: number;
    usernames?: {
      successful: string[];
      failed: string[];
    };
  } | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/neynar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // No parameters needed for hardcoded list
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setResult(data);
      
      if (data.addresses && data.addresses.length > 0) {
        // Auto-import if we found addresses
        onImport(data.addresses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      setResult(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-zinc-900 rounded-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <h2 className="text-2xl font-bold mb-4">Import Quote Casters</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Import Ethereum addresses from users who quote-casted your post.
          </p>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded p-3 mb-4">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 mb-6">
              {result.addresses.length > 0 ? (
                <div className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded p-3">
                  ✅ Found {result.addresses.length} addresses from {result.successfulUsers} users
                  {result.failedUsers && result.failedUsers > 0 && (
                    <div className="text-orange-400 mt-2">
                      ⚠️ {result.failedUsers} users could not be found
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded p-3">
                  ⚠️ No addresses found
                </div>
              )}
              
              {result.addresses.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">View addresses</summary>
                  <textarea
                    value={result.addresses.join('\n')}
                    readOnly
                    className="mt-2 w-full h-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs resize-none"
                  />
                </details>
              )}

              {result.usernames && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">View usernames</summary>
                  <div className="mt-2 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <div className="mb-2">
                      <span className="text-green-400">✅ Found ({result.usernames.successful.length}):</span>
                      <div className="text-zinc-300">{result.usernames.successful.join(', ')}</div>
                    </div>
                    {result.usernames.failed.length > 0 && (
                      <div>
                        <span className="text-orange-400">❌ Not found ({result.usernames.failed.length}):</span>
                        <div className="text-zinc-300">{result.usernames.failed.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Importing...' : 'Import Quote Casters'}
            </button>
          </div>

          <div className="text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-700">
            <p><strong>Quote Casters:</strong></p>
            <p className="mt-1">keremgurel, calmo, jake, rkass.eth, brianethier, chunter, tamastorok.eth, polak.eth, basedbraden, zexrtw, olorunsniper, basevip, vsck, ghostbo4.eth, abdullaalkamil, zeck, chidz, cryptobeijing, basedkeren</p>
          </div>
        </div>
      </div>
    </>
  );
}; 