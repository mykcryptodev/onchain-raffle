import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/ToastProvider";
import { FarcasterProvider } from "@/components/FarcasterProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raffle - On-chain Raffles",
  description: "Create and participate in transparent on-chain raffles with any ERC20 token",
  openGraph: {
    title: "Raffle - On-chain Raffles",
    description: "Create and participate in transparent on-chain raffles with any ERC20 token",
    images: ["/api/og"],
    type: "website",
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "1.0.0",
      imageUrl: `${process.env.NEXT_PUBLIC_URL || "https://YOUR_DOMAIN_HERE.com"}/api/og`,
      button: {
        title: "Open Raffle App",
        action: {
          type: "launch_mini_app",
          url: process.env.NEXT_PUBLIC_URL || "https://YOUR_DOMAIN_HERE.com",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FarcasterProvider>
          <ThirdwebProvider>
            {children}
            <ToastProvider />
          </ThirdwebProvider>
        </FarcasterProvider>
      </body>
    </html>
  );
}
