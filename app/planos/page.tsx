import { Suspense } from 'react';
import PlanosClient from './planos-client';

/**
 * Página de Planos
 * 
 * Esta página exibe os planos disponíveis para o usuário.
 * Usa Suspense boundary para resolver o erro de useSearchParams no Next.js 15.
 */
export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando planos...</div>}>
      <PlanosClient />
    </Suspense>
  );
}