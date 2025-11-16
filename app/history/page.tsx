import ClientOnly from "@/components/ClientOnly";
import HistoryClient from "@/components/HistoryClient";

/**
 * History Page - Server component wrapper for prediction history UI
 */
export default function HistoryPage() {
  return (
    <ClientOnly>
      <HistoryClient />
    </ClientOnly>
  );
}
