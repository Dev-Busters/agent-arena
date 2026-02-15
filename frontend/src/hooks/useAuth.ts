'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

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

        // Verify token is still valid by making an authenticated request
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/me/current`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data) {
          setUser({
            id: response.data.user_id || 'unknown',
            email: response.data.email || '',
            username: response.data.name || '',
            level: response.data.level || 1
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
    setUser(null);
  };

  return { user, loading, logout };
}
