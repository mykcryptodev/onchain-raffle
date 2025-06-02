import { defineChain } from "thirdweb";
import { base } from "thirdweb/chains";

export const chain = defineChain({
  ...base,
  // rpc: `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_CDP_API_KEY}`,
});