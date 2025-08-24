import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid static optimization
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const debugInfo: any = {
    timestamp,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    },
    logs: []
  };

  const addLog = (level: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    debugInfo.logs.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  };

  addLog('INFO', '🚀 API Route de debug /api/debug/blocos-cargos chamada!');
  addLog('DEBUG', '🔧 Variáveis de ambiente carregadas', debugInfo.environment);
  addLog('DEBUG', '📋 Headers da requisição', debugInfo.request.headers);

  try {
    // Determinar URL do backend com prioridade
    const possibleUrls = [
      process.env.NEXT_PUBLIC_API_URL,
      process.env.NEXT_PUBLIC_API_BASE_URL,
      process.env.NEXT_PUBLIC_BACKEND_URL,
      'https://gabarita-ai-backend.onrender.com'
    ].filter(Boolean);

    addLog('DEBUG', '🔍 URLs possíveis encontradas', possibleUrls);

    const apiBaseUrl = possibleUrls[0] as string;
    const backendUrl = `${apiBaseUrl}/api/opcoes/blocos-cargos`;

    addLog('INFO', '📡 Configuração da requisição', {
      apiBaseUrl,
      backendUrl,
      selectedFromIndex: 0
    });

    const startTime = Date.now();
    
    // Fazer requisição com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Gabarita-AI-Debug/1.0',
          'X-Debug-Source': 'vercel-api-route',
          'X-Debug-Timestamp': timestamp,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
        ok: response.ok
      };

      addLog('INFO', '📡 Resposta do backend recebida', responseInfo);

      if (!response.ok) {
        const errorText = await response.text();
        addLog('ERROR', '❌ Erro do backend', { errorText, ...responseInfo });
        
        return NextResponse.json({
          success: false,
          error: 'Backend error',
          debug: debugInfo,
          backendError: {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          }
        }, { status: response.status });
      }

      const data = await response.json();
      
      const dataInfo = {
        sucesso: data.sucesso,
        temDados: !!data.dados,
        numBlocos: data.dados?.todos_blocos?.length || 0,
        numCargos: data.dados?.todos_cargos?.length || 0,
        primeirosBlocos: data.dados?.todos_blocos?.slice(0, 3) || [],
        primeirosCargos: data.dados?.todos_cargos?.slice(0, 3) || []
      };

      addLog('SUCCESS', '✅ Dados recebidos com sucesso', dataInfo);
      addLog('INFO', '🏁 API Route de debug finalizada com sucesso');

      return NextResponse.json({
        success: true,
        data,
        debug: debugInfo,
        performance: {
          duration: `${duration}ms`,
          timestamp
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    const errorInfo = {
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'N/A',
      isAbortError: error instanceof Error && error.name === 'AbortError',
      isTimeoutError: error instanceof Error && error.message.includes('timeout')
    };

    addLog('ERROR', '💥 Erro crítico na API Route', errorInfo);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: debugInfo,
      errorDetails: errorInfo
    }, { status: 500 });
  }
}