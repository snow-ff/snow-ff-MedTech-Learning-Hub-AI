/**
 * MedTech Learning Hub AI — Web Search Grounding & Medical Source Classification (v1.2)
 *
 * Implements Phase 1 (Grounding Evidence Integrity) & Phase 2 (Source Classification)
 * - Pure functions with strict domain boundary checks against spoofing
 * - Segment-level mapping from groundingSupports and groundingChunks
 * - Separation of source credibility, claim support, and link accessibility
 * - P0 Citation Index Mapping, Strict Segment Text Integrity (Exact match), and Linkage Status Integrity
 */

export type SourceTier =
  | 'official_authority'
  | 'academic_database'
  | 'university'
  | 'general'
  | 'commercial_risk'
  | 'unknown';

export type TrustLevel = 'high' | 'moderate' | 'low' | 'caution';

export interface SourceClassificationResult {
  tier: SourceTier;
  tierLabel: string;
  domain: string;
  trustLevel: TrustLevel;
  warningNotice?: string;
  isAllowlistedAuthority: boolean;
}

export interface RawGroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface RawGroundingSupport {
  groundingChunkIndices?: number[];
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
  confidenceScores?: number[];
}

export interface GroundingSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  citationIndices: number[]; // 1-based reference indices
  isGrounded: boolean;
}

export interface GroundingMappingResult {
  linkageStatus: 'verified_linked' | 'partial_linked' | 'unlinked' | 'missing_metadata';
  segments: GroundingSegment[];
  supportedSegmentCount: number;
  unsupportedSegmentCount: number;
  totalValidSupports: number;
}

export interface GroundingMappingOptions {
  chunkIndexMapping?: Map<number, number> | Record<number, number>;
}

// ---------------------------------------------------------------------------
// Medical & Academic Authority Domain Registry (Strict Domain Boundaries)
// ---------------------------------------------------------------------------

const OFFICIAL_AUTHORITY_DOMAINS = new Set([
  'who.int',
  'cdc.gov',
  'clsi.org',
  'ifcc.org',
  'aabb.org',
  'iso.org',
  'cap.org',
  'nih.gov',
  'fda.gov',
  'ecdc.europa.eu',
  'moph.go.th',
  'dmsc.moph.go.th',
  'ddc.moph.go.th',
  'fda.moph.go.th',
  'amtt.org',
  'medtech.or.th',
  'pathology.or.th',
  'hematology.or.th',
  'nhso.go.th',
  'dtam.moph.go.th'
]);

const ACADEMIC_DATABASE_DOMAINS = new Set([
  'ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'sciencedirect.com',
  'nature.com',
  'springer.com',
  'thelancet.com',
  'academic.oup.com',
  'onlinelibrary.wiley.com',
  'nejm.org',
  'ashpublications.org',
  'bmj.com',
  'jamanetwork.com',
  'frontiersin.org',
  'plos.org',
  'cell.com',
  'scopus.com',
  'cochranelibrary.com',
  'biorxiv.org',
  'medrxiv.org',
  'tci-thaijo.org'
]);

const KNOWN_COMMERCIAL_RISK_DOMAINS = new Set([
  'pantip.com',
  'quora.com',
  'reddit.com',
  'lazada.co.th',
  'shopee.co.th',
  'aliexpress.com',
  'amazon.com'
]);

export function isStrictDomainMatch(hostname: string, targetDomain: string): boolean {
  if (hostname === targetDomain) {
    return true;
  }
  return hostname.endsWith('.' + targetDomain);
}

export function classifyMedicalSource(rawUrl: string): SourceClassificationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      tier: 'unknown',
      tierLabel: 'ไม่ระบุประเภท (Unknown Source)',
      domain: 'unknown',
      trustLevel: 'low',
      warningNotice: 'ไม่พบ URL หรือรูปแบบไม่ถูกต้อง',
      isAllowlistedAuthority: false
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      tier: 'unknown',
      tierLabel: 'ไม่ระบุประเภท (Unknown Source)',
      domain: rawUrl.slice(0, 40),
      trustLevel: 'low',
      warningNotice: 'URL ไม่ถูกต้องตามมาตรฐาน (Malformed URL)',
      isAllowlistedAuthority: false
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      tier: 'unknown',
      tierLabel: 'ไม่ระบุประเภท (Unknown Source)',
      domain: parsed.protocol,
      trustLevel: 'low',
      warningNotice: 'โปรโตคอลไม่ปลอดภัยหรือไม่รองรับ',
      isAllowlistedAuthority: false
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  for (const commercialDomain of KNOWN_COMMERCIAL_RISK_DOMAINS) {
    if (isStrictDomainMatch(hostname, commercialDomain)) {
      return {
        tier: 'commercial_risk',
        tierLabel: 'แหล่งข้อมูลพาณิชย์/ความเสี่ยงสูง (Commercial / Forum Risk)',
        domain: hostname,
        trustLevel: 'caution',
        warningNotice: '⚠️ คำเตือน: แหล่งข้อมูลนี้อาจมีผลประโยชน์เชิงพาณิชย์หรือเป็นเว็บบอร์ดสาธารณะ ห้ามใช้เป็นเกณฑ์ตัดสินใจทางคลินิก',
        isAllowlistedAuthority: false
      };
    }
  }

  for (const academicDomain of ACADEMIC_DATABASE_DOMAINS) {
    if (isStrictDomainMatch(hostname, academicDomain)) {
      return {
        tier: 'academic_database',
        tierLabel: 'ฐานข้อมูลวิชาการและการแพทย์ (Academic / Research Database)',
        domain: hostname,
        trustLevel: 'high',
        isAllowlistedAuthority: false
      };
    }
  }

  for (const authorityDomain of OFFICIAL_AUTHORITY_DOMAINS) {
    if (isStrictDomainMatch(hostname, authorityDomain)) {
      return {
        tier: 'official_authority',
        tierLabel: 'องค์กรมาตรฐานและสาธารณสุขทางการ (Official Authority)',
        domain: hostname,
        trustLevel: 'high',
        isAllowlistedAuthority: true
      };
    }
  }

  if (hostname.endsWith('.ac.th') || hostname.endsWith('.edu')) {
    return {
      tier: 'university',
      tierLabel: 'สถาบันการศึกษา / มหาวิทยาลัย (University Domain)',
      domain: hostname,
      trustLevel: 'moderate',
      isAllowlistedAuthority: false
    };
  }

  return {
    tier: 'general',
    tierLabel: 'เว็บไซต์ทั่วไป (General Web)',
    domain: hostname,
    trustLevel: 'moderate',
    warningNotice: 'ข้อมูลจากเว็บไซต์ทั่วไป ควรตรวจทานกับตำรามาตรฐานวิชาชีพก่อนนำไปใช้อ้างอิง',
    isAllowlistedAuthority: false
  };
}

/**
 * Maps raw grounding supports and grounding chunks from Gemini to full response text.
 * Strictly verifies offsets, bounds, strict exact segment text consistency (NFC normalized), and index remapping.
 */
export function mapGroundingSegments(
  fullText: string,
  supports?: RawGroundingSupport[],
  referencesCount: number = 0,
  options?: GroundingMappingOptions
): GroundingMappingResult {
  if (!fullText || typeof fullText !== 'string') {
    return {
      linkageStatus: 'missing_metadata',
      segments: [],
      supportedSegmentCount: 0,
      unsupportedSegmentCount: 0,
      totalValidSupports: 0
    };
  }

  if (!supports || !Array.isArray(supports) || supports.length === 0 || referencesCount === 0) {
    return {
      linkageStatus: 'missing_metadata',
      segments: [
        {
          text: fullText,
          startIndex: 0,
          endIndex: fullText.length,
          citationIndices: [],
          isGrounded: false
        }
      ],
      supportedSegmentCount: 0,
      unsupportedSegmentCount: 0,
      totalValidSupports: 0
    };
  }

  const textLength = fullText.length;
  const validSupports: Array<{
    startIndex: number;
    endIndex: number;
    chunkIndices: number[];
  }> = [];

  const indexMapping = options?.chunkIndexMapping;

  for (const s of supports) {
    if (!s || !s.segment) continue;
    const start = s.segment.startIndex ?? 0;
    const end = s.segment.endIndex ?? 0;

    // Strict Out-of-Bounds, Negative, & Inverted Offset Check
    if (typeof start !== 'number' || typeof end !== 'number') continue;
    if (start < 0 || end > textLength || start >= end) continue;

    // Segment Text Integrity Check: Strict exact match (normalized NFC) rejecting loose containment or partial matches
    const actualSlice = fullText.slice(start, end);
    if (s.segment.text && typeof s.segment.text === 'string' && s.segment.text.trim()) {
      const expected = s.segment.text.trim().normalize('NFC');
      const actualTrimmed = actualSlice.trim().normalize('NFC');
      if (actualTrimmed !== expected) {
        continue;
      }
    }

    // Filter and remap valid reference chunk indices
    const rawIndices = s.groundingChunkIndices || [];
    const validIndices: number[] = [];

    for (const rawIdx of rawIndices) {
      if (typeof rawIdx !== 'number' || rawIdx < 0) continue;

      let remappedIdx = rawIdx;
      if (indexMapping) {
        if (indexMapping instanceof Map) {
          const mapped = indexMapping.get(rawIdx);
          if (mapped !== undefined) {
            remappedIdx = mapped;
          } else {
            continue;
          }
        } else if (typeof indexMapping === 'object') {
          const mapped = (indexMapping as Record<number, number>)[rawIdx];
          if (mapped !== undefined) {
            remappedIdx = mapped;
          } else {
            continue;
          }
        }
      }

      if (remappedIdx >= 0 && remappedIdx < referencesCount) {
        validIndices.push(remappedIdx);
      }
    }

    if (validIndices.length > 0) {
      validSupports.push({
        startIndex: start,
        endIndex: end,
        chunkIndices: validIndices
      });
    }
  }

  if (validSupports.length === 0) {
    return {
      linkageStatus: 'unlinked',
      segments: [
        {
          text: fullText,
          startIndex: 0,
          endIndex: fullText.length,
          citationIndices: [],
          isGrounded: false
        }
      ],
      supportedSegmentCount: 0,
      unsupportedSegmentCount: 1,
      totalValidSupports: 0
    };
  }

  // Sort supports by start index
  validSupports.sort((a, b) => a.startIndex - b.startIndex);

  // Construct non-overlapping segments
  const segments: GroundingSegment[] = [];
  let currentPos = 0;

  for (const support of validSupports) {
    if (support.startIndex > currentPos) {
      const ungroundedChunk = fullText.slice(currentPos, support.startIndex);
      if (ungroundedChunk.trim()) {
        segments.push({
          text: ungroundedChunk,
          startIndex: currentPos,
          endIndex: support.startIndex,
          citationIndices: [],
          isGrounded: false
        });
      }
    }

    const effectiveStart = Math.max(currentPos, support.startIndex);
    if (support.endIndex > effectiveStart) {
      const groundedChunk = fullText.slice(effectiveStart, support.endIndex);
      segments.push({
        text: groundedChunk,
        startIndex: effectiveStart,
        endIndex: support.endIndex,
        citationIndices: Array.from(new Set(support.chunkIndices.map(i => i + 1))),
        isGrounded: true
      });
      currentPos = support.endIndex;
    }
  }

  if (currentPos < textLength) {
    const trailingChunk = fullText.slice(currentPos);
    if (trailingChunk.trim()) {
      segments.push({
        text: trailingChunk,
        startIndex: currentPos,
        endIndex: textLength,
        citationIndices: [],
        isGrounded: false
      });
    }
  }

  const groundedSegments = segments.filter(s => s.isGrounded);
  const ungroundedSegments = segments.filter(s => !s.isGrounded && s.text.trim().length > 0);

  const linkageStatus =
    groundedSegments.length > 0 && ungroundedSegments.length === 0
      ? 'verified_linked'
      : groundedSegments.length > 0
      ? 'partial_linked'
      : 'unlinked';

  return {
    linkageStatus,
    segments,
    supportedSegmentCount: groundedSegments.length,
    unsupportedSegmentCount: ungroundedSegments.length,
    totalValidSupports: validSupports.length
  };
}
