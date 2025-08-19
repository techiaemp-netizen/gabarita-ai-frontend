import axios from 'axios';
import { 
  User, 
  Question, 
  SimulationResult, 
  Performance, 
  Plan, 
  RankingEntry, 
  News, 
  ApiResponse 
} from '@/types';

class ApiService {
  private api: any;

  constructor() {
    // Safe fallback for environment variables during build
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        // Runtime - use environment variables
        return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://gabarita-ai-backend.onrender.com';
      }
      // Build time - use safe fallback
      return 'https://gabarita-ai-backend.onrender.com';
    };

    this.api = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use((config: any) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Interceptor para tratar respostas
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Erro ao verificar status da API' };
    }
  }

  // Autenticação
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/api/auth/login', { email, password });
      const { user, token } = response.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
      }
      return { success: true, data: { user, token } };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  }

  async signup(userData: Partial<User> & { password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/api/auth/signup', userData);
      const { user, token } = response.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
      }
      return { success: true, data: { user, token } };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  // Usuário
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get('/api/user/profile');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao buscar perfil' 
      };
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.put('/api/user/profile', userData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  }

  // Questões e Simulados
  async generateQuestions(params: {
    subject?: string;
    difficulty?: string;
    count?: number;
    bloco?: string;
    cargo?: string;
  }): Promise<ApiResponse<Question[]>> {
    try {
      const response = await this.api.post('/api/questoes/gerar', params);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao gerar questões:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao gerar questões',
        data: []
      };
    }
  }

  async submitSimulation(answers: number[], questionIds: string[]): Promise<ApiResponse<SimulationResult>> {
    try {
      const response = await this.api.post('/api/simulados/submit', { answers, questionIds });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao submeter simulado:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao submeter simulado'
      };
    }
  }

  // Recursos Avançados de Questões
  async getMacetes(questaoId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/api/questoes/macetes/${questaoId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar macetes:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar macetes'
      };
    }
  }

  async getPontosCentrais(questaoId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/api/questoes/pontos-centrais/${questaoId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar pontos centrais:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar pontos centrais'
      };
    }
  }

  async getOutrasExploracoes(questaoId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/api/questoes/outras-exploracoes/${questaoId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar outras explorações:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar outras explorações'
      };
    }
  }

  async chatDuvidas(questaoId: string, usuarioId: string, mensagem: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/api/questoes/chat-duvidas', {
        questao_id: questaoId,
        usuario_id: usuarioId,
        mensagem
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro no chat de dúvidas:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao processar dúvida'
      };
    }
  }

  // Performance
  async getPerformance(): Promise<ApiResponse<Performance>> {
    try {
      const response = await this.api.get('/api/performance');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar performance:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar dados de performance'
      };
    }
  }

  // Planos
  async getPlans(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.api.get('/api/plans');
      
      // Verificar se a resposta tem o formato esperado do backend
      if (response.data && response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      }
      
      // Fallback para formato direto
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar planos do backend:', error);
      return { success: false, error: 'Erro ao carregar planos', data: [] };
    }
  }

  // Ranking
  async getRanking(): Promise<ApiResponse<RankingEntry[]>> {
    try {
      const response = await this.api.get('/api/ranking');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar ranking:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar ranking',
        data: []
      };
    }
  }

  // Notícias
  async getNews(): Promise<ApiResponse<News[]>> {
    try {
      const response = await this.api.get('/api/news');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erro ao buscar notícias:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar notícias',
        data: []
      };
    }
  }

  // Pagamentos
  async createPayment(planId: string): Promise<ApiResponse<{ paymentUrl: string }>> {
    try {
      const response = await this.api.post('/api/pagamentos/criar', { plano: planId });
      return { success: true, data: { paymentUrl: response.data.init_point } };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar pagamento' 
      };
    }
  }

  // Opções de Cargos e Blocos
  async getCargosEBlocos(): Promise<ApiResponse<{ todos_cargos: string[]; todos_blocos: string[]; cargos_blocos: Record<string, string[]> }>> {
    try {
      const response = await this.api.get('/api/opcoes/cargos-blocos');
      if (response.data.sucesso) {
        return { success: true, data: response.data.dados };
      } else {
        return { success: false, error: response.data.erro || 'Erro ao carregar opções' };
      }
    } catch (error: any) {
      console.error('Erro ao carregar cargos e blocos:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar opções de cargos e blocos'
      };
    }
  }

  async getBlocosPorCargo(cargo: string): Promise<ApiResponse<{ cargo: string; blocos: string[] }>> {
    try {
      const response = await this.api.get(`/api/opcoes/blocos/${encodeURIComponent(cargo)}`);
      if (response.data.sucesso) {
        return { success: true, data: response.data.dados };
      } else {
        return { success: false, error: response.data.erro || 'Cargo não encontrado' };
      }
    } catch (error: any) {
      console.error('Erro ao carregar blocos por cargo:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar blocos para o cargo'
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;

