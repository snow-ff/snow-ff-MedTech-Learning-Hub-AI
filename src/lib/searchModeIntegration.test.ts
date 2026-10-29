import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'node:http';
import { app, getAcademicFallback, setCustomGeminiMock } from '../../server';
import fs from 'node:fs';
import path from 'node:path';

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
    for (const ref of data.references) {
      expect(ref.evidenceLocator).not.toBe('บทที่ 3');
      expect(ref.evidenceLocator).not.toBe('ชิ้นส่วนที่ 3');
      expect(ref.evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    }
  });
});
