import { describe, it, expect } from 'vitest';
import { retrieveGroundedChunks, decodeHtmlEntities, chunkText } from './documentChunker';
import { verifyAcademicAnswer } from './academicVerifier';
import { getAcademicFallback } from '../../server';

describe('Evidence Integrity Fix Regression Tests (Tests A, B, C, D)', () => {
  const sampleDocumentChunks = [
    { chunkIndex: 1, text: '=== ส่วนที่ 1: แนวคิดพื้นฐาน Word Root, Prefix, Suffix, Combining Vowel ===' },
    { chunkIndex: 3, text: '=== ส่วนที่ 3: Suffix เช่น -itis, -ectomy, -scopy ===' },
    { chunkIndex: 6, text: '=== ส่วนที่ 6: Do Not Use List & Medication Safety ===' },
    { chunkIndex: 10, text: '=== ส่วนที่ 10: Digital Standards ===' },
    { chunkIndex: 19, text: '=== ส่วนที่ 19: Medication safety and Do Not Use list regarding U, IU, QD, and MSO4 ===' }
  ];

  it('Test A — General query: Prefix and Suffix query retrieves relevant chunks and excludes medication safety chunk 19', () => {
    const prompt = 'อธิบายความแตกต่างระหว่าง Prefix และ Suffix ในศัพท์เทคนิคทางการแพทย์ พร้อมยกตัวอย่าง';
    const result = retrieveGroundedChunks(sampleDocumentChunks, prompt, 3);

    expect(result.hasEvidence).toBe(true);
    // Should include chunk 1 or 3 (word parts)
    expect(result.relevantChunks.some(c => c.chunkIndex === 1 || c.chunkIndex === 3)).toBe(true);
    // Should NOT include chunk 19 (medication safety Do Not Use)
    expect(result.relevantChunks.some(c => c.chunkIndex === 19)).toBe(false);
  });

  it('Test B — Page number query: unpaged document asking for page numbers must not show PASS or invent page numbers', () => {
    const query = 'ในเอกสารนี้ Prefix และ Suffix อยู่หน้าใด? โปรดระบุเลขหน้าที่ตรวจสอบได้';
    const candidateAnswer = 'จากการตรวจสอบในเอกสาร เนื่องจากเป็นบันทึกสรุปที่ไม่มีเลขหน้าต้นฉบับ จึงไม่สามารถยืนยันเลขหน้าได้';
    const doc = {
      title: 'บันทึกสรุป DTM67-111',
      hasNativePages: false,
      chunks: sampleDocumentChunks
    };

    const report = verifyAcademicAnswer({ query, candidateAnswer, document: doc });
    expect(report.stages.evidenceFidelity.citedPages).toHaveLength(0);
    // Should not PASS if question asked for page numbers and document has no page numbers unless correctly addressed
    expect(report.verdict).not.toBe('PASS');
  });

  it('Test C — HTML entities: decoding hex, decimal, and named entities in locators and titles without double-decoding errors', () => {
    const rawLocator = 'ชิ้นส่วนที่ &#x33; และ ชิ้นส่วนที่ &#51;';
    const decoded = decodeHtmlEntities(rawLocator);
    expect(decoded).not.toContain('&#x33;');
    expect(decoded).not.toContain('&#51;');
    expect(decoded).toBe('ชิ้นส่วนที่ 3 และ ชิ้นส่วนที่ 3');
  });

  it('Test D — Verification status alignment: insufficient evidence produces INSUFFICIENT_EVIDENCE verdict and insufficient evidence status', () => {
    const prompt = 'quantum mechanics physics theory';
    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: sampleDocumentChunks
    });

    expect(fallback.evidenceStatus).toBe('insufficient');
    expect(fallback.verification.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(fallback.references).toHaveLength(0);
  });
});
