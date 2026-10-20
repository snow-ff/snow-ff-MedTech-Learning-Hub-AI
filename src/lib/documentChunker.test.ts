import { describe, it, expect } from 'vitest';
import {
  chunkText,
  rankRelevantChunks,
  buildGroundingContext,
  decodeHtmlEntities,
  retrieveGroundedChunks
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

    it('should fallback to first chunks when query does not match', () => {
      const ranked = rankRelevantChunks(testChunks, 'quantum physics mechanics', 2);
      expect(ranked).toHaveLength(2);
      expect(ranked[0].id).toBe('c-1');
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
        { id: 'c1', documentId: 'd1', chunkIndex: 1, text: 'Notice of adaptation and disclaimer regarding copyright.' },
        { id: 'c2', documentId: 'd1', chunkIndex: 2, text: 'Common Prefixes such as brady-, tachy-, dys-, sub- modify medical terms.' },
        { id: 'c3', documentId: 'd1', chunkIndex: 3, text: 'Unrelated body cavities and anatomical standard positions text.' },
        { id: 'c4', documentId: 'd1', chunkIndex: 4, text: 'Diagnostic Suffixes include -itis, -ectomy, and -scopy.' }
      ];

      const result = retrieveGroundedChunks(chunks, 'prefix brady- suffix -itis', 2);
      expect(result.hasEvidence).toBe(true);
      expect(result.relevantChunks.some(c => c.chunkIndex === 2)).toBe(true);
      expect(result.relevantChunks.some(c => c.chunkIndex === 4)).toBe(true);
    });
  });
});
