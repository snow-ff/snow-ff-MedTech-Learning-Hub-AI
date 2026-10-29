/**
 * MedTech Learning Hub AI v1.2 — Gemini API Retry & Resilience Policy
 *
 * Provides principled, transient-only retry classification, exponential backoff
 * with jitter, and structured telemetry logging.
 *
 * Rules:
 * 1. Retry ONLY transient server errors (503, 500, 502, 504, 408, network drops, transient 429).
 * 2. NEVER retry permanent client errors (400, 401, 403, 404, 413, 422) or quota/auth exhaustion.
 * 3. Enforce maximum retry limits and jittered exponential backoff to minimize latency.
 * 4. Fallback answers must be marked with source: "academic_fallback" (never disguise as Gemini output).
 */

export type RetryReason =
  | 'transient_service_unavailable'
  | 'transient_timeout_or_network'
  | 'transient_rate_limit'
  | 'client_error'
  | 'quota_or_credential_exhausted'
  | 'unclassified_non_transient';

export interface RetryClassification {
  shouldRetry: boolean;
  status?: number;
  reason: RetryReason;
  isTransient: boolean;
}

export interface RetryPolicyConfig {
  maxAttempts: number;
  baseDelayMs: number;
  backoffFactor: number;
  maxJitterMs: number;
  attemptTimeoutMs?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryPolicyConfig = {
  maxAttempts: 2, // 1 initial attempt + 1 retry for transient errors (avoids 15-20s waiting)
  baseDelayMs: 600,
  backoffFactor: 1.5,
  maxJitterMs: 250,
  attemptTimeoutMs: 12000
};

/**
 * Classifies an error from Gemini API call to determine whether it is transient
 * and safe to retry, or permanent (must fail immediately).
 */
export function classifyGeminiError(err: any): RetryClassification {
  if (!err) {
    return {
      shouldRetry: false,
      reason: 'unclassified_non_transient',
      isTransient: false
    };
  }

  const message = String(err.message || '');
  const statusMatch = message.match(/\b(503|502|504|500|408|429|400|401|403|404|413|422)\b/);
  const status = Number(err.status || err.statusCode || (statusMatch ? statusMatch[1] : undefined));

  // 1. Non-retryable permanent client errors (400 Bad Request, 401/403 Auth/Permission, 404 Not Found, 413, 422)
  const isClientError =
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 413 ||
    status === 422 ||
    message.includes('INVALID_ARGUMENT') ||
    message.includes('Invalid argument') ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('Unauthorized') ||
    message.includes('NOT_FOUND');

  if (isClientError) {
    let resolvedStatus = status;
    if (!resolvedStatus) {
      if (message.includes('INVALID_ARGUMENT') || message.includes('Invalid argument')) resolvedStatus = 400;
      else if (message.includes('API_KEY_INVALID') || message.includes('API key not valid') || message.includes('Unauthorized')) resolvedStatus = 401;
      else if (message.includes('PERMISSION_DENIED')) resolvedStatus = 403;
      else if (message.includes('NOT_FOUND')) resolvedStatus = 404;
      else resolvedStatus = 400;
    }
    return {
      shouldRetry: false,
      status: resolvedStatus,
      reason: 'client_error',
      isTransient: false
    };
  }

  // 2. Non-retryable quota exhaustion (explicitly 429 with RESOURCE_EXHAUSTED or Quota exceeded)
  const isRateLimitMentioned = /rate[\s_-]?limit/i.test(message);
  const isQuotaExhausted =
    message.includes('generate_content_free_tier_requests') ||
    /quota\s*exceeded/i.test(message) ||
    /exceeded your current quota/i.test(message) ||
    (message.includes('RESOURCE_EXHAUSTED') && !isRateLimitMentioned);

  if (isQuotaExhausted) {
    return {
      shouldRetry: false,
      status: status || 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  // 3. Retryable transient service errors (503 Service Unavailable / Overloaded, 500, 502, 504)
  const isTransient5xx =
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    message.includes('503') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('UNAVAILABLE') ||
    message.includes('overloaded');

  if (isTransient5xx) {
    let resolved5xx = status;
    if (!resolved5xx) {
      if (message.includes('500')) resolved5xx = 500;
      else if (message.includes('502')) resolved5xx = 502;
      else if (message.includes('504')) resolved5xx = 504;
      else resolved5xx = 503;
    }
    return {
      shouldRetry: true,
      status: resolved5xx,
      reason: 'transient_service_unavailable',
      isTransient: true
    };
  }

  // 4. Retryable transient timeout or transport connection drops (408, AbortError, fetch failed, socket drops)
  const isTransientTimeoutOrNetwork =
    status === 408 ||
    message.includes('408') ||
    message.includes('deadline') ||
    message.includes('timeout') ||
    message.includes('AbortError') ||
    message.includes('fetch failed') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('UND_ERR_SOCKET');

  if (isTransientTimeoutOrNetwork) {
    return {
      shouldRetry: true,
      status: status || 408,
      reason: 'transient_timeout_or_network',
      isTransient: true
    };
  }

  // 5. Retryable transient rate limit (temporary burst 429 or rate limit keyword)
  const isTransient429 = status === 429 || message.includes('429') || isRateLimitMentioned;
  if (isTransient429) {
    return {
      shouldRetry: true,
      status: 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  // Default: do not retry unknown errors
  return {
    shouldRetry: false,
    status: isNaN(status) ? undefined : status,
    reason: 'unclassified_non_transient',
    isTransient: false
  };
}

/**
 * Computes exponential backoff with random jitter.
 * Formula: round(baseDelayMs * (backoffFactor ^ (attempt - 1)) + random * maxJitterMs)
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_CONFIG,
  randomFn: () => number = Math.random
): number {
  const attemptIndex = Math.max(0, attempt - 1);
  const exponential = config.baseDelayMs * Math.pow(config.backoffFactor, attemptIndex);
  const jitter = randomFn() * config.maxJitterMs;
  return Math.round(exponential + jitter);
}

export interface RetryExecutionLog {
  requestId: string;
  attempt: number;
  maxAttempts: number;
  apiDurationMs: number;
  retryDelayMs?: number;
  finalOutcome: 'SUCCESS' | 'RETRYING' | 'FALLBACK_ACADEMIC';
  totalBackendDurationMs: number;
  status?: number;
  reason?: string;
}

/**
 * Formats a clean, safe, privacy-compliant log message for backend observability.
 * Does not contain API keys, sensitive tokens, or private user data.
 */
export function formatRetryLog(log: RetryExecutionLog): string {
  const retryDelayStr = log.retryDelayMs !== undefined ? ` retryDelay: ${log.retryDelayMs}ms,` : '';
  const statusStr = log.status !== undefined ? ` status: ${log.status},` : '';
  const reasonStr = log.reason ? ` reason: ${log.reason},` : '';

  return `[Req ${log.requestId}] [Perf Backend] Gemini Call ${log.finalOutcome} - attempt: ${log.attempt}/${log.maxAttempts}, apiDuration: ${log.apiDurationMs}ms,${retryDelayStr}${statusStr}${reasonStr} finalOutcome: ${log.finalOutcome}, totalBackendDuration: ${log.totalBackendDurationMs}ms`;
}
