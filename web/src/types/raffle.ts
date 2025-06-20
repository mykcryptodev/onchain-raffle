export interface RaffleData {
  owner: `0x${string}`;
  token: `0x${string}`;
  tokenDecimals: number;
  winner: `0x${string}`;
  prizeDistributed: boolean;
  balance: string;
  lastRequestId: bigint;
  finalPrizeAmount: string;
}

export interface RaffleCardData {
  raffleAddress: `0x${string}`;
  raffleOwner: `0x${string}`;
  raffleToken: `0x${string}`;
  raffleWinner: `0x${string}`;
  prizeDistributed: boolean;
  finalPrizeAmount: string;
  balance: string;
  tokenDecimals: number;
} 