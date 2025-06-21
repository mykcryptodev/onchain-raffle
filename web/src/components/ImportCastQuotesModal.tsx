/* eslint-disable @next/next/no-img-element */
"use client";

import { FC, useState, useCallback } from 'react';

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  profile: {
    bio: {
      text: string;
    };
  };
  pfp_url: string;
  verified_addresses?: {
    eth_addresses?: string[];
    primary?: {
      eth_address?: string;
    };
  };
}

interface SelectedUser {
  username: string;
  display_name: string;
  pfp_url: string;
  eth_address: string;
}

interface ImportCastQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportCastQuotesModal: FC<ImportCastQuotesModalProps> = ({ isOpen, onClose, onImport }) => {
  const [castHash, setCastHash] = useState('');
  const [quoters, setQuoters] = useState<NeynarUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'hash' | 'selected'>('hash');

  const fetchCastQuoters = async () => {
    if (!castHash.trim()) {
      setError('Please enter a cast hash');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/neynar/cast-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ castHash: castHash.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cast quoters');
      }
      
      setQuoters(data.users || []);
      
      // Auto-populate selected users with ETH addresses
      const usersWithAddresses = (data.users || []).filter((user: NeynarUser) => {
        const ethAddress = user.verified_addresses?.primary?.eth_address || user.custody_address;
        return ethAddress;
      }).map((user: NeynarUser) => ({
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        eth_address: user.verified_addresses?.primary?.eth_address || user.custody_address,
      }));
      
      setSelectedUsers(usersWithAddresses);
      
      // Auto-switch to selected tab on mobile
      if (window.innerWidth < 768) {
        setActiveTab('selected');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch cast quoters');
      setQuoters([]);
      setSelectedUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = (username: string) => {
    setSelectedUsers(prev => prev.filter(u => u.username !== username));
  };

  const handleImport = () => {
    const addresses = selectedUsers.map(u => u.eth_address);
    if (addresses.length > 0) {
      onImport(addresses);
      handleClose();
    }
  };

  const handleClose = () => {
    setCastHash('');
    setQuoters([]);
    setSelectedUsers([]);
    setError('');
    setActiveTab('hash');
    onClose();
  };

  if (!isOpen) return null;

  const addresses = selectedUsers.map(u => u.eth_address).join('\n');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div 
          className="bg-zinc-900 rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg sm:w-full h-[95vh] sm:h-[80vh] overflow-hidden flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors z-10 p-2 -m-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-700 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Import Cast Quote Casters</h2>
            <p className="text-sm text-zinc-400">
              Enter a Farcaster cast hash to import Ethereum addresses of users who quoted the cast.
            </p>
          </div>

          {/* Hash Input - Always visible */}
          <div className="p-4 sm:p-6 border-b border-zinc-700 flex-shrink-0">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={castHash}
                  onChange={(e) => setCastHash(e.target.value)}
                  placeholder="0x1234abcd..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500 text-base font-mono"
                />
              </div>
              
              <button
                onClick={fetchCastQuoters}
                disabled={isLoading || !castHash.trim()}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  'Fetch Quote Casters'
                )}
              </button>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Mobile Tabs */}
          {selectedUsers.length > 0 && (
            <div className="md:hidden border-b border-zinc-700 flex-shrink-0">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('hash')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'hash'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Cast Info
                </button>
                <button
                  onClick={() => setActiveTab('selected')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'selected'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Addresses ({selectedUsers.length})
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Mobile Cast Info */}
            <div className={`md:hidden h-full ${activeTab !== 'hash' ? 'hidden' : ''}`}>
              <div className="p-4">
                {quoters.length > 0 && (
                  <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                    <h3 className="font-medium mb-2">Cast Statistics</h3>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <div>Total Quotes: {quoters.length}</div>
                      <div>With ETH Addresses: {selectedUsers.length}</div>
                      <div>Selected for Import: {selectedUsers.length}</div>
                    </div>
                  </div>
                )}
                
                {selectedUsers.length === 0 && quoters.length === 0 && !isLoading && (
                  <p className="text-zinc-400 text-center py-8">Enter a cast hash above to get started</p>
                )}
                
                {selectedUsers.length === 0 && quoters.length > 0 && (
                  <p className="text-zinc-400 text-center py-8">No users with Ethereum addresses found</p>
                )}
              </div>
            </div>

            {/* Mobile Selected Users */}
            <div className={`md:hidden h-full ${activeTab !== 'selected' ? 'hidden' : ''}`}>
              {selectedUsers.length === 0 ? (
                <div className="p-4">
                  <p className="text-zinc-400 text-center py-8">No addresses selected yet</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
                    <div className="p-4 space-y-3 pb-6">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.username}
                          className="flex items-center gap-3 p-4 bg-zinc-800 rounded-lg"
                        >
                          <img
                            src={user.pfp_url}
                            alt={user.display_name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.display_name}</div>
                            <div className="text-sm text-zinc-400 truncate">@{user.username}</div>
                            <div className="text-xs text-zinc-500 truncate font-mono mt-1">
                              {user.eth_address.slice(0, 8)}...{user.eth_address.slice(-6)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeUser(user.username)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2 -m-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Addresses Textarea - Mobile */}
                  <div className="flex-shrink-0 p-4 border-t border-zinc-700">
                    <label className="block text-sm font-medium mb-2">Ethereum Addresses</label>
                    <textarea
                      value={addresses}
                      readOnly
                      className="w-full h-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs resize-none"
                      placeholder="Ethereum addresses will appear here..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex h-full">
              {/* Cast Info */}
              <div className="w-1/2 p-4 border-r border-zinc-700 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Cast Information</h3>
                
                {quoters.length > 0 && (
                  <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium mb-2">Statistics</h4>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <div>Total Quotes: {quoters.length}</div>
                      <div>With ETH Addresses: {selectedUsers.length}</div>
                      <div>Selected for Import: {selectedUsers.length}</div>
                    </div>
                  </div>
                )}
                
                {selectedUsers.length === 0 && quoters.length === 0 && !isLoading && (
                  <p className="text-zinc-400 text-sm">Enter a cast hash above to get started</p>
                )}
                
                {selectedUsers.length === 0 && quoters.length > 0 && (
                  <p className="text-zinc-400 text-sm">No users with Ethereum addresses found in the quotes</p>
                )}
              </div>

              {/* Selected Users */}
              <div className="w-1/2 p-4 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Selected Addresses ({selectedUsers.length})</h3>
                
                {selectedUsers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-400 text-sm">No addresses selected yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.username}
                          className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
                        >
                          <img
                            src={user.pfp_url}
                            alt={user.display_name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user.display_name}</div>
                            <div className="text-xs text-zinc-400 truncate">@{user.username}</div>
                          </div>
                          <button
                            onClick={() => removeUser(user.username)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Addresses Textarea */}
                    <div className="flex-shrink-0">
                      <label className="block text-sm font-medium mb-2">Ethereum Addresses</label>
                      <textarea
                        value={addresses}
                        readOnly
                        className="w-full h-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs resize-none"
                        placeholder="Ethereum addresses will appear here..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-zinc-700 flex justify-between items-center flex-shrink-0">
            <div className="text-sm text-zinc-400">
              {selectedUsers.length} address{selectedUsers.length !== 1 ? 'es' : ''} ready to import
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedUsers.length === 0}
                className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                Import {selectedUsers.length > 0 ? selectedUsers.length : ''} Address{selectedUsers.length !== 1 ? 'es' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 
