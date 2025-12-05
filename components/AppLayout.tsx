"use client";

import { ReactNode } from "react";
import Navigation from "./Navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-void-black">
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
