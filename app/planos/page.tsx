'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Importação dinâmica com SSR desabilitado para evitar problemas de pre-rendering
const PlanosInner = dynamic(() => import('./planos-inner'), {
  ssr: false,
  loading: () => <div>Carregando...</div>
});

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando planos...</div>}>
      <PlanosInner />
    </Suspense>
  );
}