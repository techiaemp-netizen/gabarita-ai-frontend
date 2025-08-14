'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlanosInner() {
  const [plano, setPlano] = useState('default');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const planoParam = urlParams.get('p');
      setPlano(planoParam ?? 'default');
    }
  }, []);

  return (
    <main>
      <h1>Planos</h1>
      <p>Plano selecionado: {plano}</p>
      {/* manter todo o JSX/Lógica real da página aqui */}
    </main>
  );
}