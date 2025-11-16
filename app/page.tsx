import ClientOnly from "@/components/ClientOnly";
import HomeClient from "@/components/HomeClient";

/**
 * Home Dashboard - Main landing page with user stats
 * Server component wrapper for client-side dashboard
 */
export default function Home() {
  return (
    <ClientOnly>
      <HomeClient />
    </ClientOnly>
  );
}
