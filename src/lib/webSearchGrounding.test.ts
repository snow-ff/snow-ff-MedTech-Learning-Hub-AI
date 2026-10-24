import { describe, it, expect } from 'vitest';
import {
  classifyMedicalSource,
  isStrictDomainMatch,
  mapGroundingSegments,
  RawGroundingSupport
} from './webSearchGrounding';

describe('Track B1.8 & v1.2 P0 Targeted Fixes: Web Search Grounding & Medical Source Classification', () => {
  describe('1. Medical Source Classification & Domain Boundary Checks', () => {
    it('should correctly classify official global and Thai medical authorities as official_authority', () => {
      const urls = [
        'https://www.who.int/news-room/fact-sheets/detail/blood-safety',
        'https://clsi.org/standards/products/hematology/documents/h20/',
        'https://dmsc.moph.go.th/service-knowledge/cbc-standards',
        'https://www.cdc.gov/labstandards/index.html',
        'https://amtt.org/guidelines/practice-standard'
      ];

      for (const url of urls) {
        const result = classifyMedicalSource(url);
        expect(result.tier).toBe('official_authority');
        expect(result.trustLevel).toBe('high');
        expect(result.isAllowlistedAuthority).toBe(true);
        expect(result.tierLabel).toContain('Official Authority');
      }
    });

    it('should correctly classify biomedical research databases as academic_database without false peer-review claims', () => {
      const urls = [
        'https://pubmed.ncbi.nlm.nih.gov/25425098/',
        'https://www.sciencedirect.com/science/article/pii/S000989811400494X',
        'https://www.nature.com/articles/nmeth.4299',
        'https://www.nejm.org/doi/full/10.1056/NEJMoa1900000'
      ];

      for (const url of urls) {
        const result = classifyMedicalSource(url);
        expect(result.tier).toBe('academic_database');
        expect(result.trustLevel).toBe('high');
        expect(result.isAllowlistedAuthority).toBe(false);
        expect(result.tierLabel).toContain('Academic / Research Database');
      }
    });

    it('STRICT SECURITY: must prevent domain spoofing and rejected attacker domains containing authority names', () => {
      const spoof1 = classifyMedicalSource('https://who.int.attacker.com/malicious-guide');
      expect(spoof1.tier).not.toBe('official_authority');

      const spoof2 = classifyMedicalSource('https://clsi.org.phishing-site.xyz/standards');
      expect(spoof2.tier).not.toBe('official_authority');

      expect(isStrictDomainMatch('who.int.evil.com', 'who.int')).toBe(false);
      expect(isStrictDomainMatch('who.int', 'who.int')).toBe(true);
    });

    it('should flag commercial platforms and unmoderated forums as commercial_risk with explicit warning', () => {
      const commercialUrls = [
        'https://pantip.com/topic/41234567',
        'https://shopee.co.th/supplement-cure-all',
        'https://www.quora.com/What-is-the-treatment-for-leukemia'
      ];

      for (const url of commercialUrls) {
        const result = classifyMedicalSource(url);
        expect(result.tier).toBe('commercial_risk');
        expect(result.trustLevel).toBe('caution');
        expect(result.warningNotice).toContain('คำเตือน');
      }
    });
  });

  describe('2. Segment Text Validation & Offset Integrity (Step 2.A)', () => {
    const sampleText = 'การตรวจ Complete Blood Count (CBC) มีความสำคัญมาก';

    it('should accept exact match of segment text', () => {
      const target = 'Complete Blood Count (CBC)';
      const startIndex = sampleText.indexOf(target);
      const endIndex = startIndex + target.length;

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex, endIndex, text: target }
        }
      ];

      const result = mapGroundingSegments(sampleText, supports, 1);
      expect(result.totalValidSupports).toBe(1);
      expect(result.segments.some(s => s.isGrounded && s.text.includes(target))).toBe(true);
    });

    it('should reject shorter text that is merely a substring (no containment fallback)', () => {
      const target = 'Complete Blood Count (CBC)';
      const startIndex = sampleText.indexOf(target);
      const endIndex = startIndex + target.length;

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex, endIndex, text: 'CBC' } // Shorter substring
        }
      ];

      const result = mapGroundingSegments(sampleText, supports, 1);
      expect(result.totalValidSupports).toBe(0);
      expect(result.linkageStatus).toBe('unlinked');
    });

    it('should reject longer text that merely contains the actual slice (no containment fallback)', () => {
      const target = 'CBC';
      const startIndex = sampleText.indexOf(target);
      const endIndex = startIndex + target.length;

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex, endIndex, text: 'Complete Blood Count (CBC) มีความสำคัญมากที่สุดในทางห้องปฏิบัติการ' } // Longer text
        }
      ];

      const result = mapGroundingSegments(sampleText, supports, 1);
      expect(result.totalValidSupports).toBe(0);
      expect(result.linkageStatus).toBe('unlinked');
    });

    it('should reject completely unrelated text', () => {
      const target = 'CBC';
      const startIndex = sampleText.indexOf(target);
      const endIndex = startIndex + target.length;

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex, endIndex, text: 'เซลล์เม็ดเลือดแดง' }
        }
      ];

      const result = mapGroundingSegments(sampleText, supports, 1);
      expect(result.totalValidSupports).toBe(0);
    });

    it('should handle Thai and Unicode text accurately with NFC normalization', () => {
      const thaiText = 'การตรวจวิเคราะห์ทางห้องปฏิบัติการ';
      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex: 0, endIndex: thaiText.length, text: thaiText }
        }
      ];

      const result = mapGroundingSegments(thaiText, supports, 1);
      expect(result.linkageStatus).toBe('verified_linked');
      expect(result.totalValidSupports).toBe(1);
    });

    it('should reject invalid offsets (out-of-bounds, negative, inverted)', () => {
      const invalidSupports: RawGroundingSupport[] = [
        { groundingChunkIndices: [0], segment: { startIndex: -1, endIndex: 5, text: 'test' } },
        { groundingChunkIndices: [0], segment: { startIndex: 10, endIndex: 2, text: 'test' } },
        { groundingChunkIndices: [0], segment: { startIndex: 0, endIndex: 999, text: 'test' } }
      ];

      const result = mapGroundingSegments(sampleText, invalidSupports, 1);
      expect(result.linkageStatus).toBe('unlinked');
      expect(result.totalValidSupports).toBe(0);
    });
  });

  describe('3. Citation Index Mapping & Filtering Contracts (Step 2.B)', () => {
    it('should correctly remap and filter chunks with invalid URLs, duplicate URLs, and missing titles', () => {
      // Simulating raw chunks and supports transformation contract
      const fullText = 'ข้อมูลการตรวจสุขภาพและห้องปฏิบัติการ';
      const rawChunks = [
        { web: { uri: 'ftp://invalid-protocol.com', title: 'Invalid Protocol' } }, // index 0 (invalid protocol -> filtered out)
        { web: { uri: 'https://who.int/fact-sheet', title: 'WHO Health Guide' } }, // index 1 (valid -> index 0)
        { web: { uri: 'https://who.int/fact-sheet', title: 'WHO Health Guide Duplicate' } }, // index 2 (duplicate URI -> remapped to index 0)
        { web: { uri: 'https://cdc.gov/lab', title: '' } }, // index 3 (missing title -> filtered out)
        { web: { uri: 'https://pubmed.ncbi.nlm.nih.gov/12345', title: 'PubMed Study' } } // index 4 (valid -> index 1)
      ];

      const references: Array<{ title: string; uri: string }> = [];
      const originalToFilteredIndex = new Map<number, number>();

      rawChunks.forEach((chunk, origIdx) => {
        const uri = chunk.web?.uri?.trim();
        const title = chunk.web?.title?.trim();
        if (title && uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
          const existingIdx = references.findIndex(r => r.uri === uri);
          if (existingIdx !== -1) {
            originalToFilteredIndex.set(origIdx, existingIdx);
          } else {
            const newIdx = references.length;
            references.push({ title, uri });
            originalToFilteredIndex.set(origIdx, newIdx);
          }
        }
      });

      expect(references).toHaveLength(2);
      expect(references[0].uri).toBe('https://who.int/fact-sheet');
      expect(references[1].uri).toBe('https://pubmed.ncbi.nlm.nih.gov/12345');

      // Original index 1 (WHO) -> remapped to 0 (citation [1])
      // Original index 4 (PubMed) -> remapped to 1 (citation [2])
      expect(originalToFilteredIndex.get(1)).toBe(0);
      expect(originalToFilteredIndex.get(4)).toBe(1);

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [1, 4],
          segment: { startIndex: 0, endIndex: fullText.length, text: fullText }
        }
      ];

      const mappingResult = mapGroundingSegments(fullText, supports, references.length, {
        chunkIndexMapping: originalToFilteredIndex
      });

      expect(mappingResult.linkageStatus).toBe('verified_linked');
      const groundedSegment = mappingResult.segments.find(s => s.isGrounded);
      expect(groundedSegment?.citationIndices).toEqual([1, 2]);
    });
  });

  describe('4. Linkage Status Integrity & Segment Counting (Step 2.D)', () => {
    it('should correctly count supported and unsupported segments and assign partial_linked when ungrounded text exists', () => {
      const text = 'การตรวจ CBC สำคัญมาก ส่วนการทำ PCR ต้องระมัดระวัง';
      const part1 = 'การตรวจ CBC สำคัญมาก';
      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex: 0, endIndex: part1.length, text: part1 }
        }
      ];

      const result = mapGroundingSegments(text, supports, 1);
      expect(result.linkageStatus).toBe('partial_linked');
      expect(result.supportedSegmentCount).toBe(1);
      expect(result.unsupportedSegmentCount).toBeGreaterThan(0);
    });
  });
});
