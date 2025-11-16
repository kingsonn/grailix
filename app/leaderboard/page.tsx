import ClientOnly from "@/components/ClientOnly";
import LeaderboardClient from "@/components/LeaderboardClient";

/**
 * Leaderboard Page - Server component wrapper for leaderboard UI
 */
export default function LeaderboardPage() {
  return (
    <ClientOnly>
      <LeaderboardClient />
    </ClientOnly>
  );
}
