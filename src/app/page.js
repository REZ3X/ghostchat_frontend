"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  HiCalculator, 
  HiEye, 
  HiFingerPrint,
  HiShieldCheck,
  HiClock
} from "react-icons/hi2";
import TokenGenerator from "../components/TokenGenerator";
import RoomJoiner from "../components/RoomJoiner";
import { generateAgentId } from "../utils/crypto";

export default function Home() {
  const [agentId, setAgentId] = useState("");
  const [stealthMode, setStealthMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = generateAgentId();
    setAgentId(id);

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        setStealthMode(!stealthMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stealthMode]);

  if (stealthMode) {
    return (
      <div className="stealth-mode min-h-screen p-4 sm:p-8">
        <div className="max-w-md sm:max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <HiCalculator className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
            <h1 className="text-xl sm:text-2xl font-bold">Calculator</h1>
          </div>
          
          <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[...Array(16)].map((_, i) => (
                <button
                  key={i}
                  className="bg-gray-100 hover:bg-gray-200 p-3 sm:p-4 rounded-lg text-center transition-colors font-medium"
                >
                  {i < 10 ? i : ["+", "-", "×", "÷", "=", "C"][i - 10]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Shift+S</kbd> to exit stealth mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-3 mb-4">
            <HiEye className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              GhostChat
            </h1>
          </div>
          
          <p className="text-gray-300 text-sm sm:text-base mb-6">
            Anonymous • Encrypted • Ephemeral
          </p>
 
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 text-xs sm:text-sm">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3 sm:p-4">
              <HiShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto mb-2" />
              <span className="text-gray-300">Encrypted</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3 sm:p-4">
              <HiClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mx-auto mb-2" />
              <span className="text-gray-300">Auto-Delete</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3 sm:p-4">
              <HiFingerPrint className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mx-auto mb-2" />
              <span className="text-gray-300">Anonymous</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="text-gray-400">Your Agent ID:</span>
              <span className="text-green-400 font-mono font-medium">{agentId}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom duration-500 delay-200">
          <TokenGenerator />
          
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          
          <RoomJoiner />
        </div>

        <div className="mt-8 sm:mt-12 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <HiClock className="w-3 h-3" />
              Messages auto-delete after 24h
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl+Shift+S</kbd> for stealth mode
          </p>
        </div>
      </div>
    </div>
  );
}