/**
 * Configuração unificada da aplicação
 * 
 * Este arquivo centraliza todas as configurações do frontend,
 * incluindo URLs de API, timeouts, configurações de ambiente, etc.
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxRetryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  cacheDefaultTtl: number;
}

export interface AppEnvironment {
  name: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AppConfig {
  environment: AppEnvironment;
  api: ApiConfig;
  firebase: FirebaseConfig;
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugMode: boolean;
    enableMockData: boolean;
  };
  ui: {
    defaultLanguage: 'pt-BR' | 'en-US';
    theme: 'light' | 'dark' | 'auto';
    enableAnimations: boolean;
    pageSize: number;
  };
  cache: {
    enableServiceWorker: boolean;
    enableLocalStorage: boolean;
    enableSessionStorage: boolean;
    maxCacheSize: number;
  };
  security: {
    enableCSRF: boolean;
    enableXSS: boolean;
    tokenRefreshThreshold: number; // em minutos
    maxLoginAttempts: number;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): AppConfig {
    // Detectar ambiente
    const environment = this.detectEnvironment();
    
    // Configuração da API baseada no ambiente
    const apiConfig = this.getApiConfig(environment);
    
    // Configuração do Firebase
    const firebaseConfig = this.getFirebaseConfig();
    
    return {
      environment,
      api: apiConfig,
      firebase: firebaseConfig,
      features: {
        enableAnalytics: environment.isProduction,
        enableErrorReporting: environment.isProduction || environment.isStaging,
        enablePerformanceMonitoring: environment.isProduction,
        enableDebugMode: environment.isDevelopment,
        enableMockData: environment.isDevelopment && this.getEnvVar('NEXT_PUBLIC_ENABLE_MOCK_DATA') === 'true'
      },
      ui: {
        defaultLanguage: 'pt-BR',
        theme: 'light',
        enableAnimations: true,
        pageSize: parseInt(this.getEnvVar('NEXT_PUBLIC_PAGE_SIZE', '20'))
      },
      cache: {
        enableServiceWorker: environment.isProduction,
        enableLocalStorage: true,
        enableSessionStorage: true,
        maxCacheSize: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_CACHE_SIZE', '50')) // MB
      },
      security: {
        enableCSRF: environment.isProduction,
        enableXSS: true,
        tokenRefreshThreshold: parseInt(this.getEnvVar('NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD', '5')),
        maxLoginAttempts: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS', '5'))
      }
    };
  }

  private detectEnvironment(): AppEnvironment {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const vercelEnv = process.env.VERCEL_ENV;
    const customEnv = process.env.NEXT_PUBLIC_APP_ENV;
    
    let envName: 'development' | 'staging' | 'production';
    
    if (customEnv) {
      envName = customEnv as 'development' | 'staging' | 'production';
    } else if (vercelEnv === 'production') {
      envName = 'production';
    } else if (vercelEnv === 'preview') {
      envName = 'staging';
    } else if (nodeEnv === 'production') {
      envName = 'production';
    } else {
      envName = 'development';
    }

    return {
      name: envName,
      isDevelopment: envName === 'development',
      isProduction: envName === 'production',
      isStaging: envName === 'staging'
    };
  }

  private getApiConfig(environment: AppEnvironment): ApiConfig {
    // URLs baseadas no ambiente
    let baseUrl: string;
    
    if (environment.isDevelopment) {
      baseUrl = this.getEnvVar('NEXT_PUBLIC_API_BASE_URL') ||
                this.getEnvVar('NEXT_PUBLIC_API_URL') ||
                'http://localhost:5000';
    } else if (environment.isStaging) {
      baseUrl = this.getEnvVar('NEXT_PUBLIC_API_BASE_URL') ||
                this.getEnvVar('NEXT_PUBLIC_API_URL') ||
                'https://gabarita-ai-backend-staging.onrender.com';
    } else {
      baseUrl = this.getEnvVar('NEXT_PUBLIC_API_BASE_URL') ||
                this.getEnvVar('NEXT_PUBLIC_API_URL') ||
                'https://gabarita-ai-backend.onrender.com';
    }

    return {
      baseUrl,
      timeout: parseInt(this.getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '30000')),
      retryAttempts: parseInt(this.getEnvVar('NEXT_PUBLIC_API_RETRY_ATTEMPTS', '3')),
      retryDelay: parseInt(this.getEnvVar('NEXT_PUBLIC_API_RETRY_DELAY', '1000')),
      maxRetryDelay: parseInt(this.getEnvVar('NEXT_PUBLIC_API_MAX_RETRY_DELAY', '10000')),
      circuitBreakerThreshold: parseInt(this.getEnvVar('NEXT_PUBLIC_CIRCUIT_BREAKER_THRESHOLD', '5')),
      circuitBreakerTimeout: parseInt(this.getEnvVar('NEXT_PUBLIC_CIRCUIT_BREAKER_TIMEOUT', '60000')),
      cacheDefaultTtl: parseInt(this.getEnvVar('NEXT_PUBLIC_CACHE_DEFAULT_TTL', '300000'))
    };
  }

  private getFirebaseConfig(): FirebaseConfig {
    return {
      apiKey: this.getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', ''),
      authDomain: this.getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
      projectId: this.getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', ''),
      storageBucket: this.getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
      messagingSenderId: this.getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
      appId: this.getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', ''),
      measurementId: this.getEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')
    };
  }

  private getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value !== undefined) {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  // Métodos públicos para acessar configurações
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getApiConfig(): ApiConfig {
    return { ...this.config.api };
  }

  public getEnvironment(): AppEnvironment {
    return { ...this.config.environment };
  }

  public getFirebaseConfig(): FirebaseConfig {
    return { ...this.config.firebase };
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getApiBaseUrl(): string {
    return this.config.api.baseUrl;
  }

  public getApiTimeout(): number {
    return this.config.api.timeout;
  }

  public isDevelopment(): boolean {
    return this.config.environment.isDevelopment;
  }

  public isProduction(): boolean {
    return this.config.environment.isProduction;
  }

  public isStaging(): boolean {
    return this.config.environment.isStaging;
  }

  // Método para atualizar configurações dinamicamente (se necessário)
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Método para validar configurações
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.api.baseUrl) {
      errors.push('API Base URL is required');
    }

    if (this.config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0');
    }

    if (this.config.api.retryAttempts < 0) {
      errors.push('API retry attempts must be non-negative');
    }

    // Validar configuração do Firebase apenas se não estiver em desenvolvimento
    if (!this.config.environment.isDevelopment) {
      if (!this.config.firebase.apiKey) {
        errors.push('Firebase API Key is required for non-development environments');
      }
      if (!this.config.firebase.projectId) {
        errors.push('Firebase Project ID is required for non-development environments');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Método para debug - mostrar configuração atual
  public debugConfig(): void {
    if (this.config.environment.isDevelopment) {
      console.group('🔧 App Configuration');
      console.log('Environment:', this.config.environment.name);
      console.log('API Base URL:', this.config.api.baseUrl);
      console.log('Features:', this.config.features);
      console.log('Full Config:', this.config);
      console.groupEnd();
    }
  }
}

// Instância singleton
const configManager = ConfigManager.getInstance();

// Exportar configurações para uso direto
export const appConfig = configManager.getConfig();
export const apiConfig = configManager.getApiConfig();
export const environment = configManager.getEnvironment();
export const firebaseConfig = configManager.getFirebaseConfig();

// Exportar funções utilitárias
export const getApiBaseUrl = () => configManager.getApiBaseUrl();
export const getApiTimeout = () => configManager.getApiTimeout();
export const isDevelopment = () => configManager.isDevelopment();
export const isProduction = () => configManager.isProduction();
export const isStaging = () => configManager.isStaging();
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => configManager.isFeatureEnabled(feature);

// Exportar o manager para casos avançados
export { configManager };

// Validar configuração na inicialização
if (typeof window !== 'undefined') {
  const validation = configManager.validateConfig();
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:', validation.errors);
  } else if (configManager.isDevelopment()) {
    configManager.debugConfig();
  }
}

export default configManager;