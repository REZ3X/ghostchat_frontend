"use client";

import { useState } from "react";
import { 
  HiPaperAirplane, 
  HiClock, 
  HiExclamationTriangle,
  HiFire,
  HiChevronDown,
  HiShieldExclamation
} from "react-icons/hi2";
import { filterMessage, validateFilterConfig } from "../utils/messageFilter";

export default function MessageInput({ onSendMessage, disabled, encryptionEnabled }) {
  const [message, setMessage] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [showTtlOptions, setShowTtlOptions] = useState(false);
  const [filterWarning, setFilterWarning] = useState(null);
  const [filterError, setFilterError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      const filterResult = filterMessage(message.trim());

      setFilterWarning(null);
      setFilterError(null);
      
      if (filterResult.blocked) {
        setFilterError(filterResult.reason);
        return;
      }
      
      if (filterResult.warning) {
        setFilterWarning(filterResult.warning);
      }

      onSendMessage(filterResult.filtered, ttl);
      setMessage("");
      
      setTimeout(() => setFilterWarning(null), 3000);
    }
  };

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    if (filterError) {
      setFilterError(null);
    }

    if (newMessage.trim()) {
      const filterResult = filterMessage(newMessage.trim());
      if (filterResult.words.length > 0 && !filterResult.blocked) {
        setFilterWarning(`Contains: ${filterResult.words.join(', ')}`);
      } else {
        setFilterWarning(null);
      }
    } else {
      setFilterWarning(null);
    }
  };

  const ttlOptions = [
    { value: 0, label: "Burn after reading", icon: HiFire, color: "text-red-400" },
    { value: 300, label: "5 minutes", icon: HiClock, color: "text-yellow-400" },
    { value: 3600, label: "1 hour", icon: HiClock, color: "text-blue-400" },
    { value: 86400, label: "24 hours", icon: HiClock, color: "text-green-400" }
  ];

  const selectedOption = ttlOptions.find(option => option.value === ttl);
  const IconComponent = selectedOption?.icon || HiClock;

  const placeholderText = disabled 
    ? "Connecting..." 
    : encryptionEnabled 
      ? "Type your message..." 
      : "Type your message (unencrypted)...";

  const filterConfig = process.env.NODE_ENV === 'development' ? validateFilterConfig() : null;

  return (
    <div className="bg-white/5 backdrop-blur-md border-t border-white/10 shadow-xl p-3 sm:p-4">
      {filterError && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <HiShieldExclamation className="w-4 h-4" />
            <span>{filterError}</span>
          </div>
        </div>
      )}

      {filterWarning && !filterError && (
        <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500 text-yellow-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4" />
            <span>{filterWarning}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-400">Auto-delete:</span>
          
          <div className="relative">
            <button
              onClick={() => setShowTtlOptions(!showTtlOptions)}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg px-3 py-2 text-xs sm:text-sm text-white hover:bg-white/10 transition-colors"
            >
              <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 ${selectedOption?.color}`} />
              <span>{selectedOption?.label}</span>
              <HiChevronDown className={`w-3 h-3 transition-transform ${
                showTtlOptions ? 'rotate-180' : ''
              }`} />
            </button>
            
            {showTtlOptions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg border border-white/20 shadow-xl z-10 min-w-48 animate-in fade-in duration-300">
                {ttlOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTtl(option.value);
                      setShowTtlOptions(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      ttl === option.value ? 'bg-white/10' : ''
                    }`}
                  >
                    <option.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${option.color}`} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!encryptionEnabled && (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <HiExclamationTriangle className="w-3 h-3" />
              <span className="hidden sm:inline">Encryption unavailable</span>
              <span className="sm:hidden">Unencrypted</span>
            </div>
          )}

          {filterConfig && filterConfig.blockedWordsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <HiShieldExclamation className="w-3 h-3" />
              <span className="hidden sm:inline">Filter active</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder={placeholderText}
          disabled={disabled}
          className={`flex-1 bg-white/5 backdrop-blur-sm border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-3 sm:px-4 sm:py-4 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base disabled:opacity-50 ${
            filterError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''
          }`}
          maxLength={1000}
        />
        
        <button
          type="submit"
          disabled={disabled || !message.trim() || !!filterError}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-center"
        >
          <HiPaperAirplane className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>

      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>{message.length}/1000 characters</span>
        <div className="flex items-center gap-2">
          {message.length > 900 && (
            <span className="text-yellow-400">
              {1000 - message.length} remaining
            </span>
          )}

          {/* {process.env.NODE_ENV === 'development' && filterConfig && (
            <span className="text-blue-400">
              Filter: {filterConfig.filterMode} ({filterConfig.blockedWordsCount} words)
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
}