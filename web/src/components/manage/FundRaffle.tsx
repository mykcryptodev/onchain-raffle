import { useMemo, useState } from "react";
import { fundPrize } from "@/abis/raffle";

import { FC } from "react";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { ContractOptions, getContract, toUnits } from "thirdweb";
import { approve, decimals } from "thirdweb/extensions/erc20";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";

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
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Amount to fund"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
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
            onTransactionConfirmed={async () => {
              await refetchAllowance();
            }}
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
            }}
            onTransactionSent={() => {
              console.log("transaction sent");
            }}
            onTransactionConfirmed={() => {
              console.log("transaction confirmed");
              onFunded();
            }}
          >
            Fund Prize
          </TransactionButton>
        )}
      </div>
    </div>
  );
};