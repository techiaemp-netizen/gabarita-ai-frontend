import { Suspense } from 'react';
import PlanosContent from './planos-content';

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando planos...</div>}>
      <PlanosContent />
    </Suspense>
  );
}