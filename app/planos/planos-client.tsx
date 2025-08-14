'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function PlanosClient() {
  const params = useSearchParams();
  const plano = useMemo(() => params.get('p') ?? 'default', [params]);

  return (
    <main>
      <h1>Planos</h1>
      <p>Plano selecionado: {plano}</p>
    </main>
  );
}