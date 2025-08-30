'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '@/services/api';
import { Question } from '@/types';
import { loginTestUser, isLoggedIn, getUserData } from '../../config/test-user';
import PlanProtection from '../../components/PlanProtection';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw,
  BookOpen,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Lightbulb,
  Search,
  X,
  User
} from 'lucide-react';

type SimulationState = 'setup' | 'running' | 'finished';

export default function SimuladoPage() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SimulationState>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState<string | { id: string; texto: string } | any>('');
  const [showChat, setShowChat] = useState(false);
  const [materias, setMaterias] = useState<any[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  // Setup form
  const [setupForm, setSetupForm] = useState({
    subject: '',
    difficulty: 'medio',
    questionCount: 5
  });

  // Forçar criação do usuário mock e carregar matérias
  useEffect(() => {
    // Forçar criação do usuário mock ANTES de qualquer coisa
    console.log('🔧 FORÇANDO criação de usuário mock...');
    const mockUser = {
      id: 'dev-user-123',
      uid: 'dev-user-123',
      nome: 'Usuário Desenvolvimento',
      email: 'dev@gabarita.ai',
      cargo: 'Analista Judiciário',
      bloco: 'Bloco 6 - Controle e Fiscalização',
      plano: 'trial'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    console.log('✅ Usuário mock salvo:', localStorage.getItem('user'));
    
    // Testar getCurrentUser imediatamente
    const testUser = apiService.getCurrentUser();
    console.log('🧪 Teste getCurrentUser:', testUser);
    
    const carregarMaterias = async () => {
      if (!user?.cargo || !user?.bloco) {
        console.log('WARNING: Usuário sem cargo ou bloco definido');
        return;
      }

      setLoadingMaterias(true);
      try {
        const response = await apiService.getMateriasPorCargoBloco(user.cargo, user.bloco);
        if (response.success && response.data) {
          console.log('SUCCESS: Matérias carregadas para simulado:', response.data);
          setMaterias(response.data);
        } else {
          console.error('ERROR: Erro ao carregar matérias:', response.error);
          // Fallback para matérias padrão se houver erro
          setMaterias([
            { materia: 'Português', tipo_conhecimento: 'conhecimentos_gerais' },
            { materia: 'Matemática', tipo_conhecimento: 'conhecimentos_gerais' },
            { materia: 'Direito', tipo_conhecimento: 'conhecimentos_especificos' },
            { materia: 'Conhecimentos Gerais', tipo_conhecimento: 'conhecimentos_gerais' },
            { materia: 'Informática', tipo_conhecimento: 'conhecimentos_especificos' }
          ]);
        }
      } catch (error: any) {
        console.error('ERROR: Erro ao carregar matérias:', error);
        // Fallback para matérias padrão
        setMaterias([
          { materia: 'Português', tipo_conhecimento: 'conhecimentos_gerais' },
          { materia: 'Matemática', tipo_conhecimento: 'conhecimentos_gerais' },
          { materia: 'Direito', tipo_conhecimento: 'conhecimentos_especificos' },
          { materia: 'Conhecimentos Gerais', tipo_conhecimento: 'conhecimentos_gerais' },
          { materia: 'Informática', tipo_conhecimento: 'conhecimentos_especificos' }
        ]);
      } finally {
        setLoadingMaterias(false);
      }
    };

    carregarMaterias();
  }, [user?.cargo, user?.bloco]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && state === 'running') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, state]);

  // Função de debug temporária
  const debugUser = () => {
    console.log('DEBUG: Verificando usuário...');
    console.log('DEBUG: user do contexto:', user);
    console.log('DEBUG: localStorage user:', localStorage.getItem('user'));
    
    // Testar getCurrentUser da API
    const apiUser = apiService.getCurrentUser();
    console.log('DEBUG: apiService.getCurrentUser():', apiUser);
    
    // Sempre forçar criação de usuário mock para garantir que funcione
    console.log('DEBUG: Criando usuário mock...');
    const mockUser = {
      id: 'dev-user-123',
      uid: 'dev-user-123',
      nome: 'Usuário Desenvolvimento',
      email: 'dev@gabarita.ai',
      cargo: 'Analista Judiciário',
      bloco: 'Bloco 6 - Controle e Fiscalização',
      plano: 'trial'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    console.log('DEBUG: Usuário mock criado:', localStorage.getItem('user'));
    
    // Verificar novamente após salvar
    const verifyUser = apiService.getCurrentUser();
    console.log('DEBUG: Verificação após salvar:', verifyUser);
  };

  // Definir todos os useCallback após os useEffect para manter ordem consistente
  const startSimulation = async () => {
    console.log('🚀 INICIANDO SIMULADO - Configurações:', setupForm);
    console.log('👤 Dados do usuário:', { bloco: user?.bloco, cargo: user?.cargo, id: user?.id });
    
    // Debug do usuário - FORÇAR EXECUÇÃO
    console.log('🔍 EXECUTANDO DEBUG DO USUÁRIO...');
    debugUser();
    
    // Aguardar um pouco para o localStorage ser atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar novamente após debug
    const updatedUser = apiService.getCurrentUser();
    console.log('🔄 Usuário após debug:', updatedUser);
    
    // Verificar se os dados obrigatórios estão presentes
    if (!user?.bloco || !user?.cargo) {
      console.error('❌ ERROR: Dados obrigatórios ausentes:', { bloco: user?.bloco, cargo: user?.cargo });
      alert('Erro: Dados do usuário incompletos. Bloco e cargo são obrigatórios.');
      return;
    }
    
    // Inicializar simulado sem questões pré-carregadas
    console.log('🔄 Resetando estados do simulado...');
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentProgress(0);
    setTotalQuestions(setupForm.questionCount);
    setIsRunning(true);
    setTimeElapsed(0);
    setState('running');
    
    console.log('✅ Estados resetados - Estado atual: running');
    console.log('📝 Total de questões configurado:', setupForm.questionCount);
    
    // Gerar primeira questão
    console.log('🎯 Gerando primeira questão...');
    await generateNextQuestion();
  };

  const generateNextQuestion = async () => {
    console.log('🔄 Gerando próxima questão...');
    console.log('📊 Estado atual - Questions:', questions.length, 'CurrentIndex:', currentQuestionIndex);
    setLoading(true);
    
    try {
      const requestData = {
        subject: setupForm.subject || undefined,
        difficulty: setupForm.difficulty,
        count: 1, // Sempre gerar apenas 1 questão
        bloco: user?.bloco,
        cargo: user?.cargo
      };
      
      console.log('📤 Enviando requisição para API:', requestData);
      const response = await apiService.generateQuestions(requestData);
      console.log('📥 Resposta da API recebida:', response);

      if (response.success && response.data && response.data.length > 0) {
        const newQuestion = response.data[0];
        console.log('✅ Nova questão gerada:', {
          id: newQuestion.id,
          tema: newQuestion.subject,
          pergunta: newQuestion.question?.substring(0, 50) + '...',
          opcoes: newQuestion.options?.length || 0
        });
        
        // Adicionar nova questão ao array
        setQuestions(prev => {
          const updated = [...prev, newQuestion];
          console.log('📝 Array de questões atualizado - Total:', updated.length);
          return updated;
        });
        setAnswers(prev => {
          const updated = [...prev, -1];
          console.log('📋 Array de respostas atualizado - Total:', updated.length);
          return updated;
        });
        
        console.log('🎉 Questão adicionada com sucesso!');
      } else {
        console.error('❌ Erro na resposta da API:', response.error);
        console.error('📊 Response completa:', response);
        alert('Erro ao gerar questão: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('💥 Erro ao gerar questão:', error);
      console.error('📊 Stack trace:', error.stack);
      alert('Erro ao conectar com o servidor: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
      console.log('🏁 Loading finalizado');
    }
  };

  // Definir finishSimulation primeiro
  const finishSimulation = useCallback(async () => {
    if (questions.length === 0) {
      alert('Não há questões para finalizar o simulado.');
      return;
    }

    setIsRunning(false);
    setLoading(true);

    try {
      const questionIds = questions.map(q => q.id);
      const response = await apiService.submitSimulation(answers, questionIds);
      
      if (response.success && response.data) {
        setResult(response.data);
        setState('finished');
      } else {
        alert('Erro ao finalizar simulado: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Erro ao finalizar simulado:', error);
      alert('Erro ao conectar com o servidor: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [questions, answers]);

  // Definir nextQuestion após finishSimulation
  const nextQuestion = useCallback(async () => {
    console.log('🔄 nextQuestion chamado - Estado atual:', {
      currentProgress,
      totalQuestions,
      currentQuestionIndex,
      questionsLength: questions.length
    });

    // Verificar se já atingiu o total de questões
    if (currentProgress >= totalQuestions) {
      console.log('🏁 Limite de questões atingido - finalizando simulado');
      await finishSimulation();
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      // Navegar para próxima questão existente
      console.log('➡️ Navegando para próxima questão existente');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Gerar nova questão
      console.log('🔄 Gerando nova questão');
      await generateNextQuestion();
      setCurrentQuestionIndex(questions.length); // Ir para a nova questão
    }
  }, [currentQuestionIndex, questions.length, generateNextQuestion, currentProgress, totalQuestions, finishSimulation]);

  const selectAnswer = useCallback((answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  }, [answers, currentQuestionIndex]);

  const confirmAnswer = useCallback(async () => {
    const selectedAnswer = answers[currentQuestionIndex];
    if (selectedAnswer === -1) {
      alert('Por favor, selecione uma resposta antes de confirmar.');
      return;
    }

    // Processar resposta com feedback do PECLEST
    const currentQ = questions[currentQuestionIndex];
    setLoading(true);

    try {
      // Enviar resposta para o backend com feedback completo
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questoes/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questao_id: currentQ.id,
          usuario_id: user?.id,
          alternativa_escolhida: String.fromCharCode(65 + selectedAnswer), // A, B, C, D
          tempo_resposta: timeElapsed
        })
      });

      const result = await response.json();
      console.log('Resposta processada:', result);
      
      if (result.sucesso) {
        // PECLEST: Processar feedback detalhado para erros
        let feedbackCompleto = result.explicacao;
        if (!result.acertou && result.peclest && result.peclest.ativo) {
          console.log('🔥 PECLEST: Feedback detalhado recebido');
          
          // Construir feedback completo do PECLEST
          feedbackCompleto = `
            📚 **Explicação do Erro:**\n${result.peclest.explicacao_erro || result.explicacao}
            
            ${result.peclest.conceitos_importantes ? `\n🎯 **Conceitos Importantes:**\n${result.peclest.conceitos_importantes}` : ''}
            
            ${result.peclest.fontes_estudo ? `\n📖 **Fontes de Estudo:**\n${result.peclest.fontes_estudo}` : ''}
            
            ${result.peclest.dicas ? `\n💡 **Dicas Práticas:**\n${result.peclest.dicas}` : ''}
          `.trim();
        }
        
        // Atualizar chat com feedback automático
        setChatQuestion(result.acertou ? 'Parabéns! Você acertou!' : 'Vamos analisar este erro:');
        setChatResponse(feedbackCompleto);
        
        // Incrementar progresso imediatamente após confirmar resposta
        const newProgress = currentProgress + 1;
        setCurrentProgress(newProgress);
        console.log('📊 Progresso incrementado após confirmar resposta:', newProgress, '/', totalQuestions);

        // Verificar se atingiu o total de questões
        if (newProgress >= totalQuestions) {
          console.log('🏁 Limite de questões atingido - finalizando simulado automaticamente');
          setTimeout(async () => {
            await finishSimulation();
          }, 2000); // Finalizar após 2 segundos para mostrar feedback
          return;
        }

        // PECLEST: Auto-avançar apenas se acertou (questões erradas ficam para estudo)
        if (result.acertou) {
          console.log('✅ PECLEST: Resposta correta - avançando automaticamente');
          setTimeout(() => {
            // Não incrementar progresso aqui, já foi incrementado acima
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
              generateNextQuestion().then(() => {
                setCurrentQuestionIndex(questions.length);
              });
            }
          }, 2000); // Avançar após 2 segundos
        } else {
          console.log('❌ PECLEST: Resposta incorreta - aguardando interação do usuário');
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar resposta:', error);
      alert('Erro ao processar resposta: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [answers, currentQuestionIndex, questions, user?.id, timeElapsed, nextQuestion]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Estado para controlar feedback visual das respostas
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);

  // Se ainda está carregando a autenticação, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Wrap everything with PlanProtection
  const SimuladoContent = () => {



  const resetSimulation = () => {
    setState('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentProgress(0);
    setTotalQuestions(0);
    setAnswers([]);
    setTimeElapsed(0);
    setIsRunning(false);
    setResult(null);
    // Reset chat states
    setChatQuestion('');
    setChatResponse('');
    setShowChat(false);
  };

  // Funcionalidades Premium (Plano Black)
  const handleChatDuvidas = async () => {
    if (!chatQuestion.trim()) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questoes/chat-duvidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questao_id: questions[currentQuestionIndex].id,
          usuario_id: user?.id,
          pergunta: chatQuestion
        })
      });
      
      const result = await response.json();
      if (result.sucesso) {
        setChatResponse(result.resposta);
      }
    } catch (error: any) {
      console.error('Erro no chat:', error);
    }
  };

  const getMacetes = async () => {
    try {
      setChatQuestion('Quais são os macetes para resolver esta questão?');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questoes/macetes/${questions[currentQuestionIndex].id}`);
      const result = await response.json();
      if (result.sucesso) {
        // Se result.macetes for um objeto com propriedade texto, extrair o texto
        const macetesText = typeof result.macetes === 'object' && result.macetes?.texto 
          ? result.macetes.texto 
          : typeof result.macetes === 'string' 
          ? result.macetes 
          : JSON.stringify(result.macetes);
        setChatResponse(macetesText);
      }
    } catch (error: any) {
      console.error('Erro ao obter macetes:', error);
      setChatResponse('Desculpe, ocorreu um erro ao buscar os macetes desta questão.');
    }
  };

  const getPontosCentrais = async () => {
    try {
      setChatQuestion('Quais são os pontos centrais desta questão?');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questoes/pontos-centrais/${questions[currentQuestionIndex].id}`);
      const result = await response.json();
      if (result.sucesso) {
        // Se result.pontos_centrais for um objeto com propriedade texto, extrair o texto
        const pontosCentraisText = typeof result.pontos_centrais === 'object' && result.pontos_centrais?.texto 
          ? result.pontos_centrais.texto 
          : typeof result.pontos_centrais === 'string' 
          ? result.pontos_centrais 
          : JSON.stringify(result.pontos_centrais);
        setChatResponse(pontosCentraisText);
      }
    } catch (error: any) {
      console.error('Erro ao obter pontos centrais:', error);
      setChatResponse('Desculpe, ocorreu um erro ao buscar os pontos centrais desta questão.');
    }
  };

  const getOutrasExploracoes = async () => {
    try {
      setChatQuestion('Como a banca pode explorar este tema em outras questões?');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questoes/outras-exploracoes/${questions[currentQuestionIndex].id}`);
      const result = await response.json();
      if (result.sucesso) {
        // Se result.outras_exploracoes for um objeto com propriedade texto, extrair o texto
        const outrasExploracoesText = typeof result.outras_exploracoes === 'object' && result.outras_exploracoes?.texto 
          ? result.outras_exploracoes.texto 
          : typeof result.outras_exploracoes === 'string' 
          ? result.outras_exploracoes 
          : JSON.stringify(result.outras_exploracoes);
        setChatResponse(outrasExploracoesText);
      }
    } catch (error: any) {
      console.error('Erro ao obter outras explorações:', error);
      setChatResponse('Desculpe, ocorreu um erro ao buscar outras explorações desta questão.');
    }
  };

  // Debug: log do estado atual
  console.log('Estado atual do componente:', { state, user: !!user, loading, authLoading });

    // Setup Screen
    if (state === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Simulado</h1>
              <p className="text-gray-600">Configure seu simulado personalizado</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matéria (Opcional)
                </label>
                <select
                  value={setupForm.subject}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, subject: e.target.value }))}
                  disabled={loadingMaterias}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Todas as matérias</option>
                  {loadingMaterias ? (
                    <option disabled>Carregando matérias...</option>
                  ) : (
                    materias.map((materia, index) => (
                      <option key={index} value={materia.materia}>
                        {materia.materia} {materia.tipo_conhecimento === 'conhecimentos_especificos' ? '(Específica)' : '(Geral)'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dificuldade
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSetupForm(prev => ({ ...prev, difficulty: level }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        setupForm.difficulty === level
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level === 'easy' && 'Fácil'}
                      {level === 'medium' && 'Médio'}
                      {level === 'hard' && 'Difícil'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Questões
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSetupForm({ ...setupForm, questionCount: count })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        setupForm.questionCount === count
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {count} questões
                    </button>
                  ))}
                </div>

              </div>





              {/* Botão de Login de Teste */}
              {!user && (
                <button
                  onClick={async () => {
                    try {
                      console.log('Iniciando login de teste...');
                      const result = await loginTestUser();
                      console.log('SUCCESS: Resultado do login:', result);
                      
                      if (result && result.sucesso) {
                        console.log('SUCCESS: Login realizado com sucesso, recarregando página...');
                        window.location.reload();
                      } else {
                        console.error('ERROR: Falha no login de teste:', result);
                        alert('Erro no login de teste. Verifique o console.');
                      }
                    } catch (error: any) {
                      console.error('ERROR: Erro ao fazer login de teste:', error);
                      alert('Erro ao fazer login de teste: ' + (error?.message || 'Erro desconhecido'));
                    }
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Login de Teste (Usuário: teste@gabarita.com)
                </button>
              )}
              


              <button
                onClick={() => {
                    console.log('CLIQUE DETECTADO NO BOTÃO!');
                    startSimulation();
                  }}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Gerando questões...</span>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>Iniciar Simulado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Running Simulation
  if (state === 'running') {
    // Se não há questões ainda ou está carregando a primeira
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gerando sua primeira questão...</h2>
            <p className="text-gray-600">Aguarde enquanto preparamos uma questão personalizada para você.</p>
          </div>
        </div>
      );
    }

    // Se a questão atual não existe ainda (navegação para questão não gerada)
    if (currentQuestionIndex >= questions.length) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gerando nova questão...</h2>
            <p className="text-gray-600">Preparando a próxima questão do seu simulado.</p>
          </div>
        </div>
      );
    }

    const question = questions[currentQuestionIndex];
    
    // Debug da questão atual
    console.log('🔍 DEBUG - Estado atual:', {
      questionsLength: questions.length,
      currentQuestionIndex,
      hasQuestion: !!question,
      questionId: question?.id,
      state,
      loading
    });
    
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    const answeredCount = answers.filter(a => a !== -1).length;

    // Verificação de segurança para evitar erro quando não há questões
    if (!question) {
      return (
        <div className="min-h-screen bg-gray-50 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-gray-500 mb-4">
                <Clock className="h-12 w-12 mx-auto mb-2" />
                <p>Carregando questão...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
                </div>
              </div>
              <button
                onClick={isRunning ? () => setIsRunning(false) : () => setIsRunning(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isRunning ? 'Pausar' : 'Continuar'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Questão {currentProgress + 1} de {totalQuestions}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round((currentProgress / totalQuestions) * 100)}% concluído
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentProgress / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Respondidas: {answeredCount}/{questions.length}</span>
              <span>Questões geradas: {questions.length}</span>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{question.subject}</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{question.difficulty}</span>
              </div>
              <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                {question.question}
              </h2>
            </div>

            <div className="space-y-3">
              {question.options && question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    answers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestionIndex] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestionIndex] === index && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Botão Confirmar */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={confirmAnswer}
                disabled={answers[currentQuestionIndex] === -1 || loading}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  answers[currentQuestionIndex] === -1 || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Confirmar Resposta</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Chat AI Premium (Plano Black) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="bg-black text-white px-2 py-1 rounded text-sm mr-2">BLACK</span>
                <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                Chat AI - Assistente da Questão
              </h3>
            </div>
            
            {/* Área de Conversa */}
            <div className="p-4 bg-gray-50/50 min-h-[180px] max-h-[280px] overflow-y-auto">
              {chatResponse ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                      <p className="text-sm">{chatQuestion}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 max-w-[85%]">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {typeof chatResponse === 'string' ? chatResponse : 
                         typeof chatResponse === 'object' && chatResponse?.texto ? chatResponse.texto :
                         JSON.stringify(chatResponse)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Use os atalhos ou digite sua pergunta</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Campo de Entrada com Botões Integrados */}
            <div className="p-4 border-t border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Pergunte sobre esta questão..."
                  className="w-full pl-4 pr-32 py-3 bg-gray-50 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleChatDuvidas()}
                />
                
                {/* Botões de Ação Integrados */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={getMacetes}
                    className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                    title="Macetes"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={getPontosCentrais}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Pontos Centrais"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={getOutrasExploracoes}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Explorações"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <button
                    onClick={handleChatDuvidas}
                    disabled={!chatQuestion.trim()}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent rounded-full transition-colors"
                    title="Enviar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={finishSimulation}
                disabled={loading || currentProgress === 0}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg transition-colors"
              >
                {loading ? 'Finalizando...' : `Finalizar Simulado (${currentProgress}/${totalQuestions})`}
              </button>

              <button
                onClick={nextQuestion}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gerando questão...</span>
                  </>
                ) : (
                  <>
                    <span>Próxima Questão</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (state === 'finished' && result) {
    const correctAnswers = answers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    const accuracy = Math.round((correctAnswers / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-8">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulado Concluído!</h1>
              <p className="text-gray-600">Confira seu desempenho</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Acertos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{accuracy}%</div>
                <div className="text-sm text-gray-600">Precisão</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">{formatTime(timeElapsed)}</div>
                <div className="text-sm text-gray-600">Tempo Total</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetSimulation}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Novo Simulado</span>
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
  };

  return (
     <PlanProtection resource="simulados">
       <SimuladoContent />
     </PlanProtection>
   );
}

