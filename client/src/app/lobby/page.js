"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import HomeMenu from "@/components/HomeMenu";
import { X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdyberLogo from "@/components/AdyberLogo";

/**
 * Lobby Page — Action hub for room creation, joining, and random connect.
 * @author NaitikGrover (naitik@adyber.com)
 */
export default function LobbyPage() {
  const { name, avatarUrl } = useUser();
  const [showMobileProfile, setShowMobileProfile] = useState(false);
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
    <main className="h-screen w-full flex flex-col relative z-10 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="w-full p-4 sm:p-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
        {/* Logo Section */}
        <div className="flex items-center">
          <AdyberLogo size="lg" />
        </div>

        {/* Mobile Profile Icon */}
        <button
          onClick={() => setShowMobileProfile(true)}
          className="lg:hidden w-10 h-10 rounded-full p-px bg-linear-to-tr from-white/15 to-white/5 border border-white/10 overflow-hidden bg-black flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-black animate-pulse" />
        </button>
      </nav>

      {/* Main Action Center */}
      <div className="flex-1 flex items-center justify-center py-6 px-4 sm:p-8">
        <Suspense fallback={<div className="text-white/50 text-sm">Loading...</div>}>
          <HomeMenu name={name} />
        </Suspense>
      </div>

      {/* Footer Info */}
      <footer className="w-full p-4 sm:p-8 flex justify-between items-center opacity-40">
        <div className="flex gap-12 text-[8px] uppercase tracking-[0.5em] text-zinc-500 font-black">
          {/* Technical labels removed */}
        </div>
      </footer>

      {/* Mobile Profile Detailed Modal */}
      <AnimatePresence>
        {showMobileProfile && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            {/* Backdrop Click to Close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileProfile(false)}
              className="absolute inset-0"
            />

            {/* Detailed Identity Module Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm bg-[#050506]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col items-center gap-6 shadow-2xl z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMobileProfile(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-6 left-6 opacity-30 pointer-events-none">
                <AdyberLogo size="xs" className="opacity-30" />
              </div>

              <div className="relative space-y-6 flex flex-col items-center w-full mt-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full p-px bg-linear-to-tr from-white/15 to-white/5">
                    <div className="w-full h-full rounded-full border border-white/5 overflow-hidden bg-[#0a0a0a] relative shadow-2xl">
                      <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-black border border-white/10 rounded-full shadow-2xl">
                    <ShieldCheck className="w-5 h-5 text-white/70" />
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold font-sans">Identity</p>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase font-sans">{name}</h2>
                </div>
              </div>

              <div className="w-full space-y-3 pt-6 border-t border-white/5 relative z-10">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">Encryption</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/60">SSL / TLS</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">Traceability</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Zero</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
