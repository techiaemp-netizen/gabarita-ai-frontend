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

// The configuration values are pulled from environment variables. When
// deploying your own instance of this project you should create a
// `.env.local` file at the root of the project and populate it with
// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar se todas as configurações estão presentes
const requiredConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const missingConfig = Object.entries(requiredConfig)
  .filter(([key, value]) => !value || value.includes('your_'))
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.warn('⚠️ Firebase: Configurações faltando:', missingConfig);
  console.warn('📝 Configure as variáveis de ambiente no arquivo .env');
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
