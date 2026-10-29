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
  maxAttempts: 2, // 1 initial attempt + 1 retry for transient errors
  baseDelayMs: 600,
  backoffFactor: 1.5,
  maxJitterMs: 250,
  attemptTimeoutMs: 18000 // Optimized to 18s per attempt to enter safe academic fallback faster without hanging
};

/**
 * Classifies an error from Gemini API call to determine whether it is transient
 * and safe to retry, or permanent (must fail immediately).
 */
// Helper to safely parse HTTP status without type-coercion bugs
function parseCandidateStatus(val: unknown): number | undefined {
  if (typeof val === 'number') {
    if (val === 20) return 408; // gRPC CANCELLED/aborted maps to 408 timeout
    if (Number.isInteger(val) && val >= 100 && val <= 599) {
      return val;
    }
    return undefined;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '20') return 408;
    if (/^[1-5]\d{2}$/.test(trimmed)) {
      const parsed = Number(trimmed);
      if (Number.isInteger(parsed) && parsed >= 100 && parsed <= 599) {
        return parsed;
      }
    }
  }
  return undefined;
}

const KNOWN_STRUCTURED_REASONS = [
  'RATE_LIMIT_EXCEEDED',
  'QUOTA_EXCEEDED',
  'API_KEY_INVALID',
  'PERMISSION_DENIED',
  'INVALID_ARGUMENT'
] as const;

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

  // 1. Independent and safe candidate HTTP status extraction
  const errorObj = (err && typeof err === 'object' && err.error) ? err.error : err;

  const statusCandidates = [
    err.status,
    err.statusCode,
    err.code,
    err.response?.status,
    errorObj.status,
    errorObj.statusCode,
    errorObj.code
  ];

  let status: number | undefined;
  for (const cand of statusCandidates) {
    const parsed = parseCandidateStatus(cand);
    if (parsed !== undefined) {
      status = parsed;
      break;
    }
  }

  // If no numeric status found from properties, inspect message only for explicit HTTP status patterns
  if (status === undefined && typeof err.message === 'string') {
    const msg = err.message;
    const explicitPattern =
      msg.match(/(?:HTTP|status|code)\s*[:=-]?\s*([1-5]\d{2})\b/i) ||
      msg.match(/^\s*([1-5]\d{2})\b/) ||
      msg.match(/\b([1-5]\d{2})\s+(?:Service Unavailable|Bad Gateway|Gateway Timeout|Internal Server Error|Too Many Requests|Bad Request|Unauthorized|Forbidden|Not Found)\b/i);

    if (explicitPattern) {
      const parsed = parseCandidateStatus(explicitPattern[1]);
      if (parsed !== undefined) {
        status = parsed;
      }
    }
  }

  const statusString = String(errorObj.status || err.code || '').toUpperCase();

  // 2. Comprehensive Structured Reason collection across ALL genuine SDK containers without shadowing
  interface ScoredReason {
    reason: string;
    sourceWeight: number; // 3: Primary Google RPC ErrorInfo, 2: Direct property, 1: Generic details
  }
  const scoredReasons: ScoredReason[] = [];

  const pushDetailItems = (items: unknown, weight: number) => {
    if (Array.isArray(items)) {
      for (const d of items) {
        if (d && typeof d.reason === 'string' && d.reason.trim()) {
          scoredReasons.push({ reason: d.reason.trim().toUpperCase(), sourceWeight: weight });
        }
      }
    }
  };

  // Source Level 3: Primary Google RPC ErrorInfo (include both err.errorDetails and errorObj.errorDetails)
  pushDetailItems(err.errorDetails, 3);
  if (errorObj && errorObj.errorDetails !== err.errorDetails) {
    pushDetailItems(errorObj.errorDetails, 3);
  }

  // Source Level 2: Direct reason properties
  if (typeof err.reason === 'string' && err.reason.trim()) {
    scoredReasons.push({ reason: err.reason.trim().toUpperCase(), sourceWeight: 2 });
  }
  if (errorObj && typeof errorObj.reason === 'string' && errorObj.reason.trim() && errorObj.reason !== err.reason) {
    scoredReasons.push({ reason: errorObj.reason.trim().toUpperCase(), sourceWeight: 2 });
  }

  // Source Level 1: Generic detail containers (include both errorObj.details and err.details)
  if (errorObj) {
    pushDetailItems(errorObj.details, 1);
  }
  if (err.details !== (errorObj && errorObj.details)) {
    pushDetailItems(err.details, 1);
  }

  // Conflict Resolution among Structured Reasons
  let structuredReason = '';
  const knownMatches = scoredReasons.filter(sr => (KNOWN_STRUCTURED_REASONS as readonly string[]).includes(sr.reason));

  if (knownMatches.length === 0) {
    // If no known reason exists, fall back to the highest authority unknown reason (if any)
    if (scoredReasons.length > 0) {
      scoredReasons.sort((a, b) => b.sourceWeight - a.sourceWeight);
      structuredReason = scoredReasons[0].reason;
    }
  } else {
    const uniqueKnown = Array.from(new Set(knownMatches.map(m => m.reason)));
    if (uniqueKnown.length === 1) {
      structuredReason = uniqueKnown[0];
    } else {
      // Conflicting Known Reasons:
      // Policy 1: Authentication & Permission & Argument validity have absolute precedence over Rate/Quota
      if (uniqueKnown.includes('API_KEY_INVALID')) {
        structuredReason = 'API_KEY_INVALID';
      } else if (uniqueKnown.includes('PERMISSION_DENIED')) {
        structuredReason = 'PERMISSION_DENIED';
      } else if (uniqueKnown.includes('INVALID_ARGUMENT')) {
        structuredReason = 'INVALID_ARGUMENT';
      } else if (uniqueKnown.includes('RATE_LIMIT_EXCEEDED') && uniqueKnown.includes('QUOTA_EXCEEDED')) {
        // Policy 2: Conflicting RATE_LIMIT_EXCEEDED vs QUOTA_EXCEEDED
        // Check if one source has higher authority weight:
        const rateLimitMaxWeight = Math.max(...knownMatches.filter(m => m.reason === 'RATE_LIMIT_EXCEEDED').map(m => m.sourceWeight));
        const quotaMaxWeight = Math.max(...knownMatches.filter(m => m.reason === 'QUOTA_EXCEEDED').map(m => m.sourceWeight));

        if (rateLimitMaxWeight > quotaMaxWeight) {
          structuredReason = 'RATE_LIMIT_EXCEEDED';
        } else if (quotaMaxWeight > rateLimitMaxWeight) {
          structuredReason = 'QUOTA_EXCEEDED';
        } else {
          // Equal source authority: inspect message context after stripping URLs
          const msgClean = String(err.message || '').replace(/https?:\/\/[^\s)]+/g, '');
          const isDailyOrPlan = /exceeded your current quota|check your plan and billing|per[\s_-]?day|daily[\s_-]?quota/i.test(msgClean);
          const isPerMinuteOrRpm = /per[\s_-]?minute|\bRPM\b/i.test(msgClean);

          if (isDailyOrPlan && !isPerMinuteOrRpm) {
            structuredReason = 'QUOTA_EXCEEDED';
          } else if (isPerMinuteOrRpm && !isDailyOrPlan) {
            structuredReason = 'RATE_LIMIT_EXCEEDED';
          } else {
            // Irreconcilable conflict between transient rate limit and permanent quota:
            // Fail-Safe Principle: Do NOT guess rate limit or retry blindly.
            structuredReason = 'CONFLICTING_QUOTA_OR_RATE_LIMIT';
          }
        }
      } else {
        // Tie-breaker: sort by source weight
        knownMatches.sort((a, b) => b.sourceWeight - a.sourceWeight);
        structuredReason = knownMatches[0].reason;
      }
    }
  }

  // 3. Rule 1: Recognized Structured Reason has highest priority
  // Preserve genuine detected HTTP status (do not invent or override status unless absent)
  if (structuredReason === 'API_KEY_INVALID' || statusString === 'PERMISSION_DENIED' || structuredReason === 'PERMISSION_DENIED') {
    return {
      shouldRetry: false,
      status: status !== undefined ? status : (statusString === 'PERMISSION_DENIED' || structuredReason === 'PERMISSION_DENIED' ? 403 : 401),
      reason: 'client_error',
      isTransient: false
    };
  }

  if (statusString === 'INVALID_ARGUMENT' || structuredReason === 'INVALID_ARGUMENT') {
    return {
      shouldRetry: false,
      status: status !== undefined ? status : 400,
      reason: 'client_error',
      isTransient: false
    };
  }

  if (structuredReason === 'RATE_LIMIT_EXCEEDED') {
    return {
      shouldRetry: true,
      status: status !== undefined ? status : 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  if (structuredReason === 'QUOTA_EXCEEDED' || structuredReason === 'CONFLICTING_QUOTA_OR_RATE_LIMIT') {
    return {
      shouldRetry: false,
      status: status !== undefined ? status : 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  const message = String(err.message || '');
  // Strip URLs so help documentation links (e.g. https://.../rate-limits or /timeout) do not pollute keyword matching
  const messageWithoutUrls = message.replace(/https?:\/\/[^\s)]+/g, '');

  // 4. Rule 2: HTTP 5xx / Transient Server Errors take precedence over general message keywords
  const explicit5xxMatch =
    messageWithoutUrls.match(/(?:HTTP|status|code)\s*[:=-]?\s*(500|502|503|504)\b/i) ||
    messageWithoutUrls.match(/^\s*(500|502|503|504)\b/) ||
    messageWithoutUrls.match(/\b(500|502|503|504)\s+(?:Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout)\b/i);

  const isTransient5xx =
    (typeof status === 'number' && status >= 500 && status < 600) ||
    (!status && (
      Boolean(explicit5xxMatch) ||
      /\bUNAVAILABLE\b/i.test(messageWithoutUrls) ||
      /\boverloaded\b/i.test(messageWithoutUrls)
    ));

  if (isTransient5xx) {
    let resolved5xx = status;
    if (!resolved5xx) {
      if (explicit5xxMatch) {
        resolved5xx = Number(explicit5xxMatch[1]);
      } else {
        resolved5xx = 503;
      }
    }
    return {
      shouldRetry: true,
      status: resolved5xx,
      reason: 'transient_service_unavailable',
      isTransient: true
    };
  }

  // 5. Transient transport connection drops / timeouts (safe regex and URL-stripped)
  const isTransientTimeoutOrNetwork =
    status === 408 ||
    /(?:HTTP|status|code)\s*[:=-]?\s*408\b/i.test(messageWithoutUrls) ||
    /^\s*408\b/.test(messageWithoutUrls) ||
    /\b408\s+Request Timeout\b/i.test(messageWithoutUrls) ||
    /\bdeadline\s*exceeded\b/i.test(messageWithoutUrls) ||
    /\b(?:gateway\s+|request\s+|connection\s+|socket\s+)?timeout\b/i.test(messageWithoutUrls) ||
    /\boperation\s+timed?\s*out\b/i.test(messageWithoutUrls) ||
    /\bAbortError\b/i.test(messageWithoutUrls) ||
    /\boperation\s+was\s+aborted\b/i.test(messageWithoutUrls) ||
    /\bfetch\s+failed\b/i.test(messageWithoutUrls) ||
    /\b(?:ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|UND_ERR_SOCKET|ENOTFOUND)\b/i.test(messageWithoutUrls);

  if (isTransientTimeoutOrNetwork) {
    return {
      shouldRetry: true,
      status: status || 408,
      reason: 'transient_timeout_or_network',
      isTransient: true
    };
  }

  // 6. Non-retryable permanent client errors (400 Bad Request, 401/403 Auth/Permission, 404 Not Found, 413, 422)
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

  // 7. Rate Limit vs Quota Exhaustion for HTTP 429 or quota/rate limit error text
  const isDailyOrPlanQuota =
    /exceeded your current quota/i.test(messageWithoutUrls) ||
    /check your plan and billing/i.test(messageWithoutUrls) ||
    /per[\s_-]?day/i.test(messageWithoutUrls) ||
    /daily[\s_-]?quota/i.test(messageWithoutUrls) ||
    /quota metric '.*' and limit '.*per day'/i.test(messageWithoutUrls);

  const isRateLimitMentioned =
    /rate[\s_-]?limit/i.test(messageWithoutUrls) ||
    /per[\s_-]?minute/i.test(messageWithoutUrls) ||
    /\bRPM\b/i.test(messageWithoutUrls) ||
    /too many requests/i.test(messageWithoutUrls);

  // Daily/plan quota takes precedence over burst rate limits:
  if (isDailyOrPlanQuota) {
    return {
      shouldRetry: false,
      status: status || 429,
      reason: 'quota_or_credential_exhausted',
      isTransient: false
    };
  }

  // If rate limit per minute or RPM is specified (even with generate_content_free_tier_requests):
  if (isRateLimitMentioned) {
    return {
      shouldRetry: true,
      status: 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  // Generic quota exhaustion without rate limit per minute:
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

  // Generic HTTP 429 without quota text:
  const explicit429Match =
    /(?:HTTP|status|code)\s*[:=-]?\s*429\b/i.test(message) ||
    /^\s*429\b/.test(message) ||
    /\b429\s+Too Many Requests\b/i.test(message);

  if (status === 429 || explicit429Match) {
    return {
      shouldRetry: true,
      status: 429,
      reason: 'transient_rate_limit',
      isTransient: true
    };
  }

  // Default: unclassified error
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
