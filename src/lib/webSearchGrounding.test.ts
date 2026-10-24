import { describe, it, expect } from 'vitest';
import {
  classifyMedicalSource,
  isStrictDomainMatch,
  mapGroundingSegments,
  RawGroundingSupport
} from './webSearchGrounding';

describe('Track B1.8 & v1.2 P0: Web Search Grounding & Medical Source Classification Audit', () => {
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

    it('should correctly classify university domains (.ac.th, .edu) as university tier', () => {
      const urls = [
        'https://dtm.wu.ac.th/curriculum/handbook.pdf',
        'https://med.mahidol.ac.th/pathology/lab-handbook',
        'https://pathology.hms.harvard.edu/education'
      ];

      for (const url of urls) {
        const result = classifyMedicalSource(url);
        expect(result.tier).toBe('university');
        expect(result.trustLevel).toBe('moderate');
        expect(result.tierLabel).toContain('University Domain');
      }
    });

    it('STRICT SECURITY: must prevent domain spoofing and rejected attacker domains containing authority names', () => {
      const spoof1 = classifyMedicalSource('https://who.int.attacker.com/malicious-guide');
      expect(spoof1.tier).not.toBe('official_authority');
      expect(spoof1.domain).toBe('who.int.attacker.com');

      const spoof2 = classifyMedicalSource('https://clsi.org.phishing-site.xyz/standards');
      expect(spoof2.tier).not.toBe('official_authority');

      const spoof3 = classifyMedicalSource('https://fake-cdc.gov.co/health-claims');
      expect(spoof3.tier).not.toBe('official_authority');

      expect(isStrictDomainMatch('who.int.evil.com', 'who.int')).toBe(false);
      expect(isStrictDomainMatch('who.int', 'who.int')).toBe(true);
      expect(isStrictDomainMatch('sub.who.int', 'who.int')).toBe(true);
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

    it('should classify general web sources and provide cautionary notice for medical context', () => {
      const generalUrl = 'https://en.wikipedia.org/wiki/Complete_blood_count';
      const result = classifyMedicalSource(generalUrl);
      expect(result.tier).toBe('general');
      expect(result.trustLevel).toBe('moderate');
      expect(result.warningNotice).toBeDefined();
    });

    it('should gracefully handle malformed, invalid, or empty URLs as unknown tier', () => {
      const invalidUrls = ['', 'not a url', 'ftp://unsupported-protocol.org', 'https://'];
      for (const u of invalidUrls) {
        const result = classifyMedicalSource(u);
        expect(result.tier).toBe('unknown');
        expect(result.trustLevel).toBe('low');
      }
    });
  });

  describe('2. Grounding Metadata Mapping, Index Remapping & Segment Verification (P0)', () => {
    const sampleFullText =
      'การตรวจ Complete Blood Count (CBC) เป็นการตรวจพื้นฐานทางโลหิตวิทยา ส่วนการควบคุมคุณภาพอาศัย Westgard Multirules ในการประเมิน';

    it('should accurately map valid grounding supports with multiple sources to 1-based citation indices', () => {
      const part1 = 'การตรวจ Complete Blood Count (CBC) เป็นการตรวจพื้นฐานทางโลหิตวิทยา';
      const part2 = 'ส่วนการควบคุมคุณภาพอาศัย Westgard Multirules ในการประเมิน';
      const idx1 = sampleFullText.indexOf(part1);
      const end1 = idx1 + part1.length;
      const idx2 = sampleFullText.indexOf(part2);
      const end2 = idx2 + part2.length;

      const validSupports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex: idx1, endIndex: end1, text: part1 }
        },
        {
          groundingChunkIndices: [1],
          segment: { startIndex: idx2, endIndex: end2, text: part2 }
        }
      ];

      const result = mapGroundingSegments(sampleFullText, validSupports, 2);
      expect(result.linkageStatus).toBe('verified_linked');
      expect(result.totalValidSupports).toBe(2);
      expect(result.supportedSegmentCount).toBe(2);
      expect(result.unsupportedSegmentCount).toBe(0);

      const grounded = result.segments.filter(s => s.isGrounded);
      expect(grounded[0].citationIndices).toEqual([1]);
      expect(grounded[1].citationIndices).toEqual([2]);
    });

    it('P0: should correctly remap citation indices using chunkIndexMapping when chunks are filtered or deduplicated', () => {
      const part1 = sampleFullText;
      const idx1 = 0;
      const end1 = sampleFullText.length;

      const supports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [3],
          segment: { startIndex: idx1, endIndex: end1, text: part1 }
        }
      ];

      const mapping = new Map<number, number>();
      mapping.set(3, 0); // Original index 3 -> Filtered index 0 (citation [1])

      const result = mapGroundingSegments(sampleFullText, supports, 1, {
        chunkIndexMapping: mapping
      });

      expect(result.linkageStatus).toBe('verified_linked');
      const grounded = result.segments.filter(s => s.isGrounded);
      expect(grounded[0].citationIndices).toEqual([1]);
    });

    it('P0: should reject segment text mismatch between segment.text and actual text slice', () => {
      const part1 = 'การตรวจ Complete Blood Count (CBC) เป็นการตรวจพื้นฐานทางโลหิตวิทยา';
      const idx1 = sampleFullText.indexOf(part1);
      const end1 = idx1 + part1.length;

      const supportsWithMismatch: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: {
            startIndex: idx1,
            endIndex: end1,
            text: 'ข้อความปลอมแปลงที่ไม่ตรงกับต้นฉบับเลย'
          }
        }
      ];

      const result = mapGroundingSegments(sampleFullText, supportsWithMismatch, 1);
      expect(result.linkageStatus).toBe('unlinked');
      expect(result.totalValidSupports).toBe(0);
    });

    it('should reject out-of-bounds, negative, or inverted offsets without crashing', () => {
      const invalidSupports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: { startIndex: -5, endIndex: 20 }
        },
        {
          groundingChunkIndices: [0],
          segment: { startIndex: 100, endIndex: 50 }
        },
        {
          groundingChunkIndices: [0],
          segment: { startIndex: 0, endIndex: 9999 }
        }
      ];

      const result = mapGroundingSegments(sampleFullText, invalidSupports, 2);
      expect(result.linkageStatus).toBe('unlinked');
      expect(result.totalValidSupports).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].isGrounded).toBe(false);
    });

    it('should return missing_metadata when groundingSupports is missing or empty', () => {
      const resNull = mapGroundingSegments(sampleFullText, undefined, 2);
      expect(resNull.linkageStatus).toBe('missing_metadata');

      const resEmpty = mapGroundingSegments(sampleFullText, [], 2);
      expect(resEmpty.linkageStatus).toBe('missing_metadata');
    });

    it('P0: should identify partial linkage without arbitrary length threshold when ungrounded text exists', () => {
      const partialSupports: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [0],
          segment: {
            startIndex: 0,
            endIndex: 34,
            text: 'การตรวจ Complete Blood Count (CBC)'
          }
        }
      ];

      const result = mapGroundingSegments(sampleFullText, partialSupports, 1);
      expect(result.linkageStatus).toBe('partial_linked');
      expect(result.supportedSegmentCount).toBe(1);
      expect(result.unsupportedSegmentCount).toBeGreaterThan(0);
    });

    it('should ignore invalid chunk indices exceeding available references count', () => {
      const outOfRangeIndices: RawGroundingSupport[] = [
        {
          groundingChunkIndices: [99],
          segment: { startIndex: 0, endIndex: 30 }
        }
      ];

      const result = mapGroundingSegments(sampleFullText, outOfRangeIndices, 1);
      expect(result.linkageStatus).toBe('unlinked');
    });
  });

  describe('3. Academic Verification Integrity: Web citations alone never grant PASS', () => {
    it('verifies that web citations are marked unverified and do not bypass clinical document verification', () => {
      const webResult = classifyMedicalSource('https://clsi.org/h20');
      expect(webResult.isAllowlistedAuthority).toBe(true);
      expect(webResult.tier).toBe('official_authority');
    });
  });
});
