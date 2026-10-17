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

    it('should correctly mark INSUFFICIENT_EVIDENCE when document lacks relevant evidence', () => {
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
      expect(result.verification?.isVerified).toBe(true);
      expect(result.verification?.stages.answerFidelity.status).toBe('insufficient_evidence');
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
});
