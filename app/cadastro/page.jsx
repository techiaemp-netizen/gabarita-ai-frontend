"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { apiService } from '../../services/api';

/**
 * Cadastro page
 *
 * User registration form with complete fields for account creation
 */
export default function CadastroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cargo: '',
    bloco: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargosOpcoes, setCargosOpcoes] = useState([]);
  const [blocosOpcoes, setBlocosOpcoes] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      router.push('/painel');
    }
  }, [user, loading, router]);

  // Dados de fallback para quando a API falha
  const dadosFallback = {
    todos_cargos: [
      'Enfermeiro',
      'Técnico em Enfermagem',
      'Médico',
      'Fisioterapeuta',
      'Nutricionista',
      'Psicólogo',
      'Assistente Social',
      'Farmacêutico',
      'Analista Administrativo',
      'Técnico Administrativo'
    ]
  };

  // Carregar opções de cargos e blocos com fallback robusto
  useEffect(() => {
    const carregarOpcoes = async () => {
      console.log('🔄 Iniciando carregamento de cargos e blocos...');
      
      try {
        const response = await apiService.getCargosEBlocos();
        console.log('📥 Resposta da API getCargosEBlocos:', response);
        
        if (response.success && response.data && response.data.todos_cargos?.length > 0) {
          console.log('✅ Dados carregados com sucesso:', response.data);
          console.log('📋 Cargos disponíveis:', response.data.todos_cargos);
          setCargosOpcoes(response.data.todos_cargos);
        } else {
          console.warn('⚠️ API retornou dados inválidos, usando fallback');
          console.log('🔄 Ativando modo fallback com dados básicos');
          setCargosOpcoes(dadosFallback.todos_cargos);
          
          // Mostrar notificação amigável ao usuário
          if (response.error?.includes('timeout') || response.error?.includes('Timeout')) {
            console.log('⏰ Timeout detectado - usando dados offline');
          }
        }
      } catch (error) {
        console.error('💥 Erro ao carregar opções:', error);
        console.log('🛡️ Ativando modo de recuperação com dados de fallback');
        
        // Sempre usar fallback em caso de erro
        setCargosOpcoes(dadosFallback.todos_cargos);
        
        // Log detalhado do erro
        const errorDetails = {
          message: error.message,
          isTimeout: error.message?.includes('timeout') || error.code === 'ECONNABORTED',
          isNetworkError: error.message?.includes('fetch') || error.message?.includes('network')
        };
        console.log('🔍 Detalhes do erro:', errorDetails);
        
      } finally {
        console.log('🏁 Finalizando carregamento de opções');
        setCarregandoOpcoes(false);
      }
    };

    carregarOpcoes();
  }, []);

  // Dados de fallback para blocos por cargo
  const blocosFallback = {
    'Enfermeiro': ['SUS', 'Enfermagem', 'Saúde Pública', 'Ética Profissional'],
    'Técnico em Enfermagem': ['SUS', 'Técnicas de Enfermagem', 'Saúde Pública'],
    'Médico': ['SUS', 'Medicina Clínica', 'Saúde Pública', 'Ética Médica'],
    'Fisioterapeuta': ['SUS', 'Fisioterapia', 'Reabilitação', 'Anatomia'],
    'Nutricionista': ['SUS', 'Nutrição', 'Saúde Pública', 'Dietética'],
    'Psicólogo': ['SUS', 'Psicologia', 'Saúde Mental', 'Ética Profissional'],
    'Assistente Social': ['SUS', 'Serviço Social', 'Políticas Públicas'],
    'Farmacêutico': ['SUS', 'Farmácia', 'Farmacologia', 'Ética Profissional'],
    'Analista Administrativo': ['Administração Pública', 'Direito Administrativo', 'Gestão'],
    'Técnico Administrativo': ['Administração', 'Atendimento ao Público', 'Informática']
  };

  // Carregar blocos quando cargo for selecionado com fallback
  useEffect(() => {
    const carregarBlocos = async () => {
      if (!formData.cargo) {
        console.log('🚫 Nenhum cargo selecionado, limpando blocos');
        setBlocosOpcoes([]);
        return;
      }

      console.log('🔄 Carregando blocos para o cargo:', formData.cargo);
      
      try {
        const response = await apiService.getBlocosPorCargo(formData.cargo);
        console.log('📥 Resposta da API getBlocosPorCargo:', response);
        
        if (response.success && response.data && response.data.blocos?.length > 0) {
          console.log('✅ Blocos carregados com sucesso:', response.data.blocos);
          setBlocosOpcoes(response.data.blocos);
        } else {
          console.warn('⚠️ API não retornou blocos válidos, usando fallback');
          const blocosFallbackCargo = blocosFallback[formData.cargo] || ['Conhecimentos Gerais'];
          console.log('🔄 Usando blocos de fallback:', blocosFallbackCargo);
          setBlocosOpcoes(blocosFallbackCargo);
        }
      } catch (error) {
        console.error('💥 Erro ao carregar blocos:', error);
        console.log('🛡️ Ativando modo de recuperação para blocos');
        
        // Usar fallback baseado no cargo selecionado
        const blocosFallbackCargo = blocosFallback[formData.cargo] || ['Conhecimentos Gerais'];
        console.log('🔄 Usando blocos de fallback para erro:', blocosFallbackCargo);
        setBlocosOpcoes(blocosFallbackCargo);
        
        // Log detalhado do erro
        const errorDetails = {
          cargo: formData.cargo,
          message: error.message,
          isTimeout: error.message?.includes('timeout') || error.code === 'ECONNABORTED',
          fallbackUsed: blocosFallbackCargo
        };
        console.log('🔍 Detalhes do erro ao carregar blocos:', errorDetails);
      }
    };

    carregarBlocos();
  }, [formData.cargo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('📝 Mudança no formulário:', { campo: name, valor: value });
    
    // Se o cargo mudou, limpar o bloco selecionado
    if (name === 'cargo') {
      console.log('🔄 Cargo alterado, limpando bloco selecionado');
      setFormData(prev => {
        const novoFormData = {
          ...prev,
          [name]: value,
          bloco: '' // Limpar bloco quando cargo muda
        };
        console.log('📊 Estado do formulário após mudança de cargo:', novoFormData);
        return novoFormData;
      });
    } else {
      setFormData(prev => {
        const novoFormData = {
          ...prev,
          [name]: value
        };
        console.log('📊 Estado do formulário atualizado:', { campo: name, novoValor: value });
        return novoFormData;
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      console.log('🧹 Limpando erro do campo:', name);
      setErrors(prev => {
        const novosErros = {
          ...prev,
          [name]: ''
        };
        console.log('📊 Erros após limpeza:', novosErros);
        return novosErros;
      });
    }
  };

  const formatCPF = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Apply CPF mask: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e) => {
    const valorOriginal = e.target.value;
    const formatted = formatCPF(valorOriginal);
    console.log('📱 Formatação CPF:', { original: valorOriginal, formatado: formatted });
    
    setFormData(prev => {
      const novoFormData = {
        ...prev,
        cpf: formatted
      };
      console.log('📊 CPF atualizado no estado:', formatted);
      return novoFormData;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    console.log('Validando formulário - dados atuais:', formData);
    console.log('Campo nomeCompleto:', `"${formData.nomeCompleto}"`);
    console.log('Campo nomeCompleto após trim:', `"${formData.nomeCompleto.trim()}"`);
    console.log('Teste !formData.nomeCompleto.trim():', !formData.nomeCompleto.trim());

    if (!formData.nomeCompleto.trim()) {
      console.log('❌ Campo nomeCompleto falhou na validação');
      newErrors.nomeCompleto = 'Nome completo é obrigatório';
    } else {
      console.log('✅ Campo nomeCompleto passou na validação');
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.cargo.trim()) {
      newErrors.cargo = 'Cargo é obrigatório';
    }

    if (!formData.bloco.trim()) {
      newErrors.bloco = 'Bloco é obrigatório';
    }

    console.log('📋 Resultado da validação:', {
      totalErros: Object.keys(newErrors).length,
      erros: newErrors,
      formularioValido: Object.keys(newErrors).length === 0
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Iniciando processo de cadastro');
    console.log('📊 Dados do formulário antes da validação:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validação falhou, interrompendo cadastro');
      return;
    }

    console.log('✅ Validação passou, iniciando cadastro');
    console.log('⏳ Definindo estado de submissão como true');
    setIsSubmitting(true);
    
    try {
      // 1. Criar conta no Firebase Auth
      console.log('🔥 Criando conta no Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.senha
      );
      
      const firebaseUser = userCredential.user;
      console.log('✅ Conta Firebase criada com sucesso:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
      
      // 2. Atualizar perfil do Firebase com nome
      console.log('👤 Atualizando perfil do Firebase...');
      await updateProfile(firebaseUser, {
        displayName: formData.nomeCompleto
      });
      console.log('✅ Perfil Firebase atualizado com nome:', formData.nomeCompleto);
      
      // 3. Obter token do Firebase
      console.log('🔑 Obtendo token de autenticação...');
      const token = await firebaseUser.getIdToken();
      console.log('✅ Token obtido com sucesso (primeiros 20 chars):', token.substring(0, 20) + '...');
      
      // 4. Preparar dados para envio ao backend
      const dadosCadastro = {
        nome: formData.nomeCompleto, // Backend espera 'nome', não 'nomeCompleto'
        cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        email: formData.email,
        senha: formData.senha,
        cargo: formData.cargo,
        bloco: formData.bloco,
        firebaseUid: firebaseUser.uid
      };

      console.log('🚀 === PAYLOAD SIGNUP ===');
      console.log('📦 Payload:', JSON.stringify(dadosCadastro, null, 2));
      console.log('🔑 Token Firebase:', token);
      console.log('🌐 URL Backend:', 'https://gabarita-ai-backend.onrender.com/api/auth/cadastro');
      console.log('========================');
      
      // 5. Enviar dados para o backend com token de autenticação
      console.log('🌐 Enviando dados para o backend...');
      const response = await apiService.signup(dadosCadastro, token);
      
      console.log('📥 Resposta completa do backend:', response);
      
      if (response.success) {
        console.log('🎉 Cadastro realizado com sucesso no backend!');
        console.log('💾 Salvando token no localStorage...');
        // Salvar token no localStorage
        localStorage.setItem('authToken', token);
        
        console.log('🔄 Redirecionando para painel principal...');
        // Redirecionar para painel principal
        router.push('/painel?message=Cadastro realizado com sucesso!');
      } else {
        console.error('❌ Erro no backend:', response.error);
        console.log('🗑️ Tentando deletar conta Firebase devido ao erro no backend...');
        // Se falhou no backend, deletar conta do Firebase
        try {
          await firebaseUser.delete();
          console.log('✅ Conta Firebase deletada após erro no backend');
        } catch (deleteError) {
          console.error('💥 Erro ao deletar conta Firebase:', deleteError);
        }
        console.log('📝 Definindo erro para exibição ao usuário');
        // Exibir a mensagem exata do backend
        setErrors({ submit: response.error || 'Erro ao criar conta. Tente novamente.' });
      }
    } catch (error) {
      console.error('💥 Erro geral no processo de cadastro:', error);
      console.log('🔍 Analisando tipo de erro...');
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      // Verificar se é erro do Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        console.log('🚫 Erro: E-mail já está em uso');
        errorMessage = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        console.log('🔒 Erro: Senha muito fraca');
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        console.log('📧 Erro: E-mail inválido');
        errorMessage = 'E-mail inválido.';
      } else if (error.response?.data?.erro) {
        console.log('🌐 Erro do backend capturado:', error.response.data.erro);
        // Capturar erro do backend se disponível
        errorMessage = error.response.data.erro;
      } else if (error.message) {
        console.log('⚠️ Erro genérico capturado:', error.message);
        // Capturar mensagem de erro genérica
        errorMessage = error.message;
      } else {
        console.log('❓ Erro desconhecido, usando mensagem padrão');
      }
      
      console.log('📝 Definindo mensagem de erro final:', errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      console.log('🏁 Finalizando processo de cadastro, definindo isSubmitting como false');
      setIsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Image src="/images/logo-oficial.jpg" alt="Gabarit-AI" width={40} height={40} className="mr-3" />
          <span className="text-xl font-bold text-gray-800">Gabarit-AI</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">12 NÍVEL</span>
          <span className="text-sm text-gray-600">8 450 ACERTOS</span>
          <span className="text-sm text-gray-600">73%</span>
          <span className="text-sm font-medium text-blue-600">CNU 2025</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-red-500">⚠️ Sem plano ativo</span>
            <button className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
              Desempenho
            </button>
            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
              Planos
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/images/logo-oficial.jpg" alt="Gabarit-AI" width={60} height={60} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Crie sua conta e comece a estudar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  👤
                </span>
                <input
                  type="text"
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nomeCompleto ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nomeCompleto && (
                <p className="text-red-500 text-sm mt-1">{errors.nomeCompleto}</p>
              )}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📄
                </span>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cpf ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.cpf && (
                <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
              )}
            </div>

            <div>
              <label htmlFor="bloco" className="block text-sm font-medium text-gray-700 mb-1">
                Bloco
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📚
                </span>
                <select
                  id="bloco"
                  name="bloco"
                  value={formData.bloco}
                  onChange={handleInputChange}
                  disabled={!formData.cargo || blocosOpcoes.length === 0}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.bloco ? 'border-red-500' : 'border-gray-300'} ${!formData.cargo || blocosOpcoes.length === 0 ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Selecione um bloco</option>
                  {blocosOpcoes.map((bloco) => (
                    <option key={bloco} value={bloco}>
                      {bloco}
                    </option>
                  ))}
                </select>
              </div>
              {errors.bloco && (
                <p className="text-red-500 text-sm mt-1">{errors.bloco}</p>
              )}
              {!formData.cargo && (
                <p className="text-gray-500 text-sm mt-1">Selecione um cargo primeiro</p>
              )}
            </div>

            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  💼
                </span>
                <select
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleInputChange}
                  disabled={carregandoOpcoes}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cargo ? 'border-red-500' : 'border-gray-300'} ${carregandoOpcoes ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Selecione um cargo</option>
                  {cargosOpcoes.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </div>
              {errors.cargo && (
                <p className="text-red-500 text-sm mt-1">{errors.cargo}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ✉️
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu@email.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder="Sua senha"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.senha ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  placeholder="Confirme sua senha"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.confirmarSenha && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmarSenha}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Fazer Login
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Voltar ao Início
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}