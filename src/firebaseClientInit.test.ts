import { describe, it, expect } from 'vitest';
import { firebaseConfig, isFirebaseReady, firebaseDatabaseId, firebaseServices } from './lib/firebase';

describe('Firebase Client Initialization Test', () => {
  it('loads configuration correctly', () => {
    expect(firebaseConfig.projectId).toBe('fresh-unfolding-dt3g1');
    expect(firebaseConfig.apiKey).toBe('AIzaSyArIKOplSEV0NeY85cGV7lZKymZEk5OSF8');
    expect(firebaseConfig.authDomain).toBe('fresh-unfolding-dt3g1.firebaseapp.com');
  });

  it('reports correct database ID and readiness', () => {
    expect(isFirebaseReady).toBe(true);
    expect(firebaseDatabaseId).toBe('ai-studio-e2aeb02c-0bf2-4be9-af65-5b9402ff750b');
    expect(firebaseServices.auth).toBe(true);
    expect(firebaseServices.firestore).toBe(true);
  });
});
