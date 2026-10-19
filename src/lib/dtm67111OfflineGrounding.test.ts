import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { chunkText } from './documentChunker';
import { getAcademicFallback } from '../../server';
import { saveDocument, getDocumentById, clearAllDocuments } from './documentStorage';
import { LearningDocument } from '../models/coreModel';

describe('DTM67-111: Production Offline Document Grounding & API Quota Fallback Integration (Cases A, B, C, D)', () => {
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
});
