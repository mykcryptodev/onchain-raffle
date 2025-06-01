import { type FC } from "react";
import { shortenAddress } from "thirdweb/utils";

export const AccountNameFallback: FC<{ address: string }> = ({ address }) => {
  return (
    <span>
      {shortenAddress(address)}
    </span>
  );
}

export default AccountNameFallback;