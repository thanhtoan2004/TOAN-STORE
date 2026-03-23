'use client';

import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Initialize Socket Connection
    if (!socketRef.current) {
      socketRef.current = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Real-time Connected:', socketRef.current?.id);

        // Join personal room for targeted notifications
        if (user?.id) {
          socketRef.current?.emit('join-user', user.id);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Real-time Error:', error);
      });
    }

    const socket = socketRef.current;

    // 2. Global Listeners (e.g. Notifications)
    socket.on('notification', (data) => {
      console.log('🔔 Received Notification:', data);
      toast(data.message, {
        icon: '🔔',
        duration: 5000,
        position: 'top-right',
      });
    });

    return () => {
      // We don't necessarily want to disconnect on every unmount
      // of a component using this hook, but we should cleanup listeners
      socket.off('notification');
    };
  }, [user]);

  return socketRef.current;
};
