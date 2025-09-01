import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid static optimization
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`\n🚀 [${timestamp}] API Route /api/opcoes/blocos-cargos chamada!`);
  
  // Debug completo das variáveis de ambiente
  console.log('🔧 === VARIÁVEIS DE AMBIENTE ===');
  console.log('🔧 NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('🔧 NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
  console.log('🔧 NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('🔧 VERCEL_URL:', process.env.VERCEL_URL);
  
  // Debug dos headers da requisição
  console.log('📋 === HEADERS DA REQUISIÇÃO ===');
  const headers = Object.fromEntries(request.headers.entries());
  console.log('📋 Headers:', JSON.stringify(headers, null, 2));
  console.log('📋 User-Agent:', request.headers.get('user-agent'));
  console.log('📋 Host:', request.headers.get('host'));
  console.log('📋 Origin:', request.headers.get('origin'));
  
  try {
    // Usar variáveis de ambiente com fallback
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 
                      process.env.NEXT_PUBLIC_API_BASE_URL || 
                      process.env.NEXT_PUBLIC_BACKEND_URL || 
                      'https://gabarita-ai-backend.onrender.com';
    
    const backendUrl = `${apiBaseUrl}/api/opcoes/cargos-blocos`;
    
    console.log('📡 === CONFIGURAÇÃO DA REQUISIÇÃO ===');
    console.log('📡 API Base URL utilizada:', apiBaseUrl);
    console.log('📡 URL completa do backend:', backendUrl);
    console.log('📡 Fazendo requisição para o backend...');
    
    const startTime = Date.now();
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Gabarita-AI-Frontend/1.0',
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('📡 === RESPOSTA DO BACKEND ===');
    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);
    console.log('📡 Tempo de resposta:', `${duration}ms`);
    console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do backend:', errorText);
      throw new Error(`Backend error: ${response.status} - ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📦 === DADOS RECEBIDOS ===');
    console.log('📦 Sucesso:', data.sucesso);
    console.log('📦 Número de blocos:', data.dados?.todos_blocos?.length || 0);
    console.log('📦 Número de cargos:', data.dados?.todos_cargos?.length || 0);
    console.log('📦 Primeiros 3 blocos:', data.dados?.todos_blocos?.slice(0, 3));
    console.log('📦 Primeiros 3 cargos:', data.dados?.todos_cargos?.slice(0, 3));
    
    console.log(`✅ [${new Date().toISOString()}] API Route finalizada com sucesso!\n`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ === ERRO NA API ROUTE ===');
    console.error('❌ Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error(`❌ [${new Date().toISOString()}] API Route finalizada com erro!\n`);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}