/**
 * Firebase configuration and helpers
 *
 * This module initialises Firebase services using values stored in
 * environment variables. See `.env.example` for the list of required
 * variables. The exported auth and firestore instances can be used
 * throughout the application. A GoogleAuthProvider is also exported
 * for convenience when signing in with Google.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { configManager } from './app';

// Obter configuração do Firebase através do sistema unificado
const firebaseConfig = configManager.getFirebaseConfig();

// Verificar se todas as configurações estão presentes
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredFields.filter(field => 
  !firebaseConfig[field] || 
  firebaseConfig[field].includes('your_') || 
  firebaseConfig[field] === ''
);

if (missingConfig.length > 0 && !configManager.isDevelopment()) {
  console.warn('⚠️ Firebase: Configurações faltando:', missingConfig);
  console.warn('📝 Configure as variáveis de ambiente no arquivo .env.local');
} else if (configManager.isDevelopment()) {
  console.log('🔧 Firebase: Executando em modo desenvolvimento');
}

// Initialise Firebase only once. Reinitialising the app on every import
// would cause errors in a Next.js environment where modules are
// evaluated multiple times.
const app = initializeApp(firebaseConfig);

// Auth and Firestore instances
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, firestore, googleProvider };
