import Link from "next/link";
import WalletConnectButton from "@/components/WalletConnectButton";

/**
 * Home page - Landing page with navigation
 */
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900">Grailix</h1>
        <p className="text-xl text-gray-600">
          AI-Powered Financial Prediction Skill Game
        </p>
        
        <div className="py-4">
          <WalletConnectButton />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link
            href="/swipe"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            Start Swiping
          </Link>
          <Link
            href="/wallet"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            Wallet
          </Link>
          <Link
            href="/leaderboard"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/profile"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
