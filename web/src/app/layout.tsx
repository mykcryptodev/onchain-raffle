import type { Metadata } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/components/ToastProvider";
import { FarcasterProvider } from "@/components/FarcasterProvider";
import { QueryProvider } from "@/providers/QueryProvider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
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
      imageUrl: `${APP_URL}/api/og`,
      button: {
        title: "Open Raffle App",
        action: {
          type: "launch_mini_app",
          url: APP_URL,
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
          <QueryProvider>
            <FarcasterProvider>
              {children}
              <ToastProvider />
            </FarcasterProvider>
          </QueryProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
