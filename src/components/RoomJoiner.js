"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiKey, HiArrowRight } from "react-icons/hi2";

export default function RoomJoiner() {
  const [token, setToken] = useState("");
  const router = useRouter();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (token.trim()) {
      const cleanToken = token.trim().toUpperCase();
      router.push(`/room/${cleanToken}`);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
        Join Existing Room
      </h2>
      
      <form onSubmit={handleJoinRoom} className="space-y-3 sm:space-y-4">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter room token (e.g., ABC-123-XYZ)"
          className="w-full bg-white/5 backdrop-blur-sm border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-3 sm:px-4 sm:py-4 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
        />
        
        <button
          type="submit"
          disabled={!token.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-xl py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-3"
        >
          <HiKey className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">Join Room</span>
          <HiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
}