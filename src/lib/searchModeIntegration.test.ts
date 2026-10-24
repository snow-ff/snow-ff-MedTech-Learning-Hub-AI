import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'node:http';
import { app, getAcademicFallback, setCustomGeminiMock } from '../../server';
import fs from 'node:fs';
import path from 'node:path';

describe('Track B1.7: Search Mode Integration & Verification Audit', () => {
  let server: Server;
  let baseUrl: string;

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
    setCustomGeminiMock(async () => {
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
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // Scenario 1: document mode + active document with chunks
  it('1. document mode + active document: strictly uses document evidence and never mixes web search', async () => {
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

    // Source must be grounded in document or academic fallback on document
    expect(['document_grounding', 'academic_fallback']).toContain(data.source);
    expect(data.references).toBeDefined();
    expect(Array.isArray(data.references)).toBe(true);

    if (data.references.length > 0) {
      for (const ref of data.references) {
        expect(ref.type).toBe('document_chunk');
        expect(ref.linkAccessStatus).toBe('verified_local');
        // Locator must point to actual chunk, not external web link
        expect(ref.evidenceLocator).toMatch(/ชิ้นส่วนที่\s*\d+|เอกสาร:/);
      }
    }
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
    expect(data.references).toEqual([]); // Zero external or fake references
    expect(data.text).toContain('ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Document Grounding)');
    expect(data.text).toContain('ระบบจึงไม่ค้นหาข้อมูลภายนอกมาปะปน');
  });

  // Scenario 2: web_search mode + active document present
  it('2. web_search mode + active document: performs web search and does not report web sources as document chunks', async () => {
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'เทคโนโลยี Flow Cytometry ในการวิเคราะห์เม็ดเลือดขาว' }],
        searchMode: 'web_search',
        documentContext: sampleDocumentContext // user has document selected, but toggled web_search
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Must NOT be document_grounding because user toggled web_search
    expect(data.source).not.toBe('document_grounding');

    // References must NOT be labeled as document chunks from the attached document
    if (data.references && data.references.length > 0) {
      for (const ref of data.references) {
        expect(ref.type).not.toBe('document_chunk');
        expect(ref.uri).not.toMatch(/^#chunk-/);
      }
    }
  }, 35000);

  // Scenario 3: document mode + NO document selected
  it('3. document mode + no document: cleanly warns user, returns insufficient evidence, and zero fake citations', async () => {
    const response = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'คำศัพท์ทางการแพทย์พื้นฐานคืออะไร' }],
        searchMode: 'document',
        documentContext: undefined // no document attached
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.source).toBe('academic_fallback');
    expect(data.evidenceStatus).toBe('insufficient');
    expect(data.references).toEqual([]); // Zero fabricated references
    expect(data.text).toContain('ยังไม่ได้เลือกเอกสาร Active Document');
    expect(data.text).toContain('โหมดติวอิงเอกสาร (Document Grounding)');
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
    expect(data.text).toContain('ยังไม่ได้เลือกเอกสาร Active Document');
    expect(data.text).not.toMatch(/หน้า\s*\d+/); // No fabricated page number
  });

  // Scenario 5: Multiple consecutive mode switches
  it('5. sequential requests with alternating modes: strictly honors the mode of each individual request', async () => {
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
    const dataA = await resA.json();
    expect(['document_grounding', 'academic_fallback']).toContain(dataA.source);
    if (dataA.references.length > 0) {
      expect(dataA.references[0].type).toBe('document_chunk');
    }

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
    const dataB = await resB.json();
    expect(dataB.source).not.toBe('document_grounding');
    if (dataB.references && dataB.references.length > 0) {
      expect(dataB.references[0].type).not.toBe('document_chunk');
    }

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
    const dataC = await resC.json();
    expect(['document_grounding', 'academic_fallback']).toContain(dataC.source);
    if (dataC.references.length > 0) {
      expect(dataC.references[0].type).toBe('document_chunk');
    }
  }, 45000);

  // Scenario 6: Gemini API failure / fallback behavior in each mode
  it('6. academic fallback integrity: fallback does not claim live web search or cite non-existent documents', () => {
    // Document fallback with context:
    const docFallback = getAcademicFallback('Prefix และ Suffix', undefined, sampleDocumentContext);
    expect(docFallback).toBeDefined();
    expect(docFallback.text).toContain('dtm67-111-source.md');

    // Web / General fallback with null context:
    const webFallback = getAcademicFallback('ความแตกต่างระหว่าง Serum และ Plasma', undefined, null as any);
    expect(webFallback).toBeDefined();
    // Must NOT claim to be from a non-existent document
    expect(webFallback.text).not.toContain('*(คำตอบสรุปจากเอกสารการเรียนรู้: "null")*');
    expect(webFallback.text).not.toContain('*(คำตอบสรุปจากเอกสารการเรียนรู้: "undefined")*');

    // General fallback references must be external links, not document chunks
    for (const ref of webFallback.references) {
      expect((ref as any).evidenceLocator).toBeUndefined();
      expect(ref.uri).toMatch(/^https?:\/\//);
    }
  });

  // Scenario 7: Verify mock parameters and isolation from external network calls
  it('7. mock parameter verification and zero external network calls: confirms mock receives expected isDocumentGrounding and references remain unverified', async () => {
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
    for (const ref of data.references) {
      expect(ref.verificationStatus).toBe('unverified');
    }
  });
});

