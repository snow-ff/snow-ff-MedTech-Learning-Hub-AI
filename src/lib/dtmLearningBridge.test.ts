import { describe, it, expect } from 'vitest';
import { vocabularyList, getMockResponse } from '../App';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';
import { getAcademicFallback } from '../../server';
import { seedSampleDocumentsIfEmpty, clearAllDocuments } from './documentStorage';

describe('DTM Course-to-Chat Learning Bridge & Domain Realignment', () => {
  describe('1. Vocabulary & Domain Realignment (DTM-first)', () => {
    it('should include core Health Informatics and Medical Standards terms', () => {
      const terms = vocabularyList.map((v) => v.term);
      expect(terms.some((t) => t.includes('Electronic Health Record'))).toBe(true);
      expect(terms.some((t) => t.includes('HL7 FHIR'))).toBe(true);
      expect(terms.some((t) => t.includes('DICOM'))).toBe(true);
      expect(terms.some((t) => t.includes('PACS'))).toBe(true);
      expect(terms.some((t) => t.includes('ICD-10'))).toBe(true);
    });

    it('should include Medical AI and Data Engineering terms', () => {
      const terms = vocabularyList.map((v) => v.term);
      expect(terms.some((t) => t.includes('Convolutional Neural Network'))).toBe(true);
      expect(terms.some((t) => t.includes('U-Net'))).toBe(true);
      expect(terms.some((t) => t.includes('Biomedical Signal Processing'))).toBe(true);
    });

    it('should retain essential biomedical/lab terms without dropping them completely', () => {
      const terms = vocabularyList.map((v) => v.term);
      expect(terms.some((t) => t.includes('Complete Blood Count'))).toBe(true);
      expect(terms.some((t) => t.includes('Flow Cytometry'))).toBe(true);
      expect(terms.some((t) => t.includes('PCR'))).toBe(true);
    });

    it('should group vocabulary into distinct DTM-relevant categories', () => {
      const categories = new Set(vocabularyList.map((v) => v.category));
      expect(categories.has('Health Informatics')).toBe(true);
      expect(categories.has('Medical Standards')).toBe(true);
      expect(categories.has('Medical AI & Data')).toBe(true);
      expect(categories.has('Biomedical & Lab')).toBe(true);
    });
  });

  describe('2. Mock Response & Fallback Knowledge Guidance', () => {
    it('should provide DTM-specific responses for EHR/EMR queries', () => {
      const response = getMockResponse('EHR กับ EMR คืออะไร');
      expect(response).toContain('เวชระเบียนอิเล็กทรอนิกส์');
      expect(response).toContain('EHR');
    });

    it('should provide DICOM and PACS explanation in mock responses', () => {
      const response = getMockResponse('มาตรฐาน DICOM และระบบ PACS');
      expect(response).toContain('DICOM');
      expect(response).toContain('PACS');
      expect(response).toContain('ภาพถ่ายทางการแพทย์');
    });

    it('should provide HL7 FHIR explanation in mock responses', () => {
      const response = getMockResponse('HL7 FHIR ทำงานอย่างไร');
      expect(response).toContain('HL7 FHIR');
      expect(response).toContain('RESTful API');
    });

    it('should generate academic fallback with transparent disclaimer for course starter queries', () => {
      const starterPrompt = 'ฉันกำลังเริ่มเรียนรายวิชา DTM67-111 ศัพท์เทคนิคทางการแพทย์ ในหลักสูตร DTM 2567 ช่วยปูพื้นฐานหัวข้อที่เกี่ยวข้อง';
      const fallback = getAcademicFallback(starterPrompt);

      expect(fallback.text).toContain('แนวคิดพื้นฐานเพื่อการเรียนรู้รายวิชาในหลักสูตร DTM 2567');
      // Transparency disclaimer: must clearly distinguish general concepts from official syllabus
      expect(fallback.text).toContain('ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการจากเล่มหลักสูตร มคอ.2');
      expect(fallback.references.length).toBeGreaterThan(0);
    });

    it('should generate academic fallback for DTM informatics topics without documents', () => {
      const informaticsPrompt = 'ระบบสารสนเทศสุขภาพ HIS และเวชระเบียน EHR ทำงานอย่างไร';
      const fallback = getAcademicFallback(informaticsPrompt);

      expect(fallback.text).toContain('ระบบสารสนเทศสุขภาพและเวชระเบียนอิเล็กทรอนิกส์');
      expect(fallback.text).toContain('EMR');
      expect(fallback.text).toContain('EHR');
      expect(fallback.text).toContain('CDSS');
    });

    it('should generate academic fallback for medical standards (DICOM/PACS/FHIR)', () => {
      const standardsPrompt = 'มาตรฐานภาพถ่ายทางการแพทย์ DICOM และการเชื่อมต่อ PACS';
      const fallback = getAcademicFallback(standardsPrompt);

      expect(fallback.text).toContain('DICOM');
      expect(fallback.text).toContain('PACS');
      expect(fallback.text).toContain('Pixel Data');
    });
  });

  describe('3. Course Prepopulation & Official Course Integrity', () => {
    it('should verify official DTM courses are present for learning pathway', () => {
      const technicalTermsCourse = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-111');
      expect(technicalTermsCourse).toBeDefined();
      expect(technicalTermsCourse?.titleThai).toBe('ศัพท์เทคนิคทางการแพทย์');
      expect(technicalTermsCourse?.titleEnglish).toBe('Technical Terms in Medicine');

      const imageAnalyticsCourse = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-354');
      expect(imageAnalyticsCourse).toBeDefined();
      expect(imageAnalyticsCourse?.titleThai).toBe('การวิเคราะห์ภาพถ่ายทางการแพทย์');
    });

    it('should build proper course label and starter question matching specification', () => {
      const course = OFFICIAL_COURSES_2567.find((c) => c.code === 'DTM67-111')!;
      const courseCodeStr = course.code ? `${course.code} ` : '';
      const courseTitleTh = course.titleThai || '';
      const courseTitleEn = course.titleEnglish ? ` (${course.titleEnglish})` : '';
      const courseFullLabel = `${courseCodeStr}${courseTitleTh}${courseTitleEn}`.trim();

      const expectedPrompt = `ฉันกำลังเริ่มเรียนรายวิชา ${courseFullLabel} ในหลักสูตร DTM 2567 ช่วยปูพื้นฐานหัวข้อที่เกี่ยวข้องเป็นภาษาไทยสำหรับผู้เริ่มต้น โดยคงศัพท์เทคนิคภาษาอังกฤษที่สำคัญ อธิบายแนวคิดเป็นลำดับ พร้อมยกตัวอย่างด้านเทคโนโลยีดิจิทัลทางการแพทย์ หากไม่มีเอกสารประกอบหรือคำอธิบายรายวิชาฉบับเต็ม ให้ระบุชัดเจนว่าส่วนใดเป็นความรู้ทั่วไป และอย่าอ้างว่าเป็นคำอธิบายรายวิชาอย่างเป็นทางการ`;

      expect(expectedPrompt).toContain('DTM67-111');
      expect(expectedPrompt).toContain('ศัพท์เทคนิคทางการแพทย์');
      expect(expectedPrompt).toContain('Technical Terms in Medicine');
      expect(expectedPrompt).toContain('อย่าอ้างว่าเป็นคำอธิบายรายวิชาอย่างเป็นทางการ');
    });
  });

  describe('4. Sample Document Storage Course Alignment', () => {
    it('should associate sample document 2 with official course DTM67-354 and leave doc 1 unassigned', async () => {
      await clearAllDocuments();
      const seeded = await seedSampleDocumentsIfEmpty();

      expect(seeded.length).toBeGreaterThanOrEqual(2);

      const aiDoc = seeded.find((d) => d.id === 'doc-sample-dtm-ai');
      expect(aiDoc).toBeDefined();
      expect(aiDoc?.courseCode).toBe('DTM67-354');
      expect(aiDoc?.courseTitle).toContain('การวิเคราะห์ภาพถ่ายทางการแพทย์');

      const qcDoc = seeded.find((d) => d.id === 'doc-sample-cc-qc');
      expect(qcDoc).toBeDefined();
      expect(qcDoc?.courseCode).toBeUndefined(); // unassigned sample document, avoiding mismatch
    });
  });
});
