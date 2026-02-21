'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  level: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Dev mode: create mock user if no token
        if (!token && process.env.NODE_ENV === 'development') {
          console.log('🔧 [DEV] Using mock user (no token)');
          setUser({
            id: 'dev-user-001',
            email: 'dev@test.local',
            username: 'DevTester',
            level: 1
          });
          setLoading(false);
          return;
        }
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token via API proxy
        const response = await auth.me();

        if (response) {
          setUser({
            id: response.id,
            email: response.email,
            username: response.username,
            level: response.level
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        
        // Dev mode fallback: create mock user on error
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [DEV] Auth failed, using mock user');
          setUser({
            id: 'dev-user-001',
            email: 'dev@test.local',
            username: 'DevTester',
            level: 1
          });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'aa_token=; path=/; max-age=0';
    setUser(null);
  };

  return { user, loading, logout };
}
