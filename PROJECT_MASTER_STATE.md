# PROJECT_MASTER_STATE: MedTech Learning Hub AI v1.2
**สถานะการบันทึก:** ล่าสุด ณ วันที่ 23 ตุลาคม 2026  
**สภาพแวดล้อมการทำงาน:** Google AI Studio Workspace (`/app/applet`) เท่านั้น  
**นโยบาย Git & Repository:** GitHub `main` ทำหน้าที่เป็นเอกสารอ้างอิงแบบ Read-only เท่านั้น (ห้าม push, commit, sync หรือแก้ไขข้อมูลบน GitHub โดยเด็ดขาด)

---

## 1. ผลการจัดประเภทตามหลักฐานจริง (Evidence-Based Taxonomy)

| มิติการประเมิน | สถานะ | ประเภทหลักฐาน | รายละเอียดและข้อสรุป |
|---|---|---|---|
| **1. Citation Grammar Rejection** | **VERIFIED** | คำสั่งทดสอบจริงใน Workspace | ปฏิเสธรูปแบบ `[chunk ชิ้นส่วนที่ 2]` และ hybrid formats รวม 9 แบบใน Test R อย่างเด็ดขาด |
| **2. Clause-Level Evidence Isolation** | **VERIFIED** | โค้ดจริงและชุดทดสอบ Vitest | ตรวจจับนิยาม Prefix/Suffix แยกรายอนุประโยค (Clause) ไม่ให้ข้ามประโยคหรือข้าม Chunk |
| **3. Multi-part & Incomplete Coverage** | **VERIFIED** | ชุดทดสอบ Test P, S, T, U, V, W | กรณีหลักฐานไม่ครบถ้วน Answer-level จะเป็น `insufficient` / `overgeneralized` เสมอ |
| **4. Positive Controls** | **VERIFIED** | ชุดทดสอบ Test Q, X | มีหลักฐานแท้จริงครบทั้งสองส่วนผ่านการประเมิน `PASS` และ `source_grounded` (ไม่เกิด False Negative) |
| **5. Test Suite Execution (Vitest)** | **VERIFIED** | บันทึก Output คำสั่งจริง | ผ่าน 19 ไฟล์ทดสอบ, 197 รายการย่อยครบ 100% |
| **6. TypeScript & Build Status** | **VERIFIED** | บันทึก Output คำสั่งจริง | `tsc --noEmit` ผ่าน 0 errors และ `npm run build` สำเร็จสมบูรณ์ |
| **7. Workspace Git Blob Hashes** | **VERIFIED** | `git hash-object` ใน Workspace | คำนวณ Hash ของ 3 ไฟล์จริง ไม่มีการแต่งค่า Hash |
| **8. GitHub main Commit State** | **REPORTED** | ข้อมูลจากรายงานประวัติการตรวจสอบ | Commit `52860c10c8857f6149394a33ad6849d388493939` ใช้เป็นจุดเปรียบเทียบภายนอก |
| **9. Semantic Verification Limitation** | **REPORTED** | ข้อจำกัดเชิงทฤษฎีและสถาปัตยกรรม | Regex ไม่สามารถรับประกันความหมายทางวิชาการ 100% ในทุกบริบท |
| **10. Pending Tasks & Unfixed Bugs** | **NONE (0)** | ตรวจสอบครบทุกจุด | ไม่มีข้อผิดพลาดค้างใน Scope การตรวจปัจจุบัน |

---

## 2. รายละเอียดสถาปัตยกรรมและความสมบูรณ์ของระบบ

### 2.1 ไวยากรณ์การอ้างอิง (Citation Grammar & Delimiter Enforcement)
- **ไฟล์ที่เกี่ยวข้อง:** `src/lib/academicVerifier.ts` (Check 3a)
- **ตรรกะการตรวจสอบ:** Regex `VALID_CITATION_SYNTAX`
  ```regex
  ^\[\s*(?:chunk[\s:]*(\d+)|ชิ้นส่วนที่[\s:]*(\d+)|ส่วนอ้างอิง[\s:]*(?:ชิ้นส่วนที่[\s:]*)?(\d+))(?:\s*[|,]\s*(?:หน้า|page)\s*(\d+))?\s*\]$
  ```
- **การจำแนกประเภท (Isolation):**
  - **รูปแบบที่ถูกต้อง:** `[chunk 1]`, `[ชิ้นส่วนที่ 2]`, `[ส่วนอ้างอิง 13]`, `[ส่วนอ้างอิง: ชิ้นส่วนที่ 2]`, `[chunk 1, page 3]`
  - **รูปแบบลูกผสมที่ถูกปฏิเสธ (Malformed Citation):** `[chunk ชิ้นส่วนที่ 2]`, `[chunk abc 2]`, `[chunk null 2]`, `[chunk 2 abc]`, `[chunk null]`, `[chunk undefined]`, `[chunk NaN]`, `[ชิ้นส่วนที่ abc]`, `[ส่วนอ้างอิง: ]`
  - **วงเล็บที่ไม่ใช่ Citation:** วงเล็บศัพท์เทคนิคการแพทย์ เช่น `[CBC]`, `[EDTA]` และวลีภาษาไทยทั่วไป เช่น `"ชิ้นส่วนที่นำมาตรวจ..."` ถูกละเว้น ไม่ถูกตรวจจับผิดพลาด (0 False Positives)
- **ชุดทดสอบ Regression:** `Test R` ใน `src/lib/evidenceIntegrityFix.test.ts` ยืนยันการตรวจจับครบทั้ง 9 รูปแบบผิดพลาด

---

### 2.2 การตรวจหลักฐานระดับประโยค/อนุประโยค (Clause-Level Evidence Integrity)
- **ไฟล์ที่เกี่ยวข้อง:** `src/lib/academicVerifier.ts`, `server.ts`
- **การแบ่งส่วนข้อความ:**
  ```typescript
  const clauses = text.split(/(?:\r?\n+|[.;|•\u2022]+|\s{2,}|ฯ|ฯลฯ)/).map(s => s.trim()).filter(Boolean);
  ```
- **เงื่อนไขการตรวจสอบเนื้อหา (Morpheme Predicates):**
  - `hasPrefixDef`: อนุประโยคต้องมีคำว่า prefix/คำอุปสรรค ร่วมกับคำอธิบายตำแหน่ง/นิยาม (หน้าคำ/ก่อนคำ/นำหน้า) ภายในประโยคเดียวกัน
  - `hasSuffixDef`: อนุประโยคต้องมีคำว่า suffix/ปัจจัยท้าย ร่วมกับคำอธิบายตำแหน่ง/นิยาม (ท้ายคำ/หลังคำ/ต่อท้าย) ภายในประโยคเดียวกัน
  - `hasPrefixEx` / `hasSuffixEx`: ตรวจจับตัวอย่างหน่วยคำเฉพาะ เช่น `brady-`, `tachy-`, `-itis`, `-scopy`
- **การป้องกัน False Positive:**
  - การมีคำว่า `prefix` และ `suffix` กระจายคนละ Chunk ไม่สามารถเชื่อมกันเป็น composite definition ได้ (ป้องกันโดย Test S)
  - การมีนิยาม Prefix ในประโยคที่ 1 และมีเพียงคำว่า suffix ในประโยคที่ 2 (เช่น "มีเอกสารแจกสัปดาห์หน้า") ไม่ถูกนับว่ามีหลักฐาน suffix (ป้องกันโดย Test V)
  - การมีนิยาม Suffix ในประโยคที่ 1 และมีคำว่า prefix ในประโยคที่ 2 (เช่น "ให้นักศึกษาทำแบบฝึกหัด") ไม่ถูกนับว่ามีหลักฐาน prefix (ป้องกันโดย Test W)
  - การมีเฉพาะตัวอย่างหน่วยคำลอย ๆ (Raw Examples) โดยไม่มีนิยาม ไม่สามารถผ่านคำถามที่ต้องการนิยามหรือหน้าที่ได้ (ป้องกันโดย Test U)
  - Decoupling ระดับคำตอบและเอกสารอ้างอิง: Chunk ที่มีหลักฐานจริงสำหรับส่วนใดส่วนหนึ่งยังคงสถานะ `source_grounded` อย่างถูกต้อง ในขณะที่ Answer-level สรุปเป็น `insufficient`

---

## 3. ข้อมูลการเปรียบเทียบ Workspace vs GitHub

### 3.1 หลักฐานที่ยืนยันได้จริงใน Workspace (VERIFIED)
คำนวณค่า Git Object Hash จากไฟล์จริงในสภาพแวดล้อม `/app/applet` ด้วยคำสั่ง `git hash-object`:

1. `server.ts`
   - **Workspace Blob SHA-1:** `2582d27d8bfe9c31a394e74ce40a00377d1b8a7c`
   - **สถานะ:** ตรงกันสมบูรณ์กับ GitHub `main`
2. `src/lib/academicVerifier.ts`
   - **Workspace Blob SHA-1:** `a9e113ea63f68ccc471bf0fe183174c882594478`
   - **สถานะ:** ปรับปรุง Check 3a เพื่อป้องกัน nested hybrid citation `[chunk ชิ้นส่วนที่ 2]`
3. `src/lib/evidenceIntegrityFix.test.ts`
   - **Workspace Blob SHA-1:** `3057e2dd428d77d3a8250b0dd99168cf9667d626`
   - **สถานะ:** เพิ่มเคสทดสอบ `[chunk ชิ้นส่วนที่ 2]` ใน Test R (ตรวจจับครบ 9 รายการ)

### 3.2 ข้อมูลเปรียบเทียบภายนอกจากประวัติการรายงาน (REPORTED)
อ้างอิงจาก Commit `52860c10c8857f6149394a33ad6849d388493939` บน GitHub `main`:
- GitHub `server.ts` Blob SHA-1: `2582d27d8bfe9c31a394e74ce40a00377d1b8a7c`
- GitHub `src/lib/academicVerifier.ts` Blob SHA-1: `854b7cd14116e33a2d4af668ae00ba95b7bc6239`
- GitHub `src/lib/evidenceIntegrityFix.test.ts` Blob SHA-1: `7155fefc55ec2bde4e750098a7fd4daafc04cf27`

*(หมายเหตุ: พื้นที่ Workspace ไม่มีสิทธิ์ในการเชื่อมต่อแบบ Write ไปยัง GitHub main ตามนโยบายความปลอดภัย)*

---

## 4. บันทึกผลการรันคำสั่งทดสอบจริง (VERIFIED Execution Records)

### 4.1 Unit & Integration Tests
- **คำสั่ง:** `npx vitest run`
- **สภาพแวดล้อม:** Node.js v20+ / Vitest v5.0.4
- **ผลลัพธ์จริง:**
  ```
  Test Files  19 passed (19)
  Tests       197 passed (197)
  Duration    11.63s
  ```
- **ชุดทดสอบหลัก:**
  - `src/lib/evidenceIntegrityFix.test.ts` (24 tests: ครอบคลุม Tests A–X)
  - `src/lib/academicAnswerVerification.test.ts` (11 tests)
  - `src/lib/dtm67111OfflineGrounding.test.ts` (12 tests)
  - `src/lib/dtm67111SourceIngestion.test.ts` (14 tests)
  - `src/lib/cbcGroundTruthIngestion.test.ts` (8 tests)
  - `src/lib/realDocumentValidation.test.ts` (17 tests)
  - `src/lib/referencesIntegrity.test.ts` (9 tests)
  - `src/lib/verificationPipelineIntegration.test.ts` (14 tests)
  - `src/lib/documentChunker.test.ts` (10 tests)
  - `src/lib/documentStorage.test.ts` (4 tests)
  - และชุดทดสอบอื่น ๆ รวม 19 ไฟล์

### 4.2 การตรวจสอบ Type & ไวยากรณ์ (Lint)
- **คำสั่ง:** `npm run lint` (`tsc --noEmit`)
- **ผลลัพธ์จริง:** รหัสส่งกลับ `0` (ไม่มี Error หรือ Warning ค้าง)

### 4.3 การคอมไพล์โปรแกรม (Build)
- **คำสั่ง:** `compile_applet` (`npm run build`)
- **ผลลัพธ์จริง:** `Build succeeded - the applet is compiled`

---

## 5. ข้อจำกัดทางเทคนิคและสมมติฐาน (Technical Limitations)

1. **Deterministic Rule & Regex Heuristics vs Semantic Comprehension:**
   - การตรวจสอบการอ้างอิงและหลักฐานในระบบใช้การแบ่งส่วนข้อความระดับประโยค (Clause Splitting) ผสานกับ Regular Expressions และ Rule-based Scoring
   - แม้ว่าจะสามารถขจัดปัญหา Hallucination, Citation Fabrications และ Keyword Matching ผิวเผินได้อย่างมีนัยสำคัญ แต่ **ไม่เทียบเท่ากับการตีความความหมายทางภาษาศาสตร์ (Formal Semantic / Natural Language Understanding) 100%**
2. **ขอบเขตการรับประกัน:**
   - ห้ามสรุปว่าระบบปลอดจากช่องโหว่ในทุกกรณี (No Universal Zero-Vulnerability Guarantee)
   - หากผู้ใช้ป้อนเอกสารที่มีโครงสร้างทางภาษาที่ซับซ้อนเป็นพิเศษ หรือเอกสารที่มีการใช้คำศัพท์เฉพาะทางในบริบทกำกวม ระบบอาจต้องอาศัยการปรับปรุง Rule-set เพิ่มเติมในอนาคต

---

## 6. แผนงานถัดไป (Next Steps)

1. **รักษาสถานะ Workspace:** ไม่ทำการแก้ไขโค้ดเพิ่มเติม และไม่ทำ Audit ทั้งระบบซ้ำในส่วนที่ผ่านการตรวจสอบแล้ว
2. **ไม่เพิ่มฟีเจอร์นอกขอบเขต:** คงสถานะ MedTech Learning Hub AI v1.2 ให้มีเสถียรภาพสูงสุด
3. **การส่งมอบและการบันทึก:** ใช้เอกสาร `PROJECT_MASTER_STATE.md` ฉบับนี้เป็น Single Source of Truth สำหรับสถานะโครงการ
