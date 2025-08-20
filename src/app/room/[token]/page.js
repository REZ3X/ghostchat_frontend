"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import MessageInput from "../../../components/MessageInput";
import MessageList from "../../../components/MessageList";
import RoomHeader from "../../../components/RoomHeader";
import { 
  generateAgentId, 
  encryptMessage, 
  decryptMessage, 
  generateRoomKeyFromToken,
  isEncryptionAvailable 
} from "../../../utils/crypto";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [roomKey, setRoomKey] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [cryptoInitialized, setCryptoInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const createUserFriendlyError = (error, type = 'connection') => {
    if (type === 'connection') {
      if (error.includes('ECONNREFUSED') || error.includes('Network Error') || error.includes('fetch')) {
        return "Unable to connect to the server. Please check your internet connection and try again.";
      }
      if (error.includes('timeout') || error.includes('Timeout')) {
        return "Connection timeout. The server is taking too long to respond.";
      }
      if (error.includes('CORS')) {
        return "Connection blocked by security settings. Please contact support.";
      }
      return "Connection failed. Please check your internet connection and try again.";
    }
    
    if (type === 'history') {
      if (error.includes('404')) {
        return "Chat room not found or server is currently unavailable.";
      }
      if (error.includes('500') || error.includes('502') || error.includes('503')) {
        return "Server is currently experiencing issues. Your messages will still work, but previous chat history may not load.";
      }
      if (error.includes('timeout') || error.includes('Timeout')) {
        return "Server is taking too long to respond. Previous messages may not load, but new messages will work normally.";
      }
      if (error.includes('Network Error') || error.includes('fetch')) {
        return "Unable to load previous messages due to connection issues. New messages will still work.";
      }
      return "Previous messages couldn't be loaded, but you can continue chatting normally.";
    }
    
    return error;
  };

  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return;

    if (force || !isUserScrolling) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  }, [isUserScrolling]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50; 
    
    setIsUserScrolling(!isAtBottom);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const id = generateAgentId();
    setAgentId(id);
    // console.log('👤 Generated agent ID:', id);
  }, []);

  useEffect(() => {
    const initializeCrypto = async () => {
      // console.log('🔐 Starting crypto initialization for token:', params.token);
      
      if (isEncryptionAvailable()) {
        // console.log('✅ Web Crypto API is available');
        const key = await generateRoomKeyFromToken(params.token);
        if (key) {
          setRoomKey(key);
          setEncryptionEnabled(true);
          // console.log('✅ Encryption enabled with shared room key');
        } else {
          console.warn('⚠️ Failed to generate encryption key, proceeding without encryption');
        }
      } else {
        console.warn('⚠️ Web Crypto API not available, proceeding without encryption');
      }
      setCryptoInitialized(true);
      // console.log('🔐 Crypto initialization completed');
    };

    if (params.token) {
      initializeCrypto();
    }
  }, [params.token]);

  useEffect(() => {
    // console.log('📜 History loading effect triggered:', {
    //   cryptoInitialized,
    //   messagesLoaded,
    //   paramsToken: params.token,
    //   agentId
    // });

    if (!cryptoInitialized) {
      // console.log('📜 Waiting for crypto to initialize...');
      return;
    }

    if (messagesLoaded) {
      // console.log('📜 Messages already loaded, skipping...');
      return;
    }

    const loadMessageHistory = async () => {
      try {
        // console.log('📜 Starting message history load for room:', params.token);
        setHistoryError(null);

        let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
          backendUrl = `https://${backendUrl}`;
        }

        const fullUrl = `${backendUrl}/api/room/${params.token}/messages`;
        // console.log('🔗 Backend URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
        // console.log('🔗 Final URL:', fullUrl);
        
        setDebugInfo(prev => ({
          ...prev,
          backendUrl,
          fullUrl,
          fetchStartTime: new Date().toISOString()
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // console.log('📜 History response received:', {
        //   status: response.status,
        //   statusText: response.statusText,
        //   headers: Object.fromEntries(response.headers.entries())
        // });
        
        setDebugInfo(prev => ({
          ...prev,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          fetchEndTime: new Date().toISOString()
        }));
        
        if (response.ok) {
          const data = await response.json();
          console.log('📜 Raw history data received:', data);
          
          setDebugInfo(prev => ({
            ...prev,
            rawDataReceived: data,
            messagesCount: data.messages?.length || 0
          }));
          
          if (data.messages && Array.isArray(data.messages)) {
  const decryptedMessages = [];
  
  for (const messageData of data.messages) {
    try {
      if (messageData.type === 'image') {
        let caption = messageData.caption || "";

        if (caption && encryptionEnabled && roomKey) {
          try {
            caption = await decryptMessage(caption, roomKey);
            // console.log('✅ Historical image caption decrypted');
          } catch (decryptError) {
            console.warn('⚠️ Failed to decrypt historical image caption:', decryptError);
          }
        }
        
        const message = {
          id: messageData.id,
          type: 'image',
          imageData: messageData.imageData,
          caption: caption,
          sender: messageData.sender,
          timestamp: messageData.timestamp,
          ttl: messageData.ttl,
          isOwn: messageData.sender === agentId
        };
        
        decryptedMessages.push(message);
        continue;
      }

      let messageContent = messageData.message;
      
      if (encryptionEnabled && roomKey) {
        try {
          messageContent = await decryptMessage(messageData.message, roomKey);
          console.log('✅ Historical message decrypted');
        } catch (decryptError) {
          console.warn('⚠️ Failed to decrypt historical message:', decryptError);
          messageContent = messageData.message;
        }
      }
      
      const message = {
        id: messageData.id,
        content: messageContent,
        sender: messageData.sender,
        timestamp: messageData.timestamp,
        ttl: messageData.ttl,
        isOwn: messageData.sender === agentId
      };
      
      decryptedMessages.push(message);
    } catch (error) {
      console.warn('Failed to process historical message:', error);
    }
  }
  
  // console.log(`📜 Successfully processed ${decryptedMessages.length} historical messages`);
  setMessages(decryptedMessages);
  setTimeout(() => scrollToBottom(true), 100);
            
            setDebugInfo(prev => ({
              ...prev,
              processedMessagesCount: decryptedMessages.length,
              success: true
            }));
          } else {
            // console.log('📜 No messages in history response or invalid format');
            setMessages([]);
            
            setDebugInfo(prev => ({
              ...prev,
              noMessages: true,
              success: true
            }));
          }
        } else {
          const errorText = await response.text();
          const errorMsg = `HTTP ${response.status}: ${errorText}`;
          console.error('📜 Failed to load message history:', errorMsg);
          setHistoryError(createUserFriendlyError(errorMsg, 'history'));
          setMessages([]);
          
          setDebugInfo(prev => ({
            ...prev,
            error: errorMsg,
            errorText,
            success: false
          }));
        }
      } catch (error) {
        const errorMsg = error.name === 'AbortError' ? 'Request timeout' : error.message;
        console.error('📜 Error loading message history:', error);
        setHistoryError(createUserFriendlyError(errorMsg, 'history'));
        setMessages([]);
        
        setDebugInfo(prev => ({
          ...prev,
          fetchError: errorMsg,
          errorStack: error.stack,
          success: false
        }));
      } finally {
        setMessagesLoaded(true);
        // console.log('📜 Message history loading completed');
        
        setDebugInfo(prev => ({
          ...prev,
          completed: true,
          completedTime: new Date().toISOString()
        }));
      }
    };

    loadMessageHistory();
  }, [cryptoInitialized, encryptionEnabled, roomKey, params.token, agentId, messagesLoaded, scrollToBottom]);

  const handleNewMessage = useCallback(async (messageData) => {
  // console.log('🔄 Processing new message:', messageData);
  
  try {
    if (messageData.type === 'image') {
      const message = {
        id: messageData.id,
        type: 'image',
        imageData: messageData.imageData,
        caption: messageData.caption,
        sender: messageData.sender,
        timestamp: messageData.timestamp,
        ttl: messageData.ttl,
        isOwn: messageData.sender === agentId
      };
 
      if (message.caption && encryptionEnabled && roomKey) {
        try {
          message.caption = await decryptMessage(message.caption, roomKey);
          console.log('✅ Image caption decrypted successfully');
        } catch (decryptError) {
          console.warn('⚠️ Failed to decrypt image caption:', decryptError);
        }
      }
      
      // console.log('📸 Adding image message to state:', message);
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log('📸 Image message already exists, skipping');
          return prev;
        }
        
        const newMessages = [...prev, message];
        setTimeout(() => scrollToBottom(), 50);
        return newMessages;
      });
      return;
    }

    let messageContent = messageData.message;

    if (encryptionEnabled && roomKey) {
      try {
        messageContent = await decryptMessage(messageData.message, roomKey);
        // console.log('✅ Message decrypted successfully');
      } catch (decryptError) {
        console.warn('⚠️ Failed to decrypt message, showing as-is:', decryptError);
        messageContent = messageData.message;
      }
    }
    
    const message = {
      id: messageData.id,
      content: messageContent,
      sender: messageData.sender,
      timestamp: messageData.timestamp,
      ttl: messageData.ttl,
      isOwn: messageData.sender === agentId
    };
    
    // console.log('📨 Adding text message to state:', message);
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        console.log('📨 Message already exists, skipping');
        return prev;
      }
      
      const newMessages = [...prev, message];
      setTimeout(() => scrollToBottom(), 50);
      return newMessages;
    });
    
  } catch (error) {
    console.error("Failed to process message:", error);
  }
}, [encryptionEnabled, roomKey, agentId, scrollToBottom]);

  useEffect(() => {
    if (!cryptoInitialized || !agentId) {
      // console.log('⏳ Waiting for crypto initialization and agent ID...');
      return;
    }

    // console.log('🚀 Initializing socket connection...');
    setConnectionError(null);

    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }
    // console.log('🔗 Connecting to backend:', backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    });
    
    socketInstance.on("connect", () => {
      // console.log('🔗 Socket connected successfully:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      
      console.log('🏠 Joining room:', params.token, 'as:', agentId);
      socketInstance.emit("join-room", { 
        roomToken: params.token, 
        agentId: agentId 
      });
    });

    socketInstance.on("connect_error", (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionError(createUserFriendlyError(error.message, 'connection'));
      setIsConnected(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'transport close' || reason === 'transport error') {
        setConnectionError("Connection lost. Trying to reconnect...");
      } else if (reason === 'io server disconnect') {
        setConnectionError("Server disconnected the connection. Please refresh the page.");
      }
    });

    socketInstance.on("room-joined", (data) => {
      // console.log('🏠 Room joined successfully:', data);
      setParticipants(data.participants || []);
    });

    socketInstance.on("participant-joined", (data) => {
      // console.log('👋 Participant joined:', data.agentId);
      setParticipants(prev => [...prev, data.agentId]);
    });

    socketInstance.on("participant-left", (data) => {
      // console.log('👋 Participant left:', data.agentId);
      setParticipants(prev => prev.filter(p => p !== data.agentId));
    });

    socketInstance.on("new-message", handleNewMessage);

    socketInstance.on("message-expired", (data) => {
      // console.log('⏰ Message expired:', data.messageId);
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    socketInstance.on("error", (error) => {
      console.error('❌ Socket error:', error);
      setConnectionError("Connection error occurred. Please refresh the page.");
    });

    setSocket(socketInstance);

    return () => {
      // console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [cryptoInitialized, agentId, params.token, handleNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async (content, ttl = 86400) => {
    if (!socket || !content.trim()) {
      console.warn('❌ Cannot send message: no socket or empty content');
      return;
    }

    if (!isConnected) {
      console.warn('❌ Cannot send message: socket not connected');
      return;
    }

    try {
      let messageContent = content;
      
      if (encryptionEnabled && roomKey) {
        try {
          messageContent = await encryptMessage(content, roomKey);
          // console.log('✅ Message encrypted successfully');
        } catch (encryptError) {
          console.warn('⚠️ Failed to encrypt message, sending as plain text:', encryptError);
          messageContent = content;
        }
      }
      
      const messageData = {
        roomToken: params.token,
        message: messageContent,
        sender: agentId,
        ttl: ttl
      };
      
      // console.log('📤 Sending message:', messageData);
      socket.emit("send-message", messageData);

      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const sendImage = async (imageData, ttl = 86400, caption = "") => {
  if (!socket || !imageData) {
    console.warn('❌ Cannot send image: no socket or image data');
    return;
  }

  if (!isConnected) {
    console.warn('❌ Cannot send image: socket not connected');
    return;
  }

  try {
    // console.log('📸 Sending image:', imageData.name, 'Size:', Math.round(imageData.size / 1024) + 'KB');
    
    let encryptedCaption = caption;
    if (caption && encryptionEnabled && roomKey) {
      try {
        encryptedCaption = await encryptMessage(caption, roomKey);
        // console.log('✅ Image caption encrypted successfully');
      } catch (encryptError) {
        console.warn('⚠️ Failed to encrypt caption, sending as plain text:', encryptError);
        encryptedCaption = caption;
      }
    }
    
    socket.emit("send-image", {
      roomToken: params.token,
      imageData: imageData,
      caption: encryptedCaption,
      sender: agentId,
      ttl: ttl
    });

    setTimeout(() => scrollToBottom(true), 100);
  } catch (error) {
    console.error("Failed to send image:", error);
  }
};

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    router.push("/");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-violet-900/95 backdrop-blur-sm">
        <RoomHeader 
          roomToken={params.token}
          participants={participants}
          isConnected={isConnected}
          encryptionEnabled={encryptionEnabled}
          onLeaveRoom={leaveRoom}
        />
      </div>

      <div className="fixed top-16 left-0 right-0 z-10 px-2 sm:px-4">
        {connectionError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 mb-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="font-medium text-sm">Connection Issue</div>
            </div>
            <div className="text-sm">{connectionError}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-red-300 hover:text-red-100 underline mt-1 transition-colors"
            >
              Click here to refresh the page
            </button>
          </div>
        )}

        {historyError && (
          <div className="bg-blue-500/20 border border-blue-500 text-blue-200 p-3 mb-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="font-medium text-sm">Message History</div>
            </div>
            <div className="text-sm">{historyError}</div>
            <div className="text-xs text-blue-300 mt-1">
              Don&apos;t worry - you can still send and receive new messages normally!
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-16 pb-safe">
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={messagesContainerRef}
            className="absolute inset-0 pt-2 pb-2"
            onScroll={handleScroll}
          >
            <MessageList 
              messages={messages}
              agentId={agentId}
            />
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="flex-shrink-0 relative">
<MessageInput 
  onSendMessage={sendMessage}
  onSendImage={sendImage}
  disabled={!isConnected}
  encryptionEnabled={encryptionEnabled}
/>
        </div>

        {/* {(process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true')) && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded text-xs max-w-sm max-h-96 overflow-y-auto">
            <div className="font-bold mb-2">Debug Info</div>
            <div>Messages: {messages.length}</div>
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Encryption: {encryptionEnabled ? '✅' : '❌'}</div>
            <div>Agent: {agentId}</div>
            <div>Socket ID: {socket?.id || 'None'}</div>
            <div>Room: {params.token}</div>
            <div>Participants: {participants.length}</div>
            <div>Crypto Ready: {cryptoInitialized ? '✅' : '❌'}</div>
            <div>History Loaded: {messagesLoaded ? '✅' : '❌'}</div>
            
            {historyError && (
              <div className="text-red-400 mt-2">
                <div className="font-semibold">History Error:</div>
                <div className="break-words">{historyError}</div>
              </div>
            )}
            
            <div className="mt-2 border-t border-gray-600 pt-2">
              <div className="font-semibold">History Debug:</div>
              <div>Backend URL: {debugInfo.backendUrl}</div>
              <div>Full URL: {debugInfo.fullUrl}</div>
              <div>Status: {debugInfo.responseStatus}</div>
              <div>Success: {debugInfo.success ? '✅' : '❌'}</div>
              <div>Messages Count: {debugInfo.messagesCount}</div>
              {debugInfo.error && (
                <div className="text-red-400">Error: {debugInfo.error}</div>
              )}
            </div>
          </div>
        )} */}

        {isUserScrolling && (
          <button
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 z-20 animate-in fade-in zoom-in"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}