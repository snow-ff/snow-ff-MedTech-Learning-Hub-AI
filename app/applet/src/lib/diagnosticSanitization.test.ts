import { describe, it, expect } from 'vitest';
import { extractSafeGeminiErrorMeta, sanitizeErrorText, sanitizeMetadata } from '@/server';

describe('Diagnostic Sanitization & Error Meta Extraction', () => {
  it('extracts quotaMetric and quotaId safely with allowlist', () => {
    const err = {
      status: 429,
      message: 'Resource exhausted',
      errorDetails: [
        {
          reason: 'QUOTA_EXCEEDED',
          quotaMetric: 'aiplatform.googleapis.com/generate_content_requests',
          quotaId: 'FreeTier',
          domain: 'googleapis.com',
          metadata: { customSecret: 'should-be-dropped', limit: 10 }
        }
      ]
    };
    const meta = extractSafeGeminiErrorMeta(err);
    expect(meta.status).toBe(429);
    expect(meta.message).toContain('Resource exhausted');
    expect(meta.details.length).toBe(1);
    expect(meta.details[0].reason).toBe('QUOTA_EXCEEDED');
    expect(meta.details[0].quotaMetric).toBe('aiplatform.googleapis.com/generate_content_requests');
    expect(meta.details[0].quotaId).toBe('FreeTier');
    // Allowed metadata (limit) should pass, unallowed (customSecret) should be dropped
    expect(meta.details[0].metadata?.limit).toBe(10);
    expect(meta.details[0].metadata?.customSecret).toBeUndefined();
  });

  it('redacts API keys and Bearer tokens in message and metadata', () => {
    const err = {
      message: 'Error with key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q and token Bearer secret_token_xyz',
      errorDetails: [
        {
          reason: 'API_KEY_INVALID',
          metadata: {
            leakedToken: 'Bearer secret_token_xyz',
            quotaMetric: 'aiplatform.googleapis.com/test'
          }
        }
      ]
    };
    const meta = extractSafeGeminiErrorMeta(err);
    expect(meta.message).not.toContain('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q');
    expect(meta.message).toContain('[REDACTED_API_KEY]');
    expect(meta.message).not.toContain('secret_token_xyz');
    expect(meta.message).toContain('[REDACTED_TOKEN]');
    // leakedToken is not in allowed metadata keys so it gets dropped anyway
    expect(meta.details[0].metadata?.leakedToken).toBeUndefined();
    expect(meta.details[0].metadata?.quotaMetric).toBe('aiplatform.googleapis.com/test');
  });

  it('truncates excessively long content', () => {
    const longString = 'A'.repeat(500);
    const err = {
      message: longString,
      errorDetails: [{ reason: longString }]
    };
    const meta = extractSafeGeminiErrorMeta(err);
    expect(meta.message.length).toBeLessThanOrEqual(250);
    expect(meta.details[0].reason?.length).toBeLessThanOrEqual(250);
  });

  it('handles null, malformed error, and non-object metadata without crashing', () => {
    expect(() => extractSafeGeminiErrorMeta(null)).not.toThrow();
    expect(() => extractSafeGeminiErrorMeta(undefined)).not.toThrow();
    expect(() => extractSafeGeminiErrorMeta('string error')).not.toThrow();
    expect(() => extractSafeGeminiErrorMeta({ errorDetails: 'not-an-array' })).not.toThrow();
    expect(() => extractSafeGeminiErrorMeta({ errorDetails: [{ metadata: 'not-an-object' }] })).not.toThrow();

    const metaNull = extractSafeGeminiErrorMeta(null);
    expect(metaNull.message).toBe('null');
  });
});
