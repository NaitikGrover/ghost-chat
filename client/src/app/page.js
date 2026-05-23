"use client";

import { useEffect } from "react";
import NameForm from "@/components/NameForm";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Shield, Lock, Ghost, EyeOff } from "lucide-react";

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
    <main className="h-screen w-full flex relative z-10 overflow-hidden font-sans">
      <div className="flex w-full h-full p-4 md:p-6">
        
        {/* Left Side: Secure Module */}
        <div className="w-full md:w-[38%] h-full flex flex-col justify-center">
          <div className="bg-[#050505]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-12 flex flex-col gap-12 shadow-2xl max-h-[92vh] overflow-hidden">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-[0.9]">
                  Ghost<br/><span className="text-zinc-800 not-italic font-thin">Chat</span>
                </h1>
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
              <ProtocolItem label="Retention" value="Zero Log" icon={<Ghost className="w-4 h-4" />} />
            </div>

            <div className="mt-auto flex items-center justify-between opacity-40">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-[8px] uppercase tracking-[0.4em] text-white font-bold">Protocol Active</span>
              </div>
              <Shield className="w-4 h-4 text-white" />
            </div>

          </div>
        </div>

        {/* Right Side: Name Entry */}
        <div className="flex-1 flex items-center justify-center">
          <NameForm setName={handleNameSubmit} />
        </div>

      </div>
    </main>
  );
}

function ProtocolItem({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 rounded-full bg-white/2 border border-white/2 transition-all">
      <div className="flex items-center gap-4">
        <div className="text-zinc-700">{icon}</div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-bold">{label}</span>
      </div>
      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{value}</span>
    </div>
  );
}