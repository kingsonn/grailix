"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function HomeClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading, refetch } = useUser();

  // Auto-refresh user data when wallet account changes
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Connect Wallet - Terminal Style */}
        {!isConnected && (
          <div className="fade-in py-4 sm:py-6 md:py-8">
            {/* Terminal Welcome */}
            <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4 sm:mb-6">
              {/* Terminal Title Bar */}
              <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                  <span className="text-gray-400 text-xs font-mono tracking-wider">SYSTEM_INIT</span>
                </div>
                <div className="flex items-center gap-2 bg-grail/10 px-2.5 py-1 rounded-full border border-grail/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                  <span className="text-grail-light text-xs font-mono font-bold">READY</span>
                </div>
              </div>
              
              {/* Terminal Content */}
              <div className="p-6 md:p-8">
                {/* Logo & Tagline */}
                <div className="text-center mb-8">
                  <h1 className="text-5xl md:text-6xl font-black font-mono mb-3 tracking-tight">
                    <span className="bg-grail-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                      GRAILIX
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl font-bold text-grail-pale mb-2 font-mono">
                    Outsmart the Market
                  </p>
                  <p className="text-gray-500 text-sm font-mono">
                    <span className="text-grail-light">PREDICT → EARN → DOMINATE</span>
                  </p>
                </div>

                {/* Connect Card */}
                <div className="max-w-md mx-auto bg-gradient-to-br from-grail/5 to-grail/10 border border-grail/30 rounded-lg p-6 md:p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-grail/10 border border-grail/40 flex items-center justify-center shadow-lg shadow-grail/20">
                      <span className="text-3xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-black mb-2 text-white font-mono">WALLET_AUTH</h2>
                    <p className="text-gray-400 text-sm font-mono leading-relaxed">
                      Initialize secure connection to access terminal
                    </p>
                  </div>
                  
                  <WalletConnectButton />
                  
                  {/* Features */}
                  <div className="mt-6 pt-6 border-t border-grail/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                      <div className="w-1 h-1 rounded-full bg-profit"></div>
                      <span>Predict and earn rewards</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                      <div className="w-1 h-1 rounded-full bg-auric"></div>
                      <span>Instant resolution</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isConnected && isLoading && (
          <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl fade-in">
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">LOADING_DATA</span>
            </div>
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-grail border-t-transparent mb-4"></div>
              <p className="text-grail-pale font-mono text-sm">Initializing terminal...</p>
            </div>
          </div>
        )}

        {/* User Dashboard - Terminal Style */}
        {isConnected && user && (
          <div className="fade-in space-y-4 py-4">
            {/* Terminal Header - Portfolio Overview */}
            <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
              {/* Terminal Title Bar */}
              <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
                  <span className="text-gray-400 text-xs font-mono tracking-wider">PORTFOLIO_OVERVIEW</span>
                </div>
                <div className="flex items-center gap-2 bg-profit/10 px-2.5 py-1 rounded-full border border-profit/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse shadow-lg shadow-profit/50"></div>
                  <span className="text-profit text-xs font-mono font-bold">LIVE</span>
                </div>
              </div>
              
              {/* Terminal Content - Compact */}
              <div className="p-4 md:p-6">
                {/* Compact Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Balance - Takes 2 cols on desktop */}
                  <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-auric/5 to-auric/10 border border-auric/30 rounded-lg p-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-auric text-xs font-mono uppercase">$</span>
                      <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">BALANCE</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black font-mono text-auric tabular-nums drop-shadow-[0_0_20px_rgba(255,193,7,0.3)]">
                        {user.real_credits_balance}
                      </span>
                      <span className="text-gray-500 text-sm font-mono">USDC</span>
                    </div>
                  </div>

                  {/* Win Rate - Compact */}
                  <div className={`bg-gradient-to-br ${user.accuracy >= 0.5 ? 'from-profit/5 to-profit/10 border-profit/30' : 'from-loss/5 to-loss/10 border-loss/30'} border rounded-lg p-4 transition-all hover:scale-105`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.accuracy >= 0.5 ? 'bg-profit shadow-lg shadow-profit/50' : 'bg-loss shadow-lg shadow-loss/50'} animate-pulse`}></div>
                      <span className="text-gray-400 text-xs font-mono uppercase">WIN_RATE</span>
                    </div>
                    <div className={`text-3xl font-black font-mono tabular-nums ${user.accuracy >= 0.5 ? 'profit-text drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'loss-text drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                      {(user.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Combined XP & Streak - Compact */}
                  <div className="bg-gradient-to-br from-grail/5 to-neon/5 border border-grail/30 rounded-lg p-4 transition-all hover:scale-105">
                    <div className="space-y-3">
                      {/* XP */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-grail shadow-lg shadow-grail/50 animate-pulse"></div>
                          <span className="text-gray-400 text-xs font-mono uppercase">XP</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-grail-light tabular-nums">
                          {user.xp}
                        </div>
                      </div>
                      {/* Streak */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-lg shadow-neon/50 animate-pulse"></div>
                          <span className="text-gray-400 text-xs font-mono uppercase">STREAK</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-neon tabular-nums">
                          {user.streak}<span className="text-sm text-gray-500 ml-1">d</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Predict Terminal */}
              <Link
                href="/predict"
                className="group bg-gradient-to-br from-void-black to-grail/5 border border-grail/30 hover:border-grail/60 rounded-lg overflow-hidden transition-all hover:shadow-xl hover:shadow-grail/20"
              >
                <div className="bg-gradient-to-r from-void-graphite to-grail/10 border-b border-grail/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">EXECUTE_PREDICTION</span>
                  </div>
                  <svg className="w-4 h-4 text-grail-light group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-grail/10 border border-grail/40 flex items-center justify-center shadow-lg shadow-grail/20 group-hover:scale-110 transition-transform">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-white mb-1 font-mono group-hover:text-grail-light transition-colors">PREDICT</h4>
                      <p className="text-xs text-gray-500 font-mono">Analyze markets → Place predictions</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Wallet Terminal */}
              <Link
                href="/wallet"
                className="group bg-gradient-to-br from-void-black to-auric/5 border border-auric/30 hover:border-auric/60 rounded-lg overflow-hidden transition-all hover:shadow-xl hover:shadow-auric/20"
              >
                <div className="bg-gradient-to-r from-void-graphite to-auric/10 border-b border-auric/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">MANAGE_FUNDS</span>
                  </div>
                  <svg className="w-4 h-4 text-auric group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-auric/10 border border-auric/40 flex items-center justify-center shadow-lg shadow-auric/20 group-hover:scale-110 transition-transform">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-white mb-1 font-mono group-hover:text-auric transition-colors">WALLET</h4>
                      <p className="text-xs text-gray-500 font-mono">Deposit → Withdraw → Transfer</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Terminal Quick Access */}
            <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
                  <span className="text-gray-400 text-xs font-mono tracking-wider">QUICK_ACCESS</span>
                </div>
                <span className="text-gray-600 text-xs font-mono">4 MODULES</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link
                    href="/predictions"
                    className="group bg-gradient-to-br from-void-graphite to-neon/5 hover:from-neon/10 hover:to-neon/20 border border-grail/20 hover:border-neon/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-neon/20"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                      <p className="text-xs font-mono font-bold text-gray-400 group-hover:text-neon transition-colors uppercase tracking-wider">Markets</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/history"
                    className="group bg-gradient-to-br from-void-graphite to-grail/5 hover:from-grail/10 hover:to-grail/20 border border-grail/20 hover:border-grail/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-grail/20"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📜</div>
                      <p className="text-xs font-mono font-bold text-gray-400 group-hover:text-grail-light transition-colors uppercase tracking-wider">History</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/leaderboard"
                    className="group bg-gradient-to-br from-void-graphite to-auric/5 hover:from-auric/10 hover:to-auric/20 border border-grail/20 hover:border-auric/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-auric/20"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏆</div>
                      <p className="text-xs font-mono font-bold text-gray-400 group-hover:text-auric transition-colors uppercase tracking-wider">Ranks</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="group bg-gradient-to-br from-void-graphite to-grail/5 hover:from-grail/10 hover:to-grail/20 border border-grail/20 hover:border-grail/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-grail/20"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👤</div>
                      <p className="text-xs font-mono font-bold text-gray-400 group-hover:text-grail-light transition-colors uppercase tracking-wider">Profile</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Terminal Status Bar */}
            <div className="bg-gradient-to-r from-void-black to-void-graphite/50 border border-grail/30 rounded-lg px-4 py-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-profit/10 px-3 py-1.5 rounded-full border border-profit/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse shadow-lg shadow-profit/50"></div>
                    <span className="text-gray-500">STATUS:</span>
                    <span className="text-profit font-bold">CONNECTED</span>
                  </div>
                  <div className="flex items-center gap-2 bg-grail/5 px-3 py-1.5 rounded border border-grail/30">
                    <span className="text-gray-500">WALLET:</span>
                    <span className="text-grail-pale font-mono">{user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 bg-void-graphite px-3 py-1.5 rounded border border-grail/20">
                  <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                  <span className="tracking-wider">GRAILIX_v1.0</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
