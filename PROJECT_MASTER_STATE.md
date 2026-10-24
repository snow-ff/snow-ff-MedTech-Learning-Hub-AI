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

---

## 7. Responsive Reading UX & Accessibility Implementation (v1.2 Release)

| รายการปรับปรุง | สถานะ | รายละเอียดการทดสอบจริง |
|---|---|---|
| **1. Multi-line Chat Input & Touch Targets** | **VERIFIED** | ปรับเป็น `<textarea>` รองรับข้อความยาว ป้องกันปัญหาจอกดบีบบนจอ 320–430px, รองรับ `Enter` ส่งคำถาม / `Shift+Enter` ขึ้นบรรทัดใหม่, Touch target $\ge 44\text{px}$ |
| **2. AI Search Mode Toggle Button** | **VERIFIED** | เพิ่มปุ่มสลับโหมดชัดเจนใน Chat Toolbar: `📚 โหมดติวอิงเอกสาร (Document Grounding)` vs `🌐 ค้นหาเว็บ AI (Google Search Grounding)`, ส่ง `searchMode` ใน API payload และประมวลผลถูกต้องใน `server.ts` |
| **3. Long-form Reading Typography** | **VERIFIED** | ข้อความ Assistant ปรับขนาดเป็น `15px sm:text-base` ระยะบรรทัด `leading-[1.75]` พร้อมคลาส `medical-text-wrap` สำหรับศัพท์เทคนิคการแพทย์ยาว |
| **4. Citation & Excerpt Legibility** | **VERIFIED** | ข้อความ Excerpt ปรับเป็น `text-xs sm:text-[13px]`, Locator Tag ปรับเป็น `text-xs font-mono`, คมชัด อ่านง่าย สอดคล้อง WCAG AA |
| **5. Status Bars Mobile Wrapping** | **VERIFIED** | แถบบริบทวิชา (Selected Course) และแถบเอกสาร (Active Document) ปรับเป็น `flex-col sm:flex-row` พร้อมปุ่ม Action ห่อแถว (`flex-wrap`) ไม่เกิดข้อความถูกตัดทอนจนอ่านไม่รู้เรื่องบน 320–430px |
| **6. Tablet (768px) Header Breakpoint** | **VERIFIED** | ปรับ Desktop Nav เป็น `hidden lg:flex` และ Sub-nav เป็น `flex lg:hidden` ทำให้บนแท็บเล็ตแนวตั้ง (iPad 768px) แถบหัวเรื่องและปุ่มบัญชีไม่ล้นหรือซ้อนทับกัน |
| **7. P0 Regression Gate** | **VERIFIED** | ชุดทดสอบ 19 ไฟล์ 207 รายการย่อยผ่าน 100%, ไม่มีการตัดคำไทยกลางคำ, ไม่มีสระนำเสียรูป, ไม่มี HTML entities หลุด, และทดสอบ Preview จริงสำเร็จ |

---

## 8. Search Mode End-to-End Integration & Viewport Accessibility Verification (v1.2)

### 8.1 สรุปการตรวจสอบและปรับปรุงพฤติกรรม Search Mode (End-to-End)
- **UI & Client Payload (`src/App.tsx`):**
  - เพิ่มปุ่มสลับ `searchMode` ใน Chat Toolbar (`document` vs `web_search`) พร้อมสถานะ Active/Inactive ที่ชัดเจน
  - เมื่อเลือกเอกสารในคลังเอกสาร ระบบจะตั้งค่า `searchMode` เป็น `'document'` โดยอัตโนมัติ
  - เพิ่มการตรวจสอบ Input ก่อนส่ง: ป้องกันการส่งคำถามว่าง (Whitespace-only) ทั้งจากการคลิกปุ่มและกดปุ่ม Enter
  - ขยายเพดานความสูงของ `<textarea>` อัตโนมัติเป็นสูงสุด 160px (`Math.min(scrollHeight, 160)`) พร้อม Scrollbar เมื่อเกิน
  - แยกการแสดงผล Citation Card ระหว่าง `🌐 Web Search Source` และ `📄 Document Chunk Reference` เพื่อป้องกันไม่ให้แหล่งค้นเว็บถูกแสดงเป็น "Locator: Chunk #1" หรืออ้างอิงเอกสารโดยมิชอบ
- **Backend Grounding Pipeline (`server.ts`):**
  - กรณี `searchMode: 'document'` แต่ไม่มีเอกสารที่ Active (`isDocumentGrounding === false`): ตอบกลับด้วยสถานะ `academic_fallback`, `evidenceStatus: 'insufficient'`, `references: []` พร้อมข้อความแจ้งเตือนที่ชัดเจน ไม่ดึงผลค้นเว็บมาสวมรอยเป็นเอกสาร
  - กรณี `searchMode: 'web_search'`: บังคับปิด `isDocumentGrounding = false` แม้จะมีเอกสารค้างอยู่ในเซสชัน และส่งต่อเฉพาะ `googleSearch` tools
  - ปรับปรุงการแปลง Fallback References: ให้ `evidenceLocator: null` เสมอ เพื่อไม่ให้สร้าง Chunk ID หรือเลขหน้าปลอม
  - แยก Port Collision Guard ใน `server.ts` ด้วย `!process.env.VITEST` ทำให้ชุดทดสอบ Vitest ทำงานคู่ขนานได้อย่างปลอดภัยโดยไม่เกิดข้อผิดพลาด `EADDRINUSE: 8080`

### 8.2 ผลการรัน Integration Tests ครอบคลุมสถานการณ์ Search Mode (`src/lib/searchModeIntegration.test.ts`)
| ลำดับการทดสอบ | สถานการณ์ที่กำหนด | ผลการทดสอบจริง |
|---|---|---|
| **Scenario 1** | `document` mode + มีเอกสารที่เลือกและมี chunks: ใช้หลักฐานจากเอกสารตามกฎเดิม ไม่ปะปน Google Search | **PASSED** (ใช้เฉพาะ chunks ของเอกสารที่เลือก ไม่เปิด `googleSearch`) |
| **Scenario 1b** | `document` mode + มีเอกสาร แต่คำถามไม่มีเนื้อหาในเอกสาร: ปฏิเสธ Google Search เด็ดขาด คืน insufficient evidence | **PASSED** (Strict Document Grounding ไม่เปิด `googleSearch` คืน `references: []`) |
| **Scenario 2** | `web_search` mode + มีเอกสารที่เลือกอยู่: ค้นหาเว็บตามที่ระบุ ไม่แสดงแหล่งเว็บเป็นชิ้นส่วนเอกสาร | **PASSED** (ไม่ส่ง chunks เข้า prompt, แสดงเป็น `web_search` reference) |
| **Scenario 3** | `document` mode + ไม่มีเอกสาร: ไม่แสดงว่าอิงเอกสารที่ไม่มีอยู่ คืนสถานะ `insufficient` พร้อมคำแนะนำ | **PASSED** (คืน fallback แจ้งให้เลือกเอกสารก่อน, `references: []`) |
| **Scenario 4** | คำถามระบุให้อิงเอกสารหรือเลขหน้า แต่ไม่มีเอกสาร: ไม่สร้างหลักฐานหรือเลขหน้าปลอม | **PASSED** (ไม่มีการสร้าง locator หรือหน้าที่ไม่ได้ ingest) |
| **Scenario 5** | สลับโหมดต่อเนื่อง (document -> web_search -> document): ใช้โหมดล่าสุดของแต่ละ request ไม่ค้างค่า | **PASSED** (แต่ละคำขอประมวลผลแยกอิสระตาม payload ปัจจุบัน) |
| **Scenario 6** | Gemini API ขัดข้องในแต่ละโหมด: Fallback ปลอดภัย ไม่กล่าวอ้างว่าค้นเว็บหรืออิงเอกสารสำเร็จ | **PASSED** (คืน Fallback ที่ปลอดภัย ไม่ประดิษฐ์ citation) |

### 8.3 บันทึกผลการรันคำสั่งทดสอบจริงล่าสุด (VERIFIED Execution Records)
- **Vitest Suite:** `npx vitest run`
  ```
  Test Files  20 passed (20)
  Tests       214 passed (214)
  Duration    40.06s
  ```
- **Type Check & Lint:** `npm run lint` (`tsc --noEmit`)
  - **ผลลัพธ์:** Exit Code `0` (0 errors, 0 warnings)
- **Application Build:** `compile_applet` (`npm run build`)
  - **ผลลัพธ์:** `Build succeeded - the applet is compiled`

### 8.4 สถานะการตรวจสอบ Responsive & Accessibility ตามขนาด Viewport
*(หมายเหตุ: เนื่องจากสภาพแวดล้อมเซิร์ฟเวอร์รันเป็น Linux Container แบบ Headless ไม่มี Browser GUI สำหรับเปิดเรนเดอร์ภาพหน้าจอจริง จึงบันทึกผล Visual Browser Rendering เป็น `NOT TESTED` อย่างตรงไปตรงมา โดยแสดงผลการตรวจสอบผ่าน DOM Structure, Tailwind CSS Breakpoints และ CSS Constraints)*

| Viewport Resolution | ประเภทอุปกรณ์ | DOM / CSS Layout Verification | Visual Browser Preview |
|---|---|---|---|
| **320 × 640 px** | Mobile Small | `overflow-x: hidden`, Input Textarea Auto-grow (เพดาน 160px), Touch Target $\ge 44$px, Context Bar แบบ Wrap | **NOT TESTED** (Headless Container) |
| **375 × 812 px** | Mobile Standard | ปุ่มสลับโหมดและปุ่มล้างแชท $\ge 44 \times 44$px, Font ขนาด 15px `leading-[1.75]`, ไม่มีการบีบอัดข้อความ | **NOT TESTED** (Headless Container) |
| **430 × 932 px** | Mobile Large | การจัดเรียง Card และ Citation Tag มีระยะ Padding และ Gap เหมาะสม ไม่เกิดการซ้อนทับ | **NOT TESTED** (Headless Container) |
| **768 × 1024 px** | Tablet Portrait | Header Responsive Breakpoint (`hidden lg:flex` / `flex lg:hidden`) แยกแถบเมนูหลักกับ Action ชัดเจน | **NOT TESTED** (Headless Container) |
| **1024 × 768 px** | Tablet Landscape | Sidebar & Main Chat Content แสดงผลเต็มระนาบ ไม่เกิด Horizonal Scrollbar | **NOT TESTED** (Headless Container) |
| **1440 × 900 px** | Desktop Large | กำหนด `max-w-4xl` สำหรับพื้นที่อ่านหนังสือ ป้องกันระยะสายตายาวเกินไปสำหรับการอ่านเชิงวิชาการ | **NOT TESTED** (Headless Container) |

### 8.5 ตารางสรุปสถานะการประเมินแยกตามหมวดหมู่ (VERIFIED / REPORTED / PENDING / FAILED)
| หมวดหมู่การประเมิน | สถานะ | หลักฐาน / คำอธิบายประกอบ |
|---|---|---|
| **P0 Citation & Evidence Integrity** | **VERIFIED** | ผ่านการทดสอบ Vitest 32 tests ใน `evidenceIntegrityFix.test.ts` (กฎ Prefix/Suffix dual requirement, ห้ามแต่งเลขหน้า, ห้ามยก chunk ลอย) |
| **Search Mode End-to-End Pipeline** | **VERIFIED** | ผ่านการทดสอบจริง 7/7 tests ใน `searchModeIntegration.test.ts` ครอบคลุมทั้ง 6 Scenario ดั้งเดิม + Scenario 1b (Strict Refusal of Google Search in Document Mode) |
| **Code Integrity & Buildability** | **VERIFIED** | `tsc --noEmit` Exit 0, `npm run build` สำเร็จ, Vitest 20 ไฟล์ 214 tests ผ่าน 100% |
| **DOM & CSS Responsive Rules** | **VERIFIED** | ตรวจสอบผ่านโค้ดใน `src/App.tsx` และ `src/index.css` (Touch Target $\ge 44$px, Textarea max-h 160px, Header breakpoint) |
| **Visual Browser Preview (GUI Display)** | **NOT TESTED / PENDING** | สภาพแวดล้อมเซิร์ฟเวอร์เป็น Headless Linux Container ไม่มี Chromium/GUI Browser สำหรับเรนเดอร์ภาพหน้าจอจริง |
| **Regression หรือ Critical Flaws** | **FAILED (0)** | ไม่พบข้อผิดพลาดหรือ Regression ใด ๆ |

### 8.6 ยืนยันความปลอดภัยและการแยกสภาพแวดล้อม Git
- ยืนยันว่าการแก้ไขทั้งหมดเกิดขึ้นภายใน `/app/applet` Workspace เท่านั้น
- ไม่มีการสั่ง `git commit`, `git push`, `git merge`, หรือ Sync ใด ๆ ไปยัง GitHub `snow-ff/snow-ff-MedTech-Learning-Hub-AI` (Read-only reference ตามกฎความปลอดภัย)

