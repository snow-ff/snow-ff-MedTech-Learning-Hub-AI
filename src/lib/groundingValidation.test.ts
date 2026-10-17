import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chunkText,
  retrieveGroundedChunks,
  buildGroundingContext
} from './documentChunker';
import {
  saveDocument,
  getStorageStatus,
  StorageQuotaExceededError,
  clearAllDocuments
} from './documentStorage';
import { extractTextFromPdfBinaryFallback, extractTextFromFile } from './pdfExtractor';
import { getAcademicFallback } from '../../server';
import { DocumentChunk, LearningDocument } from '../models/coreModel';

describe('Track B1.2: Academic Grounding Validation', () => {
  beforeEach(async () => {
    await clearAllDocuments();
  });

  describe('1. Evidence Distinction: Sufficient vs Insufficient', () => {
    const clinicalChunks: DocumentChunk[] = [
      {
        id: 'chunk-1',
        documentId: 'doc-cbc',
        chunkIndex: 1,
        pageNumber: 1,
        hasNativePage: true,
        text: 'การตรวจความสมบูรณ์ของเม็ดเลือด (Complete Blood Count: CBC) ประกอบด้วยการวัดระดับฮีโมโกลบิน (Hemoglobin) ค่าฮีมาโตคริต (Hematocrit) และการนับจำนวนเม็ดเลือดขาว (White Blood Cell Count)',
        charCount: 198
      },
      {
        id: 'chunk-2',
        documentId: 'doc-cbc',
        chunkIndex: 2,
        pageNumber: 2,
        hasNativePage: true,
        text: 'ค่าอ้างอิงของฮีโมโกลบินในเพศชายปกติคือ 13.0 - 17.5 g/dL และเพศหญิงคือ 12.0 - 15.5 g/dL ตามเกณฑ์ของ WHO และ ICSH',
        charCount: 122
      }
    ];

    it('should correctly flag hasEvidence: true when query terms exist in chunks', () => {
      const result = retrieveGroundedChunks(clinicalChunks, 'ค่าปกติของฮีโมโกลบินในเพศชายคือเท่าไหร่', 2);
      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks.length).toBeGreaterThan(0);
      expect(result.relevantChunks[0].text).toContain('ฮีโมโกลบิน');
      expect(result.matchedKeywords).toContain('ฮีโมโกลบิน');
    });

    it('should correctly flag hasEvidence: false when query is unrelated to the document', () => {
      const result = retrieveGroundedChunks(clinicalChunks, 'ทฤษฎีควอนตัมฟิสิกส์และสัมพัทธภาพทั่วไป', 2);
      expect(result.hasEvidence).toBe(false);
      expect(result.maxScore).toBe(0);
    });

    it('should provide strict anti-hallucination response in academic fallback when evidence is insufficient', () => {
      const fallback = getAcademicFallback('ขอทฤษฎีสัมพัทธภาพของไอน์สไตน์', [], {
        title: 'คู่มือโลหิตวิทยา CBC',
        courseCode: 'DTM101',
        chunks: clinicalChunks
      });

      expect(fallback.evidenceStatus).toBe('insufficient');
      expect(fallback.text).toContain('ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Anti-Hallucination)');
      expect(fallback.text).toContain('คู่มือโลหิตวิทยา CBC');
    });

    it('should synthesize answer and cite genuine chunk when evidence is sufficient', () => {
      const fallback = getAcademicFallback('ฮีโมโกลบิน ผู้ชาย ปกติเท่าไหร่', [], {
        title: 'คู่มือโลหิตวิทยา CBC',
        courseCode: 'DTM101',
        chunks: clinicalChunks
      });

      expect(fallback.evidenceStatus).toBe('sufficient');
      expect(fallback.text).toContain('คำตอบสรุปจากเอกสารการเรียนรู้');
      expect(fallback.text).toContain('หน้า 2');
      expect(fallback.text).toContain('13.0 - 17.5 g/dL');
    });

    it('should reject queries containing only common Thai stopwords without medical substance', () => {
      const result = retrieveGroundedChunks(clinicalChunks, 'และ หรือ ของ ใน การ คือ', 2);
      expect(result.hasEvidence).toBe(false);
      expect(result.maxScore).toBe(0);
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('should extract and match continuous unspaced Thai medical compound terms', () => {
      const result = retrieveGroundedChunks(clinicalChunks, 'การวัดค่าฮีมาโตคริตประกอบด้วยอะไรบ้าง', 2);
      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].text).toContain('ฮีมาโตคริต');
      expect(result.matchedKeywords.some(k => k.includes('ฮีมาโตคริต'))).toBe(true);
    });
  });

  describe('2. Source Page Fidelity: No Artificial Page Numbers', () => {
    it('should NOT assign page numbers to unpaged notes or markdown text', () => {
      const rawLectureNote = `# สรุปการเรียนวิชา DTM101
หัวข้อ: มาตรฐานข้อมูลสุขภาพ HL7 FHIR
Resource หลักที่ใช้แลกเปลี่ยนผลแล็บคือ Observation และ DiagnosticReport`;

      const chunks = chunkText(rawLectureNote, { documentId: 'note-fhir' });

      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.pageNumber).toBeUndefined();
        expect(chunk.hasNativePage).toBe(false);
      }
    });

    it('should preserve genuine 1-indexed page numbers for documents with real pages', () => {
      const pdfPages = [
        'Page 1: Title and Overview of Clinical Chemistry',
        'Page 2: Glucose and Lipid Profile Reference Ranges',
        'Page 3: Kidney Function Tests (BUN, Creatinine, eGFR)'
      ];

      const chunks = chunkText('', { documentId: 'pdf-lab', pages: pdfPages });

      expect(chunks).toHaveLength(3);
      expect(chunks[0].pageNumber).toBe(1);
      expect(chunks[0].hasNativePage).toBe(true);
      expect(chunks[1].pageNumber).toBe(2);
      expect(chunks[1].hasNativePage).toBe(true);
      expect(chunks[2].pageNumber).toBe(3);
      expect(chunks[2].hasNativePage).toBe(true);
    });

    it('should format grounding context without fake pages when pageNumber is undefined', () => {
      const noteChunk: DocumentChunk = {
        id: 'chunk-n1',
        documentId: 'doc-note',
        chunkIndex: 1,
        pageNumber: undefined,
        hasNativePage: false,
        text: 'HL7 FHIR Observation resource represents clinical lab findings.',
        charCount: 65
      };

      const context = buildGroundingContext('สรุป HL7 FHIR', [noteChunk]);
      expect(context).toContain('[ส่วนอ้างอิง: ชิ้นส่วนที่ 1]:');
      expect(context).not.toContain('| หน้า');
    });
  });

  describe('3. Unreadable Document & Boundary Handling', () => {
    it('should return empty pages without injecting fake text when binary fallback finds no text', () => {
      // Create empty buffer
      const emptyBuffer = new ArrayBuffer(64);
      const result = extractTextFromPdfBinaryFallback(emptyBuffer);

      expect(result.pages).toEqual([]);
      expect(result.totalText).toBe('');
    });

    it('should mark completely empty text file as isReadable: false', async () => {
      const emptyFile = new File(['   '], 'empty_notes.txt', { type: 'text/plain' });
      const result = await extractTextFromFile(emptyFile);

      expect(result.isReadable).toBe(false);
      expect(result.unreadableReason).toBeDefined();
    });

    it('should preserve Thai text without infinite loop and split at reasonable boundaries', () => {
      const longThaiText = 'การทดสอบความไวต่อยาต้านจุลชีพตามเกณฑ์มาตรฐานสากลของCLSIและEUCASTมีความสำคัญยิ่งต่อการเลือกใช้ยาปฏิชีวนะในการรักษาผู้ป่วยติดเชื้อในกระแสเลือด'.repeat(15);
      const chunks = chunkText(longThaiText, { maxChunkChars: 300, overlapChars: 50 });

      expect(chunks.length).toBeGreaterThan(1);
      for (const c of chunks) {
        expect(c.charCount).toBeLessThanOrEqual(350);
        expect(c.text.length).toBeGreaterThan(0);
      }
    });
  });

  describe('4. Storage Quota Error Propagation', () => {
    it('should report storage status accurately', () => {
      const status = getStorageStatus();
      expect(['indexedDB', 'localStorage', 'memory']).toContain(status.mode);
      expect(typeof status.isPersistent).toBe('boolean');
    });

    it('should throw StorageQuotaExceededError instead of silently losing data when localStorage quota fails', async () => {
      const mockDoc: LearningDocument = {
        id: 'large-doc-test',
        title: 'Large Pathology Atlas',
        type: 'pdf',
        fileSize: 10 * 1024 * 1024,
        totalChars: 500000,
        chunks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Safely manage globalThis.window in Node/Vitest environment
      const globalObj = globalThis as any;
      const hadWindow = typeof globalObj.window !== 'undefined';
      const prevWindow = globalObj.window;

      const mockLocalStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new DOMException('QuotaExceededError');
        }),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      globalObj.window = {
        localStorage: mockLocalStorage,
        indexedDB: undefined // force localStorage fallback mode
      };

      try {
        await expect(saveDocument(mockDoc)).rejects.toThrow(StorageQuotaExceededError);
      } finally {
        if (hadWindow) {
          globalObj.window = prevWindow;
        } else {
          delete globalObj.window;
        }
      }
    });
  });
});
