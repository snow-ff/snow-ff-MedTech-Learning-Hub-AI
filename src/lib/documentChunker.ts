import { DocumentChunk } from '../models/coreModel';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  let decoded = str;
  for (let i = 0; i < 2; i++) {
    decoded = decoded
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  return decoded;
}

export interface ChunkOptions {
  maxChunkChars?: number;
  overlapChars?: number;
  documentId?: string;
  pages?: string[]; // Array of text for each page (1-indexed)
}

const DEFAULT_MAX_CHARS = 1000;
const DEFAULT_OVERLAP_CHARS = 150;

/**
 * Split text into manageable, structured chunks for grounding and reading.
 * Accurately tracks whether genuine page numbers exist from the source document.
 */
export function chunkText(rawText: string, options: ChunkOptions = {}): DocumentChunk[] {
  const decodedRawText = decodeHtmlEntities(rawText);
  const maxChars = options.maxChunkChars || DEFAULT_MAX_CHARS;
  const overlap = options.overlapChars || DEFAULT_OVERLAP_CHARS;
  const docId = options.documentId || 'doc';

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  // Case 1: Pre-extracted pages (e.g. from PDF extractor with genuine page numbers)
  if (options.pages && options.pages.length > 0) {
    options.pages.forEach((pageText, pIdx) => {
      const pageNumber = pIdx + 1;
      const cleanPageText = decodeHtmlEntities(pageText).trim();
      if (!cleanPageText) return;

      if (cleanPageText.length <= maxChars) {
        chunkIndex++;
        chunks.push({
          id: `${docId}-chunk-${chunkIndex}`,
          documentId: docId,
          chunkIndex,
          pageNumber,
          hasNativePage: true,
          text: cleanPageText,
          charCount: cleanPageText.length
        });
      } else {
        // Split long page text into sub-chunks while maintaining pageNumber
        const subChunks = splitStringWithOverlap(cleanPageText, maxChars, overlap);
        subChunks.forEach((subText) => {
          chunkIndex++;
          chunks.push({
            id: `${docId}-chunk-${chunkIndex}`,
            documentId: docId,
            chunkIndex,
            pageNumber,
            hasNativePage: true,
            text: subText,
            charCount: subText.length
          });
        });
      }
    });

    if (chunks.length > 0) {
      return chunks;
    }
  }

  // Case 2: Detect page markers in single text string (e.g., "--- Page 1 ---" or \f)
  const formFeedPages = decodedRawText.split(/\f|\n--- (?:Page|หน้า) (\d+) ---\n/i);
  if (formFeedPages.length > 1) {
    let currentPage = 1;
    for (let i = 0; i < formFeedPages.length; i++) {
      const segment = formFeedPages[i]?.trim();
      if (!segment) continue;

      // Check if this segment was a page number from the regex group
      if (/^\d+$/.test(segment)) {
        currentPage = parseInt(segment, 10);
        continue;
      }

      const subChunks = splitStringWithOverlap(segment, maxChars, overlap);
      subChunks.forEach((subText) => {
        chunkIndex++;
        chunks.push({
          id: `${docId}-chunk-${chunkIndex}`,
          documentId: docId,
          chunkIndex,
          pageNumber: currentPage,
          hasNativePage: true,
          text: subText,
          charCount: subText.length
        });
      });
      currentPage++;
    }

    if (chunks.length > 0) {
      return chunks;
    }
  }

  // Case 3: Standard single text / markdown / note chunking (NO native page numbers)
  const cleanText = rawText.trim();
  if (!cleanText) {
    return [];
  }

  const textBlocks = splitStringWithOverlap(cleanText, maxChars, overlap);
  textBlocks.forEach((blockText, idx) => {
    // Note: Do NOT invent a synthetic page number when none exists in the source!
    // pageNumber is left undefined to guarantee strict anti-hallucination.
    chunks.push({
      id: `${docId}-chunk-${idx + 1}`,
      documentId: docId,
      chunkIndex: idx + 1,
      pageNumber: undefined,
      hasNativePage: false,
      text: blockText,
      charCount: blockText.length
    });
  });

  return chunks;
}

/**
 * Helper to split a long string into chunks with overlap at paragraph or sentence boundaries.
 * Integrates Thai word boundary preservation to avoid splitting medical terms.
 */
function splitStringWithOverlap(text: string, maxChars: number, overlapChars: number): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const result: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChars;

    if (endIndex >= text.length) {
      const remaining = text.substring(startIndex).trim();
      if (remaining) result.push(remaining);
      break;
    }

    // 1. Try finding paragraph break (\n\n) near the end
    let breakIndex = text.lastIndexOf('\n\n', endIndex);
    if (breakIndex > startIndex + maxChars * 0.6) {
      endIndex = breakIndex + 2;
    } else {
      // 2. Try finding single newline (\n) or sentence period
      breakIndex = text.lastIndexOf('\n', endIndex);
      if (breakIndex > startIndex + maxChars * 0.6) {
        endIndex = breakIndex + 1;
      } else {
        const periodIndex = text.lastIndexOf('. ', endIndex);
        if (periodIndex > startIndex + maxChars * 0.6) {
          endIndex = periodIndex + 2;
        } else {
          const spaceIndex = text.lastIndexOf(' ', endIndex);
          if (spaceIndex > startIndex + maxChars * 0.6) {
            endIndex = spaceIndex + 1;
          } else if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
            // 3. Thai boundary fallback: find word boundary using native Intl.Segmenter
            try {
              const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
              const windowSubstring = text.substring(startIndex, endIndex);
              const segments = [...segmenter.segment(windowSubstring)];
              if (segments.length > 1) {
                const lastSegment = segments[segments.length - 1];
                if (lastSegment.index > maxChars * 0.6) {
                  endIndex = startIndex + lastSegment.index;
                }
              }
            } catch {
              // Ignore if segmenter fails
            }
          }
        }
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) {
      result.push(chunk);
    }

    // Slide window with overlap, ensuring strictly moving forward
    startIndex = Math.max(startIndex + 1, endIndex - overlapChars);
  }

  return result;
}

// Standard Thai and English stopwords to prevent false positives in academic grounding
export const ACADEMIC_STOPWORDS = new Set([
  'และ', 'หรือ', 'ของ', 'ใน', 'การ', 'ความ', 'ที่', 'เป็น', 'คือ', 'มี', 'ได้',
  'ให้', 'กับ', 'จาก', 'โดย', 'ตาม', 'เพื่อ', 'ไป', 'มา', 'จะ', 'ว่า', 'นี้',
  'นั้น', 'โน้น', 'อัน', 'พวก', 'เช่น', 'กัน', 'แล้ว', 'จึง', 'ทำ', 'ถ้า',
  'หาก', 'แต่', 'ต้อง', 'กว่า', 'มาก', 'น้อย', 'เท่า', 'ใด', 'อะไร', 'ไหน',
  'ทำไม', 'อย่างไร', 'ยังไง', 'เท่าไหร่', 'กี่', 'ครับ', 'ค่ะ', 'นะคะ', 'ขอ',
  'บอก', 'ช่วย', 'หน่อย', 'อยาก', 'ทราบ', 'รู้', 'และ/หรือ',
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'it'
]);

// Bilingual MedTech synonyms mapping for cross-lingual Thai-English query matching
export const MEDTECH_BILINGUAL_SYNONYMS: Record<string, string[]> = {
  'ความสมบูรณ์ของเม็ดเลือด': ['complete blood count', 'cbc'],
  'ตรวจนับเม็ดเลือด': ['complete blood count', 'cbc'],
  'เม็ดเลือดแดง': ['red blood cell', 'rbc', 'erythrocyte'],
  'เม็ดเลือดขาว': ['white blood cell', 'wbc', 'leukocyte'],
  'เกล็ดเลือด': ['platelet', 'thrombocyte'],
  'ฮีโมโกลบิน': ['hemoglobin'],
  'ฮีมาโตคริต': ['hematocrit'],
  'น้ำตาลในเลือด': ['glucose', 'plasma glucose', 'fasting plasma glucose', 'fpg'],
  'น้ำตาลสะสม': ['hba1c', 'glycated hemoglobin'],
  'การควบคุมคุณภาพ': ['quality control', 'qc', 'westgard'],
  'ควบคุมคุณภาพ': ['quality control', 'qc', 'westgard'],
  'ความผิดพลาดแบบสุ่ม': ['random error'],
  'ความผิดพลาดเชิงระบบ': ['systematic error', 'systematic bias', 'systematic shift'],
  'ความไว': ['sensitivity', 'recall'],
  'ความจำเพาะ': ['specificity'],
  'หลอดเก็บเลือด': ['collection tube', 'specimen tube', 'blood tube'],
  'หลอดสีม่วง': ['lavender top', 'purple top', 'edta'],
  'หลอดสีฟ้า': ['light blue top', 'sodium citrate'],
  'หลอดสีแดง': ['red top', 'clot activator', 'sst'],
  'การย้อมสี': ['stain', 'gram stain', 'wright-giemsa'],
  'ซีรั่ม': ['serum'],
  'พลาสมา': ['plasma'],
  'สารกันเลือดแข็ง': ['anticoagulant', 'edta', 'heparin', 'citrate'],
  'การทำงานของไต': ['kidney function', 'renal function', 'bun', 'creatinine', 'egfr'],
  'การทำงานของตับ': ['liver function', 'lft', 'ast', 'alt', 'alp'],
  'ระดับไขมัน': ['lipid profile', 'cholesterol', 'triglyceride', 'hdl', 'ldl']
};

export interface GroundedRetrievalResult {
  relevantChunks: DocumentChunk[];
  hasEvidence: boolean;
  matchedKeywords: string[];
  maxScore: number;
}

/**
 * Retrieve and rank chunks with strict academic evidence validation.
 * Distinguishes whether genuine relevant evidence was found vs insufficient evidence.
 * Prevents false positives caused by common Thai stopwords (เช่น และ, ของ, ใน, การ).
 * Supports cross-lingual matching (Thai medical queries matching English terms and vice versa).
 */
export function retrieveGroundedChunks(
  chunks: DocumentChunk[],
  query: string,
  topK: number = 4
): GroundedRetrievalResult {
  if (!chunks || chunks.length === 0) {
    return { relevantChunks: [], hasEvidence: false, matchedKeywords: [], maxScore: 0 };
  }

  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    return { relevantChunks: chunks.slice(0, Math.min(topK, 2)), hasEvidence: false, matchedKeywords: [], maxScore: 0 };
  }

  // 1. Extract candidate keywords & compound phrases from query
  const candidateTerms: string[] = [];

  // 1a. Space/punctuation-separated tokens (English terms, acronyms, medical numbers)
  const tokens = cleanQuery
    .split(/[\s,;:.!?()\/+\-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !ACADEMIC_STOPWORDS.has(t) && !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(t));
  tokens.forEach(t => candidateTerms.push(t));

  // 1b. Segmenter-based n-grams for continuous Thai script
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      const segs = [...segmenter.segment(cleanQuery)].map((s: any) => s.segment.trim().toLowerCase());

      // Combine adjacent segments (1 to 6) while trimming leading/trailing stopwords
      for (let len = 6; len >= 1; len--) {
        for (let i = 0; i <= segs.length - len; i++) {
          const slice = segs.slice(i, i + len);
          let start = 0;
          while (start < slice.length && ACADEMIC_STOPWORDS.has(slice[start])) start++;
          let end = slice.length;
          while (end > start && ACADEMIC_STOPWORDS.has(slice[end - 1])) end--;

          const cleanSlice = slice.slice(start, end);
          if (cleanSlice.length === 0) continue;
          const combined = cleanSlice.join('').trim();
          if (combined.length >= 2 && !ACADEMIC_STOPWORDS.has(combined)) {
            candidateTerms.push(combined);
          }
        }
      }
    } catch {
      // Fallback if Segmenter is not available
    }
  }

  // 1c. Bilingual MedTech synonyms expansion (Thai <-> English)
  for (const [thaiTerm, enTerms] of Object.entries(MEDTECH_BILINGUAL_SYNONYMS)) {
    if (cleanQuery.includes(thaiTerm)) {
      enTerms.forEach(t => candidateTerms.push(t));
    }
    for (const enTerm of enTerms) {
      if (enTerm.length <= 3) {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${enTerm}([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(cleanQuery)) {
          candidateTerms.push(thaiTerm);
        }
      } else if (cleanQuery.includes(enTerm)) {
        candidateTerms.push(thaiTerm);
      }
    }
  }

  // Remove duplicates and sort longer terms first
  const uniqueCandidateTerms = Array.from(new Set(candidateTerms)).sort((a, b) => b.length - a.length);

  // If no non-stopword terms were found (e.g. query consists purely of stopwords), reject evidence
  if (uniqueCandidateTerms.length === 0) {
    return {
      relevantChunks: chunks.slice(0, Math.min(topK, 2)),
      hasEvidence: false,
      matchedKeywords: [],
      maxScore: 0
    };
  }

  const matchedKeywordsSet = new Set<string>();

  const scored = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;

    // Cross-topic relevance guard: If query is about Word Parts or academic terms, ignore administrative/notice chunks or medication chunks
    const isWordPartsQuery = /root|prefix|suffix|combining|รากศัพท์|คำอุปสรรค|ปัจจัยท้าย|สระเชื่อม|ส่วนของคำศัพท์/i.test(cleanQuery);
    const isMedicationChunk = /0\.5\s*mg|mgso4|mso4|ขนาดยา|การบริหารยา|mg\b|ml\b/i.test(chunkLower);
    const isMedicationSafetyChunk = /do not use|medication safety|u, iu, qd, mso4|รายการห้ามใช้|ความปลอดภัยทางยา/i.test(chunkLower);
    const isDigitalStandardsChunk = /digital standards|fhir|hl7|icd-10|loinc|dicom|pacs|สารสนเทศสุขภาพ|มาตรฐานข้อมูล/i.test(chunkLower);
    const isAdministrativeOrNoticeChunk = /notice of adaptation|non-endorsement|copyright|สงวนลิขสิทธิ์|ประกาศ|disclaimer|การให้เครดิตแหล่งข้อมูล|หนังสือต้นฉบับ/i.test(chunkLower);
    const hasWordPartsInChunk = /root|prefix|suffix|combining|รากศัพท์|คำอุปสรรค|ปัจจัยท้าย|สระเชื่อม|ส่วนของคำศัพท์/i.test(chunkLower);

    if (isAdministrativeOrNoticeChunk && !hasWordPartsInChunk && !/ลิขสิทธิ์|เครดิต|attribution|notice|adaptation/i.test(cleanQuery)) {
      return { chunk, score: 0 };
    }

    if (isWordPartsQuery && (isMedicationChunk || isMedicationSafetyChunk || isDigitalStandardsChunk) && !hasWordPartsInChunk) {
      return { chunk, score: 0 };
    }

    const isAnatomicalCavitiesOrPlanesChunk = /anatomical position|directional terms|anatomical planes|body cavities|abdominal quadrants|ช่องว่างภายในร่างกาย|ระนาบกายวิภาค|ท่ากายวิภาค|จตุภาคหน้าท้อง/i.test(chunkLower);
    if (isWordPartsQuery && isAnatomicalCavitiesOrPlanesChunk && !hasWordPartsInChunk) {
      return { chunk, score: 0 };
    }

    // Exact full query match (minimum 4 chars to prevent trivial matches)
    if (cleanQuery.length >= 4 && !ACADEMIC_STOPWORDS.has(cleanQuery) && chunkLower.includes(cleanQuery)) {
      score += 25;
      matchedKeywordsSet.add(cleanQuery);
    }

    // Match candidate keywords
    for (const term of uniqueCandidateTerms) {
      if (chunkLower.includes(term)) {
        // Longer academic terms carry significantly more weight than short fragments
        const termWeight = term.length >= 6 ? 10 : term.length >= 4 ? 6 : 3;
        score += termWeight;
        matchedKeywordsSet.add(term);

        // Frequency count (capped at 4)
        const matchCount = chunkLower.split(term).length - 1;
        score += Math.min(matchCount, 4);
      }
    }

    return { chunk, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const positiveScored = scored.filter(s => s.score > 0);
  const hasEvidence = positiveScored.length > 0;
  const relevantChunks = hasEvidence
    ? positiveScored.slice(0, topK).map(s => s.chunk)
    : chunks.slice(0, Math.min(topK, 2));

  // Prune matchedKeywords to keep key terms
  const finalMatchedKeywords = Array.from(matchedKeywordsSet);

  return {
    relevantChunks,
    hasEvidence,
    matchedKeywords: finalMatchedKeywords,
    maxScore: scored[0]?.score || 0
  };
}

/**
 * Backward-compatible helper to rank and select top K most relevant chunks for a given search query.
 */
export function rankRelevantChunks(chunks: DocumentChunk[], query: string, topK: number = 4): DocumentChunk[] {
  return retrieveGroundedChunks(chunks, query, topK).relevantChunks;
}

/**
 * Format grounding context for LLM prompt.
 * Only includes "หน้า X" if the chunk genuinely has a native page number.
 */
export function buildGroundingContext(
  documentTitle: string,
  chunks: DocumentChunk[],
  courseCode?: string
): string {
  const header = `=== เอกสารอ้างอิง: ${documentTitle}${courseCode ? ` (รหัสวิชา: ${courseCode})` : ''} ===`;
  const body = chunks
    .map(c => `[ส่วนอ้างอิง: ชิ้นส่วนที่ ${c.chunkIndex}${c.pageNumber ? ` | หน้า ${c.pageNumber}` : ''}]:\n${c.text}`)
    .join('\n\n---\n\n');

  return `${header}\n\n${body}`;
}

/**
 * Extract clean, readable excerpt around matching query terms or sentence start,
 * avoiding mid-word cutoffs.
 */
export function extractRelevantExcerpt(text: string, query: string, maxLength: number = 140): string {
  if (!text) return '';
  // Strip markdown symbols (*, _, #) and normalize whitespace
  const cleanText = text.replace(/[*_#]+/g, '').replace(/\s+/g, ' ').trim();
  const queryLower = query.toLowerCase();
  
  const tokens = queryLower.split(/[\s,;:.!?()\/+\-]+/).filter(t => t.length >= 3);
  
  let bestIndex = -1;
  for (const token of tokens) {
    let idx = cleanText.toLowerCase().indexOf(token);
    while (idx !== -1) {
      const snippetBefore = cleanText.substring(Math.max(0, idx - 150), idx).toLowerCase();
      const isInNoticeBlock = (snippetBefore.includes('notice of adaptation') || snippetBefore.includes('การให้เครดิต') || snippetBefore.includes('non-endorsement')) && !snippetBefore.includes('ส่วนที่') && !snippetBefore.includes('1.') && !snippetBefore.includes('2.');
      if (isInNoticeBlock) {
        idx = cleanText.toLowerCase().indexOf(token, idx + token.length);
      } else {
        bestIndex = idx;
        break;
      }
    }
    if (bestIndex !== -1) break;
  }

  let start = 0;
  if (bestIndex !== -1) {
    start = Math.max(0, bestIndex - 25);
    if (start > 0) {
      const spaceIdx = cleanText.lastIndexOf(' ', start);
      if (spaceIdx !== -1 && spaceIdx >= bestIndex - 50) {
        start = spaceIdx + 1;
      }
    }
  } else {
    start = 0;
    while (start < cleanText.length && /^[\s\-_:]/.test(cleanText[start])) {
      start++;
    }
  }

  let end = Math.min(cleanText.length, start + maxLength);
  if (end < cleanText.length) {
    const spaceIdx = cleanText.lastIndexOf(' ', end);
    if (spaceIdx > start + 30) {
      end = spaceIdx;
    }
  }

  let excerpt = cleanText.slice(start, end).trim();
  // Ensure excerpt starts cleanly without partial symbol/punctuation
  excerpt = excerpt.replace(/^[^a-zA-Z0-9ก-ฮะ-์]+/, '').trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < cleanText.length) excerpt = excerpt + '...';
  
  return excerpt;
}
