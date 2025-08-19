// Tipos e interfaces para o Gabarita AI

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  cargo?: string;
  bloco?: string;
  level: number;
  xp: number;
  accuracy: number;
  plan: 'free' | 'premium' | 'pro';
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  source: string;
}

export interface SimulationResult {
  id: string;
  userId: string;
  questions: Question[];
  answers: number[];
  score: number;
  accuracy: number;
  timeSpent: number;
  completedAt: string;
}

export interface Performance {
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  subjectPerformance: {
    [subject: string]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
  weeklyProgress: {
    week: string;
    questionsAnswered: number;
    accuracy: number;
  }[];
  monthlyProgress: {
    month: string;
    questionsAnswered: number;
    accuracy: number;
  }[];
}

export interface Plan {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  periodo: string;
  duracao: string;
  recursos: string[];
  tipo: string;
  popular: boolean;
}

export interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  level: number;
  xp: number;
  accuracy: number;
  questionsAnswered: number;
}

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  category: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

