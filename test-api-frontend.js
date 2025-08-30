// Teste simples da API no frontend
// Execute este arquivo no console do navegador

const testAPI = async () => {
  console.log('🚀 Testando API do frontend...');
  
  const baseURL = 'http://localhost:5000';
  const endpoint = '/api/questoes/gerar';
  const url = baseURL + endpoint;
  
  const payload = {
    subject: 'Enfermagem Geral',
    difficulty: 'medio',
    count: 5,
    bloco: 'Bloco 5 - Educação, Saúde, Desenvolvimento Social e Direitos Humanos',
    cargo: 'Enfermeiro',
    usuario_id: 'test-user-frontend'
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer fake-token-for-development'
  };
  
  console.log('📡 URL:', url);
  console.log('📦 Payload:', payload);
  console.log('🔑 Headers:', headers);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

// Execute a função
testAPI();

console.log('\n🔧 Para executar novamente, digite: testAPI()');