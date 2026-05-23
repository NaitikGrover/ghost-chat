"use client";

import { useState, useEffect, useRef } from "react";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import { Settings, Clock, Users, Shield, Server, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const maxUsersOptions = [
  { value: 2, label: "2 Users" },
  { value: 3, label: "3 Users" },
  { value: 4, label: "4 Users" },
  { value: 5, label: "5 Users" },
  { value: 6, label: "6 Users" },
  { value: 7, label: "7 Users" },
  { value: 8, label: "8 Users" },
  { value: 9, label: "9 Users" },
  { value: 10, label: "10 Users" },
  { value: 15, label: "15 Users" },
  { value: 20, label: "20 Users" },
];

const durationOptions = [
  { value: 10, label: "10 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "1 Hour" },
  { value: 120, label: "2 Hours" },
  { value: 180, label: "3 Hours" },
  { value: 240, label: "4 Hours" },
  { value: 300, label: "5 Hours" },
];

export default function CreateRoom({ name, avatar }) {
  const [roomName, setRoomName] = useState("");
  const [maxUsers, setMaxUsers] = useState(2);
  const [duration, setDuration] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const handleRoomCreated = (data) => {
      router.push(`/room/${data.roomId}`);
    };

    socket.on("room-created", handleRoomCreated);

    return () => {
      socket.off("room-created", handleRoomCreated);
    };
  }, [router]);

  const createRoom = () => {
    socket.emit("create-room", {
      name,
      avatar,
      roomName: roomName.trim() || "My Room",
      maxUsers,
      duration
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative">
      <div className="flex flex-col gap-4 transition-all duration-300">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Server className="w-4 h-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-[#050505]/50 border border-white/10 hover:border-white/20 rounded-xl h-14 pl-12 pr-5 text-sm font-bold tracking-wide text-white focus:outline-none focus:border-white/40 transition-all placeholder:text-zinc-600 placeholder:font-medium shadow-inner"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect 
            options={maxUsersOptions} 
            value={maxUsers} 
            onChange={setMaxUsers} 
            direction="up"
            icon={<Users className="w-4 h-4 text-zinc-500" />}
          />
          <CustomSelect 
            options={durationOptions} 
            value={duration} 
            onChange={setDuration} 
            direction="up"
            icon={<Clock className="w-4 h-4 text-zinc-500" />}
          />
        </div>
        
        <button
          onClick={createRoom}
          className="w-full h-14 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

function CustomSelect({ options, value, onChange, icon, direction = "down" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];
  const isUp = direction === "up";

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border rounded-xl h-14 px-5 flex items-center justify-between transition-all focus:outline-none ${
          isOpen ? "border-white/30 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        <span className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
          {icon}
          {selectedOption.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${isUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"} left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-2`}
          >
            <div className="max-h-56 overflow-y-auto scrollbar-hide px-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm font-bold tracking-wide flex items-center justify-between transition-all my-0.5 ${
                    opt.value === value
                      ? "bg-white/10 text-white"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {opt.label}
                  </span>
                  {(opt.value === value) && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
