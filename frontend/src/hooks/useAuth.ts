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
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token is still valid by making an authenticated request
        const response = await axios.get('/api/agents/me/current', {
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
