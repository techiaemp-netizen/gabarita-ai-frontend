'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '@/types';
import { apiService } from '@/services/api';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Listener para mudanças no estado de autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Usuário autenticado, carregar perfil do backend
        await loadUserProfile();
      } else {
        // Usuário não autenticado
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [mounted]);

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token inválido, remover
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: Partial<User> & { password: string }) => {
    setLoading(true);
    try {
      const response = await apiService.signup(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erro ao criar conta');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(userData);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isClient,
    login,
    signup,
    logout,
    updateUser,
  };

  // Evitar problemas de hidratação
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        loading: true,
        login: async () => ({ success: false, message: 'Loading...' }),
        signup: async () => ({ success: false, message: 'Loading...' }),
        logout: async () => {},
        updateUser: async () => ({ success: false, message: 'Loading...' })
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

