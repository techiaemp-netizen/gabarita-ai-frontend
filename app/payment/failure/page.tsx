'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailure() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Obter parâmetros da URL do Mercado Pago
        const collectionId = searchParams.get('collection_id');
        const paymentId = searchParams.get('payment_id');
        const collectionStatus = searchParams.get('collection_status');
        const preferenceId = searchParams.get('preference_id');
        const externalReference = searchParams.get('external_reference');
        
        console.log('🔍 Parâmetros recebidos do Mercado Pago (Failure):', {
          collectionId,
          paymentId,
          collectionStatus,
          preferenceId,
          externalReference
        });

        if (!collectionId && !paymentId) {
          throw new Error('Parâmetros de pagamento não encontrados na URL');
        }

        // Verificar status do pagamento no backend
        const paymentIdToCheck = collectionId || paymentId;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pagamentos/status/${paymentIdToCheck}`);
        
        if (!response.ok) {
          throw new Error('Erro ao verificar status do pagamento');
        }

        const paymentData = await response.json();
        
        console.log('📋 Dados do pagamento verificados (Failure):', paymentData);
        
        setPaymentInfo({
          paymentId: paymentIdToCheck,
          status: paymentData.status,
          statusDetail: paymentData.status_detail,
          amount: paymentData.transaction_amount,
          currencyId: paymentData.currency_id,
          paymentMethod: paymentData.payment_method_id,
          dateCreated: paymentData.date_created,
          externalReference: paymentData.external_reference,
          failureReason: paymentData.status_detail || 'Pagamento não autorizado'
        });
        
        // Se o pagamento foi aprovado, redirecionar para success
        if (paymentData.status === 'approved') {
          router.push('/payment/success' + window.location.search);
          return;
        }
        
        // Se ainda está pendente, redirecionar para pending
        if (paymentData.status === 'pending' || paymentData.status === 'in_process') {
          router.push('/payment/pending' + window.location.search);
          return;
        }
        
      } catch (err) {
        console.error('❌ Erro ao verificar pagamento (Failure):', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verificando pagamento...</h2>
          <p className="text-gray-500 mt-2">Aguarde enquanto processamos as informações</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro na Verificação</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href="/planos" 
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors block"
            >
              Tentar Novamente
            </Link>
            <Link 
              href="/painel" 
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block"
            >
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Ícone de erro */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Não Aprovado
        </h1>
        
        <p className="text-gray-600 mb-6">
          Infelizmente, não foi possível processar seu pagamento. Verifique os dados e tente novamente.
        </p>

        {/* Informações do pagamento */}
        {paymentInfo && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-red-800 mb-3">Detalhes da Transação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-700">ID do Pagamento:</span>
                <span className="font-mono text-red-800">{paymentInfo.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Status:</span>
                <span className="font-semibold text-red-800 capitalize">{paymentInfo.status}</span>
              </div>
              {paymentInfo.statusDetail && (
                <div className="flex justify-between">
                  <span className="text-red-700">Detalhe:</span>
                  <span className="text-red-800">{paymentInfo.statusDetail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-red-700">Valor:</span>
                <span className="font-semibold text-red-800">
                  {paymentInfo.currencyId} {paymentInfo.amount}
                </span>
              </div>
              {paymentInfo.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-red-700">Método:</span>
                  <span className="text-red-800 uppercase">{paymentInfo.paymentMethod}</span>
                </div>
              )}
              {paymentInfo.dateCreated && (
                <div className="flex justify-between">
                  <span className="text-red-700">Data de Criação:</span>
                  <span className="text-red-800">
                    {new Date(paymentInfo.dateCreated).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {paymentInfo.externalReference && (
                <div className="flex justify-between">
                  <span className="text-red-700">Referência:</span>
                  <span className="font-mono text-red-800">{paymentInfo.externalReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-red-700">Motivo:</span>
                <span className="text-red-800">{paymentInfo.failureReason}</span>
              </div>
            </div>
          </div>
        )}

        {/* Possíveis motivos */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-800 mb-2">Possíveis motivos:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Dados do cartão incorretos</li>
            <li>• Limite insuficiente</li>
            <li>• Cartão bloqueado ou vencido</li>
            <li>• Problema na operadora</li>
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="space-y-3">
          <Link 
            href="/planos" 
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors block"
          >
            Tentar Novamente
          </Link>
          
          <Link 
            href="/dashboard" 
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        {/* Suporte */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Precisa de ajuda?</strong> Entre em contato com nosso suporte através do e-mail: 
            <a href="mailto:suporte@gabarita.ai" className="underline font-medium">suporte@gabarita.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
}