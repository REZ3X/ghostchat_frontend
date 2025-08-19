"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiSparkles, HiClipboard, HiArrowRight } from "react-icons/hi2";
import { generateRoomToken } from "../utils/crypto";

export default function TokenGenerator() {
  const [token, setToken] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    const newToken = generateRoomToken();
    setToken(newToken);
    setIsGenerating(false);
  };

  const handleCreateRoom = () => {
    if (token) {
      router.push(`/room/${token}`);
    }
  };

  const copyToClipboard = async () => {
    if (token) {
      const url = `${window.location.origin}/room/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
        Create New Room
      </h2>
      
      <button
        onClick={handleGenerateToken}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-xl py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-3"
      >
        <HiSparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isGenerating ? 'animate-spin' : ''}`} />
        <span className="text-sm sm:text-base font-medium">
          {isGenerating ? "Generating..." : "Generate Room Token"}
        </span>
      </button>

      {token && (
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 animate-in fade-in duration-300">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              Room Token:
            </div>
            <div className="font-mono text-base sm:text-lg text-green-400 font-medium tracking-wider">
              {token}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2"
            >
              <HiClipboard className="w-4 h-4" />
              <span className="text-sm sm:text-base">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>
            
            <button
              onClick={handleCreateRoom}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2"
            >
              <span className="text-sm sm:text-base">Enter Room</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}