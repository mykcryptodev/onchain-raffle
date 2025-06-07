import { useMemo, useState } from "react";
import { estimateRequestPrice, estimateRequestPriceWithDefaultGas } from "@/abis/raffle";
import { FC } from "react";
import { TransactionButton } from "thirdweb/react";
import { ContractOptions, getGasPrice, prepareContractCall } from "thirdweb";
import { chain } from "@/constants/chain";
import { client } from "@/constants/thirdweb";
import { toast } from "react-toastify";
import { ImportSearchedFarcasterUsers } from "../ImportSearchedFarcasterUsers";
import { ImportCastLikersModal } from "../ImportCastLikersModal";
import { ImportSnapshotVotersModal } from "../ImportSnapshotVotersModal";
import { ImportFidsModal } from "../ImportFidsModal";

const BUFFER_PERCENTAGE = 300n; // 3x buffer

type SelectRandomWinnerProps = {
  raffleContract: ContractOptions<[], `0x${string}`>;
  balance: string;
  hasWinner: boolean;
}

export const SelectRandomWinner: FC<SelectRandomWinnerProps> = ({ 
  raffleContract, 
  balance, 
  hasWinner 
}) => {
  const [eligibleAddresses, setEligibleAddresses] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCastLikersModalOpen, setIsCastLikersModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isFidsModalOpen, setIsFidsModalOpen] = useState(false);

  const addresses = useMemo(() => {
    return eligibleAddresses
      .split(/[\n,]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0) as `0x${string}`[];
  }, [eligibleAddresses]);

  const requestWinnerTx = useMemo(async () => {
    const currentGasPrice = await getGasPrice({
      chain,
      client
    });
    // convert from gwei to wei
    const currentGasPriceWei = currentGasPrice * 10n ** 9n;
    console.log("currentGasPrice", currentGasPriceWei);
    const estimatedEthRequired = await estimateRequestPrice({
      contract: raffleContract,
      gasPriceWei: currentGasPrice,
    });
    
    // Add buffer to the estimated ETH required
    const ethWithBuffer = estimatedEthRequired + (estimatedEthRequired * BUFFER_PERCENTAGE / 100n);
    
    return prepareContractCall({
      contract: raffleContract,
      method: "function requestRandomWinner(address[] eligibleAddresses) external",
      params: [addresses],
      value: ethWithBuffer
    });
  }, [raffleContract, addresses]);

  const handleAddressesImported = (importedAddresses: string[]) => {
    const currentAddresses = eligibleAddresses.trim();
    const newAddresses = importedAddresses.join('\n');
    
    if (currentAddresses) {
      setEligibleAddresses(currentAddresses + '\n' + newAddresses);
    } else {
      setEligibleAddresses(newAddresses);
    }
  };

  const balanceAsBigInt = BigInt(balance);
  
  if (hasWinner || balanceAsBigInt === 0n) {
    return null;
  }

  return (
    <>
      <div className="border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3">Select Random Winner</h3>
        <p className="text-sm text-zinc-400 mb-3">
          Enter eligible addresses (one per line or comma-separated)
        </p>
        
        {/* Import Buttons */}
        <div className="mb-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Search Farcaster Users
          </button>
          <button
            onClick={() => setIsFidsModalOpen(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Import FIDs
          </button>
          <button
            onClick={() => setIsCastLikersModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Import Cast Likers
          </button>
          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Import Snapshot Voters
          </button>
        </div>

        <textarea
          placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
          value={eligibleAddresses}
          onChange={(e) => setEligibleAddresses(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 h-32 mb-3"
        />
        <div className="flex justify-end">
          <TransactionButton
            transaction={() => requestWinnerTx}
            disabled={addresses.length === 0}
            onTransactionSent={() => {
              toast.loading("Requesting winner...");
            }}
            onTransactionConfirmed={async () => {
              toast.dismiss();
              setEligibleAddresses("");
              
              // Invalidate the server-side cache
              try {
                await fetch('/api/cache/invalidate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ address: raffleContract.address }),
                });
              } catch (error) {
                console.error("Failed to invalidate cache:", error);
              }
            }}
            onError={(error) => {
              console.error("Error requesting winner:", error);
              toast.dismiss();
              toast.error("Failed to request winner. Please try again.");
            }}
          >
            Request Random Winner
          </TransactionButton>
        </div>
      </div>

      <ImportSearchedFarcasterUsers
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleAddressesImported}
      />

      <ImportFidsModal
        isOpen={isFidsModalOpen}
        onClose={() => setIsFidsModalOpen(false)}
        onImport={handleAddressesImported}
      />

      <ImportCastLikersModal
        isOpen={isCastLikersModalOpen}
        onClose={() => setIsCastLikersModalOpen(false)}
        onImport={handleAddressesImported}
      />

      <ImportSnapshotVotersModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        onImport={handleAddressesImported}
      />
    </>
  );
}; 