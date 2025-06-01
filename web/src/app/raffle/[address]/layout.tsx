import { Metadata } from "next";
import { getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chain } from "@/constants/chain";
import * as raffleAbi from "@/abis/raffle";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import { balanceOf } from "thirdweb/extensions/erc20";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    address: `0x${string}`;
  }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { address } = await params;
  
  try {
    const raffleContract = getContract({
      client,
      chain,
      address,
    });

    const [owner, token] = await Promise.all([
      raffleAbi.owner({ contract: raffleContract }),
      raffleAbi.token({ contract: raffleContract }),
    ]);

    const tokenContract = getContract({
      client,
      chain,
      address: token,
    });

    const metadata = await getCurrencyMetadata({ contract: tokenContract });

    const { decimals, symbol } = metadata;

    const balance = await balanceOf({ contract: tokenContract, address });

    const prizeAmount = (Number(balance) / Math.pow(10, decimals)).toFixed(2);
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://YOUR_DOMAIN_HERE.com";

    return {
      title: `Raffle by ${owner.slice(0, 6)}...${owner.slice(-4)}`,
      description: `Win ${prizeAmount} ${symbol} in this onchain raffle`,
      openGraph: {
        title: `Raffle by ${owner.slice(0, 6)}...${owner.slice(-4)}`,
        description: `Win ${prizeAmount} ${symbol} in this onchain raffle`,
        images: [`${baseUrl}/api/og/${address}`],
        type: "website",
      },
      other: {
        "fc:frame": JSON.stringify({
          version: "1.0.0",
          imageUrl: `${baseUrl}/api/og/${address}`,
          button: {
            title: "View Raffle",
            action: {
              type: "launch_mini_app",
              url: `${baseUrl}/raffle/${address}`,
            },
          },
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Raffle",
      description: "View this onchain raffle",
    };
  }
}

export default function RaffleLayout({ children }: LayoutProps) {
  return <>{children}</>;
} 