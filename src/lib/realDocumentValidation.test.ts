import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chunkText,
  retrieveGroundedChunks,
  buildGroundingContext,
  MEDTECH_BILINGUAL_SYNONYMS
} from './documentChunker';
import {
  saveDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  clearAllDocuments,
  StorageQuotaExceededError
} from './documentStorage';
import { getAcademicFallback } from '../../server';
import { DocumentChunk, LearningDocument } from '../models/coreModel';

// Realistic Benchmark Documents for MedTech Learning
const REAL_HEMATOLOGY_PDF_PAGES = [
  // Page 1: Overview and Specimen Collection
  'Clinical Hematology Laboratory Manual - Section 1: Complete Blood Count (CBC) and Blood Collection. Specimen collection requires a Lavender top tube containing K2-EDTA anticoagulant. Proper mixing by inverting 8-10 times prevents microclot formation which leads to erroneous automated platelet counts.',
  // Page 2: Normal Reference Ranges
  'Section 2: Adult Reference Ranges according to ICSH and WHO standards. Hemoglobin (Hb): Male 13.0 - 17.5 g/dL, Female 12.0 - 15.5 g/dL. Hematocrit (Hct): Male 40 - 52%, Female 36 - 48%. Red Blood Cell (RBC) count: Male 4.5 - 5.9 x 10^6/uL, Female 4.0 - 5.2 x 10^6/uL.',
  // Page 3: WBC Differential and Platelets
  'Section 3: White Blood Cell (WBC) and Platelet Parameters. Normal total WBC count is 4,500 - 11,000 cells/uL with differential count of Neutrophils (50-70%), Lymphocytes (20-40%), Monocytes (2-8%), Eosinophils (1-4%), and Basophils (0.5-1%). Normal Platelet count is 150,000 - 450,000 /uL.'
];

const REAL_QC_LECTURE_NOTE = `# บันทึกสรุปการควบคุมคุณภาพห้องปฏิบัติการทางการแพทย์ (Internal Quality Control: IQC)
หัวข้อ: กฎการแปลผล Westgard Multirule System
1. กฎ 1(2s): ค่าควบคุม 1 ค่าหลุดออกนอกช่วง +/- 2SD ใช้เป็น Warning rule เท่านั้น ห้องแล็บยังคงวิเคราะห์ตัวอย่างต่อได้แต่ต้องเฝ้าระวัง
2. กฎ 1(3s): ค่าควบคุม 1 ค่าออกนอกช่วง +/- 3SD บ่งชี้ Random Error หรือ Systematic Error รุนแรง ต้องปฏิเสธผลการทดสอบ (Reject run) ทันที
3. กฎ 2(2s): ค่าควบคุม 2 ค่าติดต่อกันออกนอกช่วง +/- 2SD ไปในทิศทางเดียวกัน บ่งบอก Systematic Error ต้องหยุดและหาสาเหตุ
4. กฎ R(4s): ค่าควบคุม 2 ค่าในรอบเดียวกันมีผลต่างกันเกิน 4SD (เช่น ค่าแรก +2.2SD อีกค่า -2.1SD) บ่งชี้ Random Error ชัดเจน
5. กฎ 4(1s) และ 10(x): ค่าควบคุม 4 ค่าติดต่อกันเกิน 1SD หรือ 10 ค่าติดต่อกันอยู่ฝั่งเดียวกันของค่าเฉลี่ย บ่งชี้ Systematic Shift หรือ Systematic Bias จากน้ำยาเสื่อมหรือ Calibrator คลาดเคลื่อน`;

describe('Track B1.3: Real-Document Learning Validation', () => {
  let hematologyPdfChunks: DocumentChunk[];
  let qcNoteChunks: DocumentChunk[];

  beforeEach(async () => {
    await clearAllDocuments();

    // Chunk real multi-page PDF (native pages 1, 2, 3)
    hematologyPdfChunks = chunkText('', {
      documentId: 'doc-real-hema-pdf',
      pages: REAL_HEMATOLOGY_PDF_PAGES
    });

    // Chunk unpaged lecture note (no native pages)
    qcNoteChunks = chunkText(REAL_QC_LECTURE_NOTE, {
      documentId: 'doc-real-qc-note',
      maxChunkChars: 600,
      overlapChars: 80
    });
  });

  // =========================================================================
  // Layer 1: Direct Queries (ถามตรงกับเอกสาร)
  // =========================================================================
  describe('Layer 1: Direct Queries (ถามตรงกับเอกสาร)', () => {
    it('should retrieve the exact target chunk with highest score for reference ranges query', () => {
      const query = 'adult reference ranges for hemoglobin and hematocrit';
      const result = retrieveGroundedChunks(hematologyPdfChunks, query, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks.length).toBeGreaterThan(0);

      // Top chunk MUST be Page 2 where reference ranges are defined
      const topChunk = result.relevantChunks[0];
      expect(topChunk.pageNumber).toBe(2);
      expect(topChunk.hasNativePage).toBe(true);
      expect(topChunk.text).toContain('Hemoglobin');
      expect(topChunk.text).toContain('13.0 - 17.5 g/dL');
    });

    it('should retrieve specimen tube chunk when asked directly about lavender top and EDTA', () => {
      const query = 'lavender top tube EDTA anticoagulant';
      const result = retrieveGroundedChunks(hematologyPdfChunks, query, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].pageNumber).toBe(1);
      expect(result.relevantChunks[0].text).toContain('Lavender top tube');
      expect(result.relevantChunks[0].text).toContain('K2-EDTA');
    });

    it('should retrieve the Westgard rule chunks when asked about 1(3s) and R(4s)', () => {
      const query = 'กฎ 1(3s) และ R(4s) ใน Westgard Multirule';
      const result = retrieveGroundedChunks(qcNoteChunks, query, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks.length).toBeGreaterThanOrEqual(2);

      const allRetrievedText = result.relevantChunks.map(c => c.text).join('\n');
      expect(allRetrievedText).toContain('1(3s)');
      expect(allRetrievedText).toContain('R(4s)');
    });
  });

  // =========================================================================
  // Layer 2: Cross-Lingual Terminology (ถามโดยใช้ศัพท์ไทยแทนศัพท์อังกฤษ)
  // =========================================================================
  describe('Layer 2: Cross-Lingual Terminology (ถามโดยใช้ศัพท์ไทยแทนศัพท์อังกฤษ)', () => {
    it('should retrieve English CBC tube chunk when query uses Thai term "ความสมบูรณ์ของเม็ดเลือด"', () => {
      const thaiQuery = 'การตรวจความสมบูรณ์ของเม็ดเลือดต้องใช้หลอดเก็บเลือดสีอะไร';
      const result = retrieveGroundedChunks(hematologyPdfChunks, thaiQuery, 3);

      // Must find Page 1 describing CBC and Lavender top tube via synonym expansion
      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].pageNumber).toBe(1);
      expect(result.relevantChunks[0].text).toContain('Complete Blood Count');
      expect(result.relevantChunks[0].text).toContain('Lavender top tube');
    });

    it('should retrieve English reference range chunk when query uses Thai term "เม็ดเลือดแดง"', () => {
      const thaiQuery = 'ค่าปกติของเซลล์เม็ดเลือดแดงในเพศชายและหญิง';
      const result = retrieveGroundedChunks(hematologyPdfChunks, thaiQuery, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].pageNumber).toBe(2);
      expect(result.relevantChunks[0].text).toContain('Red Blood Cell');
    });

    it('should retrieve English WBC and platelet chunk when query uses Thai term "เกล็ดเลือด"', () => {
      const thaiQuery = 'เกล็ดเลือด ปกติมีค่าเท่าไหร่ในร่างกาย';
      const result = retrieveGroundedChunks(hematologyPdfChunks, thaiQuery, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].pageNumber).toBe(3);
      expect(result.relevantChunks[0].text).toContain('Platelet');
      expect(result.relevantChunks[0].text).toContain('150,000 - 450,000');
    });

    it('should retrieve English Random Error rule when query uses Thai "ความผิดพลาดแบบสุ่ม"', () => {
      const thaiQuery = 'ความผิดพลาดแบบสุ่มในการควบคุมคุณภาพแล็บ';
      const result = retrieveGroundedChunks(qcNoteChunks, thaiQuery, 3);

      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks[0].text).toContain('Random Error');
    });
  });

  // =========================================================================
  // Layer 3: Anti-Hallucination on Out-of-Scope Queries (สิ่งที่เอกสารไม่มีคำตอบ)
  // =========================================================================
  describe('Layer 3: Anti-Hallucination on Out-of-Scope Queries (สิ่งที่เอกสารไม่มีคำตอบ)', () => {
    it('should strictly return hasEvidence: false when query asks about quantum physics', () => {
      const unrelatedQuery = 'ทฤษฎีควอนตัมฟิสิกส์ สมการชเรอดิงเงอร์และกลศาสตร์ควอนตัม';
      const result = retrieveGroundedChunks(hematologyPdfChunks, unrelatedQuery, 3);

      expect(result.hasEvidence).toBe(false);
      expect(result.maxScore).toBe(0);
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('should strictly return hasEvidence: false when query asks about general history', () => {
      const unrelatedQuery = 'ประวัติศาสตร์การสร้างพีระมิดในอียิปต์โบราณ';
      const result = retrieveGroundedChunks(qcNoteChunks, unrelatedQuery, 3);

      expect(result.hasEvidence).toBe(false);
      expect(result.maxScore).toBe(0);
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('should generate strict anti-hallucination refusal in academic fallback for out-of-scope question', () => {
      const fallback = getAcademicFallback('ขอสูตรอินทิกรัลสามชั้นในวิชาแคลคูลัส', [], {
        title: 'คู่มือโลหิตวิทยา CBC',
        courseCode: 'DTM101',
        chunks: hematologyPdfChunks
      });

      expect(fallback.evidenceStatus).toBe('insufficient');
      expect(fallback.text).toContain('ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Anti-Hallucination)');
      expect(fallback.text).toContain('MedTech Learning Hub AI ยึดหลักความถูกต้องทางวิชาการ จึงไม่มีการคาดเดาหรือแต่งคำตอบขึ้นมาเอง');
    });
  });

  // =========================================================================
  // Layer 4: Source Page Fidelity (ตรวจสอบเลขหน้าอ้างอิง)
  // =========================================================================
  describe('Layer 4: Source Page Fidelity (ตรวจสอบเลขหน้าอ้างอิง)', () => {
    it('should preserve genuine 1-indexed page numbers for PDF chunks', () => {
      expect(hematologyPdfChunks[0].pageNumber).toBe(1);
      expect(hematologyPdfChunks[0].hasNativePage).toBe(true);

      expect(hematologyPdfChunks[1].pageNumber).toBe(2);
      expect(hematologyPdfChunks[1].hasNativePage).toBe(true);

      expect(hematologyPdfChunks[2].pageNumber).toBe(3);
      expect(hematologyPdfChunks[2].hasNativePage).toBe(true);
    });

    it('should format PDF grounding context with exact genuine page numbers', () => {
      const context = buildGroundingContext('คู่มือโลหิตวิทยา', [hematologyPdfChunks[1]]);

      expect(context).toContain('[ส่วนอ้างอิง: ชิ้นส่วนที่ 2 | หน้า 2]:');
      expect(context).toContain('Hemoglobin (Hb): Male 13.0 - 17.5 g/dL');
    });

    it('should strictly NOT format fake page numbers for unpaged lecture notes', () => {
      for (const chunk of qcNoteChunks) {
        expect(chunk.pageNumber).toBeUndefined();
        expect(chunk.hasNativePage).toBe(false);
      }

      const noteContext = buildGroundingContext('สรุป Westgard Rules', qcNoteChunks);
      expect(noteContext).toContain('[ส่วนอ้างอิง: ชิ้นส่วนที่ 1]:');
      expect(noteContext).not.toContain('| หน้า');
    });
  });

  // =========================================================================
  // Layer 5: Separation of Retrieval vs Model Metrics (แยกผล Retrieval ออกจากโมเดล)
  // =========================================================================
  describe('Layer 5: Separation of Retrieval vs Model Metrics (แยกผล Retrieval ออกจากโมเดล)', () => {
    it('should verify retrieval precision and recall independently of generative LLM calls', () => {
      // Ground Truth mapping: (query -> expected target page)
      const benchmarkCases = [
        { query: 'Lavender EDTA tube inversion', expectedPage: 1 },
        { query: 'Hemoglobin hematocrit male female reference range', expectedPage: 2 },
        { query: 'Platelet and WBC differential count', expectedPage: 3 }
      ];

      let correctRetrievals = 0;
      for (const testCase of benchmarkCases) {
        const retrieval = retrieveGroundedChunks(hematologyPdfChunks, testCase.query, 1);
        if (retrieval.hasEvidence && retrieval.relevantChunks[0]?.pageNumber === testCase.expectedPage) {
          correctRetrievals++;
        }
      }

      const recallRate = correctRetrievals / benchmarkCases.length;
      expect(recallRate).toBe(1.0); // 100% Top-1 retrieval accuracy on benchmark
    });

    it('should verify fallback citation structure without calling live Gemini API', () => {
      const fallback = getAcademicFallback('ฮีโมโกลบิน ผู้ชาย ปกติเท่าไหร่', [], {
        title: 'คู่มือโลหิตวิทยา CBC',
        chunks: hematologyPdfChunks
      });

      // Assert verified citation structure
      expect(fallback.evidenceStatus).toBe('sufficient');
      expect(fallback.text).toContain('• **[ส่วนอ้างอิง 2 | หน้า 2]**');
      expect(fallback.references?.[0].title).toContain('เอกสาร: คู่มือโลหิตวิทยา CBC');
      expect((fallback.references?.[0] as any).excerpt).toBeDefined();
    });
  });

  // =========================================================================
  // Layer 6: Data Persistence Across Simulated Reloads & Quota Handling
  // =========================================================================
  describe('Layer 6: Data Persistence Across Simulated Reloads & Quota Handling', () => {
    it('should persist and retrieve documents accurately across lifecycle', async () => {
      const testDoc: LearningDocument = {
        id: 'doc-persist-test',
        title: 'Clinical Hematology Manual 2026',
        filename: 'hematology_manual.pdf',
        fileSize: 15400,
        type: 'pdf',
        courseCode: 'DTM101',
        courseTitle: 'Introduction to Health Informatics',
        tags: ['โลหิตวิทยา', 'CBC'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalChars: 1200,
        totalPages: 3,
        hasNativePages: true,
        readabilityStatus: 'readable',
        chunks: hematologyPdfChunks
      };

      await saveDocument(testDoc);

      // Verify retrieval
      const fetched = await getDocumentById('doc-persist-test');
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe('Clinical Hematology Manual 2026');
      expect(fetched?.chunks).toHaveLength(3);
      expect(fetched?.hasNativePages).toBe(true);

      // Verify list retrieval
      const all = await getAllDocuments();
      expect(all.some(d => d.id === 'doc-persist-test')).toBe(true);

      // Clean up
      await deleteDocument('doc-persist-test');
      const afterDelete = await getDocumentById('doc-persist-test');
      expect(afterDelete).toBeNull();
    });

    it('should throw StorageQuotaExceededError when storage limit is breached in fallback mode', async () => {
      const largeDoc: LearningDocument = {
        id: 'doc-quota-test',
        title: 'Gigantic Pathology Slide Archive',
        type: 'pdf',
        fileSize: 25 * 1024 * 1024,
        totalChars: 1000000,
        chunks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

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
        indexedDB: undefined // simulate fallback mode
      };

      try {
        await expect(saveDocument(largeDoc)).rejects.toThrow(StorageQuotaExceededError);
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
