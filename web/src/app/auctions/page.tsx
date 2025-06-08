import { AuctionsHeader } from "@/components/AuctionsHeader";

export default function AuctionsPage() {
  return (
    <main className="p-4 pb-10 min-h-[100vh] container max-w-screen-lg mx-auto">
      <div className="py-20">
        <AuctionsHeader />
        <p className="text-zinc-400">No auctions available.</p>
      </div>
    </main>
  );
}
