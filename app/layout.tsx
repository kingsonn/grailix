import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/providers/wallet-provider";
import { ToastProvider } from "@/components/ToastContainer";

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
        <ToastProvider>
          <WalletProvider>{children}</WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
