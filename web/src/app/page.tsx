import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import logo from "@public/logo.png";
import { client } from "@/constants/thirdweb";
import { RaffleList } from "@/components/RaffleList";
import { Suspense } from "react";
import { RaffleListLoading } from "@/components/RaffleListLoading";
import { chain } from "@/constants/chain";
import { RaffleHeader } from "@/components/RaffleHeader";

export default function Home() {
  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20">
        <Header />

        <div className="flex justify-center mb-20">
          <ConnectButton
            client={client}
            chain={chain}
            appMetadata={{
              name: "Rofl",
              description: "Create provably fair onchain raffles with any token",
              url: "https://onchain-raffle-sigma.vercel.app",
            }}
          />
        </div>

        <div className="mt-20">
          <RaffleHeader />
          
          <Suspense fallback={<RaffleListLoading />}>
            <RaffleList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center mb-10">
      <Image
        src={logo}
        alt=""
        className="size-[150px] md:size-[150px]"
        style={{
          filter: "drop-shadow(0px 0px 24px #87edffa8)",
        }}
      />

      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        Rofl House
      </h1>

      <p className="text-zinc-300 text-base">
        Create provably fair onchain raffles.
      </p>
    </header>
  );
}