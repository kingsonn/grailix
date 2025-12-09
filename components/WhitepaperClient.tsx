"use client";

import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function WhitepaperClient() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-8">
          <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">WHITEPAPER_v1.0</span>
            </div>
            <Link 
              href="/"
              className="text-gray-500 hover:text-grail-light text-xs font-mono transition-colors"
            >
              ← BACK_TO_HOME
            </Link>
          </div>
          
          <div className="p-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight mb-4">
              <span className="bg-grail-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                GRAILIX WHITEPAPER
              </span>
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              Version 1.0 • AI-Powered Global Prediction Markets
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-lg mb-8">
          <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">TABLE_OF_CONTENTS</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-mono">
              {[
                { num: "01", title: "Introduction" },
                { num: "02", title: "Problem" },
                { num: "03", title: "The Grailix Opportunity" },
                { num: "04", title: "What Grailix Does" },
                { num: "05", title: "AI Agent Architecture" },
                { num: "06", title: "Legal Model" },
                { num: "07", title: "Business Model" },
                { num: "08", title: "GRAIL Tokenomics" },
                { num: "09", title: "Roadmap" },
                { num: "10", title: "Conclusion" },
              ].map((item) => (
                <a
                  key={item.num}
                  href={`#section-${item.num}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-grail/10 transition-colors group"
                >
                  <span className="text-grail font-bold">{item.num}</span>
                  <span className="text-gray-400 group-hover:text-white transition-colors">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          
          {/* Section 1: Introduction */}
          <Section id="section-01" number="01" title="Introduction" icon="🚀">
            <p className="text-gray-300 leading-relaxed mb-4">
              Grailix is an autonomous AI-powered prediction engine that converts real-world market news into simple YES/NO prediction markets for global users.
            </p>
            <p className="text-gray-300 leading-relaxed mb-6">
              We bridge the gap between traditional trading (complex, slow, intimidating) and modern consumer behavior (fast, gamified, mobile-first).
            </p>
            <div className="bg-grail/5 border border-grail/30 rounded-lg p-4">
              <h4 className="text-grail-light font-mono font-bold mb-2 flex items-center gap-2">
                <span>🎯</span> Vision
              </h4>
              <p className="text-gray-300 italic">
                To become the world’s leading platform for making and monetizing predictions, powered by a fully autonomous AI market engine.
              </p>
            </div>
          </Section>

          {/* Section 2: Problem */}
          <Section id="section-02" number="02" title="Problem" icon="⚠️">
            <p className="text-gray-300 leading-relaxed mb-4">
              Retail users everywhere face the same issues:
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Markets move too fast",
                "News is confusing unless you're an expert",
                "Trading requires charts, TA, options, macro knowledge",
                "Prediction markets resolve slowly (days or weeks)",
                "Complexity → paralysis → missed opportunities",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-loss mt-1">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-loss/5 border border-loss/30 rounded-lg p-4">
              <p className="text-gray-300">
                <span className="text-loss font-bold">Billions</span> of users want simple financial participation, but current platforms demand too much effort.
              </p>
            </div>
          </Section>

          {/* Section 3: The Grailix Opportunity */}
          <Section id="section-03" number="03" title="The Grailix Opportunity" icon="💡">
            <p className="text-gray-300 leading-relaxed mb-4">
              There are <span className="text-auric font-bold">billions</span> of mobile-first users globally who:
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Want quick, low-friction market participation",
                "Prefer simple choices over trading complexity",
                "Want instant dopamine feedback cycles",
                "Want transparency and fairness",
                "Want global access using stablecoins",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-profit mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <p className="text-gray-300 leading-relaxed mb-4">
              Existing prediction markets are <span className="text-loss">not</span>:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              {["Mobile-first", "Simple", "Short-term", "AI-powered", "Mainstream"].map((item, i) => (
                <div key={i} className="bg-loss/10 border border-loss/30 rounded px-3 py-2 text-center">
                  <span className="text-gray-400 text-sm font-mono">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-profit/5 border border-profit/30 rounded-lg p-4">
              <p className="text-profit font-bold font-mono">
                Grailix fills this gap perfectly.
              </p>
            </div>
          </Section>

          {/* Section 4: What Grailix Does */}
          <Section id="section-04" number="04" title="What Grailix Does" icon="⚡">
            <p className="text-gray-300 leading-relaxed mb-4">
              Grailix converts real market signals into short-term prediction cards like:
            </p>
            <div className="grid gap-3 mb-6">
              {[
                '&quot;Will TSLA open higher tomorrow?&quot;',
                '&quot;Will BTC be higher in 3 hours?&quot;',
                '&quot;Will NVDA close red today?&quot;',
              ].map((item, i) => (
                <div key={i} className="bg-void-graphite border border-grail/30 rounded-lg px-4 py-3">
                  <span className="text-grail-light font-mono">{item}</span>
                </div>
              ))}
            </div>
            
            <p className="text-gray-300 leading-relaxed mb-6">
              Users stake <span className="text-auric font-bold">USDC</span> (in licensed markets) or <span className="text-grail-light font-bold">Grail Credits</span> (in sweepstakes markets) to participate.
            </p>
            
            <h4 className="text-white font-mono font-bold mb-4">Key Attributes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "⚡", title: "Fast", desc: "Resolutions in hours, not days" },
                { icon: "✨", title: "Clean UI", desc: "Swipe-based Tinder-like interface" },
                { icon: "🔥", title: "Addictive", desc: "Streaks, XP, leaderboards" },
                { icon: "⛓️", title: "Fair", desc: "On-chain price resolution" },
                { icon: "🤖", title: "AI-Generated", desc: "No humans in the loop" },
              ].map((item, i) => (
                <div key={i} className="bg-void-graphite border border-grail/20 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h5 className="text-white font-mono font-bold">{item.title}</h5>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 5: AI Agent Architecture */}
          <Section id="section-05" number="05" title="AI Agent Architecture" icon="🤖">
            <p className="text-gray-400 font-mono text-sm mb-6 uppercase tracking-wider">Autonomous Market Engine</p>
            
            {/* Agent 1 */}
            <div className="bg-void-graphite border border-neon/30 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h4 className="text-neon font-mono font-bold">Agent 1 — Ingestor</h4>
                </div>
              </div>
              <p className="text-gray-300 mb-3">Scans trusted market sources and extracts:</p>
              <div className="flex flex-wrap gap-2">
                {["Ticker", "Asset class", "News sentiment", "Analyst predictions", "Timing relevance"].map((item, i) => (
                  <span key={i} className="bg-neon/10 text-neon text-xs font-mono px-2 py-1 rounded">{item}</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-3 italic">Produces structured raw signals.</p>
            </div>
            
            {/* Agent 2 */}
            <div className="bg-void-graphite border border-grail/30 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-grail/10 border border-grail/30 flex items-center justify-center">
                  <span className="text-xl">🧠</span>
                </div>
                <div>
                  <h4 className="text-grail-light font-mono font-bold">Agent 2 — Standardizer</h4>
                </div>
              </div>
              <p className="text-gray-300 mb-3">Transforms raw data into perfectly valid prediction cards by:</p>
              <ul className="space-y-1 mb-4">
                {[
                  "Understanding sentiment and creating prediction cards using LLM",
                  "Determining expiry using live market hours",
                  "Selecting reference price (open, close, current)",
                  "Validating ticker correctness",
                  "Generating clean YES/NO predictions",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-grail">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-profit/5 border border-profit/30 rounded p-3">
                <p className="text-sm font-mono text-gray-300">
                  <span className="text-profit font-bold">Guarantees:</span> No wrong expiry • No invalid cards • No holiday mistakes • No random guessing
                </p>
              </div>
            </div>
            
            {/* Agent 3 */}
            <div className="bg-void-graphite border border-auric/30 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-auric/10 border border-auric/30 flex items-center justify-center">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h4 className="text-auric font-mono font-bold">Agent 3 — Resolver</h4>
                </div>
              </div>
              <p className="text-gray-300 mb-3">Every minute:</p>
              <ul className="space-y-1 mb-4">
                {[
                  "Detects expired predictions",
                  "Fetches reference prices",
                  "Calculates winners",
                  "Resolves using pari-mutuel pools",
                  "Updates balances",
                  "Stores prediction_hash & outcome_hash on-chain (BSC testnet)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-auric">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-auric/5 border border-auric/30 rounded p-3">
                <p className="text-sm text-gray-300">
                  This creates <span className="text-auric font-bold">cryptographic trust</span> and <span className="text-auric font-bold">transparency</span>.
                </p>
              </div>
            </div>
          </Section>

          {/* Section 6: Legal Model */}
          <Section id="section-06" number="06" title="Legal Model" icon="⚖️">
            <p className="text-gray-300 leading-relaxed mb-6">
              To operate globally without legal risk, Grailix uses a <span className="text-grail-light font-bold">dual-market strategy</span>:
            </p>
            
            {/* Phase A */}
            <div className="bg-void-graphite border border-profit/30 rounded-lg p-5 mb-4">
              <h4 className="text-profit font-mono font-bold mb-3 flex items-center gap-2">
                <span className="bg-profit/20 px-2 py-0.5 rounded text-xs">PHASE A</span>
                Offshore Licensed Markets (Real USDC)
              </h4>
              <ul className="space-y-2">
                {[
                  "Operate only in allowed regions (LATAM, SEA, Africa)",
                  "Use a Curaçao B2C license",
                  "Real USDC staking",
                  "Real payouts",
                  "Full compliance + PSP access",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-profit">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Phase B */}
            <div className="bg-void-graphite border border-neon/30 rounded-lg p-5 mb-4">
              <h4 className="text-neon font-mono font-bold mb-3 flex items-center gap-2">
                <span className="bg-neon/20 px-2 py-0.5 rounded text-xs">PHASE B</span>
                U.S. Sweepstakes Model
              </h4>
              <p className="text-gray-300 text-sm mb-3">To legally enter 40+ states:</p>
              <ul className="space-y-2 mb-4">
                {[
                  "Users never pay to enter a prediction",
                  "Users receive free Grail Points daily",
                  "Users can purchase Grail Cash (entertainment currency) but it cannot be used to stake",
                  "Prizes are awarded based on leaderboard performance",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-neon">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-neon/5 border border-neon/30 rounded p-3">
                <p className="text-sm text-gray-300">
                  This removes &quot;consideration&quot; → <span className="text-neon font-bold">legal sweepstakes</span> → compliant.
                </p>
              </div>
            </div>
            
            {/* Global Free Tier */}
            <div className="bg-void-graphite border border-grail/30 rounded-lg p-5">
              <h4 className="text-grail-light font-mono font-bold mb-3">Global Free Tier</h4>
              <p className="text-gray-300 text-sm mb-2">In geo-restricted zones (India):</p>
              <ul className="space-y-1">
                {[
                  "Users can play with free non-monetary coins",
                  "Builds user base ethically + safely",
                  "No risk because no value is transferred",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-grail">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Section 7: Business Model */}
          <Section id="section-07" number="07" title="Business Model" icon="💰">
            <div className="bg-void-graphite border border-auric/30 rounded-lg p-5 mb-4">
              <h4 className="text-auric font-mono font-bold mb-3">Primary Revenue Stream (Phase A)</h4>
              <p className="text-gray-300 mb-4">
                <span className="text-auric font-bold text-2xl">5%</span> fee from losing pool.
              </p>
            </div>
            
          
          </Section>

          {/* Section 8: GRAIL Tokenomics */}
          <Section id="section-08" number="08" title="GRAIL Tokenomics" icon="🪙">
            <p className="text-gray-400 font-mono text-sm mb-6">Simple Explanation</p>
            
            <div className="bg-void-graphite border border-grail/30 rounded-lg p-5 mb-6">
              <h4 className="text-white font-mono font-bold mb-3">Purpose of the Token</h4>
              <p className="text-gray-300">
                The token exists to <span className="text-grail-light font-bold">power the ecosystem</span>, not the predictions themselves.
              </p>
            </div>
            
            <h4 className="text-white font-mono font-bold mb-4">Utilities</h4>
            
            {/* Utility 1 */}
            <div className="bg-void-graphite border border-auric/30 rounded-lg p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-auric/20 text-auric text-xs font-mono px-2 py-0.5 rounded">1</span>
                <h5 className="text-auric font-mono font-bold">Revenue Share (Core Utility)</h5>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                A portion of platform fees goes into a pool. The platform redistributes 35% of the pool to stakers.
              </p>
              <div className="bg-profit/5 border border-profit/30 rounded p-3">
                <p className="text-sm text-gray-300">
                  <span className="text-profit font-bold">Why it works:</span> It creates a direct link between platform success → token value.
                </p>
              </div>
            </div>
            
            {/* Utility 2 */}
            <div className="bg-void-graphite border border-neon/30 rounded-lg p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-neon/20 text-neon text-xs font-mono px-2 py-0.5 rounded">2</span>
                <h5 className="text-neon font-mono font-bold">Governance (Non-financial)</h5>
              </div>
              <p className="text-gray-300 text-sm mb-3">Token holders can vote on:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {["Feature priorities", "UX changes", "Risk parameters", "Market categories"].map((item, i) => (
                  <span key={i} className="bg-neon/10 text-neon text-xs font-mono px-2 py-1 rounded">{item}</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm italic">Not related to profit → avoids security classification.</p>
            </div>
            
            {/* Utility 3 */}
            <div className="bg-void-graphite border border-grail/30 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-grail/20 text-grail text-xs font-mono px-2 py-0.5 rounded">3</span>
                <h5 className="text-grail-light font-mono font-bold">Tournament Entry & Rewards</h5>
              </div>
              <p className="text-gray-300 text-sm">
                Quarterly tournaments based on XP. Entry requires staking a small amount of GRAIL. Winners receive GRAIL or crypto rewards. Creates recurring token demand.
              </p>
            </div>
            
            {/* Token Supply */}
            <div className="bg-grail/5 border border-grail/30 rounded-lg p-5">
              <h4 className="text-white font-mono font-bold mb-4">Token Supply</h4>
              <p className="text-gray-300 mb-4">
                <span className="text-grail-light font-bold text-2xl">1,000,000,000</span> <span className="text-gray-500">Total Supply</span>
              </p>
              <p className="text-gray-400 text-sm mb-4">No large VC allocation → community-friendly. Vesting to avoid dumping.</p>
              
              <div className="space-y-2">
                {[
                  { pct: "35%", label: "Ecosystem + Rewards", color: "bg-profit" },
                  { pct: "25%", label: "Treasury (buybacks + stability)", color: "bg-auric" },
                  { pct: "20%", label: "Team (4-year vest)", color: "bg-grail" },
                  { pct: "10%", label: "Liquidity", color: "bg-neon" },
                  { pct: "10%", label: "Public Sale / IDO", color: "bg-loss" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded ${item.color}`}></div>
                    <span className="text-white font-mono font-bold w-12">{item.pct}</span>
                    <span className="text-gray-400 text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Section 9: Roadmap */}
          <Section id="section-09" number="09" title="Roadmap" icon="🗺️">
            <div className="space-y-4">
              {[
                {
                  phase: "Phase 0",
                  title: "Foundation",
                  status: "CURRENT",
                  statusColor: "bg-profit text-profit",
                  items: [
                    "Build core platform",
                    "AI agents live (ingestor → standardizer → resolver)",
                    "On-chain deposits & withdrawals working",
                    "Community building + early user acquisition",
                    "Prepare legal documentation",
                    "Prepare token design & whitepaper",
                  ],
                },
                {
                  phase: "Phase 1",
                  title: "Mainnet Launch",
                  status: "UPCOMING",
                  statusColor: "bg-neon/20 text-neon",
                  items: [
                    "Initial community launch of live prediction markets",
                    "Onboard core power users and early adopters",
                    "Validate core loops (swipes, streaks, XP, leaderboards)",
                    "Tight feedback cycles to iterate UX and market design",
                    "Aim for early product–market fit signals",
                  ],
                },
                {
                  phase: "Phase 2",
                  title: "Licensed USDC Markets (Curaçao)",
                  status: "PLANNED",
                  statusColor: "bg-grail/20 text-grail-light",
                  items: [
                    "Obtain full Curaçao license",
                    "Enable real USDC staking for offshore markets",
                    "Integrate PSPs + fiat on-ramps",
                    "Launch real-money version in LATAM, SEA",
                    "Begin generating real revenue",
                  ],
                },
                {
                  phase: "Phase 3",
                  title: "Token Launch (Global)",
                  status: "PLANNED",
                  statusColor: "bg-grail/20 text-grail-light",
                  items: [
                    "IDO via Seedify / partners",
                    "Enable staking + fee share rewards",
                    "Launch tournaments gated by GRAIL",
                    "Begin buyback & burn mechanism",
                    "Expand on-chain transparency tooling",
                  ],
                },
                {
                  phase: "Phase 4",
                  title: "US Launch (Sweepstakes)",
                  status: "PLANNED",
                  statusColor: "bg-grail/20 text-grail-light",
                  items: [
                    "Launch fully compliant sweepstakes model",
                    "Dual-currency (free points + paid entertainment currency)",
                    "Crypto prize drops",
                    "Expansion across 40+ U.S. states",
                  ],
                },
                {
                  phase: "Phase 5",
                  title: "AI Market Layer (Future Vision)",
                  status: "VISION",
                  statusColor: "bg-auric/20 text-auric",
                  items: [
                    "Expand AI agents",
                    "Multi-asset prediction categories",
                    "Enterprise market intelligence APIs",
                    "Partner integrations (exchanges, consumer apps)",
                  ],
                },
              ].map((phase, i) => (
                <div key={i} className="bg-void-graphite border border-grail/20 rounded-lg p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-grail font-mono font-bold">📍 {phase.phase}</span>
                    <span className="text-white font-mono">— {phase.title}</span>
                    <span className={`${phase.statusColor} text-xs font-mono px-2 py-0.5 rounded`}>{phase.status}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-gray-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 10: Conclusion */}
          <Section id="section-10" number="10" title="Conclusion" icon="🏁">
            <p className="text-gray-300 leading-relaxed mb-6">
              Grailix isn&apos;t another prediction market — it is:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: "🤖", text: "An AI-driven autonomous engine" },
                { icon: "⚡", text: "A fast, short-term, addictive consumer platform" },
                { icon: "⚖️", text: "A globally scalable, legally compliant product" },
                { icon: "🔗", text: "A transparent on-chain trust layer" },
                { icon: "🪙", text: "A token ecosystem with real value creation" },
              ].map((item, i) => (
                <div key={i} className="bg-void-graphite border border-grail/20 rounded-lg p-4 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-grail/5 border border-grail/30 rounded-lg p-6 text-center">
              <p className="text-gray-300 leading-relaxed mb-4">
                We believe Grailix represents the <span className="text-grail-light font-bold">next evolution</span> of market participation, combining:
              </p>
              <p className="text-xl font-mono font-bold">
                <span className="text-neon">AI</span>
                <span className="text-gray-500"> × </span>
                <span className="text-grail-light">Prediction Markets</span>
                <span className="text-gray-500"> × </span>
                <span className="text-profit">Compliance</span>
                <span className="text-gray-500"> × </span>
                <span className="text-auric">Consumer UX</span>
                <span className="text-gray-500"> × </span>
                <span className="text-loss">Crypto Architecture</span>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-12 bg-gradient-to-r from-void-black to-void-graphite/50 border border-grail/30 rounded-lg px-6 py-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
              <span className="text-gray-500">DOCUMENT:</span>
              <span className="text-grail-pale">WHITEPAPER_v1.0</span>
            </div>
            <Link 
              href="/"
              className="text-gray-500 hover:text-grail-light transition-colors"
            >
              ← RETURN_TO_TERMINAL
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Section Component
function Section({ 
  id, 
  number, 
  title, 
  icon, 
  children 
}: { 
  id: string; 
  number: string; 
  title: string; 
  icon: string; 
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-lg scroll-mt-20">
      <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-3 flex items-center gap-3">
        <span className="text-grail font-mono font-bold text-lg">{number}</span>
        <h2 className="text-white font-mono font-bold text-lg">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}
