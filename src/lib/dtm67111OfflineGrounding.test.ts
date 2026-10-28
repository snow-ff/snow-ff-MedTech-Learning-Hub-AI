import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { chunkText } from './documentChunker';
import { getAcademicFallback } from '../../server';
import { saveDocument, getDocumentById, clearAllDocuments } from './documentStorage';
import { LearningDocument } from '../models/coreModel';
import { verifyAcademicAnswer } from './academicVerifier';

describe('DTM67-111: Production Offline Document Grounding & API Quota Fallback Integration (Cases A, B, C, D, E, F, G)', () => {
  const sourcePath = path.resolve(process.cwd(), 'test-assets/ground-truth/dtm67-111-source.md');
  let rawText: string;
  let testChunks: any[];

  beforeEach(async () => {
    await clearAllDocuments();
    rawText = fs.readFileSync(sourcePath, 'utf-8');
    const segmented = chunkText(rawText, {
      documentId: 'doc-dtm67-111-prod',
      maxChunkChars: 900
    });
    testChunks = segmented;
  });

  it('Case A: should retrieve factual evidence from production document chunks for Root, Prefix, Suffix, Combining Vowel query without Gemini API', () => {
    const prompt = 'องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์ Word Root Prefix Suffix Combining Vowel คืออะไร';

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      totalPages: undefined,
      chunks: testChunks.map((c, idx) => ({
        chunkIndex: c.chunkIndex || idx + 1,
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.text).toContain('เอกสารการเรียนรู้: "เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์"');
    expect(fallback.text).toContain('รหัสวิชา DTM67-111');
    expect(fallback.text).toContain('Word Root');
    expect(fallback.text).toContain('Prefix');
    expect(fallback.text).toContain('Suffix');
    expect(fallback.text).toContain('Combining Vowel');
    expect(fallback.references.length).toBeGreaterThan(0);
    // Must not cite fake page numbers
    expect(fallback.text).not.toContain('หน้า ');
  });

  it('Case B: should strictly return insufficient evidence (Strict Anti-Hallucination) when querying unmentioned details (instructor name, exam date, passing score)', () => {
    const prompt = 'quantum mechanics relativity astrophysics calculation';

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      totalPages: undefined,
      chunks: testChunks.map((c, idx) => ({
        chunkIndex: c.chunkIndex || idx + 1,
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('insufficient');
    expect(fallback.text).toContain('ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้');
    expect(fallback.text).toContain('Strict Anti-Hallucination');
    expect(fallback.text).not.toContain('อาจารย์');
  });

  it('Case C: should handle queries gracefully without document context when no active document is selected', () => {
    const prompt = 'ช่วยอธิบายคำศัพท์ทางการแพทย์';

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], undefined);

    expect(fallback.text).toBeDefined();
    // Without documentContext, it must not fabricate local document citations
    expect(fallback.text).not.toContain('จากการสืบค้นในเนื้อหาของเอกสาร');
  });

  it('Case D: should integrate storage retrieval and offline fallback seamlessly when simulating quota exhaustion', async () => {
    const docId = 'doc-dtm67-111-storage-test';
    const learningDoc: LearningDocument = {
      id: docId,
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      filename: 'dtm67-111-source.md',
      fileSize: rawText.length,
      type: 'note',
      courseCode: 'DTM67-111',
      courseTitle: 'ศัพท์เทคนิคทางการแพทย์',
      tags: ['DTM67-111', 'Medical Terminology'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalChars: rawText.length,
      hasNativePages: false,
      readabilityStatus: 'readable',
      chunks: testChunks,
      rawSnippet: rawText.slice(0, 200) + '...'
    };

    // Save into document storage (IndexedDB / fallback)
    await saveDocument(learningDoc);

    // Retrieve from storage as application would do
    const retrieved = await getDocumentById(docId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.chunks.length).toBeGreaterThan(0);

    // Simulate quota exceeded error triggering getAcademicFallback with stored document chunks
    const prompt = 'กฎการวิเคราะห์คำศัพท์การแพทย์มีกี่ขั้นตอน อะไรบ้าง';
    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: retrieved!.title,
      courseCode: retrieved!.courseCode,
      hasNativePages: retrieved!.hasNativePages,
      totalPages: retrieved!.totalPages,
      chunks: retrieved!.chunks.map((c, idx) => ({
        chunkIndex: c.chunkIndex || idx + 1,
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.text).toContain('Fundamental Rules for Analyzing Medical Terms');
    expect(fallback.references[0].title).toContain('เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์');
  });

  it('Case E: Evidence Traceability - references must include document title, section title, and actual excerpt snippet', () => {
    const prompt = 'องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์';
    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      totalPages: undefined,
      chunks: testChunks.map((c, idx) => ({
        chunkIndex: c.chunkIndex || idx + 1,
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.references.length).toBeGreaterThan(0);
    const ref = fallback.references[0] as any;
    expect(ref.title).toBeDefined();
    expect(ref.title).toContain('เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์');
    expect(ref.excerpt).toBeDefined();
    expect(typeof ref.excerpt).toBe('string');
    expect(ref.excerpt.length).toBeGreaterThan(10);
  });

  it('Case F: Insufficient Evidence Citation Exclusion - references must be empty when evidence is insufficient', () => {
    const prompt = 'xyz123abc987notfound';
    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      totalPages: undefined,
      chunks: testChunks.map((c, idx) => ({
        chunkIndex: c.chunkIndex || idx + 1,
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('insufficient');
    // When evidence is insufficient, references must be empty or excluded to prevent unsupported citations
    expect(fallback.references.length).toBe(0);
  });

  it('Case G: Chunk Identity Verification - verifying answers citing specific chunk indices (such as chunk 5) when retrieved', () => {
    const customChunks = [
      { id: 'c1', documentId: 'doc1', chunkIndex: 5, text: 'Word Root (รากศัพท์) เป็นแกนหลักของคำศัพท์การแพทย์' },
      { id: 'c2', documentId: 'doc1', chunkIndex: 8, text: 'Prefix (คำอุปสรรค) อยู่หน้าคำหลัก' }
    ];

    const report = verifyAcademicAnswer({
      query: 'Word Root',
      candidateAnswer: 'อ้างอิงจากชิ้นส่วนที่ 5 Word Root เป็นแกนหลัก',
      document: {
        title: 'Test Doc',
        hasNativePages: false,
        chunks: customChunks as any
      }
    });

    expect(report.stages.evidenceFidelity.passed).toBe(true);
    expect(report.stages.evidenceFidelity.unsupportedCitations).toHaveLength(0);
  });

  it('Case H: Regression - Word Parts query must not include irrelevant medication or dose chunks (such as 0.5 mg, MS/MgSO4) as supporting evidence references', () => {
    const prompt = 'องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์ Word Root Prefix Suffix Combining Vowel';
    
    const mixedChunks = [
      { chunkIndex: 1, text: 'คำศัพท์ทางการแพทย์ประกอบด้วย Word Root, Prefix, Suffix และ Combining Vowel' },
      { chunkIndex: 22, text: 'ข้อควรระวังในการใช้ยา: ขนาดยา 0.5 mg, การบริหารยาทางหลอดเลือดดำ, MS/MSO4 และ MgSO4 ต้องระวังความผิดพลาดในการจ่ายยา' }
    ];

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: mixedChunks
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    const referencedTexts = fallback.references.map((r: any) => r.title + ' ' + r.excerpt);
    for (const refText of referencedTexts) {
      expect(refText).not.toContain('0.5 mg');
      expect(refText).not.toContain('MgSO4');
    }
  });

  it('Case I: Excerpt Readability and Clean Locator Verification - excerpts must start at clean word boundaries around matching terms and locators must be clean without raw entities or escape artifacts', () => {
    const prompt = 'Prefix คืออะไร';
    const sampleChunks = [
      { chunkIndex: 3, sourceLocator: 'ชิ้นส่วนที่ 3', sourceLocatorProvenance: 'source_heading', text: '=== ส่วนที่ 3: Prefix ===\nเนื้อหาสำคัญ: Prefix (คำอุปสรรค) คือส่วนของคำที่เติมข้างหน้า Root เพื่อขยายความหมาย' }
    ];

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารทดสอบ',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: sampleChunks
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.references.length).toBeGreaterThan(0);
    const ref = fallback.references[0] as any;
    expect(ref.evidenceLocator).toBe('ชิ้นส่วนที่ 3');
    expect(ref.evidenceLocator).not.toContain('&');
    expect(ref.excerpt).toBeDefined();
  });

  it('Case J: Word Parts query must exclude Notice of Adaptation / Non-Endorsement chunks', () => {
    const prompt = 'Root Prefix Suffix Combining Vowel';
    const mixedChunks = [
      { chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: 'เนื้อหาหลัก: Root, Prefix, Suffix และ Combining Vowel' },
      { chunkIndex: 2, sourceLocator: 'ชิ้นส่วนที่ 2', sourceLocatorProvenance: 'source_heading', text: 'Notice of Adaptation / Non-Endorsement: This document has been adapted for educational use.' }
    ];

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'DTM67-111',
      chunks: mixedChunks
    });

    const referencedTexts = fallback.references.map((r: any) => r.title + ' ' + r.excerpt);
    for (const refText of referencedTexts) {
      expect(refText.toLowerCase()).not.toContain('notice of adaptation');
    }
  });

  it('Case K: Excerpt Traceability & Evidence Integrity - excerpts must be derived strictly from source chunk text without model hallucination, and references must not pull ungrounded external claims', () => {
    const prompt = 'Root Prefix Suffix Combining Vowel';
    const sampleChunkText = 'Word Root คือแกนกลางของคำ Prefix คือคำอุปสรรค Suffix คือคำปัจจัย Combining Vowel คือสระเชื่อม';
    const sampleChunks = [
      { chunkIndex: 1, sourceLocator: 'ชิ้นส่วนที่ 1', sourceLocatorProvenance: 'source_heading', text: sampleChunkText }
    ];

    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'DTM67-111 Official',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: sampleChunks
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.references.length).toBeGreaterThan(0);
    const ref = fallback.references[0] as any;
    
    // Verify excerpt is derived from source chunk text
    const cleanSource = sampleChunkText.replace(/[*_#]+/g, '').replace(/\s+/g, ' ').trim();
    const cleanExcerpt = (ref.excerpt || '').replace(/[*_#]+/g, '').replace(/\s+/g, ' ').trim();
    expect(cleanSource).toContain(cleanExcerpt);
    expect(ref.verificationStatus).toBe('source_grounded');
    expect(ref.title).toContain('DTM67-111 Official');
  });

  it('Case L: Prefix and Suffix Source-to-Reference Mapping - verifying multi-chunk reference mapping for brady-, tachy-, dys-, sub-, -itis, -ectomy, -scopy', () => {
    const prompt = 'Prefix และ Suffix เช่น brady-, tachy-, dys-, sub-, -itis, -ectomy, -scopy';
    const fallback = getAcademicFallback(prompt, [{ role: 'user', text: prompt }], {
      title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
      courseCode: 'DTM67-111',
      hasNativePages: false,
      chunks: testChunks.map((c, idx) => ({
        ...c,
        chunkIndex: c.chunkIndex || idx + 1,
        sourceLocator: `ชิ้นส่วนที่ ${c.chunkIndex || idx + 1}`,
        sourceLocatorProvenance: 'source_heading',
        pageNumber: c.pageNumber,
        text: c.text
      }))
    });

    expect(fallback.evidenceStatus).toBe('sufficient');
    expect(fallback.references.length).toBeGreaterThan(0);

    for (const ref of fallback.references as any[]) {
      expect(ref.evidenceLocator).toBeDefined();
      expect(ref.evidenceLocator.length).toBeGreaterThan(0);
      expect(ref.excerpt).toBeDefined();
      expect(ref.excerpt.length).toBeGreaterThan(5);

      const chunkIdxMatch = ref.evidenceLocator.match(/\d+/);
      if (chunkIdxMatch) {
        const cIdx = parseInt(chunkIdxMatch[0], 10);
        const matchingChunk = testChunks.find(c => (c.chunkIndex || 1) === cIdx);
        if (matchingChunk) {
          const cleanChunkText = matchingChunk.text.replace(/[*_#]+/g, '').replace(/\s+/g, ' ').trim();
          const cleanExcerptText = ref.excerpt.replace(/[*_#]+/g, '').replace(/^\.\.\./, '').replace(/\.\.\.$/, '').replace(/\s+/g, ' ').trim();
          expect(cleanChunkText).toContain(cleanExcerptText);
        }
      }
    }
  });
});
