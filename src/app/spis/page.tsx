"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

// Three.js / @react-three/fiber must run client-side only — disable SSR.
const SpisApp = dynamic(() => import("@/components/spis/SpisApp"), {
  ssr: false,
  loading: () => (
    <div className="pt-[100px] flex items-center justify-center h-screen text-muted-foreground">
      Loading SPIS…
    </div>
  ),
});

export default function SpisPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-[100px]">
        <SpisApp />
      </div>
    </div>
  );
}
