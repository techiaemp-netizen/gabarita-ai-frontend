'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PlanosContent() {
  const searchParams = useSearchParams();
  const [plano, setPlano] = useState('default');
  
  useEffect(() => {
    const planoParam = searchParams.get('p');
    setPlano(planoParam ?? 'default');
  }, [searchParams]);

  return (
    <main>
      <h1>Planos</h1>
      <p>Plano selecionado: {plano}</p>
      {/* Conteúdo da página */}
    </main>
  );
}