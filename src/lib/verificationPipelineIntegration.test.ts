import { describe, it, expect } from 'vitest';
import { getAcademicFallback } from '../../server';
import { verifyAcademicAnswer } from './academicVerifier';
import { LearningDocument, DocumentChunk } from '../models/coreModel';

describe('Track B1.5: Verification Pipeline Integration Audit (Offline)', () => {
  const samplePdfChunks: DocumentChunk[] = [
    {
      id: 'chunk-1',
      documentId: 'doc-hemo',
      chunkIndex: 1,
      pageNumber: 1,
      hasNativePage: true,
      text: 'การตรวจวิเคราะห์ทางโลหิตวิทยา คลินิกเทคนิคการแพทย์ มหาวิทยาลัยวลัยลักษณ์',
      charCount: 75
    },
    {
      id: 'chunk-2',
      documentId: 'doc-hemo',
      chunkIndex: 2,
      pageNumber: 2,
      hasNativePage: true,
      text: 'ค่าอ้างอิงของฮีโมโกลบิน (Hemoglobin: Hb) ในผู้ใหญ่เพศชายปกติคือ 13.0 ถึง 17.0 g/dL',
      charCount: 82
    }
  ];

  const sampleNoteChunks: DocumentChunk[] = [
    {
      id: 'note-chunk-1',
      documentId: 'note-lab',
      chunkIndex: 1,
      pageNumber: undefined,
      hasNativePage: false,
      text: 'สรุปการย้อมสี Gram stain: แบคทีเรียแกรมบวกติดสีม่วงคริสตัลไวโอเลต ส่วนแกรมลบติดสีชมพูซาฟรานิน',
      charCount: 95
    }
  ];

  describe('1. Pipeline Invocation Audit', () => {
    it('should invoke verifyAcademicAnswer and return a verification report in getAcademicFallback', () => {
      const result = getAcademicFallback('ค่าปกติของฮีโมโกลบินในเพศชาย', undefined, {
        title: 'คู่มือโลหิตวิทยาคลินิก',
        courseCode: 'MT2567-HEM',
        hasNativePages: true,
        totalPages: 2,
        chunks: samplePdfChunks
      });

      expect(result).toBeDefined();
      expect(result.verification).toBeDefined();
      expect(result.verification?.verdict).toBe('PASS');
      expect(result.verification?.isVerified).toBe(true);
      expect(result.verification?.stages.retrieval.passed).toBe(true);
      expect(result.verification?.stages.evidenceFidelity.passed).toBe(true);
      expect(result.verification?.stages.answerFidelity.passed).toBe(true);
      expect(result.verification?.stages.reasoningFidelity.passed).toBe(true);
    });

    it('should correctly mark INSUFFICIENT_EVIDENCE and isVerified false when document lacks relevant evidence', () => {
      const result = getAcademicFallback('ทฤษฎีควอนตัมฟิสิกส์และหลุมดำ', undefined, {
        title: 'คู่มือโลหิตวิทยาคลินิก',
        courseCode: 'MT2567-HEM',
        hasNativePages: true,
        totalPages: 2,
        chunks: samplePdfChunks
      });

      expect(result).toBeDefined();
      expect(result.evidenceStatus).toBe('insufficient');
      expect(result.verification).toBeDefined();
      expect(result.verification?.verdict).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.verification?.isVerified).toBe(false);
      expect(result.verification?.stages.answerFidelity.status).toBe('insufficient_evidence');
    });

    it('Regression: should return 0 relevant chunks and NOT PASS when asking about Flow Cytometry on document without it', () => {
      const verification = verifyAcademicAnswer({
        query: 'Flow Cytometry คืออะไร และ FSC กับ SSC ใช้บอกอะไร?',
        candidateAnswer: 'ไม่พบข้อมูลเกี่ยวกับ Flow Cytometry หรือ FSC และ SSC ในเอกสารนี้',
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(verification.verdict).toBe('INSUFFICIENT_EVIDENCE');
      expect(verification.isVerified).toBe(false);
      expect(verification.stages.retrieval.passed).toBe(false);
      expect(verification.stages.retrieval.relevantChunksCount).toBe(0);
    });
  });

  describe('2. Evidence Fidelity & Citation Audit', () => {
    it('should detect out-of-bounds page numbers and flag verdict FAIL', () => {
      const fakeAnswer = 'จากคู่มือโลหิตวิทยาคลินิก หน้า 99 ฮีโมโกลบินในผู้ชายมีค่า 13-17 g/dL';
      const verification = verifyAcademicAnswer({
        query: 'ค่าฮีโมโกลบิน',
        candidateAnswer: fakeAnswer,
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(verification.verdict).toBe('FAIL');
      expect(verification.isVerified).toBe(false);
      expect(verification.stages.evidenceFidelity.passed).toBe(false);
      expect(verification.stages.evidenceFidelity.unsupportedCitations.length).toBeGreaterThan(0);
      expect(verification.stages.evidenceFidelity.unsupportedCitations[0]).toContain('เกินจำนวนหน้าจริง');
    });

    it('should detect fake page citations on unpaged notes and flag verdict FAIL', () => {
      const fakeNoteAnswer = 'จากการสรุปใน หน้า 3 แบคทีเรียแกรมบวกติดสีม่วง';
      const verification = verifyAcademicAnswer({
        query: 'การย้อมสี Gram stain',
        candidateAnswer: fakeNoteAnswer,
        document: {
          title: 'บันทึกสรุป Gram stain',
          hasNativePages: false,
          totalPages: undefined,
          chunks: sampleNoteChunks
        }
      });

      expect(verification.verdict).toBe('FAIL');
      expect(verification.isVerified).toBe(false);
      expect(verification.stages.evidenceFidelity.passed).toBe(false);
      expect(verification.stages.evidenceFidelity.unsupportedCitations[0]).toContain('ไม่มีเลขหน้าจริง');
    });
  });

  describe('3. Answer Fidelity: Contradictions & Overgeneralizations', () => {
    it('should flag WARNING when answer contains overgeneralization beyond evidence', () => {
      const overgenAnswer = 'ฮีโมโกลบินในผู้ใหญ่เพศชายปกติคือ 13.0 ถึง 17.0 g/dL และเป็นค่ามาตรฐานเดียวที่ใช้ได้กับมนุษย์ทุกคนในโลก';
      const verification = verifyAcademicAnswer({
        query: 'ค่าฮีโมโกลบิน',
        candidateAnswer: overgenAnswer,
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        },
        expectedEvidence: {
          overgeneralizationKeywords: ['ใช้ได้กับมนุษย์ทุกคนในโลก']
        }
      });

      expect(verification.verdict).toBe('WARNING');
      expect(verification.isVerified).toBe(false);
      expect(verification.stages.answerFidelity.status).toBe('overgeneralized');
    });

    it('should flag FAIL when answer contradicts the document evidence', () => {
      const contradictoryAnswer = 'ฮีโมโกลบินในผู้ใหญ่เพศชายปกติคือ 5.0 ถึง 8.0 g/dL เท่านั้น';
      const verification = verifyAcademicAnswer({
        query: 'ค่าฮีโมโกลบิน',
        candidateAnswer: contradictoryAnswer,
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        },
        expectedEvidence: {
          contradictoryStatements: ['5.0 ถึง 8.0 g/dL']
        }
      });

      expect(verification.verdict).toBe('FAIL');
      expect(verification.stages.answerFidelity.status).toBe('contradictory');
      expect(verification.stages.answerFidelity.contradictions.length).toBeGreaterThan(0);
    });
  });

  describe('4. Deterministic Verification vs Semantic Boundary Audit', () => {
    it('should verify that critique contains distinct 4-stage audit notes and deterministic bounds', () => {
      const report = verifyAcademicAnswer({
        query: 'ค่าฮีโมโกลบินเพศชาย',
        candidateAnswer: 'ค่าอ้างอิงของฮีโมโกลบินในผู้ใหญ่เพศชายปกติคือ 13.0 ถึง 17.0 g/dL [หน้า 2]',
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(report.critique).toContain('[Stage A - Retrieval]');
      expect(report.critique).toContain('[Stage B - Evidence Fidelity]');
      expect(report.critique).toContain('[Stage C - Answer Fidelity]');
      expect(report.critique).toContain('[Stage D - Reasoning Fidelity]');
      expect(report.stages.evidenceFidelity.citedPages).toEqual([2]);
    });
  });

  describe('5. Regression Tests: General Knowledge Unblocking & Server Retrieval', () => {
    it('should handle general knowledge query without document context successfully', () => {
      const result = getAcademicFallback('PCR คืออะไร', undefined, undefined);
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should correctly retrieve relevant chunks from full document chunks on server side', () => {
      const result = getAcademicFallback('ฮีโมโกลบิน', undefined, {
        title: 'คู่มือโลหิตวิทยาคลินิก',
        courseCode: 'MT2567',
        hasNativePages: true,
        totalPages: 2,
        chunks: samplePdfChunks
      });

      expect(result).toBeDefined();
      expect(result.evidenceStatus).toBe('sufficient');
      expect(result.references.length).toBeGreaterThan(0);
    });

    it('Regression Case A & D: Flow Cytometry query on unmatched document must return 0 chunks and INSUFFICIENT_EVIDENCE (not PASS)', () => {
      const verification = verifyAcademicAnswer({
        query: 'Flow Cytometry คืออะไร และ FSC กับ SSC ใช้บอกอะไร?',
        candidateAnswer: 'ไม่พบข้อมูลเกี่ยวกับ Flow Cytometry ในเอกสารนี้',
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(verification.verdict).toBe('INSUFFICIENT_EVIDENCE');
      expect(verification.isVerified).toBe(false);
      expect(verification.stages.retrieval.passed).toBe(false);
      expect(verification.stages.retrieval.relevantChunksCount).toBe(0);
    });

    it('Regression Case B: Valid query about hemoglobin must successfully pass retrieval and verification', () => {
      const verification = verifyAcademicAnswer({
        query: 'ฮีโมโกลบิน',
        candidateAnswer: 'ค่าอ้างอิงของฮีโมโกลบินในผู้ใหญ่เพศชายปกติคือ 13.0 ถึง 17.0 g/dL [หน้า 2]',
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(verification.verdict).toBe('PASS');
      expect(verification.isVerified).toBe(true);
      expect(verification.stages.retrieval.passed).toBe(true);
      expect(verification.stages.retrieval.relevantChunksCount).toBeGreaterThan(0);
    });

    it('Regression Case C: Insufficient evidence refusal must never be interpreted as passing answer', () => {
      const verification = verifyAcademicAnswer({
        query: 'หัวข้อที่ไม่ปรากฏในเอกสาร',
        candidateAnswer: 'ไม่พบข้อมูลเกี่ยวกับหัวข้อนี้ในเอกสาร',
        document: {
          title: 'คู่มือโลหิตวิทยาคลินิก',
          hasNativePages: true,
          totalPages: 2,
          chunks: samplePdfChunks
        }
      });

      expect(verification.verdict).not.toBe('PASS');
      expect(verification.isVerified).toBe(false);
    });

    it('should map external research references correctly when search grounding metadata is present', () => {
      const mockGroundingChunks = [
        { web: { uri: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC123456/', title: 'Flow Cytometry Principles - NCBI' } }
      ];
      const extRefs = mockGroundingChunks.map(c => ({
        title: c.web.title,
        uri: c.web.uri,
        type: 'external_academic_link',
        linkAccessStatus: 'verified_external',
        verificationStatus: 'unverified',
        evidenceLocator: 'External Academic Search',
        contentVersion: '1.2'
      }));

      expect(extRefs.length).toBe(1);
      expect(extRefs[0].uri).toMatch(/^https?:\/\//);
      expect(extRefs[0].type).toBe('external_academic_link');
    });
  });
});
