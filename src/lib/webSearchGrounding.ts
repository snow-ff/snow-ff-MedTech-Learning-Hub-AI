/**
 * MedTech Learning Hub AI — Web Search Grounding & Medical Source Classification (v1.2)
 *
 * Implements Phase 1 (Grounding Evidence Integrity) & Phase 2 (Source Classification)
 * - Pure functions with strict domain boundary checks against spoofing
 * - Segment-level mapping from Gemini groundingSupports and groundingChunks
 * - Separation of source credibility, claim support, and link accessibility
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
  supportedClaimCount: number;
  unsupportedClaimCount: number;
  totalValidSupports: number;
}

// ---------------------------------------------------------------------------
// Medical & Academic Authority Domain Registry (Strict Domain Boundaries)
// ---------------------------------------------------------------------------

const OFFICIAL_AUTHORITY_DOMAINS = new Set([
  // International Standard & Public Health Organizations
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

  // Thai Government & Medical Professional Bodies
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

/**
 * Checks whether a given hostname strictly matches a target domain or is a valid subdomain.
 * Prevents domain spoofing (e.g. "who.int.evil.com" or "clsi.org.attacker.xyz").
 */
export function isStrictDomainMatch(hostname: string, targetDomain: string): boolean {
  if (hostname === targetDomain) {
    return true;
  }
  return hostname.endsWith('.' + targetDomain);
}

/**
 * Classifies a URL into a medical source credibility tier.
 * Pure function with strict domain boundary checks.
 */
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

  // Must be http or https
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

  // 1. Check Commercial / High-Risk / Social Forums
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

  // 2. Check Academic & Research Databases (Check before NIH authority to classify PubMed/NCBI as academic_database)
  for (const academicDomain of ACADEMIC_DATABASE_DOMAINS) {
    if (isStrictDomainMatch(hostname, academicDomain)) {
      return {
        tier: 'academic_database',
        tierLabel: 'ฐานข้อมูลวิชาการและการแพทย์ (Academic / Research Database)',
        domain: hostname,
        trustLevel: 'high',
        isAllowlistedAuthority: false // Do not claim peer-review unconditionally without article-level verification
      };
    }
  }

  // 3. Check Official Authorities
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

  // 4. Check University Domains (.ac.th, .edu)
  if (hostname.endsWith('.ac.th') || hostname.endsWith('.edu')) {
    return {
      tier: 'university',
      tierLabel: 'สถาบันการศึกษา / มหาวิทยาลัย (University Domain)',
      domain: hostname,
      trustLevel: 'moderate',
      isAllowlistedAuthority: false
    };
  }

  // 5. Default General Web (Do NOT block, but warn for medical context)
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
 * Strictly verifies offsets, bounds, and chunk index integrity without guessing citations.
 */
export function mapGroundingSegments(
  fullText: string,
  supports?: RawGroundingSupport[],
  referencesCount: number = 0
): GroundingMappingResult {
  if (!fullText || typeof fullText !== 'string') {
    return {
      linkageStatus: 'missing_metadata',
      segments: [],
      supportedClaimCount: 0,
      unsupportedClaimCount: 0,
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
      supportedClaimCount: 0,
      unsupportedClaimCount: 0,
      totalValidSupports: 0
    };
  }

  const textLength = fullText.length;
  const validSupports: Array<{
    startIndex: number;
    endIndex: number;
    chunkIndices: number[];
  }> = [];

  for (const s of supports) {
    if (!s || !s.segment) continue;
    const start = s.segment.startIndex ?? 0;
    const end = s.segment.endIndex ?? 0;

    // Strict Out-of-Bounds & Offset Integrity Check
    if (typeof start !== 'number' || typeof end !== 'number') continue;
    if (start < 0 || end > textLength || start >= end) continue;

    // Filter valid reference chunk indices
    const rawIndices = s.groundingChunkIndices || [];
    const validIndices = rawIndices.filter(
      idx => typeof idx === 'number' && idx >= 0 && idx < referencesCount
    );

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
      supportedClaimCount: 0,
      unsupportedClaimCount: 0,
      totalValidSupports: 0
    };
  }

  // Sort supports by start index
  validSupports.sort((a, b) => a.startIndex - b.startIndex);

  // Construct non-overlapping segments
  const segments: GroundingSegment[] = [];
  let currentPos = 0;

  for (const support of validSupports) {
    // If there is ungrounded text before this support segment
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

    // Add the grounded segment (1-based citation indices)
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

  // Add any trailing ungrounded text
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
  const ungroundedSegments = segments.filter(s => !s.isGrounded && s.text.trim().length > 20);

  const linkageStatus =
    groundedSegments.length > 0 && ungroundedSegments.length === 0
      ? 'verified_linked'
      : groundedSegments.length > 0
      ? 'partial_linked'
      : 'unlinked';

  return {
    linkageStatus,
    segments,
    supportedClaimCount: groundedSegments.length,
    unsupportedClaimCount: ungroundedSegments.length,
    totalValidSupports: validSupports.length
  };
}
