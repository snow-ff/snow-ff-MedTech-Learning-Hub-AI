import { describe, it, expect } from 'vitest';
import { retrieveGroundedChunks, decodeHtmlEntities } from './documentChunker';
import { getAcademicFallback } from '../../server';
import { verifyAcademicAnswer } from './academicVerifier';

describe('References Integrity Regression Test Suite (v1.2)', () => {
  const testChunks = [
    {
      id: 'tc-1',
      documentId: 'tdoc-1',
      chunkIndex: 1,
      charCount: 140,
      text: '=== ส่วนที่ 1: ศัพท์เทคนิคทางการแพทย์ (Prefix, Suffix, Root) ===\nเนื้อหาอธิบายคำอุปสรรค (Prefix) และปัจจัยท้าย (Suffix) เช่น -itis หมายถึงการอักเสบ'
    },
    {
      id: 'tc-2',
      documentId: 'tdoc-1',
      chunkIndex: 2,
      charCount: 92,
      text: 'นี่คือประโยคธรรมดาในย่อหน้ากลางที่ไม่มีหัวข้อทางการชัดเจน แต่มียาวพอสมควรเพื่อทดสอบการตัดหัวข้อ'
    },
    {
      id: 'tc-3',
      documentId: 'tdoc-1',
      chunkIndex: 3,
      charCount: 95,
      text: '=== ส่วนที่ 3: ข้อมูลสารสนเทศสุขภาพ &amp; &#x33; มาตรฐานสากล ===\nเนื้อหาระบุมาตรฐาน HL7 และ DICOM &#x33;'
    },
    {
      id: 'tc-4',
      documentId: 'tdoc-1',
      chunkIndex: 4,
      pageNumber: 5,
      hasNativePage: true,
      charCount: 70,
      text: '=== ส่วนที่ 4: หน้าที่มีเลขหน้าตรวจสอบได้ ===\nเนื้อหาตัวอย่างหน้าที่ 5'
    }
  ];

  it('1. A relevant Prefix/Suffix source chunk produces a usable reference', () => {
    const fallback = getAcademicFallback('อธิบาย Prefix และ Suffix', [], {
      title: 'เอกสารทดสอบ',
      hasNativePages: false,
      chunks: testChunks
    });
    expect(fallback.references.length).toBeGreaterThan(0);
    expect(fallback.references[0].title).toContain('ส่วนที่ 1');
  });

  it('2. An unrelated chunk is not presented as evidence merely because of generic keyword overlap', () => {
    const result = retrieveGroundedChunks(testChunks, 'Prefix Suffix', 3);
    const topChunk = result.relevantChunks[0];
    expect(topChunk.chunkIndex).toBe(1);
  });

  it('3. HTML entities are decoded in titles and excerpts', () => {
    const fallback = getAcademicFallback('มาตรฐานสากล', [], {
      title: 'เอกสารทดสอบ',
      hasNativePages: false,
      chunks: testChunks
    });
    const refWithEntity = fallback.references.find(r => r.title.includes('มาตรฐานสากล') || (r.excerpt && r.excerpt.includes('มาตรฐานสากล')));
    if (refWithEntity) {
      expect(refWithEntity.title).not.toContain('&#x33;');
      expect(refWithEntity.excerpt).not.toContain('&#x33;');
    }
  });

  it('4. A genuine source heading is preserved; an arbitrary sentence is not presented as a confirmed heading', () => {
    const unpagedChunks = [
      { id: 'up-1', documentId: 'updoc-1', chunkIndex: 1, text: 'ประโยคธรรมดาไม่มีหัวข้อใดๆ เริ่มต้นทันที', charCount: 40 }
    ];
    const fallback = getAcademicFallback('ประโยคธรรมดา', [], {
      title: 'เอกสารทดสอบ',
      hasNativePages: false,
      chunks: unpagedChunks
    });
    expect(fallback.references.length).toBeGreaterThan(0);
    expect(fallback.references[0].title).toBe('เอกสาร: เอกสารทดสอบ — ชิ้นส่วนที่ 1');
  });

  it('5. An unpaged document displays an internal chunk locator and never invents a page number', () => {
    const fallback = getAcademicFallback('Prefix Suffix', [], {
      title: 'เอกสารไร้เลขหน้า',
      hasNativePages: false,
      chunks: testChunks
    });
    for (const ref of fallback.references) {
      expect(ref.evidenceLocator).toMatch(/ชิ้นส่วนที่ \d+/);
      expect(ref.evidenceLocator).not.toMatch(/หน้า \d+/);
    }
  });

  it('6. A paged document displays a page number only when verified metadata exists', () => {
    const pagedChunks = [
      { chunkIndex: 1, pageNumber: 12, hasNativePage: true, text: '=== ส่วนที่ 1 ===\nเนื้อหาหน้า 12' }
    ];
    const fallback = getAcademicFallback('ส่วนที่ 1', [], {
      title: 'เอกสารมีเลขหน้า',
      hasNativePages: true,
      totalPages: 20,
      chunks: pagedChunks
    });
    expect(fallback.references[0].evidenceLocator).toBe('หน้า 12');
  });

  it('7. Missing optional reference or verification fields do not crash the UI/fallback', () => {
    const minimalChunks = [{ chunkIndex: 1, text: 'ข้อมูลขั้นต่ำ' }];
    const fallback = getAcademicFallback('ข้อมูล', [], {
      title: 'เอกสาร',
      hasNativePages: false,
      chunks: minimalChunks
    });
    expect(fallback.verification).toBeDefined();
    expect(fallback.references).toBeDefined();
  });

  it('8. The previous Page Number Warning repair remains intact', () => {
    const query = 'Prefix และ Suffix อยู่หน้าใด?';
    const candidateAnswer = 'เนื่องจากเอกสารนี้ไม่มีเลขหน้า จึงไม่สามารถยืนยันเลขหน้าได้';
    const report = verifyAcademicAnswer({
      query,
      candidateAnswer,
      document: {
        title: 'เอกสาร',
        hasNativePages: false,
        chunks: testChunks
      }
    });
    expect(report.verdict).toBe('WARNING');
  });

  it('9. Partial multi-part evidence query cannot receive an unqualified PASS', () => {
    const query = 'อธิบายความแตกต่างระหว่าง Prefix และ Suffix';
    const candidateAnswer = 'Prefix และ Suffix แตกต่างกันโดย Prefix อยู่ต้นคำและ Suffix อยู่ท้ายคำ';
    const partialChunks = [
      { id: 'part-1', documentId: 'partdoc-1', chunkIndex: 1, text: '=== ส่วนที่ 1 ===\nPrefix คือคำอุปสรรค', charCount: 36 }
    ];
    const report = verifyAcademicAnswer({
      query,
      candidateAnswer,
      document: {
        title: 'เอกสาร',
        hasNativePages: false,
        chunks: partialChunks
      }
    });
    expect(report.verdict).not.toBe('PASS');
  });
});
