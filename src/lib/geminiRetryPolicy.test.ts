import { describe, it, expect } from 'vitest';
import {
  classifyGeminiError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  formatRetryLog
} from './geminiRetryPolicy';

describe('Gemini Retry Policy & Resilience (Track v1.2)', () => {
  describe('1. Error Classification (Transient vs Non-Transient)', () => {
    it('should classify HTTP 503 UNAVAILABLE as retryable transient error', () => {
      const err = new Error('503 Service Unavailable: The model is overloaded. Please try again later.');
      (err as any).status = 503;

      const classification = classifyGeminiError(err);
      expect(classification.shouldRetry).toBe(true);
      expect(classification.isTransient).toBe(true);
      expect(classification.status).toBe(503);
      expect(classification.reason).toBe('transient_service_unavailable');
    });

    it('should classify string UNAVAILABLE / overloaded without explicit status as 503 retryable', () => {
      const err = { message: 'UNAVAILABLE: The model is temporarily overloaded' };
      const classification = classifyGeminiError(err);
      expect(classification.shouldRetry).toBe(true);
      expect(classification.isTransient).toBe(true);
      expect(classification.status).toBe(503);
      expect(classification.reason).toBe('transient_service_unavailable');
    });

    it('should classify 500, 502, and 504 server errors as retryable', () => {
      for (const code of [500, 502, 504]) {
        const err = { status: code, message: `Server error ${code}` };
        const classification = classifyGeminiError(err);
        expect(classification.shouldRetry).toBe(true);
        expect(classification.isTransient).toBe(true);
        expect(classification.status).toBe(code);
        expect(classification.reason).toBe('transient_service_unavailable');
      }
    });

    it('should classify 408 and timeout/network drops as retryable', () => {
      const timeoutErr = new Error('408 Request Timeout');
      expect(classifyGeminiError(timeoutErr).shouldRetry).toBe(true);

      const abortErr = new Error('This operation was aborted (AbortError)');
      expect(classifyGeminiError(abortErr).shouldRetry).toBe(true);

      const fetchErr = new Error('fetch failed: TypeError: fetch failed');
      expect(classifyGeminiError(fetchErr).shouldRetry).toBe(true);

      const socketErr = new Error('read ECONNRESET');
      expect(classifyGeminiError(socketErr).shouldRetry).toBe(true);
    });

    it('should classify temporary rate limit 429 as retryable', () => {
      const rateLimitErr = { status: 429, message: 'Too many requests, please slow down' };
      const classification = classifyGeminiError(rateLimitErr);
      expect(classification.shouldRetry).toBe(true);
      expect(classification.status).toBe(429);
      expect(classification.reason).toBe('transient_rate_limit');
    });

    it('should NOT retry permanent 400 Bad Request or invalid configuration', () => {
      const badReq = { status: 400, message: 'Invalid argument: thinkingBudget not supported' };
      const classification = classifyGeminiError(badReq);
      expect(classification.shouldRetry).toBe(false);
      expect(classification.isTransient).toBe(false);
      expect(classification.status).toBe(400);
      expect(classification.reason).toBe('client_error');
    });

    it('should NOT retry 401 Unauthorized or 403 Forbidden', () => {
      const unauth = { status: 401, message: 'Unauthorized API key' };
      expect(classifyGeminiError(unauth).shouldRetry).toBe(false);

      const forbidden = { status: 403, message: 'PERMISSION_DENIED: User has no permission' };
      expect(classifyGeminiError(forbidden).shouldRetry).toBe(false);
    });

    it('should NOT retry permanent quota exhaustion (free tier request exhaustion)', () => {
      const quotaErr = {
        status: 429,
        message: 'Resource has been exhausted (e.g. check quota): generate_content_free_tier_requests'
      };
      const classification = classifyGeminiError(quotaErr);
      expect(classification.shouldRetry).toBe(false);
      expect(classification.isTransient).toBe(false);
      expect(classification.reason).toBe('quota_or_credential_exhausted');
    });
  });

  describe('2. Exponential Backoff & Jitter Calculation', () => {
    it('should calculate bounded exponential backoff with jitter', () => {
      const mockRandom0 = () => 0;
      const mockRandom1 = () => 1;

      // Attempt 1: baseDelayMs * 1.5^0 = 600ms
      const delayMin1 = calculateRetryDelay(1, DEFAULT_RETRY_CONFIG, mockRandom0);
      const delayMax1 = calculateRetryDelay(1, DEFAULT_RETRY_CONFIG, mockRandom1);
      expect(delayMin1).toBe(600);
      expect(delayMax1).toBe(600 + 250); // 850ms

      // Attempt 2: baseDelayMs * 1.5^1 = 900ms
      const delayMin2 = calculateRetryDelay(2, DEFAULT_RETRY_CONFIG, mockRandom0);
      const delayMax2 = calculateRetryDelay(2, DEFAULT_RETRY_CONFIG, mockRandom1);
      expect(delayMin2).toBe(900);
      expect(delayMax2).toBe(900 + 250); // 1150ms
    });

    it('should have default maxAttempts set to 2 to prevent slow 15-20s waiting', () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(2);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBeLessThanOrEqual(800);
    });
  });

  describe('3. Execution Simulations', () => {
    it('should simulate 503 transient failure with 1 retry then academic fallback', async () => {
      let callCount = 0;
      const simulatedGemini = async () => {
        callCount++;
        const err = new Error('503 UNAVAILABLE: The model is overloaded.');
        (err as any).status = 503;
        throw err;
      };

      const recordedDelays: number[] = [];
      let attempt = 0;
      let finalOutcome = 'UNKNOWN';
      const maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          await simulatedGemini();
          finalOutcome = 'SUCCESS';
          break;
        } catch (err: any) {
          const classification = classifyGeminiError(err);
          if (!classification.shouldRetry || attempt >= maxAttempts) {
            finalOutcome = 'FALLBACK_ACADEMIC';
            break;
          }
          const delay = calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG);
          recordedDelays.push(delay);
          // Wait simulated delay without blocking test
        }
      }

      expect(callCount).toBe(2); // Exactly 2 attempts (1 initial + 1 retry)
      expect(recordedDelays.length).toBe(1); // Exactly 1 retry delay calculated
      expect(recordedDelays[0]).toBeGreaterThanOrEqual(600);
      expect(recordedDelays[0]).toBeLessThanOrEqual(850);
      expect(finalOutcome).toBe('FALLBACK_ACADEMIC');
    });

    it('should simulate 400 Bad Request stopping immediately on attempt 1 without retry', async () => {
      let callCount = 0;
      const simulatedGemini = async () => {
        callCount++;
        const err = new Error('400 Bad Request: Invalid argument');
        (err as any).status = 400;
        throw err;
      };

      let attempt = 0;
      let finalOutcome = 'UNKNOWN';
      const maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          await simulatedGemini();
          finalOutcome = 'SUCCESS';
          break;
        } catch (err: any) {
          const classification = classifyGeminiError(err);
          if (!classification.shouldRetry || attempt >= maxAttempts) {
            finalOutcome = 'FALLBACK_ACADEMIC';
            break;
          }
        }
      }

      expect(callCount).toBe(1); // Stopped immediately at attempt 1!
      expect(finalOutcome).toBe('FALLBACK_ACADEMIC');
    });
  });

  describe('4. Structured Telemetry Logging', () => {
    it('should format clean log without exposing sensitive tokens', () => {
      const logMessage = formatRetryLog({
        requestId: 'req-test-123',
        attempt: 1,
        maxAttempts: 2,
        apiDurationMs: 4961,
        retryDelayMs: 650,
        status: 503,
        reason: 'transient_service_unavailable',
        finalOutcome: 'RETRYING',
        totalBackendDurationMs: 5611
      });

      expect(logMessage).toContain('[Req req-test-123]');
      expect(logMessage).toContain('attempt: 1/2');
      expect(logMessage).toContain('apiDuration: 4961ms');
      expect(logMessage).toContain('retryDelay: 650ms');
      expect(logMessage).toContain('status: 503');
      expect(logMessage).toContain('finalOutcome: RETRYING');
      expect(logMessage).toContain('totalBackendDuration: 5611ms');
      expect(logMessage).not.toContain('AIzaSy'); // No API keys
    });
  });
});
