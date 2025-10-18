/**
 * Firebase Client Configuration
 * Initializes Firebase SDK for client-side authentication and Firestore access
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
);

// Initialize Firebase app
let app = null;
let auth = null;
let db = null;

if (missingVars.length > 0) {
  console.info(
    'ℹ️ Firebase not configured - running in guest mode only.',
    '\nMissing variables:',
    missingVars.join(', ')
  );
  console.info(
    'To enable authentication, add Firebase credentials to your .env file.'
  );
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Optional: Connect to Firebase Emulators for local development
    // Uncomment these lines if you want to use Firebase Emulators
    // if (import.meta.env.DEV) {
    //   connectAuthEmulator(auth, 'http://localhost:9099');
    //   connectFirestoreEmulator(db, 'localhost', 8080);
    // }

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.info('Running in guest mode only.');
    // Don't throw - allow app to continue without Firebase
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };
