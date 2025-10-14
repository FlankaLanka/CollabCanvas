// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Check if Firebase environment variables are available
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

const hasFirebaseConfig = missingVars.length === 0;

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

let app = null;
let auth = null;
let db = null;
let rtdb = null;

if (hasFirebaseConfig) {
  // Initialize Firebase only if config is complete
  console.log('✅ Firebase configuration found, initializing...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // For persistent canvas state
  rtdb = getDatabase(app); // For cursors and presence
  
  console.log('🔥 Firebase services initialized:');
  console.log('  - Auth:', !!auth);
  console.log('  - Firestore:', !!db);
  console.log('  - Realtime DB:', !!rtdb);
  console.log('  - Database URL:', import.meta.env.VITE_FIREBASE_DATABASE_URL);
  
  if (!import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    console.error('❌ VITE_FIREBASE_DATABASE_URL is missing! User presence will not work.');
    console.log('💡 Add this to your .env file: VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/');
  }

  // Enable emulators in development
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
      console.log('🔧 Connected to Firebase Emulators');
    } catch (error) {
      console.warn('Could not connect to Firebase Emulators:', error);
    }
  }
} else {
  // Development mode without Firebase
  console.warn('⚠️ Firebase environment variables not found.');
  console.warn('Running in local development mode without Firebase.');
  console.warn('Missing variables:', missingVars);
  console.log('🎨 Canvas functionality will work, but authentication and real-time features are disabled.');
}

// Export services (may be null in development mode)
export { auth, db, rtdb, hasFirebaseConfig };
export default app;