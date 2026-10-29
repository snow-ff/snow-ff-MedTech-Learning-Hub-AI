import { describe, it, expect } from 'vitest';
import {
  chunkText,
  rankRelevantChunks,
  buildGroundingContext,
  decodeHtmlEntities,
  retrieveGroundedChunks,
  extractRelevantExcerpt,
  validateAndResolveLocator
} from './documentChunker';
import { DocumentChunk } from '../models/coreModel';

describe('documentChunker', () => {
  describe('chunkText', () => {
    it('should split plain text into chunks with index and character count', () => {
      const sampleText = 'This is paragraph one about Clinical Chemistry.\n\nThis is paragraph two about QC Westgard rules.';
      const chunks = chunkText(sampleText, { documentId: 'doc-test-1', maxChunkChars: 100 });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].documentId).toBe('doc-test-1');
      expect(chunks[0].chunkIndex).toBe(1);
      expect(chunks[0].charCount).toBe(chunks[0].text.length);
      expect(chunks[0].pageNumber).toBeUndefined();
      expect(chunks[0].hasNativePage).toBe(false);
    });

    it('should maintain explicit page numbers when pre-extracted pages are supplied', () => {
      const pages = [
        'Page 1: Introduction to Hematology and Complete Blood Count.',
        'Page 2: Red Blood Cell Indices (MCV, MCH, MCHC) and their clinical significance.',
        'Page 3: White Blood Cell Differential Count (Neutrophils, Lymphocytes).'
      ];

      const chunks = chunkText('', { documentId: 'pdf-doc', pages, maxChunkChars: 500 });

      expect(chunks).toHaveLength(3);
      expect(chunks[0].pageNumber).toBe(1);
      expect(chunks[0].text).toContain('Hematology');
      expect(chunks[1].pageNumber).toBe(2);
      expect(chunks[1].text).toContain('MCV, MCH, MCHC');
      expect(chunks[2].pageNumber).toBe(3);
      expect(chunks[2].text).toContain('White Blood Cell');
    });

    it('should handle embedded page break markers in a single string', () => {
      const textWithPageBreaks = `--- Page 1 ---
Introduction to Medical Technology.

--- Page 2 ---
Biosafety levels (BSL-1 to BSL-4) in clinical laboratories.`;

      const chunks = chunkText(textWithPageBreaks, { documentId: 'paged-doc' });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0].pageNumber).toBe(1);
      expect(chunks[1].pageNumber).toBe(2);
    });

    it('should return empty array for empty or whitespace text', () => {
      const chunks = chunkText('   \n\n  ');
      expect(chunks).toEqual([]);
    });
  });

  describe('rankRelevantChunks', () => {
    const testChunks: DocumentChunk[] = [
      {
        id: 'c-1',
        documentId: 'd-1',
        chunkIndex: 1,
        pageNumber: 1,
        text: 'Fasting Plasma Glucose (FPG) normal range is 70 to 99 mg/dL according to ADA guidelines.',
        charCount: 89
      },
      {
        id: 'c-2',
        documentId: 'd-1',
        chunkIndex: 2,
        pageNumber: 2,
        text: 'Westgard rule 1(2s) is a warning rule when one control measurement exceeds 2 standard deviations.',
        charCount: 97
      },
      {
        id: 'c-3',
        documentId: 'd-1',
        chunkIndex: 3,
        pageNumber: 3,
        text: 'Gram-positive bacteria retain crystal violet iodine complex and stain purple due to thick peptidoglycan.',
        charCount: 105
      }
    ];

    it('should prioritize chunks matching the query keywords', () => {
      const ranked = rankRelevantChunks(testChunks, 'Westgard rules QC', 2);
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].id).toBe('c-2');
      expect(ranked[0].text).toContain('Westgard');
    });

    it('should score exact matches highest', () => {
      const ranked = rankRelevantChunks(testChunks, 'Fasting Plasma Glucose', 1);
      expect(ranked[0].id).toBe('c-1');
    });

    it('should return empty array when query does not match', () => {
      const ranked = rankRelevantChunks(testChunks, 'quantum physics mechanics', 2);
      expect(ranked).toHaveLength(0);
    });
  });

  describe('buildGroundingContext', () => {
    it('should format document title and chunks with page markers', () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'c-1',
          documentId: 'd-1',
          chunkIndex: 1,
          pageNumber: 2,
          text: 'HbA1c >= 6.5% indicates diabetes mellitus.',
          charCount: 42
        }
      ];

      const formatted = buildGroundingContext('Clinical Chemistry Guide', chunks, 'DTM101');
      expect(formatted).toContain('=== เอกสารอ้างอิง: Clinical Chemistry Guide (รหัสวิชา: DTM101) ===');
      expect(formatted).toContain('[ส่วนอ้างอิง: ชิ้นส่วนที่ 1 | หน้า 2]');
      expect(formatted).toContain('HbA1c >= 6.5%');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should decode hexadecimal, decimal, and named html entities correctly', () => {
      expect(decodeHtmlEntities('&#x33;3')).toBe('33');
      expect(decodeHtmlEntities('&#51;3')).toBe('33');
      expect(decodeHtmlEntities('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
    });
  });

  describe('retrieveGroundedChunks with mixed relevant and irrelevant chunks', () => {
    it('should correctly prioritize prefix/suffix relevant chunks over administrative or unrelated chunks', () => {
      const chunks: DocumentChunk[] = [
        { id: 'c1', documentId: 'd1', chunkIndex: 1, text: 'Notice of adaptation and disclaimer regarding copyright.', charCount: 56 },
        { id: 'c2', documentId: 'd1', chunkIndex: 2, text: 'Common Prefixes such as brady-, tachy-, dys-, sub- modify medical terms.', charCount: 65 },
        { id: 'c3', documentId: 'd1', chunkIndex: 3, text: 'Unrelated body cavities and anatomical standard positions text.', charCount: 57 },
        { id: 'c4', documentId: 'd1', chunkIndex: 4, text: 'Diagnostic Suffixes include -itis, -ectomy, and -scopy.', charCount: 54 }
      ];

      const result = retrieveGroundedChunks(chunks, 'prefix brady- suffix -itis', 2);
      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks.some(c => c.chunkIndex === 2)).toBe(true);
      expect(result.relevantChunks.some(c => c.chunkIndex === 4)).toBe(true);
    });
  });

  describe('extractRelevantExcerpt boundary regression for Thai and English', () => {
    it('should correctly preserve Thai leading vowels (เ, แ, โ, ใ, ไ) and tone marks in words like เรียน, แพทย์, แหล่งเรียนรู้ without mid-word truncation or stripping', () => {
      const text = 'บันทึกนี้จัดทำขึ้นเป็นแหล่งเรียนรู้เสริมสำหรับนักศึกษาแพทย์และบุคลากรทางการแพทย์ในการเรียนรู้เรื่องคำอุปสรรคและปัจจัยท้าย';
      const excerpt = extractRelevantExcerpt(text, 'เรียนรู้', 100);
      expect(excerpt).toContain('แหล่งเรียนรู้');
      expect(excerpt).not.toContain('อหล่ง');
    });

    it('should correctly handle English word boundaries and avoid mid-word truncation', () => {
      const text = 'Complete Blood Count (CBC) and Hemoglobin analysis are essential laboratory tests in hematology.';
      const excerpt = extractRelevantExcerpt(text, 'Hemoglobin', 100);
      expect(excerpt).toContain('Hemoglobin');
      const idx = excerpt.indexOf('Hemoglobin');
      if (idx > 0) {
        const charBefore = excerpt[idx - 1];
        expect(/[\s(]/.test(charBefore)).toBe(true);
      }
    });
  });

  describe('validateAndResolveLocator direct unit tests', () => {
    it('Case 1: หัวข้อจริง ส่วนที่ 3 และ Locator ชิ้นส่วนที่ 3 — ผ่าน (isVerified: true, locator: ส่วนที่ 3)', () => {
      const chunk = {
        text: '=== ส่วนที่ 3: Prefix ในการแพทย์ ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก',
        sourceLocator: 'ชิ้นส่วนที่ 3',
        sourceLocatorProvenance: 'source_heading'
      };
      const res = validateAndResolveLocator(chunk, true);
      expect(res.isVerified).toBe(true);
      expect(res.locator).toBe('ส่วนที่ 3');
      expect(res.provenance).toBe('source_heading');
    });

    it('Case 2: หัวข้อจริง ส่วนที่ 3 แต่ Locator ชิ้นส่วนที่ 13 และ chunkIndex = 13 — ไม่ผ่าน (isVerified: false)', () => {
      const chunk = {
        chunkIndex: 13,
        text: '=== ส่วนที่ 3: Prefix ในการแพทย์ ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก',
        sourceLocator: 'ชิ้นส่วนที่ 13',
        sourceLocatorProvenance: 'source_heading'
      };
      const res = validateAndResolveLocator(chunk, true);
      expect(res.isVerified).toBe(false);
      expect(res.locator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect(res.provenance).toBe('unconfirmed');
    });

    it('Case 3: ไม่มีหัวข้อจริง แต่มี chunkIndex = 13 และ sourceLocator = ชิ้นส่วนที่ 13 — ไม่ผ่าน (isVerified: false)', () => {
      const chunk = {
        chunkIndex: 13,
        text: 'ข้อความทั่วไปเกี่ยวกับศัพท์แพทย์โดยไม่มีหัวข้อส่วนหรือบทเรียน',
        sourceLocator: 'ชิ้นส่วนที่ 13',
        sourceLocatorProvenance: 'source_heading'
      };
      const res = validateAndResolveLocator(chunk, true);
      expect(res.isVerified).toBe(false);
      expect(res.locator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect(res.provenance).toBe('unconfirmed');
    });

    it('Case 4: Provenance ที่ไม่อนุญาต (เช่น made_up) หรือ unconfirmed — ไม่ผ่าน (isVerified: false)', () => {
      const chunkMadeUp = {
        text: '=== ส่วนที่ 3: Prefix ===\nข้อความ',
        sourceLocator: 'ชิ้นส่วนที่ 3',
        sourceLocatorProvenance: 'made_up'
      };
      const resMadeUp = validateAndResolveLocator(chunkMadeUp, true);
      expect(resMadeUp.isVerified).toBe(false);
      expect(resMadeUp.locator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');

      const chunkUnconfirmed = {
        text: '=== ส่วนที่ 3: Prefix ===\nข้อความ',
        sourceLocator: 'ชิ้นส่วนที่ 3',
        sourceLocatorProvenance: 'unconfirmed'
      };
      const resUnconfirmed = validateAndResolveLocator(chunkUnconfirmed, true);
      expect(resUnconfirmed.isVerified).toBe(false);
      expect(resUnconfirmed.locator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    });

    it('Case 5 (Test AP): pageNumber = 3 จากเอกสารที่มีเลขหน้าจริงต้องได้ evidenceLocator = หน้า 3', () => {
      const pagedChunk = {
        pageNumber: 3,
        hasNativePage: true,
        sourceLocatorProvenance: 'native_page',
        text: 'เนื้อหาหน้า 3 ของเอกสารตำรา'
      };
      const res = validateAndResolveLocator(pagedChunk, false); // isDocUnpaged: false
      expect(res.isVerified).toBe(true);
      expect(res.locator).toBe('หน้า 3');
      expect(res.provenance).toBe('native_page');
    });

    it('Case 6: สถานะ Locator ที่ไม่สามารถยืนยันได้ยังคงแสดงใน Reference UI โดยไม่ถูกแปลงเป็นไม่ระบุหมายเลข', () => {
      const unindexedChunk = {
        chunkIndex: 1,
        text: 'เนื้อหาชิ้นส่วนที่ไม่มีหัวข้อ'
      };
      const res = validateAndResolveLocator(unindexedChunk, true);
      expect(res.locator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      const renderedCardLocator = res.locator || 'ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้';
      expect(renderedCardLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect(renderedCardLocator).not.toBe('ไม่ระบุหมายเลข');
    });

    it('Case 7: HTML entity decoding in sourceLocator (e.g. &#x33; for 3) correctly resolves and decodes without failing validation', () => {
      const encodedChunk = {
        text: '=== ส่วนที่ 3: Prefix ในการแพทย์ ===\nเนื้อหา',
        sourceLocator: 'ชิ้นส่วนที่ &#x33;',
        sourceLocatorProvenance: 'source_heading'
      };
      const decodedLocator = decodeHtmlEntities(encodedChunk.sourceLocator);
      expect(decodedLocator).toContain('3');
      const res = validateAndResolveLocator(encodedChunk, true);
      expect(res.isVerified).toBe(true);
      expect(res.locator).toBe('ส่วนที่ 3');
    });
  });
});

