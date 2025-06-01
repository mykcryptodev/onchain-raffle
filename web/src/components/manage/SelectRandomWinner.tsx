import { useMemo, useState } from "react";
import { estimateRequestPrice } from "@/abis/raffle";
import { FC } from "react";
import { TransactionButton } from "thirdweb/react";
import { ContractOptions, getGasPrice, prepareContractCall } from "thirdweb";
import { chain } from "@/constants/chain";
import { client } from "@/constants/thirdweb";

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
    const estimatedEthRequired = await estimateRequestPrice({
      contract: raffleContract,
      gasPriceWei: currentGasPrice,
    });
    return prepareContractCall({
      contract: raffleContract,
      method: "function requestRandomWinner(address[] eligibleAddresses) external",
      params: [addresses],
      value: estimatedEthRequired
    });
  }, [raffleContract, addresses]);

  const balanceAsBigInt = BigInt(balance);
  
  if (hasWinner || balanceAsBigInt === 0n) {
    return null;
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-3">Select Random Winner</h3>
      <p className="text-sm text-zinc-400 mb-3">
        Enter eligible addresses (one per line or comma-separated)
      </p>
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
          onTransactionConfirmed={() => {
            alert("Random winner request submitted! The winner will be selected shortly.");
            setEligibleAddresses("");
          }}
          onError={(error) => {
            console.error("Error requesting winner:", error);
          }}
        >
          Request Random Winner
        </TransactionButton>
      </div>
    </div>
  );
}; 