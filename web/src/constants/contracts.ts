import { getContract } from "thirdweb";
import { client } from "./thirdweb";
import { chain } from "./chain";

export const factoryContract = getContract({
  chain,
  address: "0xf2ca0b0a17129343242906F7faE1c2242EaFbe29",
  client,
});