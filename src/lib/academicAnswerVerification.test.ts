import { describe, it, expect } from 'vitest';
import { verifyAcademicAnswer } from './academicVerifier';
import { DocumentChunk } from '../models/coreModel';

describe('Track B1.4: Academic Answer Verification', () => {
  // Benchmark Document 1: Multi-page Clinical Hematology PDF (hasNativePages: true, 3 pages)
  const hematologyPdfDocument = {
    title: 'คู่มือปฏิบัติการโลหิตวิทยาคลินิก CBC 2026',
    hasNativePages: true,
    totalPages: 3,
    chunks: [
      {
        id: 'chunk-p1',
        documentId: 'doc-hema',
        chunkIndex: 1,
        pageNumber: 1,
        hasNativePage: true,
        text: 'Section 1: Complete Blood Count (CBC) and Blood Collection. Specimen collection requires a Lavender top tube containing K2-EDTA anticoagulant. Proper mixing by inverting 8-10 times prevents microclot formation. Hemolysis or clotting will cause sample rejection.',
        charCount: 250
      },
      {
        id: 'chunk-p2',
        documentId: 'doc-hema',
        chunkIndex: 2,
        pageNumber: 2,
        hasNativePage: true,
        text: 'Section 2: Adult Reference Ranges (WHO and ICSH standards). Hemoglobin (Hb): Male 13.0 - 17.5 g/dL, Female 12.0 - 15.5 g/dL. Hematocrit (Hct): Male 40 - 52%, Female 36 - 48%. Red Blood Cell (RBC) count: Male 4.5 - 5.9 x 10^6/uL, Female 4.0 - 5.2 x 10^6/uL.',
        charCount: 240
      },
      {
        id: 'chunk-p3',
        documentId: 'doc-hema',
        chunkIndex: 3,
        pageNumber: 3,
        hasNativePage: true,
        text: 'Section 3: White Blood Cell (WBC) Differential and Platelet Parameters. Normal total WBC count is 4,500 - 11,000 cells/uL with differential count of Neutrophils (50-70%) and Lymphocytes (20-40%). Normal Platelet count is 150,000 - 450,000 /uL.',
        charCount: 235
      }
    ] as DocumentChunk[]
  };

  // Benchmark Document 2: Unpaged Lecture Note (hasNativePages: false)
  const qcLectureNoteDocument = {
    title: 'สรุปการควบคุมคุณภาพห้องปฏิบัติการ (Westgard Rules)',
    hasNativePages: false,
    totalPages: undefined,
    chunks: [
      {
        id: 'chunk-qc1',
        documentId: 'doc-qc',
        chunkIndex: 1,
        pageNumber: undefined,
        hasNativePage: false,
        text: 'Westgard Multirule System: กฎ 1(2s) เป็น Warning rule เท่านั้น ห้องปฏิบัติการยังสามารถวิเคราะห์ตัวอย่างต่อได้ แต่กฎ 1(3s) และ R(4s) บ่งชี้ Random Error ต้องปฏิเสธผลการทดสอบ (Reject run) ทันที',
        charCount: 210
      }
    ] as DocumentChunk[]
  };

  // =========================================================================
  // Case 1: คำตอบตรงกับหลักฐาน (Answer aligns with evidence)
  // =========================================================================
  describe('Case 1: คำตอบตรงกับหลักฐาน (Answer aligns with evidence)', () => {
    it('should PASS all 4 stages when answer strictly adheres to evidence', () => {
      const result = verifyAcademicAnswer({
        query: 'ค่าปกติของฮีโมโกลบินในผู้ใหญ่เพศชายและหญิงคือเท่าไหร่',
        candidateAnswer: 'จากการสืบค้นในเอกสาร หน้า 2 ค่าปกติของฮีโมโกลบิน (Hb) ในเพศชายคือ 13.0 - 17.5 g/dL และเพศหญิงคือ 12.0 - 15.5 g/dL ตามเกณฑ์ของ WHO และ ICSH',
        document: hematologyPdfDocument,
        expectedEvidence: {
          mustContainKeywords: ['Hemoglobin', '13.0 - 17.5'],
          contradictoryStatements: ['10.0', '8.0']
        }
      });

      // Stage A: Retrieval
      expect(result.stages.retrieval.passed).toBe(true);
      expect(result.stages.retrieval.relevantChunksCount).toBeGreaterThan(0);

      // Stage B: Evidence fidelity
      expect(result.stages.evidenceFidelity.passed).toBe(true);
      expect(result.stages.evidenceFidelity.citedPages).toEqual([2]);
      expect(result.stages.evidenceFidelity.unsupportedCitations).toHaveLength(0);

      // Stage C: Answer fidelity
      expect(result.stages.answerFidelity.passed).toBe(true);
      expect(result.stages.answerFidelity.status).toBe('aligned');
      expect(result.stages.answerFidelity.contradictions).toHaveLength(0);

      // Stage D: Reasoning fidelity
      expect(result.stages.reasoningFidelity.passed).toBe(true);

      // Overall
      expect(result.verdict).toBe('PASS');
      expect(result.isVerified).toBe(true);
    });
  });

  // =========================================================================
  // Case 2: คำตอบมีบางส่วนถูก แต่สรุปเกินหลักฐาน (Overgeneralization)
  // =========================================================================
  describe('Case 2: คำตอบมีบางส่วนถูก แต่สรุปเกินหลักฐาน (Overgeneralization)', () => {
    it('should flag WARNING when answer extrapolates beyond evidence boundary', () => {
      const result = verifyAcademicAnswer({
        query: 'เกณฑ์ค่าอ้างอิงฮีโมโกลบินนี้ใช้กับใครได้บ้าง',
        candidateAnswer: 'ค่าฮีโมโกลบินชายคือ 13.0 - 17.5 g/dL และหญิงคือ 12.0 - 15.5 g/dL หน้า 2 ซึ่งสามารถใช้ได้กับทารกแรกเกิดและสัตว์ทุกชนิดโดยไม่มีข้อยกเว้น',
        document: hematologyPdfDocument,
        expectedEvidence: {
          overgeneralizationKeywords: ['ใช้ได้กับทารกแรกเกิดและสัตว์ทุกชนิดโดยไม่มีข้อยกเว้น']
        }
      });

      expect(result.stages.retrieval.passed).toBe(true);
      expect(result.stages.evidenceFidelity.passed).toBe(true);

      // Stage C should flag overgeneralization
      expect(result.stages.answerFidelity.status).toBe('overgeneralized');
      expect(result.stages.answerFidelity.unsupportedClaims.length).toBeGreaterThan(0);

      expect(result.verdict).toBe('WARNING');
      expect(result.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // Case 3: คำตอบขัดแย้งกับหลักฐาน (Contradiction)
  // =========================================================================
  describe('Case 3: คำตอบขัดแย้งกับหลักฐาน (Contradiction)', () => {
    it('should FAIL Stage C and overall verdict when answer contradicts evidence facts', () => {
      const result = verifyAcademicAnswer({
        query: 'การตรวจ CBC ต้องใช้หลอดเก็บตัวอย่างสีอะไร และถ้าค่าควบคุมหลุด 1(2s) ต้องทำอย่างไร',
        candidateAnswer: 'การตรวจ CBC ให้ใช้หลอดฝาสีแดง (Red top) หน้า 1 และหากค่าควบคุมหลุดกฎ 1(2s) ให้ปฏิเสธผลการทดสอบทันที (Reject run)',
        document: hematologyPdfDocument,
        expectedEvidence: {
          contradictoryStatements: [
            'หลอดฝาสีแดง',
            'ปฏิเสธผลการทดสอบทันที (Reject run)'
          ]
        }
      });

      expect(result.stages.answerFidelity.passed).toBe(false);
      expect(result.stages.answerFidelity.status).toBe('contradictory');
      expect(result.stages.answerFidelity.contradictions.length).toBeGreaterThan(0);

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // Case 4: คำตอบมีการเพิ่มข้อเท็จจริงที่ไม่มีในเอกสาร (Hallucination of Facts)
  // =========================================================================
  describe('Case 4: คำตอบมีการเพิ่มข้อเท็จจริงที่ไม่มีในเอกสาร (Hallucination)', () => {
    it('should FAIL Stage C when answer invents unsupported medical restrictions', () => {
      const result = verifyAcademicAnswer({
        query: 'การเจาะเลือดตรวจ CBC มีข้อห้ามใช้ยาตัวใดหรือไม่',
        candidateAnswer: 'การเจาะเลือด CBC หน้า 1 ต้องให้ผู้ป่วยหยุดยาแอสไพรินขนาด 300 mg เป็นเวลา 7 วันก่อนเจาะ และห้ามรับประทานยาสแตติน',
        document: hematologyPdfDocument,
        expectedEvidence: {
          unsupportedFactKeywords: ['หยุดยาแอสไพรินขนาด 300 mg', 'ยาสแตติน']
        }
      });

      expect(result.stages.answerFidelity.passed).toBe(false);
      expect(result.stages.answerFidelity.status).toBe('hallucinated');
      expect(result.stages.answerFidelity.unsupportedClaims.length).toBeGreaterThan(0);

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // Case 5: หลักฐานไม่เพียงพอ (Insufficient Evidence)
  // =========================================================================
  describe('Case 5: หลักฐานไม่เพียงพอ (Insufficient Evidence)', () => {
    it('should produce INSUFFICIENT_EVIDENCE verdict when candidate correctly refuses to answer', () => {
      const result = verifyAcademicAnswer({
        query: 'ทฤษฎีควอนตัมฟิสิกส์และแบบจำลองอะตอมของบอร์',
        candidateAnswer: 'จากการตรวจสอบเนื้อหาในเอกสาร ไม่พบข้อมูลหรือหลักฐานเกี่ยวกับทฤษฎีควอนตัมฟิสิกส์ ระบบจึงไม่สามารถตอบคำถามนี้ได้ (Strict Anti-Hallucination)',
        document: hematologyPdfDocument
      });

      expect(result.stages.retrieval.passed).toBe(false);
      expect(result.stages.answerFidelity.passed).toBe(true);
      expect(result.stages.answerFidelity.status).toBe('insufficient_evidence');

      expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isVerified).toBe(false);
    });

    it('should FAIL when candidate fabricates an answer despite insufficient evidence', () => {
      const result = verifyAcademicAnswer({
        query: 'ทฤษฎีควอนตัมฟิสิกส์และแบบจำลองอะตอมของบอร์',
        candidateAnswer: 'แบบจำลองอะตอมของบอร์อธิบายระดับชั้นพลังงานของอิเล็กตรอน หน้า 1',
        document: hematologyPdfDocument
      });

      expect(result.stages.retrieval.passed).toBe(false);
      expect(result.stages.answerFidelity.passed).toBe(false);
      expect(result.stages.answerFidelity.status).toBe('hallucinated');

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // Case 6: อ้างเลขหน้าหรือแหล่งที่ไม่ตรงกับหลักฐาน (Citation Mismatch)
  // =========================================================================
  describe('Case 6: อ้างเลขหน้าหรือแหล่งที่ไม่ตรงกับหลักฐาน (Citation Mismatch)', () => {
    it('should FAIL Stage B when inventing a page number for unpaged lecture note', () => {
      const result = verifyAcademicAnswer({
        query: 'กฎ 1(2s) ใน Westgard Multirule คืออะไร',
        candidateAnswer: 'กฎ 1(2s) ใน Westgard Multirule หน้า 4 ใช้เป็น Warning rule เท่านั้น',
        document: qcLectureNoteDocument
      });

      expect(result.stages.evidenceFidelity.passed).toBe(false);
      expect(result.stages.evidenceFidelity.unsupportedCitations.some(c => c.includes('ไม่มีเลขหน้าจริง'))).toBe(true);

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });

    it('should FAIL Stage B when citing an out-of-bounds page number', () => {
      const result = verifyAcademicAnswer({
        query: 'ค่าปกติของฮีโมโกลบิน',
        candidateAnswer: 'ค่าปกติของฮีโมโกลบินดูได้จาก หน้า 8',
        document: hematologyPdfDocument // only has 3 pages
      });

      expect(result.stages.evidenceFidelity.passed).toBe(false);
      expect(result.stages.evidenceFidelity.unsupportedCitations.some(c => c.includes('เกินจำนวนหน้าจริง'))).toBe(true);

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // Case 7: ถามต่อเนื่องโดยมีคำตอบก่อนหน้าที่ผิด (Prior Turn Error Propagation)
  // =========================================================================
  describe('Case 7: ถามต่อเนื่องโดยมีคำตอบก่อนหน้าที่ผิด (Prior Turn Error Propagation)', () => {
    const poisonedHistory: Array<{ role: 'user' | 'model'; text: string }> = [
      { role: 'user', text: 'หลอดสีแดงใช้สารกันเลือดแข็งอะไร' },
      { role: 'model', text: 'หลอดสีแดงบรรจุสาร K2-EDTA สำหรับตรวจ CBC' } // False premise from prior turn!
    ];

    it('should FAIL Stage D when answer inherits and propagates prior turn incorrect premise', () => {
      const result = verifyAcademicAnswer({
        query: 'แล้วการตรวจ CBC จากหลอดสีแดงที่ว่า ต้องกลับหลอดกี่ครั้ง',
        candidateAnswer: 'สำหรับหลอดสีแดงที่มีสาร K2-EDTA ให้กลับหลอด 8-10 ครั้ง หน้า 1',
        document: hematologyPdfDocument,
        conversationHistory: poisonedHistory,
        priorTurnIncorrectPremises: ['หลอดสีแดงที่มีสาร K2-EDTA']
      });

      expect(result.stages.reasoningFidelity.passed).toBe(false);
      expect(result.stages.reasoningFidelity.priorTurnPoisoningDetected).toBe(true);
      expect(result.stages.reasoningFidelity.logicalFlaws.length).toBeGreaterThan(0);

      expect(result.verdict).toBe('FAIL');
      expect(result.isVerified).toBe(false);
    });

    it('should PASS Stage D when answer corrects and grounds strictly back to verified evidence', () => {
      const result = verifyAcademicAnswer({
        query: 'แล้วการตรวจ CBC จากหลอดสีแดงที่ว่า ต้องกลับหลอดกี่ครั้ง',
        candidateAnswer: 'ตามเอกสารใน หน้า 1 หลอดที่บรรจุสาร K2-EDTA สำหรับ CBC ต้องเป็นหลอดฝาสีม่วง (Lavender top) ไม่ใช่หลอดสีแดง โดยต้องกลับหลอด 8-10 ครั้งเพื่อป้องกันการแข็งตัว',
        document: hematologyPdfDocument,
        conversationHistory: poisonedHistory,
        priorTurnIncorrectPremises: ['หลอดสีแดงที่มีสาร K2-EDTA']
      });

      expect(result.stages.retrieval.passed).toBe(true);
      expect(result.stages.reasoningFidelity.passed).toBe(true);
      expect(result.stages.reasoningFidelity.priorTurnPoisoningDetected).toBe(false);

      expect(result.verdict).toBe('PASS');
      expect(result.isVerified).toBe(true);
    });
  });

  // =========================================================================
  // Case 8: คำถามภาษาไทยที่อ้างถึงศัพท์เทคนิคภาษาอังกฤษ (Cross-lingual Technical Terminology)
  // =========================================================================
  describe('Case 8: คำถามภาษาไทยที่อ้างถึงศัพท์เทคนิคภาษาอังกฤษ (Cross-lingual)', () => {
    it('should PASS all stages when Thai query matches English medical terms and cites genuine source', () => {
      const result = verifyAcademicAnswer({
        query: 'การตรวจความสมบูรณ์ของเม็ดเลือด CBC และเกล็ดเลือด ต้องใช้หลอดสีอะไร',
        candidateAnswer: 'จากการสืบค้นในเอกสาร หน้า 1 การตรวจความสมบูรณ์ของเม็ดเลือด (Complete Blood Count: CBC) ต้องใช้หลอดฝาสีม่วง (Lavender top tube) ที่บรรจุสารกันเลือดแข็ง K2-EDTA',
        document: hematologyPdfDocument,
        expectedEvidence: {
          mustContainKeywords: ['Complete Blood Count', 'Lavender top tube']
        }
      });

      expect(result.stages.retrieval.passed).toBe(true);
      expect(result.stages.evidenceFidelity.passed).toBe(true);
      expect(result.stages.evidenceFidelity.citedPages).toEqual([1]);
      expect(result.stages.answerFidelity.passed).toBe(true);
      expect(result.stages.answerFidelity.status).toBe('aligned');
      expect(result.stages.reasoningFidelity.passed).toBe(true);

      expect(result.verdict).toBe('PASS');
      expect(result.isVerified).toBe(true);
    });
  });
});
