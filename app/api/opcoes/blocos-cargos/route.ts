import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🚀 API Route /api/opcoes/blocos-cargos chamada!');
  
  try {
    // Fazer proxy para o backend
    const backendUrl = 'http://localhost:5000/api/opcoes/blocos-cargos';
    console.log('📡 Fazendo requisição para:', backendUrl);
    
    const response = await fetch(backendUrl);
    console.log('📡 Response status do backend:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Data recebida do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro na API Route:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}