"use client";

import { useEffect, useState } from "react";
import { HiChatBubbleLeftRight, HiClock, HiPhoto, HiEye, HiXMark } from "react-icons/hi2";

export default function MessageList({ messages, agentId }) {
  const [imageViewModal, setImageViewModal] = useState(null);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const openImageModal = (imageData) => {
    setImageViewModal(imageData);
  };

  const closeImageModal = () => {
    setImageViewModal(null);
  };

  useEffect(() => {
    console.log('📋 MessageList received messages:', messages.length, messages);
  }, [messages]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    if (imageViewModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageViewModal]);

  const MessageBubble = ({ message }) => {
    const isImage = message.type === 'image';
    const isOwn = message.isOwn;

    return (
      <div className={`max-w-[90%] sm:max-w-[75%] md:max-w-sm lg:max-w-md px-3 py-2 sm:px-4 sm:py-3 rounded-2xl break-words shadow-lg transition-all duration-200 ${isOwn
          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white ml-auto'
          : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
        }`}>
        {!isOwn && (
          <div className="text-xs opacity-70 mb-1 font-mono text-gray-300">
            {message.sender}
          </div>
        )}

        {isImage ? (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={message.imageData.imageUrl ?
                  `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${message.imageData.imageUrl}` :
                  message.imageData.data
                }
                alt={message.imageData.name}
                className="max-w-full h-auto rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
                onClick={() => openImageModal(message.imageData)}
                onError={(e) => {
                  if (message.imageData.data && !e.target.src.startsWith('data:')) {
                    e.target.src = message.imageData.data;
                  }
                }}
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                  <HiEye className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="text-xs opacity-70 flex items-center gap-2">
              <HiPhoto className="w-3 h-3" />
              <span>{message.imageData.name}</span>
              <span>•</span>
              <span>{formatFileSize(message.imageData.size)}</span>
              <span>•</span>
              <span>{message.imageData.dimensions.width}×{message.imageData.dimensions.height}</span>
            </div>

            {message.caption && (
              <div className="text-sm leading-relaxed">
                {message.caption}
              </div>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
            {message.content}
          </div>
        )}

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
    );
  };

  return (
    <>
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
              Send text messages and images. All content is encrypted and will auto-delete.
            </p>
            <div className="mt-3 sm:mt-4 text-xs text-gray-600 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-2 sm:p-3">
              💡 Messages and images persist until they expire, even after page refresh
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
              >
                <MessageBubble message={message} />
              </div>
            ))}
            <div className="h-4 sm:h-6"></div>
          </>
        )}
      </div>

      {imageViewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
            >
              <HiXMark className="w-5 h-5" />
            </button>

            <img
              src={imageViewModal.data}
              alt={imageViewModal.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
              <div className="text-sm font-medium">{imageViewModal.name}</div>
              <div className="text-xs text-gray-300 mt-1 flex items-center gap-4">
                <span>{formatFileSize(imageViewModal.size)}</span>
                <span>{imageViewModal.dimensions.width}×{imageViewModal.dimensions.height}</span>
                <span>Click outside to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}