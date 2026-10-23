import { describe, it, expect } from 'vitest';
import { retrieveGroundedChunks, decodeHtmlEntities, chunkText, cleanChunkLocator } from './documentChunker';
import { verifyAcademicAnswer } from './academicVerifier';
import { getAcademicFallback } from '../../server';

describe('Evidence Integrity Fix Regression Tests (Tests A, B, C, D)', () => {
  const sampleDocumentChunks = [
    { id: 'c-1', documentId: 'd-1', chunkIndex: 1, text: '=== ส่วนที่ 1: แนวคิดพื้นฐาน Word Root, Prefix, Suffix, Combining Vowel ===', charCount: 71 },
    { id: 'c-3', documentId: 'd-1', chunkIndex: 3, text: '=== ส่วนที่ 3: Suffix เช่น -itis, -ectomy, -scopy ===', charCount: 51 },
    { id: 'c-6', documentId: 'd-1', chunkIndex: 6, text: '=== ส่วนที่ 6: Do Not Use List & Medication Safety ===', charCount: 52 },
    { id: 'c-10', documentId: 'd-1', chunkIndex: 10, text: '=== ส่วนที่ 10: Digital Standards ===', charCount: 36 },
    { id: 'c-19', documentId: 'd-1', chunkIndex: 19, text: '=== ส่วนที่ 19: Medication safety and Do Not Use list regarding U, IU, QD, and MSO4 ===', charCount: 86 }
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
    expect(fallback.verification?.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(fallback.references).toHaveLength(0);
  });

  it('Test E — Locator Integrity: chunk indices 3, 6, 13, 16 and HTML entity encodings are correctly formatted without raw entities', () => {
    const docWithNumericChunks = {
      title: 'ทดสอบเลขอ้างอิง',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        { chunkIndex: 3, text: 'เนื้อหาชิ้นส่วนที่ 3 เกี่ยวกับ Prefix' },
        { chunkIndex: 6, text: 'เนื้อหาชิ้นส่วนที่ 6 เกี่ยวกับ Suffix' },
        { chunkIndex: 13, text: 'เนื้อหาชิ้นส่วนที่ 13 เกี่ยวกับ Flow Cytometry' },
        { chunkIndex: 16, text: 'เนื้อหาชิ้นส่วนที่ 16 เกี่ยวกับ PCR' }
      ]
    };

    const res3 = getAcademicFallback('Prefix', [{ role: 'user', text: 'Prefix' }], docWithNumericChunks);
    expect(res3.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3')).toBe(true);

    const res6 = getAcademicFallback('Suffix', [{ role: 'user', text: 'Suffix' }], docWithNumericChunks);
    expect(res6.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 6')).toBe(true);

    const res13 = getAcademicFallback('Flow Cytometry', [{ role: 'user', text: 'Flow Cytometry' }], docWithNumericChunks);
    expect(res13.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 13')).toBe(true);
    expect(res13.references.every(r => !r.evidenceLocator || !r.evidenceLocator.includes('&#'))).toBe(true);

    const res16 = getAcademicFallback('PCR', [{ role: 'user', text: 'PCR' }], docWithNumericChunks);
    expect(res16.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 16')).toBe(true);
  });

  it('Test F — Multi-encoded HTML entities in locators are fully decoded without raw remnants', () => {
    const multiEncoded = '&amp;amp;#x33; &amp;#x36;';
    const decoded = decodeHtmlEntities(multiEncoded);
    expect(decoded).not.toContain('&#');
    expect(decoded).toBe('3 6');
  });

  it('Test G — Citation & Excerpt Integrity in Academic Fallback and Verification', () => {
    const docMismatch: any = {
      title: 'Medical Terminology Guide',
      hasNativePages: false,
      chunks: [
        { id: '13', documentId: 'doc1', chunkIndex: 13, text: 'Standard Anatomical Position describes standing upright, facing forward, palms facing forward.', charCount: 80 },
        { id: '16', documentId: 'doc1', chunkIndex: 16, text: 'Major Body Cavities include Dorsal and Ventral cavities.', charCount: 50 }
      ]
    };

    // Asking about Suffix (-scopy, -gram, -graphy) but chunk 13 is about Anatomical Position -> should not PASS blindly
    const query = 'อธิบายความแตกต่างของ suffix -scopy, -gram และ -graphy';
    const candidateAnswer = 'จากการศึกษา -scopy คือการส่องกล้อง -gram คือภาพบันทึก และ -graphy คือกระบวนการบันทึกภาพ';
    const report = verifyAcademicAnswer({
      query,
      candidateAnswer,
      document: { title: 'Guide', chunks: docMismatch.chunks }
    });

    // Since chunk 13 text does not contain suffix info and query retrieval is mismatched/insufficient
    expect(report.verdict).not.toBe('PASS');
  });

  it('Test H — Phase 1 Locator Integrity Regression Tests for cleanChunkLocator', () => {
    // 1. Normal numeric index
    expect(cleanChunkLocator(13)).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('16')).toBe('ชิ้นส่วนที่ 16');

    // 2. Numeric HTML entity (&#x33; is '3', &#x36; is '6')
    expect(cleanChunkLocator('&#x33;')).toBe('ชิ้นส่วนที่ 3');
    expect(cleanChunkLocator('1&#x33;')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('1&#x36;')).toBe('ชิ้นส่วนที่ 16');

    // 3. Double-encoded HTML entity
    expect(cleanChunkLocator('&amp;#x33;')).toBe('ชิ้นส่วนที่ 3');

    // 4. Null, undefined, and non-numeric values
    expect(cleanChunkLocator(undefined as any)).toBe('ชิ้นส่วนที่ 1');
    expect(cleanChunkLocator(null as any)).toBe('ชิ้นส่วนที่ 1');
    expect(cleanChunkLocator('abc')).toBe('ชิ้นส่วนที่ 1');

    // 5. Valid page number
    expect(cleanChunkLocator(13, 12)).toBe('หน้า 12');

    // 6. Ensure no raw HTML entity remains
    const locs = [
      cleanChunkLocator('1&#x33;'),
      cleanChunkLocator('1&#x36;'),
      cleanChunkLocator('&#x33;'),
      cleanChunkLocator('&amp;#x33;')
    ];
    locs.forEach(l => {
      expect(l).not.toContain('&#');
      expect(l).not.toContain('&amp;');
    });
  });

  it('Test I — Semantic Mismatch, Positive Control, and Multi-Part Regression Tests', () => {
    // 1. Negative Case: Suffix query with only anatomical position evidence must NOT be PASS and must be insufficient
    const docNegative = {
      title: 'Anatomy Guide',
      hasNativePages: false,
      chunks: [
        { id: '13', documentId: 'doc1', chunkIndex: 13, text: 'Standard Anatomical Position describes standing upright, facing forward.', charCount: 70 }
      ]
    };
    const negReport = verifyAcademicAnswer({
      query: 'อธิบายความแตกต่างของ suffix -scopy, -gram',
      candidateAnswer: 'Suffix -scopy คือการส่องกล้อง',
      document: { title: 'Guide', chunks: docNegative.chunks }
    });
    expect(negReport.verdict).not.toBe('PASS');
    expect(negReport.isVerified).toBe(false);

    const negFallback = getAcademicFallback('อธิบายความแตกต่างของ suffix -scopy, -gram', [], docNegative);
    expect(negFallback.evidenceStatus).toBe('insufficient');
    expect(negFallback.verification?.verdict).not.toBe('PASS');
    expect(negFallback.references.every(r => r.verificationStatus !== 'source_grounded')).toBe(true);

    // 2. Positive Control Case: Valid Suffix evidence must be correctly selected and evaluated
    const docPositive = {
      title: 'Medical Terminology Guide',
      hasNativePages: false,
      chunks: [
        { id: '3', documentId: 'doc1', chunkIndex: 3, text: 'Suffix includes -scopy (การส่องกล้อง) and -gram (ภาพบันทึกภาพ).', charCount: 65 }
      ]
    };
    const posReport = verifyAcademicAnswer({
      query: 'อธิบาย suffix -scopy',
      candidateAnswer: 'Suffix -scopy คือการส่องกล้องอ้างอิงจากชิ้นส่วนที่ 3',
      document: { title: 'Guide', chunks: docPositive.chunks }
    });
    expect(posReport.stages.retrieval.relevantChunksCount).toBeGreaterThan(0);
    expect(posReport.stages.retrieval.passed).toBe(true);
    expect(posReport.stages.evidenceFidelity.passed).toBe(true);

    const posFallback = getAcademicFallback('อธิบาย suffix -scopy', [], docPositive);
    expect(posFallback.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3')).toBe(true);
    expect(posFallback.evidenceStatus).toBe('sufficient');
    expect(posFallback.references[0].verificationStatus).toBe('source_grounded');

    // 3. Multi-Part Case: Prefix and Suffix query with only Prefix evidence must NOT report full coverage
    const docMultipart = {
      title: 'Prefix Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) อยู่ข้างหน้าคำหลัก เช่น brady- และ tachy-', charCount: 60 }
      ]
    };
    const multiReport = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Prefix คือคำอุปสรรค ส่วน Suffix คือปัจจัยท้าย',
      document: { title: 'Guide', chunks: docMultipart.chunks }
    });
    expect(multiReport.verdict).not.toBe('PASS');
    expect(multiReport.stages.answerFidelity.status).toBe('overgeneralized');

    const multiFallback = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docMultipart);
    expect(multiFallback.evidenceStatus).toBe('insufficient');
    expect(multiFallback.verification?.verdict).not.toBe('PASS');
    expect(multiFallback.references.every(r => r.verificationStatus !== 'source_grounded')).toBe(true);
  });
});
