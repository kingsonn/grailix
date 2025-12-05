"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletControl from "./WalletControl";
import NotificationBell from "./NotificationBell";

export default function Navigation() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

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

          {/* Wallet Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected ? (
              <>
                <NotificationBell />
                <WalletControl />
              </>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => {
                  const ready = mounted;
                  return (
                    <div {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" } })}>
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 bg-gradient-to-r from-grail to-grail-light hover:from-grail-light hover:to-grail text-white border border-grail/50 rounded-lg transition-all font-mono font-bold shadow-lg shadow-grail/20"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        <span>CONNECT</span>
                      </button>
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
