"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function NameForm({ setName }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setName(input);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 w-[400px] animate-in fade-in duration-700"
    >
      <div className="relative group">
        <input
          type="text"
          placeholder="Enter your name"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-transparent border-b-2 border-white/10 p-4 pt-2 text-3xl text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <button
          type="submit"
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-all duration-300 ${
            input ? "text-white scale-110" : "text-white/20"
          }`}
        >
          <ArrowRight className="w-10 h-10 stroke-1" />
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-loose ml-1">
        Press Enter to initialize secure session.
      </p>
    </form>
  );
}