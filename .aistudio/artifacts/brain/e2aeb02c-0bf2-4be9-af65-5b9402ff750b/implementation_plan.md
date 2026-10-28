# รายงานสรุปผลการแก้ปัญหา P0 Source Locator Provenance & Preview HMR Diagnosis

**โครงการ:** MedTech Learning Hub AI v1.2  
**สภาพแวดล้อม:** Google AI Studio Workspace (`/app/applet`) เท่านั้น (GitHub `snow-ff/snow-ff-MedTech-Learning-Hub-AI` `main` ใช้เปรียบเทียบแบบอ่านอย่างเดียว ไม่มีการแก้ไขหรือ Push)

---

## 1. Root Cause ของ Source Locator ที่พบใน Workspace

1. **`hasHeadingMatch` เดิมใช้ Loose Regex โดยไม่พิสูจน์หมายเลขหัวข้อ:**
   เดิมใช้ regex `/(?:ส่วนที่|บทที่|section)\s*(\d+)/i.test(...)` ซึ่งคืนค่า `true` ทันทีที่มีตัวเลขใดๆ ในข้อความ แม้ตัวเลขนั้นจะไม่ตรงกับหมายเลขใน `sourceLocator` (เช่น Locator `ชิ้นส่วนที่ 5` แต่ในข้อความมีเพียง `ส่วนที่ 1` ก็ยอมรับ)
   - **การแก้ไข:** แก้ให้แยกตัวเลขหัวข้อจริงจากข้อความผ่าน `extractGenuineHeadings(chunk.text)` แล้วตรวจ `headings.numbers.includes(n)` อย่างเข้มงวดเท่านั้น

2. **การนำ `chunkIndex` มาเป็นหลักฐานยืนยัน Source Locator (`hasChunkIndexMatch`):**
   เดิมโค้ดใน `validateAndResolveLocator()` มีเงื่อนไข `hasChunkIndexMatch = chunk.chunkIndex === n` และยอมรับให้เป็น Locator ที่ยืนยันได้ แม้ไม่มีหัวข้อจริงในต้นฉบับ
   - **การแก้ไข:** ลบตัวแปรและเงื่อนไข `hasChunkIndexMatch` ออกทั้งหมดอย่างสิ้นเชิง

3. **การนำ `sourceLocator` ภายใต้การตรวจมาพิสูจน์ตนเอง (Self-Verification):**
   เดิมมีเงื่อนไข `isExplicitDocumentChunk = /ชิ้นส่วนที่\s*\d+/.test(sourceLocator)` ซึ่งนำค่าที่กำลังจะตรวจสอบมาอ้างอิงเป็นหลักฐานยืนยันตนเอง
   - **การแก้ไข:** ลบ `isExplicitDocumentChunk` ออกทั้งหมด

4. **การสูญหายของ Section Heading ในชิ้นส่วนต่อเนื่องของ Markdown (`chunkText`):**
   เมื่อเอกสาร Markdown ที่แบ่งด้วย Divider เช่น `--- ส่วนที่ N: ... ---` ถูกตัดแบ่งเป็นขนาดย่อย ชิ้นส่วนที่ 2 เป็นต้นไปในส่วนเดียวกันไม่มีข้อความหัวข้อติดมา ทำให้ strict validation ปฏิเสธ
   - **การแก้ไข:** ปรับ `chunkText` ให้จดจำหัวข้อล่าสุดของ Section และแนบหัวข้อ `=== ส่วนที่ N ===\n` นำหน้าชิ้นส่วนต่อเนื่องใน Section เดียวกันโดยอัตโนมัติ

---

## 2. ไฟล์ที่แก้และ Diff ชัดเจน

### 2.1 `src/lib/documentChunker.ts`
- กำจัด `hasChunkIndexMatch` และ `isExplicitDocumentChunk`
- ตรวจสอบ `hasHeadingMatch` ด้วย `headings.numbers.includes(n)` เท่านั้น
- เพิ่ม Section heading continuation ใน `chunkText`

### 2.2 `package.json` & `server.ts`
- กำหนด `"dev": "DISABLE_HMR=true tsx server.ts"` ใน `package.json`
- เพิ่ม fallback `process.env.DISABLE_HMR = 'true'` ใน `server.ts` หากยังไม่ได้ตั้งค่า ก่อนเรียก `createViteServer` เพื่อป้องกัน WebSocket error ใน Preview iframe

### 2.3 `src/lib/documentChunker.test.ts`
- เพิ่ม Direct Unit Tests สำหรับ `validateAndResolveLocator()` ครบทั้ง 6 กรณี:
  1. `source_heading` ที่เลขตรงกับหัวข้อจริง -> ได้รับการยืนยัน
  2. `source_heading` ที่ไม่มีหัวข้อในข้อความ -> ไม่สามารถยืนยันได้
  3. `source_heading` ที่เลขในหัวข้อไม่ตรงกับเลข locator -> ไม่สามารถยืนยันได้
  4. `chunkIndex` อย่างเดียวไม่มีหัวข้อ -> ไม่สามารถยืนยันได้
  5. เอกสารมีเลขหน้าจริง (`native_page`) -> ได้รับการยืนยัน (`หน้า X`)
  6. เอกสารไม่มีเลขหน้า แต่ส่ง `native_page` -> ไม่สามารถยืนยันได้

### 2.4 `src/lib/evidenceIntegrityFix.test.ts` & `src/lib/dtm67111OfflineGrounding.test.ts`
- ปรับปรุง Mock chunk fixtures ให้มีหัวข้อจริงตามโครงสร้าง `=== ส่วนที่ N ===` เพื่อทดสอบ Strict Grounding ได้อย่างสมบูรณ์

---

## 3. ผลการทดสอบ Regression ที่รันจริง

- **ชุดทดสอบที่รัน:**
  1. `src/lib/documentChunker.test.ts`: **18/18 ผ่าน (100%)**
  2. `src/lib/dtm67111OfflineGrounding.test.ts`: **12/12 ผ่าน (100%)**
  3. `src/lib/evidenceIntegrityFix.test.ts`: **51/51 ผ่าน (100%)**
  - **รวมทั้งหมด:** **81/81 ผ่าน (100%)**
- **TypeScript Typecheck (`tsc --noEmit`):** **0 errors (PASSED)**
- **Applet Compilation (`compile_applet`):** **Build succeeded (PASSED)**

---

## 4. ผลการตรวจสอบ `DISABLE_HMR`

- **ค่าที่มีผลใช้งานจริง (Effective Value):** `true` (กำหนดผ่าน `"DISABLE_HMR=true tsx server.ts"` ใน `package.json` และ fallback ใน `server.ts`)
- **การทำงานของ Vite Client:** เมื่อ `DISABLE_HMR=true` ถูกตั้งค่า, `vite.config.ts` (`server.hmr: false`) จะปิดการทำงานของ WebSocket HMR Client ป้องกันไม่ให้ส่งคำสั่งเชื่อมต่อ WebSocket ซ้ำๆ ใน iFrame ของ AI Studio

---

## 5. สถานะของ Preview

- **สถานะ:** **Operational with HMR Limitation** (ทำงานได้ปกติอย่างสมบูรณ์ โดยมีการปิด HMR ตามข้อกำหนดของสภาพแวดล้อม iFrame เพื่อตัดปัญหา WebSocket connection error)
- HTTP Service: พอร์ต 3000 ตอบกลับ `HTTP/1.1 200 OK`

---

## 6. ข้อจำกัดที่เหลืออยู่และก้าวถัดไปขั้นตอนเดียว

- **ข้อจำกัดที่เหลืออยู่:** การอัปเดตโค้ดในหน้า Frontend จะต้องกด Refresh หน้าเว็บ Preview เพื่อดูความเปลี่ยนแปลง เนื่องจาก HMR ถูกปิดไว้ตามสถาปัตยกรรมของสภาพแวดล้อม Sandbox iFrame
- **Next Step ขั้นตอนเดียว:** ผู้ใช้สามารถทดสอบส่งคำถามเกี่ยวกับการแพทย์ เช่น เรื่อง Prefix/Suffix หรือการตรวจวิเคราะห์ทางห้องปฏิบัติการผ่านหน้าต่างแชตจริงใน Preview เพื่อทดสอบการอ้างอิงแหล่งข้อมูล (Source Citations) ได้ทันที
