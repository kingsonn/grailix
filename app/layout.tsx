import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/providers/wallet-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GRAILIX - Outsmart the Market",
  description: "Professional prediction markets powered by blockchain. Make informed predictions and win rewards.",
  keywords: ["prediction market", "crypto", "trading", "blockchain", "web3", "predictions"],
  authors: [{ name: "Grailix" }],
  openGraph: {
    title: "GRAILIX - Outsmart the Market",
    description: "Professional prediction markets powered by blockchain",
    type: "website",
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
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
