'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Componente Cliente para Planos
 * 
 * Este componente usa useSearchParams e deve ser um Client Component.
 * Separado do Server Component para evitar erros de build.
 */
export default function PlanosClient() {
  const searchParams = useSearchParams();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obter parâmetros da URL
  const selectedPlan = searchParams.get('plano');
  const source = searchParams.get('source');

  useEffect(() => {
    // Simular carregamento de planos
    const loadPlanos = async () => {
      try {
        // Aqui você pode fazer a chamada para a API dos planos
        const mockPlanos = [
          {
            id: 'trial',
            nome: 'Trial Gratuito',
            preco: 0.00,
            periodo: 'grátis',
            descricao: 'Experimente gratuitamente',
            recursos: [
              '3 questões gratuitas',
              'Correção automática',
              'Feedback básico',
              'Sem compromisso',
              'Teste agora mesmo'
            ],
            popular: false
          },
          {
            id: 'lite',
            nome: 'Mensal',
            preco: 14.90,
            periodo: '30 dias',
            descricao: 'Acesso completo por 1 mês',
            recursos: [
              'Questões ilimitadas',
              'Simulados personalizados',
              'Relatórios detalhados',
              'Ranking nacional',
              'Suporte prioritário'
            ],
            popular: true
          },
          {
            id: 'premium',
            nome: 'Premium',
            preco: 40.00,
            periodo: '30 dias',
            descricao: 'Com recursos adicionais',
            recursos: [
              'Questões ilimitadas',
              'Simulados personalizados',
              'Relatórios detalhados',
              'Ranking nacional',
              'Suporte prioritário',
              'Botão de macetes',
              'Modo foco'
            ],
            popular: false
          }
        ];
        
        setPlanos(mockPlanos);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlanos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha seu Plano
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecione o plano ideal para seus estudos e acelere sua preparação para concursos públicos.
        </p>
        {selectedPlan && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              Plano selecionado: <strong>{selectedPlan}</strong>
              {source && ` (origem: ${source})`}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={`relative bg-white rounded-lg shadow-lg border-2 p-6 ${
              plano.popular
                ? 'border-blue-500 transform scale-105'
                : 'border-gray-200'
            }`}
          >
            {plano.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plano.nome}</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  R$ {plano.preco.toFixed(2)}
                </span>
                <span className="text-gray-600 ml-1">/{plano.periodo}</span>
              </div>
              <p className="text-gray-600">{plano.descricao}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {plano.recursos.map((recurso, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{recurso}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plano.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
              onClick={() => {
                // Aqui você pode implementar a lógica de seleção do plano
                console.log('Plano selecionado:', plano.id);
              }}
            >
              {plano.preco === 0 ? 'Começar Grátis' : 'Escolher Plano'}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600">
          Todos os planos incluem garantia de 7 dias. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}