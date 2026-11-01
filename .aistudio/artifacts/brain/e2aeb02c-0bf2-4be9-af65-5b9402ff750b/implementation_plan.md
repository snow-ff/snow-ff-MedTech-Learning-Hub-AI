# Implementation Plan & Verification Report: P0 Restore Usability & Offline Learning Mode
## MedTech Learning Hub AI v1.2

## Status: COMPLETED & VERIFIED (Production Build Passed, 293 Tests Passing, Live Scenarios A-D Verified)

---

### 1. Root Cause & Architectural Solution

1. **Root Cause Analysis:**
   - The upstream Google AI Studio Cloud Project is currently in HTTP 429 Quota Exhausted status (`RESOURCE_EXHAUSTED`).
   - Previously, without an explicit user-controllable Offline Mode, users attempting to study documents or learn concepts were blocked by external quota limits. Attempts to query Gemini triggered retry cycles that inevitably ended in quota exhaustion errors.
   - The UI lacked a clear distinction between intentional offline learning and quota failure fallback.

2. **Architectural Implementation:**
   - **First-Class Offline Learning Mode:** Added persistent `isOfflineMode` state (synced with `localStorage['medtech_offline_mode']`) and a zero-delay toolbar toggle button in `src/App.tsx`.
   - **Bypass Gemini API (Zero API Calls):** When `offlineMode: true` is sent to `/api/gemini/generate`:
     - If an active document is attached (`isDocumentGrounding`): routes directly through `getAcademicFallback()` with document context, executing chunk retrieval, heading locator extraction, Prefix/Suffix independent evaluation, and `verifyAcademicAnswer()`. Returns `servedMode: "offline_document_fallback"` with `attemptsRun: 0`, `isApiUnavailable: false`, and `reason: "offline_mode_selected"`.
     - If no document is attached: evaluates queries against static academic medical knowledge (`serum`, `flow`, `pcr`, `dtm`, `dtm_standards`, etc.). If the topic is unsupported, returns a clear, helpful message without hallucinations suggesting the user select or upload a document from the Document Library. Returns `servedMode: "offline_static_fallback"` with `attemptsRun: 0`, `isApiUnavailable: false`, and `reason: "offline_mode_selected"`.
   - **Unified `formatFallbackResponse` Helper:** Extracted unified response formatter in `server.ts` to guarantee consistent handling for both intentional offline learning and online quota failure fallback.
   - **5 Distinct Service Status States in UI:**
     1. `offline_document_fallback`: โหมดติวออฟไลน์ (Offline Learning Mode) — ค้นจากเอกสารโดยตรง (ไม่เรียกใช้ API)
     2. `offline_static_fallback`: โหมดการเรียนรู้ออฟไลน์ (Offline Learning Mode) — คลังความรู้พื้นฐาน (ไม่เรียกใช้ API)
     3. `academic_fallback` (online error): โหมดสำรองวิชาการ (Academic Fallback) — ขีดจำกัดสิทธิ์หรือโควตา API (Resource / Quota Limit)
     4. `gemini_grounding`: Google Search Grounding (Live AI)
     5. `document_grounding`: Document Grounding (Live AI)

---

### 2. Files Modified

1. **`server.ts`**:
   - Implemented `formatFallbackResponse()` pure helper function above `app.post("/api/gemini/generate")`.
   - Added `offlineMode` parameter extraction from request body.
   - Added early short-circuit for `isOfflineMode` before Gemini retry while loop (making 0 Gemini API calls).
   - Handled `isOfflineMode` in document insufficient evidence check (preventing unwanted external Google Search inference).
   - Enhanced unsupported topic response with actionable learning guidance.
   - Unified online failure fallback to use `formatFallbackResponse()`.

2. **`src/App.tsx`**:
   - Added `isOfflineMode` state and `toggleOfflineMode` callback with `localStorage` persistence.
   - Passed `offlineMode: isOfflineMode` in `fetch('/api/gemini/generate')` JSON body.
   - Added Offline Learning Mode button in the chat control toolbar beside `searchMode`.
   - Updated message badge rendering to cleanly distinguish all 5 service status states without misrepresenting offline fallback as live AI or claiming quota exhausted when offline mode was intentionally chosen.

---

### 3. Live Runtime Verification Evidence (Scenarios A - D)

All scenarios were executed and verified against the live dev server running on `http://localhost:3000`:

- **Scenario A (Offline Document Query on `dtm67-111-source`):**
  - Query: Prefix and Suffix comparison against sample chunk containing Prefix only.
  - Verdict: `WARNING`, `isVerified: false`.
  - Notice: `⚠️ **คำเตือนความครอบคลุมของหลักฐาน (Partial Evidence Notice):** เอกสารนี้มีข้อมูลรองรับเพียงบางส่วน โดยไม่พบข้อมูลเกี่ยวกับ: ปัจจัยท้าย (Suffix)`.
  - Locator: `ส่วนที่ 3`, Provenance: `source_heading`.
  - ServiceStatus: `{ isApiUnavailable: false, reason: 'offline_mode_selected', attemptsRun: 0, servedMode: 'offline_document_fallback' }`.
  - API Calls: Exactly 0.

- **Scenario B (Offline Unsupported Topic without Document):**
  - Query: "เล่าประวัติศาสตร์กรุงศรีอยุธยาตอนต้น" with `offlineMode: true`.
  - Output: `**ไม่พบข้อมูลสำรองทางวิชาการเฉพาะสำหรับหัวข้อนี้** ... 💡 คำแนะนำสำหรับการเรียนรู้: - คุณสามารถไปที่แท็บ "คลังเอกสาร (Document Library)" เพื่อเลือกหรืออัปโหลดเอกสารที่เกี่ยวข้อง...`.
  - ServiceStatus: `{ isApiUnavailable: false, reason: 'offline_mode_selected', attemptsRun: 0, servedMode: 'offline_static_fallback' }`.
  - API Calls: Exactly 0.

- **Scenario C (Offline Static Topic without Document):**
  - Query: "อธิบายความแตกต่างระหว่าง Serum และ Plasma" with `offlineMode: true`.
  - Output: Complete verified academic explanation of Serum vs Plasma, anticoagulants, coagulation factors, and clinical SOP notes.
  - ServiceStatus: `{ isApiUnavailable: false, reason: 'offline_mode_selected', attemptsRun: 0, servedMode: 'offline_static_fallback' }`.
  - API Calls: Exactly 0.

- **Scenario D (Online Mode with HTTP 429 Quota Exhaustion):**
  - Query: "สรุปหลักการของ Real-Time PCR และค่า Cq" with `offlineMode: false`.
  - ServiceStatus: `{ isApiUnavailable: true, lastErrorStatus: 429, reason: 'quota_or_credential_exhausted', attemptsRun: 1, servedMode: 'academic_fallback' }`.
  - Notice: `*(แจ้งเตือน: โควตาการใช้งาน Gemini API เต็มหรือถูกจำกัด (HTTP 429 Quota Exceeded) — ระบบแสดงข้อมูลวิชาการสำรองจากคลังความรู้พื้นฐาน MedTech Hub โดยไม่ได้เชื่อมต่อค้นหาเว็บสดหรืออ้างอิงเอกสารเฉพาะ)*`.
  - Attempts Run: Exactly 1 (no wasteful retry looping).

---

### 4. Build & Test Verification

- `npx tsc --noEmit`: 0 errors.
- `compile_applet`: Succeeded.
- `npm run build`: Succeeded (Vite production bundle generated in 1.13s).
- Targeted Vitest tests (`src/lib/searchModeIntegration.test.ts` & `src/lib/geminiRetryPolicy.test.ts`): 48/48 tests passed (100%).
- Full Vitest test suite: 19 test files / 293 tests passed (100%).
