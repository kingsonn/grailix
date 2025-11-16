import ClientOnly from "@/components/ClientOnly";
import WalletClient from "@/components/WalletClient";

/**
 * Wallet Page - Server component wrapper for wallet operations UI
 */
export default function WalletPage() {
  return (
    <ClientOnly>
      <WalletClient />
    </ClientOnly>
  );
}
