import { describe, it, expect } from 'vitest';
import { getAcademicFallback } from '../server';

describe('Backend Academic Fallback Mode (`getAcademicFallback`)', () => {
  it('handles Flow Cytometry queries correctly with correct academic content and reference', () => {
    const res = getAcademicFallback("ขอข้อมูล Flow Cytometry และการจำแนกเม็ดเลือดขาว");
    expect(res.text).toContain('Flow Cytometry');
    expect(res.text).toContain('Forward Scatter (FSC)');
    expect(res.text).toContain('Side Scatter (SSC)');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(1);
    expect(res.references[0].title).toContain('ScienceDirect Topics - Flow Cytometry');
    expect(res.references[0].uri).toBe('https://www.sciencedirect.com/topics/biochemistry-genetics-and-molecular-biology/flow-cytometry');
  });

  it('handles Leukocyte Differentiation keyword matching Flow Cytometry correctly', () => {
    const res = getAcademicFallback("อธิบายเม็ดเลือดขาว");
    expect(res.text).toContain('Flow Cytometry');
    expect(res.references.length).toBe(1);
  });

  it('handles Real-Time PCR (qPCR) queries correctly with empty references array', () => {
    const res = getAcademicFallback("ความแตกต่างระหว่าง Real-Time PCR และ Conventional PCR");
    expect(res.text).toContain('Conventional PCR');
    expect(res.text).toContain('Real-Time PCR (qPCR)');
    expect(res.references).toBeDefined();
    expect(res.references).toEqual([]);
  });

  it('handles CBC and Dengue queries correctly with WHO and CDC references', () => {
    const res = getAcademicFallback("การแปลผล CBC ในผู้ป่วยเดงกี่");
    expect(res.text).toContain('Complete Blood Count (CBC)');
    expect(res.text).toContain('Dengue Hemorrhagic Fever');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toContain('WHO Guidelines');
    expect(res.references[1].title).toContain('CDC Clinical Guidance');
  });

  it('handles Crossmatching and Blood Grouping queries correctly with AABB and NCBI NBK2265 references', () => {
    const res = getAcademicFallback("ขั้นตอน Crossmatching และการตรวจหมู่เลือด");
    expect(res.text).toContain('Blood Grouping');
    expect(res.text).toContain('Major Crossmatch');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toContain('AABB Technical Manual');
    expect(res.references[1].uri).toContain('ncbi.nlm.nih.gov/books/NBK2265');
  });

  it('handles default/general laboratory queries correctly with CLSI reference', () => {
    const res = getAcademicFallback("คำถามทั่วไปทางห้องปฏิบัติการเทคนิคการแพทย์");
    expect(res.text).toContain('ภาพรวมทางเทคนิคการแพทย์');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(1);
    expect(res.references[0].title).toContain('CLSI');
  });

  it('applies contextual follow-up notice when query lacks primary domain keywords', () => {
    const res = getAcademicFallback("ช่วยอธิบายเพิ่มเติมในส่วนนี้หน่อยครับ");
    expect(res.text).toContain('ระบบอยู่ในโหมดข้อมูลสำรองทางวิชาการ (Academic Fallback Mode)');
    expect(res.text).toContain('คำถามของคุณอาจอ้างถึงบริบทก่อนหน้าซึ่งระบบออฟไลน์ไม่สามารถประมวลผลต่อเนื่องแบบ Multi-turn');
  });

  it('applies standard quota exceeded notice when query contains primary domain keywords', () => {
    const res = getAcademicFallback("Flow Cytometry คืออะไร");
    expect(res.text).toContain('โควตาการใช้งานฟรีของ Gemini API เต็มชั่วคราว');
    expect(res.text).not.toContain('คำถามของคุณอาจอ้างถึงบริบทก่อนหน้าซึ่งระบบออฟไลน์ไม่สามารถประมวลผล');
  });
});
