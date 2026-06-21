import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the server. Since we have proxy in vite.config, we can connect directly.
    const socketInstance = io({
      auth: {
        token: token || ''
      },
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketInstance.on('online-count-update', (data) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlineCount(data.onlineCount);
      }
    });

    socketInstance.on('connection-success', (data) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlineCount(data.onlineCount);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Action emitters
  const joinQueue = (filters) => {
    if (socket) {
      socket.emit('join-queue', { filters });
    }
  };

  const skipMatch = () => {
    if (socket) {
      socket.emit('skip');
    }
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leave-queue');
    }
  };

  const sendMessage = (roomId, chatDbId, text) => {
    if (socket) {
      socket.emit('send-message', { roomId, chatDbId, text });
    }
  };

  const sendTyping = (roomId, isTyping) => {
    if (socket) {
      socket.emit('typing', { roomId, isTyping });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        joinQueue,
        skipMatch,
        leaveQueue,
        sendMessage,
        sendTyping
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
