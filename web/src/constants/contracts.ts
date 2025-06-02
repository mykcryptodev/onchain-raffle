import { getContract } from "thirdweb";
import { client } from "./thirdweb";
import { chain } from "./chain";

export const factoryContract = getContract({
  chain,
  address: "0x5620C9097c02Ad5dB52D8a416D8ec620adDedEdD",
  client,
});