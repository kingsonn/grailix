"use client";

import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  
  // Check if navbar is shown (hidden on home page when not connected)
  const showNavbar = !(pathname === "/" && !isConnected);
  
  return (
    <div className="min-h-screen bg-void-black">
      <Navigation />
      <main className={showNavbar ? "pt-16" : "pt-0"}>
        {children}
      </main>
    </div>
  );
}
