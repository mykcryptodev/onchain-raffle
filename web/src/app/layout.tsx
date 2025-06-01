import type { Metadata } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/ToastProvider";
import { FarcasterProvider } from "@/components/FarcasterProvider";

export const metadata: Metadata = {
  title: "Rofl House",
  description: "Create provably fair onchain raffles with any token",
  openGraph: {
    title: "Rofl House",
    description: "Create provably fair onchain raffles with any token",
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
      <body>
        <ThirdwebProvider>
          <FarcasterProvider>
            {children}
            <ToastProvider />
          </FarcasterProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
