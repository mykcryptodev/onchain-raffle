import { useMemo, useState } from "react";
import { fundPrize } from "@/abis/raffle";

import { FC } from "react";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { ContractOptions, getContract, toUnits } from "thirdweb";
import { approve, decimals } from "thirdweb/extensions/erc20";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import { toast } from "react-toastify";

type FundRaffleProps = {
  raffleContract: ContractOptions<[], `0x${string}`>;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  onFunded: () => void;
}

export const FundRaffle: FC<FundRaffleProps> = ({ raffleContract, tokenAddress, tokenDecimals, onFunded }) => {
  const [fundAmount, setFundAmount] = useState("");
  const account = useActiveAccount();

  const tokenContract = getContract({
    client,
    chain,
    address: tokenAddress,
  });

  const fundAmountWei = useMemo(() => {
    return toUnits(fundAmount, tokenDecimals);
  }, [fundAmount, tokenDecimals]);

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    contract: tokenContract,
    method: "function allowance(address owner, address spender) returns (uint256)",
    params: [account?.address ?? "", raffleContract.address],
  });

  const requiresApproval = useMemo(() => {
    if (currentAllowance === undefined) return false;
    return fundAmountWei > currentAllowance;
  }, [currentAllowance, fundAmountWei]);

  const fundTx = useMemo(async () => {
    const tokenDecimals = await decimals({
      contract: getContract({
        client,
        chain,
        address: tokenAddress,
      }),
    });

    const amount = toUnits(fundAmount, tokenDecimals);

    return fundPrize({
      contract: raffleContract,
      amount,
    });
  }, [raffleContract, fundAmount, tokenAddress]);

  return (
    <div className="border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-3">Fund Prize Pool</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="number"
          placeholder="Amount to fund"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
        />
        {requiresApproval ? (
          <TransactionButton
            transaction={() => {
              return approve({
                contract: tokenContract,
                spender: raffleContract.address,
                amount: fundAmount
              });
            }}
            disabled={!fundAmount}
            onTransactionSent={() => {
              toast.loading("Approving...");
            }}
            onTransactionConfirmed={async () => {
              await refetchAllowance();
              toast.dismiss();
              toast.success("Approved!");
            }}
            onError={(error) => {
              toast.dismiss();
              console.error("Approval error:", error);
              toast.error("Failed to approve tokens. Please try again.");
            }}
            className="w-full sm:w-auto"
          >
            Approve
          </TransactionButton>
        ) : (
          <TransactionButton
            transaction={() => {
              console.log("funding");
              return fundTx;
            }}
            onError={(error) => {
              console.error("error", error);
              toast.dismiss();
              toast.error("Failed to fund raffle. Please try again.");
            }}
            onTransactionSent={() => {
              console.log("transaction sent");
              toast.loading("Funding...");
            }}
            onTransactionConfirmed={async () => {
              console.log("transaction confirmed");
              toast.dismiss();
              
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
              
              onFunded();
            }}
            className="w-full sm:w-auto"
          >
            Fund Prize
          </TransactionButton>
        )}
      </div>
    </div>
  );
};