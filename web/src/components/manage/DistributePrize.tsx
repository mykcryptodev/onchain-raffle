import { FC } from "react";
import { TransactionButton } from "thirdweb/react";
import { ContractOptions } from "thirdweb";
import { distributePrize } from "@/abis/raffle";
import { toast } from "react-toastify";

type DistributePrizeProps = {
  raffleContract: ContractOptions<[], `0x${string}`>;
  hasWinner: boolean;
  winner: `0x${string}`;
  prizeDistributed: boolean;
  onSuccess?: () => void;
}

export const DistributePrize: FC<DistributePrizeProps> = ({ 
  raffleContract, 
  hasWinner,
  winner,
  prizeDistributed,
  onSuccess
}) => {
  if (!hasWinner || prizeDistributed) {
    return null;
  }

  const distributeTx = distributePrize({
    contract: raffleContract,
  });

  return (
    <div className="border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-3">Distribute Prize</h3>
      <p className="text-sm text-zinc-400">
        Send the prize pool to the winner
      </p>
      <p className="text-xs text-zinc-400 font-mono mb-3 truncate">
        {winner}
      </p>
      <div className="flex justify-end">
        <TransactionButton
          transaction={() => distributeTx}
          onTransactionSent={() => {
            toast.loading("Distributing prize...");
          }}
          onTransactionConfirmed={() => {
            toast.dismiss();
            onSuccess?.();
            console.log("Prize distributed successfully!");
          }}
          onError={(error) => {
            toast.dismiss();
            console.error("Error distributing prize:", error);
            toast.error("Failed to distribute prize. Please try again.");
          }}
        >
          Distribute Prize to Winner
        </TransactionButton>
      </div>
    </div>
  );
}; 