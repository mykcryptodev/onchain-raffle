import { getContract } from "thirdweb";
import { client } from "./thirdweb";
import { chain } from "./chain";

export const factoryContract = getContract({
  chain,
  address: "0xb252e9d64820285b7ce0a926b9fe9e69f239f27b",
  client,
});

export const auctionsContract = getContract({
  chain,
  // TODO: replace with your Auctions contract address
  address: "0x0000000000000000000000000000000000000000",
  client,
});