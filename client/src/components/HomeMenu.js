"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import JoinRoom from "./JoinRoom";
import CreateRoom from "./CreateRoom";
import { Shuffle, Plus, LogIn, Users, ShieldCheck, Lock, EyeOff, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdyberLogo from "./AdyberLogo";
import socket from "@/lib/socket";

export default function HomeMenu({ name }) {
  const { avatarUrl, avatar } = useUser();
  const [mode, setMode] = useState("");
  const [showRandomToast, setShowRandomToast] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const requeue = searchParams.get("requeue");

  const startQueuing = () => {
    setIsQueuing(true);
    socket.emit("join-random-queue", { name, avatar });
  };

  const cancelQueuing = () => {
    setIsQueuing(false);
    socket.emit("leave-random-queue");
  };

  // Re-queue automatically if returning from a skip
  useEffect(() => {
    if (requeue === "true" && name) {
      startQueuing();
      // Remove query param to prevent endless looping on page refreshes
      const url = new URL(window.location.href);
      url.searchParams.delete("requeue");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [requeue, name]);

  // Matchmaking listener
  useEffect(() => {
    const handleRandomMatch = ({ roomId }) => {
      setIsQueuing(false);
      router.push(`/room/${roomId}`);
    };

    socket.on("random-match", handleRandomMatch);

    return () => {
      socket.off("random-match", handleRandomMatch);
      // Clean up queue if unmounting
      socket.emit("leave-random-queue");
    };
  }, [router]);

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
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 sm:px-6">
      
      {/* Hacker-Chic Alert Toast */}
      <AnimatePresence>
        {showRandomToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-999 w-[90%] max-w-sm bg-[#0a0a0c]/95 backdrop-blur-3xl border border-red-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex items-center gap-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest block font-black mb-0.5">Access Restricted</span>
              <p className="text-xs font-semibold text-zinc-200 tracking-wide">
                Random tunneling protocol coming soon!
              </p>
            </div>
            <button 
              onClick={() => setShowRandomToast(false)}
              className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-Only Action List (Visible on screens < lg) */}
      <div className="lg:hidden flex flex-col gap-4 w-full px-1">
        
        {/* Join Session (Join Room) Mobile Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("join")}
          className="w-full bg-[#050505]/90 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 flex items-center justify-between text-left group transition-all duration-300 shadow-2xl cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Icon */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/70 group-hover:text-white transition-all shrink-0">
              <LogIn className="w-6 h-6" />
            </div>
            
            {/* Texts */}
            <div className="min-w-0">
              <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-bold font-sans block mb-0.5">Existing Link</span>
              <h3 className="text-xl font-black text-white tracking-tight uppercase font-sans">Join Room</h3>
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed font-sans truncate max-w-[190px] sm:max-w-xs">Enter a 6-digit code to connect.</p>
            </div>
          </div>
          
          {/* Chevron Indicator */}
          <span className="text-zinc-500 group-hover:text-white transition-colors text-sm pr-1 font-mono">→</span>
        </motion.button>

        {/* New Session (Create Room) Mobile Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("create")}
          className="w-full bg-[#050505]/90 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 flex items-center justify-between text-left group transition-all duration-300 shadow-2xl cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Icon */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/70 group-hover:text-white transition-all shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            
            {/* Texts */}
            <div className="min-w-0">
              <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-bold font-sans block mb-0.5">New Session</span>
              <h3 className="text-xl font-black text-white tracking-tight uppercase font-sans">Create Room</h3>
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed font-sans truncate max-w-[190px] sm:max-w-xs">Initialize a temporary encrypted room.</p>
            </div>
          </div>
          
          {/* Chevron Indicator */}
          <span className="text-zinc-500 group-hover:text-white transition-colors text-sm pr-1 font-mono">→</span>
        </motion.button>

        {/* Random Chat Mobile Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startQueuing}
          className="w-full bg-[#050505]/90 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 flex items-center justify-between text-left group transition-all duration-300 shadow-2xl relative overflow-hidden cursor-pointer"
        >


          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/70 group-hover:text-white transition-all shrink-0">
              <Shuffle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-bold font-sans block mb-0.5">Connect Instantly</span>
              <h3 className="text-xl font-black text-white tracking-tight uppercase font-sans">Random Chat</h3>
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed font-sans truncate max-w-[190px] sm:max-w-xs">Chat with someone randomly and anonymously.</p>
            </div>
          </div>
          
          {/* Active Status Beacon */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_6px_#22d3ee]" />
            <span className="text-[8px] font-bold text-zinc-500 tracking-wider uppercase font-mono">LIVE</span>
          </div>
        </motion.button>

      </div>

      {/* Desktop-Only Actions Grid (Visible on screens >= lg) */}
      <div className="hidden lg:grid grid-cols-12 gap-5 items-stretch">
        
        {/* Actions Section (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Hero Action: Random Chat */}
          <motion.button
            onClick={startQueuing}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white/1 hover:bg-white/3 border border-white/5 rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-start text-left min-h-[200px] sm:min-h-[260px] group transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.01)] hover:shadow-[0_0_80px_rgba(255,255,255,0.05)] w-full cursor-pointer"
          >
            <div className="flex justify-between w-full items-start">
              <div className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10 text-white/70 group-hover:text-white transition-all">
                <Shuffle className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase font-sans">Active Link</span>
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2 mt-4 sm:mt-0">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold font-sans">Connect Instantly</p>
              <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
                Random Chat
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-sm font-medium leading-relaxed font-sans">Chat with someone randomly and anonymously.</p>
            </div>
          </motion.button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
            <SecondaryAction 
              icon={<Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="New Session"
              label="Create Room"
              onClick={() => setMode("create")}
            />
            <SecondaryAction 
              icon={<LogIn className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Existing Link"
              label="Join Room"
              onClick={() => setMode("join")}
            />
          </div>
        </div>

        {/* Identity Module (Right Side) */}
        <div className="hidden lg:flex lg:col-span-4 bg-white/1 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 sm:p-8 flex-col items-center justify-between group hover:bg-white/3 transition-all duration-700 overflow-hidden relative min-h-[320px] sm:min-h-[440px] mt-4 lg:mt-0">
          <div className="absolute top-4 right-4 opacity-[0.06] pointer-events-none">
            <AdyberLogo size="lg" />
          </div>
          
          <div className="relative z-10 space-y-4 sm:space-y-6 flex flex-col items-center w-full">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-px bg-linear-to-tr from-white/10 to-white/5">
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
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-sans">{name}</h2>
            </div>
          </div>

          <div className="w-full space-y-3 pt-6 sm:pt-8 border-t border-white/5 relative z-10">
            <StatusItem label="Encryption" value="SSL / TLS" color="text-white/60" />
            <StatusItem label="Traceability" value="Zero" color="text-white/40" />
          </div>
        </div>

      </div>

      {/* Queuing / Searching for Peer Modal Overlay */}
      <AnimatePresence>
        {isQueuing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#050506]/98 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 relative overflow-hidden font-sans"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-500/50 blur-md" />

              {/* Animated Glowing Radar Pulse */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Outward Bouncing Glow rings */}
                <span className="absolute inset-0 rounded-full bg-cyan-400/5 animate-ping" style={{ animationDuration: "3s" }} />
                <span className="absolute inset-2 rounded-full border border-cyan-400/20 animate-pulse duration-1000" />
                <span className="absolute inset-4 rounded-full bg-cyan-500/10 animate-ping" style={{ animationDuration: "2s" }} />
                
                {/* Central Icon */}
                <div className="w-14 h-14 rounded-full bg-[#0a0a0c] border border-cyan-500/30 flex items-center justify-center text-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Shuffle className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_6px_#22d3ee]" />
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.3em] font-black">
                    Searching Network
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase font-sans">
                  Looking for match
                </h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px] mx-auto font-sans">
                  Finding an anonymous peer. You will connect automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelQueuing}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer group"
              >
                <span className="group-hover:text-white transition-colors font-sans">Cancel Search</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SecondaryAction({ icon, title, label, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/1 hover:bg-white/3 border border-white/5 rounded-3xl p-4 sm:p-8 flex flex-col justify-between items-start text-left group transition-all duration-500 min-h-[135px] sm:min-h-[180px] w-full cursor-pointer"
    >
      <div className="p-2.5 sm:p-4 bg-white/5 rounded-2xl group-hover:bg-white/10 text-white/60 group-hover:text-white transition-all shrink-0">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold font-sans">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase font-sans mt-0.5 sm:mt-1">{label}</h3>
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