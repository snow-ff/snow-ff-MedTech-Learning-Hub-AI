process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'node:http';
import { app, getAcademicFallback, formatFallbackResponse, setCustomGeminiMock } from '../../server';
import fs from 'node:fs';
import path from 'node:path';
import { getAllLearningTopics, LEARNING_DOMAIN_GROUPS, STUDY_WORKFLOW_OPTIONS, buildStudyWorkflowPrompt, getWorkflowById } from '../data/learningDomainCatalog';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

describe('Track B1.7: Search Mode Integration & Verification Audit', () => {
  let server: Server;
  let baseUrl: string;
  let mockCalls: Array<{ isDocumentGrounding: boolean; tools?: any }> = [];
  const originalFetch = global.fetch;

  const groundTruthPath = path.resolve(__dirname, '../../../test-assets/ground-truth/dtm67-111-source.md');
  const sourceText = fs.existsSync(groundTruthPath)
    ? fs.readFileSync(groundTruthPath, 'utf8')
    : 'Prefix (คำอุปสรรค): วางไว้ข้างหน้ารากศัพท์ เช่น brady- ช้า, tachy- เร็ว\nSuffix (ปัจจัยท้าย): วางไว้ข้างหลังรากศัพท์ เช่น -itis อักเสบ, -scopy การส่องกล้อง';

  const sampleDocumentContext = {
    title: 'dtm67-111-source.md',
    hasNativePages: false,
    totalPages: 1,
    chunks: [
      {
        id: 'chunk-gt-1',
        chunkIndex: 1,
        pageNumber: undefined,
        hasNativePage: false,
        text: sourceText.slice(0, 800)
      },
      {
        id: 'chunk-gt-2',
        chunkIndex: 2,
        pageNumber: undefined,
        hasNativePage: false,
        text: sourceText.slice(800, 1600) || 'เนื้อหาเพิ่มเติมเกี่ยวกับ Medical Terminology'
      }
    ]
  };

  beforeAll(async () => {
    // Network isolation guard: throw if test suite attempts external network requests
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
        throw new Error(`[Network Isolation Violation] Attempted external network call to: ${url}`);
      }
      return originalFetch(input, init);
    };

    setCustomGeminiMock(async (params) => {
      mockCalls.push({
        isDocumentGrounding: params.isDocumentGrounding,
        tools: params.tools
      });
      return {
        text: "ผลลัพธ์จำลองจากการทดสอบ Integration Test ออฟไลน์",
        candidates: [{
          groundingMetadata: {
            webSearchQueries: ["integration test query"],
            groundingChunks: [{ web: { uri: "https://who.int/test", title: "WHO Test Guideline" } }],
            groundingSupports: [{
              segment: { startIndex: 0, endIndex: 14, text: "ผลลัพธ์จำลอง" },
              groundingChunkIndices: [0]
            }]
          }
        }]
      };
    });
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    setCustomGeminiMock(null);
    global.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // Scenario 1: document mode + active document with chunks
  it('1. document mode + active document: strictly uses document evidence and never mixes web search', async () => {
    mockCalls = [];
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'อธิบายความหมายของ Prefix และ Suffix พร้อมยกตัวอย่างจากเอกสาร' }],
        searchMode: 'document',
        documentContext: sampleDocumentContext
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Document mode must send isDocumentGrounding: true and no google search tool
    const lastCall = mockCalls[mockCalls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall.isDocumentGrounding).toBe(true);
    expect(lastCall.tools).toBeUndefined();

    expect(['document_grounding', 'academic_fallback']).toContain(data.source);
    expect(data.references).toBeDefined();
    expect(Array.isArray(data.references)).toBe(true);
  }, 35000);

  // Scenario 1b: document mode + active document, but query asks about content absent from document
  it('1b. document mode + active document but query is absent from document: strictly refuses Google Search and returns insufficient evidence', async () => {
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'ทฤษฎีควอนตัมฟิสิกส์และการแผ่รังสีของวัตถุดำ' }],
        searchMode: 'document',
        documentContext: sampleDocumentContext
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.source).toBe('document_grounding');
    expect(data.evidenceStatus).toBe('insufficient');
    expect(data.references).toEqual([]);
    expect(data.text).toContain('ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Document Grounding)');
  });

  // Scenario 2: web_search mode + active document present
  it('2. web_search mode + active document: performs web search and does not report web sources as document chunks', async () => {
    mockCalls = [];
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'เทคโนโลยี Flow Cytometry ในการวิเคราะห์เม็ดเลือดขาว' }],
        searchMode: 'web_search',
        documentContext: sampleDocumentContext
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Web search mode must send isDocumentGrounding: false and configure googleSearch tool
    const lastCall = mockCalls[mockCalls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall.isDocumentGrounding).toBe(false);
    expect(lastCall.tools).toEqual([{ googleSearch: {} }]);

    expect(data.source).not.toBe('document_grounding');
  }, 35000);

  // Scenario 3: document mode + NO document selected
  it('3. document mode + no document: cleanly warns user, returns insufficient evidence, and zero fake citations', async () => {
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'คำศัพท์ทางการแพทย์พื้นฐานคืออะไร' }],
        searchMode: 'document',
        documentContext: undefined
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.source).toBe('academic_fallback');
    expect(data.evidenceStatus).toBe('insufficient');
    expect(data.references).toEqual([]);
  });

  // Scenario 4: User requests document content or page numbers without active document
  it('4. ungrounded prompt requesting document or page number: does not fabricate page numbers or citations', async () => {
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'จากเอกสารนี้ช่วยบอกหน่อยว่าข้อมูลอยู่ในหน้าไหน' }],
        searchMode: 'auto',
        documentContext: undefined
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.source).toBe('academic_fallback');
    expect(data.evidenceStatus).toBe('insufficient');
    expect(data.references).toEqual([]);
  });

  // Scenario 5: Multiple consecutive mode switches (no state leakage)
  it('5. sequential requests with alternating modes: strictly honors the mode of each individual request without state leakage', async () => {
    mockCalls = [];
    // Request A: document mode
    const resA = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'Prefix และ Suffix ในเอกสาร' }],
        searchMode: 'document',
        documentContext: sampleDocumentContext
      })
    });
    expect(resA.status).toBe(200);
    expect(mockCalls[mockCalls.length - 1].isDocumentGrounding).toBe(true);

    // Request B: web_search mode immediately following
    const resB = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'การตรวจ CBC คืออะไร' }],
        searchMode: 'web_search',
        documentContext: sampleDocumentContext
      })
    });
    expect(resB.status).toBe(200);
    expect(mockCalls[mockCalls.length - 1].isDocumentGrounding).toBe(false);

    // Request C: switch back to document mode
    const resC = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'ตัวอย่าง Suffix ในเอกสาร' }],
        searchMode: 'document',
        documentContext: sampleDocumentContext
      })
    });
    expect(resC.status).toBe(200);
    expect(mockCalls[mockCalls.length - 1].isDocumentGrounding).toBe(true);
  }, 45000);

  // Scenario 6: Gemini API failure / fallback behavior in each mode
  it('6. academic fallback integrity: fallback does not claim live web search or cite non-existent documents', () => {
    const docFallback = getAcademicFallback('Prefix และ Suffix', undefined, sampleDocumentContext);
    expect(docFallback).toBeDefined();
    expect(docFallback.text).toContain('dtm67-111-source.md');

    const webFallback = getAcademicFallback('ความแตกต่างระหว่าง Serum และ Plasma', undefined, null as any);
    expect(webFallback).toBeDefined();
    expect(webFallback.text).not.toContain('*(คำตอบสรุปจากเอกสารการเรียนรู้: "null")*');

    for (const ref of webFallback.references) {
      expect((ref as any).evidenceLocator).toBeUndefined();
      expect(ref.uri).toMatch(/^https?:\/\//);
    }
  });

  // Scenario 7: Network isolation proof & mock parameter verification
  it('7. network isolation and mock parameter verification: guarantees zero external network calls and correct tool mapping', async () => {
    let capturedParams: any = null;
    setCustomGeminiMock(async (params) => {
      capturedParams = params;
      return {
        text: "ผลลัพธ์จำลองตรวจสอบพารามิเตอร์",
        candidates: [{
          groundingMetadata: {
            webSearchQueries: ["test query"],
            groundingChunks: [{ web: { uri: "https://who.int/test-guideline", title: "WHO Test Guideline" } }],
            groundingSupports: [{
              segment: { startIndex: 0, endIndex: 14, text: "ผลลัพธ์จำลอง" },
              groundingChunkIndices: [0]
            }]
          }
        }]
      };
    });

    const res = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'ทดสอบพารามิเตอร์โหมดค้นหาเว็บ' }],
        searchMode: 'web_search',
        documentContext: undefined
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(capturedParams).not.toBeNull();
    expect(capturedParams.isDocumentGrounding).toBe(false);
    expect(capturedParams.tools).toEqual([{ googleSearch: {} }]);
    for (const ref of data.references) {
      expect(ref.verificationStatus).toBe('unverified');
    }
  });

  // Scenario 8: activeChunksForGrounding backend path: inline delimiters in sentences do not fabricate verified heading locators
  it('8. activeChunksForGrounding backend path: inline delimiters in sentences do not fabricate verified heading locators', async () => {
    // Mock a response that answers with grounded content so verifyAcademicAnswer passes and populates references
    setCustomGeminiMock(async (params) => {
      return {
        text: "Suffix -itis หมายถึงการอักเสบตามที่ระบุในเอกสาร",
        candidates: [{
          groundingMetadata: {
            webSearchQueries: [],
            groundingChunks: []
          }
        }]
      };
    });

    // 8a. Negative Case: Inline delimiter in the middle of a sentence must NOT become a verified heading
    const docWithInlineDelim = {
      title: 'เอกสารทดสอบตัวคั่นกลางประโยค',
      hasNativePages: false,
      totalPages: 1,
      chunks: [
        {
          id: 'chunk-inline-test',
          chunkIndex: 1,
          pageNumber: undefined,
          hasNativePage: false,
          text: 'ตัวอย่างข้อความทั่วไปที่มีคำว่า === บทที่ 3: Suffix === อยู่ตรงกลางประโยค โดย Suffix -itis คือการอักเสบ'
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'Suffix -itis คืออะไร' }],
        searchMode: 'document',
        documentContext: docWithInlineDelim
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.references).toBeDefined();
    expect(data.references.length).toBeGreaterThan(0);
    for (const ref of data.references) {
      expect(ref.evidenceLocator).not.toBe('บทที่ 3');
      expect(ref.evidenceLocator).not.toBe('ชิ้นส่วนที่ 3');
      expect(ref.evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect(ref.isLocatorVerified).toBe(false);
      expect(ref.sourceLocatorProvenance).not.toBe('source_heading');
    }

    // 8b. Positive Case: Genuine heading at line start must be recognized and verified as บทที่ 3
    const docWithRealHeading = {
      title: 'เอกสารทดสอบหัวข้อจริง',
      hasNativePages: false,
      totalPages: 1,
      chunks: [
        {
          id: 'chunk-real-test',
          chunkIndex: 1,
          pageNumber: undefined,
          hasNativePage: false,
          text: '=== บทที่ 3: Suffix ===\nSuffix -itis หมายถึงการอักเสบ เช่น appendicitis'
        }
      ]
    };

    const resReal = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'Suffix -itis คืออะไร' }],
        searchMode: 'document',
        documentContext: docWithRealHeading
      })
    });

    expect(resReal.status).toBe(200);
    const dataReal = await resReal.json();
    expect(dataReal.references).toBeDefined();
    expect(dataReal.references.length).toBeGreaterThan(0);
    const refReal = dataReal.references[0];
    expect(refReal.evidenceLocator).toBe('บทที่ 3');
    expect(refReal.isLocatorVerified).toBe(true);
    expect(refReal.verificationStatus).toBe('source_grounded');
    expect(refReal.sourceLocatorProvenance).toBe('source_heading');
  });

  // Scenario 10: Real server retry loop proves transient HTTP 503 retries twice and returns HTTP 503 notice
  it('10. real server retry loop: retries transient 503 exactly twice and reflects HTTP 503 Service Unavailable in notice', async () => {
    let callAttempts = 0;
    setCustomGeminiMock(async () => {
      callAttempts++;
      const err = new Error('503 Service Unavailable: The model is overloaded.');
      (err as any).status = 503;
      throw err;
    });

    const res = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'อธิบาย Serum และ Plasma' }],
        searchMode: 'web_search'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(callAttempts).toBe(2); // 1 initial + 1 retry
    expect(data.source).toBe('academic_fallback');
    expect(data.serviceStatus.isApiUnavailable).toBe(true);
    expect(data.serviceStatus.attemptsRun).toBe(2);
    expect(data.serviceStatus.lastErrorStatus).toBe(503);
    expect(data.serviceStatus.reason).toBe('transient_service_unavailable');
    expect(data.text).toContain('HTTP 503 Service Unavailable');
  }, 15000);

  // Scenario 11: Real server retry loop reflects HTTP 500, 502, 504 accurately without hardcoding 503
  it('11. real server retry loop: accurately reflects HTTP 500/502/504 instead of hardcoding 503', async () => {
    for (const code of [500, 502, 504]) {
      let callCount = 0;
      setCustomGeminiMock(async () => {
        callCount++;
        const err = new Error(`${code} Server Error`);
        (err as any).status = code;
        throw err;
      });

      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'อธิบาย Serum และ Plasma' }],
          searchMode: 'web_search'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(callCount).toBe(2);
      expect(data.serviceStatus.attemptsRun).toBe(2);
      expect(data.serviceStatus.lastErrorStatus).toBe(code);
      expect(data.text).toContain(`HTTP ${code}`);
      expect(data.text).not.toContain('HTTP 503');
    }
  }, 25000);

  // Scenario 12: Real server aborts immediately on non-transient 400 Bad Request (1 attempt only)
  it('12. real server retry loop: stops immediately on attempt 1 for non-transient 400 Bad Request', async () => {
    let callAttempts = 0;
    setCustomGeminiMock(async () => {
      callAttempts++;
      const err = new Error('400 Bad Request: INVALID_ARGUMENT');
      (err as any).status = 400;
      throw err;
    });

    const res = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'อธิบาย Serum และ Plasma' }],
        searchMode: 'web_search'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(callAttempts).toBe(1); // Immediate stop without retry
    expect(data.serviceStatus.attemptsRun).toBe(1);
    expect(data.serviceStatus.lastErrorStatus).toBe(400);
    expect(data.serviceStatus.reason).toBe('client_error');
    expect(data.text).toContain('HTTP 400 Bad Request');
    expect(data.text).not.toContain('โควตา');
  }, 15000);

  // Scenario 13: Case-insensitive Rate Limit vs Quota Exceeded in real server execution
  it('13. real server retry loop: distinguishes case-insensitive Rate Limit (retries twice) from Quota Exceeded (stops at 1)', async () => {
    // 13a: TitleCase 'Rate Limit Exceeded' -> retryable transient rate limit
    let rateLimitCalls = 0;
    setCustomGeminiMock(async () => {
      rateLimitCalls++;
      const err = new Error('RESOURCE_EXHAUSTED: Rate Limit Exceeded');
      (err as any).status = 429;
      throw err;
    });

    const resRateLimit = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'อธิบาย Serum และ Plasma' }],
        searchMode: 'web_search'
      })
    });
    const dataRateLimit = await resRateLimit.json();
    expect(rateLimitCalls).toBe(2);
    expect(dataRateLimit.serviceStatus.attemptsRun).toBe(2);
    expect(dataRateLimit.serviceStatus.reason).toBe('transient_rate_limit');
    expect(dataRateLimit.text).toContain('HTTP 429 Rate Limit');

    // 13b: Permanent 'Quota exceeded' -> non-retryable quota exhaustion
    let quotaCalls = 0;
    setCustomGeminiMock(async () => {
      quotaCalls++;
      const err = new Error('RESOURCE_EXHAUSTED: Quota exceeded for free tier');
      (err as any).status = 429;
      throw err;
    });

    const resQuota = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'อธิบาย Serum และ Plasma' }],
        searchMode: 'web_search'
      })
    });
    const dataQuota = await resQuota.json();
    expect(quotaCalls).toBe(1); // Immediate stop at 1
    expect(dataQuota.serviceStatus.attemptsRun).toBe(1);
    expect(dataQuota.serviceStatus.reason).toBe('quota_or_credential_exhausted');
    expect(dataQuota.text).toContain('HTTP 429 Quota Exceeded');
  }, 25000);

  // Action 5: Offline Mode Status Integrity & Regression Coverage (Tests A - E)
  describe('Offline Mode Status Integrity & Regression Suite', () => {
    // Test A: Offline Document with Partial Evidence
    it('Test A: offline document mode with partial evidence returns WARNING verdict and 0 API calls', async () => {
      mockCalls = [];
      const partialDoc = {
        documentId: 'doc-prefix-only',
        title: 'medical-terminology-prefix.md',
        hasNativePages: false,
        totalPages: 1,
        chunks: [
          {
            id: 'c-pre-1',
            documentId: 'doc-prefix-only',
            chunkIndex: 1,
            hasNativePage: false,
            text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำศัพท์ทางการแพทย์ เพื่อระบุตำแหน่ง ปริมาณ หรือทิศทาง เช่น Intra- (ภายใน), Sub- (ใต้)',
            charCount: 110
          }
        ]
      };

      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ความแตกต่างระหว่าง Prefix และ Suffix ในเอกสาร' }],
          searchMode: 'document',
          offlineMode: true,
          documentContext: partialDoc
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('offline_document_fallback');
      expect(data.serviceStatus.reason).toBe('offline_mode_selected');

      expect(data.text).toContain('Partial Evidence Notice');
      expect(data.text).not.toMatch(/หน้า\s*\d+/);
      expect(data.verification).toBeDefined();
      expect(data.verification.verdict).toBe('WARNING');
      expect(data.verification.isVerified).toBe(false);
    });

    // Test B: Offline Mode on Unsupported Topic (Static Fallback)
    it('Test B: offline mode with unsupported topic returns offline_static_fallback and zero API calls', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ประวัติศาสตร์การแพทย์แผนโบราณในยุคกลาง' }],
          searchMode: 'web_search',
          offlineMode: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('offline_static_fallback');
      expect(data.serviceStatus.reason).toBe('offline_mode_selected');
      expect(data.text).toContain('ไม่พบข้อมูลสำรองทางวิชาการเฉพาะสำหรับหัวข้อนี้');
      expect(data.text).toContain('คลังเอกสาร (Document Library)');
      expect(data.text).not.toContain('โควตา');
    });

    // Test C: Offline Mode on Supported Static Topic (Serum/Plasma)
    it('Test C: offline mode with supported topic provides static knowledge with unverified references', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ความแตกต่างระหว่าง Serum และ Plasma' }],
          searchMode: 'web_search',
          offlineMode: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('offline_static_fallback');
      expect(data.text).toContain('Serum');
      expect(data.text).toContain('Plasma');
      expect(data.references.length).toBeGreaterThan(0);
      for (const ref of data.references) {
        expect(ref.verificationStatus).toBe('unverified');
        expect(ref.linkAccessStatus).toBe('unknown');
      }
    });

    // Test D: Offline Document Mode without Active Document
    it('Test D: offline document mode without active document returns offline_document_missing with 0 API calls', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'สรุปเนื้อหาจากเอกสารหน้านี้' }],
          searchMode: 'document',
          offlineMode: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('offline_document_missing');
      expect(data.serviceStatus.reason).toBe('offline_mode_selected');
      expect(data.text).toContain('ยังไม่ได้เลือกเอกสาร');
      expect(data.text).not.toContain('โควตา');
    });

    // Test E: Offline Unpaged Document with Page Number Query
    it('Test E: offline page query on unpaged document deterministic short-circuit without live AI badge or fake pages', async () => {
      mockCalls = [];
      const unpagedDoc = {
        documentId: 'doc-unpaged-notes',
        title: 'dtm-study-notes.md',
        hasNativePages: false,
        totalPages: 1,
        chunks: [
          {
            id: 'c-note-1',
            documentId: 'doc-unpaged-notes',
            chunkIndex: 1,
            hasNativePage: false,
            text: 'บันทึกการเรียนรู้รายวิชา DTM สำหรับการสอบกลางภาค',
            charCount: 50
          }
        ]
      };

      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'เนื้อหาในหน้า 3 มีอะไรบ้าง' }],
          searchMode: 'document',
          offlineMode: true,
          documentContext: unpagedDoc
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.reason).toBe('offline_mode_selected');
      expect(data.serviceStatus.servedMode).toBe('offline_document_fallback');
      expect(data.source).toBe('academic_fallback');
      expect(data.source).not.toBe('document_grounding');
      expect(data.source).not.toBe('gemini_grounding');
      expect(data.text).toContain('เป็นบันทึกสรุปที่ไม่มีเลขหน้าต้นฉบับ');
      expect(data.text).not.toContain('โควตา');
      expect(data.text).not.toMatch(/\[หน้า\s*3\]|\[page\s*3\]|หน้า 3 มี/i);
    });

    // Test F: Online Document Missing
    it('Test F: online document mode without active document returns document_missing with 0 API calls', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'สรุปประเด็นสำคัญในเอกสาร' }],
          searchMode: 'document',
          offlineMode: false
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('document_missing');
      expect(data.serviceStatus.reason).toBe('active_document_missing');
      expect(data.source).toBe('academic_fallback');
      expect(data.source).not.toBe('document_grounding');
      expect(data.text).toContain('ยังไม่ได้เลือกเอกสาร');
      expect(data.text).toContain('คลังเอกสาร (Document Library)');
      expect(data.text).not.toContain('โควตา');
      expect(data.text).not.toContain('HTTP 429');
    });

    // Test G: Online Local Document Validation
    it('Test G: online unpaged document with page query returns local_document_validation with 0 API calls and no live AI', async () => {
      mockCalls = [];
      const unpagedDoc = {
        documentId: 'doc-unpaged-guideline',
        title: 'clinical-lab-manual.md',
        hasNativePages: false,
        totalPages: 1,
        chunks: [
          {
            id: 'c-manual-1',
            documentId: 'doc-unpaged-guideline',
            chunkIndex: 1,
            hasNativePage: false,
            text: 'คู่มือปฏิบัติงานห้องปฏิบัติการคลินิก ฉบับย่อ',
            charCount: 45
          }
        ]
      };

      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'เนื้อหาในหน้า 2 มีอะไรบ้าง' }],
          searchMode: 'document',
          offlineMode: false,
          documentContext: unpagedDoc
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(mockCalls.length).toBe(0);
      expect(data.serviceStatus.attemptsRun).toBe(0);
      expect(data.serviceStatus.isApiUnavailable).toBe(false);
      expect(data.serviceStatus.servedMode).toBe('local_document_validation');
      expect(data.serviceStatus.reason).toBe('deterministic_validation');
      expect(data.source).toBe('academic_fallback');
      expect(data.source).not.toBe('document_grounding');
      expect(data.source).not.toBe('gemini_grounding');
      expect(data.text).toContain('เป็นบันทึกสรุปที่ไม่มีเลขหน้าต้นฉบับ');
      expect(data.text).not.toMatch(/\[หน้า\s*2\]|\[page\s*2\]|หน้า 2 มี/i);
      expect(data.text).not.toContain('โควตา');
    });
  });

  // =========================================================================
  // Track B2: Learning Coverage, Study Workflows & Source Provenance Integration
  // =========================================================================
  describe('Track B2: Learning Coverage, Study Workflows & Source Provenance Integration', () => {
    it('H1. Catalog Integrity: contains exactly 28 topics across 3 groups, and all associated course codes exist in official 2567 curriculum', () => {
      const allTopics = getAllLearningTopics();
      expect(allTopics.length).toBe(28);

      expect(LEARNING_DOMAIN_GROUPS.length).toBe(3);
      const groupIds = LEARNING_DOMAIN_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual(['medical_foundations', 'medical_technology', 'digital_health_dtm']);

      const validCurriculumCodes = new Set(OFFICIAL_COURSES_2567.map((c) => c.code));

      for (const topic of allTopics) {
        expect(topic.id).toBeDefined();
        expect(topic.nameTh).toBeTruthy();
        expect(topic.nameEn).toBeTruthy();
        expect(topic.keywords.length).toBeGreaterThan(0);
        expect(topic.description).toBeTruthy();
        expect(['foundational', 'introductory', 'intermediate', 'advanced']).toContain(topic.recommendedLevel);
        expect(topic.contentAvailability).toBeDefined();

        // Strict 2567 curriculum alignment: every course code must exist in official curriculum
        for (const code of topic.associatedCurriculumCourseCodes) {
          expect(validCurriculumCodes.has(code)).toBe(true);
        }
      }

      // Check content availability breakdown
      const localKbTopics = allTopics.filter((t) => t.contentAvailability.hasLocalKnowledgeBase);
      const learningGuideTopics = allTopics.filter((t) => t.contentAvailability.hasLearningGuide);
      const onDemandOnlyTopics = allTopics.filter((t) => t.contentAvailability.isGeminiOnDemandOnly);

      expect(localKbTopics.length).toBeGreaterThan(0);
      expect(learningGuideTopics.length).toBe(7); // Topics linked with Learning Guide
      expect(onDemandOnlyTopics.length).toBeGreaterThan(0);
    });

    it('H2. Study Workflows: offers 6 workflows and synthesizes structured prompts correctly', () => {
      expect(STUDY_WORKFLOW_OPTIONS.length).toBe(6);
      const workflowIds = STUDY_WORKFLOW_OPTIONS.map((w) => w.id);
      expect(workflowIds).toEqual(['explain', 'compare', 'step_by_step', 'clinical_dtm_application', 'vocabulary', 'quiz_review']);

      const sampleTopic = getAllLearningTopics()[0];
      const prompt = buildStudyWorkflowPrompt(sampleTopic, 'compare');
      expect(prompt).toContain(sampleTopic.nameTh);
    });

    it('H3. Provenance Integrity (Mocked Gemini Online): successful mocked online inference returns contentOrigin gemini_live', async () => {
      mockCalls = [];
      setCustomGeminiMock(async (params) => {
        mockCalls.push({
          isDocumentGrounding: params.isDocumentGrounding,
          tools: params.tools
        });
        return {
          text: "ผลลัพธ์จำลองการทำงานของระบบหุ่นยนต์ช่วยผ่าตัด",
          candidates: [{
            groundingMetadata: {
              webSearchQueries: ["robotics surgery query"],
              groundingChunks: [{ web: { uri: "https://who.int/robotics", title: "WHO Robotics Guide" } }]
            }
          }]
        };
      });

      try {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'อธิบายการทำงานของระบบหุ่นยนต์ช่วยผ่าตัดในห้องผ่าตัดอัจฉริยะ' }],
            searchMode: 'web_search',
            offlineMode: false
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(mockCalls.length).toBe(1);
        expect(data.contentOrigin).toBe('gemini_live');
        expect(['gemini_grounding', 'gemini_standard']).toContain(data.source);
      } finally {
        setCustomGeminiMock(null);
      }
    });

    it('H4. Provenance & Answer Fidelity (Mocked User Document): rigorous verification of retrieval, evidence fidelity, answer fidelity, status aligned, empty unsupported claims, and reference support', async () => {
      mockCalls = [];
      setCustomGeminiMock(async (params) => {
        mockCalls.push({
          isDocumentGrounding: params.isDocumentGrounding,
          tools: params.tools
        });
        return {
          text: "จากเอกสาร Prefix brady- หมายถึง ช้า (Slow)",
          candidates: [{ groundingMetadata: { groundingChunks: [] } }]
        };
      });

      try {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'คำว่า brady- มีความหมายว่าอย่างไรในเอกสาร' }],
            searchMode: 'document',
            offlineMode: false,
            documentContext: sampleDocumentContext
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();

        // 1 & 2. Check mock was called in Document Grounding Mode and tools absent
        const lastCall = mockCalls[mockCalls.length - 1];
        expect(lastCall).toBeDefined();
        expect(lastCall.isDocumentGrounding).toBe(true);
        expect(lastCall.tools).toBeUndefined();

        expect(data.contentOrigin).toBe('user_document');
        expect(['document_grounding', 'academic_fallback']).toContain(data.source);
        expect(data.text.toLowerCase()).toContain('brady-');
        expect(data.text).not.toContain('หุ่นยนต์ช่วยผ่าตัด');

        // 5. Verify Academic Verifier contract stages
        expect(data.verification).toBeDefined();
        expect(['PASS', 'WARNING']).toContain(data.verification.verdict);
        
        // Detailed stage assertions
        expect(data.verification.stages.retrieval.passed).toBe(true);
        expect(data.verification.stages.evidenceFidelity.passed).toBe(true);
        expect(data.verification.stages.answerFidelity.passed).toBe(true);
        expect(data.verification.stages.answerFidelity.status).toBe('aligned');
        expect(data.verification.stages.answerFidelity.unsupportedClaims.length).toBe(0);
        expect(data.verification.stages.answerFidelity.contradictions.length).toBe(0);

        // 6 & 7. Verify references support answer and have valid locators
        expect(Array.isArray(data.references)).toBe(true);
        expect(data.references.length).toBeGreaterThan(0);
        for (const ref of data.references) {
          expect(ref.type).toBe('document_chunk');
          expect(ref.linkAccessStatus).toBe('verified_local');
          expect(ref.evidenceLocator).toBeDefined();
        }
      } finally {
        setCustomGeminiMock(null);
      }
    });

    it('H4b. Negative Test (Absent/Unsupported Query): verifier must not give PASS when query asks about topic absent from document', async () => {
      mockCalls = [];
      setCustomGeminiMock(async (params) => {
        return {
          text: "ทฤษฎีควอนตัมฟิสิกส์และการแผ่รังสีของวัตถุดำ",
          candidates: [{ groundingMetadata: { groundingChunks: [] } }]
        };
      });

      try {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'ทฤษฎีควอนตัมฟิสิกส์และการแผ่รังสีของวัตถุดำ' }],
            searchMode: 'document',
            offlineMode: false,
            documentContext: sampleDocumentContext
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.verification).toBeDefined();
        expect(data.verification.verdict).toBe('INSUFFICIENT_EVIDENCE');
        expect(data.verification.stages.answerFidelity.status).toBe('insufficient_evidence');
      } finally {
        setCustomGeminiMock(null);
      }
    });

    it('H5. Provenance Integrity (Local Knowledge Base): offline static fallback returns contentOrigin local_knowledge_base and rich localContentMetadata', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ความแตกต่างระหว่าง Serum และ Plasma' }],
          searchMode: 'web_search',
          offlineMode: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(mockCalls.length).toBe(0);
      expect(data.contentOrigin).toBe('local_knowledge_base');
      expect(data.source).toBe('academic_fallback');
      expect(data.localContentMetadata).toBeDefined();
      expect(data.localContentMetadata.contentId).toBe('kb-serum-plasma-01');
      expect(data.localContentMetadata.version).toBe('1.2');
      expect(data.localContentMetadata.verificationStatus).toBe('verified_knowledge_base');
      expect(data.localContentMetadata.referencesCount).toBeGreaterThan(0);
    });

    it('H6. Study Workflow Parameter: endpoint receives studyWorkflow parameter and executes smoothly', async () => {
      mockCalls = [];
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'เปรียบเทียบ Serum และ Plasma' }],
          searchMode: 'web_search',
          offlineMode: true,
          studyWorkflow: 'compare'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contentOrigin).toBe('local_knowledge_base');
      expect(data.text).toContain('Serum');
      expect(data.text).toContain('Plasma');
    });

    it('H7. Invalid Study Workflow: endpoint rejects invalid workflow types and values with HTTP 400', async () => {
      for (const invalidWf of ['invalid_workflow_test', 123, 'unknown', ' ', false, 0, true, [], {}]) {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'อธิบายข้อมูล' }],
            searchMode: 'web_search',
            studyWorkflow: invalidWf
          })
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
      }
    });

    it('H7b. Study Workflow Null, Empty, or Omitted: executes successfully without error', async () => {
      for (const wfValue of [null, '', undefined]) {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'ความแตกต่างระหว่าง Serum และ Plasma' }],
            searchMode: 'web_search',
            offlineMode: true,
            studyWorkflow: wfValue
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.text).toBeDefined();
      }
    });

    it('H8. Document Missing Provenance: document missing state returns contentOrigin as undefined instead of local_knowledge_base', async () => {
      for (const offline of [false, true]) {
        const res = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'สรุปเอกสาร' }],
            searchMode: 'document',
            offlineMode: offline,
            documentContext: undefined
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.source).toBe('academic_fallback');
        expect(data.contentOrigin).toBeUndefined();
      }
    });

    it('H9. General Concept & General Fallback Provenance: general_concept and unverified topics must not be classified as local_knowledge_base', async () => {
      // 9a. General Concept topic (e.g. dtm course starter) -> contentOrigin should be undefined
      const fallbackConcept = getAcademicFallback('เริ่มเรียนรายวิชา DTM');
      const resConcept = formatFallbackResponse({
        fallback: fallbackConcept,
        isDocumentGrounding: false,
        isOfflineMode: true,
        attemptsRun: 0
      });
      expect(resConcept.contentOrigin).toBeUndefined();
      expect(fallbackConcept.localContentMetadata?.verificationStatus).toBe('general_concept');

      // 9b. General Fallback topic (unmatched) -> contentOrigin should be undefined
      const fallbackGeneral = getAcademicFallback('ประวัติศาสตร์การแพทย์แผนโบราณในยุคกลาง');
      const resGeneral = formatFallbackResponse({
        fallback: fallbackGeneral,
        isDocumentGrounding: false,
        isOfflineMode: true,
        attemptsRun: 0
      });
      expect(resGeneral.contentOrigin).toBeUndefined();
      expect(fallbackGeneral.localContentMetadata?.verificationStatus).toBe('unverified');

      // 9c. Verified Curriculum topic -> contentOrigin should be local_knowledge_base
      const fallbackCurriculum = getAcademicFallback('ระบบสารสนเทศสุขภาพ');
      const resCurriculum = formatFallbackResponse({
        fallback: fallbackCurriculum,
        isDocumentGrounding: false,
        isOfflineMode: true,
        attemptsRun: 0
      });
      expect(resCurriculum.contentOrigin).toBe('local_knowledge_base');
      expect(fallbackCurriculum.localContentMetadata?.verificationStatus).toBe('verified_curriculum');
    });

    it('H10. Evidence-Based 6-Workflow & Multi-Mode Content Integration: verifies content extraction, structuring, negative evidence handling, and verification consistency across all 4 modes', async () => {
      const workflows = ['explain', 'compare', 'step_by_step', 'clinical_dtm_application', 'vocabulary', 'quiz_review'];
      
      const richDocContext = {
        title: "คู่มือปฏิบัติการเทคนิคการแพทย์",
        hasNativePages: true,
        totalPages: 5,
        chunks: [
          {
            chunkIndex: 1,
            pageNumber: 2,
            text: "ขั้นตอนที่ 1 เก็บตัวอย่างเลือดใส่หลอด EDTA สำหรับตรวจ CBC. ขั้นตอนที่ 2 ปั่นแยกพลาสมา. Serum ต่างจาก Plasma ตรงที่ Serum ปราศจาก Fibrinogen ขณะที่ Plasma มีแฟคเตอร์การแข็งตัวครบถ้วน. การประยุกต์ใช้ในคลินิก: ใช้ในระบบสารสนเทศสุขภาพ Electronic Health Record (EHR) และ PACS"
          }
        ]
      };

      // 1. Offline Document Grounding with rich content & actual content tests
      for (const wf of workflows) {
        const resDocOff = await fetch(`${baseUrl}/api/gemini/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: 'ความแตกต่างระหว่าง Serum และ Plasma และขั้นตอนการทำงาน' }],
            searchMode: 'document',
            offlineMode: true,
            documentContext: richDocContext,
            studyWorkflow: wf
          })
        });
        expect(resDocOff.status).toBe(200);
        const dataDocOff = await resDocOff.json();
        expect(dataDocOff.text).toBeDefined();
        expect(dataDocOff.verification).toBeDefined();
        if (wf === 'compare') {
          expect(dataDocOff.text).toContain('ประเด็นการเปรียบเทียบที่สกัด');
          expect(dataDocOff.text).toContain('Serum');
        } else if (wf === 'step_by_step') {
          expect(dataDocOff.text).toContain('ลำดับขั้นตอนตามข้อมูลต้นทาง');
        } else if (wf === 'vocabulary') {
          expect(dataDocOff.text).toContain('การสกัดศัพท์เทคนิค');
        } else if (wf === 'quiz_review') {
          expect(dataDocOff.text).toContain('แบบฝึกหัดทบทวนความรู้');
        }
      }

      // 2. Negative Evidence / Insufficient content test in document mode
      const sparseDocContext = {
        title: "เอกสารสรุปสั้น",
        hasNativePages: true,
        totalPages: 1,
        chunks: [
          { chunkIndex: 1, pageNumber: 1, text: "ข้อมูลทั่วไปเรื่องทฤษฎีพื้นฐาน ไม่มีรายละเอียดเกี่ยวกับการปฏิบัติงาน" }
        ]
      };
      const resSparse = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ขั้นตอนการทำงาน' }],
          searchMode: 'document',
          offlineMode: true,
          documentContext: sparseDocContext,
          studyWorkflow: 'step_by_step'
        })
      });
      expect(resSparse.status).toBe(200);
      const dataSparse = await resSparse.json();
      expect(dataSparse.text).toContain('ไม่พบข้อมูล');

      // 3. Online General & Online Document Grounding (4 Mode Paths Coverage)
      let capturedInstruction = '';
      setCustomGeminiMock(async (params) => {
        capturedInstruction = params.systemInstruction || '';
        return { text: "Mocked workflow response", candidates: [] };
      });

      try {
        // Online General
        for (const wf of workflows) {
          capturedInstruction = '';
          const resOnline = await fetch(`${baseUrl}/api/gemini/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', text: 'Serum และ Plasma' }],
              searchMode: 'web_search',
              offlineMode: false,
              studyWorkflow: wf
            })
          });
          expect(resOnline.status).toBe(200);
          expect(capturedInstruction).toContain('Study Workflow');
        }

        // Online Document Grounding
        for (const wf of workflows) {
          capturedInstruction = '';
          const resDocOn = await fetch(`${baseUrl}/api/gemini/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', text: 'Serum และ Plasma' }],
              searchMode: 'document',
              offlineMode: false,
              documentContext: richDocContext,
              studyWorkflow: wf
            })
          });
          expect(resDocOn.status).toBe(200);
          expect(capturedInstruction).toContain('Document-Grounded Learning Assistant');
          expect(capturedInstruction).toContain('Study Workflow');
        }

      } finally {
        setCustomGeminiMock(null);
      }
    });
  });
});

