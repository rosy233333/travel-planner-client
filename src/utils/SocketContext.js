import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// 创建Socket上下文
const SocketContext = createContext(null);

// 自定义Hook，用于访问Socket上下文
export const useSocket = () => useContext(SocketContext);

// Socket提供者组件
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState({});

  // 根据认证状态连接/断开Socket
  useEffect(() => {
    if (isAuthenticated && token) {
      // 创建Socket连接
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });
      
      // 设置Socket事件监听器
      socketInstance.on('connect', () => {
        console.log('Socket connected, ID:', socketInstance.id);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      socketInstance.on('user-joined', (data) => {
        setActiveUsers(prev => ({
          ...prev,
          [data.roomId]: {
            ...prev[data.roomId],
            [data.userId]: {
              username: data.username,
              lastActive: new Date()
            }
          }
        }));
      });
      
      socketInstance.on('user-left', (data) => {
        setActiveUsers(prev => {
          const updatedRoom = { ...prev[data.roomId] };
          delete updatedRoom[data.userId];
          
          return {
            ...prev,
            [data.roomId]: updatedRoom
          };
        });
      });
      
      // 保存Socket实例
      setSocket(socketInstance);
      
      // 清理函数
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } else if (socket) {
      // 如果用户注销，断开连接
      socket.disconnect();
      setSocket(null);
      setActiveUsers({});
    }
  }, [isAuthenticated, token]);

  // 加入房间
  const joinRoom = (roomId, userId, username) => {
    if (socket && roomId) {
      socket.emit('join-room', { roomId, userId, username });
    }
  };

  // 离开房间
  const leaveRoom = (roomId, userId) => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId, userId });
    }
  };

  // 发送行程更新
  const emitItineraryUpdate = (roomId, data) => {
    if (socket && roomId) {
      socket.emit('itinerary-update', { roomId, ...data });
    }
  };

  // 提供上下文值
  const contextValue = {
    socket,
    activeUsers,
    joinRoom,
    leaveRoom,
    emitItineraryUpdate
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}; 