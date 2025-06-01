import { type FC } from "react";

export const AccountNameFallback: FC<{ address: string }> = ({ address }) => {
  return (
    <span>
      {address.slice(0, 2)}...{address.slice(-2)}
    </span>
  );
}

export default AccountNameFallback;