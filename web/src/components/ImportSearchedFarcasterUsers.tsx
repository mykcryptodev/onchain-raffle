/* eslint-disable @next/next/no-img-element */
"use client";

import { FC, useState, useEffect, useCallback } from 'react';

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

interface ImportSearchedFarcasterUsersProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportSearchedFarcasterUsers: FC<ImportSearchedFarcasterUsersProps> = ({ isOpen, onClose, onImport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NeynarUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'selected'>('search');

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery.trim());
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setSearchError('');
    
    try {
      const response = await fetch(`/api/neynar/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setSearchResults(data.users || []);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addUser = async (user: NeynarUser) => {
    // Check if user is already selected
    if (selectedUsers.some(u => u.username === user.username)) {
      return;
    }
    
    setIsLoadingUser(user.username);
    
    try {
      // Get full user details to ensure we have the latest address info
      const response = await fetch(`/api/neynar/search?getUserDetails=true&username=${encodeURIComponent(user.username)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user details');
      }
      
      const fullUser = data.user;
      
      // Get the primary ETH address or fallback to custody address
      let ethAddress = '';
      if (fullUser.verified_addresses?.primary?.eth_address) {
        ethAddress = fullUser.verified_addresses.primary.eth_address;
      } else if (fullUser.custody_address) {
        ethAddress = fullUser.custody_address;
      }
      
      if (ethAddress) {
        const newUser: SelectedUser = {
          username: fullUser.username,
          display_name: fullUser.display_name,
          pfp_url: fullUser.pfp_url,
          eth_address: ethAddress,
        };
        
        setSelectedUsers(prev => [...prev, newUser]);
        // Auto-switch to selected tab on mobile after adding
        if (window.innerWidth < 768) {
          setActiveTab('selected');
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsLoadingUser(null);
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
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setSearchError('');
    setActiveTab('search');
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
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Search Farcaster Users</h2>
            <p className="text-sm text-zinc-400">
              Search and select users to add their Ethereum addresses to your raffle.
            </p>
          </div>

          {/* Search Bar - Always visible */}
          <div className="p-4 sm:p-6 border-b border-zinc-700 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or display name..."
                className="w-full px-4 py-3 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500 pr-12 text-base"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {searchError && (
              <div className="text-red-500 text-sm mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {searchError}
              </div>
            )}
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden border-b border-zinc-700 flex-shrink-0">
            <div className="flex">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Search Results {searchResults.length > 0 && `(${searchResults.length})`}
              </button>
              <button
                onClick={() => setActiveTab('selected')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'selected'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Selected {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Mobile Search Results */}
            <div className={`md:hidden h-full ${activeTab !== 'search' ? 'hidden' : ''}`}>
              {searchResults.length === 0 && !isSearching && debouncedQuery.length >= 2 ? (
                <div className="p-4">
                  <p className="text-zinc-400 text-center py-8">No users found</p>
                </div>
              ) : searchResults.length === 0 && debouncedQuery.length < 2 ? (
                <div className="p-4">
                  <p className="text-zinc-400 text-center py-8">Type at least 2 characters to search</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
                    <div className="p-4 space-y-3 pb-6">
                      {searchResults.map((user) => (
                        <div
                          key={user.fid}
                          className="flex items-center gap-3 p-4 bg-zinc-800 rounded-lg active:bg-zinc-700 transition-colors"
                          onClick={() => addUser(user)}
                        >
                          <img
                            src={user.pfp_url}
                            alt={user.display_name}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-base">{user.display_name}</div>
                            <div className="text-sm text-zinc-400 truncate">@{user.username}</div>
                          </div>
                          <div className="flex-shrink-0">
                            {isLoadingUser === user.username ? (
                              <svg className="w-6 h-6 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : selectedUsers.some(u => u.username === user.username) ? (
                              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Selected Users */}
            <div className={`md:hidden h-full ${activeTab !== 'selected' ? 'hidden' : ''}`}>
              {selectedUsers.length === 0 ? (
                <div className="p-4">
                  <p className="text-zinc-400 text-center py-8">No users selected yet</p>
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

            {/* Desktop Two-Panel Layout */}
            <div className="hidden md:flex h-full">
              {/* Search Results */}
              <div className="w-1/2 p-4 border-r border-zinc-700 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Search Results</h3>
                {searchResults.length === 0 && !isSearching && debouncedQuery.length >= 2 && (
                  <p className="text-zinc-400 text-sm">No users found</p>
                )}
                {searchResults.length === 0 && debouncedQuery.length < 2 && (
                  <p className="text-zinc-400 text-sm">Type at least 2 characters to search</p>
                )}
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                  {searchResults.map((user) => (
                    <div
                      key={user.fid}
                      className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 cursor-pointer transition-colors"
                      onClick={() => addUser(user)}
                    >
                      <img
                        src={user.pfp_url}
                        alt={user.display_name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.display_name}</div>
                        <div className="text-sm text-zinc-400 truncate">@{user.username}</div>
                      </div>
                      {isLoadingUser === user.username ? (
                        <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : selectedUsers.some(u => u.username === user.username) ? (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Users */}
              <div className="w-1/2 p-4 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Selected Users ({selectedUsers.length})</h3>
                
                {selectedUsers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-400 text-sm">No users selected yet</p>
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
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
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