"use client";

import { useEffect } from "react";
import NameForm from "@/components/NameForm";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Shield, Lock, EyeOff } from "lucide-react";
import AdyberLogo from "@/components/AdyberLogo";

/**
 * Landing / Name Initialization Page
 * @author NaitikGrover (naitik@adyber.com)
 */
export default function Home() {
  const { name, updateName } = useUser();
  const router = useRouter();

  // If user already has a name, take them straight to the intended room or lobby
  useEffect(() => {
    if (name) {
      const intendedRoom = sessionStorage.getItem("intended_room");
      if (intendedRoom) {
        sessionStorage.removeItem("intended_room");
        router.push(`/room/${intendedRoom}`);
      } else {
        router.push("/lobby");
      }
    }
  }, [name, router]);

  const handleNameSubmit = (userName) => {
    updateName(userName);
  };

  return (
    <main className="h-screen w-full flex relative z-10 overflow-y-auto md:overflow-hidden font-sans">
      <div className="flex flex-col md:flex-row w-full h-full p-4 md:p-6 gap-8 md:gap-0">
        
        {/* Mobile-Only Top Platform Header */}
        <div className="md:hidden w-full flex flex-col items-center pt-8 animate-in fade-in duration-700 shrink-0">
          <AdyberLogo size="xl" />
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_4px_#22d3ee]" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none">Protocol Secure</span>
          </div>
        </div>

        {/* Left Side: Secure Module */}
        <div className="hidden md:flex w-full md:w-[38%] h-auto md:h-full flex-col justify-center shrink-0">
          <div className="bg-[#050505]/90 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 p-6 sm:p-12 flex flex-col gap-6 sm:gap-12 shadow-2xl max-h-none md:max-h-[92vh] overflow-hidden">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <AdyberLogo size="hero" />
                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest border border-white/5 px-2 py-1 rounded-md">v1.0.4</span>
              </div>
              <div className="h-px w-full bg-white/3" />
              <p className="text-zinc-500 text-sm font-light leading-relaxed">
                An encrypted peer-to-peer communication layer designed for absolute silence and security.
              </p>
            </div>

            <div className="space-y-3">
              <ProtocolItem label="Identity" value="Anonymous" icon={<EyeOff className="w-4 h-4" />} />
              <ProtocolItem label="Security" value="E2E Encrypted" icon={<Lock className="w-4 h-4" />} />
              <ProtocolItem label="Retention" value="Zero Log" icon={<Shield className="w-4 h-4" />} />
            </div>

            <div className="mt-auto flex items-center justify-between opacity-40 pt-4 sm:pt-0">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-[8px] uppercase tracking-[0.4em] text-white font-bold">Protocol Active</span>
              </div>
              <Shield className="w-4 h-4 text-white" />
            </div>

          </div>
        </div>

        {/* Right Side: Name Entry */}
        <div className="flex-1 flex items-center justify-center py-10 md:py-0 shrink-0">
          <NameForm setName={handleNameSubmit} />
        </div>

      </div>
    </main>
  );
}

function ProtocolItem({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 rounded-full bg-white/2 border border-white/2 transition-all">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-zinc-700">{icon}</div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-bold">{label}</span>
      </div>
      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{value}</span>
    </div>
  );
}