"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import WalletControl from "./WalletControl";

export default function Navigation() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  
  // Hide navbar on home page when not connected
  if (pathname === "/" && !isConnected) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/predict", label: "Predict", icon: "⚡" },
    { href: "/wallet", label: "Wallet", icon: "💰" },
    { href: "/predictions", label: "Markets", icon: "📈" },
    { href: "/history", label: "History", icon: "📜" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-void-black border-b border-grail/30 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Terminal Style */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="Grailix Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight bg-grail-gradient bg-clip-text text-transparent">
              GRAILIX
            </h1>
          </Link>

          {/* Wallet Control - Only show when connected */}
          {isConnected && (
            <div className="flex-shrink-0">
              <WalletControl />
            </div>
          )}
        </div>
      </div>

    </nav>
  );
}
