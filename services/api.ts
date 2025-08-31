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
import { configManager, apiConfig } from '@/config/app';

// Interface para o Circuit Breaker
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

// Interface para Cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Interface para configuração de retry
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

class ApiService {
  private api: any;
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private loadingStates: Map<string, Promise<any>> = new Map();
  
  // Configurações do sistema robusto
  private readonly CIRCUIT_BREAKER_THRESHOLD = apiConfig.circuitBreakerThreshold;
  private readonly CIRCUIT_BREAKER_TIMEOUT = apiConfig.circuitBreakerTimeout;
  private readonly DEFAULT_CACHE_TTL = apiConfig.cacheDefaultTtl;
  
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: apiConfig.retryAttempts,
    baseDelay: apiConfig.retryDelay,
    maxDelay: apiConfig.maxRetryDelay,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT']
  };

  constructor() {
    const baseURL = configManager.getApiBaseUrl();
    
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: configManager.getApiTimeout(),
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use((config: any) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        console.log('🔍 DEBUG: Token from localStorage:', token);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔍 DEBUG: Authorization header set:', config.headers.Authorization);
        }
      }
      return config;
    });

    // Interceptor para tratar respostas
    this.api.interceptors.response.use(
      (response: any) => {
        // Registrar sucesso no circuit breaker
        this.recordSuccess(response.config.url);
        return response;
      },
      async (error: any) => {
        // Registrar falha no circuit breaker
        this.recordFailure(error.config?.url, error);
        
        const originalRequest = error.config;
        
        // Se receber 401 e não for uma tentativa de refresh, tentar renovar token
        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
          originalRequest._retry = true;
          
          // Não tentar renovar se for a própria rota de refresh ou login
          if (originalRequest.url?.includes('/refresh-token') || originalRequest.url?.includes('/login')) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          try {
            const refreshResponse = await this.api.post('/api/auth/refresh-token');
            if (refreshResponse.data.success && refreshResponse.data.data) {
              const { token } = refreshResponse.data.data;
              localStorage.setItem('authToken', token);
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
    
    // Limpeza periódica do cache
    this.startCacheCleanup();
  }
  
  // Sistema de Circuit Breaker
  private getCircuitBreakerState(endpoint: string): CircuitBreakerState {
    if (!this.circuitBreaker.has(endpoint)) {
      this.circuitBreaker.set(endpoint, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
      });
    }
    return this.circuitBreaker.get(endpoint)!;
  }
  
  private recordSuccess(endpoint: string): void {
    const state = this.getCircuitBreakerState(endpoint);
    state.failures = 0;
    state.state = 'CLOSED';
  }
  
  private recordFailure(endpoint: string, error: any): void {
    const state = this.getCircuitBreakerState(endpoint);
    state.failures++;
    state.lastFailureTime = Date.now();
    
    if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'OPEN';
      console.warn(`🚨 Circuit Breaker ABERTO para ${endpoint} após ${state.failures} falhas`);
    }
  }
  
  private canMakeRequest(endpoint: string): boolean {
    const state = this.getCircuitBreakerState(endpoint);
    
    if (state.state === 'CLOSED') {
      return true;
    }
    
    if (state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - state.lastFailureTime;
      if (timeSinceLastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        state.state = 'HALF_OPEN';
        console.log(`🔄 Circuit Breaker MEIO-ABERTO para ${endpoint}`);
        return true;
      }
      return false;
    }
    
    // HALF_OPEN: permite uma tentativa
    return true;
  }
  
  // Sistema de Cache Inteligente
  private getCacheKey(method: string, url: string, params?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }
  
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Limpeza a cada minuto
  }
  
  // Sistema de Deduplicação de Requisições
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.loadingStates.has(key)) {
      console.log(`🔄 Reutilizando requisição em andamento: ${key}`);
      return this.loadingStates.get(key)!;
    }
    
    const promise = requestFn().finally(() => {
      this.loadingStates.delete(key);
    });
    
    this.loadingStates.set(key, promise);
    return promise;
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/api/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Erro ao verificar status da API' };
    }
  }

  // Autenticação
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/api/auth/login', { email, password });
      
      // O backend agora retorna { success: boolean, data: { user: User, token: string } }
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        return { success: true, data: { user, token } };
      } else {
        return {
          success: false,
          error: response.data.error || 'Erro ao fazer login'
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  }

  async signup(userData: Partial<User> & { password: string }, firebaseToken?: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const config = firebaseToken ? {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`
        }
      } : {};
      
      // Mapear campos do frontend para o backend
      const backendData = {
        ...userData,
        nome: userData.name || userData.nome, // Mapear 'name' para 'nome'
        senha: userData.password // Mapear 'password' para 'senha'
      };
      
      // Remover campos do frontend que não são necessários no backend
      delete (backendData as any).name;
        delete (backendData as any).password;
      
      const response = await this.api.post('/api/auth/cadastro', backendData, config);
      console.log('Resposta bruta do backend:', response.data);
      
      // O backend retorna { sucesso: true, token: string, usuario: User }
      const { sucesso, token, usuario } = response.data;
      
      if (sucesso && token && usuario) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        return { success: true, data: { user: usuario, token } };
      } else {
        return { success: false, error: 'Resposta inválida do servidor' };
      }
    } catch (error: any) {
      console.error('Erro na API signup:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.erro || 'Erro ao criar conta' 
      };
    }
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  async refreshToken(): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/api/auth/refresh-token');
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        return { success: true, data: { user, token } };
      } else {
        return {
          success: false,
          error: response.data.error || 'Erro ao renovar token'
        };
      }
    } catch (error: any) {
      // Se falhar ao renovar token, fazer logout
      await this.logout();
      return {
        success: false,
        error: error.response?.data?.error || 'Token expirado. Faça login novamente.'
      };
    }
  }

  async verifyToken(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.post('/api/auth/verificar-token');
      
      if (response.data.sucesso && response.data.usuario) {
        return { success: true, data: response.data.usuario };
      } else {
        return {
          success: false,
          error: response.data.erro || 'Token inválido'
        };
      }
    } catch (error: any) {
      // Se token for inválido, fazer logout
      await this.logout();
      return {
        success: false,
        error: error.response?.data?.erro || 'Token inválido. Faça login novamente.'
      };
    }
  }

  // Usuário
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get('/api/usuarios/perfil');
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
      const response = await this.api.put('/api/usuarios/perfil', userData);
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
      console.log('🎯 Gerando questões com parâmetros:', params);
      
      // Obter usuário logado
      const user = this.getCurrentUser();
      console.log('🔍 DEBUG generateQuestions: user obtido:', user);
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Incluir usuario_id nos parâmetros
      const requestData = {
        ...params,
        usuario_id: user.id
      };
      
      console.log('🔍 DEBUG generateQuestions: requestData completo:', requestData);
      console.log('🔍 DEBUG generateQuestions: usuario_id específico:', requestData.usuario_id);
      
      const responseData = await this.robustRequest<Question[]>('POST', '/api/questoes/gerar', {
        data: requestData,
        useCache: false, // Questões sempre devem ser frescas
        retryConfig: {
          maxRetries: 4,
          maxDelay: 20000, // Geração de questões pode demorar
          retryableErrors: ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT']
        }
      });
      
      console.log('✅ Questões geradas com sucesso');
      return { success: true, data: responseData };
    } catch (error: any) {
      console.error('❌ Erro ao gerar questões:', error);
      
      // Tratamento específico para geração de questões
      if (error.message?.includes('Circuit breaker aberto')) {
        return {
          success: false,
          error: 'Sistema de geração temporariamente sobrecarregado. Tente novamente em alguns minutos.',
          data: []
        };
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'A geração está demorando mais que o esperado. Tente com menos questões ou tente novamente.',
          data: []
        };
      }
      
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
      console.log('📋 Carregando planos disponíveis...');
      
      const responseData = await this.robustRequest<any>('GET', '/api/planos', {
        useCache: true,
        cacheTtl: 900000, // 15 minutos para planos
        retryConfig: {
          maxRetries: 3,
          maxDelay: 8000
        }
      });
      
      // Verificar se a resposta tem o formato esperado do backend
      if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success && responseData.data) {
        console.log('✅ Planos carregados:', responseData.data);
        return { success: true, data: responseData.data };
      }
      
      // Fallback para formato direto (array de planos)
      if (Array.isArray(responseData)) {
        console.log('✅ Planos carregados:', responseData);
        return { success: true, data: responseData };
      }
      
      // Fallback para objeto com dados
      console.log('✅ Planos carregados:', responseData);
      return { success: true, data: responseData || [] };
    } catch (error: any) {
      console.error('❌ Erro ao carregar planos:', error);
      
      // Fallback para planos
      if (error.message?.includes('Circuit breaker aberto')) {
        return {
          success: false,
          error: 'Serviço de planos temporariamente indisponível.',
          data: []
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Erro ao carregar planos',
        data: []
      };
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
      const response = await this.api.get('/api/noticias');
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

  // Método para obter usuário atual
  getCurrentUser(): { uid: string; email: string; id: string } | null {
    if (typeof window === 'undefined') {
      console.log('🔍 DEBUG getCurrentUser: window undefined (SSR)');
      return null;
    }
    
    try {
      const userData = localStorage.getItem('user');
      console.log('🔍 DEBUG getCurrentUser: userData from localStorage:', userData);
      
      if (userData) {
        const user = JSON.parse(userData);
        console.log('🔍 DEBUG getCurrentUser: parsed user:', user);
        const result = {
          uid: user.id || user.uid,
          id: user.id || user.uid,
          email: user.email
        };
        console.log('🔍 DEBUG getCurrentUser: returning:', result);
        return result;
      }
      console.log('🔍 DEBUG getCurrentUser: no userData found, returning null');
      return null;
    } catch (error) {
      console.error('🔍 DEBUG getCurrentUser: error parsing userData:', error);
      return null;
    }
  }

  // Planos - Assinatura direta
  async subscribePlan(planId: string, paymentMethod: string = 'pix'): Promise<ApiResponse<any>> {
    try {
      console.log('📋 Assinando plano:', planId, 'com método:', paymentMethod);
      
      const response = await this.api.post('/api/planos/subscribe', {
        tipo_plano: planId,
        metodo_pagamento: paymentMethod
      });
      
      console.log('✅ Plano assinado com sucesso:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Erro ao assinar plano:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.erro || 'Erro ao assinar plano'
      };
    }
  }

  // Pagamentos
  async createPayment(planId: string): Promise<ApiResponse<{ paymentUrl: string }>> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await this.api.post('/api/pagamentos/criar-preferencia', { 
        plano: planId,
        userId: user.uid,
        userEmail: user.email
      });
      return { success: true, data: { paymentUrl: response.data.init_point } };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar pagamento'
      };
    }
  }

  // Método auxiliar para retry automático
  private async retryRequest<T>(
    requestFn: () => Promise<T>, 
    endpoint: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;
    let delay = retryConfig.baseDelay;
    
    // Verificar circuit breaker antes de tentar
    if (!this.canMakeRequest(endpoint)) {
      throw new Error(`Circuit breaker aberto para ${endpoint}. Tente novamente mais tarde.`);
    }
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${retryConfig.maxRetries} para ${endpoint}`);
        const result = await requestFn();
        console.log(`✅ Sucesso na tentativa ${attempt} para ${endpoint}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Falha na tentativa ${attempt} para ${endpoint}:`, error.message);
        
        // Verificar se o erro é recuperável
        const isRetryable = this.isRetryableError(error, retryConfig.retryableErrors);
        
        if (attempt < retryConfig.maxRetries && isRetryable) {
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
        } else if (!isRetryable) {
          console.warn(`🚫 Erro não recuperável, interrompendo tentativas: ${error.message}`);
          break;
        }
      }
    }
    
    throw lastError;
  }
  
  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    // Verificar códigos de erro recuperáveis
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Verificar status HTTP recuperáveis
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error.response?.status && retryableStatuses.includes(error.response.status)) {
      return true;
    }
    
    // Verificar mensagens de erro específicas
    const errorMessage = error.message?.toLowerCase() || '';
    const retryableMessages = ['timeout', 'network error', 'connection', 'econnreset'];
    
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  // Opções de Cargos e Blocos com retry e fallback
  // Método robusto para requisições com cache e deduplicação
  private async robustRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: {
      data?: any;
      params?: any;
      useCache?: boolean;
      cacheTtl?: number;
      retryConfig?: Partial<RetryConfig>;
    } = {}
  ): Promise<T> {
    const { data, params, useCache = false, cacheTtl, retryConfig } = options;
    
    // Gerar chave para cache e deduplicação
    const cacheKey = this.getCacheKey(method, url, { data, params });
    
    // Verificar cache se habilitado
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        console.log(`💾 Dados encontrados no cache para ${url}`);
        return cached;
      }
    }
    
    // Deduplicar requisições idênticas
    return this.deduplicateRequest(cacheKey, async () => {
      const response = await this.retryRequest(
        async () => {
          switch (method) {
            case 'GET':
              return await this.api.get(url, { params });
            case 'POST':
              return await this.api.post(url, data, { params });
            case 'PUT':
              return await this.api.put(url, data, { params });
            case 'DELETE':
              return await this.api.delete(url, { params });
            default:
              throw new Error(`Método HTTP não suportado: ${method}`);
          }
        },
        url,
        retryConfig
      );
      
      // Armazenar no cache se habilitado
      if (useCache && response.data) {
        this.setCache(cacheKey, response.data, cacheTtl);
      }
      
      return response.data;
    });
  }

  async getCargosEBlocos(): Promise<ApiResponse<{ todos_cargos: string[]; todos_blocos: string[]; cargos_blocos: Record<string, string[]> }>> {
    console.log('🚀 Iniciando getCargosEBlocos com sistema robusto...');
    
    try {
      const responseData = await this.robustRequest<any>('GET', '/api/opcoes/blocos-cargos', {
        useCache: true,
        cacheTtl: 600000, // 10 minutos para dados de configuração
        retryConfig: {
          maxRetries: 5, // Mais tentativas para dados críticos
          maxDelay: 15000
        }
      });
      
      console.log('📥 Resposta recebida com sucesso');
      console.log('📋 Dados da resposta:', responseData);
      
      // O backend retorna { dados: {...} } diretamente
      if (responseData && responseData.dados) {
        console.log('✅ Dados válidos encontrados');
        console.log('📊 Total de cargos:', responseData.dados.todos_cargos?.length || 0);
        console.log('📊 Total de blocos:', responseData.dados.todos_blocos?.length || 0);
        return { success: true, data: responseData.dados };
      } else {
        console.error('❌ Estrutura de dados inválida:', responseData);
        return { success: false, error: 'Dados não encontrados na resposta' };
      }
    } catch (error: any) {
      console.error('💥 Erro final ao carregar cargos e blocos:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Fallback inteligente baseado no tipo de erro
      return this.handleCargosEBlocosError(error);
    }
  }
  
  private handleCargosEBlocosError(error: any): ApiResponse<any> {
    // Circuit breaker aberto
    if (error.message?.includes('Circuit breaker aberto')) {
      return {
        success: false,
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
        data: {
          todos_cargos: ['Serviço indisponível'],
          todos_blocos: ['Serviço indisponível'],
          cargos_blocos: {}
        }
      };
    }
    
    // Timeout ou problemas de conexão
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        success: false,
        error: 'Conexão lenta. Dados sendo carregados...',
        data: {
          todos_cargos: ['Carregando...'],
          todos_blocos: ['Carregando...'],
          cargos_blocos: {}
        }
      };
    }
    
    // Erro do servidor
    if (error.response?.status >= 500) {
      return {
        success: false,
        error: 'Problema no servidor. Tente novamente em alguns instantes.',
        data: {
          todos_cargos: ['Erro no servidor'],
          todos_blocos: ['Erro no servidor'],
          cargos_blocos: {}
        }
      };
    }
    
    // Erro genérico
     return { 
       success: false, 
       error: error.response?.data?.message || error.message || 'Erro ao carregar opções de cargos e blocos'
     };
   }
   
   // Métodos de monitoramento e diagnóstico
   public getSystemHealth(): {
     circuitBreakers: Record<string, CircuitBreakerState>;
     cacheStats: { size: number; entries: string[] };
     activeRequests: number;
   } {
     const circuitBreakers: Record<string, CircuitBreakerState> = {};
     for (const [endpoint, state] of this.circuitBreaker.entries()) {
       circuitBreakers[endpoint] = { ...state };
     }
     
     const cacheEntries = Array.from(this.cache.keys());
     
     return {
       circuitBreakers,
       cacheStats: {
         size: this.cache.size,
         entries: cacheEntries
       },
       activeRequests: this.loadingStates.size
     };
   }
   
   public clearCache(pattern?: string): void {
     if (!pattern) {
       this.cache.clear();
       console.log('🧹 Cache completamente limpo');
       return;
     }
     
     let cleared = 0;
     for (const key of this.cache.keys()) {
       if (key.includes(pattern)) {
         this.cache.delete(key);
         cleared++;
       }
     }
     console.log(`🧹 ${cleared} entradas do cache removidas (padrão: ${pattern})`);
   }
   
   public resetCircuitBreaker(endpoint?: string): void {
     if (!endpoint) {
       this.circuitBreaker.clear();
       console.log('🔄 Todos os circuit breakers resetados');
       return;
     }
     
     if (this.circuitBreaker.has(endpoint)) {
       this.circuitBreaker.set(endpoint, {
         failures: 0,
         lastFailureTime: 0,
         state: 'CLOSED'
       });
       console.log(`🔄 Circuit breaker resetado para ${endpoint}`);
     }
   }
   
   // Método para pré-carregar dados críticos
   public async preloadCriticalData(): Promise<void> {
     console.log('🚀 Pré-carregando dados críticos...');
     
     const criticalEndpoints = [
       () => this.getCargosEBlocos(),
       () => this.getPlans()
     ];
     
     const results = await Promise.allSettled(
       criticalEndpoints.map(fn => fn())
     );
     
     const successful = results.filter(r => r.status === 'fulfilled').length;
     console.log(`✅ ${successful}/${results.length} dados críticos pré-carregados`);
   }

  async getBlocosPorCargo(cargo: string): Promise<ApiResponse<{ cargo: string; blocos: string[] }>> {
    try {
      const response = await this.api.get(`/api/opcoes/blocos/${encodeURIComponent(cargo)}`);
      // O backend retorna { dados: {...} } diretamente
      if (response.data && response.data.dados) {
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

  // Novos métodos para ordem invertida (blocos primeiro)
  async getBlocosCargos(): Promise<ApiResponse<{ blocos_cargos: Record<string, string[]>; todos_blocos: string[]; todos_cargos: string[] }>> {
    try {
      const response = await this.api.get('/api/opcoes/blocos-cargos');
      console.log('🔍 Resposta bruta da API:', response.data);
      if (response.data && response.data.dados) {
        return { success: true, data: response.data.dados };
      } else {
        return { success: false, error: 'Dados não encontrados na resposta' };
      }
    } catch (error: any) {
      console.error('Erro ao carregar blocos e cargos:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar opções de blocos e cargos'
      };
    }
  }

  async getCargosPorBloco(bloco: string): Promise<ApiResponse<{ bloco: string; cargos: string[] }>> {
    try {
      const response = await this.api.get(`/api/opcoes/cargos/${encodeURIComponent(bloco)}`);
      if (response.data && response.data.dados) {
        return { success: true, data: response.data.dados };
      } else {
        return { success: false, error: response.data.erro || 'Bloco não encontrado' };
      }
    } catch (error: any) {
      console.error('Erro ao carregar cargos por bloco:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar cargos para o bloco'
      };
    }
  }

  // Método para buscar matérias por cargo e bloco
  async getMateriasPorCargoBloco(cargo: string, bloco: string): Promise<ApiResponse<any[]>> {
    try {
      console.log(`🔍 Buscando matérias para cargo: ${cargo}, bloco: ${bloco}`);
      const response = await this.api.get(`/api/questoes/materias/${encodeURIComponent(cargo)}/${encodeURIComponent(bloco)}`);
      
      if (response.data && response.data.sucesso) {
        console.log('✅ Matérias carregadas:', response.data.materias_performance || response.data.materias);
        return { 
          success: true, 
          data: response.data.materias_performance || response.data.materias || [] 
        };
      } else {
        console.warn('⚠️ Resposta sem dados de matérias:', response.data);
        return { success: false, error: response.data.erro || 'Matérias não encontradas' };
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar matérias por cargo e bloco:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar matérias'
      };
    }
  }

  // Métodos para verificação de planos e acesso
  async getUserPlan(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/planos/usuario');
      if (response.data && response.data.sucesso) {
        return { success: true, data: response.data.plano };
      } else {
        return { success: false, error: response.data.erro || 'Plano não encontrado' };
      }
    } catch (error: any) {
      console.error('Erro ao carregar plano do usuário:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao carregar plano do usuário'
      };
    }
  }

  async checkResourceAccess(resource: string): Promise<ApiResponse<{ tem_acesso: boolean }>> {
    try {
      const response = await this.api.post('/planos/verificar-acesso', { recurso: resource });
      if (response.data && response.data.sucesso) {
        return { success: true, data: { tem_acesso: response.data.tem_acesso } };
      } else {
        return { success: false, error: response.data.erro || 'Erro ao verificar acesso' };
      }
    } catch (error: any) {
      console.error('Erro ao verificar acesso ao recurso:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao verificar acesso'
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;

