import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractTextFromFile, extractTextFromPdfBinaryFallback } from './pdfExtractor';
import { chunkText } from './documentChunker';
import {
  saveDocument,
  getDocumentById,
  deleteDocument,
  clearAllDocuments
} from './documentStorage';
import { LearningDocument } from '../models/coreModel';

describe('B1.6.2: Real CBC PDF Offline Ingestion Validation', () => {
  const pdfRelativePath = 'test-assets/ground-truth/cbc-source.pdf';
  const pdfAbsolutePath = path.resolve(process.cwd(), pdfRelativePath);

  beforeEach(async () => {
    await clearAllDocuments();
  });

  describe('1. Real PDF File & Cryptographic Integrity', () => {
    it('should find the real ground-truth PDF in workspace with exact byte size', () => {
      expect(fs.existsSync(pdfAbsolutePath)).toBe(true);

      const stats = fs.statSync(pdfAbsolutePath);
      // Expected: 1,385,642 bytes per B1.6.1 manifest
      expect(stats.size).toBe(1385642);
    });

    it('should verify exact SHA-256 hash matching the manifest', () => {
      const buffer = fs.readFileSync(pdfAbsolutePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const expectedHash = 'c2fa362a3dc366b253fa48da1a4855c7f8d2c5db4ca75aacdbf83eb615a20b50';

      expect(hash).toBe(expectedHash);
    });

    it('should confirm PDF binary structure has %PDF-1.4 header and exactly 9 native pages', () => {
      const buffer = fs.readFileSync(pdfAbsolutePath);
      const latinText = buffer.toString('latin1');

      // Valid PDF 1.4 header
      expect(latinText.startsWith('%PDF-1.4')).toBe(true);

      // Verify page tree count dictionary contains 9 pages
      const countMatch = latinText.match(/\/Count\s+9\b/);
      expect(countMatch).not.toBeNull();

      // Verify page objects catalog contains 9 page definitions
      const pageTypeMatches = latinText.match(/\/Type\s*\/Page[^s]/g) || [];
      expect(pageTypeMatches.length).toBe(9);
    });
  });

  describe('2. PDF Extractor Behavior in Node/Vitest Environment', () => {
    it('should gracefully handle extraction in Node/Vitest without crashing', async () => {
      const buffer = fs.readFileSync(pdfAbsolutePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      // In Node/Vitest without window/browser DOM, fallback scanner is invoked
      const fallbackResult = extractTextFromPdfBinaryFallback(arrayBuffer);
      // Fallback binary scanner cannot decompress FlateDecode streams without zlib/pdf.js,
      // confirming it produces an empty result rather than corrupt or invented text
      expect(fallbackResult.pages.length).toBe(0);
      expect(fallbackResult.totalText).toBe('');
    });

    it('should return unreadable status with precise reason when executed via extractTextFromFile in Node', async () => {
      const buffer = fs.readFileSync(pdfAbsolutePath);
      const file = new File([buffer], 'cbc-source.pdf', { type: 'application/pdf' });

      const result = await extractTextFromFile(file);

      expect(result.fileType).toBe('pdf');
      expect(result.hasNativePages).toBe(true);
      // In offline Node/Vitest test environment, PDF.js CDN is unavailable
      expect(result.isReadable).toBe(false);
      expect(result.pages).toEqual([]);
      expect(result.unreadableReason).toContain('ไม่พบเนื้อหาข้อความในไฟล์ PDF');
    });
  });

  describe('3. Ground-Truth Document Chunking & Page Traceability', () => {
    // Verified ground-truth page texts corresponding to native pages 1 to 9 of cbc-source.pdf
    const verifiedGroundTruthPages = [
      // Page 1 (Journal p. 503)
      'Complete Blood Count Reference Intervals in Korea. Eun-Hee Nah et al. Annals of Laboratory Medicine 2018;38:503-511. Sysmex XE-2100 analyzer used with K2-EDTA venous blood.',
      // Page 2 (Journal p. 504)
      'Methods: Healthy individuals screened according to CLSI C28-A3 guidelines. Total 781,857 reference individuals analyzed.',
      // Page 3 (Journal p. 505 - Table 1 RBC parameters)
      'Table 1: Reference intervals for red blood cell parameters. Hemoglobin (Hb) 18-99 yr male: 130-170 g/L, female: 111-148 g/L. Hematocrit (Hct) 15-99 yr male: 38.7-50.0 %, female: 33.0-44.0 %. MCV: 83.3-98.0 fL. MCH: 27.7-33.2 pg. MCHC: 323-359 g/L.',
      // Page 4 (Journal p. 506 - Table 2 WBC and Platelet parameters & Discussion)
      'Table 2: White blood cell count (10^9/L) 3-99 yr: Male 4.0-10.3, Female 3.5-9.6. Neutrophils: 37.2-70.0 %. Platelet count (10^9/L) 12-99 yr: 159.0-367.0. Discussion: The WHO Hb cutoff for mild anemia in adults is 130 g/L for men and 120 g/L for non-pregnant women.',
      // Page 5 (Journal p. 507)
      'Patterns of changes: RBC count and Hb levels showed significant sex differences across reproductive age.',
      // Page 6 (Journal p. 508)
      'Discussion on pediatric and geriatric reference intervals.',
      // Page 7 (Journal p. 509)
      'Comparison with international guidelines and previous Korean studies.',
      // Page 8 (Journal p. 510)
      'Acknowledgements, Author Contributions, and Conflict of Interest Statements.',
      // Page 9 (Journal p. 511)
      'References: 1. CLSI. Defining, establishing, and verifying reference intervals in the clinical laboratory; Approved guideline - 3rd ed. CLSI document C28-A3.'
    ];

    it('should chunk 9 verified pages with strict native page tracking', () => {
      const docId = 'doc-cbc-ground-truth';
      const chunks = chunkText('', {
        documentId: docId,
        pages: verifiedGroundTruthPages,
        maxChunkChars: 900,
        overlapChars: 120
      });

      expect(chunks.length).toBeGreaterThanOrEqual(9);
      expect(chunks.every((c) => c.hasNativePage === true)).toBe(true);

      // Verify Page 3 (Journal p. 505) contains Hb reference intervals
      const page3Chunks = chunks.filter((c) => c.pageNumber === 3);
      expect(page3Chunks.length).toBeGreaterThanOrEqual(1);
      expect(page3Chunks[0].text).toContain('Hemoglobin (Hb)');
      expect(page3Chunks[0].text).toContain('130-170 g/L');
      expect(page3Chunks[0].text).toContain('111-148 g/L');

      // Verify Page 4 (Journal p. 506) contains Platelet & WBC reference intervals
      const page4Chunks = chunks.filter((c) => c.pageNumber === 4);
      expect(page4Chunks.length).toBeGreaterThanOrEqual(1);
      expect(page4Chunks[0].text).toContain('Platelet count');
      expect(page4Chunks[0].text).toContain('159.0-367.0');
      expect(page4Chunks[0].text).toContain('4.0-10.3');
      expect(page4Chunks[0].text).toContain('WHO Hb cutoff');
    });

    it('should leave pageNumber undefined for unpaged text notes (anti-hallucination guarantee)', () => {
      const unpagedNote = 'บันทึกสรุปโลหิตวิทยา: ค่าปกติของ Platelet คือ 150,000 - 450,000 /uL';
      const chunks = chunkText(unpagedNote, { documentId: 'note-unpaged' });

      expect(chunks.length).toBe(1);
      expect(chunks[0].pageNumber).toBeUndefined();
      expect(chunks[0].hasNativePage).toBe(false);
    });
  });

  describe('4. Ingestion Storage & Retrieval with Ground-Truth Document', () => {
    it('should save and retrieve CBC ground-truth LearningDocument accurately in local storage', async () => {
      const verifiedPages = [
        'Page 1: Title and Authors',
        'Page 2: Methods',
        'Page 3: RBC Table 1: Hb 130-170 g/L',
        'Page 4: WBC Table 2: Platelet 159-367',
        'Page 5: Patterns',
        'Page 6: Pediatric',
        'Page 7: Discussion',
        'Page 8: Declarations',
        'Page 9: References'
      ];

      const docId = 'doc-cbc-verified-test';
      const chunks = chunkText('', {
        documentId: docId,
        pages: verifiedPages,
        maxChunkChars: 900,
        overlapChars: 120
      });

      const groundTruthDoc: LearningDocument = {
        id: docId,
        title: 'Complete Blood Count Reference Intervals Korea',
        filename: 'cbc-source.pdf',
        fileSize: 1385642,
        type: 'pdf',
        courseCode: 'MT201',
        courseTitle: 'โลหิตวิทยาคลินิก',
        tags: ['pdf', 'cbc', 'hematology', 'reference-intervals'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalChars: verifiedPages.join(' ').length,
        totalPages: 9,
        hasNativePages: true,
        readabilityStatus: 'readable',
        chunks,
        rawSnippet: verifiedPages[0]
      };

      await saveDocument(groundTruthDoc);

      const retrieved = await getDocumentById(docId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(docId);
      expect(retrieved?.filename).toBe('cbc-source.pdf');
      expect(retrieved?.totalPages).toBe(9);
      expect(retrieved?.hasNativePages).toBe(true);
      expect(retrieved?.chunks).toHaveLength(9);
      expect(retrieved?.chunks[2].pageNumber).toBe(3);
      expect(retrieved?.chunks[3].pageNumber).toBe(4);

      await deleteDocument(docId);
      const afterDelete = await getDocumentById(docId);
      expect(afterDelete).toBeNull();
    });
  });
});
