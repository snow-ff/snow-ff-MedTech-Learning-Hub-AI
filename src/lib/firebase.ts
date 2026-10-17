import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseConfig = {
  projectId: 'fresh-unfolding-dt3g1',
  appId: '1:136481418394:web:2f47176a3237f6ea978323',
  apiKey: 'AIzaSyArIKOplSEV0NeY85cGV7lZKymZEk5OSF8',
  authDomain: 'fresh-unfolding-dt3g1.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-e2aeb02c-0bf2-4be9-af65-5b9402ff750b',
  storageBucket: 'fresh-unfolding-dt3g1.firebasestorage.app',
  messagingSenderId: '136481418394',
  measurementId: '',
};

// Initialize Firebase App
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const firebaseAuth = getAuth(firebaseApp);

// Initialize Firestore with databaseId if specified
export const firebaseDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export const isFirebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const firebaseDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const firebaseServices = {
  auth: Boolean(firebaseAuth),
  firestore: Boolean(firebaseDb),
  databaseId: firebaseDatabaseId,
};
