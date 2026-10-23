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
    // 1. Negative Case: Suffix query with only anatomical position evidence (completely unrelated topic)
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
    // Reference-level: chunk 13 does not support suffix, so it must be unsupported_citation
    expect(negFallback.references.every(r => r.verificationStatus === 'unsupported_citation')).toBe(true);

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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) อยู่ข้างหน้าคำหลัก เช่น brady- และ tachy-', charCount: 60 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'คำนำ: เอกสารชุดนี้รวบรวมคำศัพท์ prefix และ suffix ทั่วไปในเวชระเบียนโรงพยาบาล', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, text: 'Suffix includes -scopy (การส่องกล้อง) and -gram (ภาพบันทึกภาพ) ในเวชระเบียน.', charCount: 72 }
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
        { id: '2', documentId: 'doc1', chunkIndex: 2, text: 'การตรวจวิเคราะห์ทางห้องปฏิบัติการทางการแพทย์ Complete Blood Count (CBC) ต้องใช้เลือด EDTA หลอดสีม่วง', charCount: 101 },
        { id: '10', documentId: 'doc1', chunkIndex: 10, text: 'ข้อปฏิบัติและการใช้อาคารสำนักงานของบุคลากรทางห้องปฏิบัติการทางการแพทย์', charCount: 72 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 55 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, text: 'Standard Anatomical Position describes standing upright, facing forward.', charCount: 70 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- และ tachy-', charCount: 68 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, text: 'ประกาศเตือน: notice of adaptation และการให้เครดิตแหล่งข้อมูล สำหรับคำศัพท์ Prefix', charCount: 80 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 }
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

  it('Test Q — Positive Control for Multipart Coverage: Genuine evidence for both Prefix and Suffix', () => {
    const docBothParts = {
      title: 'Complete Word Parts Guide',
      hasNativePages: false,
      chunks: [
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, text: 'Suffix (ปัจจัยท้าย) คือส่วนที่เติมท้ายคำหลัก เช่น -itis (การอักเสบ) และ -ectomy (การผ่าตัดออก)', charCount: 82 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'Prefix (คำอุปสรรค) เช่น brady- และ tachy-', charCount: 50 },
        { id: '2', documentId: 'doc1', chunkIndex: 2, text: 'Suffix (ปัจจัยท้าย) เช่น -itis และ -ectomy', charCount: 50 },
        { id: '13', documentId: 'doc1', chunkIndex: 13, text: 'ประกาศเตือน: notice of adaptation และการให้เครดิตแหล่งข้อมูล สำหรับคำศัพท์ Prefix', charCount: 80 }
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
        { id: '1', documentId: 'doc1', chunkIndex: 1, text: 'คำศัพท์ทางการแพทย์ ประกอบด้วยเนื้อหาหลายบทเรียนในหลักสูตร', charCount: 65 },
        { id: '2', documentId: 'doc1', chunkIndex: 2, text: 'Prefix (คำอุปสรรค) คือส่วนที่เติมหน้าคำหลัก เช่น brady- (ช้า) และ tachy- (เร็ว)', charCount: 75 },
        { id: '3', documentId: 'doc1', chunkIndex: 3, text: 'ประกาศลิขสิทธิ์: สงวนลิขสิทธิ์คู่มือการใช้ suffix ทางการแพทย์ โดยชมรมวิชาการ', charCount: 75 }
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
});

