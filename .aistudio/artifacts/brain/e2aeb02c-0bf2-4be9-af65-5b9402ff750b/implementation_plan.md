# แผนแก้ไข Default Academic Fallback ใน server.ts

## 1. วัตถุประสงค์ (Objective)
แก้ไขข้อบกพร่องของฟังก์ชัน `getAcademicFallback(prompt: string)` ใน `server.ts` ซึ่งปัจจุบันเมื่อได้รับคำถามที่ไม่ตรงกับหัวข้อที่รองรับ จะแสดงเนื้อหา QMS01, EP23 และ EP28-A3c เป็นค่าเริ่มต้น (Default Fallback) เปลี่ยนเป็นคืนข้อความแจ้งเตือนที่ชัดเจนว่าไม่มีข้อมูลสำรองเฉพาะหัวข้อนั้น พร้อมคำแนะนำให้ระบุหัวข้อให้ชัดเจน โดยยังคงรักษาหัวข้อเฉพาะเดิมทั้งหมด (Serum/Plasma, Flow Cytometry, PCR, Gram Stain, Dengue, CBC, Crossmatching) และเพิ่มเงื่อนไขตรวจจับคำถามด้าน Quality Management System (QMS) แยกต่างหาก

---

## 2. ขอบเขตการเปลี่ยนแปลง (Scope of Changes)
- **ไฟล์เป้าหมาย**: เฉพาะ `server.ts` ในฟังก์ชัน `getAcademicFallback()`
- **สิ่งที่ต้องทำ**:
  1. เพิ่มเงื่อนไขตรวจสอบคำถามเกี่ยวกับ QMS (`p.includes("qms") || p.includes("quality management") || p.includes("บริหารคุณภาพ") || p.includes("คุณภาพห้องปฏิบัติการ")`) แยกออกเป็น `else if` เฉพาะ แทนที่จะปล่อยให้ตกลงมาเป็น Default Fallback ทั่วไป
  2. ปรับบล็อก `else` (Default Fallback สำหรับคำถามที่ไม่ตรงกับหัวข้อใดๆ) ให้คืนข้อความแจ้งเตือนภาษาไทยที่ตรงไปตรงมาว่า:
     * *"ขออภัย ระบบไม่พบข้อมูลสำรองทางวิชาการ (Academic Fallback) เฉพาะสำหรับหัวข้อที่คุณสอบถาม กรุณาระบุชื่อหัวข้อหรือคีย์เวิร์ดที่รองรับให้ชัดเจน (เช่น Serum, Plasma, Flow Cytometry, PCR, Gram Stain, Dengue, CBC, Crossmatching หรือ QMS)"*
     * พร้อม references ว่างหรือลิงก์คู่มือหลัก
  3. คงหัวข้อและ mapping เดิมทั้งหมดไว้ ไม่แก้ไข keyword matching ของ Serum/Plasma, PCR, Flow Cytometry, Gram Stain, Dengue, CBC, Crossmatching

---

## 3. ส่วนโค้ดที่จะแก้ไข (Target Code Specification in `server.ts`)

### ตัวอย่างโครงสร้างใหม่ใน `getAcademicFallback`:
```ts
  } else if (p.includes("qms") || p.includes("quality management") || p.includes("บริหารคุณภาพ") || p.includes("คุณภาพห้องปฏิบัติการ")) {
    return {
      text: prefixNotice + `**ระบบบริหารคุณภาพห้องปฏิบัติการ (Quality Management System)**\n...`,
      references: [ ... ]
    };
  } else {
    return {
      text: prefixNotice + `**ข้อความแจ้งเตือน: ไม่พบข้อมูลสำรองเฉพาะหัวข้อ**\n\nขออภัย ระบบไม่พบข้อมูลสำรองทางวิชาการ (Academic Fallback) เฉพาะสำหรับหัวข้อที่คุณสอบถามในโหมดออฟไลน์/โควตาเต็ม กรุณาระบุชื่อหัวข้อทางเทคนิคการแพทย์ที่รองรับให้ชัดเจน เช่น:\n- Serum / Plasma (ซีรั่ม / พลาสมา)\n- Flow Cytometry\n- PCR / qPCR\n- Gram Stain (ย้อมสีแกรม)\n- Dengue / ไข้เลือดออก (CBC ในเดงกี่)\n- Complete Blood Count (CBC)\n- Crossmatching / หมู่เลือด\n- Quality Management System (QMS)`,
      references: []
    };
  }
```

---

## 4. ความเสี่ยงและการจัดการ (Risks & Mitigation)
- **ความเสี่ยง 1**: ผู้ใช้ที่เคยชินกับคำตอบ QMS ทั่วไปเมื่อถามคำถามนอกเหนือจากหัวข้อหลักอาจได้รับข้อความแจ้งเตือนแทน
  - **การบรรเทา**: เป็นพฤติกรรมที่ถูกต้องตามข้อกำหนดใหม่ (ไม่อ้างอิง QMS กับคำถามที่ไม่เกี่ยวข้อง) และข้อความแนะนำจะช่วยให้ผู้ใช้ระบุหัวข้อได้ถูกต้อง
- **ความเสี่ยง 2**: การกระทบกระเทือนต่อฟังก์ชันอื่น
  - **การบรรเทา**: จำกัดการแก้ไขเฉพาะภายในฟังก์ชัน `getAcademicFallback()` ใน `server.ts` โดยไม่แตะต้อง endpoint `/api/gemini/generate` หรือส่วน frontend ใดๆ

---

## 5. เกณฑ์การยอมรับ (Acceptance Criteria & Test Cases)

### กรณีทดสอบที่ 1: คำถามที่ไม่รองรับ (Unsupported Question)
- **Input Prompt**: `"คำถามทั่วไปเกี่ยวกับประวัติศาสตร์ไทย หรือเรื่องรอบตัวที่ไม่เกี่ยวกับห้องปฏิบัติการ"`
- **Expected Output**: ได้รับข้อความแจ้งเตือนจาก Default Fallback ว่าไม่มีข้อมูลสำรองเฉพาะหัวข้อ พร้อมคำแนะนำหัวข้อที่รองรับ โดยไม่มีเนื้อหา QMS ปะปน

### กรณีทดสอบที่ 2: คำถาม QMS ที่รองรับ (QMS Supported Question)
- **Input Prompt**: `"ขอข้อมูลระบบบริหารคุณภาพ QMS ในห้องปฏิบัติการ"`
- **Expected Output**: ได้รับข้อมูลเนื้อหา QMS01, EP23 และ EP28-A3c พร้อม references ที่ถูกต้องจากเงื่อนไข QMS เฉพาะ

### กรณีทดสอบที่ 3: คำถาม Serum/Plasma ที่รองรับ (Serum/Plasma Supported Question)
- **Input Prompt**: `"ความแตกต่างระหว่าง serum และ plasma คืออะไร"`
- **Expected Output**: ได้รับเนื้อหาเปรียบเทียบ Serum และ Plasma พร้อม references ของ StatPearls และ CLSI H03 ตามเดิมอย่างครบถ้วน
