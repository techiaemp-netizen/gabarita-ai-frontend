// app/planos/page.tsx

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Importação dinâmica com SSR completamente desabilitado
// Isso garante que o componente NUNCA seja renderizado no servidor
const PlanosContent = dynamic(() => import('./PlanosContent'), {
  ssr: false,
  loading: () => <p>Carregando detalhes do plano...</p>
});

// Agora é um Client Component para permitir ssr: false
export default function PlanosPage() {
  return (
    <main>
      <h1>Nossos Planos</h1>

      {/* Dupla proteção: Suspense + Dynamic Import com ssr: false */}
      <Suspense fallback={<p>Inicializando página...</p>}>
        <PlanosContent />
      </Suspense>

    </main>
  );
}