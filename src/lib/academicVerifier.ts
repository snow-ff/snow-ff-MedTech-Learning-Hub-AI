import { DocumentChunk, AcademicVerificationReport, AnswerFidelityStatus, VerificationVerdict } from '../models/coreModel';
import { retrieveGroundedChunks, GroundedRetrievalResult } from './documentChunker';

export interface VerificationOptions {
  query: string;
  candidateAnswer: string;
  document: {
    title: string;
    hasNativePages?: boolean;
    totalPages?: number;
    chunks: DocumentChunk[];
  };
  expectedEvidence?: {
    mustContainKeywords?: string[];
    contradictoryStatements?: string[];
    overgeneralizationKeywords?: string[];
    unsupportedFactKeywords?: string[];
  };
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
  priorTurnIncorrectPremises?: string[];
}

/**
 * Academic Answer Verification Engine (Track B1.4)
 * Deterministically evaluates academic answers across 4 distinct stages:
 * Stage A: Retrieval (Relevant evidence retrieval)
 * Stage B: Evidence Fidelity (Citations and genuine page numbers)
 * Stage C: Answer Fidelity (Alignment, contradiction detection, anti-hallucination)
 * Stage D: Reasoning Fidelity (Logic and multi-turn error propagation check)
 */
export function verifyAcademicAnswer(options: VerificationOptions): AcademicVerificationReport {
  const {
    query,
    candidateAnswer,
    document,
    expectedEvidence,
    conversationHistory,
    priorTurnIncorrectPremises
  } = options;

  const answerLower = candidateAnswer.toLowerCase();

  // =========================================================================
  // Stage A: Retrieval Verification
  // =========================================================================
  const retrieval: GroundedRetrievalResult = retrieveGroundedChunks(document.chunks, query, 4);
  let retrievalPassed = retrieval.hasEvidence && retrieval.relevantChunks.length > 0 && retrieval.maxScore >= 4;
  let retrievalDetails = retrievalPassed
    ? `สืบค้นพบหลักฐานที่เกี่ยวข้องจำนวน ${retrieval.relevantChunks.length} ชิ้นส่วน (คะแนนสูงสุด: ${retrieval.maxScore})`
    : 'ไม่พบหลักฐานที่ตรงกับข้อซักถามในเอกสาร';

  if (retrievalPassed && expectedEvidence?.mustContainKeywords) {
    const combinedChunkText = retrieval.relevantChunks.map(c => c.text.toLowerCase()).join(' ');
    const missing = expectedEvidence.mustContainKeywords.filter(k => !combinedChunkText.includes(k.toLowerCase()));
    if (missing.length > 0) {
      retrievalPassed = false;
      retrievalDetails += ` (แต่ขาดคำสำคัญที่จำเป็น: ${missing.join(', ')})`;
    }
  }

  // =========================================================================
  // Stage B: Evidence Fidelity (Citations and Page Numbers)
  // =========================================================================
  const unsupportedCitations: string[] = [];
  const citedPages: number[] = [];

  // Extract cited pages: e.g. "หน้า 2", "Page 3", "[ส่วนอ้างอิง: ชิ้นส่วนที่ 1 | หน้า 2]"
  const pageMatches = candidateAnswer.matchAll(/(?:หน้า|page)\s*(\d+)/gi);
  for (const match of pageMatches) {
    const pageNum = parseInt(match[1], 10);
    if (!isNaN(pageNum) && !citedPages.includes(pageNum)) {
      citedPages.push(pageNum);
    }
  }

  // Check 1: Fake pages on unpaged notes
  if (document.hasNativePages === false && citedPages.length > 0) {
    unsupportedCitations.push(
      `เอกสาร "${document.title}" เป็นบันทึกสรุป/โน้ตที่ไม่มีเลขหน้าจริง แต่คำตอบมีการแต่งเลขหน้า (${citedPages.map(p => `หน้า ${p}`).join(', ')}) ขึ้นมาเอง`
    );
  }

  // Check 2: Page numbers must exist in retrieved relevant chunks (not just anywhere in document)
  if (document.hasNativePages && citedPages.length > 0) {
    if (document.totalPages !== undefined && document.totalPages > 0) {
      const outOfBounds = citedPages.filter(p => p > document.totalPages!);
      if (outOfBounds.length > 0) {
        unsupportedCitations.push(
          `คำตอบอ้างอิงเลขหน้า ${outOfBounds.join(', ')} ซึ่งเกินจำนวนหน้าจริงของเอกสาร (${document.totalPages} หน้า)`
        );
      }
    }

    const retrievedPages = retrieval.relevantChunks
      .map(c => c.pageNumber)
      .filter((p): p is number => typeof p === 'number');
    
    const validCitedPages = citedPages.filter(p => document.totalPages === undefined || p <= document.totalPages);
    const unretrievedPages = validCitedPages.filter(p => !retrievedPages.includes(p));
    if (unretrievedPages.length > 0) {
      unsupportedCitations.push(
        `คำตอบอ้างอิงหน้า ${unretrievedPages.join(', ')} ซึ่งไม่อยู่ในชิ้นส่วนหลักฐานที่สืบค้นและนำมาอ้างอิง`
      );
    }
  }

  // Check 3: Cited chunk index must exist in retrieved relevant chunks
  // Handles duplicate citations and malformed formats by extracting unique valid integer indices
  const chunkMatches = Array.from(candidateAnswer.matchAll(/(?:ชิ้นส่วนที่|ส่วนอ้างอิง|chunk)\s*(\d+)/gi));
  const uniqueCitedChunkIndices = Array.from(new Set(chunkMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n))));
  const retrievedChunkIndices = retrieval.relevantChunks.map(c => c.chunkIndex);
  for (const chunkIdx of uniqueCitedChunkIndices) {
    const isRetrieved = retrievedChunkIndices.includes(chunkIdx);
    if (!isRetrieved) {
      unsupportedCitations.push(
        `คำตอบอ้างอิงชิ้นส่วนที่ ${chunkIdx} ซึ่งไม่ได้อยู่ในหลักฐานที่สืบค้นพบและเกี่ยวข้อง (${retrievedChunkIndices.join(', ')})`
      );
    }
  }

  // Check 3a: Strict Delimited Citation Format Validation
  // Detects citations specifically inside brackets [...] or explicit markers that intend to cite but lack valid numeric indices
  // Examples: "[ชิ้นส่วนที่ abc]", "[ส่วนอ้างอิง: ]", "[chunk null]", "[ชิ้นส่วนที่ undefined]", "[chunk: NaN]"
  // Strictly ignores normal Thai text (e.g. "ชิ้นส่วนที่นำมาตรวจ") and non-citation bracketed terms (e.g. "[CBC]", "[EDTA]")
  const malformedBracketMatches = Array.from(
    candidateAnswer.matchAll(/\[\s*(?:ชิ้นส่วนที่|ส่วนอ้างอิง|chunk)[\s:]*([^\]]*)\]/gi)
  );
  const seenMalformed = new Set<string>();

  for (const match of malformedBracketMatches) {
    const fullMatch = match[0];
    const innerContent = match[1] || '';
    // If the bracketed citation marker does NOT contain any valid digit, it is malformed
    if (!/\d+/.test(innerContent)) {
      const trimmed = fullMatch.trim();
      if (!seenMalformed.has(trimmed)) {
        seenMalformed.add(trimmed);
        unsupportedCitations.push(
          `รูปแบบการอ้างอิงผิดพลาด (Malformed Citation): พบ "${trimmed}" ซึ่งไม่ระบุหมายเลขชิ้นส่วนที่ถูกต้อง`
        );
      }
    }
  }

  // Also check for explicit invalid literal keywords (null, undefined, NaN) following a citation prefix even if unbracketed
  const explicitInvalidLiterals = Array.from(
    candidateAnswer.matchAll(/(?:ชิ้นส่วนที่|ส่วนอ้างอิง|chunk)[\s:]*(?:null|undefined|nan)\b/gi)
  );
  for (const match of explicitInvalidLiterals) {
    const trimmed = match[0].trim();
    if (!seenMalformed.has(trimmed)) {
      seenMalformed.add(trimmed);
      unsupportedCitations.push(
        `รูปแบบการอ้างอิงผิดพลาด (Malformed Citation): พบ "${trimmed}" ซึ่งมีค่าอ้างอิงไม่ถูกต้อง`
      );
    }
  }

  // Check 4: Cross-topic / Administrative notice chunk citation guard for terminology queries
  const isTerminologyQuery = /root|prefix|suffix|combining|รากศัพท์|คำอุปสรรค|ปัจจัยท้าย|สระเชื่อม/i.test(query);
  if (isTerminologyQuery) {
    for (const chunkIdx of uniqueCitedChunkIndices) {
      const targetChunk = document.chunks.find(c => (c.chunkIndex || 0) === chunkIdx);
      if (targetChunk && /notice of adaptation|non-endorsement|การให้เครดิตแหล่งข้อมูล/i.test(targetChunk.text)) {
        unsupportedCitations.push(
          `ชิ้นส่วนที่ ${chunkIdx} เป็นข้อความประกาศแจ้งเตือน/การให้เครดิต ไม่ใช่หลักฐานทางวิชาการที่สนับสนุนคำถามคำศัพท์ทางการแพทย์`
        );
      }
    }
  }

  const evidenceFidelityPassed = unsupportedCitations.length === 0;
  const evidenceFidelityDetails = evidenceFidelityPassed
    ? (citedPages.length > 0 ? `เลขหน้าและส่วนอ้างอิงถูกต้องตรงตามต้นฉบับ (${citedPages.map(p => `หน้า ${p}`).join(', ')})` : 'ไม่มีการแต่งเลขหน้าปลอมในเอกสารที่ไม่มีเลขหน้า')
    : `พบข้อผิดพลาดในการอ้างอิง: ${unsupportedCitations.join('; ')}`;

  // =========================================================================
  // Stage C: Answer Fidelity
  // =========================================================================
  let answerStatus: AnswerFidelityStatus = 'aligned';
  const contradictions: string[] = [];
  const unsupportedClaims: string[] = [];

  // Case 1: Insufficient Evidence
  if (!retrievalPassed) {
    const admitsNoEvidence =
      answerLower.includes('ไม่พบข้อมูล') ||
      answerLower.includes('ไม่มีข้อมูล') ||
      answerLower.includes('ไม่มีรายละเอียด') ||
      answerLower.includes('ไม่สามารถยืนยันได้') ||
      answerLower.includes('strict anti-hallucination');

    if (admitsNoEvidence) {
      answerStatus = 'insufficient_evidence';
    } else {
      answerStatus = 'hallucinated';
      unsupportedClaims.push('สร้างคำตอบยืนยันข้อเท็จจริง ทั้งที่เอกสารไม่มีหลักฐานรองรับ (Hallucination without evidence)');
    }
  } else {
    // Case 2: Contradiction Check
    if (expectedEvidence?.contradictoryStatements) {
      for (const statement of expectedEvidence.contradictoryStatements) {
        if (answerLower.includes(statement.toLowerCase())) {
          contradictions.push(`คำตอบระบุ "${statement}" ซึ่งขัดแย้งกับหลักฐานในเอกสาร`);
        }
      }
    }

    // Check specific numerical or categorical contradictions if found in answer
    if (contradictions.length > 0) {
      answerStatus = 'contradictory';
    } else if (expectedEvidence?.overgeneralizationKeywords) {
      // Case 3: Overgeneralization Check
      for (const overgen of expectedEvidence.overgeneralizationKeywords) {
        if (answerLower.includes(overgen.toLowerCase())) {
          unsupportedClaims.push(`คำตอบสรุปเหมารวมเกินหลักฐาน: "${overgen}"`);
        }
      }
      if (unsupportedClaims.length > 0) {
        answerStatus = 'overgeneralized';
      }
    }

    // Case 4: Extraneous / Unsupported Fact Keywords Check
    if (expectedEvidence?.unsupportedFactKeywords && answerStatus === 'aligned') {
      for (const fact of expectedEvidence.unsupportedFactKeywords) {
        if (answerLower.includes(fact.toLowerCase())) {
          unsupportedClaims.push(`คำตอบเพิ่มข้อเท็จจริงที่ไม่มีในเอกสาร: "${fact}"`);
        }
      }
      if (unsupportedClaims.length > 0) {
        answerStatus = 'hallucinated';
      }
    }

    // Case 5: Ungrounded technical term examples check for terminology queries
    const isTerminologyQuery = /root|prefix|suffix|combining|รากศัพท์|คำอุปสรรค|ปัจจัยท้าย|สระเชื่อม/i.test(query);
    if (isTerminologyQuery && answerStatus === 'aligned') {
      const combinedChunksText = retrieval.relevantChunks.map(c => c.text.toLowerCase()).join(' ');
      const technicalTerms = answerLower.match(/-[a-z]{3,}/g);
      if (technicalTerms) {
        for (const term of technicalTerms) {
          if (!combinedChunksText.includes(term)) {
            unsupportedClaims.push(`คำตอบอ้างอิงตัวอย่างศัพท์ (${term}) ซึ่งไม่ปรากฏในหลักฐานชิ้นส่วนเอกสารที่สืบค้นได้`);
          }
        }
        if (unsupportedClaims.length > 0) {
          answerStatus = 'hallucinated';
        }
      }
    }

    // Case 6: Multi-part query coverage check (e.g. Prefix and Suffix comparison)
    const asksPrefixAndSuffix = /prefix.*suffix|suffix.*prefix|ความแตกต่างระหว่าง.*prefix.*suffix/i.test(query) || (/prefix/i.test(query) && /suffix/i.test(query));
    if (asksPrefixAndSuffix && answerStatus === 'aligned') {
      const asksDefinitionOrFunction = /(?:คืออะไร|หมายถึง|นิยาม|หน้าที่|ความหมาย|ทำหน้าที่|อธิบายหน้าที่|อธิบายความหมาย)/i.test(query);

      // Evaluate per-chunk rather than concatenating all chunks into one string,
      // avoiding cross-chunk spanning where unrelated pieces are merged.
      let hasValidPrefixEvidence = false;
      let hasValidSuffixEvidence = false;

      for (const chunk of retrieval.relevantChunks) {
        const text = (chunk.text || '').toLowerCase();

        // Guard against notice / disclaimer chunks
        if (/notice of adaptation|non-endorsement|สงวนลิขสิทธิ์|disclaimer|ประกาศเตือน/i.test(text)) {
          continue;
        }

        // Clause splitting to check intra-sentence boundaries
        // Splits by newline, period, bullet, semicolon, Thai punctuation ฯ, ฯลฯ, or multiple spaces
        const clauses = text
          .split(/(?:\r?\n+|[.;|•\u2022]+|\s{2,}|ฯ(?:ลฯ)?)/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        // Check for genuine word parts composition definition strictly within a single clause
        const clauseHasComposition = clauses.some(cl =>
          /(?:คำศัพท์|ศัพท์เทคนิค|คำ|องค์ประกอบของคำ|โครงสร้างของคำ)(?:\s*ทางการแพทย์)?\s*(?:ประกอบด้วย|มีส่วนประกอบ|มีองค์ประกอบ|สร้างจาก)[^.!?;\n]*?(?:prefix|คำอุปสรรค)[^.!?;\n]*?(?:suffix|ปัจจัยท้าย)|(?:คำศัพท์|ศัพท์เทคนิค|คำ|องค์ประกอบของคำ|โครงสร้างของคำ)(?:\s*ทางการแพทย์)?\s*(?:ประกอบด้วย|มีส่วนประกอบ|มีองค์ประกอบ|สร้างจาก)[^.!?;\n]*?(?:suffix|ปัจจัยท้าย)[^.!?;\n]*?(?:prefix|คำอุปสรรค)/i.test(cl)
        );

        // Substantive definition / explanation of Prefix
        const hasPrefixDef =
          clauseHasComposition ||
          /(?:คำอุปสรรค|ส่วนนำหน้า|เติมหน้า|prefix)(?:\s*(?:\([^)]*\)|[*_`"'])*\s*[:\-–]?\s*(?:วางไว้ข้างหน้า|วางไว้หน้า|อยู่ข้างหน้า|อยู่หน้า|เติมหน้า|ส่วนนำหน้า|คือ|หมายถึง|ทำหน้าที่))/i.test(text) ||
          /\bprefix\b.*?\b(?:is|means|placed before|added to the front|affix attached to the beginning)\b/i.test(text);

        // Substantive definition / explanation of Suffix
        const hasSuffixDef =
          clauseHasComposition ||
          /(?:ปัจจัยท้าย|คำต่อท้าย|คำปัจจัย|ส่วนลงท้าย|เติมท้าย|suffix)(?:\s*(?:\([^)]*\)|[*_`"'])*\s*[:\-–]?\s*(?:วางไว้ข้างหลัง|วางไว้หลัง|อยู่ข้างหลัง|อยู่หลัง|อยู่ท้าย|เติมท้าย|ส่วนลงท้าย|คือ|หมายถึง|ทำหน้าที่))/i.test(text) ||
          /\bsuffix\b.*?\b(?:is|means|placed after|added to the end|affix attached to the end)\b/i.test(text);

        // Examples of Prefix
        const hasPrefixEx =
          /(?:brady|tachy|dys|sub|hyper|hypo|a|an|anti|pre|post|peri|epi)-|-(?:brady|tachy|dys|sub|hyper|hypo)\b/i.test(text) ||
          /(?:คำอุปสรรค|เติมหน้า|prefix)(?:\s*(?:\([^)]*\)\s*)?(?:เช่น|ได้แก่|ตัวอย่าง|\:|\-|\/))/i.test(text);

        // Examples of Suffix
        const hasSuffixEx =
          /-[a-z]{2,}\b/i.test(text) ||
          /(?:ปัจจัยท้าย|คำต่อท้าย|เติมท้าย|suffix)(?:\s*(?:\([^)]*\)\s*)?(?:เช่น|ได้แก่|ตัวอย่าง|\:|\-|\/))/i.test(text);

        if (asksDefinitionOrFunction) {
          if (hasPrefixDef) hasValidPrefixEvidence = true;
          if (hasSuffixDef) hasValidSuffixEvidence = true;
        } else {
          if (hasPrefixDef || hasPrefixEx) hasValidPrefixEvidence = true;
          if (hasSuffixDef || hasSuffixEx) hasValidSuffixEvidence = true;
        }
      }

      if (!hasValidPrefixEvidence || !hasValidSuffixEvidence) {
        answerStatus = 'overgeneralized';
        unsupportedClaims.push('คำถามต้องการคำอธิบายและหลักฐานเปรียบเทียบทั้ง Prefix และ Suffix แต่ชิ้นส่วนหลักฐานที่สืบค้นได้ครอบคลุมไม่ครบถ้วนทั้งสองส่วน');
      }
    }

    // Case 7: Heuristic Topic Mismatch / Insufficient Specific Evidence Check (Deterministic Heuristic, not NLI)
    const isSuffixQuery = /suffix|ปัจจัยท้าย|-scopy|-gram|-graphy|scopy|gram|graphy/i.test(query);
    const isPrefixQuery = /prefix|คำอุปสรรค/i.test(query);
    if ((isSuffixQuery || isPrefixQuery) && answerStatus === 'aligned') {
      const combinedChunksText = retrieval.relevantChunks.map(c => c.text.toLowerCase()).join(' ');
      const hasSuffixKeywords = /suffix|ปัจจัยท้าย|-scopy|-gram|-graphy|scopy|gram|graphy|itis|ectomy/i.test(combinedChunksText);
      const hasPrefixKeywords = /prefix|คำอุปสรรค|brady-|tachy-|dys-|sub-/i.test(combinedChunksText);

      // Check specific queried technical morphemes (e.g. -scopy, -gram)
      const queryTechnicalTerms = query.toLowerCase().match(/-[a-z]{3,}|[a-z]{3,}-/g) || [];
      const hasSpecificTermsIfQueried =
        queryTechnicalTerms.length === 0 ||
        queryTechnicalTerms.some(term => combinedChunksText.includes(term.toLowerCase()));

      if (isSuffixQuery && (!hasSuffixKeywords || !hasSpecificTermsIfQueried)) {
        answerStatus = 'hallucinated';
        unsupportedClaims.push('ชิ้นส่วนหลักฐานที่สืบค้นได้ไม่ครอบคลุมเนื้อหาเรื่อง Suffix ที่ระบุในคำถาม (Heuristic Topic Mismatch: ไม่พบคำสำคัญ Suffix ในหลักฐาน)');
      }
      if (isPrefixQuery && (!hasPrefixKeywords || !hasSpecificTermsIfQueried)) {
        answerStatus = 'hallucinated';
        unsupportedClaims.push('ชิ้นส่วนหลักฐานที่สืบค้นได้ไม่ครอบคลุมเนื้อหาเรื่อง Prefix ที่ระบุในคำถาม (Heuristic Topic Mismatch: ไม่พบคำสำคัญ Prefix ในหลักฐาน)');
      }
    }
  }

  const answerFidelityPassed = answerStatus === 'aligned' || answerStatus === 'insufficient_evidence';
  const answerFidelityDetails = answerFidelityPassed
    ? (answerStatus === 'insufficient_evidence' ? 'คำตอบยอมรับอย่างตรงไปตรงมาว่าเอกสารไม่มีข้อมูล (Strict Anti-Hallucination)' : 'คำตอบสอดคล้องกับหลักฐานในเอกสารอย่างถูกต้อง')
    : `พบข้อบกพร่องด้านความสัตย์ซื่อของคำตอบ: ${[...contradictions, ...unsupportedClaims].join('; ')}`;

  // =========================================================================
  // Stage D: Reasoning Fidelity
  // =========================================================================
  const logicalFlaws: string[] = [];
  let priorTurnPoisoningDetected = false;

  // Check multi-turn prior error propagation
  if (priorTurnIncorrectPremises && priorTurnIncorrectPremises.length > 0) {
    for (const falsePremise of priorTurnIncorrectPremises) {
      if (answerLower.includes(falsePremise.toLowerCase())) {
        priorTurnPoisoningDetected = true;
        logicalFlaws.push(`ตอบคำถามโดยสืบทอดข้อความที่ผิดพลาดจากรอบก่อนหน้า: "${falsePremise}"`);
      }
    }
  }

  // Also scan conversation history for model assistant turns containing known errors
  if (conversationHistory && conversationHistory.length > 0) {
    const priorAssistantMessages = conversationHistory.filter(m => m.role === 'model');
    for (const msg of priorAssistantMessages) {
      if (priorTurnIncorrectPremises) {
        for (const falsePremise of priorTurnIncorrectPremises) {
          if (msg.text.toLowerCase().includes(falsePremise.toLowerCase()) && answerLower.includes(falsePremise.toLowerCase())) {
            priorTurnPoisoningDetected = true;
          }
        }
      }
    }
  }

  const reasoningFidelityPassed = logicalFlaws.length === 0 && !priorTurnPoisoningDetected;
  const reasoningFidelityDetails = reasoningFidelityPassed
    ? 'การให้เหตุผลสมบูรณ์และไม่มีการสืบทอดความเข้าใจผิดจากรอบก่อนหน้า'
    : `พบข้อผิดพลาดเชิงตรรกะหรือการสืบทอดความผิดพลาด: ${logicalFlaws.join('; ')}`;

  // =========================================================================
  // Overall Verdict Determination
  // =========================================================================
  let verdict: VerificationVerdict = 'PASS';
  let isVerified = false;

  const isPageNumberQuery = /หน้า|page/i.test(query);
  const unpagedQueryWithoutPages = isPageNumberQuery && document.hasNativePages === false && citedPages.length === 0;

  if (answerStatus === 'insufficient_evidence') {
    verdict = 'INSUFFICIENT_EVIDENCE';
    isVerified = false; // Refusal/insufficient evidence is not a positive academic pass
  } else if (!retrievalPassed || !evidenceFidelityPassed || answerStatus === 'contradictory' || answerStatus === 'hallucinated' || !reasoningFidelityPassed) {
    verdict = 'FAIL';
    isVerified = false;
  } else if (answerStatus === 'overgeneralized' || unpagedQueryWithoutPages) {
    verdict = 'WARNING';
    isVerified = false;
  } else {
    verdict = 'PASS';
    isVerified = true;
  }

  const critiqueParts = [
    `[Stage A - Retrieval]: ${retrievalDetails}`,
    `[Stage B - Evidence Fidelity]: ${evidenceFidelityDetails}`,
    `[Stage C - Answer Fidelity]: ${answerFidelityDetails}`,
    `[Stage D - Reasoning Fidelity]: ${reasoningFidelityDetails}`
  ];

  return {
    isVerified,
    verdict,
    stages: {
      retrieval: {
        passed: retrievalPassed,
        relevantChunksCount: retrieval.relevantChunks.length,
        matchedKeywords: retrieval.matchedKeywords,
        details: retrievalDetails
      },
      evidenceFidelity: {
        passed: evidenceFidelityPassed,
        citedPages,
        unsupportedCitations,
        details: evidenceFidelityDetails
      },
      answerFidelity: {
        passed: answerFidelityPassed,
        status: answerStatus,
        contradictions,
        unsupportedClaims,
        details: answerFidelityDetails
      },
      reasoningFidelity: {
        passed: reasoningFidelityPassed,
        logicalFlaws,
        priorTurnPoisoningDetected,
        details: reasoningFidelityDetails
      }
    },
    critique: critiqueParts.join('\n')
  };
}
