'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

interface BlocosCargosData {
  blocos_cargos: Record<string, string[]>;
  todos_blocos: string[];
  todos_cargos: string[];
}

interface ApiResponse {
  sucesso: boolean;
  dados?: BlocosCargosData;
  erro?: string;
}

export default function OpcoesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BlocosCargosData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    const testIntegration = async () => {
      addLog('🚀 Iniciando teste de integração frontend-backend');
      
      try {
        // Teste 1: Verificar variáveis de ambiente
        addLog('📋 Verificando variáveis de ambiente...');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gabarita-ai-backend.onrender.com';
        addLog(`🔗 URL da API: ${apiUrl}`);
        
        // Teste 2: Fazer requisição para a API route local
        addLog('🔄 Testando API route local...');
        const localResponse = await fetch('/api/opcoes/blocos-cargos');
        addLog(`📡 Status da API route local: ${localResponse.status}`);
        
        if (!localResponse.ok) {
          const errorText = await localResponse.text();
          addLog(`❌ Erro na API route local: ${errorText}`);
          throw new Error(`Erro na API route: ${localResponse.status}`);
        }
        
        const localData = await localResponse.json();
        addLog(`✅ Resposta da API route local: ${JSON.stringify(localData).substring(0, 200)}...`);
        
        // Teste 3: Fazer requisição direta para o backend
        addLog('🔄 Testando requisição direta ao backend...');
        const backendUrl = `${apiUrl}/api/opcoes/blocos-cargos`;
        addLog(`🎯 URL do backend: ${backendUrl}`);
        
        const backendResponse = await fetch(backendUrl);
        addLog(`📡 Status do backend: ${backendResponse.status}`);
        
        if (!backendResponse.ok) {
          const errorText = await backendResponse.text();
          addLog(`❌ Erro no backend: ${errorText}`);
        } else {
          const backendData = await backendResponse.json();
          addLog(`✅ Resposta do backend: ${JSON.stringify(backendData).substring(0, 200)}...`);
        }
        
        // Usar dados da API route local se disponível
        if (localData.sucesso && localData.dados) {
          setData(localData.dados);
          addLog(`🎉 Dados carregados com sucesso! ${localData.dados.todos_blocos.length} blocos e ${localData.dados.todos_cargos.length} cargos`);
        } else {
          throw new Error(localData.erro || 'Dados não encontrados');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        addLog(`💥 Erro durante o teste: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
        addLog('🏁 Teste de integração finalizado');
      }
    };

    testIntegration();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
          <Link 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Teste de Integração - Blocos e Cargos
          </h1>
          <p className="text-gray-600">
            Página de teste para verificar a integração completa entre frontend e backend
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Status da Integração</h2>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Testando integração...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">❌ Erro na Integração</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}
          
          {data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-medium">✅ Integração Funcionando</h3>
              <p className="text-green-600 mt-1">
                Carregados {data.todos_blocos.length} blocos e {data.todos_cargos.length} cargos
              </p>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📝 Logs Detalhados</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Dados */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Blocos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">📚 Blocos Disponíveis ({data.todos_blocos.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.todos_blocos.map((bloco, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-blue-800 font-medium">{bloco}</span>
                    {data.blocos_cargos[bloco] && (
                      <div className="text-sm text-blue-600 mt-1">
                        {data.blocos_cargos[bloco].length} cargo(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cargos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">💼 Cargos Disponíveis ({data.todos_cargos.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.todos_cargos.map((cargo, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <span className="text-green-800 font-medium">{cargo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mapeamento Blocos-Cargos */}
        {data && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">🔗 Mapeamento Blocos → Cargos</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(data.blocos_cargos).map(([bloco, cargos]) => (
                <div key={bloco} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{bloco}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cargos.map((cargo, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navegação */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}