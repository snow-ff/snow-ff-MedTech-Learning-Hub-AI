# รายงานผลการตรวจสอบและแก้ไขช่องโหว่ P0 Evidence Integrity (Phase 2 Remediation)

**โครงการ:** MedTech Learning Hub AI v1.2  
**สถานะปัจจุบัน:**  
- **P0 Evidence Integrity Status:** **OPEN** (รอผลการทดสอบยืนยันใน Google AI Studio Preview จริง)  
- **AC-10 Status:** **PENDING** (รอผลการทดสอบการใช้งานจริงใน Preview)  
- **Automated Verification:** **PASSED** (40/40 tests ใน `evidenceIntegrityFix.test.ts` และ 12/12 tests ใน `dtm67111OfflineGrounding.test.ts` รวม 52 tests)  
- **TypeScript & Lint:** **CLEAN** (`tsc --noEmit` 0 errors)  
- **Build Compilation:** **SUCCESS** (`npm run build` / `compile_applet` passed)

---

## 1. ผลการตรวจสอบโค้ดจริงใน Workspace (Verification Before Edit)

| รายการที่ตรวจสอบ | ตำแหน่งโค้ดใน Workspace | ผลการตรวจสอบ | การดำเนินการ |
|---|---|---|---|
| **การดึงตัวเลขจากข้อความที่ไม่ใช่ Locator** | `src/lib/documentChunker.ts` (เดิมบรรทัด 609-624) | **พบปัญหาจริง**: ใช้ `decoded.match(/(?:ชิ้นส่วนที่|chunk\|...)?\s*(\d+)/)` โดยมี `?` และ fallback `decoded.replace(/\D/g, '')` ทำให้ข้อความใด ๆ ที่มีตัวเลข (เช่น `"DTM67-111"`, `"ประกาศ 2568"`) ถูกดึงตัวเลขมาสร้างเป็น `ชิ้นส่วนที่ 67` หรือ `ชิ้นส่วนที่ 2568` | **แก้ไขแล้ว**: ปรับ regex ให้ตรงเฉพาะรูปแบบ locator ที่แท้จริง (pure digits, `#?chunk <N>`, `ชิ้นส่วนที่ <N>`, `หน้า <P>`) และตัด `replace(/\D/g, '')` ออกทั้งหมด |
| **การสร้างหมายเลขชิ้นส่วนจากลำดับ Array** | `server.ts` (เดิมบรรทัด 377, 380, 385) | **พบปัญหาจริง**: พบการใช้ `String(idx + 1)` และ fallback `validIdx = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : (idx + 1)` รวมถึง `cleanChunkLocator(1, c.pageNumber)` ซึ่งสร้างเลขชิ้นส่วนจาก index ของ Array โดยที่เอกสารไม่ได้ระบุ | **แก้ไขแล้ว**: ตัด `(idx + 1)` ออกทั้งหมด หาก chunkIndex ไม่ได้ระบุหรือไม่ผ่านการตรวจสอบ จะเป็น `undefined` ไม่มีการแต่งตัวเลขขึ้นเอง |
| **การทดสอบ Test AH ไม่ได้ทดสอบฟังก์ชันจริงของ UI** | `src/lib/evidenceIntegrityFix.test.ts` (เดิมบรรทัด 1052-1061) | **พบปัญหาจริง**: Test AH มีการเขียน `const filterFunction = ...` ซ้ำซ้อนอยู่ภายในไฟล์ทดสอบเอง แทนที่จะนำเข้าฟังก์ชันที่ UI ใช้งานจริง | **แก้ไขแล้ว**: สร้างและ export ฟังก์ชัน `filterDisplayedReferences` ใน `documentChunker.ts` ให้ `src/App.tsx` ใช้งานจริง และนำเข้าฟังก์ชันเดียวกันนี้ไปใช้ใน Test AH |
| **Test AJ ผ่านได้อย่างว่างเปล่า (Vacuous Pass)** | `src/lib/evidenceIntegrityFix.test.ts` (เดิมบรรทัด 1113-1115) | **พบปัญหาจริง**: `groundedRefs.every(...)` สามารถผ่านได้หาก `groundedRefs` เป็น Array ว่าง และไม่ได้ยืนยันว่ามีหลักฐาน Prefix chunk 4 อยู่จริง | **แก้ไขแล้ว**: บังคับ `expect(groundedRefs.length).toBeGreaterThan(0)`, ยืนยันว่าพบหลักฐาน Prefix จริง และยืนยันว่า `res.references` ทั้งหมดไม่มี Suffix |
| **การสื่อความหมายของ `source_grounded`** | `src/App.tsx` (บรรทัด 1288) และ `server.ts` (บรรทัด 439, 441, 443) | **พบปัญหาการสื่อความหมาย**: เสี่ยงต่อการเข้าใจผิดว่าทุกข้ออ้างในคำตอบผ่านการพิสูจน์แล้ว ทั้งที่ระบบตรวจสอบได้เพียงระดับชิ้นส่วนเอกสาร | **แก้ไขแล้ว**: ระบุชัดเจนว่าเป็น `Chunk Grounded` / `Chunk-Level Grounded` พร้อมคำอธิบายกำกับว่าครอบคลุมเฉพาะเนื้อหาระดับชิ้นส่วนเอกสารที่อ้างอิง |

---

## 2. หลักฐานการแก้ไขโค้ด ก่อน-หลัง (Before & After Evidence)

### 2.1 `src/lib/documentChunker.ts`
- **ก่อนแก้ไข:**
  ```typescript
  const chunkMatch = decoded.match(/(?:ชิ้นส่วนที่|chunk|ส่วนที่|ส่วนอ้างอิง)?\s*(\d+)/i);
  if (chunkMatch && chunkMatch[1]) return `ชิ้นส่วนที่ ${num}`;
  const anyDigits = decoded.replace(/\D/g, '');
  if (anyDigits) return `ชิ้นส่วนที่ ${num}`;
  ```
- **หลังแก้ไข:**
  ```typescript
  // Pure digits: e.g. 4, "4", "13"
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num > 0) return `ชิ้นส่วนที่ ${num}`;
  }
  // Explicit chunk prefix: e.g. "ชิ้นส่วนที่ 4", "chunk 4", "#chunk-4"
  const chunkPrefixMatch = trimmed.match(/^(?:#?chunk[\s\-:]*|ชิ้นส่วนที่[\s:]*|ส่วนอ้างอิง[\s:]*|ส่วนที่[\s:]*)(\d+)$/i);
  if (chunkPrefixMatch && chunkPrefixMatch[1]) {
    const num = parseInt(chunkPrefixMatch[1], 10);
    if (!isNaN(num) && num > 0) return `ชิ้นส่วนที่ ${num}`;
  }
  return '';
  ```

### 2.2 `server.ts`
- **ก่อนแก้ไข:**
  ```typescript
  const rawIdxStr = c.chunkIndex !== undefined && c.chunkIndex !== null ? String(c.chunkIndex) : String(idx + 1);
  const validIdx = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : (idx + 1);
  ```
- **หลังแก้ไข:**
  ```typescript
  const rawIdxStr = c.chunkIndex !== undefined && c.chunkIndex !== null ? String(c.chunkIndex) : '';
  const validIdx = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : undefined;
  ```

### 2.3 `src/App.tsx`
- **ก่อนแก้ไข:** กรอง reference cards ด้วย anonymous inline filter ภายใน JSX
- **หลังแก้ไข:** เรียกใช้ `filterDisplayedReferences(msg.references, isDocGrounding)` จาก production library โดยตรง และระบุคำอธิบาย `title="ยืนยันความสอดคล้องระดับชิ้นส่วนเอกสาร (Chunk-Level Grounded)..."`

---

## 3. ผลการทดสอบ (Automated Verification Results)

1. **`src/lib/evidenceIntegrityFix.test.ts`**: **ผ่าน 40/40 รายการ (100%)**
   - **Test AH**: ผ่านการทดสอบด้วย `filterDisplayedReferences` ตัวจริงของระบบ
   - **Test AJ**: ผ่านการทดสอบโดยยืนยันหลักฐาน Prefix จริง, ปราศจาก Suffix และไม่ผ่านจาก Array ว่าง
   - **Test AK (ใหม่)**: ยืนยันว่า `"DTM67-111"`, `"ประกาศ 2568"`, `"CBC-12"` คืนค่า `''` ไม่ดึงตัวเลขมาแต่ง locator ปลอม
   - **Test AL (ใหม่)**: ยืนยันว่า chunk ที่ไม่มี `chunkIndex` จะไม่ถูกสร้าง `idx + 1` จากลำดับ Array
   - **Test AM (ใหม่)**: ยืนยันตรรกะการกรอง reference cards ในโหมดค้นหาทั่วไปและการอ้างอิงภายนอก
2. **`src/lib/dtm67111OfflineGrounding.test.ts`**: **ผ่าน 12/12 รายการ (100%)**
3. **TypeScript Lint (`tsc --noEmit`)**: ผ่านสมบูรณ์ (0 errors)
4. **Build Compilation (`npm run build`)**: ผ่านสมบูรณ์ (Build succeeded)

---

## 4. สถานะและขั้นตอนถัดไป (Pending & Next Steps)

- **สถานะ P0:** **OPEN**
- **สถานะ AC-10:** **PENDING**
- **ข้อกำหนดความปลอดภัย:** ห้ามปิด P0 หรือ AC-10 จาก Unit Tests หรือ Build เพียงอย่างเดียว จะต้องรอการทดสอบตอบโต้จริงบน **Google AI Studio Preview** ด้วยเอกสาร `dtm67 111 source` (DTM67-111) โดยผู้ใช้
