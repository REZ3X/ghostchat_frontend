"use client";

import { useEffect } from "react";
import { HiChatBubbleLeftRight, HiClock } from "react-icons/hi2";

export default function MessageList({ messages, agentId }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeLeft = (timestamp, ttl) => {
    const expiresAt = new Date(timestamp).getTime() + (ttl * 1000);
    const now = Date.now();
    const timeLeft = Math.max(0, expiresAt - now);
    
    if (timeLeft === 0) return "Expired";
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  useEffect(() => {
    console.log('📋 MessageList received messages:', messages.length, messages);
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-2 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full px-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-full p-4 sm:p-6 mb-3 sm:mb-4">
            <HiChatBubbleLeftRight className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">
            No messages yet
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            Start the conversation!
          </p>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            All messages are encrypted and will auto-delete based on your chosen timer.
          </p>
          <div className="mt-3 sm:mt-4 text-xs text-gray-600 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-2 sm:p-3">
            💡 Messages persist until they expire, even after page refresh
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
            >
              <div className={`max-w-[90%] sm:max-w-[75%] md:max-w-sm lg:max-w-md px-3 py-2 sm:px-4 sm:py-3 rounded-2xl break-words shadow-lg transition-all duration-200 ${
                message.isOwn 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white ml-auto' 
                  : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
              }`}>
                {!message.isOwn && (
                  <div className="text-xs opacity-70 mb-1 font-mono text-gray-300">
                    {message.sender}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                  {message.content}
                </div>
                
                <div className="text-xs opacity-70 mt-2 flex justify-between items-center gap-2">
                  <span className="text-gray-300">
                    {formatTime(message.timestamp)}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-300">
                    <HiClock className="w-3 h-3" />
                    <span className="whitespace-nowrap">
                      {getTimeLeft(message.timestamp, message.ttl)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="h-4 sm:h-6"></div>
        </>
      )}
    </div>
  );
}