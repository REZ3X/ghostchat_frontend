"use client";

import { useState } from "react";
import { 
  HiUsers, 
  HiClipboard, 
  HiArrowRightOnRectangle,
  HiShieldCheck,
  HiExclamationTriangle,
  HiChevronDown,
  HiChevronUp
} from "react-icons/hi2";

export default function RoomHeader({ 
  roomToken, 
  participants, 
  isConnected, 
  encryptionEnabled, 
  onLeaveRoom 
}) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/room/${roomToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-xl p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-white font-medium text-sm sm:text-base truncate">
              {roomToken}
            </span>
          </div>
          
                    <div className="hidden sm:flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200 ${
              encryptionEnabled ? 'bg-green-400' : 'bg-yellow-400'
            }`} />
            {encryptionEnabled ? (
              <HiShieldCheck className="w-4 h-4 text-green-400" />
            ) : (
              <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
            )}
            <span className="text-xs text-gray-300 hidden lg:block">
              {encryptionEnabled ? 'Encrypted' : 'Plain text'}
            </span>
          </div>
          
                    <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <HiUsers className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{participants.length}</span>
            {showParticipants ? (
              <HiChevronUp className="w-3 h-3" />
            ) : (
              <HiChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

                <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={copyRoomLink}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <HiClipboard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
          
          <button
            onClick={onLeaveRoom}
            className="bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <HiArrowRightOnRectangle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

            <div className="sm:hidden mt-2 flex items-center gap-2">
        {encryptionEnabled ? (
          <HiShieldCheck className="w-4 h-4 text-green-400" />
        ) : (
          <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
        )}
        <span className="text-xs text-gray-300">
          {encryptionEnabled ? 'End-to-end encrypted' : 'Encryption unavailable'}
        </span>
      </div>

            {showParticipants && (
        <div className="mt-3 sm:mt-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3 animate-in fade-in duration-300">
          <div className="text-sm text-gray-300 mb-2">
            Online Participants ({participants.length}):
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {participants.map((participant, index) => (
              <div 
                key={index} 
                className="text-sm text-green-400 font-mono bg-white/5 rounded px-2 py-1"
              >
                {participant}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}