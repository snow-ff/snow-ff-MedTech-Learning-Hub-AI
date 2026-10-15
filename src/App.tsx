import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Send, 
  BookOpen, 
  FileText, 
  Globe, 
  Sparkles, 
  Brain, 
  Info, 
  CheckCircle2, 
  HelpCircle, 
  BookMarked,
  Layers,
  FlaskConical,
  Microscope,
  AlertCircle,
  Loader2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  references?: Array<{ title?: string; uri: string; type?: string }>;
  source?: string;
  timestamp: number;
}

export function getMockResponse(queryToSubmit: string, currentMessages: Message[]) {
  const selectedRefs = [
    { title: 'ตำราสารสนเทศห้องปฏิบัติการทางการแพทย์ (Mock Reference)', uri: 'https://example.com/mock-lis', type: 'academic_textbook' },
    { title: 'แนวทางระบบ LIS และ LIMS มาตรฐานสากล', uri: 'https://example.com/mock-lims', type: 'web_grounding' }
  ];

  const lowerQuery = queryToSubmit.toLowerCase();
  const conversationTextSoFar = currentMessages.map(m => m.text.toLowerCase()).join(' ');
  const isLisContext = conversationTextSoFar.includes('lis') || conversationTextSoFar.includes('laboratory information system') || conversationTextSoFar.includes('ระบบสารสนเทศห้องปฏิบัติการ');
  const isLimsContext = conversationTextSoFar.includes('lims') || conversationTextSoFar.includes('laboratory information management system');

  const isInterfacingQuery = lowerQuery.includes('เชื่อมต่อ') || lowerQuery.includes('เครื่องตรวจวิเคราะห์') || lowerQuery.includes('analyzer') || lowerQuery.includes('ข้อควรระวัง') || lowerQuery.includes('middleware') || lowerQuery.includes('interface');
  const isInterferenceOrRefIntervalQuery = lowerQuery.includes('hemolysis') || lowerQuery.includes('icter') || lowerQuery.includes('lipem') || lowerQuery.includes('reference interval') || lowerQuery.includes('ค่าอ้างอิง') || lowerQuery.includes('ฮีโมไลซิส') || lowerQuery.includes('ดีซ่าน') || lowerQuery.includes('ไขมัน');
  const isQcOrCalibrationQuery = lowerQuery.includes('ควบคุมคุณภาพ') || lowerQuery.includes('qc') || lowerQuery.includes('สอบเทียบ') || lowerQuery.includes('calibration');
  const hasComparisonWithQc = (lowerQuery.includes('เปรียบเทียบ') || lowerQuery.includes('ความแตกต่าง')) && (lowerQuery.includes('lis') && lowerQuery.includes('lims')) && (lowerQuery.includes('qc') || lowerQuery.includes('ควบคุมคุณภาพ') || lowerQuery.includes('calibration') || lowerQuery.includes('สอบเทียบ'));
  const hasQc = isQcOrCalibrationQuery;
  const hasInterference = isInterferenceOrRefIntervalQuery;
  const hasComparison = (lowerQuery.includes('lis') && lowerQuery.includes('lims')) || lowerQuery.includes('เปรียบเทียบ') || lowerQuery.includes('ความแตกต่าง');
  const hasInterfacing = isInterfacingQuery && (isLisContext || lowerQuery.includes('lis') || lowerQuery.includes('ระบบนี้') || lowerQuery.includes('ระบบดังกล่าว'));
  const hasLis = lowerQuery.includes('lis') || lowerQuery.includes('laboratory information system') || lowerQuery.includes('ระบบสารสนเทศห้องปฏิบัติการ');
  const hasLims = lowerQuery.includes('lims') || lowerQuery.includes('laboratory information management system') || isLimsContext;

  let selectedText = "";

  if (hasComparisonWithQc) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - การเปรียบเทียบระหว่าง LIS และ LIMS พร้อมบทบาทด้าน QC และ Calibration:

1. การเปรียบเทียบระหว่าง LIS และ LIMS:
- LIS (Laboratory Information System): มักเน้นกระบวนการตรวจทางห้องปฏิบัติการทางการแพทย์และการรายงานผลผู้ป่วย เช่น การรับคำสั่งตรวจ (Test Ordering), การลงทะเบียนสิ่งส่งตรวจ (Specimen Registration), การติดตามสิ่งส่งตรวจ (Specimen Tracking), การเชื่อมต่อเครื่องวิเคราะห์ (Instrument Interfacing), และการตรวจสอบรับรองผล (Result Review & Validation)
- LIMS (Laboratory Information Management System): มักเน้นการจัดการตัวอย่างและเวิร์กโฟลว์ของห้องปฏิบัติการ (Sample Management & Workflows) เช่น การติดตามตัวอย่างตั้งแต่รับเข้าจนถึงทำลาย, การจัดการเวิร์กโฟลว์การทดสอบ, และการจัดการข้อมูลเชิงวิเคราะห์
- หมายเหตุ: ความสามารถของทั้งสองระบบอาจทับซ้อนกันได้ขึ้นอยู่กับการออกแบบของผลิตภัณฑ์ โดยไม่ได้จำกัดว่าระบบใดต้องกว้างกว่าเสมอ หรือจำกัดการใช้งานเฉพาะสถานที่ใดสถานที่หนึ่งเท่านั้น

2. การควบคุมคุณภาพ (QC), การสอบเทียบเครื่องมือ (Equipment Calibration) และ Preventive Maintenance กับบทบาทของ LIS และ LIMS:
- Quality Control (QC): เป็นกระบวนการทางสถิติและการปฏิบัติงานประจำวัน เพื่อตรวจสอบความถูกต้องแม่นยำและความคงที่ (Precision & Accuracy) ของการตรวจวิเคราะห์ เช่น การวิเคราะห์ Control Material, การแปลผลด้วย Levey-Jennings Chart และ Westgard Rules เพื่อตัดสินว่าผลวิเคราะห์ตัวอย่างผู้ป่วยรอบนั้นยอมรับได้หรือไม่
- Equipment Calibration (การสอบเทียบเครื่องมือ): คือกระบวนการกำหนดหรือยืนยันความสัมพันธ์ระหว่างค่าที่วัดได้กับค่าอ้างอิงตามวิธีที่ใช้ ซึ่งการสอบเทียบ (Calibration) เป็นการตรวจสอบความถูกต้องโดยยังไม่จำเป็นต้องทำการปรับแต่ง (Adjustment) เครื่องมือทุกครั้ง เว้นแต่ผลการสอบเทียบจะแสดงค่าเบี่ยงเบนเกินเกณฑ์ที่กำหนดจึงต้องทำ Adjustment
- Preventive Maintenance (การบำรุงรักษาเชิงป้องกัน): เป็นการดูแล บำรุงรักษา ทำความสะอาด หรือเปลี่ยนอะไหล่ตามรอบเวลา เพื่อป้องกันการเสื่อมสภาพของเครื่องมือ ซึ่งมีความแตกต่างจากกระบวนการ QC รายวันและการสอบเทียบเครื่องมือ
- บทบาทของ LIS และ LIMS: LIS บันทึกและประมวลผลข้อมูล Internal QC (Levey-Jennings, Mean, SD, CV) และอาจรองรับการแจ้งเตือนหรือระงับการรายงานผลผู้ป่วยอัตโนมัติ (Out of Control Result Blocking) ขึ้นอยู่กับการตั้งค่า ส่วน LIMS จัดการตารางเวลาและเอกสารการสอบเทียบ (Calibration Schedule) และ PM ของเครื่องมือ`;
  } else if (hasQc && hasInterference) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - การควบคุมคุณภาพ (QC) และปัจจัยรบกวนก่อนวิเคราะห์ (Hemolysis):

1. การควบคุมคุณภาพ (QC), การสอบเทียบเครื่องมือ (Equipment Calibration) และ Preventive Maintenance:
- Quality Control (QC): เป็นกระบวนการทางสถิติและการปฏิบัติงานประจำวัน เพื่อตรวจสอบความถูกต้องแม่นยำและความคงที่ (Precision & Accuracy) ของการตรวจวิเคราะห์ เช่น การวิเคราะห์ Control Material, การแปลผลด้วย Levey-Jennings Chart และ Westgard Rules เพื่อตัดสินว่าผลวิเคราะห์ตัวอย่างผู้ป่วยรอบนั้นยอมรับได้หรือไม่
- Equipment Calibration (การสอบเทียบเครื่องมือ): คือกระบวนการกำหนดหรือยืนยันความสัมพันธ์ระหว่างค่าที่วัดได้กับค่าอ้างอิงตามวิธีที่ใช้ ซึ่งการสอบเทียบ (Calibration) เป็นการตรวจสอบความถูกต้องโดยยังไม่จำเป็นต้องทำการปรับแต่ง (Adjustment) เครื่องมือทุกครั้ง เว้นแต่ผลการสอบเทียบจะแสดงค่าเบี่ยงเบนเกินเกณฑ์ที่กำหนดจึงต้องทำ Adjustment
- Preventive Maintenance (การบำรุงรักษาเชิงป้องกัน): เป็นการดูแล บำรุงรักษา ทำความสะอาด หรือเปลี่ยนอะไหล่ตามรอบเวลา เพื่อป้องกันการเสื่อมสภาพของเครื่องมือ ซึ่งมีความแตกต่างจากกระบวนการ QC รายวันและการสอบเทียบเครื่องมือ

2. ค่าอ้างอิงและสิ่งรบกวนทางก่อนวิเคราะห์ (Pre-analytical Interferences):
- Reference Interval (ค่าอ้างอิง): ช่วงค่าปกติที่ได้จากการศึกษาในประชากรกลุ่มอ้างอิงที่มีสุขภาพดี ซึ่งอาจแตกต่างกันไปตามช่วงอายุ เพศ วิธีการตรวจ และเครื่องมือที่ใช้
- Hemolysis (เม็ดเลือดแดงแตก): ปล่อยสารภายในเซลล์ออกมา รบกวนการทดสอบเช่น Potassium, LDH, AST (ทำให้ค่าสูงกว่าความเป็นจริง)
- Icterus (ภาวะบิลิรูบินสูง / ดีซ่าน) และ Lipemia (ภาวะไขมันในเลือดสูง): ความขุ่นหรือสีรบกวนการวัดทางโฟโตเมตรี`;
  } else if (hasQc) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - การควบคุมคุณภาพ (QC), การสอบเทียบเครื่องมือ (Equipment Calibration) และการบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) กับบทบาทของ LIS และ LIMS:

1. การแยกแยะความแตกต่างทางวิชาการ:
- Quality Control (QC): เป็นกระบวนการทางสถิติและการปฏิบัติงานประจำวัน เพื่อตรวจสอบความถูกต้องแม่นยำและความคงที่ (Precision & Accuracy) ของการตรวจวิเคราะห์ เช่น การวิเคราะห์ Control Material, การแปลผลด้วย Levey-Jennings Chart และ Westgard Rules เพื่อตัดสินว่าผลวิเคราะห์ตัวอย่างผู้ป่วยรอบนั้นยอมรับได้หรือไม่
- Equipment Calibration (การสอบเทียบเครื่องมือ): คือกระบวนการกำหนดหรือยืนยันความสัมพันธ์ระหว่างค่าที่วัดได้กับค่าอ้างอิงตามวิธีที่ใช้ ซึ่งการสอบเทียบ (Calibration) เป็นการตรวจสอบความถูกต้องโดยยังไม่จำเป็นต้องทำการปรับแต่ง (Adjustment) เครื่องมือทุกครั้ง เว้นแต่ผลการสอบเทียบจะแสดงค่าเบี่ยงเบนเกินเกณฑ์ที่กำหนดจึงต้องทำ Adjustment
- Preventive Maintenance (การบำรุงรักษาเชิงป้องกัน): เป็นการดูแล บำรุงรักษา ทำความสะอาด หรือเปลี่ยนอะไหล่ตามรอบเวลา เพื่อป้องกันการเสื่อมสภาพของเครื่องมือ ซึ่งมีความแตกต่างจากกระบวนการ QC รายวันและการสอบเทียบเครื่องมือ

2. บทบาทของ LIS และ LIMS (ขึ้นอยู่กับผลิตภัณฑ์และการตั้งค่าของแต่ละระบบ):
- LIS (Laboratory Information System):
  * บันทึก จัดเก็บ และประมวลผลข้อมูล Internal QC คำนวณค่าทางสถิติ (Mean, SD, CV) และแสดงแผนภูมิ Levey-Jennings
  * ระบบอาจรองรับการแจ้งเตือนหรือระงับการรายงานผลผู้ป่วยอัตโนมัติ (Out of Control Result Blocking) ได้ ขึ้นอยู่กับการออกแบบและตั้งค่าของผลิตภัณฑ์ (ไม่ใช่ทุก LIS ที่ต้องมีฟังก์ชันบล็อกอัตโนมัติ)
  * รองรับการเชื่อมต่อข้อมูลสิ่งส่งตรวจและผลวิเคราะห์จากเครื่องมือตรวจวิเคราะห์ (Instrument Interfacing)
- LIMS (Laboratory Information Management System):
  * จัดการตารางเวลา ประวัติ และเอกสารการสอบเทียบ (Calibration Schedule & Records) และการบำรุงรักษาเครื่องมือ (PM)
  * จัดการสต็อกสารมาตรฐาน (Standards) น้ำยา (Reagents) และตัวอย่างสิ่งแวดล้อม
  * หมายเหตุ: ฟังก์ชันเฉพาะของระบบอาจมีความทับซ้อนหรือแตกต่างกันได้ขึ้นอยู่กับการออกแบบของซอฟต์แวร์และการติดตั้งใช้งานจริง

3. ข้อควรระวังและการจัดการตามมาตรฐานสากล (เช่น ISO 15189 / ISO/IEC 17025):
- QC Failure Handling & Impact Evaluation: เมื่อผล QC ไม่ผ่านเกณฑ์ ต้องประเมินผลกระทบ (Impact Evaluation) ต่อตัวอย่างผู้ป่วยที่เกี่ยวข้อง ตรวจสอบหาสาเหตุ ดำเนินการแก้ไขตามขั้นตอนมาตรฐาน (SOP) และยืนยันความเหมาะสม (Verify appropriateness) ของระบบก่อนปล่อยผลตรวจที่ได้รับผลกระทบ
- Calibration Triggers & Reagent Lot Change: การเปลี่ยนล็อตน้ำยาหลักหรือการพบ QC ผิดปกติ ไม่ได้หมายความว่าต้องทำการสอบเทียบใหม่ (Re-calibration) ทุกครั้งโดยอัตโนมัติ ต้องพิจารณาตามข้อกำหนดของวิธีวิเคราะห์ คำแนะนำของผู้ผลิต (Manufacturer's instructions) และขั้นตอนการปฏิบัติงานมาตรฐาน (SOP)
- Traceability & Data Integrity: ทุกบันทึกการทำ QC, การบำรุงรักษา (PM) และการสอบเทียบ (Calibration) ต้องมีความโปร่งใส ตรวจสอบย้อนกลับได้เพื่อความปลอดภัยสูงสุดของผู้ป่วย`;
  } else if (hasComparison) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - การเปรียบเทียบระหว่าง LIS และ LIMS:

1. หน้าที่หลักและขอบเขต:
- LIS (Laboratory Information System): มักเน้นกระบวนการตรวจทางห้องปฏิบัติการทางการแพทย์และการรายงานผลผู้ป่วย เช่น การรับคำสั่งตรวจ (Test Ordering), การลงทะเบียนสิ่งส่งตรวจ (Specimen Registration), การติดตามสิ่งส่งตรวจ (Specimen Tracking), การเชื่อมต่อเครื่องวิเคราะห์ (Instrument Interfacing), และการตรวจสอบรับรองผล (Result Review & Validation)
- LIMS (Laboratory Information Management System): มักเน้นการจัดการตัวอย่างและเวิร์กโฟลว์ของห้องปฏิบัติการ (Sample Management & Workflows) เช่น การติดตามตัวอย่างตั้งแต่รับเข้าจนถึงทำลาย, การจัดการเวิร์กโฟลว์การทดสอบ, และการจัดการข้อมูลเชิงวิเคราะห์
- หมายเหตุ: ความสามารถของทั้งสองระบบอาจทับซ้อนกันได้ขึ้นอยู่กับการออกแบบของผลิตภัณฑ์ โดยไม่ได้จำกัดว่าระบบใดต้องกว้างกว่าเสมอ หรือจำกัดการใช้งานเฉพาะสถานที่ใดสถานที่หนึ่งเท่านั้น

2. ความแตกต่างที่มักพบ:
- การบูรณาการระบบ: LIS มักให้ความสำคัญสูงกับการเชื่อมต่อกับระบบสารสนเทศโรงพยาบาล (HIS/EMR Integration) เพื่อเชื่อมโยงข้อมูลผู้ป่วยและแพทย์ผู้รักษา ส่วน LIMS มักเน้นการจัดการข้อมูลตัวอย่าง สต็อก (Inventory) และการสอบเทียบเครื่องมือ (Equipment Calibration)
- มาตรฐานที่เกี่ยวข้อง: LIS มักเกี่ยวข้องกับการสนับสนุนระบบคุณภาพตามมาตรฐาน ISO 15189 (ความสามารถและคุณภาพของห้องปฏิบัติการทางการแพทย์) ในขณะที่ LIMS มักเกี่ยวข้องกับมาตรฐาน ISO/IEC 17025 (ความสามารถของห้องปฏิบัติการทดสอบและสอบเทียบ) ทั้งนี้มาตรฐานเหล่านี้เป็นเกณฑ์ประเมินห้องปฏิบัติการ ไม่ใช่การรับรองตัวซอฟต์แวร์โดยตรง

3. ปัจจัยในการเลือกใช้:
- Workflow & Specimen Tracking: รูปแบบกระบวนการทำงานและการติดตามตัวอย่างที่สอดคล้องกับหน้างาน
- HIS/EMR Integration: ความจำเป็นในการเชื่อมต่อระบบสารสนเทศโรงพยาบาล
- Instrument Interfacing: ความสามารถในการเชื่อมต่อกับเครื่องมือตรวจวิเคราะห์
- Data Security & Traceability: ระบบรักษาความปลอดภัยของข้อมูลและการตรวจสอบย้อนกลับ (Traceability)
- คุณสมบัติเพิ่มเติม: เช่น การควบคุมคุณภาพ (QC), สต็อก (Inventory), และการสอบเทียบ (Equipment Calibration) ซึ่งขึ้นอยู่กับผลิตภัณฑ์และการติดตั้งแต่ละราย`;
  } else if (hasInterference) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - เรื่องค่าอ้างอิงและสิ่งรบกวนทางก่อนวิเคราะห์ (Pre-analytical Interferences):

1. Reference Interval (ค่าอ้างอิง):
- ช่วงค่าปกติที่ได้จากการศึกษาในประชากรกลุ่มอ้างอิงที่มีสุขภาพดี ซึ่งอาจแตกต่างกันไปตามช่วงอายุ เพศ วิธีการตรวจ และเครื่องมือที่ใช้

2. ปัจจัยแทรกซ้อนก่อนวิเคราะห์ (Pre-analytical Interferences):
- Hemolysis (เม็ดเลือดแดงแตก): ปล่อยสารภายในเซลล์ออกมา รบกวนการทดสอบเช่น Potassium, LDH, AST
- Icterus (ภาวะบิลิรูบินสูง / ดีซ่าน): สีเหลืองเข้มรบกวนการวัดทางโฟโตเมตรี
- Lipemia (ภาวะไขมันในเลือดสูง): ความขุ่นรบกวนปฏิกิริยาแสงผ่าน (Turbidity Interference)`;
  } else if (hasInterfacing) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) - การเชื่อมต่อระบบ LIS กับเครื่องตรวจวิเคราะห์ (Instrument Interfacing) และข้อควรระวัง:

1. รูปแบบการเชื่อมต่อเครื่องตรวจวิเคราะห์ (Instrument Interfacing):
- Direct Interfacing: เครื่องตรวจวิเคราะห์เชื่อมต่อตรงกับ LIS ผ่าน Serial Port (RS-232) หรือ Network (TCP/IP) โดยใช้ ASTM หรือ HL7 Protocol
- Middleware Solution: ใช้ซอฟต์แวร์ตัวกลาง (Middleware) ในการจัดการและแปลข้อมูลระหว่างเครื่องวิเคราะห์หลายรุ่นหลายยี่ห้อกับ LIS เพื่อลดความซับซ้อนในการเชื่อมต่อ
- การรับส่งข้อมูล:
  * Barcode / Specimen ID: ส่งคำสั่งตรวจ (Worklist) จาก LIS ไปยังเครื่องวิเคราะห์ หรือสแกนบาร์โค้ดที่เครื่องเพื่อดึงค่า
  * Test Code: จับคู่รหัสการทดสอบระหว่าง LIS และเครื่องวิเคราะห์
  * Test Result: ส่งผลการวิเคราะห์กลับมายัง LIS โดยอัตโนมัติ

2. ข้อควรระวังและการตรวจสอบความถูกต้อง (Precautions & Validation):
- Specimen ID Matching: ต้องตรวจสอบความถูกต้องตรงกันของหมายเลขสิ่งส่งตรวจ (Barcode/ID) ระหว่างตัวอย่างและข้อมูลในระบบ เพื่อป้องกันการสลับสิ่งส่งตรวจ (Sample Mix-up)
- Test Code Mapping: ตรวจสอบการแปลงรหัสการทดสอบให้ถูกต้องตรงกันระหว่างเครื่องวิเคราะห์และ LIS
- Units and Data Format: ตรวจสอบหน่วยการวัด (Units) และรูปแบบข้อมูล (Data Format) ให้เป็นมาตรฐานเดียวกัน
- Duplicate & Incomplete Data Check: ตรวจสอบข้อมูลซ้ำซ้อนหรือข้อมูลที่ไม่ครบถ้วนก่อนบันทึกเข้าฐานข้อมูลผู้ป่วย
- Communication Errors: เฝ้าระวังข้อผิดพลาดในการสื่อสาร (Communication Timeout / Transmission Error) และมีระบบบันทึก Log เพื่อตรวจสอบย้อนกลับ
- Result Review & Validation: ผลการตรวจที่รับจากเครื่องวิเคราะห์ต้องผ่านกระบวนการตรวจสอบและรับรองผล (Technical & Clinical Validation) โดยนักเทคนิคการแพทย์ตามมาตรฐาน ISO 15189 ก่อนรายงานผลให้แพทย์ผู้รักษา`;
  } else if (hasLis) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) สำหรับ LIS (Laboratory Information System):

LIS คือระบบสารสนเทศที่มักเน้นกระบวนการตรวจทางห้องปฏิบัติการทางการแพทย์และการรายงานผลผู้ป่วย มีหน้าที่สำคัญได้แก่:
1. Test Ordering and Specimen Registration: การรับคำสั่งตรวจและลงทะเบียนสิ่งส่งตรวจ
2. Specimen Tracking: การติดตามสถานะและตำแหน่งของสิ่งส่งตรวจ
3. Instrument Interfacing: การเชื่อมต่อกับเครื่องตรวจวิเคราะห์เพื่อรับส่งข้อมูลอัตโนมัติ
4. Result Review and Validation: การตรวจสอบและรับรองผลการตรวจ
5. Result Reporting and Traceability: การรายงานผลและการตรวจสอบย้อนกลับ

ข้อสังเกตเพิ่มเติม:
- ความสามารถด้าน QC, Inventory, Equipment Calibration และฟังก์ชันอื่น ๆ จะขึ้นอยู่กับผลิตภัณฑ์และการติดตั้งของแต่ละระบบ
- มาตรฐาน ISO 15189 เกี่ยวข้องกับคุณภาพและความสามารถของห้องปฏิบัติการทางการแพทย์ (ไม่ใช่การรับรองตัวซอฟต์แวร์ LIS โดยตรง)`;
  } else if (hasLims) {
    selectedText = `คำตอบจำลอง (UI Mock Mode - ไม่ใช่ผลจาก Gemini AI) สำหรับ LIMS (Laboratory Information Management System):

LIMS คือระบบที่มักเน้นการจัดการตัวอย่างและเวิร์กโฟลว์ของห้องปฏิบัติการ (Sample Management & Workflows) มีหน้าที่สำคัญได้แก่:
1. Sample Tracking & Workflow Management: การติดตามตัวอย่างและการจัดการขั้นตอนการทดสอบ
2. Data Management & Traceability: การจัดการข้อมูลเชิงวิเคราะห์และการตรวจสอบย้อนกลับ
3. Inventory & Equipment Management: การจัดการสต็อกและอุปกรณ์ (ขึ้นอยู่กับผลิตภัณฑ์และการติดตั้ง)

ข้อสังเกตเพิ่มเติม:
- ความสามารถของ LIS และ LIMS อาจทับซ้อนกันได้ โดย LIMS ไม่ได้จำกัดหรือกว้างกว่า LIS เสมอไป และไม่ได้จำกัดสถานที่ใช้งานตายตัว
- มาตรฐาน ISO/IEC 17025 เกี่ยวข้องกับความสามารถของห้องปฏิบัติการทดสอบและสอบเทียบ (ไม่ใช่การรับรองตัวซอฟต์แวร์ LIMS โดยตรง)`;
  } else {
    selectedText = `คำตอบจำลอง (Mock Mode) สำหรับ "${queryToSubmit}":

กระบวนการตรวจวิเคราะห์ทางเทคนิคการแพทย์นี้มีความสำคัญต่อการวินิจฉัยและติดตามการรักษาโรค โดยยึดถือตามระบบบริหารคุณภาพห้องปฏิบัติการ (Quality Management System) และมาตรฐานสากล ISO 15189 ทั้งในด้านการควบคุมคุณภาพภายใน (Internal QC) และการประกันคุณภาพภายนอก (EQA) เพื่อให้ได้ผลตรวจที่ถูกต้องแม่นยำและเชื่อถือได้`;
  }

  return { text: selectedText, references: selectedRefs };
}

export default function App() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'knowledge' | 'terms' | 'about'>('home');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const activeRequestId = useRef<number>(Date.now());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "อธิบายหลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว",
    "ความแตกต่างระหว่าง RT-PCR และ Real-Time PCR ในงานตรวจวินิจฉัยโมเลกุล",
    "การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อเดงกี่ (Dengue)",
    "ขั้นตอนการทำ Crossmatching และการตรวจหมู่เลือด Blood Grouping"
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    activeRequestId.current = Date.now();
    setMessages([]);
    setQuestion('');
    setError(null);
    setIsLoading(false);
    setIsPreviewMode(false);
  };

  const handleSendQuestion = async (e?: React.FormEvent, promptText?: string) => {
    if (e) e.preventDefault();
    const queryToSubmit = promptText || question;
    if (!queryToSubmit.trim()) return;

    if (promptText) {
      setQuestion(promptText);
    }

    const userMsgId = String(Date.now());
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: queryToSubmit.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setQuestion('');
    setIsLoading(true);
    setError(null);
    setIsPreviewMode(false);

    const currentReqId = activeRequestId.current;
    const frontendStartTime = Date.now();

    if (isMockMode) {
      setTimeout(() => {
        if (activeRequestId.current !== currentReqId) return;
        const { text: selectedText, references: selectedRefs } = getMockResponse(queryToSubmit, messages);

        const modelMessage: Message = {
          id: String(Date.now() + 1),
          role: 'model',
          text: selectedText,
          source: 'mock_mode_simulator',
          references: selectedRefs,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
      }, 700);
      return;
    }

    try {
      // Turn-aware history trimming: max 8 messages, must start with 'user'
      let trimmed = updatedMessages.slice(-8).map(m => ({
        role: (m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
        text: m.text
      }));
      while (trimmed.length > 0 && trimmed[0].role !== 'user') {
        trimmed.shift();
      }
      const payloadMessages = trimmed;

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const textBody = await res.text();
      const networkAndGenDuration = Date.now() - frontendStartTime;
      console.log(`[Perf Frontend] Fetch request completed in ${networkAndGenDuration}ms`);

      let data: any = {};
      try {
        if (textBody.trim().startsWith("{") || textBody.trim().startsWith("[")) {
          data = JSON.parse(textBody);
        }
      } catch (parseErr) {
        // Not valid JSON
      }

      if (textBody.trim().toLowerCase().startsWith("<!doctype") || textBody.trim().toLowerCase().startsWith("<html")) {
        throw new Error("เซิร์ฟเวอร์ตอบกลับเป็นหน้าเว็บ HTML แทนที่จะเป็น JSON (Unexpected HTML response) กรุณาลองใหม่อีกครั้งในภายหลัง");
      }

      if (!res.ok) {
        throw new Error(data.error || textBody || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }

      if (!data.text) {
        throw new Error(data.error || "ไม่ได้รับข้อมูลคำตอบจากเซิร์ฟเวอร์");
      }

      // Check if conversation was reset while request was in-flight
      if (activeRequestId.current !== currentReqId) {
        console.warn("[Perf Frontend] Stale response discarded due to new chat session.");
        return;
      }

      const modelMessage: Message = {
        id: String(Date.now() + 1),
        role: 'model',
        text: data.text,
        source: data.source || (data.text?.includes("Academic Fallback Mode") ? "academic_fallback" : "gemini_standard"),
        references: data.references && Array.isArray(data.references) ? data.references : undefined,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMessage]);
      console.log(`[Perf Frontend] Total roundtrip duration including render parse: ${Date.now() - frontendStartTime}ms`);
    } catch (err: any) {
      if (activeRequestId.current !== currentReqId) return;
      setError(err.message || "ไม่สามารถติดต่อกับ Gemini API ได้ในขณะนี้");
      console.error(`[Perf Frontend] Error after ${Date.now() - frontendStartTime}ms:`, err.message);
    } finally {
      if (activeRequestId.current === currentReqId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans selection:bg-sky-900 selection:text-sky-200">
      {/* Top Bar Contract (Strict 3-zone layout) */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#334155] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#F1F5F9] whitespace-nowrap shrink-0 flex items-center gap-2">
                MedTech Learning Hub <span className="text-xs font-semibold px-2 py-0.5 bg-sky-950 text-[#7DD3FC] rounded-full border border-sky-800">AI v1.2</span>
              </h1>
              <p className="text-xs text-[#CBD5E1] hidden sm:block">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ (Multi-turn Chat & Grounding)</p>
            </div>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#CBD5E1]">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'home' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'knowledge' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              คลังความรู้
            </button>
            <button 
              onClick={() => setActiveTab('terms')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'terms' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              ศัพท์เทคนิค
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'about' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              เกี่ยวกับระบบ
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {messages.length > 0 && (
              <button 
                onClick={handleNewChat}
                className="px-3 py-2 text-xs font-semibold text-[#7DD3FC] bg-sky-950 hover:bg-sky-900 border border-sky-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                title="เริ่มบทสนทนาใหม่"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>บทสนทนาใหม่</span>
              </button>
            )}
            <button 
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 text-xs font-semibold text-[#F1F5F9] bg-[#1E293B] hover:bg-slate-800 border border-[#334155] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              สถานะระบบ AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {activeTab === 'home' ? (
          <>
            {/* Hero Banner */}
            <section className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] rounded-2xl border border-[#334155] p-6 sm:p-10 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-[#7DD3FC] text-xs font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ (Multi-turn AI Assistant)
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F9] tracking-tight mb-3">
                  ผู้ช่วยอัจฉริยะด้านเทคนิคการแพทย์และห้องปฏิบัติการ
                </h2>
                <p className="text-[#CBD5E1] text-sm sm:text-base leading-relaxed mb-6">
                  สอบถามหลักการตรวจวิเคราะห์ทางห้องปฏิบัติการ ศัพท์ภาษาอังกฤษทางการแพทย์ ถามต่อเนื่องได้หลายเทิร์น พร้อมลิงก์แหล่งอ้างอิงจากเว็บและตำราวิชาการ
                </p>
              </div>
            </section>

            {/* Conversation Thread Area */}
            {messages.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                  <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#7DD3FC]" />
                    ประวัติบทสนทนา (Conversation History - {messages.length} ข้อความ)
                  </h3>
                  <button 
                    onClick={handleNewChat}
                    className="text-xs text-[#7DD3FC] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> ล้างประวัติแชท
                  </button>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col gap-3 p-6 rounded-2xl border ${
                    msg.role === 'user' 
                      ? 'bg-[#1E293B]/60 border-[#334155] ml-8 sm:ml-16' 
                      : 'bg-[#1E293B] border-[#334155] mr-8 sm:mr-16 shadow-md'
                  }`}>
                    {/* Role Header */}
                    <div className="flex items-center justify-between text-xs text-[#CBD5E1]">
                      <span className="font-semibold flex items-center gap-1.5 text-[#7DD3FC]">
                        {msg.role === 'user' ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs">U</div>
                            <span>คำถามของคุณ</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-[#7DD3FC]" />
                            <span>
                              {msg.source === 'academic_fallback' 
                                ? 'ข้อมูลวิชาการสำรอง (Academic Fallback Mode)'
                                : msg.source === 'gemini_grounding'
                                ? 'Gemini AI + Google Search Grounding'
                                : msg.source === 'mock_mode_simulator'
                                ? 'UI Mock Mode — คำตอบจำลอง ไม่ใช่ผลจาก Gemini AI'
                                : 'Gemini AI Standard'}
                            </span>
                          </>
                        )}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message Body */}
                    <div className="prose prose-invert max-w-none text-[#F1F5F9] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {msg.text}
                    </div>

                    {/* References for Model Messages */}
                    {msg.role === 'model' && msg.references && msg.references.length > 0 && (
                      <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 text-xs sm:text-sm space-y-2 mt-2">
                        <h4 className="font-bold text-[#F1F5F9] flex items-center gap-2 text-xs uppercase tracking-wider text-[#7DD3FC]">
                          <BookOpen className="w-3.5 h-3.5" />
                          {msg.source === 'academic_fallback'
                            ? 'ตำราและแหล่งอ้างอิงทางวิชาการ (Academic Textbooks)'
                            : msg.source === 'mock_mode_simulator'
                            ? 'แหล่งอ้างอิงตัวอย่าง (Mock Reference Examples)'
                            : 'แหล่งอ้างอิงที่ตรวจสอบได้ (Google Search Grounding)'}
                        </h4>
                        <ul className="space-y-1.5">
                          {msg.references.map((ref: { title?: string; uri: string; type?: string }, rIdx: number) => (
                            <li key={rIdx} className="flex items-start gap-2">
                              <span className="text-[#7DD3FC] text-xs font-mono mt-0.5">[{rIdx + 1}]</span>
                              <div className="flex-1">
                                <a 
                                  href={ref.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#7DD3FC] hover:underline text-xs sm:text-sm break-all flex items-center gap-1.5"
                                >
                                  <span>{ref.title || ref.uri}</span>
                                  <Globe className="w-3 h-3 shrink-0 opacity-70" />
                                </a>
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {ref.type === 'academic_textbook' ? 'ตำรา/มาตรฐานวิชาการ' : msg.source === 'mock_mode_simulator' ? 'ข้อมูลตัวอย่าง (Mock Data)' : 'เว็บอ้างอิง (Web Search)'}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                <div ref={chatBottomRef} />
              </section>
            )}

            {/* Question Input Section */}
            <section className="bg-[#1E293B] rounded-2xl border border-[#334155] p-6 sm:p-8 shadow-sm">
              <form onSubmit={(e) => handleSendQuestion(e)} className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label htmlFor="question-input" className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#7DD3FC]" />
                    {messages.length > 0 ? "ถามคำถามต่อเนื่อง (Follow-up Question)" : "ตั้งคำถามหรือหัวข้อทางเทคนิคการแพทย์"}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[#7DD3FC] cursor-pointer font-medium bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-800">
                      <input 
                        type="checkbox" 
                        checked={isMockMode} 
                        onChange={(e) => setIsMockMode(e.target.checked)} 
                        className="rounded bg-[#0F172A] border-sky-700 text-sky-600 focus:ring-0 cursor-pointer"
                      />
                      <span>โหมดจำลอง (Mock Mode)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="text-xs text-[#7DD3FC] hover:text-sky-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {isPreviewMode ? "ซ่อนตัวอย่างโครงสร้าง" : "ดูตัวอย่างโครงสร้างคำตอบ"}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="question-input"
                    rows={4}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={messages.length > 0 ? "พิมพ์คำถามต่อเนื่องของคุณ เช่น แล้วต่างกันอย่างไร หรือ ขั้นตอนต่อไปคือ..." : "พิมพ์คำถามด้านเทคนิคการแพทย์ของคุณ เช่น หลักการทำ CBC หรือ Flow Cytometry..."}
                    className="w-full rounded-xl bg-[#0F172A] border border-[#475569] p-4 text-[#F1F5F9] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7DD3FC] focus:border-transparent text-sm sm:text-base resize-none shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Quick Prompt Suggestions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#CBD5E1] font-medium">คำถามแนะนำ:</span>
                    {samplePrompts.slice(0, 2).map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendQuestion(undefined, promptText)}
                        className="text-xs bg-[#0F172A] hover:bg-slate-800 text-[#CBD5E1] border border-[#334155] px-3 py-1.5 rounded-lg transition-colors text-left truncate max-w-[280px] cursor-pointer"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !question.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#7DD3FC]" />
                        <span>กำลังประมวลผล...</span>
                      </>
                    ) : (
                      <>
                        <span>ส่งคำถาม</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Error State if any */}
            {error && (
              <div className="bg-red-950/60 border border-red-900/60 rounded-xl p-6 text-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-100 mb-1">ไม่สามารถประมวลผลคำขอได้</h4>
                  <p className="text-sm text-red-300 whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            )}

            {/* Empty State when no messages */}
            {messages.length === 0 && !isLoading && !isPreviewMode && (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto bg-[#1E293B]/40 rounded-2xl border border-[#334155]">
                <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-[#7DD3FC] flex items-center justify-center mb-4 shadow-sm border border-[#334155]">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h4 className="text-base font-semibold text-[#F1F5F9] mb-1">พร้อมรับคำถามทางเทคนิคการแพทย์แบบต่อเนื่อง</h4>
                <p className="text-xs text-[#CBD5E1] leading-relaxed mb-4">
                  พิมพ์คำถามของคุณ หรือเลือกคำถามตัวอย่างเพื่อเริ่มสนทนากับ Gemini AI
                </p>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-[#0F172A] hover:bg-slate-800 text-[#7DD3FC] border border-[#334155] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#7DD3FC]" />
                  ดูตัวอย่างโครงสร้างคำตอบ
                </button>
              </div>
            )}

            {/* UI Structure Preview Mode */}
            {isPreviewMode && (
              <div className="space-y-6 animate-fadeIn bg-[#1E293B] p-6 rounded-2xl border border-[#334155]">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-4">
                  <span className="font-semibold text-[#F1F5F9]">ตัวอย่างโครงสร้างหน้าจอ 6 ส่วน (สำหรับตรวจสอบการจัดวาง UI):</span>
                  <button 
                    onClick={() => setIsPreviewMode(false)}
                    className="text-[#7DD3FC] hover:underline font-medium cursor-pointer"
                  >
                    ปิดตัวอย่าง
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                    <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">1. คำอธิบายภาษาไทย</h5>
                    <p className="text-xs text-[#CBD5E1]">คำอธิบายหลักการทางเทคนิคการแพทย์เป็นภาษาไทย</p>
                  </div>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                    <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">2. ศัพท์ภาษาอังกฤษที่สำคัญ</h5>
                    <p className="text-xs text-[#CBD5E1]">Complete Blood Count, Flow Cytometry</p>
                  </div>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                    <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">3. คำอ่านออกเสียงและคำแปล</h5>
                    <p className="text-xs text-[#CBD5E1]">คู่มือการออกเสียงและคำแปลศัพท์เทคนิค</p>
                  </div>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                    <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">4. แหล่งอ้างอิงและที่มา</h5>
                    <p className="text-xs text-[#CBD5E1]">ลิงก์แหล่งอ้างอิงจากเว็บหรือตำรามาตรฐาน</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'knowledge' ? (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#7DD3FC]" />
              คลังความรู้เทคนิคการแพทย์ (Knowledge Repository)
            </h2>
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              แหล่งรวมเนื้อหาวิชาการและหัวข้อสำคัญสำหรับนักศึกษาเทคนิคการแพทย์ ครอบคลุมโลหิตวิทยา เคมีคลินิก จุลชีววิทยา และภูมิคุ้มกันวิทยา
            </p>
          </div>
        ) : activeTab === 'terms' ? (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-3">
              <BookMarked className="w-6 h-6 text-[#7DD3FC]" />
              คลังศัพท์เทคนิค (Medical Technology Glossary)
            </h2>
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              รวบรวมคำศัพท์เทคนิคการแพทย์ พร้อมคำแปลและคำอ่านออกเสียงที่จำเป็น
            </p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-3">
              <Info className="w-6 h-6 text-[#7DD3FC]" />
              เกี่ยวกับ MedTech Learning Hub AI
            </h2>
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              แพลตฟอร์มการเรียนรู้อัจฉริยะสำหรับนักศึกษาเทคนิคการแพทย์ไทย ขับเคลื่อนด้วยโมเดล Gemini และระบบสำรองข้อมูลทางวิชาการ
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#334155] bg-[#0F172A] py-6 px-6 text-center text-xs text-[#CBD5E1]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MedTech Learning Hub AI. สำหรับนักศึกษาเทคนิคการแพทย์ไทย</p>
          <p className="text-[#7DD3FC]">ขับเคลื่อนด้วย Gemini API (Multi-turn Support) & Academic Fallback</p>
        </div>
      </footer>

      {/* System Status Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                สถานะการเชื่อมต่อระบบ AI
              </h3>
              <button 
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#CBD5E1]">
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <span>Model Backend:</span>
                <span className="font-mono text-[#7DD3FC]">gemini-3.8-flash</span>
              </div>
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <span>Google Search Grounding:</span>
                <span className="text-emerald-400 font-semibold">Active (Server-side)</span>
              </div>
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <span>Academic Fallback Mode:</span>
                <span className="text-emerald-400 font-semibold">Ready (Robust Auto-Switch)</span>
              </div>
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <span>Multi-turn Conversation:</span>
                <span className="text-emerald-400 font-semibold">Enabled (Max 8 turns)</span>
              </div>
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <span>UI Mock Chat Mode:</span>
                <span className={isMockMode ? "text-amber-400 font-semibold" : "text-slate-400 font-semibold"}>
                  {isMockMode ? "Active (No API Quota)" : "Inactive (Standard API)"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
