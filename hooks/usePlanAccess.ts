'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface PlanAccess {
  questoes_limitadas: boolean;
  limite_questoes?: number;
  simulados: boolean;
  relatorios: boolean;
  ranking: boolean;
  suporte: boolean;
  macetes: boolean;
  modo_foco: boolean;
  redacao: boolean;
}

interface UsePlanAccessReturn {
  hasAccess: (resource: string) => boolean;
  planAccess: PlanAccess | null;
  userPlan: any;
  loading: boolean;
  error: string | null;
  checkAccess: (resource: string) => Promise<boolean>;
}

export const usePlanAccess = (): UsePlanAccessReturn => {
  const { user } = useAuth();
  const [planAccess, setPlanAccess] = useState<PlanAccess | null>(null);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recursos padrão para plano gratuito
  const defaultAccess: PlanAccess = {
    questoes_limitadas: true,
    limite_questoes: 3,
    simulados: false,
    relatorios: false,
    ranking: false,
    suporte: false,
    macetes: false,
    modo_foco: false,
    redacao: false
  };

  useEffect(() => {
    const loadUserPlan = async () => {
      if (!user) {
        setPlanAccess(defaultAccess);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar plano do usuário
        const response = await apiService.getUserPlan();
        
        if (response.success && response.data) {
          setUserPlan(response.data);
          
          // Definir recursos baseado no tipo de plano
          const planType = response.data.tipo || 'gratuito';
          const access = getPlanAccess(planType);
          setPlanAccess(access);
        } else {
          console.warn('Erro ao carregar plano do usuário, usando plano gratuito');
          setPlanAccess(defaultAccess);
        }
      } catch (err) {
        console.error('Erro ao carregar plano:', err);
        setError('Erro ao verificar plano do usuário');
        setPlanAccess(defaultAccess);
      } finally {
        setLoading(false);
      }
    };

    loadUserPlan();
  }, [user]);

  const getPlanAccess = (planType: string): PlanAccess => {
    const planResources: Record<string, PlanAccess> = {
      'gratuito': {
        questoes_limitadas: true,
        limite_questoes: 3,
        simulados: false,
        relatorios: false,
        ranking: false,
        suporte: false,
        macetes: false,
        modo_foco: false,
        redacao: false
      },
      'trial': {
        questoes_limitadas: true,
        limite_questoes: 3,
        simulados: false,
        relatorios: false,
        ranking: false,
        suporte: false,
        macetes: false,
        modo_foco: false,
        redacao: false
      },
      'promo': {
        questoes_limitadas: false,
        simulados: true,
        relatorios: true,
        ranking: true,
        suporte: true,
        macetes: false,
        modo_foco: false,
        redacao: false
      },
      'lite': {
        questoes_limitadas: false,
        simulados: true,
        relatorios: true,
        ranking: true,
        suporte: true,
        macetes: false,
        modo_foco: false,
        redacao: false
      },
      'premium': {
        questoes_limitadas: false,
        simulados: true,
        relatorios: true,
        ranking: true,
        suporte: true,
        macetes: false,
        modo_foco: false,
        redacao: false
      },
      'premium_plus': {
        questoes_limitadas: false,
        simulados: true,
        relatorios: true,
        ranking: true,
        suporte: true,
        macetes: true,
        modo_foco: true,
        redacao: false
      },
      'black': {
        questoes_limitadas: false,
        simulados: true,
        relatorios: true,
        ranking: true,
        suporte: true,
        macetes: true,
        modo_foco: true,
        redacao: true
      }
    };

    return planResources[planType] || defaultAccess;
  };

  const hasAccess = (resource: string): boolean => {
    if (!planAccess) return false;
    return planAccess[resource as keyof PlanAccess] === true;
  };

  const checkAccess = async (resource: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await apiService.checkAccess(resource);
      return response.success && response.data?.tem_acesso === true;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  };

  return {
    hasAccess,
    planAccess,
    userPlan,
    loading,
    error,
    checkAccess
  };
};