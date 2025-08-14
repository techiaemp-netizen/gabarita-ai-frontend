import { Suspense } from 'react';
import PlanosClient from './planos-client';

// desliga SSG/ISR
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// (opcional) evita cache de fetch
export const fetchCache = 'default-no-store';

/**
 * Página de Planos
 * 
 * Esta página exibe os planos disponíveis para o usuário.
 * Usa Suspense boundary para resolver o erro de useSearchParams no Next.js 15.
 */
export default function PlanosPage() {
  return (
    <Suspense fallback={<div />}>
      <PlanosClient />
    </Suspense>
  );
}