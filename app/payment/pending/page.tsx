'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPending() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
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
        
        console.log('🔍 Parâmetros recebidos do Mercado Pago (Pending):', {
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
        
        console.log('📋 Dados do pagamento verificados (Pending):', paymentData);
        
        setPaymentInfo({
          paymentId: paymentIdToCheck,
          status: paymentData.status,
          statusDetail: paymentData.status_detail,
          amount: paymentData.transaction_amount,
          currencyId: paymentData.currency_id,
          paymentMethod: paymentData.payment_method_id,
          dateCreated: paymentData.date_created,
          externalReference: paymentData.external_reference
        });
        
        // Se o pagamento foi aprovado, redirecionar para success
        if (paymentData.status === 'approved') {
          router.push('/payment/success' + window.location.search);
          return;
        }
        
        // Se foi rejeitado, redirecionar para failure
        if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          router.push('/payment/failure' + window.location.search);
          return;
        }
        
      } catch (err) {
        console.error('❌ Erro ao verificar pagamento (Pending):', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  const handleCheckStatus = async () => {
    if (!paymentInfo?.paymentId) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pagamentos/status/${paymentInfo.paymentId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento');
      }

      const paymentData = await response.json();
      
      console.log('🔄 Status atualizado:', paymentData);
      
      // Atualizar informações do pagamento
      setPaymentInfo((prev: any) => ({
        ...prev,
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        dateApproved: paymentData.date_approved
      }));
      
      // Redirecionar se status mudou
      if (paymentData.status === 'approved') {
        router.push('/payment/success' + window.location.search);
      } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
        router.push('/payment/failure' + window.location.search);
      } else {
        alert('Status ainda pendente. Aguarde a confirmação do pagamento.');
      }
      
    } catch (err) {
      console.error('❌ Erro ao verificar status:', err);
      alert('Erro ao verificar status. Tente novamente.');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Ícone de pendente */}
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Pendente
        </h1>
        
        <p className="text-gray-600 mb-6">
          Seu pagamento está sendo processado. Você receberá uma confirmação assim que for aprovado.
        </p>

        {/* Informações do pagamento */}
        {paymentInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-3">Detalhes da Transação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">ID do Pagamento:</span>
                <span className="font-mono text-yellow-800">{paymentInfo.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Status:</span>
                <span className="font-semibold text-yellow-800 capitalize">{paymentInfo.status}</span>
              </div>
              {paymentInfo.statusDetail && (
                <div className="flex justify-between">
                  <span className="text-yellow-700">Detalhe:</span>
                  <span className="text-yellow-800">{paymentInfo.statusDetail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-yellow-700">Valor:</span>
                <span className="font-semibold text-yellow-800">
                  {paymentInfo.currencyId} {paymentInfo.amount}
                </span>
              </div>
              {paymentInfo.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-yellow-700">Método:</span>
                  <span className="text-yellow-800 uppercase">{paymentInfo.paymentMethod}</span>
                </div>
              )}
              {paymentInfo.dateCreated && (
                <div className="flex justify-between">
                  <span className="text-yellow-700">Data de Criação:</span>
                  <span className="text-yellow-800">
                    {new Date(paymentInfo.dateCreated).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {paymentInfo.externalReference && (
                <div className="flex justify-between">
                  <span className="text-yellow-700">Referência:</span>
                  <span className="font-mono text-yellow-800">{paymentInfo.externalReference}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações sobre o processo */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-800 mb-2">O que acontece agora?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Aguarde a confirmação do pagamento</li>
            <li>• Você receberá um e-mail quando aprovado</li>
            <li>• O plano será ativado automaticamente</li>
            <li>• Pode levar até 3 dias úteis</li>
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="space-y-3">
          <button 
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              checkingStatus 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {checkingStatus ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verificando...
              </span>
            ) : (
              'Verificar Status'
            )}
          </button>
          
          <Link 
            href="/dashboard" 
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        {/* Suporte */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Dúvidas?</strong> Entre em contato conosco: 
            <a href="mailto:suporte@gabarita.ai" className="underline font-medium">suporte@gabarita.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
}