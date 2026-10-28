import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { retrieveGroundedChunks, decodeHtmlEntities, chunkText, cleanChunkLocator, extractRelevantExcerpt, filterDisplayedReferences } from './documentChunker';
import { verifyAcademicAnswer } from './academicVerifier';
import { DocumentChunk } from '../models/coreModel';
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
        { chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'explicit_provenance' as const, text: 'เนื้อหาชิ้นส่วนที่ 3 เกี่ยวกับ Prefix' },
        { chunkIndex: 6, sourceLocator: 'ชิ้นส่วนที่ 6', sourceLocatorProvenance: 'explicit_provenance' as const, text: 'เนื้อหาชิ้นส่วนที่ 6 เกี่ยวกับ Suffix' },
        { chunkIndex: 13, sourceLocator: 'ชิ้นส่วนที่ 13', sourceLocatorProvenance: 'explicit_provenance' as const, text: 'เนื้อหาชิ้นส่วนที่ 13 เกี่ยวกับ Flow Cytometry' },
        { chunkIndex: 16, sourceLocator: 'ชิ้นส่วนที่ 16', sourceLocatorProvenance: 'explicit_provenance' as const, text: 'เนื้อหาชิ้นส่วนที่ 16 เกี่ยวกับ PCR' }
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
    expect(cleanChunkLocator(undefined as any)).toBe('');
    expect(cleanChunkLocator(null as any)).toBe('');
    expect(cleanChunkLocator('abc')).toBe('');

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
    // 1. Negative Case: Suffix query with only anatomical position evidence (completely unrelated topic)
    const docNegative = {
      title: 'Anatomy Guide',
      hasNativePages: false,
      chunks: [
        { id: '13', documentId: 'doc1', chunkIndex: 13, sourceLocator: 'ชิ้นส่วนที่ 13', sourceLocatorProvenance: 'source_heading' as const, text: 'Standard Anatomical Position describes standing upright, facing forward.', charCount: 70 }
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
    // Reference-level: chunk 13 does not support suffix, so it must be unsupported_citation
    expect(negFallback.references.every(r => r.verificationStatus === 'unsupported_citation')).toBe(true);

    // 2. Positive Control Case: Valid Suffix evidence must be correctly selected and evaluated
    const docPositive = {
      title: 'Medical Terminology Guide',
      hasNativePages: false,
      chunks: [
        { id: '3', documentId: 'doc1', chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 3: Suffix ===\nSuffix includes -scopy (การส่องกล้อง) and -gram (ภาพบันทึกภาพ).', charCount: 65 }
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
    expect(posReport.stages.answerFidelity.passed).toBe(true);
    expect(posReport.verdict).toBe('PASS');
    expect(posReport.isVerified).toBe(true);

    const posFallback = getAcademicFallback('อธิบาย suffix -scopy', [], docPositive);
    expect(posFallback.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3')).toBe(true);
    expect(posFallback.evidenceStatus).toBe('sufficient');
    expect(posFallback.verification?.verdict).toBe('PASS');
    expect(posFallback.verification?.isVerified).toBe(true);
    expect(posFallback.references[0].verificationStatus).toBe('source_grounded');

    // 3. Multi-Part Case: Prefix and Suffix query with only Prefix evidence must NOT report full coverage
    const docMultipart = {
      title: 'Prefix Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 1: Prefix ===\nPrefix (คำอุปสรรค) อยู่ข้างหน้าคำหลัก เช่น brady- และ tachy-', charCount: 60 }
      ]
    };
    const multiReport = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Prefix คือคำอุปสรรค ส่วน Suffix คือปัจจัยท้าย',
      document: { title: 'Guide', chunks: docMultipart.chunks }
    });
    expect(multiReport.verdict).not.toBe('PASS');
    expect(multiReport.isVerified).toBe(false);
    expect(multiReport.stages.answerFidelity.status).toBe('overgeneralized');

    const multiFallback = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docMultipart);
    expect(multiFallback.evidenceStatus).toBe('insufficient');
    expect(multiFallback.verification?.verdict).not.toBe('PASS');
    expect(multiFallback.verification?.isVerified).toBe(false);
    // Reference-level: chunk 1 is a genuine local document chunk covering prefix
    expect(multiFallback.references[0].verificationStatus).toBe('source_grounded');
    expect(multiFallback.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1')).toBe(true);

    // 4. Mixed Chunks Case: Document contains both relevant chunk (Chunk 3: Suffix with -scopy) and casual chunk (Chunk 1: Suffix without -scopy)
    const docMixed = {
      title: 'Mixed Medical Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1: บทนำ ===\nคำนำ: เอกสารชุดนี้รวบรวมคำศัพท์ prefix และ suffix ทั่วไปในเวชระเบียนโรงพยาบาล', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 3: Suffix ===\nSuffix includes -scopy (การส่องกล้อง) and -gram (ภาพบันทึกภาพ) ในเวชระเบียน.', charCount: 72 }
      ]
    };
    const mixedFallback = getAcademicFallback('อธิบาย suffix -scopy ในเวชระเบียน', [], docMixed);
    // Overall answer has sufficient evidence because of Chunk 3
    expect(mixedFallback.evidenceStatus).toBe('sufficient');
    // Both chunks are retrieved due to shared terms
    const ref3 = mixedFallback.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3');
    const ref1 = mixedFallback.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    expect(ref3).toBeDefined();
    expect(ref3?.verificationStatus).toBe('source_grounded');
    expect(ref1).toBeDefined();
    // Deterministic check: Chunk 1 only casually mentions suffix without -scopy, must be unsupported_citation
    expect(ref1?.verificationStatus).toBe('unsupported_citation');
  });

  it('Test J — Casual Mention: Suffix query against chunk mentioning "suffix" casually without substantive suffix content', () => {
    const docCasual = {
      title: 'Introductory Notes',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'คำนำทั่วไป: เอกสารประกอบการเรียนนี้กล่าวถึงคำว่า prefix และ suffix ในทางเทคนิคการแพทย์เบื้องต้น', charCount: 95 }
      ]
    };

    const res = getAcademicFallback('อธิบาย suffix -scopy', [], docCasual);
    // Evidence is insufficient because chunk 1 lacks -scopy or substantive suffix morphemes
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.references).toHaveLength(1);
    expect(res.references[0].verificationStatus).toBe('unsupported_citation');
  });

  it('Test K — General Query: Document with substantive clinical chunk vs administrative notice chunk', () => {
    const docGeneral = {
      title: 'Clinical Laboratory Guide',
      hasNativePages: false,
      chunks: [
        { id: '2', documentId: 'doc1', chunkIndex: 2, sourceLocator: 'ชิ้นส่วนที่ 2', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 2 ===\nการตรวจวิเคราะห์ทางห้องปฏิบัติการทางการแพทย์ Complete Blood Count (CBC) ต้องใช้เลือด EDTA หลอดสีม่วง', charCount: 101 },
        { id: '10', documentId: 'doc1', chunkIndex: 10, sourceLocator: 'ชิ้นส่วนที่ 10', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 10 ===\nข้อปฏิบัติและการใช้อาคารสำนักงานของบุคลากรทางห้องปฏิบัติการทางการแพทย์', charCount: 72 }
      ]
    };

    const res = getAcademicFallback('การตรวจวิเคราะห์ทางห้องปฏิบัติการทางการแพทย์ Complete Blood Count', [], docGeneral);
    expect(res.evidenceStatus).toBe('sufficient');

    const refClinical = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 2');
    const refNotice = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 10');

    expect(refClinical).toBeDefined();
    expect(refClinical?.verificationStatus).toBe('source_grounded');
    // Administrative/notice chunk without clinical grounding must be unsupported_citation
    expect(refNotice).toBeDefined();
    expect(refNotice?.verificationStatus).toBe('unsupported_citation');
  });

  it('Test L — Chunk Index Collision: Unsupported citation for Chunk 13 must not falsely flag Chunk 1', () => {
    const docCollision = {
      title: 'Collision Test Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 55 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, sourceLocator: 'ชิ้นส่วนที่ 13', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 13 ===\nStandard Anatomical Position describes standing upright, facing forward.', charCount: 70 }
      ]
    };

    const res = getAcademicFallback('อธิบาย prefix brady- และ tachy-', [], docCollision);
    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    expect(ref1).toBeDefined();
    // Chunk 1 genuinely supports the prefix query, so it must be source_grounded
    expect(ref1?.verificationStatus).toBe('source_grounded');
  });

  it('Test M — Casual Mention Without Specific Morpheme: Query "อธิบาย suffix" against chunk mentioning "suffix" casually', () => {
    const docCasualGeneral = {
      title: 'General Overview',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'คำนำทั่วไป: เอกสารประกอบการเรียนนี้กล่าวถึงคำว่า prefix และ suffix ในทางเทคนิคการแพทย์เบื้องต้น', charCount: 95 }
      ]
    };

    const res = getAcademicFallback('อธิบาย suffix', [], docCasualGeneral);
    expect(res.references).toHaveLength(1);
    // Deterministic Heuristic: Must NOT be source_grounded simply because "suffix" word matched
    expect(res.references[0].verificationStatus).toBe('unsupported_citation');
    expect(res.evidenceStatus).toBe('insufficient');
  });

  it('Test N — General English Word Overlap vs Clinical Markers: Matching words like "guide", "note", "report" without queried CBC/EDTA/PCR must not be source_grounded', () => {
    const docGeneralEnglish = {
      title: 'Lab Study Notes',
      hasNativePages: false,
      chunks: [
        { id: '4', documentId: 'doc1', chunkIndex: 4, text: 'Study guide, student notes, and standard laboratory report format.', charCount: 66 }
      ]
    };

    const res = getAcademicFallback('การตรวจ CBC และ EDTA ตาม study guide, notes, and report', [], docGeneralEnglish);
    expect(res.references).toHaveLength(1);
    // Chunk matches general English words (guide, notes, report) but has NO cbc or edta -> must be unsupported_citation
    expect(res.references[0].verificationStatus).toBe('unsupported_citation');
    expect(res.evidenceStatus).toBe('insufficient');
  });

  it('Test O — Exact Integer Citation Isolation: unsupportedCitations specifying "ชิ้นส่วนที่ 13" does not falsely violate Chunk 1', () => {
    const docExact = {
      title: 'Collision Isolation Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- และ tachy-', charCount: 68 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, sourceLocator: 'ชิ้นส่วนที่ 13', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 13 ===\nประกาศเตือน: notice of adaptation และการให้เครดิตแหล่งข้อมูล สำหรับคำศัพท์ Prefix', charCount: 80 }
      ]
    };

    const res = getAcademicFallback('อธิบาย prefix brady- และ tachy-', [], docExact);
    expect(res.references).toHaveLength(2);

    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    const ref13 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 13');

    expect(ref1).toBeDefined();
    expect(ref13).toBeDefined();

    // Verify that unsupportedCitations actually flagged chunk 13
    expect(res.verification?.stages.evidenceFidelity.unsupportedCitations.some(uc => uc.includes('ชิ้นส่วนที่ 13'))).toBe(true);

    // Chunk 1 must be source_grounded and NOT contaminated by chunk 13's violation
    expect(ref1?.verificationStatus).toBe('source_grounded');

    // Chunk 13 must be unsupported_citation because of its own violation
    expect(ref13?.verificationStatus).toBe('unsupported_citation');
  });

  it('Test P — Multipart Coverage Discrepancy: Prefix-only evidence for query asking both Prefix and Suffix', () => {
    const docPrefixOnly = {
      title: 'Prefix Only Reference Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 }
      ]
    };

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docPrefixOnly);

    // 1. Answer-level must be insufficient because Suffix is missing
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.isVerified).toBe(false);
    expect(res.verification?.stages.answerFidelity.status).toBe('overgeneralized');

    // 2. Reference-level: Prefix chunk genuinely supports the Prefix portion and is source_grounded
    expect(res.references).toHaveLength(1);
    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    expect(ref1).toBeDefined();
    expect(ref1?.verificationStatus).toBe('source_grounded');

    // 3. Suffix must NOT be concluded as supported (no grounded reference for suffix exists)
    const hasGroundedSuffixRef = res.references.some(r =>
      r.verificationStatus === 'source_grounded' && /-(?:itis|ectomy|scopy|gram)/.test(r.excerpt || '')
    );
    expect(hasGroundedSuffixRef).toBe(false);
  });

  it('Test P2 — Multipart Coverage Discrepancy: Suffix-only evidence for query asking both Prefix and Suffix', () => {
    const docSuffixOnly = {
      title: 'Suffix Only Reference Guide',
      hasNativePages: false,
      chunks: [
        { id: '3', documentId: 'doc1', chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 3 ===\nSuffix (ปัจจัยท้าย) คือส่วนที่เติมท้ายคำหลัก เช่น -itis (การอักเสบ) และ -ectomy (การผ่าตัดออก)', charCount: 82 }
      ]
    };

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docSuffixOnly);

    // 1. Answer-level must be insufficient because Prefix is missing
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.isVerified).toBe(false);
    expect(res.verification?.stages.answerFidelity.status).toBe('overgeneralized');

    // 2. Reference-level: Suffix chunk (chunkIndex 3) maps to real fixture chunk and is source_grounded
    expect(res.references).toHaveLength(1);
    const ref3 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3');
    expect(ref3).toBeDefined();
    expect(ref3?.verificationStatus).toBe('source_grounded');

    // 3. Verify via verifyAcademicAnswer and direct chunk content inspection that Prefix evidence is absent
    const verifyReport = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Suffix คือปัจจัยท้าย',
      document: { title: docSuffixOnly.title, chunks: docSuffixOnly.chunks }
    });
    expect(verifyReport.stages.retrieval.relevantChunksCount).toBe(1);
    const chunk3Text = docSuffixOnly.chunks[0].text.toLowerCase();
    expect(chunk3Text.includes('prefix')).toBe(false);
    expect(chunk3Text.includes('คำอุปสรรค')).toBe(false);
  });

  it('Test Q — Positive Control for Multipart Coverage: Genuine evidence for both Prefix and Suffix', () => {
    const docBothParts = {
      title: 'Complete Word Parts Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 3 ===\nSuffix (ปัจจัยท้าย) คือส่วนที่เติมท้ายคำหลัก เช่น -itis (การอักเสบ) และ -ectomy (การผ่าตัดออก)', charCount: 82 }
      ]
    };

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docBothParts);

    // 1. Answer-level must be sufficient and verified
    expect(res.evidenceStatus).toBe('sufficient');
    expect(res.verification?.verdict).toBe('PASS');
    expect(res.verification?.isVerified).toBe(true);
    expect(res.verification?.stages.answerFidelity.status).toBe('aligned');

    // 2. Reference-level: Both chunks must be source_grounded
    expect(res.references).toHaveLength(2);
    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    const ref3 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3');
    expect(ref1?.verificationStatus).toBe('source_grounded');
    expect(ref3?.verificationStatus).toBe('source_grounded');
  });

  it('Test R — Robust Citation Parsing: Exact Integer Matching, Duplicate Citations, and Strict Citation Grammar', () => {
    const docRobust = {
      title: 'Robust Citation Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) เช่น brady- และ tachy-', charCount: 50 },
        { id: '2', documentId: 'doc1', chunkIndex: 2, sourceLocator: 'ชิ้นส่วนที่ 2', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 2 ===\nSuffix (ปัจจัยท้าย) เช่น -itis และ -ectomy', charCount: 50 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, sourceLocator: 'ชิ้นส่วนที่ 13', sourceLocatorProvenance: 'source_heading' as const, text: '=== ส่วนที่ 13 ===\nประกาศเตือน: notice of adaptation และการให้เครดิตแหล่งข้อมูล สำหรับคำศัพท์ Prefix', charCount: 80 }
      ]
    };

    // Candidate answer with:
    // 1. Valid syntax: [chunk 1], [ชิ้นส่วนที่ 2], [ส่วนอ้างอิง 13]
    // 2. Duplicate citations of chunk 13
    // 3. Strict malformed citation grammar violations:
    //    - [chunk abc 2]
    //    - [chunk null 2]
    //    - [chunk 2 abc]
    //    - [chunk null]
    //    - [chunk undefined]
    //    - [chunk NaN]
    //    - [ชิ้นส่วนที่ abc]
    //    - [ส่วนอ้างอิง: ]
    // 4. Non-citation brackets ([CBC], [EDTA]) and regular Thai text ("ชิ้นส่วนที่นำมาตรวจทางห้องปฏิบัติการ")
    const candidateAnswer =
      'คำตอบนี้อ้างอิงจาก [chunk 1] และ [ชิ้นส่วนที่ 2] และ [ส่วนอ้างอิง 13] และ [ส่วนอ้างอิง 13] ซ้ำ ' +
      'พร้อมรูปแบบผิด: [chunk abc 2], [chunk null 2], [chunk 2 abc], [chunk null], [chunk undefined], [chunk NaN], [ชิ้นส่วนที่ abc], [ส่วนอ้างอิง: ], [chunk ชิ้นส่วนที่ 2] ' +
      'รวมทั้งมีชิ้นส่วนที่นำมาตรวจทางห้องปฏิบัติการ และ [CBC] กับ [EDTA] ปกติ';

    const report = verifyAcademicAnswer({
      query: 'อธิบาย prefix',
      candidateAnswer,
      document: {
        title: docRobust.title,
        hasNativePages: false,
        chunks: docRobust.chunks
      }
    });

    // 1. Valid chunk citations must not be flagged as malformed
    const malformedViolations = report.stages.evidenceFidelity.unsupportedCitations.filter(uc =>
      uc.includes('รูปแบบการอ้างอิงผิดพลาด (Malformed Citation)')
    );

    // All 9 invalid bracket citations must be identified as format errors
    expect(malformedViolations.some(m => m.includes('[chunk abc 2]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk null 2]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk 2 abc]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk null]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk undefined]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk NaN]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[ชิ้นส่วนที่ abc]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[ส่วนอ้างอิง: ]'))).toBe(true);
    expect(malformedViolations.some(m => m.includes('[chunk ชิ้นส่วนที่ 2]'))).toBe(true);
    expect(malformedViolations.length).toBe(9);

    // 2. Valid citation [chunk 1] and [ชิ้นส่วนที่ 2] must NOT be flagged as malformed
    expect(malformedViolations.some(m => m.includes('[chunk 1]'))).toBe(false);
    expect(malformedViolations.some(m => m.includes('[ชิ้นส่วนที่ 2]'))).toBe(false);

    // 3. Notice of adaptation chunk 13 must be flagged exactly once (deduplicated)
    const notice13Violations = report.stages.evidenceFidelity.unsupportedCitations.filter(uc =>
      uc.includes('ชิ้นส่วนที่ 13')
    );
    expect(notice13Violations.length).toBe(1);
    expect(notice13Violations[0]).toContain('เป็นข้อความประกาศแจ้งเตือน');

    // 4. Regular Thai prose ("ชิ้นส่วนที่นำมาตรวจ") and non-citation brackets ("[CBC]", "[EDTA]") must NOT be flagged
    const thaiProseViolations = report.stages.evidenceFidelity.unsupportedCitations.filter(uc =>
      uc.includes('ชิ้นส่วนที่นำมาตรวจ')
    );
    expect(thaiProseViolations.length).toBe(0);

    const medicalBracketViolations = report.stages.evidenceFidelity.unsupportedCitations.filter(uc =>
      uc.includes('CBC') || uc.includes('EDTA')
    );
    expect(medicalBracketViolations.length).toBe(0);

    // 5. Fallback evaluation with exact locator isolation
    const fallback = getAcademicFallback('อธิบาย prefix brady- และ tachy-', [], docRobust);
    const ref1 = fallback.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    const ref13 = fallback.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 13');

    expect(ref1?.verificationStatus).toBe('source_grounded');
    expect(ref13?.verificationStatus).toBe('unsupported_citation');
  });

  it('Test S — Multi-Chunk Dispersed Match: Concatenation across chunks cannot synthesize a fake composite definition', () => {
    const docDispersed = {
      title: 'Dispersed Medical Notes',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nคำศัพท์ทางการแพทย์ ประกอบด้วยเนื้อหาหลายบทเรียนในหลักสูตร', charCount: 65 },
        { id: '2', documentId: 'doc1', chunkIndex: 2, sourceLocator: 'ชิ้นส่วนที่ 2', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 2 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 3 ===\nประกาศลิขสิทธิ์: สงวนลิขสิทธิ์คู่มือการใช้ suffix ทางการแพทย์ โดยชมรมวิชาการ', charCount: 75 }
      ]
    };

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docDispersed);

    // 1. Answer-level must be insufficient because Suffix has no genuine substantive explanation
    // Chunk 1 ("ประกอบด้วย...") + Chunk 3 ("...suffix...") must NOT bridge across chunks to form a fake composite
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.stages.answerFidelity.status).toBe('overgeneralized');

    // 2. Reference-level:
    // Chunk 2 (genuine prefix evidence) is source_grounded
    const ref2 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 2');
    expect(ref2).toBeDefined();
    expect(ref2?.verificationStatus).toBe('source_grounded');

    // Chunk 1 (general intro) and Chunk 3 (disclaimer/copyright) must be unsupported_citation
    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    const ref3 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3');
    if (ref1) expect(ref1.verificationStatus).toBe('unsupported_citation');
    if (ref3) expect(ref3.verificationStatus).toBe('unsupported_citation');
  });

  it('Test T — Cross-Sentence Match: Matching across distant sentences in the same chunk cannot fool composition check', () => {
    const docCrossSentence = {
      title: 'Intra-Chunk Separation Guide',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          documentId: 'doc1',
          chunkIndex: 1,
          text: 'คำศัพท์ทางการแพทย์ ประกอบด้วย 3 ส่วนหลัก ได้แก่ รากศัพท์ (Word Root). ส่วนแบบฝึกหัดท้ายเล่มจะมีคำถามเรื่อง prefix และ suffix ให้นักศึกษาทำ',
          charCount: 135
        }
      ]
    };

    const report = verifyAcademicAnswer({
      query: 'อธิบายองค์ประกอบของคำศัพท์ Prefix และ Suffix',
      candidateAnswer: 'คำศัพท์ทางการแพทย์มีองค์ประกอบคือ Prefix และ Suffix',
      document: { title: docCrossSentence.title, chunks: docCrossSentence.chunks }
    });

    // Crossing sentence 1 ("ประกอบด้วย...") into sentence 2 ("prefix และ suffix ให้นักศึกษาทำ") must NOT trigger hasWordPartsComposition
    expect(report.verdict).not.toBe('PASS');
    expect(report.stages.answerFidelity.status).toBe('overgeneralized');

    const res = getAcademicFallback('อธิบายองค์ประกอบของคำศัพท์ Prefix และ Suffix', [], docCrossSentence);
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.references[0].verificationStatus).toBe('unsupported_citation');
  });

  it('Test U — Raw Examples Without Definition: Query asking for definition/function cannot be satisfied solely by raw morpheme examples', () => {
    const docRawExamples = {
      title: 'Morpheme List',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          documentId: 'doc1',
          chunkIndex: 1,
          text: 'รายการตัวอย่างคำศัพท์ทางการแพทย์: Prefix เช่น brady-, tachy- และ Suffix เช่น -itis, -ectomy (ไม่มีคำอธิบายความหมายหรือหน้าที่)',
          charCount: 125
        }
      ]
    };

    // Query specifically asks for function/definition
    const report = verifyAcademicAnswer({
      query: 'อธิบายหน้าที่และนิยามของ Prefix และ Suffix',
      candidateAnswer: 'หน้าที่ของ Prefix และ Suffix คือการระบุตำแหน่งและความหมายของคำศัพท์',
      document: { title: docRawExamples.title, chunks: docRawExamples.chunks }
    });

    // Having only raw tokens without definition/explanation cannot satisfy definition queries
    expect(report.verdict).not.toBe('PASS');
    expect(report.stages.answerFidelity.status).toBe('overgeneralized');

    const res = getAcademicFallback('อธิบายหน้าที่และนิยามของ Prefix และ Suffix', [], docRawExamples);
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.references[0].verificationStatus).toBe('unsupported_citation');
  });

  it('Test V — Prefix Definition in Sentence 1, but "suffix" in Sentence 2 in non-explanatory context', () => {
    const docPrefixOnlyDistant = {
      title: 'Prefix Definition with Incidental Suffix Mention',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          documentId: 'doc1',
          chunkIndex: 1,
          text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลักเพื่อเปลี่ยนความหมาย เช่น brady- (ช้า). ส่วนเนื้อหาเกี่ยวกับ suffix จะมีเอกสารแจกเพิ่มเติมในสัปดาห์หน้า',
          charCount: 145
        }
      ]
    };

    const report = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Prefix คือส่วนที่เติมหน้าคำหลัก ส่วน Suffix คือส่วนที่เติมท้ายคำหลัก',
      document: { title: docPrefixOnlyDistant.title, chunks: docPrefixOnlyDistant.chunks }
    });

    // Sentence 1 has genuine Prefix definition, but Sentence 2 only has incidental non-explanatory mention of "suffix"
    expect(report.verdict).not.toBe('PASS');
    expect(report.stages.answerFidelity.status).toBe('overgeneralized');

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docPrefixOnlyDistant);
    expect(res.evidenceStatus).toBe('insufficient');
    // Chunk 1 genuinely supports the Prefix portion and is source_grounded
    expect(res.references[0].verificationStatus).toBe('source_grounded');
  });

  it('Test W — Suffix Definition in Sentence 1, but "prefix" in Sentence 2 in exercise context', () => {
    const docSuffixOnlyDistant = {
      title: 'Suffix Definition with Incidental Prefix Mention',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          documentId: 'doc1',
          chunkIndex: 1,
          text: 'Suffix (ปัจจัยท้าย) คือส่วนที่เติมท้ายคำหลักเพื่อระบุพยาธิสภาพหรือหัตถการ เช่น -itis (การอักเสบ). ให้นักศึกษาทำแบบฝึกหัดเรื่อง prefix ในบทที่ 2',
          charCount: 140
        }
      ]
    };

    const report = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Prefix คือคำอุปสรรค ส่วน Suffix คือปัจจัยท้าย',
      document: { title: docSuffixOnlyDistant.title, chunks: docSuffixOnlyDistant.chunks }
    });

    // Sentence 1 has genuine Suffix definition, but Sentence 2 only mentions "prefix" in exercise context
    expect(report.verdict).not.toBe('PASS');
    expect(report.stages.answerFidelity.status).toBe('overgeneralized');

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docSuffixOnlyDistant);
    expect(res.evidenceStatus).toBe('insufficient');
    // Chunk 1 genuinely supports the Suffix portion and is source_grounded
    expect(res.references[0].verificationStatus).toBe('source_grounded');
  });

  it('Test X — Genuine Evidence for Both in Separate Sentences: Positive Control (No False Negative)', () => {
    const docBothValid = {
      title: 'Full Terminology Guide',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          documentId: 'doc1',
          chunkIndex: 1,
          text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว). Suffix (ปัจจัยท้าย) คือส่วนที่เติมท้ายคำหลัก เช่น -itis (การอักเสบ) และ -ectomy (การผ่าตัดออก)',
          charCount: 165
        }
      ]
    };

    const report = verifyAcademicAnswer({
      query: 'เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์',
      candidateAnswer: 'Prefix คือส่วนที่เติมหน้าคำหลัก เช่น brady- ส่วน Suffix คือส่วนที่เติมท้ายคำหลัก เช่น -itis อ้างอิงจาก [chunk 1]',
      document: { title: docBothValid.title, chunks: docBothValid.chunks }
    });

    // Both Prefix and Suffix have genuine clause-level definitions and examples in chunk 1 -> Must PASS
    expect(report.stages.answerFidelity.status).toBe('aligned');
    expect(report.verdict).toBe('PASS');
    expect(report.isVerified).toBe(true);

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docBothValid);
    expect(res.evidenceStatus).toBe('sufficient');
    expect(res.verification?.verdict).toBe('PASS');
    expect(res.references[0].verificationStatus).toBe('source_grounded');
  });

  it('Test Y — Locator HTML Entities Normalization: Indices 3 (&#x33; / &#X33;) and 5 (&#X35;) and 10 (1&#x30;) must be decoded cleanly without entity artifacts', () => {
    // 1. Direct cleanChunkLocator tests for hex and uppercase hex entities
    expect(cleanChunkLocator('&#x33;')).toBe('ชิ้นส่วนที่ 3');
    expect(cleanChunkLocator('&#X33;')).toBe('ชิ้นส่วนที่ 3');
    expect(cleanChunkLocator('&#X35;')).toBe('ชิ้นส่วนที่ 5');
    expect(cleanChunkLocator('1&#x30;')).toBe('ชิ้นส่วนที่ 10');
    expect(cleanChunkLocator('&amp;#x33;')).toBe('ชิ้นส่วนที่ 3');
    expect(cleanChunkLocator('1&amp;#x30;')).toBe('ชิ้นส่วนที่ 10');

    // 2. Integration with document having chunkIndex containing uppercase and lowercase hex entities
    const docEntities = {
      title: 'เอกสารที่มี Entity &amp; &#X35; และ &#x33;',
      hasNativePages: false,
      chunks: [
        { chunkIndex: '&#X33;' as any, text: '=== ส่วนที่ 3: ความหมายของ Prefix (คำอุปสรรค) เช่น brady- ===\nPrefix วางไว้หน้าคำหลัก' },
        { chunkIndex: '&#X35;' as any, text: '=== ส่วนที่ 5: ความหมายของ Suffix เช่น -itis ===\nSuffix วางไว้ท้ายคำหลัก' },
        { chunkIndex: '1&#x30;' as any, text: '=== ส่วนที่ 10: ประกาศแจ้งเตือนและระเบียบปฏิบัติ ===\nข้อความระเบียบปฏิบัติทั่วไป' }
      ]
    };

    const res = getAcademicFallback('อธิบาย prefix brady- และ suffix -itis', [], docEntities);
    expect(res.references.length).toBeGreaterThan(0);
    // Every reference locator must be clean and free of &# entities
    for (const ref of res.references) {
      expect(ref.evidenceLocator).not.toContain('&#');
      expect(ref.title).not.toContain('&#');
      expect(ref.excerpt).not.toContain('&#');
    }

    const ref3 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 3');
    expect(ref3).toBeDefined();
    expect(ref3?.evidenceLocator).toBe('ชิ้นส่วนที่ 3');
    expect(ref3?.verificationStatus).toBe('source_grounded');

    const ref5 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 5');
    expect(ref5).toBeDefined();
    expect(ref5?.evidenceLocator).toBe('ชิ้นส่วนที่ 5');

    const ref10 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 10');
    if (ref10) {
      expect(ref10.evidenceLocator).toBe('ชิ้นส่วนที่ 10');
      expect(ref10.verificationStatus).toBe('unsupported_citation');
    }

    // fallbackText must also be clean and free of raw entities
    expect(res.text).not.toContain('&#X33;');
    expect(res.text).not.toContain('&#X35;');
    expect(res.text).not.toContain('1&#x30;');
    expect(res.text).not.toContain('&#');
  });

  it('Test Z — Partial Evidence Fallback & Granular Status: Prefix-only evidence states missing Suffix and isolates chunk status', () => {
    const docPrefixOnly = {
      title: 'Prefix Only Document',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 1 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 },
        { id: '10', documentId: 'doc1', chunkIndex: 10, sourceLocator: 'ชิ้นส่วนที่ 10', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 10 ===\nระเบียบการเรียนการสอนประจำภาคการศึกษา สำหรับนักศึกษาเทคโนโลยีดิจิทัลทางการแพทย์', charCount: 80 }
      ]
    };

    const res = getAcademicFallback('เปรียบเทียบความแตกต่างระหว่าง prefix และ suffix ในศัพท์การแพทย์', [], docPrefixOnly);

    // 1. Answer-level status must be insufficient and not PASS
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.isVerified).toBe(false);

    // 2. Answer text must contain explicit Partial Evidence Notice and mention missing Suffix
    expect(res.text).toContain('คำเตือนความครอบคลุมของหลักฐาน');
    expect(res.text).toContain('ปัจจัยท้าย (Suffix)');
    expect(res.text).toContain('[ส่วนอ้างอิง 1]');
    // Must NOT cite unrelated administrative chunk 10 in the answer body
    expect(res.text).not.toContain('[ส่วนอ้างอิง 10]');

    // 3. Chunk-level status must be distinct: Chunk 1 grounded, Chunk 10 unsupported
    const ref1 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1');
    const ref10 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 10');
    expect(ref1?.verificationStatus).toBe('source_grounded');
    if (ref10) {
      expect(ref10.verificationStatus).toBe('unsupported_citation');
    }

    // 4. Excerpt readability: must be a genuine substring without arbitrary mid-syllable cutoffs
    expect(ref1?.excerpt).toBeDefined();
    expect(ref1?.excerpt?.length).toBeGreaterThan(10);
    expect(ref1?.excerpt).not.toContain('undefined');
  });

  it('Test AA — Thai Excerpt Cleanup: Excerpts must not start with orphaned Thai dependent vowels or tone marks like ำ', () => {
    const sampleText = 'การจัดทำขึ้นเป็นแหล่งเรียนรู้เสริมสำหรับนักศึกษาเทคโนโลยีดิจิทัลทางการแพทย์';
    const excerpt = extractRelevantExcerpt(sampleText, 'แหล่งเรียนรู้');
    // Must not start with orphaned Thai vowel 'ำ'
    expect(excerpt.startsWith('ำ')).toBe(false);
    expect(excerpt.startsWith('...ำ')).toBe(false);
  });

  it('Test AB — Locator Entity Normalization: Chunk index with HTML entities (e.g. &#x35;, &#x33;) decodes cleanly to normal numbers without entity remnants', () => {
    const docWithEntities = {
      title: 'Entity Locator Guide',
      hasNativePages: true,
      chunks: [
        { chunkIndex: '&#x33;' as any, text: '=== ส่วนที่ 3: Prefix ===' },
        { chunkIndex: '&#x35;' as any, text: '=== ส่วนที่ 5: Suffix ===' },
        { chunkIndex: '&#x36;' as any, text: '=== ส่วนที่ 6: Safety ===' }
      ]
    };

    const res = getAcademicFallback('Prefix Suffix Safety', [], docWithEntities);
    for (const ref of res.references) {
      expect(ref.evidenceLocator).not.toContain('&#');
      expect(ref.evidenceLocator).toMatch(/ชิ้นส่วนที่ \d+/);
    }

    const loc3 = cleanChunkLocator('&#x33;');
    const loc5 = cleanChunkLocator('&#x35;');
    const loc6 = cleanChunkLocator('&#x36;');

    expect(loc3).toBe('ชิ้นส่วนที่ 3');
    expect(loc5).toBe('ชิ้นส่วนที่ 5');
    expect(loc6).toBe('ชิ้นส่วนที่ 6');
  });

  it('Test AC — Real DTM67-111 Source Integration & Full-Text Grounding for Prefix & Suffix', () => {
    const rawText = fs.readFileSync(path.resolve(process.cwd(), 'test-assets/ground-truth/dtm67-111-source.md'), 'utf-8');
    const chunks = chunkText(rawText, { documentId: 'doc-dtm-real', maxChunkChars: 900 });
    const prompt = 'อธิบายความแตกต่างระหว่าง Prefix และ Suffix พร้อมยกตัวอย่าง ความหมาย และอ้างอิงจากเอกสารที่เลือก';
    
    const res = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: chunks
    });

    // Part 1: Source Document Content Check (Ground Truth contains info independently)
    const hasSourcePrefixDef = /คำอุปสรรค|เติมหน้า/i.test(rawText);
    const hasSourcePrefixEx = /brady-|tachy-/i.test(rawText);
    const hasSourceSuffixDef = /ปัจจัยท้าย|เติมท้าย|พยาธิสภาพ|คำปัจจัย/i.test(rawText);
    const hasSourceSuffixEx = /-itis|-ectomy|-scopy/i.test(rawText);

    expect(hasSourcePrefixDef).toBe(true);
    expect(hasSourcePrefixEx).toBe(true);
    expect(hasSourceSuffixDef).toBe(true);
    expect(hasSourceSuffixEx).toBe(true);

    // Part 2: Rigorous Reference-to-Chunk Identity, Traceability, and Contract Invariants
    expect(res.references.length).toBeGreaterThan(0);
    for (const ref of res.references) {
      // 2a. Reference Contract & Status Invariants
      expect(ref.evidenceLocator).not.toContain('&#');
      expect(ref.evidenceLocator).not.toContain('&amp;');
      expect(ref.evidenceLocator).not.toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect(ref.evidenceLocator).toMatch(/^ชิ้นส่วนที่ \d+$/);
      expect(ref.evidenceLocator).not.toContain('หน้า');
      expect(ref.sourceLocatorProvenance).toBe('source_heading');
      expect((ref as any).isLocatorVerified).toBe(true);
      expect(ref.verificationStatus).toBe('source_grounded');

      // 2b. Identity Traceability: Excerpt MUST trace back strictly to the specific cited chunk
      const chunkId = ref.uri.replace(/^#chunk-/, '');
      const sourceChunk = chunks.find(c => c.id === chunkId || String(c.chunkIndex) === chunkId);
      expect(sourceChunk).toBeDefined();

      const cleanExcerpt = (ref.excerpt || '').replace(/^\.\.\./, '').replace(/\.\.\.$/, '').trim();
      expect(cleanExcerpt.length).toBeGreaterThan(15);
      const normalizedSource = sourceChunk!.text.replace(/[*_#]+/g, '').replace(/\s+/g, ' ');
      expect(normalizedSource).toContain(cleanExcerpt);
    }

    // Part 3: Retrieval Grounding Validation strictly on Reference Excerpts (WITHOUT rawText and WITHOUT res.text)
    const retrievedExcerptsCombined = res.references.map(r => r.excerpt || '').join(' \n ');
    
    // 3a. Prefix Validation in retrieved references
    const hasRetrievedPrefixDef = /คำอุปสรรค|ส่วนนำหน้า|วางไว้ข้างหน้า/i.test(retrievedExcerptsCombined);
    const hasRetrievedPrefixEx = /brady-|tachy-/i.test(retrievedExcerptsCombined);
    expect(hasRetrievedPrefixDef).toBe(true);
    expect(hasRetrievedPrefixEx).toBe(true);

    // 3b. Suffix Validation in retrieved references
    const hasRetrievedSuffixDef = /ปัจจัยท้าย|คำปัจจัย|ส่วนลงท้าย|พยาธิสภาพ/i.test(retrievedExcerptsCombined);
    const hasRetrievedSuffixEx = /-itis|-ectomy|-scopy|splenomegaly|-algia/i.test(retrievedExcerptsCombined);
    expect(hasRetrievedSuffixDef).toBe(true);
    expect(hasRetrievedSuffixEx).toBe(true);

    // Part 4: Answer Completeness & Verification Verdict Check
    expect(res.evidenceStatus).toBe('sufficient');
    expect(res.verification?.verdict).toBe('PASS');
    expect(res.verification?.isVerified).toBe(true);
  });

  it('Test AD — Negative Test: Document with only Prefix and no Suffix detects missing parts and returns insufficient status', () => {
    const docPrefixOnly = {
      title: 'เอกสารตัวอย่างเฉพาะ Prefix',
      courseCode: 'DTM67-111',
      hasNativePages: true,
      chunks: [
        { chunkIndex: 1, text: '=== ส่วนที่ 1: Prefix (คำอุปสรรค) ===\nPrefix คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)' }
      ]
    };

    const prompt = 'อธิบายความแตกต่างระหว่าง Prefix และ Suffix พร้อมยกตัวอย่าง ความหมาย และอ้างอิงจากเอกสารที่เลือก';
    const res = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], docPrefixOnly);

    // 1. Evidence status must be insufficient due to missing Suffix
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.isVerified).toBe(false);

    // 2. Answer text must contain Partial Evidence Notice and indicate missing Suffix
    expect(res.text).toContain('คำเตือนความครอบคลุมของหลักฐาน');
    expect(res.text).toContain('ปัจจัยท้าย (Suffix)');
    expect(res.text).toContain('[ส่วนอ้างอิง 1]');
  });

  it('Test AE — False Positive Prevention: Answer mentions both Prefix and Suffix, but retrieved references support only Prefix', () => {
    const docPrefixOnlyGroundTruth = {
      title: 'เอกสารตัวอย่างเฉพาะ Prefix เท่านั้น',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: '=== ส่วนที่ 1: Prefix (คำอุปสรรค) ===\nPrefix คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)' }
      ]
    };

    const prompt = 'อธิบายความแตกต่างระหว่าง Prefix และ Suffix พร้อมยกตัวอย่าง ความหมาย และอ้างอิงจากเอกสารที่เลือก';
    const res = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], docPrefixOnlyGroundTruth);

    // 1. Source Document Check: source lacks Suffix
    const sourceText = docPrefixOnlyGroundTruth.chunks.map(c => c.text).join(' ');
    expect(/ปัจจัยท้าย|Suffix/i.test(sourceText)).toBe(false);

    // 2. Retrieved Reference Evidence Check (Strictly excluding res.text): reference evidence lacks Suffix
    const refEvidenceText = res.references.map(r => r.excerpt || '').join(' ');
    expect(/-itis|-ectomy|-scopy/i.test(refEvidenceText)).toBe(false);

    // 3. Completeness & Verification Check: must NOT be PASS / must be insufficient
    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.verification?.verdict).not.toBe('PASS');
    expect(res.verification?.isVerified).toBe(false);
  });

  it('Test AF — Traceability & Citation Mismatch Prevention: Reference excerpt not matching source chunk text is flagged as unsupported', () => {
    const docTraceability = {
      title: 'Traceability Test Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: '=== ส่วนที่ 1: Prefix (คำอุปสรรค) ===\nPrefix คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 110 },
        { id: '5', documentId: 'doc1', chunkIndex: 5, text: '=== ส่วนที่ 5: ข้อความทั่วไปที่ไม่มีเนื้อหาอ้างอิงทางการแพทย์ ===', charCount: 60 }
      ]
    };

    // Case 1: Malformed bracket citation with inline claim injection
    const reportMalformed = verifyAcademicAnswer({
      query: 'อธิบาย Prefix ในเอกสาร',
      candidateAnswer: 'Prefix คือคำอุปสรรค [ชิ้นส่วนที่ 5 อ้างอิงข้อความปลอมว่า -itis คือการอักเสบ]',
      document: { title: docTraceability.title, chunks: docTraceability.chunks }
    });
    expect(reportMalformed.verdict).not.toBe('PASS');
    expect(reportMalformed.stages.evidenceFidelity.unsupportedCitations.length).toBeGreaterThan(0);

    // Case 2: Standard bracket citation pointing to chunk 5 which does not support the medical claim
    const reportMismatch = verifyAcademicAnswer({
      query: 'อธิบาย Prefix และ Suffix ในเอกสาร',
      candidateAnswer: 'Prefix คือคำอุปสรรค [ชิ้นส่วนที่ 1] ส่วน Suffix คือคำต่อท้าย เช่น -itis [ชิ้นส่วนที่ 5]',
      document: { title: docTraceability.title, chunks: docTraceability.chunks }
    });
    expect(reportMismatch.verdict).not.toBe('PASS');
    expect(reportMismatch.isVerified).toBe(false);
  });

  it('Test AG — Locator entity decoding: handles &#x34;, &amp;#x34;, ชิ้นส่วนที่ &#x34;, and returns empty string for unconfirmed digits without defaulting to 1', () => {
    expect(cleanChunkLocator('&#x34;')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('&amp;#x34;')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('ชิ้นส่วนที่ &#x34;')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('ชิ้นส่วนที่ &amp;#x34;')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('abc')).toBe('');
    expect(cleanChunkLocator('')).toBe('');
    expect(cleanChunkLocator(null as any)).toBe('');
    expect(cleanChunkLocator(undefined as any)).toBe('');
    expect(cleanChunkLocator('no_digits')).not.toBe('ชิ้นส่วนที่ 1');
  });

  it('Test AH — Reference Card filtering logic: strictly whitelists source_grounded and excludes unverified, unsupported_citation, undefined, null using production filterDisplayedReferences', () => {
    const rawReferences = [
      { id: '1', title: 'Grounded Prefix', verificationStatus: 'source_grounded', excerpt: 'Prefix definition' },
      { id: '2', title: 'Grounded Suffix', verificationStatus: 'source_grounded', excerpt: 'Suffix definition' },
      { id: '3', title: 'Unsupported chunk', verificationStatus: 'unsupported_citation', excerpt: 'Irrelevant text' },
      { id: '4', title: 'Unverified item', verificationStatus: 'unverified', excerpt: 'Unverified text' },
      { id: '5', title: 'Undefined status', verificationStatus: undefined as any, excerpt: 'No status' },
      { id: '6', title: 'Null status', verificationStatus: null as any, excerpt: 'Null status' }
    ];

    // Test Document Grounding mode: strictly whitelist 'source_grounded'
    const displayedDoc = filterDisplayedReferences(rawReferences, true);
    expect(displayedDoc).toHaveLength(2);
    expect(displayedDoc.every(r => r.verificationStatus === 'source_grounded')).toBe(true);
    expect(displayedDoc.some(r => r.id === '3')).toBe(false);
    expect(displayedDoc.some(r => r.id === '4')).toBe(false);
    expect(displayedDoc.some(r => r.id === '5')).toBe(false);
    expect(displayedDoc.some(r => r.id === '6')).toBe(false);

    // Test non-document mode: excludes unsupported_citation, unverified, and missing status
    const displayedNonDoc = filterDisplayedReferences(rawReferences, false);
    expect(displayedNonDoc).toHaveLength(2);
    expect(displayedNonDoc.every(r => r.verificationStatus === 'source_grounded')).toBe(true);
  });

  it('Test AI — Unsupported chunks exclusion from fallbackText: citations never leak text from unsupported chunks', () => {
    const docWithMixedChunks = {
      title: 'เอกสารคำศัพท์และการจัดการ',
      courseCode: 'DTM67-111',
      hasNativePages: true,
      chunks: [
        { chunkIndex: 1, text: '=== ส่วนที่ 1: Prefix (คำอุปสรรค) ===\nPrefix คือคำที่เติมข้างหน้าคำหลัก เช่น brady- (ช้า)' },
        { chunkIndex: 2, text: '=== ส่วนที่ 2: Suffix (ปัจจัยท้าย) ===\nSuffix คือคำต่อท้าย เช่น -itis (การอักเสบ)' },
        { chunkIndex: 9, text: '=== ส่วนที่ 9: ตารางเวรและวันหยุดประจำปี 2568 ห้ามนำส่งสิ่งส่งตรวจ ===' }
      ]
    };

    const prompt = 'อธิบาย Prefix และ Suffix พร้อมยกตัวอย่างจากเอกสาร';
    const res = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], docWithMixedChunks);

    // Ensure fallback text has grounded citations but NEVER mentions chunk 9 or administrative text
    expect(res.text).toContain('[ส่วนอ้างอิง 1]');
    expect(res.text).toContain('[ส่วนอ้างอิง 2]');
    expect(res.text).not.toContain('[ส่วนอ้างอิง 9]');
    expect(res.text).not.toContain('ตารางเวร');
    expect(res.text).not.toContain('วันหยุดประจำปี');
  });

  it('Test AJ — Negative Suffix Test: Missing Suffix in document does not state Suffix examples as document facts', () => {
    const docPrefixOnly = {
      title: 'เอกสารที่มีเฉพาะคำนำหน้า',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        { chunkIndex: 4, text: '=== ส่วนที่ 4: คำอุปสรรคทางการแพทย์ (Prefix) ===\nPrefix เช่น brady- (ช้า), tachy- (เร็ว)' }
      ]
    };

    const prompt = 'อธิบาย Prefix และ Suffix พร้อมยกตัวอย่างจากเอกสารที่เลือกเท่านั้น';
    const res = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], docPrefixOnly);

    expect(res.evidenceStatus).toBe('insufficient');
    expect(res.text).toContain('⚠️ **คำเตือนความครอบคลุมของหลักฐาน (Partial Evidence Notice):**');
    expect(res.text).toContain('ไม่พบข้อมูลเกี่ยวกับ: ปัจจัยท้าย (Suffix)');
    // Must NOT state -itis or -ectomy as confirmed facts from document
    expect(res.text).not.toContain('-itis');
    expect(res.text).not.toContain('-ectomy');

    // 1. Explicitly confirm groundedRefs is NOT empty (preventing vacuous every() pass)
    const groundedRefs = res.references.filter(r => r.verificationStatus === 'source_grounded');
    expect(groundedRefs.length).toBeGreaterThan(0);

    // 2. Explicitly confirm genuine expected Prefix evidence exists in groundedRefs
    const hasExpectedPrefixEvidence = groundedRefs.some(r =>
      /brady-|tachy-|คำอุปสรรค|prefix/i.test(r.excerpt || '')
    );
    expect(hasExpectedPrefixEvidence).toBe(true);

    // 3. Explicitly confirm NO reference contains Suffix evidence
    const hasAnySuffixEvidence = res.references.some(r =>
      /-itis|-ectomy|-scopy|ปัจจัยท้าย|คำต่อท้าย|suffix/i.test(r.excerpt || '')
    );
    expect(hasAnySuffixEvidence).toBe(false);

    // 4. Also assert every groundedRef does NOT contain suffix morphemes
    expect(groundedRefs.every(r => !r.excerpt || !/-itis|-ectomy|-scopy/i.test(r.excerpt))).toBe(true);
  });

  it('Test AK — Non-locator arbitrary text containing digits must NOT be extracted into fake chunk locators', () => {
    // Non-locator inputs that previously were falsely parsed by .replace(/\D/g, '') or loose regex
    expect(cleanChunkLocator('DTM67-111')).toBe('');
    expect(cleanChunkLocator('ประกาศ 2568')).toBe('');
    expect(cleanChunkLocator('CBC-12')).toBe('');
    expect(cleanChunkLocator('รหัสวิชา 101')).toBe('');
    expect(cleanChunkLocator('sample_99')).toBe('');
    expect(cleanChunkLocator('หมวดที่ 2')).toBe('');

    // Valid locator inputs must still parse correctly
    expect(cleanChunkLocator(4)).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('4')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('ชิ้นส่วนที่ 4')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('chunk 4')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('#chunk-4')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('ส่วนอ้างอิง 4')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('&#x34;')).toBe('ชิ้นส่วนที่ 4');
    expect(cleanChunkLocator('หน้า 3')).toBe('หน้า 3');
  });

  it('Test AL — Chunks without chunkIndex do NOT manufacture idx + 1 from array index', () => {
    const docWithoutChunkIndex = {
      title: 'เอกสารไม่มีการระบุ chunkIndex',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        { text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- และ tachy-' }
      ]
    };

    const res = getAcademicFallback('Prefix', [], docWithoutChunkIndex);
    // References should NOT have an invented 'ชิ้นส่วนที่ 1'
    for (const ref of res.references) {
      expect(ref.evidenceLocator).not.toBe('ชิ้นส่วนที่ 1');
    }
  });

  it('Test AM — Reference card filtering handles mixed document chunks and external research links safely', () => {
    const mixedRefs = [
      { id: '1', type: 'document_chunk', verificationStatus: 'source_grounded', title: 'Doc Chunk' },
      { id: '2', type: 'document_chunk', verificationStatus: 'unsupported_citation', title: 'Unsupported Doc Chunk' },
      { id: '3', type: 'external_academic_link', verificationStatus: 'verified_authority', title: 'External Authority' },
      { id: '4', type: 'external_academic_link', verificationStatus: 'unverified', title: 'Unverified External' }
    ];

    // In web_search / non-document grounding mode:
    const filtered = filterDisplayedReferences(mixedRefs, false);
    // Document chunk 1 is source_grounded -> kept
    // Document chunk 2 is unsupported_citation -> excluded
    // External link 3 is verified_authority -> kept
    // External link 4 is unverified -> excluded
    expect(filtered.map(r => r.id)).toEqual(['1', '3']);
  });

  it('Test AN — cleanChunkLocator strictly rejects non-page texts (course codes, Buddhist era years) and handles valid page numbers', () => {
    // 1. Rejection of course code / administrative strings in pageNumber
    expect(cleanChunkLocator(13, 'DTM67-111')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('', 'DTM67-111')).toBe('');
    expect(cleanChunkLocator(null, 'DTM67-111')).toBe('');
    expect(cleanChunkLocator(undefined, 'DTM67-111')).toBe('');

    // 2. Rejection of Buddhist era / Gregorian calendar years in pageNumber
    expect(cleanChunkLocator(13, 'ประกาศ 2568')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('', 'ประกาศ 2568')).toBe('');
    expect(cleanChunkLocator(13, '2568')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('', '2568')).toBe('');
    expect(cleanChunkLocator(13, 'พ.ศ. 2568')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('', 'ปี 2568')).toBe('');

    // 3. Acceptance of genuine valid page representations
    expect(cleanChunkLocator(13, 'หน้า 12')).toBe('หน้า 12');
    expect(cleanChunkLocator(13, 12)).toBe('หน้า 12');
    expect(cleanChunkLocator(13, 'page 4')).toBe('หน้า 4');
    expect(cleanChunkLocator(13, 'p. 5')).toBe('หน้า 5');
    expect(cleanChunkLocator(13, 'p.5')).toBe('หน้า 5');

    // 4. Fallback to chunkIndex when pageNumber is empty or absent
    expect(cleanChunkLocator(13, '')).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator(13, null)).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator(13, undefined)).toBe('ชิ้นส่วนที่ 13');
    expect(cleanChunkLocator('', '')).toBe('');
    expect(cleanChunkLocator(null, null)).toBe('');
  });

  it('Test AO — getAcademicFallback with unpaged document (hasNativePages: false) must NOT manufacture page numbers', () => {
    const unpagedDoc = {
      title: 'ใบความรู้รายวิชา DTM67-111',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        {
          id: '1',
          chunkIndex: 1,
          pageNumber: 'DTM67-111', // Malformed/misassigned course code as pageNumber
          text: 'Prefix (คำอุปสรรค) เช่น brady- (ช้า) และ tachy- (เร็ว) ในศัพท์วิทยาศาสตร์การแพทย์'
        }
      ]
    };

    const res = getAcademicFallback('คำอุปสรรค Prefix มีอะไรบ้าง', [], unpagedDoc);

    // References must not fabricate chunk locators from unprovenanced unpaged chunks
    expect(res.references.length).toBeGreaterThan(0);
    for (const ref of res.references) {
      expect(ref.evidenceLocator).not.toContain('หน้า');
      expect(ref.evidenceLocator).not.toContain('67111');
      expect(ref.evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    }

    // Fallback text citations must not contain 'หน้า'
    expect(res.text).not.toContain('หน้า 67111');
    expect(res.text).not.toContain('| หน้า');
  });

  it('Test AP — getAcademicFallback with paged document (hasNativePages: true) preserves genuine page numbers', () => {
    const pagedDoc = {
      title: 'เอกสารคำสอนโลหิตวิทยาคลินิก',
      courseCode: 'DTM67-202',
      hasNativePages: true,
      totalPages: 15,
      chunks: [
        {
          id: '2',
          chunkIndex: 2,
          pageNumber: 3,
          text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น micro- (เล็ก) และ macro- (ใหญ่) ในทางโลหิตวิทยา'
        }
      ]
    };

    const res = getAcademicFallback('อธิบาย Prefix ทางโลหิตวิทยา', [], pagedDoc);

    expect(res.references.length).toBeGreaterThan(0);
    const ref = res.references[0];
    expect(ref.evidenceLocator).toBe('หน้า 3');
    expect(ref.pageNumber).toBe(3);
    expect(res.text).toContain('หน้า 3');
  });

  it('Test AQ — Arbitrary non-page strings in pageNumber do not pollute fallback text citations', () => {
    const docWithAnnouncements = {
      title: 'เอกสารข้อกำหนดการศึกษา',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: [
        {
          id: '5',
          chunkIndex: 5,
          sourceLocator: 'ชิ้นส่วนที่ 5',
          sourceLocatorProvenance: 'source_heading',
          pageNumber: 'ประกาศ 2568',
          text: '=== ส่วนที่ 5 ===\nPrefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) เพื่อเปลี่ยนความหมาย'
        }
      ]
    };

    const res = getAcademicFallback('Prefix คืออะไร', [], docWithAnnouncements);

    expect(res.references.length).toBeGreaterThan(0);
    expect(res.references[0].evidenceLocator).toBe('ชิ้นส่วนที่ 5');
    expect(res.references[0].evidenceLocator).not.toContain('2568');
    expect(res.text).not.toContain('หน้า 2568');
    expect(res.text).not.toContain('2568');
  });

  // --- P0-C Regression Tests (Cases 1 - 5) ---
  it('P0-C Case 1 — Valid locator (chunkIndex: 5) preserves locator and matches citation', () => {
    const doc = {
      title: 'Valid Locator Doc',
      hasNativePages: false,
      chunks: [
        { chunkIndex: 5, sourceLocator: 'ชิ้นส่วนที่ 5', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 5 ===\nPrefix (คำอุปสรรค) คือส่วนเติมหน้า เช่น brady- (ช้า)' }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ชิ้นส่วนที่ 5');
    expect(res.text).toContain('ส่วนอ้างอิง 5');
  });

  it('P0-C Case 2 — Missing locator (no chunkIndex, no page) does NOT fabricate "ชิ้นส่วนที่ 1" from array index', () => {
    const doc = {
      title: 'Missing Locator Doc',
      hasNativePages: false,
      chunks: [
        { text: 'Prefix (คำอุปสรรค) คือส่วนเติมหน้า เช่น brady- (ช้า)' }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    expect(res.text).not.toContain('ชิ้นส่วนที่ 1');
  });

  it('P0-C Case 3 — Invalid locator ("DTM67-111") is not converted to fake locator or page', () => {
    const doc = {
      title: 'Invalid Locator Doc',
      hasNativePages: false,
      chunks: [
        { chunkIndex: 'DTM67-111', text: 'Prefix (คำอุปสรรค) คือส่วนเติมหน้า เช่น brady- (ช้า)' }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    expect(res.text).not.toContain('ชิ้นส่วนที่ 1');
    expect(res.text).not.toContain('67111');
  });

  it('P0-C Case 4 — Mixed chunks (valid locator mixed with missing locator) do not corrupt other chunk locators', () => {
    const doc = {
      title: 'Mixed Chunks Doc',
      hasNativePages: false,
      chunks: [
        { text: 'Unindexed chunk text about prefix.' },
        { chunkIndex: 4, sourceLocator: 'ชิ้นส่วนที่ 4', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 4 ===\nPrefix (คำอุปสรรค) คือส่วนเติมหน้า เช่น brady- (ช้า)' }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    const ref4 = res.references.find(r => r.evidenceLocator === 'ชิ้นส่วนที่ 4');
    expect(ref4).toBeDefined();
    expect(res.references.some(r => r.evidenceLocator === 'ชิ้นส่วนที่ 1')).toBe(false);
  });

  it('P0-C Case 5 — UI filter and card mapping correctly filters unsupported citations and unverified items', () => {
    const mixedRefs = [
      { id: '1', type: 'document_chunk', verificationStatus: 'source_grounded', evidenceLocator: 'ชิ้นส่วนที่ 5', title: 'Grounded Card' },
      { id: '2', type: 'document_chunk', verificationStatus: 'unsupported_citation', evidenceLocator: 'ชิ้นส่วนที่ 3', title: 'Unsupported Card' }
    ];
    const filtered = filterDisplayedReferences(mixedRefs, true);
    expect(filtered).toHaveLength(1);
    expect((filtered[0] as any).evidenceLocator).toBe('ชิ้นส่วนที่ 5');
  });

  it('P0-C Case 6 — Unindexed chunk on unpaged document without chunkIndex does not become a Source Locator', () => {
    const doc = {
      title: 'Unindexed Unpaged Doc',
      hasNativePages: false,
      chunks: [
        { text: 'Prefix (คำอุปสรรค) คือส่วนเติมหน้า เช่น brady- (ช้า)' }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
  });

  it('P0-C Case 7 — chunkText() generated unpaged note chunks without source headings do not fabricate source locators', () => {
    const rawNote = 'Prefix คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว) โดยไม่มีหัวข้อส่วนหรือเลขหน้า';
    const generatedChunks = chunkText(rawNote, { documentId: 'raw-note' });
    const doc = {
      title: 'Raw Unpaged Note',
      hasNativePages: false,
      chunks: generatedChunks
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    for (const ref of res.references) {
      expect(ref.evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
      expect((ref as any).isLocatorVerified).toBe(false);
    }
  });

  it('P0-C Case 8 — Dashed heading format ("--- ส่วนที่ 1: ... ---") resolves to verified "ชิ้นส่วนที่ 1" with source_grounded status', () => {
    const doc = {
      title: 'DTM67-111 บันทึกความจำคำศัพท์แพทย์',
      hasNativePages: false,
      chunks: [
        {
          id: 'chunk-1',
          chunkIndex: 1,
          text: '--- ส่วนที่ 1: การแนะนำศัพท์แพทย์เบื้องต้น (Medical Terminology) ---\nPrefix คือส่วนเติมหน้า เช่น brady- (ช้า) tachy- (เร็ว)'
        }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ชิ้นส่วนที่ 1');
    expect(res.references[0].verificationStatus).toBe('source_grounded');
    expect((res.references[0] as any).isLocatorVerified).toBe(true);
  });

  it('P0-C Case 9 — Unverified locator chunk has isLocatorVerified false and unconfirmed locator string', () => {
    const doc = {
      title: 'Doc Without Headings or Pages',
      hasNativePages: false,
      chunks: [
        {
          id: 'chunk-unverified',
          chunkIndex: 1,
          text: 'Prefix (คำอุปสรรค) คือส่วนที่วางไว้หน้าคำหลัก เช่น brady- หมายถึง ช้า'
        }
      ]
    };
    const res = getAcademicFallback('Prefix คืออะไร', [], doc);
    expect(res.references).toHaveLength(1);
    expect(res.references[0].evidenceLocator).toBe('ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้');
    expect((res.references[0] as any).isLocatorVerified).toBe(false);
  });
});


