'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Zap, 
  Star,
  CreditCard,
  Shield,
  Infinity,
  Sparkles,
  Target,
  MessageCircle,
  BookOpen,
  TrendingUp
} from 'lucide-react';

interface PlanResource {
  questoes_limitadas?: boolean;
  simulados?: boolean;
  relatorios?: boolean;
  ranking?: boolean;
  suporte?: boolean;
  macetes?: boolean;
  modo_foco?: boolean;
  redacao?: boolean;
}

interface Plan {
  id: string;
  nome: string;
  preco: number;
  periodo: string;
  descricao: string;
  recursos: string[];
  popular?: boolean;
  duracao?: string;
  tipo?: string;
}

export default function PlanosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('gratuito');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await apiService.getPlans();
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Planos carregados com sucesso:', response.data.length, 'planos');
        setPlans(response.data);
      } else {
        console.error('Resposta da API invalida:', response);
        setPlans([]);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      alert('Voce precisa estar logado para assinar um plano');
      return;
    }

    if (planId === 'gratuito') {
      alert('Voce ja tem acesso ao plano gratuito!');
      return;
    }

    setProcessingPayment(planId);
    try {
      const response = await apiService.createPayment(planId);
      if (response.success && response.data?.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank');
      } else {
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleContinueWithFree = () => {
    router.push('/dashboard');
  };

  const getPlanDetails = (planName: string, planId: string) => {
    const planDetails = {
      'gratuito': {
        benefits: [
          'Acesso a questões básicas de concursos',
          'Simulados limitados por dia',
          'Relatórios básicos de desempenho',
          'Suporte via email'
        ],
        description: 'Perfeito para quem está começando a se preparar para concursos. Tenha acesso às funcionalidades essenciais da plataforma sem custo algum.'
      },
      'premium': {
        benefits: [
          'Questões ilimitadas de todos os concursos',
          'Simulados personalizados por IA',
          'Relatórios detalhados com análise de desempenho',
          'Ranking nacional em tempo real',
          'Suporte prioritário via chat',
          'Macetes e dicas exclusivas',
          'Modo foco para estudos intensivos'
        ],
        description: 'Ideal para candidatos sérios que querem maximizar suas chances de aprovação. Recursos avançados com tecnologia de IA para uma preparação completa.'
      },
      'black': {
        benefits: [
          'Todos os recursos do Premium',
          'Correção de redação por especialistas',
          'Mentoria personalizada 1:1',
          'Acesso antecipado a novos recursos',
          'Simulados exclusivos de bancas específicas',
          'Análise preditiva de aprovação',
          'Suporte VIP 24/7',
          'Garantia de aprovação ou dinheiro de volta'
        ],
        description: 'O plano mais completo para quem busca a excelência. Recursos exclusivos, mentoria especializada e garantia de resultados para sua aprovação.'
      }
    };

    // Busca por nome do plano (case insensitive)
    const planKey = Object.keys(planDetails).find(key => 
      planName.toLowerCase().includes(key) || 
      planId.toLowerCase().includes(key)
    );

    return planDetails[planKey as keyof typeof planDetails] || planDetails['premium'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Escolha seu <span className="text-blue-600">Plano</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acelere sua preparacao para concursos com nossos planos premium. 
            Acesso completo a simulados, relatorios detalhados e muito mais!
          </p>
        </div>

        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seu Plano Atual</h3>
                <p className="text-gray-600">
                  {userPlan === 'gratuito' ? 'Plano Gratuito' : `Plano ${userPlan}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {userPlan === 'gratuito' ? (
                  <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                    Gratuito
                  </div>
                ) : (
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {Array.isArray(plans) && plans.length > 0 ? plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                plan.popular ? 'ring-4 ring-yellow-400 shadow-2xl' : ''
              } ${plan.id === 'black' ? 'bg-gradient-to-br from-gray-900 to-black text-white' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-black text-center py-2 font-bold text-sm">
                  MAIS POPULAR
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.id === 'black' ? 'text-white' : 'text-gray-900'}`}>
                    {plan.nome}
                  </h3>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.id === 'black' ? 'text-white' : 'text-blue-600'}`}>
                      {plan.preco === 0 ? 'Gratis' : `R$ ${plan.preco.toFixed(2)}`}
                    </span>
                    {plan.preco > 0 && (
                      <span className={`text-sm ${plan.id === 'black' ? 'text-gray-300' : 'text-gray-500'} ml-1`}>
                        /{plan.periodo}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${plan.id === 'black' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {plan.descricao}
                  </p>
                </div>

                <div className="mb-8">
                  <div className={`text-sm leading-relaxed mb-6 ${plan.id === 'black' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getPlanDetails(plan.nome, plan.id).description}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className={`font-semibold text-sm uppercase tracking-wide ${plan.id === 'black' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Principais Benefícios:
                    </h4>
                    <ul className="space-y-2">
                      {getPlanDetails(plan.nome, plan.id).benefits.map((benefit, index) => (
                        <li key={index} className={`flex items-start text-sm ${plan.id === 'black' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0 ${
                            plan.id === 'black' ? 'bg-white' : 'bg-blue-500'
                          }`}></div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPayment === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.id === 'black'
                      ? 'bg-white text-black hover:bg-gray-100'
                      : plan.popular
                      ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${processingPayment === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processingPayment === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                      Processando...
                    </div>
                  ) : plan.preco === 0 ? (
                    'Continuar Gratuito'
                  ) : (
                    `Assinar por R$ ${plan.preco.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">Nenhum plano disponivel no momento.</p>
              <p className="text-gray-500 text-sm mt-2">Planos carregados: {JSON.stringify(plans)}</p>
            </div>
          )}
        </div>



        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Perguntas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Posso cancelar minha assinatura a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Voce pode cancelar sua assinatura a qualquer momento atraves do seu painel de controle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quais formas de pagamento sao aceitas?
              </h3>
              <p className="text-gray-600">
                Aceitamos cartao de credito, debito, PIX e boleto bancario atraves do Mercado Pago.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Posso usar em dispositivos moveis?
              </h3>
              <p className="text-gray-600">
                Sim! Nossa plataforma e totalmente responsiva e funciona perfeitamente em smartphones e tablets.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Como funciona a personalizacao por IA?
              </h3>
              <p className="text-gray-600">
                Nossa IA analisa seu desempenho e cria simulados personalizados focados nas suas dificuldades.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Pronto para acelerar seus estudos?</h2>
            <p className="text-xl mb-6 opacity-90">
              Junte-se a milhares de candidatos que ja estao se preparando conosco!
            </p>
            <button
              onClick={handleContinueWithFree}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Comecar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

