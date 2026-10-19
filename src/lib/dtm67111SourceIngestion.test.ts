import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { chunkText } from './documentChunker';
import { retrieveGroundedChunks } from './documentChunker';
import { verifyAcademicAnswer } from './academicVerifier';
import {
  saveDocument,
  getDocumentById,
  deleteDocument,
  clearAllDocuments
} from './documentStorage';
import { LearningDocument, DocumentChunk } from '../models/coreModel';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

describe('DTM67-111: Source Fidelity, Document Integrity & Page-Reference Audit', () => {
  const sourceRelativePath = 'test-assets/ground-truth/dtm67-111-source.md';
  const manifestRelativePath = 'test-assets/ground-truth/dtm67-111-source-manifest.md';
  const sourceAbsolutePath = path.resolve(process.cwd(), sourceRelativePath);
  const manifestAbsolutePath = path.resolve(process.cwd(), manifestRelativePath);

  beforeEach(async () => {
    await clearAllDocuments();
  });

  describe('1. File Provenance, Reality & Cryptographic Integrity', () => {
    it('1.1 should find both adapted source document and manifest in test-assets/ground-truth', () => {
      expect(fs.existsSync(sourceAbsolutePath)).toBe(true);
      expect(fs.existsSync(manifestAbsolutePath)).toBe(true);
    });

    it('1.2 should verify exact file byte size matching the manifest (33,296 bytes)', () => {
      const stats = fs.statSync(sourceAbsolutePath);
      expect(stats.size).toBe(33296);
    });

    it('1.3 should verify exact SHA-256 hash matching the manifest', () => {
      const buffer = fs.readFileSync(sourceAbsolutePath);
      const computedHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const expectedHash = 'bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb';

      expect(computedHash).toBe(expectedHash);
    });

    it('1.4 should confirm document uses section dividers (ส่วนที่ 1–7) instead of pretending to be book pages', () => {
      const rawText = fs.readFileSync(sourceAbsolutePath, 'utf-8');

      // Must NOT contain fake page headers pretending to be PDF pages
      expect(rawText).not.toMatch(/--- Page \d+ ---/);

      // Must contain 7 clear section headers
      for (let sec = 1; sec <= 7; sec++) {
        expect(rawText).toContain(`--- ส่วนที่ ${sec}:`);
      }
    });

    it('1.5 should verify proper credit, CC BY 4.0 license, and non-endorsement disclaimer in source and manifest', () => {
      const sourceText = fs.readFileSync(sourceAbsolutePath, 'utf-8');
      const manifestText = fs.readFileSync(manifestAbsolutePath, 'utf-8');

      // Attribution
      expect(sourceText).toContain('Medical Terminology (2nd Edition, 2024)');
      expect(sourceText).toContain('Kimberly Ernstmeyer');
      expect(sourceText).toContain('Elizabeth Christman');
      expect(sourceText).toContain('Chippewa Valley Technical College');
      expect(sourceText).toContain('Open Resources for Nursing (Open RN)');
      expect(sourceText).toContain('Creative Commons Attribution 4.0');
      expect(sourceText).toContain('https://wtcs.pressbooks.pub/medterm/');
      expect(sourceText).toContain('https://www.ncbi.nlm.nih.gov/books/NBK607454/');

      // Non-endorsement disclaimer
      expect(sourceText).toContain('เอกสารฉบับนี้เป็นการแปล ย่อความ และเรียบเรียงสรุปเป็นภาษาไทยเพื่อการศึกษาเบื้องต้น');
      expect(sourceText).toContain('เจ้าของลิขสิทธิ์ต้นฉบับไม่ได้มีส่วนร่วมหรือรับรองเอกสารฉบับนี้โดยตรง');
      expect(sourceText).toContain('มิใช่ประมวลรายวิชา (Syllabus) หรือเอกสารการสอนอย่างเป็นทางการของมหาวิทยาลัยวลัยลักษณ์');

      // Manifest reflects the same hash and attributes
      expect(manifestText).toContain('bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb');
      expect(manifestText).toContain('NBK607454');
    });

    it('1.6 should explicitly record source fidelity boundaries and external standards in manifest matrix', () => {
      const manifestText = fs.readFileSync(manifestAbsolutePath, 'utf-8');

      // Sections 1-3 mapped to Chapter 1
      expect(manifestText).toContain('Chapter 1: Foundational Concepts - Identifying Word Parts');
      // Sections 4-5 mapped to Chapter 2
      expect(manifestText).toContain('Chapter 2: Medical Language Related to the Whole Body');
      // Section 6 clearly identified as The Joint Commission & ISMP
      expect(manifestText).toContain('The Joint Commission (TJC)');
      expect(manifestText).toContain('Official "Do Not Use" List');
      // Section 7 clearly identified as synthesized informatics standards, not in OpenRN book
      expect(manifestText).toContain('มิได้มีบทสอนมาตรฐาน SNOMED CT หรือ HL7 FHIR');
      expect(manifestText).toContain('ห้ามอ้างว่าเนื้อหานี้มาจากหนังสือ OpenRN');
    });
  });

  describe('2. Text Chunking & Truthful Page Status (hasNativePages: false)', () => {
    it('2.1 should chunk markdown text as a study note with hasNativePage false and no fake page numbers', () => {
      const rawText = fs.readFileSync(sourceAbsolutePath, 'utf-8');
      const docId = 'doc-dtm67-111-note';

      const chunks = chunkText(rawText, {
        documentId: docId,
        maxChunkChars: 1000,
        overlapChars: 150
      });

      expect(chunks.length).toBeGreaterThanOrEqual(10);

      // Verify that chunks do NOT claim to have native book pages
      chunks.forEach((chunk) => {
        expect(chunk.hasNativePage).toBe(false);
        expect(chunk.pageNumber).toBeUndefined();
      });
    });

    it('2.2 should verify section content presence across chunks without claiming fake book page numbers', () => {
      const rawText = fs.readFileSync(sourceAbsolutePath, 'utf-8');
      const chunks = chunkText(rawText, {
        documentId: 'test-sections',
        maxChunkChars: 1000
      });

      const allText = chunks.map((c) => c.text).join(' ');

      // Section 1: Word Components
      expect(allText).toContain('Word Root (รากศัพท์)');
      expect(allText).toContain('Prefix (คำอุปสรรค / ส่วนนำหน้าคำ)');
      expect(allText).toContain('Suffix (คำปัจจัย / ส่วนลงท้ายคำ)');
      expect(allText).toContain('Combining Vowel (สระเชื่อม)');

      // Section 2: Anatomical roots & prefixes
      expect(allText).toContain('Bradycardia');
      expect(allText).toContain('Tachycardia');
      expect(allText).toContain('Cardi/o');
      expect(allText).toContain('Nephr/o');

      // Section 3: Suffixes
      expect(allText).toContain('-ectomy');
      expect(allText).toContain('-ostomy');
      expect(allText).toContain('-plasty');

      // Section 4: Directions & Planes
      expect(allText).toContain('Standard Anatomical Position (ท่ากายวิภาคมาตรฐาน)');
      expect(allText).toContain('Sagittal Plane');
      expect(allText).toContain('Frontal (Coronal) Plane');
      expect(allText).toContain('Transverse (Horizontal / Axial) Plane');

      // Section 5: Cavities & Quadrants
      expect(allText).toContain('Right Upper Quadrant (RUQ)');
      expect(allText).toContain('Right Lower Quadrant (RLQ)');
      expect(allText).toContain('Appendicitis');

      // Section 6: Do Not Use
      expect(allText).toContain('The Joint Commission "Do Not Use" List');
      expect(allText).toContain('Trailing Zero');
      expect(allText).toContain('Lack of Leading Zero');

      // Section 7: Health informatics standards
      expect(allText).toContain('ICD-10 / ICD-11');
      expect(allText).toContain('SNOMED CT');
      expect(allText).toContain('LOINC');
      expect(allText).toContain('HL7 FHIR');
    });
  });

  describe('3. Document Storage & Library Integration Reality', () => {
    it('3.1 should save and retrieve as note with hasNativePages false and totalPages undefined', async () => {
      const rawText = fs.readFileSync(sourceAbsolutePath, 'utf-8');
      const docId = 'doc-dtm67-111-study-guide';

      const chunks = chunkText(rawText, {
        documentId: docId,
        maxChunkChars: 1000
      });

      const learningDoc: LearningDocument = {
        id: docId,
        title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์ (Medical Terminology Study Guide)',
        filename: 'dtm67-111-source.md',
        fileSize: 33296,
        type: 'note',
        courseCode: 'DTM67-111',
        courseTitle: 'ศัพท์เทคนิคทางการแพทย์ (Technical Terms in Medicine)',
        tags: ['DTM67-111', 'Medical Terminology', 'เอกสารสรุป', 'OpenRN', 'CC-BY-4.0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalChars: rawText.length,
        totalPages: undefined, // Truthful: not a paginated PDF
        hasNativePages: false, // Truthful: markdown summary note
        readabilityStatus: 'readable',
        chunks: chunks,
        rawSnippet: rawText.slice(0, 200) + '...'
      };

      await saveDocument(learningDoc);

      const retrieved = await getDocumentById(docId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(docId);
      expect(retrieved?.courseCode).toBe('DTM67-111');
      expect(retrieved?.type).toBe('note');
      expect(retrieved?.totalPages).toBeUndefined();
      expect(retrieved?.hasNativePages).toBe(false);
      expect(retrieved?.chunks.length).toBe(chunks.length);
    });

    it('3.2 should verify course code DTM67-111 directly against curriculumData.ts', () => {
      const course = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-111');
      expect(course).toBeDefined();
      expect(course?.code).toBe('DTM67-111');
      expect(course?.titleThai).toBe('ศัพท์เทคนิคทางการแพทย์');
      expect(course?.titleEnglish).toBe('Technical Terms in Medicine');
      expect(course?.credits).toBe(3);
      expect(course?.category).toBe('major_specific');
      expect(course?.subCategory).toBe('กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ');
      expect(course?.verificationStatus).toBe('verified');
      expect(course?.evidence.pageNumber).toBe(6);
    });
  });

  describe('4. Academic Verification: Anti-Hallucination & Fake Page Prevention', () => {
    let chunks: DocumentChunk[];

    beforeEach(() => {
      const rawText = fs.readFileSync(sourceAbsolutePath, 'utf-8');
      chunks = chunkText(rawText, {
        documentId: 'doc-dtm-audit',
        maxChunkChars: 1000
      });
    });

    it('4.1 should retrieve relevant chunks for key technical concepts without requiring native page numbers', () => {
      const resultWordParts = retrieveGroundedChunks(chunks, 'องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์ Word Root Prefix Suffix', 3);
      expect(resultWordParts.hasEvidence).toBe(true);
      expect(resultWordParts.relevantChunks.length).toBeGreaterThan(0);
      expect(resultWordParts.relevantChunks[0].text).toContain('Word Root');

      const resultDoNotUse = retrieveGroundedChunks(chunks, 'The Joint Commission Do Not Use Trailing zero Leading zero', 3);
      expect(resultDoNotUse.hasEvidence).toBe(true);
      expect(resultDoNotUse.relevantChunks.length).toBeGreaterThan(0);
      expect(resultDoNotUse.relevantChunks[0].text).toContain('Do Not Use');

      const resultInformatics = retrieveGroundedChunks(chunks, 'SNOMED CT LOINC HL7 FHIR มาตรฐานข้อมูลสุขภาพ', 3);
      expect(resultInformatics.hasEvidence).toBe(true);
      expect(resultInformatics.relevantChunks.length).toBeGreaterThan(0);
      expect(resultInformatics.relevantChunks.some((c) => c.text.includes('SNOMED CT'))).toBe(true);
    });

    it('4.2 should verify answer citing content from note correctly without fake page numbers', () => {
      const report = verifyAcademicAnswer({
        query: 'The Joint Commission มีข้อกำหนดห้ามใช้ Trailing Zero อย่างไร และมีเหตุผลความปลอดภัยอะไร',
        candidateAnswer: 'The Joint Commission กำหนดห้ามใส่ Trailing Zero สำหรับจำนวนเต็ม เช่น ห้ามเขียน 5.0 mg โดยให้เขียน 5 mg เนื่องจากหากจุดทศนิยมเลือนราง อาจทำให้ผู้ป่วยได้รับยาเกินขนาด 10 เท่าเป็น 50 mg ตามที่ระบุไว้ในส่วนข้อกำหนดความปลอดภัยของเอกสาร',
        document: {
          title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
          hasNativePages: false, // Truthful note
          totalPages: undefined,
          chunks: chunks
        }
      });

      expect(report.isVerified).toBe(true);
      expect(report.verdict).toBe('PASS');
      expect(report.stages.evidenceFidelity.passed).toBe(true);
      expect(report.stages.evidenceFidelity.citedPages.length).toBe(0); // No fake page numbers cited
      expect(report.stages.answerFidelity.passed).toBe(true);
    });

    it('4.3 should flag and reject answers that invent fake book page citations on unpaged notes', () => {
      const report = verifyAcademicAnswer({
        query: 'The Joint Commission มีข้อกำหนดห้ามใช้ Trailing Zero อย่างไร',
        candidateAnswer: 'The Joint Commission กำหนดห้ามใส่ Trailing Zero ตามที่ระบุในหน้า 6 ของหนังสือ',
        document: {
          title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
          hasNativePages: false, // This is an unpaged summary note!
          totalPages: undefined,
          chunks: chunks
        }
      });

      // Academic Verifier Check 1: Fake pages on unpaged notes must be caught
      expect(report.isVerified).toBe(false);
      expect(report.verdict).toBe('FAIL');
      expect(report.stages.evidenceFidelity.passed).toBe(false);
      expect(report.stages.evidenceFidelity.unsupportedCitations.some((c) => c.includes('ไม่มีเลขหน้าจริง'))).toBe(true);
    });

    it('4.4 should reject candidate answers attempting to fabricate unmentioned laboratory values', () => {
      const report = verifyAcademicAnswer({
        query: 'การตรวจระดับ Cortisol และฮอร์โมน ACTH ในเลือดตามเอกสารคือเท่าใด',
        candidateAnswer: 'ค่าปกติของ Cortisol คือ 10-100 mcg/24h',
        document: {
          title: 'เอกสารสรุป: ศัพท์เทคนิคทางการแพทย์',
          hasNativePages: false,
          totalPages: undefined,
          chunks: chunks
        },
        expectedEvidence: {
          mustContainKeywords: ['Cortisol', 'ACTH']
        }
      });

      // Cortisol/ACTH is not in the document -> Retrieval has no evidence -> Hallucination caught
      expect(report.isVerified).toBe(false);
      expect(report.verdict).toBe('FAIL');
      expect(report.stages.answerFidelity.status).toBe('hallucinated');
    });
  });
});
