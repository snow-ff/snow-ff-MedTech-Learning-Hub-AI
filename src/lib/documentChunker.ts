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
 */
export function chunkText(rawText: string, options: ChunkOptions = {}): DocumentChunk[] {
  const maxChars = options.maxChunkChars || DEFAULT_MAX_CHARS;
  const overlap = options.overlapChars || DEFAULT_OVERLAP_CHARS;
  const docId = options.documentId || 'doc';

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  // Case 1: Pre-extracted pages (e.g. from PDF extractor)
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

  // Case 3: Standard single text / markdown / note chunking
  const cleanText = rawText.trim();
  if (!cleanText) {
    return [];
  }

  const textBlocks = splitStringWithOverlap(cleanText, maxChars, overlap);
  textBlocks.forEach((blockText, idx) => {
    // Estimate page number assuming ~1500 chars per standard academic page
    const estimatedPage = Math.floor((idx * (maxChars - overlap)) / 1500) + 1;
    chunks.push({
      id: `${docId}-chunk-${idx + 1}`,
      documentId: docId,
      chunkIndex: idx + 1,
      pageNumber: estimatedPage,
      text: blockText,
      charCount: blockText.length
    });
  });

  return chunks;
}

/**
 * Helper to split a long string into chunks with overlap at paragraph or sentence boundaries.
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

    // Try finding paragraph break (\n\n) near the end
    let breakIndex = text.lastIndexOf('\n\n', endIndex);
    if (breakIndex > startIndex + maxChars * 0.6) {
      endIndex = breakIndex + 2;
    } else {
      // Try finding single newline (\n) or sentence period
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
          }
        }
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) {
      result.push(chunk);
    }

    // Slide window with overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlapChars);
  }

  return result;
}

/**
 * Rank and select top K most relevant chunks for a given search query using term matching.
 */
export function rankRelevantChunks(chunks: DocumentChunk[], query: string, topK: number = 4): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (!query || !query.trim()) return chunks.slice(0, topK);

  const cleanQuery = query.toLowerCase().trim();
  // Extract keywords (words of length >= 2, alphanumeric and Thai characters)
  const keywords = cleanQuery
    .split(/[\s,;:.!?()\/+\-]+/)
    .map(k => k.trim())
    .filter(k => k.length >= 2);

  if (keywords.length === 0) {
    return chunks.slice(0, topK);
  }

  const scored = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;

    // Exact phrase match bonus
    if (chunkLower.includes(cleanQuery)) {
      score += 15;
    }

    // Individual keyword hits
    for (const kw of keywords) {
      if (chunkLower.includes(kw)) {
        score += 3;
        // Count occurrences
        const matches = chunkLower.split(kw).length - 1;
        score += Math.min(matches, 5);
      }
    }

    return { chunk, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return topK chunks that have positive score, or fallback to first topK if none scored > 0
  const relevant = scored.filter(s => s.score > 0).map(s => s.chunk);
  if (relevant.length === 0) {
    return chunks.slice(0, topK);
  }

  return relevant.slice(0, topK);
}

/**
 * Format grounding context for LLM prompt.
 */
export function buildGroundingContext(
  documentTitle: string,
  chunks: DocumentChunk[],
  courseCode?: string
): string {
  const header = `=== เอกสารอ้างอิง: ${documentTitle}${courseCode ? ` (รหัสวิชา: ${courseCode})` : ''} ===`;
  const body = chunks
    .map(c => `[ส่วนอ้างอิง ${c.chunkIndex}${c.pageNumber ? ` | หน้า ${c.pageNumber}` : ''}]:\n${c.text}`)
    .join('\n\n---\n\n');

  return `${header}\n\n${body}`;
}
