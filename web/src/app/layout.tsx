import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/ToastProvider";
import { FarcasterProvider } from "@/components/FarcasterProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rofl - Onchain Raffles",
  description: "Create provably fair onchain raffles with any token",
  openGraph: {
    title: "Rofl - Onchain Raffles",
    description: "Create provably fair onchain raffles with any token",
    images: ["/api/og"],
    type: "website",
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "1.0.0",
      imageUrl: `${process.env.NEXT_PUBLIC_URL || "https://onchain-raffle-sigma.vercel.app"}/api/og`,
      button: {
        title: "Open Raffle App",
        action: {
          type: "launch_mini_app",
          url: process.env.NEXT_PUBLIC_URL || "https://onchain-raffle-sigma.vercel.app",
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
