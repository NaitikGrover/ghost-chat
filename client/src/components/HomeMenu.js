"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import JoinRoom from "./JoinRoom";
import CreateRoom from "./CreateRoom";
import { Shuffle, Plus, LogIn, Users, ShieldCheck, Lock, EyeOff, Ghost } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeMenu({ name }) {
  const { avatarUrl, avatar } = useUser();
  const [mode, setMode] = useState("");

  if (mode === "join") {
    return (
      <div className="animate-in fade-in zoom-in duration-500 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-start gap-3">
          <button 
            onClick={() => setMode("")} 
            className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
          >
            ← Back to Lobby
          </button>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Join Room</h2>
        </div>
        <JoinRoom name={name} />
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="animate-in fade-in zoom-in duration-500 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-start gap-3">
          <button 
            onClick={() => setMode("")} 
            className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
          >
            ← Back to Lobby
          </button>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">New Room</h2>
        </div>
        <CreateRoom name={name} avatar={avatar} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Actions Section (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Hero Action: Random Chat */}
          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
            whileTap={{ scale: 0.99 }}
            className="bg-white/1 border border-white/5 rounded-3xl p-10 flex flex-col justify-between items-start text-left min-h-[260px] group transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.01)] hover:shadow-[0_0_80px_rgba(255,255,255,0.05)]"
          >
            <div className="flex justify-between w-full items-start">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white/70 group-hover:text-white transition-all">
                <Shuffle className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase font-sans">Active Link</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold font-sans">Connect Instantly</p>
              <h3 className="text-5xl font-black text-white tracking-tight uppercase font-sans">
                Random Chat
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm font-medium leading-relaxed font-sans">Pair with an anonymous peer through a secure encrypted tunnel.</p>
            </div>
          </motion.button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-5">
            <SecondaryAction 
              icon={<Plus className="w-6 h-6" />}
              title="New Session"
              label="Create Room"
              onClick={() => setMode("create")}
            />
            <SecondaryAction 
              icon={<LogIn className="w-6 h-6" />}
              title="Existing Link"
              label="Join Room"
              onClick={() => setMode("join")}
            />
          </div>
        </div>

        {/* Identity Module (Right Side) */}
        <div className="lg:col-span-4 bg-white/1 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-between group hover:bg-white/3 transition-all duration-700 overflow-hidden relative min-h-[440px]">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <Ghost className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-6 flex flex-col items-center w-full">
            <div className="relative">
              <div className="w-32 h-32 rounded-full p-px bg-linear-to-tr from-white/10 to-white/5">
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
              <h2 className="text-4xl font-black text-white tracking-tight uppercase font-sans">{name}</h2>
            </div>
          </div>

          <div className="w-full space-y-3 pt-8 border-t border-white/5 relative z-10">
            <StatusItem label="Encryption" value="SSL / TLS" color="text-white/60" />
            <StatusItem label="Traceability" value="Zero" color="text-white/40" />
          </div>
        </div>

      </div>
    </div>
  );
}

function SecondaryAction({ icon, title, label, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/1 border border-white/5 rounded-3xl p-8 flex flex-col justify-between items-start text-left group transition-all duration-500 min-h-[180px]"
    >
      <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-white/10 text-white/60 group-hover:text-white transition-all">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold font-sans">{title}</p>
        <h3 className="text-2xl font-black text-white tracking-tight uppercase font-sans">{label}</h3>
      </div>
    </motion.button>
  );
}

function StatusItem({ label, value, color }) {
  return (
    <div className="flex justify-between items-center px-2">
      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">{label}</span>
      <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${color}`}>{value}</span>
    </div>
  );
}