import { describe, it, expect } from 'vitest';
import { getMockResponse } from './App';
import { Message } from './App';

describe('MedTech Learning Hub AI Mock Mode Logic', () => {
  it('handles sequential multi-turn conversation correctly: LIS definition followed by interfacing question', () => {
    // Turn 1: User asks about LIS
    const q1 = "LIS คืออะไร และมีหน้าที่อะไรในห้องปฏิบัติการเทคนิคการแพทย์?";
    const res1 = getMockResponse(q1, []);
    expect(res1.text).toContain('LIS คือระบบสารสนเทศ');

    const msg1User: Message = { id: '1', role: 'user', text: q1, timestamp: 1000 };
    const msg1Model: Message = { id: '2', role: 'model', text: res1.text, timestamp: 1001 };
    const history1 = [msg1User, msg1Model];

    // Turn 2: Follow-up question referencing "ระบบนี้เชื่อมต่อ..."
    const q2 = "แล้วระบบนี้เชื่อมต่อกับเครื่องตรวจวิเคราะห์อย่างไร และมีข้อควรระวังอะไรบ้าง?";
    const res2 = getMockResponse(q2, history1);
    
    expect(res2.text).toContain('การเชื่อมต่อระบบ LIS กับเครื่องตรวจวิเคราะห์');
    expect(res2.text).toContain('Specimen ID Matching');
    expect(res2.text).toContain('Direct Interfacing');
  });

  it('answers single LIS query correctly', () => {
    const res = getMockResponse("ขอข้อมูล LIS", []);
    expect(res.text).toContain('LIS (Laboratory Information System)');
  });

  it('answers single LIMS query correctly', () => {
    const res = getMockResponse("ขอข้อมูล LIMS", []);
    expect(res.text).toContain('LIMS (Laboratory Information Management System)');
  });

  it('answers LIS vs LIMS comparison query correctly', () => {
    const res = getMockResponse("เปรียบเทียบ LIS กับ LIMS ให้หน่อย", []);
    expect(res.text).toContain('การเปรียบเทียบระหว่าง LIS และ LIMS');
  });

  it('answers reference interval and hemolysis query correctly', () => {
    const res = getMockResponse("Hemolysis และ Reference Interval คืออะไร", []);
    expect(res.text).toContain('Reference Interval (ค่าอ้างอิง)');
    expect(res.text).toContain('Hemolysis (เม็ดเลือดแดงแตก)');
  });

  it('answers LIS and LIMS relation to QC, calibration and PM correctly', () => {
    const res = getMockResponse("LIS และ LIMS เกี่ยวข้องกับการควบคุมคุณภาพ (Quality Control: QC) การสอบเทียบเครื่องมือ (Equipment Calibration) และ Preventive Maintenance อย่างไร หน้าที่ของทั้งสองระบบแตกต่างกันหรือไม่ และมีข้อควรระวังอะไรบ้าง", []);
    expect(res.text).toContain('การควบคุมคุณภาพ (QC)');
    expect(res.text).toContain('Equipment Calibration');
    expect(res.text).toContain('Preventive Maintenance');
    expect(res.text).toContain('Levey-Jennings');
    expect(res.text).toContain('Westgard Rules');
    expect(res.text).toContain('Out of Control Result Blocking');
    expect(res.text).toContain('Impact Evaluation');
    expect(res.text).toContain('Adjustment');
    expect(res.text).toContain('Manufacturer');
    expect(res.text).toContain('ไม่ใช่ทุก LIS ที่ต้องมีฟังก์ชันบล็อกอัตโนมัติ');
  });

  it('handles follow-up query with ระบบนี้ interfacing question when LIS context is present in history', () => {
    const q1 = "ระบบสารสนเทศห้องปฏิบัติการคืออะไร?";
    const res1 = getMockResponse(q1, []);
    const history = [
      { id: '1', role: 'user' as const, text: q1, timestamp: 1 },
      { id: '2', role: 'model' as const, text: res1.text, timestamp: 2 }
    ];
    const q2 = "แล้วระบบนี้เชื่อมต่อกับเครื่องตรวจวิเคราะห์อย่างไร มีข้อควรระวังอะไรบ้าง";
    const res2 = getMockResponse(q2, history);
    expect(res2.text).toContain('การเชื่อมต่อระบบ LIS กับเครื่องตรวจวิเคราะห์');
    expect(res2.text).toContain('Specimen ID Matching');
  });

  it('answers multi-topic query with QC and hemolysis correctly', () => {
    const res = getMockResponse("QC คืออะไร และ Hemolysis มีผลอย่างไร", []);
    expect(res.text).toContain('การควบคุมคุณภาพ (QC)');
    expect(res.text).toContain('Hemolysis (เม็ดเลือดแดงแตก)');
  });

  it('answers multi-topic comparison query with QC and calibration correctly', () => {
    const res = getMockResponse("เปรียบเทียบ LIS กับ LIMS ในด้าน QC และ Calibration", []);
    expect(res.text).toContain('การเปรียบเทียบระหว่าง LIS และ LIMS');
    expect(res.text).toContain('การควบคุมคุณภาพ (QC)');
    expect(res.text).toContain('Equipment Calibration');
  });
});

