import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseAuth, googleAuthProvider, isFirebaseReady, firebaseDatabaseId } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
  isFirebaseConfigured: boolean;
  databaseId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการสำเร็จ กรุณาลองใหม่อีกครั้ง';
    case 'auth/cancelled-popup-request':
      return 'มีการยกเลิกคำขอเข้าสู่ระบบผ่านหน้าต่างป๊อปอัป';
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้';
    case 'auth/network-request-failed':
      return 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต';
    case 'auth/unauthorized-domain':
      return 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Console Authorized Domains';
    default:
      return `เกิดข้อผิดพลาดในการเข้าสู่ระบบ (${errorCode})`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady || !firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError('ไม่สามารถโหลดสถานะผู้ใช้ได้');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    if (!isFirebaseReady || !firebaseAuth) {
      setError('Firebase ยังไม่ได้กำหนดค่าหรือยังไม่พร้อมใช้งาน');
      return;
    }
    try {
      setLoading(true);
      await signInWithPopup(firebaseAuth, googleAuthProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const code = err?.code || 'unknown';
      setError(getFriendlyAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setError(null);
    if (!firebaseAuth) return;
    try {
      setLoading(true);
      await signOut(firebaseAuth);
    } catch (err: any) {
      console.error('Sign-Out Error:', err);
      setError('เกิดข้อผิดพลาดในการออกจากระบบ');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signOutUser,
        clearError,
        isFirebaseConfigured: isFirebaseReady,
        databaseId: firebaseDatabaseId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
