'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Eye, EyeOff, User, Mail, Lock, CreditCard, Briefcase, Building } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
    cargo: '',
    bloco: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargosOpcoes, setCargosOpcoes] = useState<string[]>([]);
  const [blocosOpcoes, setBlocosOpcoes] = useState<string[]>([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  
  const { signup } = useAuth();
  const router = useRouter();

  // Carregar opções de cargos
  useEffect(() => {
    const carregarOpcoes = async () => {
      try {
        const response = await apiService.getCargosEBlocos();
        
        if (response.success && response.data) {
          setCargosOpcoes(response.data.todos_cargos);
        } else {
          console.error('Erro ao carregar opções:', response.error);
        }
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setCarregandoOpcoes(false);
      }
    };

    carregarOpcoes();
  }, []);

  // Carregar blocos quando cargo for selecionado
  useEffect(() => {
    const carregarBlocos = async () => {
      if (!formData.cargo) {
        setBlocosOpcoes([]);
        return;
      }

      try {
        const response = await apiService.getBlocosPorCargo(formData.cargo);
        
        if (response.success && response.data) {
            setBlocosOpcoes(response.data.blocos);
          } else {
            console.error('Erro ao carregar blocos:', response.error);
          }
      } catch (error) {
        console.error('Erro ao carregar blocos:', error);
        setBlocosOpcoes([]);
      }
    };

    carregarBlocos();
  }, [formData.cargo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Limpar bloco quando cargo mudar
      ...(name === 'cargo' && { bloco: '' })
    }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!formData.cargo) {
      setError('Por favor, selecione um cargo');
      setLoading(false);
      return;
    }

    if (!formData.bloco) {
      setError('Por favor, selecione um bloco');
      setLoading(false);
      return;
    }

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        password: formData.password,
        cargo: formData.cargo,
        bloco: formData.bloco,
        level: 1,
        xp: 0,
        accuracy: 0,
        plan: 'free'
      });
      router.push('/planos');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image 
            src="/images/logo-oficial.jpg" 
            alt="Gabarit-AI" 
            width={80} 
            height={80}
            className="mx-auto rounded-2xl shadow-lg"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-600">Crie sua conta e comece a estudar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nome Completo */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-purple-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-purple-700 mb-2">
                CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-blue-700 mb-2">
                Cargo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="cargo"
                  name="cargo"
                  required
                  value={formData.cargo}
                  onChange={handleSelectChange}
                  disabled={carregandoOpcoes}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Selecione um cargo</option>
                  {cargosOpcoes.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco */}
            <div>
              <label htmlFor="bloco" className="block text-sm font-medium text-indigo-700 mb-2">
                Bloco
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="bloco"
                  name="bloco"
                  required
                  value={formData.bloco}
                  onChange={handleSelectChange}
                  disabled={!formData.cargo || blocosOpcoes.length === 0}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Selecione um bloco</option>
                  {blocosOpcoes.map((bloco) => (
                    <option key={bloco} value={bloco}>
                      {bloco}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-orange-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-red-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-green-700 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Repita sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

