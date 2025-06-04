/* eslint-disable @next/next/no-img-element */
"use client";

import { FC, useState } from 'react';

interface SnapshotVote {
  id: string;
  voter: string;
  created: number;
  choice: any;
  vp: number;
  reason?: string;
}

interface SnapshotProposal {
  id: string;
  title: string;
  space: {
    id: string;
    name: string;
  };
  choices: string[];
  scores: number[];
  scores_total: number;
  votes: number;
}

interface SelectedVoter {
  address: string;
  choice: string;
  votingPower: number;
  timestamp: number;
}

interface ImportSnapshotVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export const ImportSnapshotVotersModal: FC<ImportSnapshotVotersModalProps> = ({ isOpen, onClose, onImport }) => {
  const [proposalId, setProposalId] = useState('');
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [voters, setVoters] = useState<SnapshotVote[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<SelectedVoter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'proposal' | 'selected'>('proposal');

  const fetchProposalVoters = async () => {
    if (!proposalId.trim()) {
      setError('Please enter a proposal ID');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/snapshot/proposal-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId: proposalId.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch proposal voters');
      }
      
      setProposal(data.proposal);
      setVoters(data.votes || []);
      
      // Auto-populate selected voters
      const votersWithInfo = (data.votes || []).map((vote: SnapshotVote) => ({
        address: vote.voter,
        choice: data.proposal.choices[vote.choice - 1] || `Choice ${vote.choice}`,
        votingPower: vote.vp || 0,
        timestamp: vote.created,
      }));
      
      setSelectedVoters(votersWithInfo);
      
      // Auto-switch to selected tab on mobile
      if (window.innerWidth < 768 && votersWithInfo.length > 0) {
        setActiveTab('selected');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch proposal voters');
      setProposal(null);
      setVoters([]);
      setSelectedVoters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeVoter = (address: string) => {
    setSelectedVoters(prev => prev.filter(v => v.address !== address));
  };

  const handleImport = () => {
    const addresses = selectedVoters.map(v => v.address);
    if (addresses.length > 0) {
      onImport(addresses);
      handleClose();
    }
  };

  const handleClose = () => {
    setProposalId('');
    setProposal(null);
    setVoters([]);
    setSelectedVoters([]);
    setError('');
    setActiveTab('proposal');
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  const addresses = selectedVoters.map(v => v.address).join('\n');

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
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Import Snapshot Voters</h2>
            <p className="text-sm text-zinc-400">
              Enter a Snapshot proposal ID to import addresses of users who voted on the proposal.
            </p>
          </div>

          {/* Proposal ID Input - Always visible */}
          <div className="p-4 sm:p-6 border-b border-zinc-700 flex-shrink-0">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={proposalId}
                  onChange={(e) => setProposalId(e.target.value)}
                  placeholder="Enter proposal ID..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500 text-base"
                />
              </div>
              
              <button
                onClick={fetchProposalVoters}
                disabled={isLoading || !proposalId.trim()}
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
                  'Fetch Voters'
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
          {proposal && selectedVoters.length > 0 && (
            <div className="md:hidden border-b border-zinc-700 flex-shrink-0">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('proposal')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'proposal'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Proposal Info
                </button>
                <button
                  onClick={() => setActiveTab('selected')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'selected'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Voters ({selectedVoters.length})
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Mobile Proposal Info */}
            <div className={`md:hidden h-full ${activeTab !== 'proposal' ? 'hidden' : ''}`}>
              <div className="p-4">
                {proposal ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h3 className="font-medium mb-2">{proposal.title}</h3>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <div>Space: {proposal.space.name}</div>
                        <div>Total Votes: {proposal.votes}</div>
                        <div>Total Voting Power: {proposal.scores_total.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-2">Results</h4>
                      <div className="space-y-2">
                        {proposal.choices.map((choice, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span>{choice}</span>
                              <span className="text-zinc-400">
                                {((proposal.scores[index] / proposal.scores_total) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${(proposal.scores[index] / proposal.scores_total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-center py-8">Enter a proposal ID to see details</p>
                )}
              </div>
            </div>

            {/* Mobile Selected Voters */}
            <div className={`md:hidden h-full ${activeTab !== 'selected' ? 'hidden' : ''}`}>
              {selectedVoters.length === 0 ? (
                <div className="p-4">
                  <p className="text-zinc-400 text-center py-8">No voters found yet</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
                    <div className="p-4 space-y-3 pb-6">
                      {selectedVoters.map((voter) => (
                        <div
                          key={voter.address}
                          className="flex items-center gap-3 p-4 bg-zinc-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">{formatAddress(voter.address)}</div>
                            <div className="text-sm text-zinc-400">Voted: {voter.choice}</div>
                            <div className="text-xs text-zinc-500">
                              VP: {voter.votingPower.toLocaleString()} • {formatDate(voter.timestamp)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeVoter(voter.address)}
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
              {/* Proposal Info */}
              <div className="w-1/2 p-4 border-r border-zinc-700 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Proposal Information</h3>
                
                {proposal ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-2">{proposal.title}</h4>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <div>Space: {proposal.space.name}</div>
                        <div>Total Votes: {proposal.votes}</div>
                        <div>Total Voting Power: {proposal.scores_total.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-3">Results</h4>
                      <div className="space-y-3">
                        {proposal.choices.map((choice, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1 text-sm">
                              <span>{choice}</span>
                              <span className="text-zinc-400">
                                {((proposal.scores[index] / proposal.scores_total) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(proposal.scores[index] / proposal.scores_total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">Enter a proposal ID above to get started</p>
                )}
              </div>

              {/* Selected Voters */}
              <div className="w-1/2 p-4 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Selected Voters ({selectedVoters.length})</h3>
                
                {selectedVoters.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-400 text-sm">No voters found yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
                      {selectedVoters.map((voter) => (
                        <div
                          key={voter.address}
                          className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">{formatAddress(voter.address)}</div>
                            <div className="text-xs text-zinc-400">
                              Voted: {voter.choice} • VP: {voter.votingPower.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => removeVoter(voter.address)}
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
              {selectedVoters.length} address{selectedVoters.length !== 1 ? 'es' : ''} ready to import
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
                disabled={selectedVoters.length === 0}
                className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                Import {selectedVoters.length > 0 ? selectedVoters.length : ''} Address{selectedVoters.length !== 1 ? 'es' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 