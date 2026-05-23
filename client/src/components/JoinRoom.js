"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinRoom({ name }) {
  const [code, setCode] = useState(Array(6).fill(""));
  const router = useRouter();
  const inputRefs = useRef([]);

  // Auto-focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (e, index) => {
    const rawValue = e.target.value;
    // Strip non-alphanumeric characters
    const sanitized = rawValue.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (!sanitized) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    // Handle multi-character pasting
    if (sanitized.length > 2 || (sanitized.length > 1 && !code[index])) {
      const pastedData = sanitized.slice(0, 6 - index).split("");
      const newCode = [...code];
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);

      // Focus last pasted input or 5
      const lastFocusIndex = Math.min(index + pastedData.length - 1, 5);
      inputRefs.current[lastFocusIndex]?.focus();

      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleJoin(fullCode);
      }
      return;
    }

    // Handle single character typed (including replacing existing character)
    let finalChar = sanitized;
    if (sanitized.length > 1 && code[index]) {
      // Extract the new character typed, fallback to the last character
      finalChar = sanitized.replace(code[index], "").slice(0, 1) || sanitized.slice(-1);
    }

    const newCode = [...code];
    newCode[index] = finalChar;
    setCode(newCode);

    // Auto-focus next input
    if (index < 5 && finalChar) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      handleJoin(fullCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newCode = [...code];
      
      if (code[index]) {
        // Clear current box if filled
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        // Clear previous box and focus it
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleJoin = (roomCodeStr) => {
    if (!roomCodeStr || roomCodeStr.length < 6) return;
    router.push(`/room/${roomCodeStr.toLowerCase()}`);
  };

  return (
    <div className="flex flex-col gap-8 w-full items-center animate-in fade-in duration-500">
      <div className="flex justify-center gap-2 sm:gap-3 w-full max-w-sm px-2">
        {code.map((char, index) => (
          <motion.input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            value={char}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-10 h-12 sm:w-12 sm:h-14 bg-white/5 border border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 rounded-xl text-center text-xl sm:text-2xl font-mono font-black text-white uppercase focus:outline-none transition-all shadow-inner"
            whileFocus={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.3)" }}
            animate={char ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      <p className="text-[10px] text-center text-zinc-600 uppercase tracking-widest font-black">
        Enter 6-digit code to connect automatically
      </p>
    </div>
  );
}