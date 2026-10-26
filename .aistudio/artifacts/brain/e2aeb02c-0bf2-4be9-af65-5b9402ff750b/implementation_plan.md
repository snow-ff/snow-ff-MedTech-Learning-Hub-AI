# รายงานการแก้ไขข้อบกพร่อง P0 Evidence Integrity Remediation

**โครงการ:** MedTech Learning Hub AI v1.2  
**สถานะปัจจุบัน:**  
- **P0 Evidence Integrity Status:** **OPEN** (รอผลการทดสอบยืนยันใน Google AI Studio Preview จริง)  
- **AC-10 Status:** **PENDING** (รอผลการทดสอบการใช้งานจริงใน Preview)  
- **Automated Verification:** **PASSED** (37/37 tests ใน `evidenceIntegrityFix.test.ts` และ 12/12 tests ใน `dtm67111OfflineGrounding.test.ts`)  
- **Build / Lint:** **CLEAN** (TypeScript `tsc --noEmit` 0 errors, `compile_applet` success)

---

## 1. สรุปผลการแก้ไขตามขอบเขตที่ได้รับอนุมัติ (Minimal Remediation)

### A. `server.ts` — Evidence Consistency & Fallback Isolation
1. **Clause-level Evaluation สำหรับคำถาม Definition + Examples:**
   - เพิ่มตัวแปร `asksExamples` เพื่อแยกคำถามที่ขอ "ตัวอย่าง" ออกจากคำถามที่ขอเฉพาะ "ความหมาย/นิยาม"
   - เมื่อคำถามขอทั้งสองส่วน (`asksDefinitionOrFunction && asksExamples`) Chunks ที่มีตัวอย่างทางคลินิก (เช่น Chunks 6, 10, 11) จะได้รับการประเมินเป็น `source_grounded` ไม่ถูกปฏิเสธเป็น `unsupported_citation` โดยมิชอบ
   - ป้องกันการประเมินผิดพลาดแบบหละหลวม โดย Chunks ต้องมี clause ที่นิยามหรือระบุตัวอย่างจริง การมีเพียงคำว่า "Prefix" หรือ "Suffix" แบบลอย ๆ จะไม่นับเป็นหลักฐานรองรับ
2. **Strict Fallback Citations Isolation:**
   - ปรับ `getAcademicFallback` ให้จัดรูปแบบ `groundedCitations` **เฉพาะจาก `groundedChunks`** เท่านั้น
   - ตัดเนื้อหาจาก `unsupportedChunks` ออกจาก `finalFallbackText` ทั้งหมด เพื่อไม่ให้ข้อความคำตอบหลุดข้ออ้างที่ไม่มีหลักฐานรองรับ
   - หากตรวจพบว่ามีหัวข้อคำถามใดขาดหลักฐาน (เช่น ขาด Suffix) ระบบจะแสดง `⚠️ คำเตือนความครอบคลุมของหลักฐาน (Partial Evidence Notice)` ระบุหัวข้อที่ขาดชัดเจน และตั้งสถานะ `evidenceStatus: 'insufficient'`, `verdict: 'WARNING'`
   - หากมี unsupported chunks ที่ถูกตัดออก ระบบบันทึกรายการใน `verification.stages.evidenceFidelity.unsupportedCitations` เพื่อความโปร่งใส และปรับ `verdict: 'WARNING'`
3. **Safe Locator Fallback:**
   - แก้ไขการแปลง `evidenceLocator` ใน `/api/chat` จากเดิมที่ใช้ `|| 'ชิ้นส่วนที่ 1'` (ซึ่งแต่งเลขชิ้นส่วนที่ 1 ปลอม) ให้เป็น `|| null`

### B. `src/lib/documentChunker.ts` — Robust Locator Entity Sanitization
1. **Multi-Pass HTML Entity Decoding:**
   - ถอดรหัส HTML entities แบบวนซ้ำจนกว่าจะไม่พบรูปแบบ entity (รองรับ `&#x34;`, `&#52;`, `&amp;#x34;` และ double/triple encodings)
2. **Safe Digit Extraction:**
   - ดึงเฉพาะตัวเลขจำนวนเต็มบวกด้วย regex `/(\d+)/`
   - คืนค่า `ชิ้นส่วนที่ <N>` หรือ `หน้า <P>` (กรณีมี native page)
   - หากไม่มีตัวเลขหรือยืนยันไม่ได้ จะคืนค่า `''` (empty string) ทันที ห้ามเดาหรือ fallback เป็นชิ้นส่วนที่ 1

### C. `src/App.tsx` — Reference Cards Whitelist & Warning Transparency
1. **Strict Whitelist สำหรับ Document Grounding:**
   - กรอง Reference Cards ในโหมด Document Grounding ให้แสดงเฉพาะ `r.verificationStatus === 'source_grounded'` เท่านั้น
   - รายการที่มีสถานะ `unverified`, `unsupported_citation`, `undefined` หรือ `null` จะถูกคัดกรองออกจากการแสดงผลหลัก
2. **Safe Locator Badge Rendering:**
   - ใช้ `cleanChunkLocator(ref.evidenceLocator) || 'ไม่ระบุหมายเลข'` ป้องกัน entity หลุดไปยังหน้าจอผู้ใช้
3. **Transparent Warning Notice:**
   - แสดงกล่องข้อความเตือนเมื่อมีหลักฐานถูกคัดออก: `"ระบบตรวจพบชิ้นส่วนเอกสารที่ไม่สนับสนุนคำถามหรือยังไม่ผ่านการยืนยัน (X ชิ้นส่วน) และได้ตัดออกจากการแสดงผลเพื่อความถูกต้องทางวิชาการ (คำตอบครอบคลุมเฉพาะประเด็นที่มีหลักฐานยืนยันได้)"`

---

## 2. ผลการรัน Regression Tests

| ชุดทดสอบ | ผลลัพธ์ | รายละเอียด |
|---|---|---|
| `src/lib/evidenceIntegrityFix.test.ts` (37 tests) | **PASSED** (37/37) | ครอบคลุม Test A ถึง Test AJ |
| `src/lib/dtm67111OfflineGrounding.test.ts` (12 tests) | **PASSED** (12/12) | Ground truth retrieval และ verification ครบถ้วน |
| TypeScript Compiler (`tsc --noEmit`) | **CLEAN** | 0 errors |
| Vite Applet Compilation (`compile_applet`) | **SUCCESS** | Build succeeded |

### รายละเอียด Regression Tests ใหม่ที่เพิ่มขึ้น:
- **Test AC (Updated):** บังคับ Assert ให้ทั้ง Prefix และ Suffix มี Reference ที่มีสถานะ `source_grounded` อย่างแท้จริง
- **Test AG:** ทดสอบการถอดรหัส Locator Entity (`&#x34;`, `&amp;#x34;`, `ชิ้นส่วนที่ &#x34;`, และกรณีไม่มีตัวเลขคืนค่าว่างไม่ fallback เป็น 1)
- **Test AH:** ทดสอบฟังก์ชันคัดกรอง Reference Card กรองเฉพาะ `source_grounded` และตัด `unsupported_citation`, `unverified`, `undefined`, `null`
- **Test AI:** ตรวจสอบว่าคำตอบ fallbackText ไม่รั่วไหลข้อความหรือการอ้างอิงจากชิ้นส่วนที่ไม่สนับสนุน (เช่น ตารางเวร)
- **Test AJ:** Negative Suffix Test ยืนยันว่าหากเอกสารมีเฉพาะ Prefix จะต้องไม่สรุปตัวอย่าง Suffix เป็นข้อเท็จจริง และต้องขึ้น Partial Evidence Notice

---

## 3. สิ่งที่ต้องปฏิบัติต่อไป (Next Verification Step)

เนื่องจากระบบยังอยู่ในสถานะ:
- **P0: OPEN**
- **AC-10: PENDING**

การปิดสถานะ P0 และ AC-10 อย่างเป็นทางการ จะกระทำได้ต่อเมื่อทำการทดสอบจริงบน **Google AI Studio Preview UI** ด้วยคำถามทดสอบเดิม:
- เลือกเอกสาร `dtm67 111 source` รหัสวิชา `DTM67-111`
- ซักถามเรื่อง Prefix และ Suffix พร้อมยกตัวอย่าง
- ยืนยันว่า:
  1. Reference cards แสดงทั้งชิ้นส่วนของ Prefix และ Suffix ที่ผ่านการตรวจสอบ (`source_grounded`)
  2. Locator แสดงเป็นข้อความภาษาไทยที่สะอาด เช่น `ชิ้นส่วนที่ 4`, `ชิ้นส่วนที่ 6` ปราศจาก `&#x34;` หรือ entity ใด ๆ
  3. คำตอบสอดคล้องกับการ์ดหลักฐาน และไม่มีข้ออ้างเกินจริง
