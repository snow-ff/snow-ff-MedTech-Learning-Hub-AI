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

    it('should classify RESOURCE_EXHAUSTED with case-insensitive Rate Limit as retryable transient_rate_limit', () => {
      const cases = [
        'RESOURCE_EXHAUSTED: Rate Limit Exceeded',
        'RESOURCE_EXHAUSTED: rate limit exceeded',
        'RESOURCE_EXHAUSTED: RATE LIMIT',
        'Resource has been exhausted: Rate-Limit exceeded'
      ];

      for (const msg of cases) {
        const classification = classifyGeminiError({ message: msg });
        expect(classification.shouldRetry).toBe(true);
        expect(classification.isTransient).toBe(true);
        expect(classification.status).toBe(429);
        expect(classification.reason).toBe('transient_rate_limit');
      }
    });

    it('should classify co-occurrence of generate_content_free_tier_requests AND Rate Limit (various casings) as retryable transient_rate_limit', () => {
      const coOccurrenceCases = [
        'Resource has been exhausted (e.g. check quota): generate_content_free_tier_requests per minute rate limit exceeded',
        'Resource has been exhausted: generate_content_free_tier_requests Rate Limit exceeded',
        'Resource has been exhausted: generate_content_free_tier_requests RATE_LIMIT',
        'Resource has been exhausted: generate_content_free_tier_requests Rate-Limit reached',
        'generate_content_free_tier_requests: Requests per minute limit exceeded'
      ];

      for (const msg of coOccurrenceCases) {
        const classification = classifyGeminiError({ message: msg });
        expect(classification.shouldRetry).toBe(true);
        expect(classification.isTransient).toBe(true);
        expect(classification.status).toBe(429);
        expect(classification.reason).toBe('transient_rate_limit');
      }
    });

    it('should classify generate_content_free_tier_requests with daily quota or without rate limit as non-retryable quota exhaustion', () => {
      const dailyOrStandaloneCases = [
        'Resource has been exhausted (e.g. check quota): generate_content_free_tier_requests',
        'Quota exceeded for quota metric generate_content_free_tier_requests and limit Requests per day',
        'generate_content_free_tier_requests: daily quota reached'
      ];

      for (const msg of dailyOrStandaloneCases) {
        const classification = classifyGeminiError({ message: msg });
        expect(classification.shouldRetry).toBe(false);
        expect(classification.isTransient).toBe(false);
        expect(classification.status).toBe(429);
        expect(classification.reason).toBe('quota_or_credential_exhausted');
      }
    });

    it('should NOT treat help URLs containing rate-limits as a rate limit keyword when quota is exhausted', () => {
      const liveGoogleQuotaError = {
        status: 429,
        message: 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit.'
      };

      const classification = classifyGeminiError(liveGoogleQuotaError);
      expect(classification.shouldRetry).toBe(false);
      expect(classification.isTransient).toBe(false);
      expect(classification.status).toBe(429);
      expect(classification.reason).toBe('quota_or_credential_exhausted');
    });

    it('should prioritize structured reason and status before text search', () => {
      // 1. Structured RATE_LIMIT_EXCEEDED over conflicting text containing Quota
      const structuredRateLimit = {
        status: 429,
        errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }],
        message: 'Quota exceeded for metric generate_content_free_tier_requests'
      };
      const res1 = classifyGeminiError(structuredRateLimit);
      expect(res1.shouldRetry).toBe(true);
      expect(res1.reason).toBe('transient_rate_limit');

      // 2. Structured QUOTA_EXCEEDED over conflicting text containing Rate Limit
      const structuredQuota = {
        status: 429,
        errorDetails: [{ reason: 'QUOTA_EXCEEDED' }],
        message: 'Rate limit encountered on endpoint'
      };
      const res2 = classifyGeminiError(structuredQuota);
      expect(res2.shouldRetry).toBe(false);
      expect(res2.reason).toBe('quota_or_credential_exhausted');

      // 3. Structured INVALID_ARGUMENT
      const structuredBadArg = {
        error: { status: 'INVALID_ARGUMENT' },
        message: 'Bad argument provided'
      };
      const res3 = classifyGeminiError(structuredBadArg);
      expect(res3.shouldRetry).toBe(false);
      expect(res3.status).toBe(400);
      expect(res3.reason).toBe('client_error');

      // 4. Structured PERMISSION_DENIED
      const structuredPerm = {
        error: { status: 'PERMISSION_DENIED' },
        message: 'Forbidden call'
      };
      const res4 = classifyGeminiError(structuredPerm);
      expect(res4.shouldRetry).toBe(false);
      expect(res4.status).toBe(403);
      expect(res4.reason).toBe('client_error');
    });

    it('should resolve specific 5xx status from message when status property is absent', () => {
      expect(classifyGeminiError({ message: '500 Internal Server Error' }).status).toBe(500);
      expect(classifyGeminiError({ message: '502 Bad Gateway' }).status).toBe(502);
      expect(classifyGeminiError({ message: '504 Gateway Timeout' }).status).toBe(504);
      expect(classifyGeminiError({ message: '503 Service Unavailable' }).status).toBe(503);
    });

    it('should resolve client error status from message strings', () => {
      expect(classifyGeminiError({ message: 'INVALID_ARGUMENT: Bad parameter' }).status).toBe(400);
      expect(classifyGeminiError({ message: 'API_KEY_INVALID: Key expired' }).status).toBe(401);
      expect(classifyGeminiError({ message: 'PERMISSION_DENIED: Access forbidden' }).status).toBe(403);
      expect(classifyGeminiError({ message: 'NOT_FOUND: Resource missing' }).status).toBe(404);
    });

    // Targeted Edge Case 1: String err.code with HTTP status in err.message
    it('should safely extract numeric status from message when err.code is a string token', () => {
      const errWithCodeString503 = {
        code: 'RESOURCE_EXHAUSTED',
        message: '503 Service Unavailable: The model is temporarily overloaded'
      };
      const res503 = classifyGeminiError(errWithCodeString503);
      expect(res503.status).toBe(503);
      expect(Number.isNaN(res503.status)).toBe(false);
      expect(res503.shouldRetry).toBe(true);
      expect(res503.reason).toBe('transient_service_unavailable');

      const errWithCodeString429 = {
        code: 'RESOURCE_EXHAUSTED',
        message: '429 Too Many Requests: Rate limit exceeded, please retry later'
      };
      const res429 = classifyGeminiError(errWithCodeString429);
      expect(res429.status).toBe(429);
      expect(Number.isNaN(res429.status)).toBe(false);
      expect(res429.shouldRetry).toBe(true);
      expect(res429.reason).toBe('transient_rate_limit');
    });

    // Targeted Edge Case 2: HTTP Status Priority over Conflicting Message Keywords
    it('should maintain HTTP 5xx transient semantics even if message mentions quota', () => {
      const err503WithQuotaText = {
        status: 503,
        message: '503 Service Unavailable: backend overloaded while checking quota metrics'
      };
      const res1 = classifyGeminiError(err503WithQuotaText);
      expect(res1.shouldRetry).toBe(true);
      expect(res1.status).toBe(503);
      expect(res1.reason).toBe('transient_service_unavailable');

      const err500WithQuotaText = {
        status: 500,
        message: 'Internal error during daily quota evaluation'
      };
      const res2 = classifyGeminiError(err500WithQuotaText);
      expect(res2.shouldRetry).toBe(true);
      expect(res2.status).toBe(500);
      expect(res2.reason).toBe('transient_service_unavailable');

      const err400WithQuotaText = {
        status: 400,
        message: 'Invalid argument: invalid quota group parameter provided'
      };
      const res3 = classifyGeminiError(err400WithQuotaText);
      expect(res3.shouldRetry).toBe(false);
      expect(res3.status).toBe(400);
      expect(res3.reason).toBe('client_error');
    });

    // Targeted Edge Case 3: Multiple entries in errorDetails or details array
    it('should scan all items in errorDetails/details array to find recognized semantic reasons', () => {
      // Multiple items with Help doc first, RATE_LIMIT_EXCEEDED second
      const multiDetailsRateLimit = {
        status: 429,
        errorDetails: [
          { '@type': 'type.googleapis.com/google.rpc.Help', links: [{ description: 'Docs', url: 'https://ai.google.dev' }] },
          { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'RATE_LIMIT_EXCEEDED', domain: 'googleapis.com' }
        ],
        message: 'Quota exceeded for metric'
      };
      const res1 = classifyGeminiError(multiDetailsRateLimit);
      expect(res1.shouldRetry).toBe(true);
      expect(res1.status).toBe(429);
      expect(res1.reason).toBe('transient_rate_limit');

      // Multiple items with Metadata first, QUOTA_EXCEEDED second
      const multiDetailsQuota = {
        status: 429,
        error: {
          details: [
            { metadata: { service: 'generativelanguage.googleapis.com' } },
            { reason: 'QUOTA_EXCEEDED' }
          ]
        },
        message: 'Rate limit encountered on endpoint'
      };
      const res2 = classifyGeminiError(multiDetailsQuota);
      expect(res2.shouldRetry).toBe(false);
      expect(res2.status).toBe(429);
      expect(res2.reason).toBe('quota_or_credential_exhausted');

      // Multiple items with Help doc first, API_KEY_INVALID second
      const multiDetailsAuth = {
        errorDetails: [
          { info: 'context data' },
          { reason: 'API_KEY_INVALID' }
        ],
        message: 'API call failed'
      };
      const res3 = classifyGeminiError(multiDetailsAuth);
      expect(res3.shouldRetry).toBe(false);
      expect(res3.status).toBe(401);
      expect(res3.reason).toBe('client_error');
    });

    // Acceptance Criteria: Candidate status independence and message number isolation
    it('should independently evaluate candidate status and not misinterpret loose numbers in message', () => {
      // 1. Non-numeric code does not block inspection of statusCode
      const errWithUnparseableCode = {
        code: 'RESOURCE_EXHAUSTED',
        statusCode: 503,
        message: 'Backend server failure'
      };
      const res1 = classifyGeminiError(errWithUnparseableCode);
      expect(res1.status).toBe(503);
      expect(res1.reason).toBe('transient_service_unavailable');

      // 2. String 3-digit status is parsed safely
      const errWithStringStatus = {
        status: '429',
        message: 'Rate limit exceeded'
      };
      const res2 = classifyGeminiError(errWithStringStatus);
      expect(res2.status).toBe(429);
      expect(res2.reason).toBe('transient_rate_limit');

      // 3. Loose number in message (without HTTP/status pattern) is NOT interpreted as HTTP status
      const errWithLooseNumber = {
        message: 'Processed 500 patient records successfully before encountering generic problem'
      };
      const res3 = classifyGeminiError(errWithLooseNumber);
      // Should NOT assume 500 server error just because 500 was in the sentence
      expect(res3.status).toBeUndefined();
      expect(res3.shouldRetry).toBe(false);
      expect(res3.reason).toBe('unclassified_non_transient');
    });

    // Acceptance Criteria: Empty errorDetails array does not shadow errorObj.details, and unknown err.reason does not shadow known reason
    it('should not allow empty errorDetails to discard details, and unknown err.reason must not shadow known reason', () => {
      // Empty err.errorDetails [] must not shadow errorObj.details
      const errWithEmptyErrorDetails = {
        errorDetails: [],
        error: {
          details: [{ reason: 'RATE_LIMIT_EXCEEDED' }]
        },
        message: 'API error occurred'
      };
      const res1 = classifyGeminiError(errWithEmptyErrorDetails);
      expect(res1.status).toBe(429);
      expect(res1.reason).toBe('transient_rate_limit');
      expect(res1.shouldRetry).toBe(true);

      // Unknown err.reason must NOT shadow RATE_LIMIT_EXCEEDED in details
      const errWithUnknownReason = {
        reason: 'CUSTOM_UNEXPECTED_STRING',
        errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }],
        message: 'Temporary rate limit'
      };
      const res2 = classifyGeminiError(errWithUnknownReason);
      expect(res2.status).toBe(429);
      expect(res2.reason).toBe('transient_rate_limit');
      expect(res2.shouldRetry).toBe(true);

      // Unknown err.reason must NOT shadow QUOTA_EXCEEDED in details
      const errWithUnknownReasonQuota = {
        reason: 'SOME_INTERNAL_DEBUG_FLAG',
        errorDetails: [{ reason: 'QUOTA_EXCEEDED' }],
        message: 'Quota reached'
      };
      const res3 = classifyGeminiError(errWithUnknownReasonQuota);
      expect(res3.status).toBe(429);
      expect(res3.reason).toBe('quota_or_credential_exhausted');
      expect(res3.shouldRetry).toBe(false);
    });

    // Targeted Remediation A & B: Structured Reason Conflict Resolution & Auth Precedence
    it('should resolve conflicting structured reasons with clear source authority and security precedence', () => {
      // 1. Primary errorDetails takes precedence over generic details
      const errWithSourceConflict = {
        errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }],
        details: [{ reason: 'QUOTA_EXCEEDED' }],
        status: 429,
        message: 'Mixed signals'
      };
      const res1 = classifyGeminiError(errWithSourceConflict);
      expect(res1.reason).toBe('transient_rate_limit');
      expect(res1.shouldRetry).toBe(true);

      // 2. Authentication/Permission has absolute precedence even if conflicting with status 429 or RATE_LIMIT_EXCEEDED
      const errWithAuthConflict = {
        status: 429, // Upstream returned 429, but structured reason states API_KEY_INVALID
        errorDetails: [{ reason: 'API_KEY_INVALID' }, { reason: 'RATE_LIMIT_EXCEEDED' }],
        message: 'API key is expired or invalid'
      };
      const res2 = classifyGeminiError(errWithAuthConflict);
      expect(res2.reason).toBe('client_error');
      expect(res2.status).toBe(429); // Preserves authentic detected status without synthetic tampering
      expect(res2.shouldRetry).toBe(false); // MUST NOT retry an invalid API key!

      // 3. Irreconcilable conflict between RATE_LIMIT_EXCEEDED and QUOTA_EXCEEDED falls back safely to non-retryable
      const errWithTieConflict = {
        status: 429,
        errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }, { reason: 'QUOTA_EXCEEDED' }],
        message: 'Unknown capacity conflict'
      };
      const res3 = classifyGeminiError(errWithTieConflict);
      expect(res3.reason).toBe('quota_or_credential_exhausted');
      expect(res3.shouldRetry).toBe(false); // Fail-safe: do not retry blindly on conflicting evidence
    });

    // Targeted Remediation C: Network / Timeout Matching Consistency & URL Isolation
    it('should match network/timeouts accurately without false positives from URLs', () => {
      // 1. URL containing timeout must NOT trigger transient timeout classification
      const errWithUrlTimeout = {
        message: 'Generic error with help link: https://ai.google.dev/docs/timeout-troubleshooting'
      };
      const res1 = classifyGeminiError(errWithUrlTimeout);
      expect(res1.shouldRetry).toBe(false);
      expect(res1.reason).toBe('unclassified_non_transient');

      // 2. Legitimate deadline exceeded or socket abort triggers transient timeout
      const errWithDeadline = {
        message: 'DEADLINE_EXCEEDED: The upstream operation deadline exceeded'
      };
      const res2 = classifyGeminiError(errWithDeadline);
      expect(res2.shouldRetry).toBe(true);
      expect(res2.reason).toBe('transient_timeout_or_network');

      const errWithSocketDrop = {
        message: 'read ECONNRESET on socket connect'
      };
      const res3 = classifyGeminiError(errWithSocketDrop);
      expect(res3.shouldRetry).toBe(true);
      expect(res3.reason).toBe('transient_timeout_or_network');
    });

    // Final Targeted Fix: Container Integrity & Authentic Status Preservation
    it('should aggregate reasons across err.errorDetails, errorObj.errorDetails, errorObj.details, and err.details without ternary dropping', () => {
      // Both err.errorDetails AND errorObj.errorDetails are present with different reasons
      const multiSourceError = {
        errorDetails: [{ reason: 'UNKNOWN_DIAGNOSTIC' }],
        error: {
          errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }]
        },
        message: 'API issue'
      };
      const res1 = classifyGeminiError(multiSourceError);
      expect(res1.reason).toBe('transient_rate_limit');
      expect(res1.shouldRetry).toBe(true);

      // Both errorObj.details AND err.details are present without being shadowed
      const multiGenericDetails = {
        details: [{ reason: 'UNKNOWN_NOTE' }],
        error: {
          details: [{ reason: 'QUOTA_EXCEEDED' }]
        },
        status: 429,
        message: 'Usage problem'
      };
      const res2 = classifyGeminiError(multiGenericDetails);
      expect(res2.reason).toBe('quota_or_credential_exhausted');
      expect(res2.shouldRetry).toBe(false);
    });

    it('should preserve authentic HTTP status for non-standard 5xx and cross combinations without tampering', () => {
      // 1. QUOTA_EXCEEDED together with HTTP 503 preserves 503 status
      const quotaWith503 = {
        status: 503,
        errorDetails: [{ reason: 'QUOTA_EXCEEDED' }],
        message: 'Backend unavailable while checking quota'
      };
      const resQuota503 = classifyGeminiError(quotaWith503);
      expect(resQuota503.status).toBe(503);
      expect(resQuota503.reason).toBe('quota_or_credential_exhausted');
      expect(resQuota503.shouldRetry).toBe(false);

      // 2. Non-standard 5xx (e.g. HTTP 529 or 521) is recognized as transient_service_unavailable with genuine status
      const nonStandard5xx = {
        status: 529,
        message: 'Site is overloaded'
      };
      const res529 = classifyGeminiError(nonStandard5xx);
      expect(res529.status).toBe(529);
      expect(res529.reason).toBe('transient_service_unavailable');
      expect(res529.shouldRetry).toBe(true);

      const nonStandard521 = {
        status: 521,
        message: 'Web server is down'
      };
      const res521 = classifyGeminiError(nonStandard521);
      expect(res521.status).toBe(521);
      expect(res521.reason).toBe('transient_service_unavailable');
      expect(res521.shouldRetry).toBe(true);

      // 3. Fallback default status 401/403 when no HTTP status exists
      const authWithoutStatus = {
        errorDetails: [{ reason: 'API_KEY_INVALID' }],
        message: 'Expired key'
      };
      const resAuth = classifyGeminiError(authWithoutStatus);
      expect(resAuth.status).toBe(401);
      expect(resAuth.reason).toBe('client_error');

      // 4. API_KEY_INVALID + HTTP 503 preserves 503 status without false retry
      const apiKeyWith503 = {
        status: 503,
        errorDetails: [{ reason: 'API_KEY_INVALID' }],
        message: 'Backend unavailable during authentication'
      };
      const resKey503 = classifyGeminiError(apiKeyWith503);
      expect(resKey503.status).toBe(503);
      expect(resKey503.reason).toBe('client_error');
      expect(resKey503.shouldRetry).toBe(false);

      // 5. PERMISSION_DENIED + HTTP 429 preserves 429 status without false retry
      const permWith429 = {
        status: 429,
        errorDetails: [{ reason: 'PERMISSION_DENIED' }],
        message: 'Permission denied on resource'
      };
      const resPerm429 = classifyGeminiError(permWith429);
      expect(resPerm429.status).toBe(429);
      expect(resPerm429.reason).toBe('client_error');
      expect(resPerm429.shouldRetry).toBe(false);

      // 6. INVALID_ARGUMENT + HTTP 429 preserves 429 status
      const argWith429 = {
        status: 429,
        errorDetails: [{ reason: 'INVALID_ARGUMENT' }],
        message: 'Invalid argument provided'
      };
      const resArg429 = classifyGeminiError(argWith429);
      expect(resArg429.status).toBe(429);
      expect(resArg429.reason).toBe('client_error');
      expect(resArg429.shouldRetry).toBe(false);

      // 7. RATE_LIMIT_EXCEEDED + HTTP 503 preserves 503 status with retryable transient_rate_limit
      const rateWith503 = {
        status: 503,
        errorDetails: [{ reason: 'RATE_LIMIT_EXCEEDED' }],
        message: 'Overloaded burst limit'
      };
      const resRate503 = classifyGeminiError(rateWith503);
      expect(resRate503.status).toBe(503);
      expect(resRate503.reason).toBe('transient_rate_limit');
      expect(resRate503.shouldRetry).toBe(true);
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

    it('should simulate transient 429 rate limit retrying and succeeding on attempt 2', async () => {
      let callCount = 0;
      const simulatedGemini = async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error('429 Too Many Requests: Rate limit exceeded');
          (err as any).status = 429;
          throw err;
        }
        return { text: 'Gemini recovered response on retry' };
      };

      let attempt = 0;
      let finalOutcome = 'UNKNOWN';
      let resultData: any = null;
      const recordedDelays: number[] = [];
      const maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          resultData = await simulatedGemini();
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
        }
      }

      expect(callCount).toBe(2);
      expect(recordedDelays.length).toBe(1);
      expect(finalOutcome).toBe('SUCCESS');
      expect(resultData.text).toBe('Gemini recovered response on retry');
    });

    it('should simulate permanent QUOTA_EXCEEDED stopping on attempt 1 without retry', async () => {
      let callCount = 0;
      const simulatedGemini = async () => {
        callCount++;
        const err = {
          status: 429,
          errorDetails: [{ reason: 'QUOTA_EXCEEDED' }],
          message: 'You exceeded your current quota'
        };
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

      expect(callCount).toBe(1); // Stopped on attempt 1
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
