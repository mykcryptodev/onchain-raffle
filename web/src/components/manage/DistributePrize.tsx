import { FC } from "react";
import { TransactionButton } from "thirdweb/react";
import { ContractOptions } from "thirdweb";
import { distributePrize } from "@/abis/raffle";

type DistributePrizeProps = {
  raffleContract: ContractOptions<[], `0x${string}`>;
  hasWinner: boolean;
  prizeDistributed: boolean;
  onSuccess?: () => void;
}

export const DistributePrize: FC<DistributePrizeProps> = ({ 
  raffleContract, 
  hasWinner,
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
      <p className="text-sm text-zinc-400 mb-3">
        Send the prize pool to the winner
      </p>
      <div className="flex justify-end">
        <TransactionButton
          transaction={() => distributeTx}
          onTransactionConfirmed={() => {
            onSuccess?.();
            console.log("Prize distributed successfully!");
          }}
          onError={(error) => {
            console.error("Error distributing prize:", error);
          }}
        >
          Distribute Prize to Winner
        </TransactionButton>
      </div>
    </div>
  );
}; 