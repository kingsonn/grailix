"use client";

/**
 * Leaderboard page - Display top users by XP
 * TODO: Implement API integration for leaderboard data
 */
export default function LeaderboardPage() {
  // Placeholder data
  const leaderboard = [
    { rank: 1, wallet: "0x1234...5678", xp: 1500, streak: 7, accuracy: 81.2 },
    { rank: 2, wallet: "0xabcd...efgh", xp: 1300, streak: 5, accuracy: 77.4 },
    { rank: 3, wallet: "0x9876...5432", xp: 1100, streak: 3, accuracy: 72.8 },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Wallet</th>
                <th className="text-right py-3 px-4">XP</th>
                <th className="text-right py-3 px-4">Streak</th>
                <th className="text-right py-3 px-4">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold">{entry.rank}</td>
                  <td className="py-3 px-4 font-mono">{entry.wallet}</td>
                  <td className="py-3 px-4 text-right">{entry.xp}</td>
                  <td className="py-3 px-4 text-right">{entry.streak}</td>
                  <td className="py-3 px-4 text-right">{entry.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
