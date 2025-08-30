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
    
    // Primeiro, verificar se há dados do usuário no localStorage
    if (typeof window !== 'undefined') {
      const storedUserData = localStorage.getItem('user'); // Mudança: usar 'user' em vez de 'userData'
      const authToken = localStorage.getItem('authToken');
      
      if (storedUserData && authToken) {
        try {
          const userData = JSON.parse(storedUserData);
          console.log('✅ Carregando usuário do localStorage:', userData);
          setUser(userData);
          setLoading(false);
          return;
        } catch (error) {
          console.error('❌ Erro ao parsear dados do usuário:', error);
          localStorage.removeItem('user'); // Mudança: usar 'user' em vez de 'userData'
          localStorage.removeItem('authToken');
        }
      }
    }
    
    // Verificar se Firebase está configurado corretamente
    const firebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                              !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_') &&
                              process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
                              !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes('your_');
    
    if (!firebaseConfigured) {
      // Simular usuário autenticado para desenvolvimento quando Firebase não está configurado
      const mockUser = {
        id: 'dev-user-123',
        nome: 'Usuário Desenvolvimento',
        name: 'Usuário Desenvolvimento',
        email: 'dev@gabarita.ai',
        cargo: 'Analista Judiciário',
        bloco: 'Bloco 6 - Controle e Fiscalização',
        plano: 'trial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Salvar no localStorage para que getCurrentUser possa acessar
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(mockUser));
      }
      
      setUser(mockUser);
      setLoading(false);
      return;
    }
    
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
        const user = response.data.user;
        setUser(user);
        // Salvar usuário no localStorage para getCurrentUser
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
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
        const user = response.data.user;
        setUser(user);
        // Salvar usuário no localStorage para getCurrentUser
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
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

  // Método para simular autenticação em desenvolvimento
  const simulateAuth = () => {
    console.log('🔧 DEBUG: simulateAuth chamado');
    const mockUser: User = {
      id: 'dev-user-123',
      nome: 'Usuário de Desenvolvimento',
      email: 'dev@gabarita.ai',
      cargo: 'Analista Judiciário',
      bloco: 'Bloco 6 - Controle e Fiscalização',
      plano: 'gratuito',
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('🔧 DEBUG: Definindo usuário:', mockUser);
    
    // Salvar usuário no localStorage para que getCurrentUser() funcione
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('💾 DEBUG: Usuário salvo no localStorage');
    }
    
    setUser(mockUser);
    setLoading(false);
    console.log('🧪 Simulação de autenticação ativada:', mockUser);
    console.log('🔧 DEBUG: Estado atual do usuário após setUser:', user);
  };

  const value: AuthContextType = {
    user,
    loading,
    isClient,
    login,
    signup,
    logout,
    updateUser,
    simulateAuth,
  };

  // Evitar problemas de hidratação
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        loading: true,
        isClient: false,
        login: async () => {},
        signup: async () => {},
        logout: async () => {},
        updateUser: async () => {},
        simulateAuth: () => {}
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

