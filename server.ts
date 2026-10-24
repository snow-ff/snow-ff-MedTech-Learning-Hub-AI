import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { dtmCurriculum2567 } from "./src/data/curriculumData";
import { retrieveGroundedChunks, extractRelevantExcerpt, decodeHtmlEntities, cleanChunkLocator, ACADEMIC_STOPWORDS } from "./src/lib/documentChunker";
import { verifyAcademicAnswer } from "./src/lib/academicVerifier";
import { AcademicVerificationReport } from "./src/models/coreModel";
import {
  classifyGeminiError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  formatRetryLog
} from "./src/lib/geminiRetryPolicy";
import { classifyMedicalSource, mapGroundingSegments } from "./src/lib/webSearchGrounding";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Handle payload too large (413) gracefully with JSON error response
app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'ขนาดเอกสารหรือคำขอใหญ่เกินขีดจำกัดของระบบ (Payload Too Large). กรุณาลดขนาดข้อมูลเอกสาร' });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;

// Initialize GoogleGenAI client server-side with verified model and config
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

let customGeminiMock: ((params: any) => Promise<any>) | null = null;
export function setCustomGeminiMock(mockFn: ((params: any) => Promise<any>) | null) {
  customGeminiMock = mockFn;
}

function getDirectTopic(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("serum") || t.includes("plasma") || t.includes("ซีรั่ม") || t.includes("พลาสมา")) {
    return 'serum';
  }
  if (t.includes("flow cytometry") || (t.includes("เม็ดเลือดขาว") && !t.includes("cbc"))) {
    return 'flow';
  }
  if (t.includes("pcr") || t.includes("real-time") || t.includes("qpcr") || t.includes("cq") || t.includes("ct") || t.includes("amplification")) {
    return 'pcr';
  }
  if (t.includes("gram") || t.includes("แกรม") || t.includes("stain")) {
    return 'gram';
  }
  if (t.includes("เดงกี่") || t.includes("dengue")) {
    return 'dengue';
  }
  if (t.includes("cbc") || t.includes("เม็ดเลือด")) {
    return 'cbc';
  }
  if (t.includes("เริ่มเรียนรายวิชา") || t.includes("dtm67-") || t.includes("ปูพื้นฐานหัวข้อ")) {
    return 'dtm_course_starter';
  }
  if (t.includes("ehr") || t.includes("emr") || t.includes("เวชระเบียน") || t.includes("สารสนเทศสุขภาพ") || t.includes("his") || t.includes("cdss")) {
    return 'dtm_informatics';
  }
  if (t.includes("dicom") || t.includes("pacs") || t.includes("fhir") || t.includes("hl7") || t.includes("icd-10") || t.includes("loinc") || t.includes("มาตรฐานข้อมูล")) {
    return 'dtm_standards';
  }
  if (t.includes("deep learning") || t.includes("cnn") || t.includes("ภาพถ่ายทางการแพทย์") || t.includes("u-net") || t.includes("ai ทางการแพทย์") || t.includes("ปัญญาประดิษฐ์ทางการแพทย์")) {
    return 'dtm_ai';
  }
  if (t.includes("dtm") || t.includes("หลักสูตร") || t.includes("หน่วยกิต") || t.includes("วลัยลักษณ์") || t.includes("เทคโนโลยีดิจิทัล")) {
    return 'dtm';
  }
  return null;
}

function determineTopic(p: string, messages?: Array<{ role: string; text: string }>): string | null {
  const directTopic = getDirectTopic(p);
  if (directTopic) {
    return directTopic;
  }

  const hasHistory = messages && messages.length > 1;
  const isShortOrFollowUp = p.length < 50 || 
    p.includes("แล้ว") || 
    p.includes("ค่า") || 
    p.includes("คืออะไร") || 
    p.includes("ต่างกัน") || 
    p.includes("อันนี้") || 
    p.includes("นั่น") || 
    p.includes("ข้อนี้") || 
    p.includes("เพิ่ม") || 
    p.includes("ทำไม") || 
    p.includes("อย่างไร") || 
    p.includes("ยังไง") || 
    p.includes("เท่าไหร่") || 
    p.includes("หรือ") || 
    p.includes("ได้ไหม") ||
    p.includes("ถามต่อ");

  const hasNewDistinctTopic = p.includes("ประวัติศาสตร์") || 
    p.includes("history") || 
    p.includes("ฟิสิกส์") || 
    p.includes("physics") || 
    p.includes("คณิตศาสตร์") || 
    p.includes("math");

  if (hasHistory && isShortOrFollowUp && !hasNewDistinctTopic) {
    for (let i = messages.length - 2; i >= 0; i--) {
      const prevTopic = getDirectTopic(messages[i].text.toLowerCase());
      if (prevTopic) {
        return prevTopic;
      }
    }
  }

  return null;
}

function getCleanSectionTitle(text: string, chunkIndex: number | string): string {
  const decoded = decodeHtmlEntities(text || '');
  const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const isGenuineHeading =
      /^#+\s+/.test(line) ||
      /^===+\s*/.test(line) ||
      /^===.*\s*===$/.test(line) ||
      /^(ส่วนที่|บทที่|หัวข้อ|chapter|section|title)\s*[:#\-]?/i.test(line);

    if (isGenuineHeading) {
      const cleaned = line.replace(/^[===#*\-\s]+/, '').replace(/[===#*\s\)]+$/, '').trim();
      const decodedCleaned = decodeHtmlEntities(cleaned);
      if (
        decodedCleaned.length >= 3 &&
        decodedCleaned.length <= 60 &&
        !decodedCleaned.includes('&#') &&
        !/[*#_`~[\]()]/.test(decodedCleaned) &&
        !/^[^\w\sก-ฮะ-์]+$/.test(decodedCleaned)
      ) {
        return decodedCleaned;
      }
    }
  }
  return cleanChunkLocator(chunkIndex);
}

// Academic fallback generator for robust offline / quota-exceeded handling
export function getAcademicFallback(
  prompt: string,
  messages?: Array<{ role: string; text: string }>,
  documentContext?: {
    title: string;
    courseCode?: string;
    hasNativePages?: boolean;
    totalPages?: number;
    chunks: Array<{ chunkIndex?: number | string; pageNumber?: number | string; text: string }>;
  }
): {
  text: string;
  evidenceStatus?: "sufficient" | "insufficient" | "external_research";
  verification?: AcademicVerificationReport;
  references: Array<{
    title: string;
    uri: string;
    type?: string;
    linkAccessStatus?: string;
    verificationStatus?: "source_grounded" | "unsupported_citation" | "unverified";
    evidenceLocator?: string;
    excerpt?: string;
    contentVersion?: string;
  }>;
} {
  // If documentContext is present, perform grounded retrieval on document chunks
  if (documentContext && documentContext.chunks && documentContext.chunks.length > 0) {
    const chunksForRetrieval = documentContext.chunks.map((c, idx) => {
      const rawIdxStr = c.chunkIndex !== undefined && c.chunkIndex !== null ? String(c.chunkIndex) : String(idx + 1);
      const cleanIdxStr = cleanChunkLocator(rawIdxStr).replace(/^ชิ้นส่วนที่\s*/, '');
      const parsedIdx = parseInt(cleanIdxStr, 10);
      const validIdx = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : (idx + 1);
      return {
        id: `ctx-chunk-${idx + 1}`,
        documentId: 'doc-ctx',
        chunkIndex: validIdx,
        pageNumber: typeof c.pageNumber === 'number' ? c.pageNumber : (typeof c.pageNumber === 'string' ? parseInt(cleanChunkLocator(1, c.pageNumber).replace(/^หน้า\s*/, ''), 10) || undefined : undefined),
        hasNativePage: typeof c.pageNumber === 'number',
        text: decodeHtmlEntities(c.text || ''),
        charCount: (c.text || '').length
      };
    });

    const retrieval = retrieveGroundedChunks(chunksForRetrieval, prompt, Math.max(10, chunksForRetrieval.length));

    if (retrieval.hasEvidence && retrieval.relevantChunks.length > 0) {
      const cleanDocTitle = decodeHtmlEntities(documentContext.title || '');
      const citations = retrieval.relevantChunks
        .map(c => {
          const cleanIdx = decodeHtmlEntities(String(c.chunkIndex ?? '')).replace(/[^0-9]/g, '') || c.chunkIndex;
          return `• **[ส่วนอ้างอิง ${cleanIdx}${c.pageNumber ? ` | หน้า ${c.pageNumber}` : ''}]**: ${c.text}`;
        })
        .join('\n\n');
      const fallbackText = `*(คำตอบสรุปจากเอกสารการเรียนรู้: "${cleanDocTitle}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\nจากการสืบค้นในเนื้อหาของเอกสาร พบข้อมูลที่เกี่ยวข้องกับข้อซักถาม ดังนี้:\n\n${citations}\n\n*ข้อแนะนำ: ข้อมูลข้างต้นอ้างอิงตรงจากเอกสารในคลังการเรียนรู้ของผู้ใช้โดยไม่แต่งเติมข้อมูลภายนอก*`;

      const verification = verifyAcademicAnswer({
        query: prompt,
        candidateAnswer: fallbackText,
        document: {
          title: documentContext.title,
          hasNativePages: documentContext.hasNativePages,
          totalPages: documentContext.totalPages,
          chunks: chunksForRetrieval
        },
        conversationHistory: (messages || []).map(m => ({ role: m.role as any, text: m.text }))
      });

      const isFallbackInsufficient =
        verification.verdict === 'INSUFFICIENT_EVIDENCE' ||
        verification.verdict === 'FAIL' ||
        !verification.stages.evidenceFidelity.passed ||
        verification.stages.answerFidelity.status === 'hallucinated' ||
        verification.stages.answerFidelity.status === 'overgeneralized';

      const chunkReferences = retrieval.relevantChunks.map(c => {
        const decodedText = decodeHtmlEntities(c.text || '');
        const sectionTitle = getCleanSectionTitle(decodedText, c.chunkIndex);
        const excerpt = decodeHtmlEntities(extractRelevantExcerpt(decodedText, prompt, 140));
        const finalLocator = cleanChunkLocator(c.chunkIndex, c.pageNumber);

        // Reference-level evidence validity:
        // Evaluates whether THIS specific chunk genuinely supports the query topic parts
        // or whether it was cited erroneously (e.g. disclaimer/notice or superficial mention).
        const queryLower = prompt.toLowerCase();
        const chunkLower = decodedText.toLowerCase();

        // Extract specific technical terms from the query, e.g. "-scopy", "-gram", "-graphy", "brady-", etc.
        const queryTerms = queryLower.match(/-[a-z]{3,}|[a-z]{3,}-/g) || [];

        const asksSuffix = /suffix|ปัจจัยท้าย|-scopy|-gram|-graphy|scopy|gram|graphy/i.test(queryLower);
        const asksPrefix = /prefix|คำอุปสรรค|brady|tachy/i.test(queryLower);
        const asksRoot = /root|รากศัพท์/i.test(queryLower);
        const isSpecificTerminologyQuery = asksSuffix || asksPrefix || asksRoot;

        // Note: Reference evaluation uses deterministic heuristics (exact morpheme patterns,
        // definition frames, and target entity filtering) rather than deep NLI or semantic entailment.
        let isChunkTopicRelevant = false;
        if (isSpecificTerminologyQuery) {
          if (queryTerms.length > 0) {
            // If the query asks for specific technical terms (e.g. -scopy), the chunk must contain at least one of them
            isChunkTopicRelevant = queryTerms.some(term => chunkLower.includes(term.toLowerCase()));
          } else {
            // Query asks general suffix/prefix/root (without specific -term):
            // Requires substantive morphological patterns (-itis, brady-) or definition frames (คือ, หมายถึง, เช่น, ประกอบด้วย, :)
            // Casual mention (e.g. "กล่าวถึง prefix และ suffix ทั่วไป") is rejected as unsupported_citation.
            const asksDefinitionOrFunction = /(?:คืออะไร|หมายถึง|นิยาม|หน้าที่|ความหมาย|ทำหน้าที่|อธิบายหน้าที่|อธิบายความหมาย)/i.test(queryLower);

            // Split into clauses to ensure composition logic does not cross sentence boundaries
            const clauses = chunkLower
              .split(/(?:\r?\n+|[.;|•\u2022]+|\s{2,}|ฯ(?:ลฯ)?)/)
              .map(s => s.trim())
              .filter(s => s.length > 0);

            const chunkHasWordPartsComposition = clauses.some(cl =>
              /(?:คำศัพท์|ศัพท์เทคนิค|คำ|องค์ประกอบของคำ|โครงสร้างของคำ)(?:\s*ทางการแพทย์)?\s*(?:ประกอบด้วย|มีส่วนประกอบ|มีองค์ประกอบ|สร้างจาก)[^.!?;\n]*?(?:word root|prefix|suffix|combining vowel|คำอุปสรรค|ปัจจัยท้าย)/i.test(cl)
            );

            const chunkHasPrefixDefinition = clauses.some(cl =>
              /(?:คำอุปสรรค|ส่วนนำหน้า|เติมหน้า|prefix)(?:\s*(?:\([^)]*\)|[*_`"'])*\s*[:\-–]?\s*(?:วางไว้ข้างหน้า|วางไว้หน้า|อยู่ข้างหน้า|อยู่หน้า|เติมหน้า|ส่วนนำหน้า|คือ|หมายถึง|ทำหน้าที่))/i.test(cl) ||
              /\bprefix\b[^.!?;\n]*?\b(?:is|means|placed before|added to the front|affix attached to the beginning)\b/i.test(cl)
            );

            const chunkHasSuffixDefinition = clauses.some(cl =>
              /(?:ปัจจัยท้าย|คำต่อท้าย|คำปัจจัย|ส่วนลงท้าย|เติมท้าย|suffix)(?:\s*(?:\([^)]*\)|[*_`"'])*\s*[:\-–]?\s*(?:วางไว้ข้างหลัง|วางไว้หลัง|อยู่ข้างหลัง|อยู่หลัง|อยู่ท้าย|เติมท้าย|ส่วนลงท้าย|คือ|หมายถึง|ทำหน้าที่))/i.test(cl) ||
              /\bsuffix\b[^.!?;\n]*?\b(?:is|means|placed after|added to the end|affix attached to the end)\b/i.test(cl)
            );

            const chunkHasPrefixExamples = clauses.some(cl =>
              /(?:brady|tachy|dys|sub|hyper|hypo|a|an|anti|pre|post|peri|epi)-|-(?:brady|tachy|dys|sub|hyper|hypo)\b/i.test(cl) ||
              /(?:คำอุปสรรค|ส่วนนำหน้า|เติมหน้า|prefix)(?:\s*(?:\([^)]*\)\s*)?(?:เช่น|ได้แก่|ตัวอย่าง|\:|\-|\/))/i.test(cl) ||
              /\bprefix(?:es)?\s*(?:e\.g\.|such as|examples?:)/i.test(cl)
            );

            const chunkHasSuffixExamples = clauses.some(cl =>
              /(?:-itis|-ectomy|-scopy|-gram|-graphy|-logy|-plasty|-stomy|-tomy|-emia|-osis|-pathy)\b/i.test(cl) ||
              /-[a-z]{2,}\b/i.test(cl) ||
              /(?:ปัจจัยท้าย|คำต่อท้าย|คำปัจจัย|ส่วนลงท้าย|เติมท้าย|suffix)(?:\s*(?:\([^)]*\)\s*)?(?:เช่น|ได้แก่|ตัวอย่าง|\:|\-|\/))/i.test(cl) ||
              /\bsuffix(?:es)?\s*(?:e\.g\.|such as|examples?:)/i.test(cl)
            );

            // Clause-specific composition to prevent intra-chunk cross-sentence match
            const clauseHasPrefixComposition = clauses.some(cl =>
              /(?:คำศัพท์|ศัพท์เทคนิค|คำ|องค์ประกอบของคำ|โครงสร้างของคำ)(?:\s*ทางการแพทย์)?\s*(?:ประกอบด้วย|มีส่วนประกอบ|มีองค์ประกอบ|สร้างจาก)[^.!?;\n]*?(?:prefix|คำอุปสรรค)/i.test(cl)
            );

            const clauseHasSuffixComposition = clauses.some(cl =>
              /(?:คำศัพท์|ศัพท์เทคนิค|คำ|องค์ประกอบของคำ|โครงสร้างของคำ)(?:\s*ทางการแพทย์)?\s*(?:ประกอบด้วย|มีส่วนประกอบ|มีองค์ประกอบ|สร้างจาก)[^.!?;\n]*?(?:suffix|ปัจจัยท้าย)/i.test(cl)
            );

            const asksExamples = /ตัวอย่าง|เช่น|ยกตัวอย่าง|examples?/i.test(queryLower);
            const chunkHasSubstantivePrefix = (asksDefinitionOrFunction && !asksExamples)
              ? (chunkHasPrefixDefinition || clauseHasPrefixComposition)
              : (chunkHasPrefixDefinition || chunkHasPrefixExamples || clauseHasPrefixComposition);

            const chunkHasSubstantiveSuffix = (asksDefinitionOrFunction && !asksExamples)
              ? (chunkHasSuffixDefinition || clauseHasSuffixComposition)
              : (chunkHasSuffixDefinition || chunkHasSuffixExamples || clauseHasSuffixComposition);

            const chunkHasSubstantiveRoot =
              /(?:รากศัพท์|word root|แกนหลักของคำ)(?:\s*(?:\([^)]*\)\s*)?(?:คือ|หมายถึง|ทำหน้าที่|เช่น|ประกอบด้วย|ได้แก่|\:|\-|\/))/i.test(chunkLower) ||
              /รากศัพท์|แกนหลักของคำ/i.test(chunkLower);

            const isNoticeOrDisclaimer = /notice of adaptation|non-endorsement|copyright|สงวนลิขสิทธิ์|ประกาศ|disclaimer/i.test(chunkLower);

            isChunkTopicRelevant =
              !isNoticeOrDisclaimer &&
              ((asksSuffix && chunkHasSubstantiveSuffix) ||
               (asksPrefix && chunkHasSubstantivePrefix) ||
               (asksRoot && chunkHasSubstantiveRoot));
          }
        } else {
          // For general queries, do not assume relevance solely from retrieval match;
          // 1. Guard against administrative/notice/off-topic chunks
          const isNoticeOrAdministrative = /notice of adaptation|non-endorsement|copyright|สงวนลิขสิทธิ์|ประกาศ|disclaimer|วันหยุด/i.test(chunkLower);
          const asksNotice = /copyright|ประกาศ|ลิขสิทธิ์|disclaimer|notice|วันหยุด/i.test(queryLower);

          // 2. Guard against compromised answer fidelity
          const isAnswerCompromised =
            verification.stages.answerFidelity.status === 'hallucinated' ||
            verification.stages.answerFidelity.status === 'contradictory' ||
            verification.verdict === 'FAIL';

          // 3. Clinical Entities vs General English words:
          // Define specific clinical target markers (e.g. CBC, EDTA, PCR, ELISA, HbA1c, etc.)
          const SPECIFIC_LAB_MARKERS = [
            'cbc', 'pcr', 'edta', 'elisa', 'hba1c', 'bun', 'wbc', 'rbc', 'lft',
            'ast', 'alt', 'alp', 'sst', 'qc', 'pt', 'inr', 'aptt', 'hiv', 'hbv',
            'hcv', 'dna', 'rna', 'mso4', 'mgso4', 'complete blood count',
            'flow cytometry', 'blood glucose', 'fasting blood sugar'
          ];
          const queriedMarkers = SPECIFIC_LAB_MARKERS.filter(marker => queryLower.includes(marker));

          // General non-clinical English words that must NOT be treated as clinical evidence
          const GENERAL_NON_CLINICAL_WORDS = new Set([
            'and', 'for', 'the', 'with', 'about', 'from', 'into', 'over', 'after',
            'guide', 'guidelines', 'note', 'notes', 'text', 'study', 'student', 'learning',
            'unit', 'chapter', 'page', 'book', 'manual', 'general', 'overview', 'summary',
            'system', 'method', 'methods', 'rule', 'rules', 'process', 'step', 'steps',
            'record', 'records', 'report', 'information', 'data', 'format', 'case', 'cases',
            'example', 'examples', 'user', 'time', 'date', 'item', 'list', 'title', 'name',
            'code', 'class', 'course', 'level', 'score', 'paper', 'form', 'type', 'types',
            'part', 'parts', 'standard', 'standards', 'practice', 'review', 'week', 'day',
            'term', 'terms', 'how', 'what', 'why', 'when', 'which', 'where', 'who', 'does'
          ]);

          let hasSubstantiveMatch = false;

          if (queriedMarkers.length > 0) {
            // When query specifies clinical tests (CBC, EDTA, PCR, etc.), chunk MUST contain at least one queried marker.
            // Matching general words (guide, note, etc.) without the queried marker is strictly rejected.
            hasSubstantiveMatch = queriedMarkers.some(marker => chunkLower.includes(marker));
          } else {
            // For other clinical / laboratory queries without explicit acronyms in the marker list:
            const clinicalEntities = queryLower
              .match(/\b[a-z0-9]{2,}\b/g)
              ?.filter(e => !GENERAL_NON_CLINICAL_WORDS.has(e)) || [];

            if (clinicalEntities.length > 0) {
              hasSubstantiveMatch = clinicalEntities.some(entity => chunkLower.includes(entity));
            } else {
              // General query without English clinical entities: check retrieval matched keywords or Thai substantive tokens
              const hasMatchedKeywords = (retrieval.matchedKeywords || []).some(kw => chunkLower.includes(kw.toLowerCase()));
              const queryTokens = queryLower
                .split(/[\s,;:.!?()\/+\-]+/)
                .map(t => t.trim())
                .filter(t => t.length >= 3 && !ACADEMIC_STOPWORDS.has(t) && !['อธิบาย', 'คืออะไร', 'อย่างไร', 'เปรียบเทียบ', 'สรุป', 'ความหมาย', 'ข้อใด', 'ทำไม', 'เกี่ยวกับ', 'การตรวจ', 'ข้อมูล'].includes(t));
              hasSubstantiveMatch = hasMatchedKeywords || queryTokens.length === 0 || queryTokens.some(token => chunkLower.includes(token));
            }
          }

          if ((!isNoticeOrAdministrative || asksNotice) && hasSubstantiveMatch) {
            isChunkTopicRelevant = true;
          }
        }

        const isChunkUnsupported = !isChunkTopicRelevant;

        const cleanDocTitle = decodeHtmlEntities(documentContext.title || '');
        return {
          title: `เอกสาร: ${cleanDocTitle} — ${sectionTitle}`,
          uri: `#chunk-${c.chunkIndex}`,
          type: "document_chunk",
          linkAccessStatus: "verified_local",
          verificationStatus: isChunkUnsupported
            ? ("unsupported_citation" as const)
            : ("source_grounded" as const),
          evidenceLocator: finalLocator,
          excerpt,
          contentVersion: "1.2"
        };
      });

      const hasAnyGroundedReference = chunkReferences.some(r => r.verificationStatus === 'source_grounded');
      const isOverallEvidenceInsufficient = isFallbackInsufficient || !hasAnyGroundedReference;

      // Adjust fallback answer text when evidence is incomplete or overgeneralized:
      // Show ONLY conclusions supported by actual evidence and explicitly state missing parts.
      let finalFallbackText = fallbackText;
      if (isOverallEvidenceInsufficient || isFallbackInsufficient) {
        const queryLower = prompt.toLowerCase();
        const asksSuffix = /suffix|ปัจจัยท้าย/i.test(queryLower);
        const asksPrefix = /prefix|คำอุปสรรค/i.test(queryLower);
        const asksRoot = /root|รากศัพท์/i.test(queryLower);

        const groundedChunks = retrieval.relevantChunks.filter(c => {
          const ref = chunkReferences.find(r => r.uri === `#chunk-${c.chunkIndex}`);
          return ref && ref.verificationStatus === 'source_grounded';
        });

        const hasGroundedPrefix = groundedChunks.some(c => /prefix|คำอุปสรรค|brady|tachy/i.test(c.text || '')) ||
                                  chunkReferences.some(r => r.verificationStatus === 'source_grounded' && /prefix|คำอุปสรรค|brady|tachy/i.test(r.excerpt || ''));
        const hasGroundedSuffix = groundedChunks.some(c => /suffix|ปัจจัยท้าย|-itis|-ectomy|-scopy|-gram|-graphy|-logy|-plasty|-stomy|-tomy|-emia|-osis|-pathy/i.test(c.text || '')) ||
                                  chunkReferences.some(r => r.verificationStatus === 'source_grounded' && /suffix|ปัจจัยท้าย|-itis|-ectomy|-scopy|-gram|-graphy|-logy|-plasty|-stomy|-tomy|-emia|-osis|-pathy/i.test(r.excerpt || ''));
        const hasGroundedRoot = groundedChunks.some(c => /root|รากศัพท์|cardi|nephr/i.test(c.text || '')) ||
                                chunkReferences.some(r => r.verificationStatus === 'source_grounded' && /root|รากศัพท์|cardi|nephr/i.test(r.excerpt || ''));

        const missingParts: string[] = [];
        if (asksPrefix && !hasGroundedPrefix) missingParts.push('คำอุปสรรค (Prefix)');
        if (asksSuffix && !hasGroundedSuffix) missingParts.push('ปัจจัยท้าย (Suffix)');
        if (asksRoot && !hasGroundedRoot) missingParts.push('รากศัพท์ (Word Root)');

        if (groundedChunks.length > 0) {
          const groundedCitations = groundedChunks
            .map(c => {
              const cleanIdx = decodeHtmlEntities(String(c.chunkIndex ?? '')).replace(/[^0-9]/g, '') || c.chunkIndex;
              return `• **[ส่วนอ้างอิง ${cleanIdx}${c.pageNumber ? ` | หน้า ${c.pageNumber}` : ''}]**: ${decodeHtmlEntities(c.text || '')}`;
            })
            .join('\n\n');

          const missingClause = missingParts.length > 0
            ? `⚠️ **คำเตือนความครอบคลุมของหลักฐาน (Partial Evidence Notice):**\nเอกสารนี้มีข้อมูลรองรับเพียงบางส่วน โดย**ไม่พบข้อมูลเกี่ยวกับ: ${missingParts.join(', ')}** ระบบจึงนำเสนอเฉพาะส่วนที่มีหลักฐานยืนยันได้ ดังนี้:\n\n`
            : `⚠️ **คำเตือนความครอบคลุมของหลักฐาน (Incomplete Evidence Notice):**\nเอกสารนี้มีหลักฐานไม่ครอบคลุมประเด็นคำถามทั้งหมด ระบบจึงนำเสนอเฉพาะส่วนที่มีหลักฐานยืนยันได้ ดังนี้:\n\n`;

          finalFallbackText = `*(คำตอบสรุปจากเอกสารการเรียนรู้: "${cleanDocTitle}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\n${missingClause}${groundedCitations}\n\n*(หมายเหตุ: ส่วนที่ขาดหลักฐานไม่ถูกนำมาสรุปความ เพื่อป้องกันการคาดเดาข้อมูลเกินหลักฐานตามมาตรฐานทางวิชาการ)*`;
        } else {
          finalFallbackText = `*(ค้นหาจากเอกสาร: "${cleanDocTitle}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\n**ไม่พบหลักฐานทางวิชาการที่ตรงกับคำถามในเอกสารนี้ (Strict Anti-Hallucination)**\n\nจากการตรวจสอบชิ้นส่วนเนื้อหาทั้งหมดในเอกสาร ไม่พบข้อมูลที่ตอบประเด็น "${prompt}" ได้อย่างถูกต้องตามหลักวิชาการ ระบบจึงปฏิเสธการแต่งข้อมูล`;
        }
      }

      const seenUris = new Set<string>();
      const uniqueChunkReferences = chunkReferences.filter(r => {
        if (seenUris.has(r.uri)) return false;
        seenUris.add(r.uri);
        return true;
      });

      return {
        text: finalFallbackText,
        evidenceStatus: isOverallEvidenceInsufficient ? ("insufficient" as const) : ("sufficient" as const),
        verification,
        references: uniqueChunkReferences
      };
    } else {
      const fallbackText = `*(ค้นหาจากเอกสาร: "${documentContext.title}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\n**ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Anti-Hallucination)**\n\nจากการตรวจสอบชิ้นส่วนเนื้อหาทั้งหมดในเอกสาร "${documentContext.title}" ไม่พบข้อความหรือข้อมูลที่ตอบประเด็น "${prompt}" ได้โดยตรง\n\nระบบ MedTech Learning Hub AI ยึดหลักความถูกต้องทางวิชาการ จึงไม่มีการคาดเดาหรือแต่งคำตอบขึ้นมาเอง กรุณาตรวจสอบเอกสารเพิ่มเติม หรือลองปรับคำค้นหาครับ`;

      const verification = verifyAcademicAnswer({
        query: prompt,
        candidateAnswer: fallbackText,
        document: {
          title: documentContext.title,
          hasNativePages: documentContext.hasNativePages,
          totalPages: documentContext.totalPages,
          chunks: chunksForRetrieval
        },
        conversationHistory: (messages || []).map(m => ({ role: m.role as any, text: m.text }))
      });
      verification.verdict = 'INSUFFICIENT_EVIDENCE';
      verification.isVerified = false;

      return {
        text: fallbackText,
        evidenceStatus: "insufficient" as const,
        verification,
        references: []
      };
    }
  }

  const p = prompt.toLowerCase();
  const matchedTopic = determineTopic(p, messages);

  const hasHistory = messages && messages.length > 1;
  const isShortOrFollowUp = p.length < 50 || 
    p.includes("แล้ว") || 
    p.includes("ค่า") || 
    p.includes("คืออะไร") || 
    p.includes("ต่างกัน") || 
    p.includes("อันนี้") || 
    p.includes("นั่น") || 
    p.includes("ข้อนี้") || 
    p.includes("เพิ่ม") || 
    p.includes("ทำไม") || 
    p.includes("อย่างไร") || 
    p.includes("ยังไง") || 
    p.includes("เท่าไหร่") || 
    p.includes("หรือ") || 
    p.includes("ได้ไหม") ||
    p.includes("ถามต่อ");

  const hasNewDistinctTopic = p.includes("ประวัติศาสตร์") || 
    p.includes("history") || 
    p.includes("ฟิสิกส์") || 
    p.includes("physics") || 
    p.includes("คณิตศาสตร์") || 
    p.includes("math");

  const isContextualFollowUp = Boolean(hasHistory && (isShortOrFollowUp || !matchedTopic) && !hasNewDistinctTopic);
  
  const prefixNotice = isContextualFollowUp 
    ? `*(หมายเหตุ: ระบบอยู่ในโหมดข้อมูลสำรองทางวิชาการ (Academic Fallback Mode) เนื่องจากโควตา API เต็ม และคำถามของคุณอ้างถึงบริบทก่อนหน้าซึ่งระบบออฟไลน์ใช้ข้อมูลสำรองที่เกี่ยวข้อง)*\n\n`
    : `*(หมายเหตุ: โควตาการใช้งานฟรีของ Gemini API เต็มชั่วคราว ระบบได้แสดงข้อมูลวิชาการสำรอง (Academic Fallback Mode) เพื่อให้การเรียนรู้ดำเนินต่อไปได้)*\n\n`;


  if (matchedTopic === 'serum') {
    return {
      text: prefixNotice + `**ความแตกต่างระหว่างซีรั่ม (Serum) และพลาสมา (Plasma) ในงานห้องปฏิบัติการทางการแพทย์**

1. **คำจำกัดความและความแตกต่างพื้นฐาน (Core Definitions & Differences):**
   - **Plasma (พลาสมา):** ส่วนที่เป็นของเหลวของเลือดที่ไม่ผ่านการแข็งตัว (Unclotted blood) ได้จากการเก็บตัวอย่างเลือดใส่หลอดที่มีสารกันเลือดแข็ง (Anticoagulant เช่น EDTA, Heparin, Sodium Citrate) แล้วนำไปปั่นแยก พลาสมาจะยังมี **ปัจจัยการแข็งตัวของเลือด (Coagulation factors)** ครบถ้วน รวมถึง Fibrinogen
   - **Serum (ซีรั่ม):** ส่วนที่เป็นของเหลวของเลือดที่ได้ **หลังจากเลือดเกิดการแข็งตัวสมบูรณ์แล้ว (Clotted blood)** นำไปปั่นแยกซีรั่มใส่ออกมา เนื่องจากกระบวนการแข็งตัวได้ใช้ปัจจัยการแข็งตัวไปหมดแล้ว ซีรั่มจึง **ไม่มี Fibrinogen และปัจจัยการแข็งตัว**

2. **หลอดเก็บตัวอย่างโลหิตและสารเติมแต่ง (Specimen Collection Tubes & Additives):**
   - **หลอดสำหรับเก็บ Plasma:**
     - *Lavender/Purple Top (EDTA):* สำหรับตรวจทางโลหิตวิทยา (CBC) ป้องกันการแข็งตัวโดยจับกับแคลเซียมไอออน
     - *Light Blue Top (Sodium Citrate):* สำหรับทดสอบการแข็งตัวของเลือด (Coagulation tests เช่น PT, APTT)
     - *Green Top (Heparin):* สำหรับตรวจทางเคมีคลินิกบางประเภทที่ต้องการพลาสมา
   - **หลอดสำหรับเก็บ Serum:**
     - *Red Top or Tiger/Gold Top (SST - Serum Separator Tube):* มีสารเร่งการแข็งตัวของเลือด (Clot activator) และเจลคั่นเลือด ปล่อยให้เลือดแข็งตัวประมาณ 30-60 นาที ก่อนนำไปปั่นแยกเพื่อเก็บซีรั่ม

3. **ความสำคัญและการประยุกต์ทางคลินิก (Clinical Implications):**
   - การทดสอบการแข็งตัวของเลือด (Coagulation assays เช่น Prothrombin Time - PT และ Activated Partial Thromboplastin Time - APTT) **ต้องใช้พลาสมา (Sodium Citrate plasma)** เท่านั้น เนื่องจากซีรั่มไม่มีแฟคเตอร์การแข็งตัว
   - การทดสอบเคมีคลินิกส่วนใหญ่ (Routine chemistry เช่น Electrolytes, Renal function, Liver function, Lipid profile) สามารถใช้ได้ทั้งซีรั่มหรือพลาสมา ขึ้นอยู่กับมาตรฐานและระเบียบปฏิบัติประจำ (SOP) ของห้องปฏิบัติการนั้นๆ`,
      references: [
        { title: "StatPearls: Specimen Collection (Serum vs Plasma)", uri: "https://www.ncbi.nlm.nih.gov/books/NBK555956/" },
        { title: "CLSI H03: Procedures for the Collection of Diagnostic Blood Specimens by Venipuncture", uri: "https://clsi.org/shop/standards/h03/" }
      ]
    };

  } else if (matchedTopic === 'flow') {
    return {
      text: prefixNotice + `**หลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว (Leukocyte Differentiation)**

1. **หลักการพื้นฐาน (Core Principle):**
   - Flow Cytometry อาศัยการตรวจวัดคุณสมบัติทางแสงและฟิสิกส์ของเซลล์ทีละเซลล์ (Single-cell analysis) ขณะที่เซลล์ไหลผ่านลำแสงเลเซอร์ (Laser beam) ในของเหลวที่มีการจัดระเบียบแบบ Hydrodynamic focusing

2. **พารามิเตอร์หลักในการวิเคราะห์:**
   - **Forward Scatter (FSC):** สะท้อนขนาดของเซลล์ (Cell size / Volume) เซลล์ที่มีขนาดใหญ่จะมีค่า FSC สูง
   - **Side Scatter (SSC):** สะท้อนความซับซ้อนภายในเซลล์หรือการมี Granule (Cell granularity / Complexity) เช่น นิวเคลียสและแกรนูลในเม็ดเลือดขาวชนิดต่างๆ
   - **ข้อควรระวังสำคัญ (Caveat):** การกระจายตัวของ FSC และ SSC เพียงอย่างเดียวช่วยในการจำแนกกลุ่มเซลล์เม็ดเลือดขาวเบื้องต้นแบบกว้าง (Broad initial cell discrimination เช่น แยกกลุ่ม Lymphocytes, Monocytes, Granulocytes) แต่**ไม่เพียงพอสำหรับการจำแนกชนิดเซลล์อย่างเด็ดขาด (Definitive classification)** เนื่องจากมีความแปรปรวนและความทับซ้อนของประชากรเซลล์ จำเป็นต้องอาศัยการย้อมด้วย Monoclonal antibodies ติดฉลากสารเรืองแสงจำเพาะ (Immunophenotyping) และการตั้งเกณฑ์การคัดแยก (Gating strategies เช่น CD45 vs SSC) ร่วมด้วยเสมอ

3. **การจำแนกชนิดเม็ดเลือดขาว (Immunophenotyping):**
   - ใช้ Monoclonal antibodies ที่ติดฉลากด้วยสารเรืองแสง (Fluorochrome) เพื่อจับกับ Surface markers (CD markers) จำเพาะ เช่น:
     - **T-lymphocytes:** CD3+, CD4+ (Helper), CD8+ (Cytotoxic)
     - **B-lymphocytes:** CD19+, CD20+
     - **Natural Killer (NK) cells:** CD16+, CD56+
     - **Monocytes & Granulocytes:** จำแนกได้ชัดเจนตามกราฟการกระจายตัวของ FSC/SSC และ CD marker เฉพาะ

4. **การประยุกต์ทางคลินิก:**
   - การวินิจฉัยและติดตามโรคทางโลหิตวิทยา เช่น Leukemia และ Lymphoma
   - การประเมินเซลล์เม็ดเลือดขาว CD4 ในผู้ป่วย HIV
   - การทดสอบความเข้ากันได้และการปลูกถ่ายเซลล์`,
      references: [
        { 
          title: "Flow Cytometry Blood Cell Identification", 
          uri: "https://www.ncbi.nlm.nih.gov/books/NBK608011/" 
        }
      ]
    };
  } else if (matchedTopic === 'pcr') {
    if (p.includes("cq") || p.includes("ct")) {
      return {
        text: prefixNotice + `**ค่า Quantification Cycle (Cq) หรือ Threshold Cycle (Ct) ใน Real-Time PCR (qPCR)**

1. **คำนิยามพื้นฐาน (Definition):**
   - **Cq (Quantification Cycle)** หรือที่นิยมเรียกในชื่อเดิมว่า **Ct (Threshold Cycle)** คือ จำนวนรอบ (Cycle) ของปฏิกิริยา PCR ที่สัญญาณเรืองแสง (Fluorescence) เพิ่มขึ้นสูงจนทะลุผ่านเส้นเกณฑ์กำหนด (Baseline Threshold Line) และเริ่มตรวจจับได้อย่างมีนัยสำคัญทางสถิติเหนือกว่าสัญญาณรบกวนพื้นหลัง (Background noise)

2. **ความสัมพันธ์กับปริมาณสารพันธุกรรมเริ่มต้น (Inverse Quantitative Relationship):**
   - ค่า Cq มีความสัมพันธ์แบบ **ผกผัน (Inversely proportional)** กับปริมาณกรดนิวคลีอิกตั้งต้น (Initial template concentration) ในตัวอย่าง:
     - **ค่า Cq ต่ำ:** หมายถึงมีปริมาณ DNA/RNA ตั้งต้นในตัวอย่างมาก ทำให้ใช้รอบการเพิ่มขยายจำนวนน้อยครั้งสัญญาณก็ทะลุ Threshold (เช่น Viral load สูง)
     - **ค่า Cq สูง:** หมายถึงมีปริมาณ DNA/RNA ตั้งต้นน้อย ทำให้ต้องใช้รอบจำนวนมากสัญญาณถึงจะแตะเกณฑ์ Threshold (เช่น เชื้อปริมาณน้อย หรือปฏิกิริยาใกล้จุดอิ่มตัว)

3. **ข้อควรระวังในการแปลผลตามมาตรฐานสากล MIQE 2.0 (2025):**
   - การแปลผลค่า Cq/Ct ห้ามใช้เกณฑ์ตัดรอบตายตัวแบบเหมารวม (เช่น กำหนดว่าทุกการทดสอบที่ Ct > 40 เป็นผลลบเสมอ) โดยปราศจากการตรวจสอบความถูกต้องของวิธีตรวจเฉพาะ (Assay validation), ขีดจำกัดการตรวจพบ (Limit of Detection - LoD), การตั้งค่า Baseline/Threshold ที่เหมาะสม และการควบคุมคุณภาพด้วยชุดควบคุม (Positive, Negative, NTC Controls)`,
        references: [
          { 
            title: "MIQE 2.0: Revision of the Minimum Information for Publication of Quantitative Real-Time PCR Experiments Guidelines (Clinical Chemistry, 2025)", 
            uri: "https://academic.oup.com/clinchem/article/71/6/634/8119148" 
          }
        ]
      };
    }
    return {
      text: prefixNotice + `**ความแตกต่างระหว่าง Conventional PCR และ Real-Time PCR (qPCR) ในงานตรวจวินิจฉัยโมเลกุล**

1. **Conventional PCR (Polymerase Chain Reaction):**
   - **การตรวจวัดผล (Detection):** อาศัยการทำ Agarose Gel Electrophoresis หลังปฏิกิริยาเสร็จสิ้น (End-point analysis)
   - **การบอกปริมาณ (Quantitation):** เป็นแบบกึ่งปริมาณ (Semi-quantitative) หรือ Qualitative (ตรวจพบหรือไม่พบเท่านั้น) เนื่องจากไม่สามารถวัดปริมาณ DNA ในช่วง Exponential phase ได้แม่นยำ
   - **ความเสี่ยง:** มีโอกาสเกิด Cross-contamination สูงเนื่องจากต้องเปิดฝาหลอดเพื่อนำผลิตภัณฑ์ไปทำ Gel Electrophoresis

2. **Real-Time PCR (qPCR):**
   - **การตรวจวัดผล:** วัดสัญญาณเรืองแสง (Fluorescence) แบบเรียลไทม์ในทุกรอบการเพิ่มขยาย (Cycle) โดยใช้สีย้อม intercalating dye เช่น SYBR Green หรือโพรบจำเพาะเช่น TaqMan Hydrolysis Probe
   - **การบอกปริมาณ (Quantitation):** เป็นแบบเชิงปริมาณแท้จริง (Absolute / Relative Quantification) ผ่านค่า **Quantification Cycle (Cq)** หรือ **Threshold Cycle (Ct)** ซึ่งแปรผกผันกับปริมาณกรดนิวคลีอิกเริ่มต้น
   - **ข้อได้เปรียบทางเทคนิค:** ระบบหลอดปิด (Closed-tube system) ช่วยลดความเสี่ยงการปนเปื้อนของแอมพลิคอนข้ามหลอด (Carryover contamination) และลดขั้นตอนการทำเจลอิเล็กโทรโฟเรซิส ทั้งนี้ ความไวในการตรวจวัด (Analytical Sensitivity) ขึ้นอยู่กับการออกแบบไพรเมอร์ ประสิทธิภาพของปฏิกิริยา และคุณภาพของการสกัด ไม่ควรเหมารวมว่า Real-Time PCR ต้องมีความไวสูงกว่า Conventional PCR ในทุกกรณีเสมอไป

3. **ข้อควรระวังในการแปลผลรอบ (Cq/Ct Interpretation):**
   - ตามแนวทางมาตรฐานสากล **MIQE 2.0 (2025)** การแปลผลค่า Cq/Ct ขึ้นอยู่กับการตรวจสอบความถูกต้องของวิธีตรวจเฉพาะ (Assay validation), ขีดจำกัดการตรวจพบ (Limit of Detection - LoD), การตั้งค่า Baseline/Threshold และการควบคุมคุณภาพด้วยชุดควบคุม (Positive, Negative, NTC) จึงไม่ควรใช้เกณฑ์ตัดรอบที่ตายตัวแบบเหมารวม (เช่น การสรุปว่า Ct > 40 เป็นลบ หรือ Ct < 40 เป็นบวกเสมอ) โดยปราศจากการประเมินประสิทธิภาพของระบบตรวจและสภาวะการทดสอบ

4. **การประยุกต์ทางเทคนิคการแพทย์:**
   - ตรวจหาเชื้อไวรัสและแบคทีเรียและวัดปริมาณไวรัส (Viral Load testing เช่น HIV-1, HBV, HCV, SARS-CoV-2)
   - ตรวจสอบยีนกลายพันธุ์ในโรคมะเร็งและโรคทางพันธุกรรม`,
      references: [
        { 
          title: "MIQE 2.0: Revision of the Minimum Information for Publication of Quantitative Real-Time PCR Experiments Guidelines (Clinical Chemistry, 2025)", 
          uri: "https://academic.oup.com/clinchem/article/71/6/634/8119148" 
        },
        { 
          title: "A Basic Guide to Real Time PCR in Microbial Diagnostics: Definitions, Parameters, and Everything (Frontiers in Microbiology, 2017)", 
          uri: "https://pubmed.ncbi.nlm.nih.gov/28210243/" 
        }
      ]
    };
  } else if (matchedTopic === 'gram') {
    return {
      text: prefixNotice + `**หลักการย้อมสีแกรม (Gram Stain Protocols) และการควบคุมคุณภาพทางจุลชีววิทยาคลินิก**

1. **หลักการพื้นฐาน (Core Principle):**
   - การย้อมสีแยกชนิดแบคทีเรีย (Differential Staining) ตามโครงสร้างและความหนาของชั้น Peptidoglycan ในผนังเซลล์
   - **Gram-positive bacteria:** มีผนังเซลล์ Peptidoglycan หนาและมีสาร Teichoic acid ช่วยกักเก็บสารเชิงซ้อน Crystal Violet - Iodine (CV-I complex) ไม่ให้ถูกชะล้างออก ติดสีม่วง (Purple/Deep Blue)
   - **Gram-negative bacteria:** มีชั้น Peptidoglycan บาง และมีผนังเซลล์ชั้นนอก (Outer membrane) ที่มี Lipids สูง เมื่อถูกชะด้วยตัวทำละลายอินทรีย์ ลิพิดจะละลายและเกิดรูพรุน ทำให้ CV-I complex หลุดออก และติดสีทับ (Counterstain) ย้อมสีแดงหรือชมพู (Pink/Red)

2. **ขั้นตอนมาตรฐานและข้อควรระวังเรื่องระยะเวลาฟอกสี (Method-Dependent Decolorization):**
   - **Step 1 (Primary Stain):** ย้อมด้วย Crystal Violet
   - **Step 2 (Mordant):** หยด Gram's Iodine เพื่อสร้างสารเชิงซ้อนขนาดใหญ่ (CV-I complex) ตรึงในเซลล์
   - **Step 3 (Decolorization - ขั้นตอนวิกฤต):** ล้างด้วย Decolorizer (เช่น 95% Ethanol หรือ Acetone-Alcohol mixture)
     - **ข้อควรระวังเรื่องระยะเวลาการฟอกสี:** ตามโพรโทคอลมาตรฐานของ ASM ระยะเวลาการฟอกสีขึ้นอยู่กับชนิดของตัวทำละลายและความหนาของรอยสเมียร์ (Method-dependent & Smear thickness-dependent) โดย Acetone ออกฤทธิ์เร็วกว่าแอลกอฮอล์มาก จึงไม่สามารถกำหนดระยะเวลาเป็นวินาทีตายตัวสำหรับทุกระบบน้ำยาได้ วิธีปฏิบัติมาตรฐานคือหยดสารฟอกสีให้ไหลผ่านสเมียร์จนกระทั่งสารละลายที่ไหลลงมาไม่มีสีม่วงหลุดออกมาอีก (Flow of decolorizer runs clear) แล้วรีบล้างน้ำทันทีเพื่อหยุดปฏิกิริยา การฟอกสีนานเกินไป (Over-decolorization) จะทำให้แบคทีเรียแกรมบวกติดสีแดงลวง และการฟอกสีน้อยเกินไป (Under-decolorization) จะทำให้แบคทีเรียแกรมลบติดสีม่วงลวง
   - **Step 4 (Counterstain):** ย้อมสีทับด้วย Safranin หรือ 0.1% Basic Fuchsin

3. **การควบคุมคุณภาพ (Quality Control):**
   - ย้อมสไลด์ QC ร่วมด้วยเสมอ เช่น *Staphylococcus aureus* (Gram-positive cocci) และ *Escherichia coli* (Gram-negative bacilli) จากโคโลนีที่เพาะเลี้ยงสดใหม่ (18-24 ชั่วโมง)`,
      references: [
        { title: "Gram Stain Protocols", uri: "https://asm.org/protocols/gram-stain-protocols" }
      ]
    };
  } else if (matchedTopic === 'dengue') {
    return {
      text: prefixNotice + `**การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อไวรัสเดงกี่ (Dengue Infection)**

1. **ลักษณะทางโลหิตวิทยาที่สำคัญในโรคไข้เลือดออก (Dengue Hemorrhagic Fever - DHF):**
   - **Hemoglobin (Hb) & Hematocrit (Hct):** 
     - เกิดการรั่วของพลาสมา (Plasma leakage) ออกจากหลอดเลือดเนื่องจากความซึมได้ของหลอดเลือดฝอยเพิ่มขึ้น
     - เกณฑ์การเพิ่มขึ้นของค่า **Hematocrit (Hct) ≥ 20%** จากค่าพื้นฐานเดิม เป็นเกณฑ์ประเมินภาวะ Hemoconcentration ในเชิงประวัติศาสตร์ตามแนวทางขององค์การอนามัยโลก (WHO 2009 Historical Criterion) ทั้งนี้ในแนวทางเวชปฏิบัติปัจจุบัน ไม่ได้ใช้ตัวเลข 20% เป็นเกณฑ์วินิจฉัยสากลเพียงข้อเดียว แต่ต้องประเมินแนวโน้มการเปลี่ยนแปลงของ Hct ควบคู่กับอาการทางคลินิก สัญญาณชีพ และสมดุลสารน้ำของผู้ป่วยอย่างใกล้ชิด
   - **White Blood Cell (WBC) Count:**
     - มักพบภาวะ **Leukopenia** (เม็ดเลือดขาวต่ำ) โดยเฉพาะในระยะไข้ (Febrile phase)
     - อาจพบเม็ดเลือดขาวชนิด Atypical lymphocytes เพิ่มสูงขึ้น
   - **Platelet Count (เกล็ดเลือด):**
     - พบภาวะ **Thrombocytopenia** อย่างเด่นชัด (เกล็ดเลือดต่ำกว่า 100,000 cells/mm³) ซึ่งเกิดจากการกดไขกระดูกและการทำลายเกล็ดเลือดเพิ่มขึ้น

2. **ความสำคัญทางห้องปฏิบัติการ:**
   - การติดตามค่า Hct และ Platelet อย่างใกล้ชิดช่วยให้แพทย์ประเมินความรุนแรงของโรคและภาวะ Shock ได้ทันท่วงที`,
      references: [
        { title: "WHO Guidelines - Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control (2009)", uri: "https://www.who.int/publications/i/item/9789241547871" },
        { title: "Clinical Care of Dengue | Dengue | CDC", uri: "https://www.cdc.gov/dengue/hcp/clinical-care/" }
      ]
    };
  } else if (matchedTopic === 'cbc') {
    return {
      text: prefixNotice + `**หลักการตรวจวิเคราะห์ Complete Blood Count (CBC), การตรวจแยกชนิดเม็ดเลือดขาว และการควบคุมคุณภาพด้วย Westgard Rules**

1. **หลักการตรวจวัดด้วยเครื่องวิเคราะห์อัตโนมัติ (Automated Hematology Analyzer):**
   - **Electrical Impedance (Coulter Principle):** อาศัยการเปลี่ยนแปลงความต้านทานไฟฟ้าเมื่อเซลล์ผ่านช่อง Aperture เพื่อตรวจนับจำนวนและประเมินขนาดของเม็ดเลือดแดง (RBC) และเกล็ดเลือด (Platelets)
   - **Optical Light Scatter / Flow-based Detection:** ใช้แสงเลเซอร์วัดการกระเจิงของแสง (Forward Scatter วัดขนาดเซลล์, Side Scatter วัดความซับซ้อนภายใน) ร่วมกับการย้อมไซโตเคมีเพื่อจำแนกชนิดเม็ดเลือดขาว (WBC 5-Part Differential)

2. **การตรวจแยกชนิดเม็ดเลือดขาวและข้อจำกัดของเครื่องอัตโนมัติ (Leukocyte Differential & Smear Review):**
   - **วิธีอ้างอิงสำหรับการนับแยกชนิดเม็ดเลือดขาว:**
     *(อ้างอิงมาตรฐาน: CLSI H20 3rd Edition — มีขอบเขตเฉพาะวิธีอ้างอิงแมนนวลเพื่อประเมินความถูกต้องของเครื่องตรวจนับ WBC Differential)*
     - มาตรฐาน CLSI H20 ฉบับที่ 3 (Third Edition, เผยแพร่ 29 เมษายน 2026 แทนที่ H20-A2 เดิม) กำหนดวิธีอ้างอิงในการนับแยกชนิดเม็ดเลือดขาวด้วยสายตา (Reference visual WBC differential) เพื่อใช้ประเมินและทวนสอบความแม่นยำของเครื่องตรวจอัตโนมัติ
   - **การตรวจยืนยันสัณฐานวิทยาทางโลหิตวิทยา (Hematologic Morphology Review):**
     *(หมายเหตุ: เกณฑ์การตรวจสเมียร์เลือดเมื่อพบสัญญาณเตือน Analyzer Flags หรือสงสัยเซลล์ตัวอ่อน เช่น Blasts เป็นแนวทางปฏิบัติทั่วไปของห้องปฏิบัติการตามเกณฑ์ทบทวนสไลด์ระดับสถาบัน มิได้ครอบคลุมอยู่ในมาตรฐาน CLSI H20)*
     - เมื่อเครื่องตรวจส่งสัญญาณเตือน (Flags) หรือตรวจพบความผิดปกติที่เครื่องไม่สามารถจำแนกได้อย่างแม่นยำ นักเทคนิคการแพทย์จำเป็นต้องย้อมและตรวจดูแผ่นฟิล์มเลือดเพื่อตรวจยืนยันความผิดปกติทางสัณฐานวิทยา เช่น การพบเม็ดเลือดขาวตัวอ่อน หรือความผิดปกติของเม็ดเลือดแดง (เช่น Schistocytes ในภาวะ MAHA)
   - **ภาวะเกล็ดเลือดต่ำลวงจากสารกันเลือดแข็ง EDTA (EDTA-Dependent Pseudothrombocytopenia):**
     *(อ้างอิงบทความวิจัย: Lippi G, et al. PubMed 25425098)*
     - เป็นปรากฏการณ์ภายนอกร่างกาย (In vitro artifact) ที่เกิดจากแอนติบอดีจับกับเกล็ดเลือดเมื่อมีสาร EDTA ทำให้เกิดการเกาะกลุ่ม (Platelet clumping) จนเครื่องตรวจนับผิดพลาดเป็นเกล็ดเลือดต่ำ การยืนยันทำได้โดยการตรวจดูสเมียร์เลือดและเจาะเลือดซ้ำด้วยหลอดเก็บเลือดที่มีสารกันเลือดแข็งชนิดอื่น เช่น Sodium Citrate หรือ Heparin

3. **การควบคุมคุณภาพเชิงสถิติ (Statistical Quality Control & Westgard Multirules):**
   *(อ้างอิงเฉพาะกฎการควบคุมคุณภาพ: Westgard JO, et al. Clin Chem 1981)*
   - ทำ Internal QC อย่างน้อย 2-3 ระดับ (Low, Normal, High) บันทึกลง Levey-Jennings Chart ประเมินด้วย Westgard Multirules:
     - **1_2s:** กฎเตือน (Warning Rule) เมื่อมี 1 ค่าหลุดเกิน ±2SD (ให้ตรวจสอบเพิ่มเติม ไม่ปฏิเสธ Run ทันที)
     - **1_3s:** ปฏิเสธการทดสอบ (Rejection / Random Error) เมื่อมี 1 ค่าหลุดเกิน ±3SD
     - **2_2s:** ปฏิเสธการทดสอบ (Rejection / Systematic Error) เมื่อมี 2 ค่าติดต่อกันหลุดเกิน ±2SD ในทิศทางเดียวกัน
     - **R_4s:** ปฏิเสธการทดสอบ (Rejection / Random Error) เมื่อผลต่างระหว่าง 2 ค่าใน Run เดียวกันห่างกันเกิน 4SD
     - **4_1s และ 10_x:** ตรวจจับ Systematic Bias เมื่อมี 4 ค่าต่อเนื่องเกิน ±1SD หรือ 10 ค่าต่อเนื่องอยู่ฝั่งเดียวกันของ Mean`,
      references: [
        { title: "CLSI H20: Reference Leukocyte Differential Count (Proportional) and Evaluation of Instrumental Methods (3rd Edition)", uri: "https://clsi.org/shop/standards/h20/" },
        { title: "Discovery and Correction of Spurious Low Platelet Counts due to EDTA-Dependent Pseudothrombocytopenia", uri: "https://pubmed.ncbi.nlm.nih.gov/25425098/" },
        { title: "Westgard JO, et al. A Multi-Rule Shewhart Chart for Quality Control in Clinical Chemistry (Clin Chem 1981 / PubMed 7201955)", uri: "https://pubmed.ncbi.nlm.nih.gov/7201955/" }
      ]
    };
  } else if (matchedTopic === 'cross') {
    return {
      text: prefixNotice + `**ขั้นตอนการทำ Crossmatching และการตรวจหมู่เลือด (Blood Grouping & Crossmatch)**

1. **การตรวจหมู่เลือด (Blood Grouping):**
   - **ABO Grouping:** 
     - *Cell grouping (Forward typing):* ตรวจแอนติเจนบนเม็ดเลือดแดงของผู้ป่วยด้วย Anti-A, Anti-B, และ Anti-AB
     - *Serum grouping (Reverse typing):* ตรวจแอนติบอดีในซีรั่มของผู้ป่วยด้วย A1 cells และ B cells ผลทั้งสองด้านต้องตรงกันจึงจะยืนยันหมู่เลือดได้
   - **Rh Typing:** ตรวจหาแอนติเจน D โดยใช้ Anti-D หากพบการตกตะกอนถือเป็น Rh Positive

2. **ขั้นตอนการทดสอบความเข้ากันได้ (Crossmatching):**
   - **Major Crossmatch:** นำ **ซีรั่ม (Serum/Plasma) ของผู้ป่วย** มาทดสอบกับ **เม็ดเลือดแดงของผู้บริจาค (Donor red cells)** เพื่อตรวจหาแอนติบอดีในผู้ป่วยที่อาจไปทำลายเม็ดเลือดแดงผู้บริจาค
   - **Minor Crossmatch (ปัจจุบันมักถูกทดแทนด้วยการตรวจ Donor Screening):** นำซีรั่มของผู้บริจาคมาทดสอบกับเม็ดเลือดแดงผู้ป่วย

3. **เทคนิคและระยะเวลาทดสอบ:**
   - **Immediate Spin Phase:** ตรวจสอบหมู่เลือด ABO mismatch (ใช้เวลาประมาณ 1-2 นาที)
   - **37°C Incubation & AHG (Antiglobulin Test / Coombs' Test) Phase:** ตรวจสอบแอนติบอดีชนิด IgG ที่ไม่เกาะกลุ่มในเบื้องต้น (เช่น Anti-Rh, Anti-Kell) โดยใช้ AHG reagent
   - หากผลทดสอบทุกเฟส **ไม่มีการตกตะกอนหรือเม็ดเลือดแตก (No Agglutination & No Hemolysis)** ถือว่าเข้ากันได้ (Compatible) สามารถจ่ายเลือดให้ผู้ป่วยได้

4. **ข้อกำหนดความปลอดภัย (Disclaimer):**
   - ขั้นตอนข้างต้นเป็นเพียงสรุปหลักการทางทฤษฎีเพื่อการศึกษาเท่านั้น ไม่ใช่แนวทางปฏิบัติงานมาตรฐานทางคลินิก (Clinical SOP) การปฏิบัติงานจริงในห้องปฏิบัติการธนาคารเลือดต้องยึดถือตาม SOP ที่ผ่านการรับรองของแต่ละสถาบันและข้อกำหนดมาตรฐานงานบริการโลหิตอย่างเคร่งครัด`,
      references: [
        { title: "AABB Technical Manual, 22nd Edition", uri: "https://www.aabb.org/aabb-store/product/technical-manual-22nd-edition-print-21871175" },
        { title: "Blood Groups and Red Cell Antigens", uri: "https://www.ncbi.nlm.nih.gov/books/NBK2261/" }
      ]
    };
  } else if (matchedTopic === 'dtm_course_starter') {
    return {
      text: prefixNotice + `**แนวคิดพื้นฐานเพื่อการเรียนรู้รายวิชาในหลักสูตร DTM 2567 (Foundational Learning Guide)**

*(หมายเหตุความโปร่งใสทางวิชาการ: ส่วนนี้เป็นคำอธิบายแนวคิดพื้นฐานทั่วไปตามหัวข้อและชื่อรายวิชาเพื่อช่วยผู้เรียนเริ่มต้นศึกษา ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการจากเล่มหลักสูตร มคอ.2 เนื่องจากวิชานี้ยังไม่มีเอกสารประกอบการสอนในระบบ)*

1. **ภาพรวมและเป้าหมายของหัวข้อวิชา:**
   - มุ่งเน้นการทำความเข้าใจบริบทของเทคโนโลยีดิจิทัลที่นำมาประยุกต์ใช้ในการแพทย์และการดูแลสุขภาพ (Digital Healthcare)
   - เชื่อมโยงความรู้ด้านวิทยาศาสตร์การแพทย์ (Medical Science) เข้ากับวิทยาการคอมพิวเตอร์และระบบสารสนเทศ (Computer & Information Science)

2. **คำศัพท์เทคนิคภาษาอังกฤษสำคัญ (Key English Technical Terms):**
   - **Electronic Health Record (EHR) / EMR:** ระบบเวชระเบียนและประวัติสุขภาพอิเล็กทรอนิกส์
   - **Health Data Interoperability (HL7 FHIR):** การทำงานร่วมกันและการแลกเปลี่ยนข้อมูลสุขภาพตามมาตรฐานสากล
   - **Medical Imaging Standards (DICOM / PACS):** มาตรฐานการจัดการภาพถ่ายทางการแพทย์และการสื่อสารดิจิทัล
   - **Clinical Decision Support System (CDSS):** ระบบสารสนเทศสนับสนุนการตัดสินใจทางคลินิก
   - **Data Privacy & Security (HIPAA / PDPA):** ธรรมาภิบาลและความมั่นคงปลอดภัยของข้อมูลสุขภาพผู้ป่วย

3. **แนวทางการศึกษาสำหรับผู้เริ่มต้น:**
   - ศึกษาโครงสร้างข้อมูลและศัพท์เทคนิคภาษาอังกฤษเป็นลำดับ
   - ทำความเข้าใจกระบวนการทำงานในสถานพยาบาลและจุดเชื่อมต่อระหว่างระบบซอฟต์แวร์กับบุคลากรทางการแพทย์
   - เมื่อมีเอกสารประกอบการสอนจากผู้สอน สามารถนำเข้าสู่ระบบผ่าน "คลังเอกสารการเรียนรู้" (Document Library) เพื่อเปิดโหมดการติวอิงเอกสารและตรวจสอบความถูกต้องเชิงลึกได้ทันที`,
      references: [
        { title: "เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์", uri: "https://ces.wu.ac.th/registrar/StudentHandbook/2567/22_IMI_01.pdf" },
        { title: "เว็บไซต์หลักสูตร Digital Technology in Medicine ม.วลัยลักษณ์", uri: "https://informatics.wu.ac.th/bachelors-degree/digital-technology-in-medicine/" }
      ]
    };
  } else if (matchedTopic === 'dtm_informatics') {
    return {
      text: prefixNotice + `**ระบบสารสนเทศสุขภาพและเวชระเบียนอิเล็กทรอนิกส์ (Health Informatics & EHR/EMR)**

1. **ความแตกต่างระหว่าง EMR และ EHR:**
   - **EMR (Electronic Medical Record):** บันทึกข้อมูลการรักษาและเวชระเบียนของผู้ป่วยที่เกิดขึ้นภายในสถานพยาบาลหรือคลินิกแห่งเดียว มุ่งเน้นการใช้งานทางคลินิกภายในองค์กร
   - **EHR (Electronic Health Record):** บันทึกข้อมูลสุขภาพองค์รวมของผู้ป่วยที่ออกแบบมาให้สามารถแลกเปลี่ยนและเชื่อมโยงข้ามสถานพยาบาลได้ (Interoperable) เพื่อการดูแลรักษาต่อเนื่อง

2. **ระบบสารสนเทศโรงพยาบาล (Hospital Information System - HIS):**
   - ประกอบด้วยโมดูลสำคัญ: ฝ่ายเวชระเบียน (Patient Registration), ห้องตรวจแพทย์ (OPD/IPD Doctor Order Entry), ห้องปฏิบัติการ (LIS), รังสีวิทยา (RIS), และห้องยา (Pharmacy Information System)
   - มีระบบ **Clinical Decision Support System (CDSS)** คอยแจ้งเตือนความเสี่ยง เช่น การแพ้ยา (Drug Allergy) หรือปฏิกิริยาระหว่างยา (Drug-Drug Interaction)

3. **มาตรฐานและความปลอดภัยข้อมูล:**
   - ต้องปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA ในไทย หรือ HIPAA ในระดับสากล) โดยกำหนดสิทธิ์การเข้าถึงข้อมูลตามบทบาท (Role-Based Access Control: RBAC)`,
      references: [
        { title: "WHO Guideline on Digital Health Interventions", uri: "https://www.who.int/publications/i/item/9789241550505" },
        { title: "Health Information Systems - HIMSS", uri: "https://www.himss.org/resources" }
      ]
    };
  } else if (matchedTopic === 'dtm_standards') {
    return {
      text: prefixNotice + `**มาตรฐานข้อมูลสุขภาพและภาพถ่ายทางการแพทย์ (Medical Data & Imaging Standards)**

1. **DICOM และ PACS:**
   - **DICOM (Digital Imaging and Communications in Medicine):** มาตรฐานระดับสากลสำหรับการจัดเก็บ ส่งต่อ และพิมพ์ภาพถ่ายทางการแพทย์ (เช่น X-ray, CT, MRI, Ultrasound) ซึ่งรวมข้อมูลภาพ (Pixel Data) และข้อมูลผู้ป่วย/การตรวจ (Metadata Header) ไว้ในไฟล์เดียวกัน
   - **PACS (Picture Archiving and Communication System):** ระบบเซิร์ฟเวอร์และเครือข่ายสำหรับจัดเก็บ สำรอง และกระจายภาพ DICOM ให้แพทย์เรียกดูได้จากทุกจุดในโรงพยาบาล

2. **HL7 และ FHIR (Fast Healthcare Interoperability Resources):**
   - **HL7 v2 / v3:** มาตรฐานการส่งข้อความสุขภาพยุคดั้งเดิม
   - **HL7 FHIR:** มาตรฐานยุคใหม่ที่ใช้แนวคิดแบบ "Resources" (เช่น Patient, Observation, Condition) ผ่าน RESTful API และรูปแบบ JSON/XML ทำให้การพัฒนา Mobile Health และ Web Applications เชื่อมต่อกับระบบโรงพยาบาลได้สะดวกรวดเร็ว

3. **ระบบรหัสมาตรฐานทางการแพทย์:**
   - **ICD-10 / ICD-11:** รหัสจำแนกโรคสากลสำหรับสถิติและการเบิกจ่าย
   - **LOINC:** รหัสมาตรฐานสากลสำหรับผลตรวจทางห้องปฏิบัติการและสัญญาณชีพ`,
      references: [
        { title: "DICOM Standard Overview - NEMA", uri: "https://www.dicomstandard.org/" },
        { title: "HL7 FHIR Specification", uri: "https://hl7.org/fhir/" }
      ]
    };
  } else if (matchedTopic === 'dtm_ai') {
    return {
      text: prefixNotice + `**ปัญญาประดิษฐ์และการประมวลผลข้อมูลทางการแพทย์ (Medical AI & Deep Learning)**

1. **การประมวลผลภาพถ่ายทางการแพทย์ (Medical Image Analysis):**
   - นิยมใช้สถาปัตยกรรม **Convolutional Neural Networks (CNN)** เช่น ResNet, DenseNet ในการจำแนกโรค (Classification)
   - สถาปัตยกรรม **U-Net** ในการแบ่งส่วนภาพ (Semantic Segmentation) เช่น การแบ่งขอบเขตของเนื้องอก (Tumor), หลอดเลือด, หรือเซลล์เม็ดเลือด

2. **ตัวชี้วัดประสิทธิภาพในงานทางการแพทย์:**
   - **ความไว (Sensitivity / Recall):** สัดส่วนผู้ป่วยที่เป็นโรคและโมเดลตรวจพบ (TP / [TP + FN]) ซึ่งสำคัญสูงสุดในงานคัดกรอง (Screening) เพื่อไม่ให้ผู้ป่วยหลุดรอด
   - **ความจำเพาะ (Specificity):** สัดส่วนผู้ที่ไม่เป็นโรคและโมเดลทำนายว่าปกติ (TN / [TN + FP]) เพื่อป้องกัน False Alarm

3. **จริยธรรมและความปลอดภัยของ Medical AI:**
   - ต้องตรวจสอบความเอนเอียงของข้อมูล (Algorithmic Bias), ความสามารถในการอธิบายผลการทำนาย (Explainability / XAI เช่น Grad-CAM), และผ่านการทดสอบทางคลินิกก่อนนำไปใช้จริง`,
      references: [
        { title: "WHO Ethics and Governance of AI for Health", uri: "https://www.who.int/publications/i/item/9789240029200" },
        { title: "Deep Learning for Medical Image Analysis (Nature Medicine)", uri: "https://www.nature.com/articles/s41591-018-0316-4" }
      ]
    };
  } else if (matchedTopic === 'dtm') {
    return {
      text: prefixNotice + `**ข้อมูลหลักสูตรวิทยาศาสตรบัณฑิต สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (หลักสูตรปรับปรุง พ.ศ. 2567) มหาวิทยาลัยวลัยลักษณ์**

1. **โครงสร้างหน่วยกิตรวมและหมวดวิชา:**
   - **หน่วยกิตรวมตลอดหลักสูตร:** ไม่น้อยกว่า 124 หน่วยกิต
   - **หมวดวิชาศึกษาทั่วไป:** ไม่น้อยกว่า 26 หน่วยกิต (ครอบคลุมภาษาต่างประเทศ สังคมศาสตร์ มนุษยศาสตร์ สุนทรียศาสตร์ วิทยาศาสตร์และเทคโนโลยี การบริหารธุรกิจ และสุขภาพพลานามัย)
   - **หมวดวิชาเฉพาะ:** ไม่น้อยกว่า 92 หน่วยกิต
     - *หมายเหตุโครงสร้างหมวดวิชาเฉพาะ:* ประกอบด้วย วิชาเฉพาะด้าน (ไม่น้อยกว่า 64 นก.), วิชาโท (ไม่น้อยกว่า 15 นก.), และรวมสหกิจศึกษา (13 นก.) ไว้ในหมวดวิชาเฉพาะตามโครงสร้างหลักสูตร (ไม่มีการบวกสหกิจศึกษา 13 หน่วยกิตซ้ำซ้อนแยกต่างหากจาก 92 หน่วยกิต)
   - **หมวดวิชาเลือกเสรี:** ไม่น้อยกว่า 6 หน่วยกิต

2. **กลุ่มวิชาโทที่เปิดสอน (Minors):**
   - นวัตกรรมการแพทย์ดิจิทัล (Digital Medical Innovation)
   - ปัญญาประดิษฐ์ทางการแพทย์ (Medical Artificial Intelligence)

3. **สหกิจศึกษา (Cooperative Education):**
   - 13 หน่วยกิต (ปฏิบัติงานจริงในองค์กร/สถานพยาบาลไม่น้อยกว่า 8 เดือน)

4. **สถานะหลักฐานข้อมูลสำรอง (Academic Fallback Evidence Status):**
   - ข้อมูลโครงสร้างภาพรวมและหมวดหมู่หน่วยกิตข้างต้น: **ข้อมูลสำรองวิชาการ (Static Curriculum Fallback Knowledge)** อ้างอิงจากโครงสร้างหลักสูตรทั่วไป
   - รายวิชาในหลักสูตร: ข้อมูลสรุปอ้างอิงจากเล่มหลักสูตร มคอ.2 (สถานะแหล่งอ้างอิง: ยังไม่ได้ตรวจสอบเนื้อหาแบบไดนามิกในเซสชันนี้ เนื่องจากอยู่ในโหมด Academic Fallback)`,
      references: [
        { title: "เว็บไซต์หลักสูตร Digital Technology in Medicine ม.วลัยลักษณ์", uri: "https://informatics.wu.ac.th/bachelors-degree/digital-technology-in-medicine/" },
        { title: "เอกสารคู่มือนักศึกษาหลักสูตร พ.ศ. 2567 (PDF - CES)", uri: "https://ces.wu.ac.th/registrar/StudentHandbook/2567/22_IMI_01.pdf" }
      ]
    };
  } else {
    return {
      text: prefixNotice + `**ไม่พบข้อมูลสำรองทางวิชาการเฉพาะสำหรับหัวข้อนี้**

ขออภัย ระบบข้อมูลสำรองทางวิชาการ (Academic Fallback Mode) ในขณะนี้ยังไม่มีฐานข้อมูลสรุปเฉพาะสำหรับหัวข้อที่คุณสอบถาม`,
      references: []
    };
  }
}

// API endpoint for Gemini generation with multi-turn messages, retry, exponential backoff, and Google Search Grounding
app.post("/api/gemini/generate", async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}`;
  const { messages, prompt, documentContext, courseContext, searchMode } = req.body;
  console.log(`[Req ${requestId}] Received generate request. hasDocumentContext: ${Boolean(documentContext)}, searchMode: ${searchMode || 'auto'}, messagesCount: ${Array.isArray(messages) ? messages.length : 0}`);

  // Server-side validation of messages array
  let validatedMessages: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(messages)) {
    if (messages.length === 0 || messages.length > 8) {
      return res.status(400).json({ error: "จำนวนข้อความในประวัติการสนทนาต้องอยู่ระหว่าง 1 ถึง 8 ข้อความ" });
    }
    let totalChars = 0;
    for (const msg of messages) {
      if (!msg || (msg.role !== 'user' && msg.role !== 'model') || typeof msg.text !== 'string' || !msg.text.trim()) {
        return res.status(400).json({ error: "รูปแบบข้อความใน messages ไม่ถูกต้อง (role หรือ text ไม่ผ่านการตรวจสอบ)" });
      }
      if (msg.text.length > 4000) {
        return res.status(400).json({ error: "ข้อความมีความยาวเกินกำหนด (สูงสุด 4,000 ตัวอักษรต่อข้อความ)" });
      }
      totalChars += msg.text.length;
      validatedMessages.push({ role: msg.role, text: msg.text.trim() });
    }

    const MAX_TOTAL_CHARS = 15000;
    if (totalChars > MAX_TOTAL_CHARS) {
      return res.status(400).json({ error: "ความยาวรวมของข้อความทั้งหมดเกินกำหนด (สูงสุด 15,000 ตัวอักษร)" });
    }

    // Must start with user
    if (validatedMessages[0].role !== 'user') {
      return res.status(400).json({ error: "ประวัติการสนทนาต้องเริ่มต้นด้วยผู้ใช้ (user)" });
    }

    // Check strict role alternation (no consecutive duplicate roles)
    for (let i = 0; i < validatedMessages.length - 1; i++) {
      if (validatedMessages[i].role === validatedMessages[i + 1].role) {
        return res.status(400).json({ error: "ลำดับบทบาทผู้ใช้และโมเดลต้องสลับกัน (ไม่สามารถมี role ซ้ำติดกันได้)" });
      }
    }

    // Ensure last message is from user
    if (validatedMessages[validatedMessages.length - 1].role !== 'user') {
      return res.status(400).json({ error: "ข้อความล่าสุดในประวัติการสนทนาต้องมาจากผู้ใช้ (user)" });
    }
  } else if (prompt && typeof prompt === 'string' && prompt.trim()) {
    // Backward compatibility for single prompt requests
    validatedMessages = [{ role: 'user', text: prompt.trim() }];
  } else {
    return res.status(400).json({ error: "กรุณาระบุประวัติการสนทนา (messages) หรือคำถาม (prompt)" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "ไม่พบ GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่า Secrets" });
  }

  const latestPrompt = validatedMessages[validatedMessages.length - 1].text;

  let systemInstruction = `คุณคือผู้ช่วย AI วิชาการสำหรับ "MedTech Learning Hub AI" ซึ่งเป็นแพลตฟอร์มการเรียนรู้หลักสูตรวิทยาศาสตรบัณฑิต สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (Digital Technology in Medicine: DTM) หลักสูตรปรับปรุง พ.ศ. 2567 มหาวิทยาลัยวลัยลักษณ์
โปรดตอบคำถามโดยใช้ภาษาไทยเป็นหลัก พร้อมทั้งรักษาและเน้นคำศัพท์ภาษาอังกฤษทางการแพทย์และเทคโนโลยีดิจิทัลที่สำคัญไว้ (เช่น Electronic Health Record, EHR, DICOM, PACS, HL7, FHIR, ICD-10, Medical AI, Deep Learning, Biomedical Signals, Clinical Decision Support System)

ข้อมูลบริบทหลักสูตรอย่างเป็นทางการ (${dtmCurriculum2567.programNameThai} ${dtmCurriculum2567.academicYear} มหาวิทยาลัยวลัยลักษณ์):
- หน่วยกิตรวมตลอดหลักสูตร: ${dtmCurriculum2567.totalCredits} หน่วยกิต
- หมวดวิชาศึกษาทั่วไป: ไม่น้อยกว่า ${dtmCurriculum2567.categories.generalEducation.minCredits} หน่วยกิต (${dtmCurriculum2567.categories.generalEducation.description})
- หมวดวิชาเฉพาะ: ไม่น้อยกว่า ${dtmCurriculum2567.categories.majorSpecific.minCredits} หน่วยกิต (ประกอบด้วย วิชาเฉพาะด้าน ไม่น้อยกว่า ${dtmCurriculum2567.categories.majorCourses.minCredits} นก., วิชาโท ไม่น้อยกว่า ${dtmCurriculum2567.categories.minorCourses.minCredits} นก., และรวมสหกิจศึกษา ${dtmCurriculum2567.categories.cooperativeEducation.minCredits} นก.)
- หมวดวิชาสหกิจศึกษา: ${dtmCurriculum2567.categories.cooperativeEducation.minCredits} หน่วยกิต (${dtmCurriculum2567.categories.cooperativeEducation.description})
- หมวดวิชาเลือกเสรี: ${dtmCurriculum2567.categories.freeElective.minCredits} หน่วยกิต (${dtmCurriculum2567.categories.freeElective.description})
- กลุ่มวิชาโทที่เปิดสอน: ${dtmCurriculum2567.minorsAvailable.join(', ')}
- แหล่งอ้างอิงหลักสูตรทางการ: เว็บไซต์สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์ (${dtmCurriculum2567.evidence.sourceUrl})

คำแนะนำสำคัญสำหรับการช่วยเรียนรู้รายวิชา DTM:
1. สำหรับข้อมูลภาพรวมหน่วยกิตและหมวดหมู่ด้านบน สามารถตอบและอ้างอิงได้ว่าเป็นข้อมูลทางการจากหลักสูตร DTM 2567 ม.วลัยลักษณ์
2. เมื่อผู้เรียนเริ่มเรียนรู้รายวิชาในหลักสูตร (เช่น ศัพท์เทคนิคทางการแพทย์, เวชระเบียนศาสตร์, สารสนเทศสุขภาพ, ระบบฐานข้อมูลการแพทย์, AI ทางการแพทย์, สัญญาณชีวการแพทย์):
   - หากมีเอกสารที่อัปโหลดไว้ ให้ตอบตามเอกสารต้นฉบับอย่างเคร่งครัด
   - หากไม่มีเอกสารประกอบการสอนของวิชานั้น ให้ปูพื้นฐานแนวคิดทางวิชาการและศัพท์เทคนิคภาษาอังกฤษจากความรู้ทั่วไปทางวิทยาศาสตร์และเทคโนโลยีดิจิทัลทางการแพทย์ โดยระบุอย่างชัดเจนว่าเป็น "คำอธิบายแนวคิดพื้นฐานทั่วไปตามหัวข้อวิชา มิใช่คำอธิบายรายวิชาอย่างเป็นทางการจากเล่มหลักสูตร มคอ.2"
3. ห้ามกุคำอธิบายรายวิชาทางการ วัตถุประสงค์รายวิชา (CLO/PLO) หรือเกณฑ์การให้คะแนนที่ไม่มีในเอกสารอ้างอิง
4. แยกแยะความรู้ทั่วไปเพื่อการเรียนรู้ออกจากข้อเท็จจริงที่มีเอกสารหรือหลักสูตรทางการรับรองอย่างชัดเจน`;

  if (courseContext && typeof courseContext === 'object' && typeof courseContext.code === 'string') {
    systemInstruction += `\n\nบริบทรายวิชาที่ผู้เรียนกำลังศึกษา: รหัส ${courseContext.code} ชื่อ ${courseContext.titleThai || ''} (${courseContext.titleEnglish || ''})
หมายเหตุสำคัญ: บริบทรายวิชานี้เป็นเป้าหมายการเรียนรู้ของผู้เรียน ไม่ใช่เอกสารอ้างอิงหรือหลักฐานทางวิชาการ หากไม่มีเอกสารอัปโหลดใน documentContext ให้ปูพื้นฐานแนวคิดทางวิชาการและศัพท์เทคนิคภาษาอังกฤษจากความรู้ทั่วไปทางวิทยาศาสตร์และเทคโนโลยีดิจิทัลทางการแพทย์ โดยระบุอย่างชัดเจนว่าเป็นความรู้ทั่วไป และห้ามสร้างเลขหน้าหรืออ้างว่าเป็นคำอธิบายรายวิชาอย่างเป็นทางการ`;
  }

  const isDocumentGrounding = Boolean(
    searchMode !== 'web_search' &&
    documentContext &&
    typeof documentContext === 'object' &&
    Array.isArray(documentContext.chunks) &&
    documentContext.chunks.length > 0
  );

  // 1. If user explicitly selected 'document' mode, but no active document is provided or active document has no chunks
  if (searchMode === 'document' && !isDocumentGrounding) {
    return res.json({
      text: `*(แจ้งเตือน: ยังไม่ได้เลือกเอกสาร Active Document)*\n\nคุณกำลังใช้งาน **"โหมดติวอิงเอกสาร (Document Grounding)"** แต่ยังไม่ได้เลือกเอกสารในระบบ กรุณาไปที่แท็บ **"คลังเอกสาร (Document Library)"** และเลือกเอกสารที่ต้องการศึกษา แล้วคลิก **"ถามตอบเอกสารนี้"** หรือสลับเป็น **"ค้นหาเว็บ AI"** เพื่อค้นคว้าข้อมูลทั่วไป`,
      source: "academic_fallback",
      evidenceStatus: "insufficient",
      references: []
    });
  }

  const explicitDocRequest = searchMode !== 'web_search' && (
    latestPrompt.toLowerCase().includes('จากเอกสาร') ||
    latestPrompt.toLowerCase().includes('ในเอกสาร') ||
    latestPrompt.toLowerCase().includes('เอกสารนี้') ||
    latestPrompt.toLowerCase().includes('ตามเอกสาร') ||
    latestPrompt.toLowerCase().includes('อ้างอิงจาก') ||
    (/หน้า|page/i.test(latestPrompt) && !isDocumentGrounding)
  );

  if (!isDocumentGrounding && explicitDocRequest && searchMode !== 'web_search') {
    return res.json({
      text: `*(แจ้งเตือน: ยังไม่ได้เลือกเอกสาร Active Document)*\n\nกรุณาไปที่แท็บ **"คลังเอกสาร (Document Library)"** และเลือกเอกสารที่ต้องการ แล้วคลิก **"ถามตอบเอกสารนี้"** ก่อนเริ่มถามคำถามที่ต้องอ้างอิงเอกสาร เพื่อให้ระบบใช้โหมด Offline Document Grounding อย่างแม่นยำ`,
      source: "academic_fallback",
      evidenceStatus: "insufficient",
      references: []
    });
  }

  let preComputedRetrieval: any = null;
  let activeChunksForGrounding: any[] = [];

  // If document grounding context is attached, switch instruction to strict document grounding
  if (isDocumentGrounding) {
    activeChunksForGrounding = (documentContext.chunks || []).map((c: any, idx: number) => {
      const rawIdxStr = c.chunkIndex !== undefined && c.chunkIndex !== null ? String(c.chunkIndex) : String(idx + 1);
      const cleanIdxStr = cleanChunkLocator(rawIdxStr).replace(/^ชิ้นส่วนที่\s*/, '');
      const parsedIdx = parseInt(cleanIdxStr, 10);
      const validIdx = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : (idx + 1);
      return {
        id: `ctx-chunk-${idx + 1}`,
        documentId: 'doc-ctx',
        chunkIndex: validIdx,
        pageNumber: typeof c.pageNumber === 'number' ? c.pageNumber : (typeof c.pageNumber === 'string' ? parseInt(cleanChunkLocator(1, c.pageNumber).replace(/^หน้า\s*/, ''), 10) || undefined : undefined),
        hasNativePage: typeof c.pageNumber === 'number',
        text: decodeHtmlEntities(c.text || ''),
        charCount: (c.text || '').length
      };
    });

    const retrievalStart = Date.now();
    preComputedRetrieval = retrieveGroundedChunks(activeChunksForGrounding, latestPrompt, 4);
    const retrievalDuration = Date.now() - retrievalStart;
    console.log(`[Req ${requestId}] [Perf Pipeline] Retrieval step completed in ${retrievalDuration}ms. Found ${preComputedRetrieval.relevantChunks.length} relevant chunks (hasEvidence: ${preComputedRetrieval.hasEvidence}, maxScore: ${preComputedRetrieval.maxScore}).`);

    const isPageNumberQuery = (/(?:หน้า|page)\s*\d+/i.test(latestPrompt) || /หน้าเท่าไหร่|หน้าไหน|เปิดหน้า|ดูหน้า/i.test(latestPrompt)) && !/หน้าที่ของ/i.test(latestPrompt);
    const isUnpagedDocument = documentContext.hasNativePages === false || !documentContext.hasNativePages;

    if (isPageNumberQuery && isUnpagedDocument) {
      const shortCircuitText = `*(แจ้งเตือน: เอกสาร "${documentContext.title}" เป็นบันทึกสรุปที่ไม่มีเลขหน้าต้นฉบับ)*\n\nจากการตรวจสอบคำถามเกี่ยวกับการระบุเลขหน้า เนื่องจากเอกสารนี้ไม่มีเลขหน้าจริงในต้นฉบับ ระบบจึงไม่สามารถยืนยันหรือระบุเลขหน้าได้\n\n*(หมายเหตุ: ระบบเน้นตอบคำถามวิชาการจากเนื้อหาข้อความในเอกสารโดยตรงโดยไม่สามารถอ้างอิงเลขหน้าได้)*`;

      const verification = verifyAcademicAnswer({
        query: latestPrompt,
        candidateAnswer: shortCircuitText,
        document: {
          title: documentContext.title,
          hasNativePages: documentContext.hasNativePages,
          totalPages: documentContext.totalPages,
          chunks: activeChunksForGrounding
        },
        conversationHistory: validatedMessages
      });

      console.log(`[Perf Backend] Deterministic short-circuit executed for unpaged document page number query (0 API calls to Gemini).`);
      return res.json({
        text: shortCircuitText,
        source: "document_grounding",
        evidenceStatus: "insufficient",
        verification,
        references: []
      });
    }

    if (!preComputedRetrieval.hasEvidence || preComputedRetrieval.relevantChunks.length === 0) {
      if (searchMode === 'document') {
        console.log(`[Perf Backend] Document mode active and document has insufficient evidence for query "${latestPrompt}". Strictly refusing external search.`);
        const docTitle = decodeHtmlEntities(documentContext.title || 'เอกสารการเรียนรู้');
        const insufficientText = `*(ค้นหาจากเอกสาร: "${docTitle}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\n**ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ (Strict Document Grounding)**\n\nจากการตรวจสอบชิ้นส่วนเนื้อหาทั้งหมดในเอกสาร "${docTitle}" ไม่พบข้อความหรือข้อมูลที่ตอบประเด็น "${latestPrompt}" ได้โดยตรง เนื่องจากคุณกำลังใช้งาน **"โหมดติวอิงเอกสาร (Document Grounding)"** ระบบจึงไม่ค้นหาข้อมูลภายนอกมาปะปน หากต้องการค้นคว้าข้อมูลเพิ่มเติมจากอินเทอร์เน็ต กรุณาสลับโหมดเป็น **"ค้นหาเว็บ AI"**`;

        const verification = verifyAcademicAnswer({
          query: latestPrompt,
          candidateAnswer: insufficientText,
          document: {
            title: documentContext.title,
            hasNativePages: documentContext.hasNativePages,
            totalPages: documentContext.totalPages,
            chunks: activeChunksForGrounding
          },
          conversationHistory: validatedMessages
        });

        return res.json({
          text: insufficientText,
          source: "document_grounding",
          evidenceStatus: "insufficient",
          verification,
          references: []
        });
      }

      console.log(`[Perf Backend] Document has insufficient evidence for query "${latestPrompt}". Attempting External Academic Research Fallback with Google Search grounding...`);
      
      let isRateLimited = false;
      try {
        const researchPrompt = `ผู้ใช้กำลังศึกษาเอกสาร "${documentContext.title}" แต่เนื้อหาในเอกสารไม่มีข้อมูลเกี่ยวกับ: "${latestPrompt}". กรุณาค้นคว้าข้อมูลและอธิบายคำตอบทางวิชาการทางการแพทย์อย่างละเอียด (เช่น Flow Cytometry คืออะไร, FSC และ SSC ใช้บอกอะไร) เป็นภาษาไทยที่สุภาพ เข้าใจง่าย พร้อมอ้างอิงแหล่งข้อมูลภายนอกที่น่าเชื่อถือ`;
        
        const searchResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
          config: {
            systemInstruction: "คุณคือผู้ช่วยวิจัยวิชาการทางการแพทย์สำหรับ MedTech Learning Hub AI เมื่อเอกสารของผู้ใช้ไม่มีข้อมูล ให้ค้นคว้าจากแหล่งวิชาการภายนอกและให้ลิงก์อ้างอิงจริง",
            temperature: 0.2,
            tools: [{ googleSearch: {} }],
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW
            }
          }
        });

        const searchText = searchResponse.text;
        const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;
        const extReferences: Array<{ title: string; uri: string }> = [];

        if (groundingMetadata && groundingMetadata.groundingChunks) {
          for (const chunk of groundingMetadata.groundingChunks) {
            if (chunk.web && chunk.web.uri && chunk.web.title) {
              const uri = chunk.web.uri;
              if (uri.startsWith("http://") || uri.startsWith("https://")) {
                if (!extReferences.some(r => r.uri === uri)) {
                  extReferences.push({
                    title: chunk.web.title,
                    uri: uri,
                  });
                }
              }
            }
          }
        }

        if (searchText && extReferences.length > 0) {
          const formattedText = `*(หมายเหตุ: เอกสาร "${documentContext.title}" ไม่มีเนื้อหาเกี่ยวกับประเด็นนี้ ระบบจึงสืบค้นคว้าเพิ่มเติมจากแหล่งวิชาการภายนอกด้วย Google Search Grounding)*\n\n${searchText}`;
          
          const verification = verifyAcademicAnswer({
            query: latestPrompt,
            candidateAnswer: formattedText,
            document: {
              title: documentContext.title,
              hasNativePages: documentContext.hasNativePages,
              totalPages: documentContext.totalPages,
              chunks: activeChunksForGrounding
            },
            conversationHistory: validatedMessages
          });
          verification.verdict = 'WARNING';
          verification.isVerified = false;

          return res.json({
            text: formattedText,
            source: "external_research",
            evidenceStatus: "external_research",
            verification,
            references: extReferences.map(r => ({
              ...r,
              type: "external_academic_link",
              linkAccessStatus: "verified_external",
              verificationStatus: "unverified",
              evidenceLocator: "External Academic Search",
              contentVersion: "1.2"
            }))
          });
        }
      } catch (searchErr: any) {
        if (
          searchErr?.status === 429 || 
          searchErr?.status === 'RESOURCE_EXHAUSTED' || 
          searchErr?.message?.includes('429') || 
          searchErr?.message?.includes('quota') ||
          searchErr?.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          isRateLimited = true;
        }
        console.warn(`[Perf Backend] External academic research fallback search failed (Rate Limit / Quota):`, searchErr?.message);
      }

      const insufficientText = `*(ค้นหาจากเอกสาร: "${documentContext.title}"${documentContext.courseCode ? ` รหัสวิชา ${documentContext.courseCode}` : ''})*\n\n**ไม่พบข้อมูลที่ตรงกับคำถามในเอกสารนี้ และไม่สามารถสืบค้นจากแหล่งภายนอกได้ชั่วคราว ${isRateLimited ? '(API Quota Exceeded / HTTP 429)' : '(Strict Anti-Hallucination)'}**\n\nจากการตรวจสอบชิ้นส่วนเนื้อหาทั้งหมดในเอกสาร "${documentContext.title}" ไม่พบข้อความหรือข้อมูลที่ตอบประเด็น "${latestPrompt}" ได้โดยตรง ${isRateLimited ? 'และการสืบค้นภายนอกถูกจำกัดโควตาชั่วคราว (HTTP 429 Rate Limit)' : 'และการสืบค้นภายนอกไม่พบแหล่งอ้างอิงที่ยืนยันได้'} ระบบจึงปฏิเสธการตอบเพื่อรักษาความถูกต้องทางวิชาการ`;

      const verification = verifyAcademicAnswer({
        query: latestPrompt,
        candidateAnswer: insufficientText,
        document: {
          title: documentContext.title,
          hasNativePages: documentContext.hasNativePages,
          totalPages: documentContext.totalPages,
          chunks: activeChunksForGrounding
        },
        conversationHistory: validatedMessages
      });
      verification.verdict = 'INSUFFICIENT_EVIDENCE';
      verification.isVerified = false;

      return res.json({
        text: insufficientText,
        source: "document_grounding",
        evidenceStatus: "insufficient",
        verification,
        references: []
      });
    }

    const formattedChunks = preComputedRetrieval.relevantChunks
      .map((c: any) => `[ส่วนอ้างอิง: ชิ้นส่วนที่ ${c.chunkIndex}${c.pageNumber ? ` | หน้า ${c.pageNumber}` : ''}]:\n${c.text}`)
      .join('\n\n');

    systemInstruction = `คุณคือผู้ช่วย AI สรุปและตอบคำถามเชิงวิชาการจากเอกสารการเรียนรู้ (Document-Grounded Learning Assistant) สำหรับ MedTech Learning Hub AI
คุณกำลังช่วยผู้ใช้ศึกษาเนื้อหาจากเอกสาร: "${documentContext.title || 'เอกสารการเรียนรู้'}" ${documentContext.courseCode ? `(เชื่อมโยงรายวิชา: ${documentContext.courseCode})` : ''}

=== เนื้อหาเอกสารอ้างอิงที่แนบมา (Document Grounding Context) ===
${formattedChunks}
=============================================================

กฎเหล็กในการตอบคำถามอย่างเคร่งครัด (Strict Anti-Hallucination & Document Grounding):
1. ให้ตอบคำถามโดยอ้างอิงข้อมูลจาก "เนื้อหาเอกสารอ้างอิง" ด้านบนเป็นหลัก
2. ระบุหมายเลขหน้าหรือส่วนอ้างอิง เช่น "[หน้า 2]" หรือ "[ส่วนที่ 1]" ทุกครั้งที่มีการอ้างอิงเนื้อหาจากเอกสาร ห้ามแต่งเลขหน้าขึ้นมาเองเด็ดขาด
3. หากเนื้อหาในเอกสารที่แนบมาไม่มีคำตอบ หรือข้อมูลไม่เพียงพอที่จะตอบประเด็น ให้ตอบอย่างตรงไปตรงมาว่า "จากเอกสารที่ระบุ ไม่พบข้อมูลเกี่ยวกับเรื่องนี้" ห้ามแต่งข้อมูล คาดเดา หรือยกข้อมูลภายนอกมาตอบเด็ดขาด
4. ตอบด้วยภาษาไทยที่สุภาพ ชัดเจน เข้าใจง่าย และคงศัพท์ภาษาอังกฤษทางวิชาการและเทคนิคการแพทย์ไว้
5. ห้ามใส่ข้อความอ้างอิงแบบอินไลน์ เช่น [ส่วนอ้างอิง ...] ไว้ในเนื้อหาคำตอบเด็ดขาด ให้ตอบด้วยภาษาเนื้อหาทางวิชาการอย่างเป็นธรรมชาติ และให้ระบบจัดการแสดงกล่องแหล่งอ้างอิงแยกต่างหากเอง`;
  }

  // Map validated messages to Gemini SDK contents format
  const contents = validatedMessages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  let attempt = 0;
  const maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts;
  let lastError: any = null;
  let totalApiDuration = 0;
  let lastRetryDelayMs: number | undefined = undefined;

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStartTime = Date.now();
    const attemptAbortController = new AbortController();
    const attemptTimeoutTimer = setTimeout(() => {
      attemptAbortController.abort();
    }, DEFAULT_RETRY_CONFIG.attemptTimeoutMs || 12000);

    try {
      if (process.env.VITEST) {
        console.log(`[Req ${requestId}] [Perf Backend] Using Deterministic Offline Mock (VITEST mode) - attempt: ${attempt}/${maxAttempts}`);
      } else {
        console.log(`[Req ${requestId}] [Perf Backend] Calling Gemini API - attempt: ${attempt}/${maxAttempts}, model: gemini-3.8-flash, thinkingLevel: LOW`);
      }
      // In document grounding mode: DO NOT use googleSearch to prevent external dilution. Low temp for precision.
      let response: any;
      if (process.env.VITEST && customGeminiMock) {
        response = await customGeminiMock({ model: "gemini-3.8-flash", contents, systemInstruction, isDocumentGrounding });
      } else if (process.env.VITEST) {
        response = {
          text: "ผลลัพธ์จำลองออฟไลน์จาก Mock Gemini สำหรับการทดสอบ (Offline Mock Response)",
          candidates: [{
            groundingMetadata: {
              webSearchQueries: ["mock search query"],
              groundingChunks: [{ web: { uri: "https://who.int/guideline", title: "WHO Guideline" } }],
              groundingSupports: [{
                segment: { startIndex: 0, endIndex: 11, text: "ผลลัพธ์จำลอง" },
                groundingChunkIndices: [0]
              }]
            }
          }]
        };
      } else {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: isDocumentGrounding ? 0.1 : 0.3,
            maxOutputTokens: 2048,
            tools: isDocumentGrounding ? undefined : [{ googleSearch: {} }],
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW
            },
            abortSignal: attemptAbortController.signal
          },
        });
      }

      clearTimeout(attemptTimeoutTimer);
      const attemptDuration = Date.now() - attemptStartTime;
      totalApiDuration += attemptDuration;
      const totalBackendDuration = Date.now() - requestStartTime;

      console.log(formatRetryLog({
        requestId,
        attempt,
        maxAttempts,
        apiDurationMs: attemptDuration,
        finalOutcome: 'SUCCESS',
        totalBackendDurationMs: totalBackendDuration
      }));

      let text = response.text;
      if (!text) {
        throw new Error("ไม่ได้รับคำตอบจากโมเดล Gemini");
      }

      if (isDocumentGrounding) {
        text = text
          .replace(/\[ส่วนอ้างอิง[^\]]*\]/g, '')
          .replace(/\[chunk\s*\d+[^\]]*\]/gi, '')
          .replace(/\[ส่วนที่\s*\d+[^\]]*\]/gi, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      // If document grounding, build genuine document citations from actual chunks and verify academic answer
      if (isDocumentGrounding) {
        const verifyStart = Date.now();
        const verification = verifyAcademicAnswer({
          query: latestPrompt,
          candidateAnswer: text,
          document: {
            title: documentContext.title,
            hasNativePages: documentContext.hasNativePages,
            totalPages: documentContext.totalPages,
            chunks: activeChunksForGrounding
          },
          conversationHistory: validatedMessages
        });
        const verifyDuration = Date.now() - verifyStart;
        console.log(`[Req ${requestId}] [Perf Backend] Academic verification completed in ${verifyDuration}ms. Verdict: ${verification.verdict}`);

        const isInsufficient = text.includes("ไม่พบข้อมูล") || documentContext.evidenceStatus === 'insufficient' || verification.verdict === 'INSUFFICIENT_EVIDENCE' || !verification.stages.evidenceFidelity.passed || preComputedRetrieval.relevantChunks.length === 0;

        if (isInsufficient) {
          verification.verdict = 'INSUFFICIENT_EVIDENCE';
          verification.isVerified = false;
        }

        const docReferences = isInsufficient ? [] : preComputedRetrieval.relevantChunks.map((c: any) => {
          const decodedText = decodeHtmlEntities(c.text || '');
          const sectionTitle = getCleanSectionTitle(decodedText, c.chunkIndex);
          const excerpt = decodeHtmlEntities(extractRelevantExcerpt(decodedText, latestPrompt, 140));
          const finalLocator = cleanChunkLocator(c.chunkIndex, c.pageNumber);
          const cleanDocTitle = decodeHtmlEntities(documentContext.title || '');

          return {
            title: `เอกสาร: ${cleanDocTitle} — ${sectionTitle}`,
            uri: `#chunk-${c.chunkIndex}`,
            type: "document_chunk",
            linkAccessStatus: "verified_local",
            verificationStatus: verification.stages.evidenceFidelity.passed ? "source_grounded" : "unsupported_citation",
            evidenceLocator: finalLocator,
            excerpt,
            contentVersion: "1.2"
          };
        });

        return res.json({
          text,
          source: "document_grounding",
          evidenceStatus: isInsufficient ? "insufficient" : "sufficient",
          verification,
          references: docReferences,
        });
      }

      // Safely extract grounding metadata references for general search mode with robust index mapping and duplicate/filter handling
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const references: Array<{
        title: string;
        uri: string;
        sourceTier?: string;
        sourceTierLabel?: string;
        domain?: string;
        trustLevel?: string;
        warningNotice?: string;
        isAllowlistedAuthority?: boolean;
      }> = [];
      const originalToFilteredIndex = new Map<number, number>();

      if (groundingMetadata && groundingMetadata.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any, origIdx: number) => {
          if (chunk.web && chunk.web.uri && chunk.web.title) {
            const uri = chunk.web.uri.trim();
            const title = chunk.web.title.trim();
            if (title && (uri.startsWith("http://") || uri.startsWith("https://"))) {
              const existingIdx = references.findIndex(r => r.uri === uri);
              if (existingIdx !== -1) {
                originalToFilteredIndex.set(origIdx, existingIdx);
              } else {
                const classification = classifyMedicalSource(uri);
                const newIdx = references.length;
                references.push({
                  title: title,
                  uri: uri,
                  sourceTier: classification.tier,
                  sourceTierLabel: classification.tierLabel,
                  domain: classification.domain,
                  trustLevel: classification.trustLevel,
                  warningNotice: classification.warningNotice,
                  isAllowlistedAuthority: classification.isAllowlistedAuthority
                });
                originalToFilteredIndex.set(origIdx, newIdx);
              }
            }
          }
        });
      }

      const hasGrounding = references.length > 0;
      const mappingResult = hasGrounding
        ? mapGroundingSegments(text, groundingMetadata?.groundingSupports, references.length, {
            chunkIndexMapping: originalToFilteredIndex
          })
        : undefined;

      return res.json({
        text,
        source: hasGrounding ? "gemini_grounding" : "gemini_standard",
        webGrounding: hasGrounding ? {
          webSearchQueries: groundingMetadata?.webSearchQueries || [],
          searchEntryPointHtml: groundingMetadata?.searchEntryPoint?.renderedContent || undefined,
          linkageStatus: mappingResult?.linkageStatus || 'missing_metadata',
          segments: mappingResult?.segments || [],
          supportedClaimCount: mappingResult?.supportedSegmentCount || 0,
          unsupportedClaimCount: mappingResult?.unsupportedSegmentCount || 0
        } : undefined,
        references: hasGrounding ? references.map(r => ({ 
          ...r, 
          type: "web_search",
          linkAccessStatus: "unknown",
          verificationStatus: "unverified",
          reviewer: null,
          reviewDate: null,
          evidenceLocator: null,
          contentVersion: "1.2"
        })) : undefined,
      });
    } catch (err: any) {
      clearTimeout(attemptTimeoutTimer);
      const attemptDuration = Date.now() - attemptStartTime;
      totalApiDuration += attemptDuration;
      lastError = err;
      const totalBackendDuration = Date.now() - requestStartTime;

      const classification = classifyGeminiError(err);
      const canRetry = classification.shouldRetry && attempt < maxAttempts;

      if (!canRetry) {
        console.warn(formatRetryLog({
          requestId,
          attempt,
          maxAttempts,
          apiDurationMs: attemptDuration,
          status: classification.status,
          reason: classification.reason,
          finalOutcome: 'FALLBACK_ACADEMIC',
          totalBackendDurationMs: totalBackendDuration
        }));
        break;
      }

      const retryDelay = calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG);
      lastRetryDelayMs = retryDelay;

      console.warn(formatRetryLog({
        requestId,
        attempt,
        maxAttempts,
        apiDurationMs: attemptDuration,
        retryDelayMs: retryDelay,
        status: classification.status,
        reason: classification.reason,
        finalOutcome: 'RETRYING',
        totalBackendDurationMs: totalBackendDuration
      }));

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  const totalBackendDuration = Date.now() - requestStartTime;
  console.warn(formatRetryLog({
    requestId,
    attempt,
    maxAttempts,
    apiDurationMs: totalApiDuration,
    retryDelayMs: lastRetryDelayMs,
    status: lastError ? classifyGeminiError(lastError).status : undefined,
    reason: lastError ? classifyGeminiError(lastError).reason : undefined,
    finalOutcome: 'FALLBACK_ACADEMIC',
    totalBackendDurationMs: totalBackendDuration
  }));

  // Fallback to academic responses when API quota is exhausted or unavailable (using latestPrompt, validatedMessages, and guarded documentContext)
  const fallback = getAcademicFallback(latestPrompt, validatedMessages, isDocumentGrounding ? documentContext : null);

  let serviceNoticeText = "";
  if (lastError) {
    const is503OrUnavailable =
      lastError.message?.includes("503") ||
      lastError.message?.includes("UNAVAILABLE") ||
      lastError.message?.includes("overloaded");
    if (isDocumentGrounding) {
      serviceNoticeText = is503OrUnavailable
        ? `*(แจ้งเตือน: บริการ Gemini AI มีผู้ใช้งานหนาแน่นชั่วคราว (HTTP 503) — ระบบดึงคำตอบวิชาการที่ผ่านการตรวจสอบจากเอกสารที่เลือกให้โดยอัตโนมัติ)*\n\n`
        : `*(แจ้งเตือน: ไม่สามารถเชื่อมต่อบริการ Gemini AI ได้ชั่วคราว — ระบบดึงคำตอบวิชาการที่ผ่านการตรวจสอบจากเอกสารที่เลือกให้โดยอัตโนมัติ)*\n\n`;
    } else {
      serviceNoticeText = is503OrUnavailable
        ? `*(แจ้งเตือน: บริการ Gemini AI มีผู้ใช้งานหนาแน่นชั่วคราว (HTTP 503) — ระบบแสดงข้อมูลวิชาการสำรองจากคลังความรู้พื้นฐาน MedTech Hub โดยไม่ได้เชื่อมต่อค้นหาเว็บสดหรืออ้างอิงเอกสารเฉพาะ)*\n\n`
        : `*(แจ้งเตือน: ไม่สามารถเชื่อมต่อบริการ Gemini AI ได้ชั่วคราว — ระบบแสดงข้อมูลวิชาการสำรองจากคลังความรู้พื้นฐาน MedTech Hub โดยไม่ได้เชื่อมต่อค้นหาเว็บสดหรืออ้างอิงเอกสารเฉพาะ)*\n\n`;
    }
  }

  const responseText = serviceNoticeText ? `${serviceNoticeText}${fallback.text}` : fallback.text;

  return res.json({
    text: responseText,
    source: "academic_fallback", // Critical: MUST remain 'academic_fallback' (never misrepresent fallback as Gemini generation)
    evidenceStatus: (fallback as any).evidenceStatus || (isDocumentGrounding ? "sufficient" : undefined),
    verification: (fallback as any).verification,
    serviceStatus: {
      isApiUnavailable: true,
      lastErrorStatus: lastError ? classifyGeminiError(lastError).status : undefined,
      reason: lastError ? classifyGeminiError(lastError).reason : undefined,
      attemptsRun: attempt,
      servedMode: "academic_fallback"
    },
    references: fallback.references.map(r => ({
      ...r,
      type: isDocumentGrounding ? "document_chunk" : "external_academic_link",
      linkAccessStatus: isDocumentGrounding ? "verified_local" : "unknown",
      verificationStatus: isDocumentGrounding
        ? (r.verificationStatus || ((fallback as any).verification?.stages?.evidenceFidelity?.passed ? "source_grounded" : "unsupported_citation"))
        : "unverified",
      reviewer: isDocumentGrounding ? "Academic Verifier v1.2" : null,
      reviewDate: isDocumentGrounding ? new Date().toISOString() : null,
      evidenceLocator: isDocumentGrounding ? ((r as any).evidenceLocator || (documentContext?.title ? `เอกสาร: ${decodeHtmlEntities(documentContext.title)}` : "ชิ้นส่วนเอกสารต้นทาง")) : null,
      contentVersion: "1.2"
    })),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
  // 5 minutes socket timeout for long-running AI inference calls (~65s+)
  server.setTimeout(300000);
  server.keepAliveTimeout = 320000;
  server.headersTimeout = 330000;
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer();
}

export { app };
