import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/providers/wallet-provider";
import { ToastProvider } from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grailix – AI-Powered YES/NO Market Predictions | Fast, Fun, Autonomous",
  description:
    "Grailix turns real market news into simple YES/NO prediction cards. Swipe on stocks & crypto, stake mockUSDC, and get fast, transparent outcomes powered by autonomous AI. Try the next generation of financial prediction.",
  keywords: [
    "prediction markets",
    "AI predictions",
    "crypto predictions",
    "stock predictions",
    "yes no markets",
    "autonomous AI trading",
    "market news predictions",
    "gamified finance",
    "swiping interface",
    "USDC prediction app",
  ],
  authors: [{ name: "Grailix" }],
  openGraph: {
    title: "Grailix – Predict Markets in One Swipe",
    description:
      "Real news → Clean YES/NO prediction cards. Fast resolution, transparent payouts, fully autonomous AI.",
    type: "website",
    siteName: "Grailix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grailix – AI Market Predictions",
    description:
      "Swipe through AI-generated YES/NO predictions powered by real market news. Fast, fun, and global.",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
    other: [
      {
        rel: "manifest",
        url: "/favicon/site.webmanifest",
      },
    ],
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
        <ToastProvider>
          <WalletProvider>{children}</WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
