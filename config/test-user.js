// Configuração do usuário de teste
export const TEST_USER = {
  email: 'teste@gabaritai.com',
  password: '123456',
  nome: 'Usuario Teste',
  cargo: 'Analista Judiciario',
  bloco: 'Bloco 6 - Controle e Fiscalizacao',
  token: 'hIJZL98tF1QN0Mk4LjJRCD6ijy92'
};

// Função para fazer login automático do usuário de teste
export const loginTestUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        senha: TEST_USER.password
      })
    });
    
    const data = await response.json();
    
    if (data.sucesso) {
      // Salvar token no localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.usuario));
      
      console.log('✅ Login de teste realizado com sucesso:', data.usuario);
      return data;
    } else {
      console.error('❌ Erro no login de teste:', data.erro);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição de login:', error);
    return null;
  }
};

// Função para verificar se o usuário está logado
export const isLoggedIn = () => {
  return localStorage.getItem('authToken') !== null;
};

// Função para obter dados do usuário logado
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};