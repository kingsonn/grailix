import ClientOnly from "@/components/ClientOnly";
import PredictClient from "@/components/PredictClient";

/**
 * Predict Page - Server component wrapper for prediction swipe UI
 */
export default function PredictPage() {
  return (
    <ClientOnly>
      <PredictClient />
    </ClientOnly>
  );
}
