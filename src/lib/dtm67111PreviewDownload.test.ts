import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DTM67_111_SOURCE_METADATA,
  DTM67_111_HANDOFF_STEPS,
  triggerFileDownload,
  triggerBlobDownload
} from './learningSourceDownload';
import { extractTextFromFile } from './pdfExtractor';
import { chunkText, retrieveGroundedChunks } from './documentChunker';
import {
  saveDocument,
  getDocumentById,
  clearAllDocuments
} from './documentStorage';
import { verifyAcademicAnswer } from './academicVerifier';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

describe('DTM67-111: Preview Download & Manual Import Handoff Audit', () => {
  const publicSourcePath = path.resolve(process.cwd(), 'public/downloads/dtm67-111-source.md');
  const publicManifestPath = path.resolve(process.cwd(), 'public/downloads/dtm67-111-source-manifest.md');
  const testAssetsSourcePath = path.resolve(process.cwd(), 'test-assets/ground-truth/dtm67-111-source.md');

  beforeEach(async () => {
    await clearAllDocuments();
  });

  describe('1. Downloadable Static Assets & Truthful Metadata Contract', () => {
    it('1.1 should have physical dtm67-111-source.md in public/downloads with exact size and sha256', () => {
      expect(fs.existsSync(publicSourcePath)).toBe(true);

      const buffer = fs.readFileSync(publicSourcePath);
      expect(buffer.length).toBe(33296);

      const computedHash = crypto.createHash('sha256').update(buffer).digest('hex');
      expect(computedHash).toBe('bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb');
      expect(computedHash).toBe(DTM67_111_SOURCE_METADATA.sha256);
    });

    it('1.2 should be 100% byte-for-byte identical between test-assets and public/downloads', () => {
      const assetBuf = fs.readFileSync(testAssetsSourcePath);
      const publicBuf = fs.readFileSync(publicSourcePath);

      expect(publicBuf.equals(assetBuf)).toBe(true);
    });

    it('1.3 should have physical manifest file in public/downloads', () => {
      expect(fs.existsSync(publicManifestPath)).toBe(true);
      const manifestText = fs.readFileSync(publicManifestPath, 'utf-8');
      expect(manifestText).toContain('DTM67-111 — Source Fidelity & Page-Reference Audit');
      expect(manifestText).toContain(DTM67_111_SOURCE_METADATA.sha256);
    });

    it('1.4 should confirm metadata enforces hasNativePages: false and no fake book pages', () => {
      expect(DTM67_111_SOURCE_METADATA.hasNativePages).toBe(false);
      expect(DTM67_111_SOURCE_METADATA.totalSections).toBe(7);
      expect(DTM67_111_SOURCE_METADATA.license).toContain('CC BY 4.0');
      expect(DTM67_111_SOURCE_METADATA.courseCode).toBe('DTM67-111');
      expect(DTM67_111_SOURCE_METADATA.courseTitleThai).toBe('ศัพท์เทคนิคทางการแพทย์');
    });

    it('1.5 should verify curriculum course entry matches official DTM 2567 Handbook page 6', () => {
      const course = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-111');
      expect(course).toBeDefined();
      expect(course?.titleThai).toBe(DTM67_111_SOURCE_METADATA.courseTitleThai);
      expect(course?.evidence.pageNumber).toBe(6);
      expect(course?.verificationStatus).toBe('verified');
    });
  });

  describe('2. Manual Import Handoff Workflow Contract', () => {
    it('2.1 should define structured 5-step handoff process from Preview download to Active Grounding', () => {
      expect(DTM67_111_HANDOFF_STEPS.length).toBe(5);

      const step1 = DTM67_111_HANDOFF_STEPS[0];
      expect(step1.title).toContain('ดาวน์โหลดไฟล์เอกสารสรุป');
      expect(step1.detail).toContain('dtm67-111-source.md');

      const step2 = DTM67_111_HANDOFF_STEPS[1];
      expect(step2.title).toContain('เปิดหน้าต่างนำเข้าไฟล์เอกสาร');
      expect(step2.detail).toContain('Document Library');

      const step3 = DTM67_111_HANDOFF_STEPS[2];
      expect(step3.title).toContain('ผูกรายวิชา DTM67-111');
      expect(step3.detail).toContain('DTM67-111: ศัพท์เทคนิคทางการแพทย์');

      const step4 = DTM67_111_HANDOFF_STEPS[3];
      expect(step4.title).toContain('เลือกหรือลากไฟล์มาวาง');
      expect(step4.tip).toContain('hasNativePages: false');

      const step5 = DTM67_111_HANDOFF_STEPS[4];
      expect(step5.title).toContain('เริ่มเรียนรู้และถามตอบอ้างอิงเอกสาร');
    });

    it('2.2 should test programmatic download helpers in browser-like environment', () => {
      // Test triggerBlobDownload
      const content = 'Test download content';
      const success = triggerBlobDownload(content, 'test.md');
      // In Node/Vitest where document may be mocked or window defined, ensure no unhandled throw
      expect(typeof success).toBe('boolean');
    });
  });

  describe('3. Simulated Manual Import of Downloaded File into Document Library', () => {
    it('3.1 should simulate learner downloading and uploading the exact dtm67-111-source.md file', async () => {
      const sourceText = fs.readFileSync(publicSourcePath, 'utf-8');

      // Create a simulated File object as browser input would provide
      const fileBlob = new Blob([sourceText], { type: 'text/markdown' });
      const mockFile = new File([fileBlob], 'dtm67-111-source.md', { type: 'text/markdown' });

      // Step 1: extractTextFromFile
      const extracted = await extractTextFromFile(mockFile);
      expect(extracted.isReadable).toBe(true);
      expect(extracted.fileType).toBe('note');
      expect(extracted.hasNativePages).toBe(false);
      expect(extracted.pages).toBeUndefined();
      expect(extracted.text.length).toBe(sourceText.trim().length);

      // Step 2: chunkText
      const docId = `imported-doc-${Date.now()}`;
      const chunks = chunkText(extracted.text, {
        documentId: docId,
        pages: extracted.pages,
        maxChunkChars: 900,
        overlapChars: 120
      });

      expect(chunks.length).toBeGreaterThanOrEqual(10);
      chunks.forEach((chunk) => {
        expect(chunk.hasNativePage).toBe(false);
        expect(chunk.pageNumber).toBeUndefined();
      });

      // Step 3: Link to course and save to DocumentStorage
      const courseInfo = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-111');
      const importedDoc = {
        id: docId,
        title: extracted.title,
        filename: mockFile.name,
        fileSize: mockFile.size,
        type: extracted.fileType,
        courseCode: 'DTM67-111',
        courseTitle: courseInfo?.titleThai,
        tags: ['DTM67-111', 'Medical Terminology', 'note'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalChars: extracted.text.length,
        totalPages: undefined,
        hasNativePages: false,
        readabilityStatus: 'readable' as const,
        chunks,
        rawSnippet: extracted.text.slice(0, 240) + '...'
      };

      await saveDocument(importedDoc);

      // Step 4: Verify retrieved document in library
      const retrieved = await getDocumentById(docId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.courseCode).toBe('DTM67-111');
      expect(retrieved?.filename).toBe('dtm67-111-source.md');
      expect(retrieved?.hasNativePages).toBe(false);
      expect(retrieved?.chunks.length).toBe(chunks.length);
    });

    it('3.2 should verify Academic Verifier enforces anti-fake-page rule on the imported document', async () => {
      const sourceText = fs.readFileSync(publicSourcePath, 'utf-8');
      const chunks = chunkText(sourceText, {
        documentId: 'doc-verify-handoff',
        maxChunkChars: 900
      });

      // Truthful answer without fake page number
      const passReport = verifyAcademicAnswer({
        query: 'คำว่า Suffix ในคำศัพท์การแพทย์คืออะไร และขั้นตอนการแปลความหมายเริ่มจากส่วนใดก่อน',
        candidateAnswer: 'Suffix คือคำปัจจัยที่วางไว้ข้างหลังรากศัพท์เพื่อบ่งบอกพยาธิสภาพหรือหัตถการ และตามกฎการวิเคราะห์ 3 ขั้นตอน ให้แปลความหมายของ Suffix ก่อนเป็นอันดับแรก ตามที่ระบุในส่วนแนวคิดพื้นฐานของเอกสาร',
        document: {
          title: 'เอกสารสรุปศัพท์เทคนิคทางการแพทย์',
          hasNativePages: false,
          totalPages: undefined,
          chunks
        }
      });

      expect(passReport.isVerified).toBe(true);
      expect(passReport.verdict).toBe('PASS');
      expect(passReport.stages.evidenceFidelity.citedPages.length).toBe(0);

      // Answer fabricating fake page number "หน้า 3 ของหนังสือ"
      const failReport = verifyAcademicAnswer({
        query: 'คำว่า Suffix ในคำศัพท์การแพทย์คืออะไร',
        candidateAnswer: 'Suffix คือคำปัจจัยตามที่ระบุในหน้า 3 ของหนังสือ',
        document: {
          title: 'เอกสารสรุปศัพท์เทคนิคทางการแพทย์',
          hasNativePages: false,
          totalPages: undefined,
          chunks
        }
      });

      expect(failReport.isVerified).toBe(false);
      expect(failReport.verdict).toBe('FAIL');
      expect(failReport.stages.evidenceFidelity.passed).toBe(false);
      expect(failReport.stages.evidenceFidelity.unsupportedCitations.some((c) => c.includes('ไม่มีเลขหน้าจริง'))).toBe(true);
    });
  });
});
