import { DocumentChunk } from '../models/coreModel';

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
  const maxChars = options.maxChunkChars || DEFAULT_MAX_CHARS;
  const overlap = options.overlapChars || DEFAULT_OVERLAP_CHARS;
  const docId = options.documentId || 'doc';

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  // Case 1: Pre-extracted pages (e.g. from PDF extractor with genuine page numbers)
  if (options.pages && options.pages.length > 0) {
    options.pages.forEach((pageText, pIdx) => {
      const pageNumber = pIdx + 1;
      const cleanPageText = pageText.trim();
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
  const formFeedPages = rawText.split(/\f|\n--- (?:Page|หน้า) (\d+) ---\n/i);
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
