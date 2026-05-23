"use client";

import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import HomeMenu from "@/components/HomeMenu";
import { Ghost } from "lucide-react";

export default function LobbyPage() {
  const { name } = useUser();
  const router = useRouter();

  // If no name is set, redirect back to the entry page
  useEffect(() => {
    if (!name) {
      const timeout = setTimeout(() => {
        if (!sessionStorage.getItem("ghost_name")) {
          router.push("/");
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [name, router]);

  return (
    <main className="h-screen w-full flex flex-col relative z-10 overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="w-full p-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center">
            <Ghost className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
            Ghost<span className="text-zinc-600 not-italic font-thin">Chat</span>
          </h1>
        </div>
      </nav>

      {/* Main Action Center */}
      <div className="flex-1 flex items-center justify-center p-4">
        <HomeMenu name={name} />
      </div>

      {/* Footer Info */}
      <footer className="w-full p-8 flex justify-between items-center opacity-40">
        <div className="flex gap-12 text-[8px] uppercase tracking-[0.5em] text-zinc-500 font-black">
          {/* Technical labels removed */}
        </div>
      </footer>
    </main>
  );
}


