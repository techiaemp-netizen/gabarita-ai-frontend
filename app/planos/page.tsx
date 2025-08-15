// app/planos/page.tsx

import { Suspense } from 'react';
import PlanosContent from './PlanosContent';

// Este é um Componente de Servidor por padrão.
export default function PlanosPage() {
  return (
    <main>
      <h1>Nossos Planos</h1>

      {/* O Suspense Boundary é a chave.
        Ele diz ao Next.js: "Renderize tudo estaticamente, mas enquanto o
        'PlanosContent' não estiver pronto no cliente, mostre este 'fallback'".
      */}
      <Suspense fallback={<p>Carregando detalhes do plano...</p>}>
        <PlanosContent />
      </Suspense>

    </main>
  );
}