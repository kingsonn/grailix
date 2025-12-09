import ClientOnly from "@/components/ClientOnly";
import WhitepaperClient from "@/components/WhitepaperClient";

export const metadata = {
  title: "Whitepaper | Grailix",
  description: "Grailix Whitepaper v1.0 - The AI-powered prediction engine for global markets",
};

export default function WhitepaperPage() {
  return (
    <ClientOnly>
      <WhitepaperClient />
    </ClientOnly>
  );
}
