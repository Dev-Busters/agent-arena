'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socketInstance) {
      const token = localStorage.getItem('token');
      socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
        {
          auth: {
            token: token || ''
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        }
      );

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    setSocket(socketInstance);

    return () => {
      // Keep socket alive for entire session
    };
  }, []);

  return { socket, connected };
}
