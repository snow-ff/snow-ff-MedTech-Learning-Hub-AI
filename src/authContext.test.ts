import { describe, it, expect } from 'vitest';
import { getFriendlyAuthErrorMessage } from './context/AuthContext';
import { firebaseServices, isFirebaseReady, firebaseDatabaseId } from './lib/firebase';

describe('AuthContext and Firebase Config Unit Tests', () => {
  it('maps friendly error messages correctly for Thai users', () => {
    expect(getFriendlyAuthErrorMessage('auth/popup-closed-by-user')).toContain('หน้าต่างเข้าสู่ระบบถูกปิด');
    expect(getFriendlyAuthErrorMessage('auth/cancelled-popup-request')).toContain('ยกเลิกคำขอ');
    expect(getFriendlyAuthErrorMessage('auth/popup-blocked')).toContain('เบราว์เซอร์บล็อกหน้าต่าง');
    expect(getFriendlyAuthErrorMessage('auth/unauthorized-domain')).toContain('โดเมนนี้ยังไม่ได้รับอนุญาต');
    expect(getFriendlyAuthErrorMessage('auth/unknown-error')).toContain('เกิดข้อผิดพลาด');
  });

  it('verifies Firebase services and database ID contract', () => {
    expect(isFirebaseReady).toBe(true);
    expect(firebaseDatabaseId).toBe('ai-studio-e2aeb02c-0bf2-4be9-af65-5b9402ff750b');
    expect(firebaseServices.databaseId).toBe('ai-studio-e2aeb02c-0bf2-4be9-af65-5b9402ff750b');
  });
});
