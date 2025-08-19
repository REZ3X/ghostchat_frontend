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

  useEffect(() => {
    const id = generateAgentId();
    setAgentId(id);
    console.log('👤 Generated agent ID:', id);
  }, []);

  useEffect(() => {
    const initializeCrypto = async () => {
      console.log('🔐 Starting crypto initialization for token:', params.token);
      
      if (isEncryptionAvailable()) {
        console.log('✅ Web Crypto API is available');
        const key = await generateRoomKeyFromToken(params.token);
        if (key) {
          setRoomKey(key);
          setEncryptionEnabled(true);
          console.log('✅ Encryption enabled with shared room key');
        } else {
          console.warn('⚠️ Failed to generate encryption key, proceeding without encryption');
        }
      } else {
        console.warn('⚠️ Web Crypto API not available, proceeding without encryption');
      }
      setCryptoInitialized(true);
      console.log('🔐 Crypto initialization completed');
    };

    if (params.token) {
      initializeCrypto();
    }
  }, [params.token]);

  useEffect(() => {
    console.log('📜 History loading effect triggered:', {
      cryptoInitialized,
      messagesLoaded,
      paramsToken: params.token,
      agentId
    });

    if (!cryptoInitialized) {
      console.log('📜 Waiting for crypto to initialize...');
      return;
    }

    if (messagesLoaded) {
      console.log('📜 Messages already loaded, skipping...');
      return;
    }

    const loadMessageHistory = async () => {
      try {
        console.log('📜 Starting message history load for room:', params.token);
        setHistoryError(null);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const fullUrl = `${backendUrl}/api/room/${params.token}/messages`;
        console.log('🔗 Backend URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
        console.log('🔗 Final URL:', fullUrl);
        
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
        
        console.log('📜 History response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
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
            
            console.log(`📜 Successfully processed ${decryptedMessages.length} historical messages`);
            setMessages(decryptedMessages);
            
            setDebugInfo(prev => ({
              ...prev,
              processedMessagesCount: decryptedMessages.length,
              success: true
            }));
          } else {
            console.log('📜 No messages in history response or invalid format');
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
          setHistoryError(errorMsg);
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
        setHistoryError(errorMsg);
        setMessages([]);
        
        setDebugInfo(prev => ({
          ...prev,
          fetchError: errorMsg,
          errorStack: error.stack,
          success: false
        }));
      } finally {
        setMessagesLoaded(true);
        console.log('📜 Message history loading completed');
        
        setDebugInfo(prev => ({
          ...prev,
          completed: true,
          completedTime: new Date().toISOString()
        }));
      }
    };

    loadMessageHistory();
  }, [cryptoInitialized, encryptionEnabled, roomKey, params.token, agentId, messagesLoaded]);

  const handleNewMessage = useCallback(async (messageData) => {
    console.log('🔄 Processing new message:', messageData);
    
    try {
      let messageContent = messageData.message;

      if (encryptionEnabled && roomKey) {
        try {
          messageContent = await decryptMessage(messageData.message, roomKey);
          console.log('✅ Message decrypted successfully');
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
      
      console.log('📨 Adding message to state:', message);
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log('📨 Message already exists, skipping');
          return prev;
        }
        
        console.log('📝 Previous messages count:', prev.length);
        const newMessages = [...prev, message];
        console.log('📝 New messages count:', newMessages.length);
        return newMessages;
      });
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  }, [encryptionEnabled, roomKey, agentId]);

  useEffect(() => {
    if (!cryptoInitialized || !agentId) {
      console.log('⏳ Waiting for crypto initialization and agent ID...');
      return;
    }

    console.log('🚀 Initializing socket connection...');
    setConnectionError(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    console.log('🔗 Connecting to backend:', backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    });
    
    socketInstance.on("connect", () => {
      console.log('🔗 Socket connected successfully:', socketInstance.id);
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
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on("room-joined", (data) => {
      console.log('🏠 Room joined successfully:', data);
      setParticipants(data.participants || []);
    });

    socketInstance.on("participant-joined", (data) => {
      console.log('👋 Participant joined:', data.agentId);
      setParticipants(prev => [...prev, data.agentId]);
    });

    socketInstance.on("participant-left", (data) => {
      console.log('👋 Participant left:', data.agentId);
      setParticipants(prev => prev.filter(p => p !== data.agentId));
    });

    socketInstance.on("new-message", handleNewMessage);

    socketInstance.on("message-expired", (data) => {
      console.log('⏰ Message expired:', data.messageId);
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    socketInstance.on("error", (error) => {
      console.error('❌ Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [cryptoInitialized, agentId, params.token, handleNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          console.log('✅ Message encrypted successfully');
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
      
      console.log('📤 Sending message:', messageData);
      socket.emit("send-message", messageData);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    router.push("/");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <RoomHeader 
          roomToken={params.token}
          participants={participants}
          isConnected={isConnected}
          encryptionEnabled={encryptionEnabled}
          onLeaveRoom={leaveRoom}
        />
      </div>
      
      {connectionError && (
        <div className="flex-shrink-0 bg-red-500/20 border border-red-500 text-red-200 p-3 m-4 rounded-lg">
          <div className="font-medium">Connection Error:</div>
          <div className="text-sm">{connectionError}</div>
          <div className="text-xs mt-1">Make sure the backend is running on port 3001</div>
        </div>
      )}

      {historyError && (
        <div className="flex-shrink-0 bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-3 m-4 rounded-lg">
          <div className="font-medium">History Loading Error:</div>
          <div className="text-sm">{historyError}</div>
          <div className="text-xs mt-1">Previous messages could not be loaded</div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={messages}
            agentId={agentId}
          />
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex-shrink-0">
          <MessageInput 
            onSendMessage={sendMessage}
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
      </div>
    </div>
  );
}