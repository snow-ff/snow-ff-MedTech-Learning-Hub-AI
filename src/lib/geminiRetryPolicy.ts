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

  // 1. Structured error fields extraction
  const errorObj = err.error || err;
  const statusMatch = String(err.message || '').match(/\b(503|502|504|500|408|429|400|401|403|404|413|422)\b/);

  // Safely extract numeric status without letting string codes (e.g. 'RESOURCE_EXHAUSTED') turn it into NaN
  let status: number | undefined;
  for (const candidate of [err.status, err.statusCode, errorObj.status, errorObj.statusCode, errorObj.code]) {
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0) {
      status = candidate;
      break;
    }
    if (typeof candidate === 'string' && /^\d{3}$/.test(candidate.trim())) {
      status = Number(candidate.trim());
      break;
    }
  }
  if (!status && statusMatch) {
    status = Number(statusMatch[1]);
  }

  const statusString = String(errorObj.status || err.code || '').toUpperCase();

  // Search structured reason across ALL items in errorDetails or details array
  const detailsArray = Array.isArray(err.errorDetails)
    ? err.errorDetails
    : Array.isArray(errorObj.details)
    ? errorObj.details
    : [];

  const KNOWN_REASONS = ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'API_KEY_INVALID', 'PERMISSION_DENIED', 'INVALID_ARGUMENT'];
  let foundDetailReason = '';
  for (const d of detailsArray) {
    if (d && typeof d.reason === 'string') {
      const candidate = d.reason.toUpperCase();
      if (KNOWN_REASONS.includes(candidate)) {
        foundDetailReason = candidate;
        break;
      }
    }
  }
  if (!foundDetailReason) {
    const anyReason = detailsArray.find((d: any) => d && typeof d.reason === 'string');
    if (anyReason) foundDetailReason = String(anyReason.reason).toUpperCase();
  }
  const structuredReason = String(err.reason || foundDetailReason || '').toUpperCase();

  // 2. Structured Reason & Status classification (Checked FIRST before text searching)
  if (structuredReason === 'RATE_LIMIT_EXCEEDED') {
    return {
      shouldRetry: true,
      status: 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  if (structuredReason === 'QUOTA_EXCEEDED') {
    return {
      shouldRetry: false,
      status: 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  if (structuredReason === 'API_KEY_INVALID' || statusString === 'PERMISSION_DENIED' || structuredReason === 'PERMISSION_DENIED') {
    return {
      shouldRetry: false,
      status: status || (statusString === 'PERMISSION_DENIED' || structuredReason === 'PERMISSION_DENIED' ? 403 : 401),
      reason: 'client_error',
      isTransient: false
    };
  }

  if (statusString === 'INVALID_ARGUMENT' || structuredReason === 'INVALID_ARGUMENT') {
    return {
      shouldRetry: false,
      status: 400,
      reason: 'client_error',
      isTransient: false
    };
  }

  const message = String(err.message || '');
  // Strip URLs so help documentation links (e.g. https://.../rate-limits) do not pollute keyword matching
  const messageWithoutUrls = message.replace(/https?:\/\/[^\s)]+/g, '');

  // 3. HTTP 5xx / Transient Server Errors (HTTP Semantics Priority over message keywords)
  // A server error 503/500/502/504 or UNAVAILABLE/overloaded must NOT be misclassified as quota exhaustion,
  // even if the message mentions quota checks or backend capacity.
  const isTransient5xx =
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    (typeof status === 'number' && status >= 500 && status < 600) ||
    (!status && (
      message.includes('503') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('504') ||
      message.includes('UNAVAILABLE') ||
      message.includes('overloaded')
    ));

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

  // 4. Non-retryable permanent client errors (400 Bad Request, 401/403 Auth/Permission, 404 Not Found, 413, 422)
  const isClientError =
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 413 ||
    status === 422 ||
    messageWithoutUrls.includes('INVALID_ARGUMENT') ||
    messageWithoutUrls.includes('Invalid argument') ||
    messageWithoutUrls.includes('API_KEY_INVALID') ||
    messageWithoutUrls.includes('API key not valid') ||
    messageWithoutUrls.includes('PERMISSION_DENIED') ||
    messageWithoutUrls.includes('Unauthorized') ||
    messageWithoutUrls.includes('NOT_FOUND');

  if (isClientError) {
    let resolvedStatus = status;
    if (!resolvedStatus) {
      if (messageWithoutUrls.includes('INVALID_ARGUMENT') || messageWithoutUrls.includes('Invalid argument')) resolvedStatus = 400;
      else if (messageWithoutUrls.includes('API_KEY_INVALID') || messageWithoutUrls.includes('API key not valid') || messageWithoutUrls.includes('Unauthorized')) resolvedStatus = 401;
      else if (messageWithoutUrls.includes('PERMISSION_DENIED')) resolvedStatus = 403;
      else if (messageWithoutUrls.includes('NOT_FOUND')) resolvedStatus = 404;
      else resolvedStatus = 400;
    }
    return {
      shouldRetry: false,
      status: resolvedStatus,
      reason: 'client_error',
      isTransient: false
    };
  }

  // 5. Rate Limit vs Quota Exhaustion (resolving co-occurrence cleanly)
  // Daily / Billing / Permanent Quota signals take priority over burst rate limits:
  const isDailyOrPlanQuota =
    /exceeded your current quota/i.test(messageWithoutUrls) ||
    /check your plan and billing/i.test(messageWithoutUrls) ||
    /per[\s_-]?day/i.test(messageWithoutUrls) ||
    /daily[\s_-]?quota/i.test(messageWithoutUrls) ||
    /quota metric '.*' and limit '.*per day'/i.test(messageWithoutUrls);

  // Rate Limit signals (per-minute, RPM, burst, or explicit rate limit phrase)
  const isRateLimitMentioned =
    /rate[\s_-]?limit/i.test(messageWithoutUrls) ||
    /per[\s_-]?minute/i.test(messageWithoutUrls) ||
    /\bRPM\b/i.test(messageWithoutUrls) ||
    /too many requests/i.test(messageWithoutUrls);

  // If daily/plan quota is exceeded, it cannot be retried even if rate limit is mentioned:
  if (isDailyOrPlanQuota) {
    return {
      shouldRetry: false,
      status: status || 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  // If rate limit is mentioned (even alongside generate_content_free_tier_requests or RESOURCE_EXHAUSTED):
  // e.g. "generate_content_free_tier_requests per minute Rate Limit exceeded" -> this is transient per-minute rate limit!
  if (isRateLimitMentioned) {
    return {
      shouldRetry: true,
      status: 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  // If free tier or quota is mentioned without rate limit or per-minute burst:
  const isGenericQuotaExhausted =
    messageWithoutUrls.includes('generate_content_free_tier_requests') ||
    /quota\s*exceeded/i.test(messageWithoutUrls) ||
    messageWithoutUrls.includes('RESOURCE_EXHAUSTED');

  if (isGenericQuotaExhausted) {
    return {
      shouldRetry: false,
      status: status || 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  // 6. Retryable transient timeout or transport connection drops (408, AbortError, fetch failed, socket drops)
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
    status: typeof status === 'number' && !Number.isNaN(status) ? status : undefined,
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
