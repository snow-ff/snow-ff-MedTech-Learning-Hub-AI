import { describe, it, expect } from 'vitest';
import { getAcademicFallback } from '../server';

describe('Backend Academic Fallback Mode (`getAcademicFallback`)', () => {
  it('handles Flow Cytometry queries correctly with verified NCBI NBK608011 reference and FSC/SSC caveat', () => {
    const res = getAcademicFallback("ขอข้อมูล Flow Cytometry และการจำแนกเม็ดเลือดขาว");
    expect(res.text).toContain('Flow Cytometry');
    expect(res.text).toContain('Forward Scatter (FSC)');
    expect(res.text).toContain('Side Scatter (SSC)');
    expect(res.text).toContain('ไม่เพียงพอสำหรับการจำแนกชนิดเซลล์อย่างเด็ดขาด (Definitive classification)');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(1);
    expect(res.references[0].title).toBe('Flow Cytometry Blood Cell Identification');
    expect(res.references[0].uri).toBe('https://www.ncbi.nlm.nih.gov/books/NBK608011/');
  });

  it('handles Leukocyte Differentiation keyword matching Flow Cytometry correctly', () => {
    const res = getAcademicFallback("อธิบายเม็ดเลือดขาว");
    expect(res.text).toContain('Flow Cytometry');
    expect(res.references.length).toBe(1);
    expect(res.references[0].uri).toBe('https://www.ncbi.nlm.nih.gov/books/NBK608011/');
  });

  it('handles Real-Time PCR (qPCR) queries correctly with verifiable MIQE 2.0 and PubMed references and Cq/Ct caveat', () => {
    const res = getAcademicFallback("ความแตกต่างระหว่าง Real-Time PCR และ Conventional PCR");
    expect(res.text).toContain('Conventional PCR');
    expect(res.text).toContain('Real-Time PCR (qPCR)');
    expect(res.text).toContain('ไม่ควรใช้เกณฑ์ตัดรอบที่ตายตัวแบบเหมารวม');
    expect(res.text).toContain('ไม่ควรเหมารวมว่า Real-Time PCR ต้องมีความไวสูงกว่า Conventional PCR ในทุกกรณี');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toContain('MIQE 2.0');
    expect(res.references[0].uri).toBe('https://academic.oup.com/clinchem/article/71/6/634/8119148');
    expect(res.references[1].title).toBe('A Basic Guide to Real Time PCR in Microbial Diagnostics: Definitions, Parameters, and Everything (Frontiers in Microbiology, 2017)');
    expect(res.references[1].uri).toBe('https://pubmed.ncbi.nlm.nih.gov/28210243/');
  });

  it('handles Gram Stain queries correctly with official ASM Gram Stain Protocols reference and method-dependent timing', () => {
    const res = getAcademicFallback("หลักการย้อมสีแกรม Gram Stain");
    expect(res.text).toContain('Gram Stain Protocols');
    expect(res.text).toContain('Method-Dependent Decolorization');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(1);
    expect(res.references[0].title).toBe('Gram Stain Protocols');
    expect(res.references[0].uri).toBe('https://asm.org/protocols/gram-stain-protocols');
  });

  it('handles CBC and Dengue queries correctly with WHO 2009 historical criterion and updated CDC reference', () => {
    const res = getAcademicFallback("การแปลผล CBC ในผู้ป่วยเดงกี่");
    expect(res.text).toContain('Complete Blood Count (CBC)');
    expect(res.text).toContain('Dengue Hemorrhagic Fever');
    expect(res.text).toContain('WHO 2009 Historical Criterion');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toContain('WHO Guidelines - Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control (2009)');
    expect(res.references[1].title).toBe('Clinical Care of Dengue | Dengue | CDC');
    expect(res.references[1].uri).toBe('https://www.cdc.gov/dengue/hcp/clinical-care/');
  });

  it('handles general CBC queries correctly with Automated vs Manual smear confirmation and Westgard rules', () => {
    const res = getAcademicFallback("หลักการตรวจ CBC และการควบคุมคุณภาพ");
    expect(res.text).toContain('Complete Blood Count (CBC)');
    expect(res.text).toContain('Automated vs. Manual Blood Smear Confirmation');
    expect(res.text).toContain('Westgard Multirules');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toContain('CLSI H20-A2');
    expect(res.references[1].uri).toBe('https://pubmed.ncbi.nlm.nih.gov/7201955/');
  });

  it('handles Crossmatching and Blood Grouping queries correctly with AABB 22nd Edition, NBK2261, and SOP disclaimer', () => {
    const res = getAcademicFallback("ขั้นตอน Crossmatching และการตรวจหมู่เลือด");
    expect(res.text).toContain('Blood Grouping');
    expect(res.text).toContain('Major Crossmatch');
    expect(res.text).toContain('ไม่ใช่แนวทางปฏิบัติงานมาตรฐานทางคลินิก (Clinical SOP)');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(2);
    expect(res.references[0].title).toBe('AABB Technical Manual, 22nd Edition');
    expect(res.references[0].uri).toBe('https://www.aabb.org/aabb-store/product/technical-manual-22nd-edition-print-21871175');
    expect(res.references[1].title).toBe('Blood Groups and Red Cell Antigens');
    expect(res.references[1].uri).toBe('https://www.ncbi.nlm.nih.gov/books/NBK2261/');
  });

  it('handles default/general laboratory queries correctly with specific CLSI standards (QMS01, EP23, EP28)', () => {
    const res = getAcademicFallback("คำถามทั่วไปทางห้องปฏิบัติการเทคนิคการแพทย์");
    expect(res.text).toContain('ระบบบริหารคุณภาพห้องปฏิบัติการ');
    expect(res.references).toBeDefined();
    expect(res.references.length).toBe(3);
    expect(res.references[0].title).toContain('CLSI QMS01');
    expect(res.references[0].uri).toBe('https://clsi.org/shop/standards/qms01/');
    expect(res.references[1].title).toContain('CLSI EP23');
    expect(res.references[1].uri).toBe('https://clsi.org/shop/standards/ep23/');
    expect(res.references[2].title).toContain('CLSI EP28-A3c');
    expect(res.references[2].uri).toBe('https://clsi.org/shop/standards/ep28/');
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
