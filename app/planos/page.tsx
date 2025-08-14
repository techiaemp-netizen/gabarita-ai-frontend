'use client';

import { Suspense } from 'react';
import PlanosInner from './planos-inner';

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <PlanosInner />
    </Suspense>
  );
}