import { describe, it, expect } from 'vitest';
import { OFFICIAL_COURSES_2567 } from './curriculumData';
import {
  DTM_LEARNING_GUIDES,
  DTM_LEARNING_GUIDE_DISCLAIMER,
  getDtmLearningGuide,
  hasDtmLearningGuide,
  getAvailableLearningGuideCourseCodes
} from './dtmLearningGuides';
import { verifyAcademicAnswer } from '../lib/academicVerifier';
import { retrieveGroundedChunks } from '../lib/documentChunker';
import { DocumentChunk } from '../models/coreModel';

describe('DTM Learning Map MVP — Course-to-Actual-Learning Verification', () => {
  const supportedCourseCodes = ['DTM67-111', 'DTM67-123', 'DTM67-212'];

  it('1. ทุกชุดคู่มืออ้างอิงรายวิชาที่มีอยู่จริงใน OFFICIAL_COURSES_2567', () => {
    const guideKeys = Object.keys(DTM_LEARNING_GUIDES);
    expect(guideKeys).toEqual(expect.arrayContaining(supportedCourseCodes));
    expect(guideKeys.length).toBe(3);

    for (const code of guideKeys) {
      const course = OFFICIAL_COURSES_2567.find((c) => c.code === code);
      expect(course).toBeDefined();
      expect(course?.code).toBe(code);
    }
  });

  it('2. ข้อมูลวิชาที่อ้างอิงตรงกับ curriculum data ในทุกฟิลด์สำคัญ', () => {
    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code);
      const course = OFFICIAL_COURSES_2567.find((c) => c.code === code);
      expect(guide).toBeDefined();
      expect(course).toBeDefined();

      expect(guide?.courseCode).toBe(course?.code);
      // Evidence in course must be verified
      expect(course?.verificationStatus).toBe('verified');
      // No fake academic year or semester asserted on course item
      expect(course?.year).toBeUndefined();
      expect(course?.semester).toBeUndefined();
    }
  });

  it('3. แต่ละคู่มือมีข้อความ Disclaimer บังคับเพื่อแยกความรู้ทั่วไปออกจากคำอธิบายทางการ', () => {
    const expectedDisclaimer =
      'คู่มือปูพื้นฐานเพื่อการเรียนรู้ — จัดทำจากความรู้ทั่วไปตามหัวข้อที่เกี่ยวข้อง ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการ และยังไม่ได้ยืนยันว่าเป็นเนื้อหาการสอนทั้งหมดของรายวิชานี้';

    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code);
      expect(guide?.disclaimer).toBe(expectedDisclaimer);
      expect(guide?.disclaimer).toBe(DTM_LEARNING_GUIDE_DISCLAIMER);
      expect(guide?.sourceStatus.guideType).toBe('general_knowledge_learning_guide');
      expect(guide?.sourceStatus.officialDescriptionAvailable).toBe(false);
      expect(guide?.sourceStatus.hasPrimarySyllabusDocument).toBe(false);
      expect(guide?.sourceStatus.academicYearConfirmed).toBe(false);
    }
  });

  it('4. ปลอดการแต่งเติม Citation หรือ DOI หรือเลขหน้าที่ไม่มีอยู่จริง', () => {
    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code);
      expect(guide).toBeDefined();

      // Ensure no fake URLs or fake DOIs exist in guide contents
      const guideString = JSON.stringify(guide);
      expect(guideString).not.toMatch(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/); // No DOIs
      expect(guideString).not.toContain('http://fake');
      expect(guideString).not.toContain('https://fake');
      expect(guideString).not.toContain('CLO');
      expect(guideString).not.toContain('PLO');
    }
  });

  it('5. มี Key Concepts, Technical Vocabulary, และ Review Questions ครบตามเกณฑ์', () => {
    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code)!;

      // 4-6 Key Concepts
      expect(guide.keyConcepts.length).toBeGreaterThanOrEqual(4);
      expect(guide.keyConcepts.length).toBeLessThanOrEqual(6);
      guide.keyConcepts.forEach((kc, i) => {
        expect(kc.order).toBe(i + 1);
        expect(kc.title).toBeTruthy();
        expect(kc.summary).toBeTruthy();
        expect(kc.explanation).toBeTruthy();
        expect(kc.suggestedChatPrompt).toBeTruthy();
      });

      // Technical Vocabulary with English, Thai, explanation, and DTM context
      expect(guide.technicalVocabulary.length).toBeGreaterThanOrEqual(4);
      guide.technicalVocabulary.forEach((vocab) => {
        expect(vocab.termEn).toBeTruthy();
        expect(vocab.termTh).toBeTruthy();
        expect(vocab.simpleExplanation).toBeTruthy();
        expect(vocab.dtmContextExample).toBeTruthy();
        expect(vocab.suggestedChatPrompt).toBeTruthy();
      });

      // Application examples
      expect(guide.applicationExamples.length).toBeGreaterThanOrEqual(2);
      guide.applicationExamples.forEach((app) => {
        expect(app.title).toBeTruthy();
        expect(app.description).toBeTruthy();
        expect(app.realWorldScenario).toBeTruthy();
        expect(app.suggestedChatPrompt).toBeTruthy();
      });

      // 3-5 Review Questions with Answer and Rationale
      expect(guide.reviewQuestions.length).toBeGreaterThanOrEqual(3);
      expect(guide.reviewQuestions.length).toBeLessThanOrEqual(5);
      guide.reviewQuestions.forEach((q, i) => {
        expect(q.questionNumber).toBe(i + 1);
        expect(q.question).toBeTruthy();
        expect(q.answer).toBeTruthy();
        expect(q.rationale).toBeTruthy();
        expect(q.suggestedChatPrompt).toBeTruthy();
      });

      // Learning Pathway with explicit label that it is not official prerequisite
      expect(guide.learningPathway.prerequisiteSuggestions.length).toBeGreaterThan(0);
      expect(guide.learningPathway.subsequentSuggestions.length).toBeGreaterThan(0);
      expect(guide.learningPathway.labelNote).toContain('ไม่ใช่ prerequisite ทางการ');
    }
  });

  it('6. การค้นหาคู่มือคืนค่าตรงวิชา และคืนค่า undefined เมื่อวิชานั้นยังไม่มีคู่มือ (ห้ามนำวิชาอื่นมาแสดงแทนเงียบๆ)', () => {
    // Exact lookups
    expect(getDtmLearningGuide('DTM67-111')?.courseCode).toBe('DTM67-111');
    expect(getDtmLearningGuide('DTM67-123')?.courseCode).toBe('DTM67-123');
    expect(getDtmLearningGuide('DTM67-212')?.courseCode).toBe('DTM67-212');

    // Case insensitivity & trimming
    expect(getDtmLearningGuide(' dtm67-111 ')?.courseCode).toBe('DTM67-111');

    // Unprepared courses return undefined
    expect(getDtmLearningGuide('DTM67-331')).toBeUndefined();
    expect(hasDtmLearningGuide('DTM67-331')).toBe(false);
    expect(getDtmLearningGuide('GEN67-101')).toBeUndefined();
    expect(getDtmLearningGuide(undefined)).toBeUndefined();
    expect(getDtmLearningGuide('')).toBeUndefined();

    // Check available codes list
    const available = getAvailableLearningGuideCourseCodes();
    expect(available).toEqual(['DTM67-111', 'DTM67-123', 'DTM67-212']);
  });

  it('7. Prompt ที่เตรียมไว้สำหรับปุ่มถามต่อใน Chat เป็นคำถามชัดเจนและไม่เรียก API อัตโนมัติ', () => {
    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code)!;
      for (const concept of guide.keyConcepts) {
        expect(concept.suggestedChatPrompt.length).toBeGreaterThan(10);
        expect(concept.suggestedChatPrompt).not.toContain('[object Object]');
      }
      for (const vocab of guide.technicalVocabulary) {
        expect(vocab.suggestedChatPrompt.length).toBeGreaterThan(10);
      }
      for (const q of guide.reviewQuestions) {
        expect(q.suggestedChatPrompt.length).toBeGreaterThan(10);
      }
    }
  });

  it('8. Academic Verifier และ Document Grounding ไม่เปลี่ยนพฤติกรรมจากการเพิ่ม Learning Guide', () => {
    // Test that retrieveGroundedChunks still operates as an isolated grounding validator
    const sampleChunks: DocumentChunk[] = [
      {
        id: 'chunk-1',
        documentId: 'doc-1',
        chunkIndex: 0,
        pageNumber: 1,
        hasNativePage: true,
        text: 'ค่าปกติของ Hemoglobin ในผู้ชายคือ 13.0 - 17.5 g/dL และในผู้หญิงคือ 12.0 - 15.5 g/dL',
        charCount: 80
      }
    ];

    const result = retrieveGroundedChunks(sampleChunks, 'ค่า Hemoglobin ปกติ', 3);
    expect(result.hasEvidence).toBe(true);
    expect(result.relevantChunks.length).toBe(1);
    expect(result.relevantChunks[0].pageNumber).toBe(1);

    // Test that verifyAcademicAnswer continues to enforce strict grounding check
    const report = verifyAcademicAnswer({
      query: 'ค่าปกติของ Hemoglobin คือเท่าใด',
      candidateAnswer: 'ค่าปกติของ Hemoglobin ในผู้ชายคือ 13.0 - 17.5 g/dL ตามที่ระบุในหน้า 1',
      document: {
        title: 'CBC Reference',
        hasNativePages: true,
        totalPages: 5,
        chunks: sampleChunks
      }
    });

    expect(report.isVerified).toBe(true);
    expect(report.verdict).toBe('PASS');
    expect(report.stages.evidenceFidelity.citedPages).toContain(1);
  });

  it('9. ตรวจสอบความถูกต้องของรากศัพท์การแพทย์และขอบเขตวิชา DTM67-111, DTM67-123, DTM67-212', () => {
    const guide111 = getDtmLearningGuide('DTM67-111')!;
    const guide123 = getDtmLearningGuide('DTM67-123')!;
    const guide212 = getDtmLearningGuide('DTM67-212')!;

    // DTM67-111: Medical roots & affixes
    const text111 = JSON.stringify(guide111);
    expect(text111).toContain('Brady-');
    expect(text111).toContain('Hyper-');
    expect(text111).toContain('Cardi/o');
    expect(text111).toContain('Nephr/o');
    expect(text111).toContain('Hepat/o');
    expect(text111).toContain('-itis');
    expect(text111).toContain('-ectomy');
    expect(text111).toContain('Clinical NER'); // DTM relevance

    // DTM67-123: IoMT, Cloud/Edge, Health Data Privacy, Smart Hospital
    const text123 = JSON.stringify(guide123);
    expect(text123).toContain('IoMT');
    expect(text123).toContain('Edge Computing');
    expect(text123).toContain('Cloud Computing');
    expect(text123).toContain('PDPA');
    expect(text123).toContain('Smart Hospital');

    // DTM67-212: HIS, EMR/EHR, LIS, RIS/PACS, HL7 FHIR, DICOM
    const text212 = JSON.stringify(guide212);
    expect(text212).toContain('HIS');
    expect(text212).toContain('EMR');
    expect(text212).toContain('EHR');
    expect(text212).toContain('LIS');
    expect(text212).toContain('PACS');
    expect(text212).toContain('HL7 FHIR');
    expect(text212).toContain('DICOM');
  });

  it('10. คู่มือความรู้ทั่วไปไม่ถูกนำไปเป็น Document Grounding หรือ Citation โดยอัตโนมัติ', () => {
    // Learning guide data should not have document chunk IDs or physical PDF page citations
    for (const code of supportedCourseCodes) {
      const guide = getDtmLearningGuide(code)!;
      expect((guide as any).chunks).toBeUndefined();
      expect((guide as any).documentId).toBeUndefined();
      expect(guide.sourceStatus.guideType).toBe('general_knowledge_learning_guide');
    }
  });
});
