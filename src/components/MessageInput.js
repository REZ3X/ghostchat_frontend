"use client";

import { useState, useRef, useEffect } from "react";
import { 
  HiPaperAirplane, 
  HiClock, 
  HiExclamationTriangle,
  HiFire,
  HiChevronDown,
  HiShieldExclamation,
  HiPhoto
} from "react-icons/hi2";
import { filterMessage, validateFilterConfig } from "../utils/messageFilter";
import ImageAttach from "./ImageAttach";

export default function MessageInput({ onSendMessage, onSendImage, disabled, encryptionEnabled }) {
  const [message, setMessage] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [showTtlOptions, setShowTtlOptions] = useState(false);
  const [filterWarning, setFilterWarning] = useState(null);
  const [filterError, setFilterError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageAttach, setShowImageAttach] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedImage && !message.trim()) {
      if (!disabled) {
        onSendImage(selectedImage, ttl);
        setSelectedImage(null);
        setShowImageAttach(false);
      }
      return;
    }

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

      if (selectedImage) {
        onSendImage(selectedImage, ttl, filterResult.filtered);
        setSelectedImage(null);
        setShowImageAttach(false);
      } else {
        onSendMessage(filterResult.filtered, ttl);
      }
      
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

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
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

  const canSend = !disabled && !filterError && (message.trim() || selectedImage);

  return (
    <div className="bg-white/5 backdrop-blur-md border-t border-white/10 shadow-xl p-2 sm:p-3 md:p-4 safe-area-inset-bottom">
      {filterError && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <HiShieldExclamation className="w-4 h-4 flex-shrink-0" />
            <span>{filterError}</span>
          </div>
        </div>
      )}

      {filterWarning && !filterError && (
        <div className="mb-2 p-2 bg-yellow-500/20 border border-yellow-500 text-yellow-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{filterWarning}</span>
          </div>
        </div>
      )}

      {showImageAttach && (
        <div className="mb-3">
          <ImageAttach 
            onImageSelect={handleImageSelect}
            disabled={disabled}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">Auto-delete:</span>
          
          <div className="relative">
            <button
              onClick={() => setShowTtlOptions(!showTtlOptions)}
              className="flex items-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-xl border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-xs text-white hover:bg-white/10 transition-colors"
            >
              <IconComponent className={`w-3 h-3 ${selectedOption?.color}`} />
              <span className="hidden sm:inline">{selectedOption?.label}</span>
              <span className="sm:hidden">
                {selectedOption?.value === 0 ? "🔥" : 
                 selectedOption?.value === 300 ? "5m" :
                 selectedOption?.value === 3600 ? "1h" : "24h"}
              </span>
              <HiChevronDown className={`w-3 h-3 transition-transform ${
                showTtlOptions ? 'rotate-180' : ''
              }`} />
            </button>
            
            {showTtlOptions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg z-20 min-w-48 animate-in fade-in duration-300">
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
              <span className="hidden sm:inline">Unencrypted</span>
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

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder={selectedImage ? "Add a caption (optional)" : placeholderText}
            disabled={disabled}
            className={`flex-1 bg-white/5 backdrop-blur-sm border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base disabled:opacity-50 min-h-[44px] sm:min-h-[48px] ${
              filterError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''
            }`}
            maxLength={1000}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          
          <button
            type="button"
            onClick={() => setShowImageAttach(!showImageAttach)}
            disabled={disabled}
            className={`bg-white/5 backdrop-blur-xl border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] sm:min-w-[48px] min-h-[44px] sm:min-h-[48px] flex items-center justify-center ${
              showImageAttach ? 'bg-purple-500/20 border-purple-500/50' : ''
            }`}
          >
            <HiPhoto className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!canSend}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center min-w-[44px] sm:min-w-[48px] min-h-[44px] sm:min-h-[48px]"
        >
          <HiPaperAirplane className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>

      <div className="flex justify-between items-center mt-1 sm:mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{message.length}/1000</span>
          {selectedImage && (
            <span className="text-green-400">📷 Image attached</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {message.length > 900 && (
            <span className="text-yellow-400">
              {1000 - message.length} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}