import { type FC } from "react";

export const TokenIconFallback: FC = () => {
  return (
    <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
      <span className="text-zinc-400 text-2xl">
        🪙
      </span>
    </div>
  );
}