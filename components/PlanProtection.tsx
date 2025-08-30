'use client';

import React from 'react';
import Link from 'next/link';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { Lock, Crown, Zap } from 'lucide-react';

interface PlanProtectionProps {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

const PlanProtection: React.FC<PlanProtectionProps> = ({
  resource,
  children,
  fallback,
  showUpgrade = true
}) => {
  const { hasAccess, loading, userPlan } = usePlanAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando acesso...</span>
      </div>
    );
  }

  if (hasAccess(resource)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const getResourceName = (resource: string): string => {
    const resourceNames: Record<string, string> = {
      'simulados': 'Simulados Completos',
      'relatorios': 'Relatórios Detalhados',
      'ranking': 'Ranking Nacional',
      'macetes': 'Macetes Exclusivos',
      'modo_foco': 'Modo Foco',
      'redacao': 'Correção de Redação',
      'suporte': 'Suporte Prioritário'
    };
    return resourceNames[resource] || 'Esta Funcionalidade';
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'simulados':
        return <Zap className="h-12 w-12 text-blue-500" />;
      case 'relatorios':
      case 'ranking':
        return <Crown className="h-12 w-12 text-yellow-500" />;
      case 'macetes':
      case 'modo_foco':
      case 'redacao':
        return <Crown className="h-12 w-12 text-purple-500" />;
      default:
        return <Lock className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
      <div className="flex justify-center mb-4">
        {getResourceIcon(resource)}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {getResourceName(resource)} - Recurso Premium
      </h3>
      
      <p className="text-gray-600 mb-4">
        Você está no plano <span className="font-semibold">{userPlan?.tipo || 'Gratuito'}</span>.
        Para acessar esta funcionalidade, faça upgrade para um plano premium.
      </p>
      
      <div className="space-y-3">
        <Link 
          href="/planos"
          className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Crown className="h-5 w-5 mr-2" />
          Fazer Upgrade Agora
        </Link>
        
        <Link 
          href="/planos"
          className="inline-flex items-center justify-center w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
        >
          Ver Todos os Planos
        </Link>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Com o plano Premium você terá acesso a simulados ilimitados, 
          relatórios detalhados, ranking nacional e muito mais!
        </p>
      </div>
    </div>
  );
};

export default PlanProtection;