import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractTextFromFile } from './pdfExtractor';
import { verifyAcademicAnswer } from './academicVerifier';
import { chunkText } from './documentChunker';
import { getBundledDtmSourceText, getBundledDtmManifestText, DTM67_111_SOURCE_METADATA } from './learningSourceDownload';

describe('DTM67-111: Complete Preview File Delivery Repair & Secure Download Validation', () => {
  const sourcePath = path.resolve(process.cwd(), 'test-assets/ground-truth/dtm67-111-source.md');
  const publicPath = path.resolve(process.cwd(), 'public/downloads/dtm67-111-source.md');

  it('A. should verify source markdown file starts with medical terminology study guide title and contains medical terms', () => {
    expect(fs.existsSync(sourcePath)).toBe(true);
    const content = fs.readFileSync(sourcePath, 'utf-8');
    expect(content.startsWith('# เอกสารสรุปภาษาไทยเพื่อการเรียนรู้: ศัพท์เทคนิคทางการแพทย์')).toBe(true);
    expect(content).toContain('Word Root (รากศัพท์)');
    expect(content).toContain('Prefix (คำอุปสรรค');
    expect(content).toContain('Suffix (คำปัจจัย');
    expect(content).toContain('Combining Vowel');
  });

  it('B. should verify downloaded static file matches source byte-for-byte and has correct SHA-256 hash', () => {
    expect(fs.existsSync(publicPath)).toBe(true);
    const sourceBuf = fs.readFileSync(sourcePath);
    const publicBuf = fs.readFileSync(publicPath);

    expect(publicBuf.equals(sourceBuf)).toBe(true);

    const hash = crypto.createHash('sha256').update(publicBuf).digest('hex');
    expect(hash).toBe(DTM67_111_SOURCE_METADATA.sha256);
    expect(hash).toBe('bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb');
    expect(publicBuf.length).toBe(33296);
  });

  it('C. should verify bundled raw source text matches physical source file exactly and provides secure delivery without HTML cookie check', () => {
    const bundledText = getBundledDtmSourceText();
    const diskText = fs.readFileSync(sourcePath, 'utf-8');
    expect(bundledText).toBe(diskText);
    expect(bundledText.length).toBe(diskText.length);
    expect(Buffer.byteLength(bundledText, 'utf-8')).toBe(33296);
    expect(bundledText).not.toContain('Cookie Check');
    expect(bundledText).not.toContain('<!DOCTYPE html>');
  });

  it('D. should reject HTML error pages or Cookie-check responses during file extraction', async () => {
    const htmlCookieCheckContent = `<!DOCTYPE html><html><head><title>Cookie Check</title></head><body>Please complete the cookie check to access this page.</body></html>`;
    const htmlBlob = new Blob([htmlCookieCheckContent], { type: 'text/html' });
    const mockFile = new File([htmlBlob], 'dtm67-111-source.md', { type: 'text/markdown' });

    const extracted = await extractTextFromFile(mockFile);
    expect(extracted.isReadable).toBe(false);
    expect(extracted.text).toBe('');
    expect(extracted.unreadableReason).toContain('หน้าเว็บ HTML');
  });

  it('E. should successfully extract valid markdown source file from bundled/downloaded content', async () => {
    const sourceText = getBundledDtmSourceText();
    const sourceBlob = new Blob([sourceText], { type: 'text/markdown' });
    const mockFile = new File([sourceBlob], 'dtm67-111-source.md', { type: 'text/markdown' });

    const extracted = await extractTextFromFile(mockFile);
    expect(extracted.isReadable).toBe(true);
    expect(extracted.fileType).toBe('note');
    expect(extracted.hasNativePages).toBe(false);
    expect(extracted.text).toContain('Word Root');
  });

  it('F. should ensure Academic Verifier rejects mismatched evidence when chunks are irrelevant HTML', () => {
    const htmlChunks = chunkText('<html>Cookie check error page</html>', {
      documentId: 'doc-html-err',
      maxChunkChars: 500
    });

    const report = verifyAcademicAnswer({
      query: 'องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์ Word Root Prefix Suffix',
      candidateAnswer: 'องค์ประกอบคือ Word Root, Prefix, Suffix และ Combining Vowel',
      document: {
        title: 'Malformed HTML Doc',
        hasNativePages: false,
        chunks: htmlChunks
      }
    });

    expect(report.isVerified).toBe(false);
    expect(report.verdict).toBe('FAIL');
    expect(report.stages.answerFidelity.status).toBe('hallucinated');
  });
});
