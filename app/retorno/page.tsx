'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RetornoMercadoPago() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    const currentSearch = window.location.search;
    
    console.log('🔄 Redirecionando do Mercado Pago:', { status, search: currentSearch });
    
    // Redirecionar para a página apropriada baseada no status
    switch (status) {
      case 'success':
        router.replace('/payment/success' + currentSearch);
        break;
      case 'pending':
        router.replace('/payment/pending' + currentSearch);
        break;
      case 'failure':
        router.replace('/payment/failure' + currentSearch);
        break;
      default:
        // Se não há status ou status desconhecido, redirecionar para planos
        console.warn('⚠️ Status desconhecido ou ausente, redirecionando para planos');
        router.replace('/planos');
        break;
    }
  }, [router, searchParams]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Processando retorno...</h2>
        <p className="text-gray-500 mt-2">Redirecionando para a página apropriada</p>
      </div>
    </div>
  );
}