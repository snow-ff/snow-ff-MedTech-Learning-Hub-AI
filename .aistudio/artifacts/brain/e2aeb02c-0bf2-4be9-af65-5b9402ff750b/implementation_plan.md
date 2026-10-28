# Implementation Plan: System-wide Root-Cause Remediation for P0 Source Locator Provenance

## Status: COMPLETED (Verified via Unit Tests, TypeScript Check, Build, and Runtime Smoke Test)

### 1. Ingestion & Storage Normalization
- **`src/lib/pdfExtractor.ts`**: Applied `decodeHtmlEntities()` to extracted document titles, page strings, and markdown/text content to eliminate raw entity leakage (e.g. `&#xE49;`).
- **`src/components/DocumentLibrary.tsx`**: Applied `decodeHtmlEntities()` to note creation titles and contents.
- **`src/lib/documentStorage.ts`**: Introduced `normalizeAndMigrateDocument()`. When documents are fetched from IndexedDB (or fallback memory/localStorage), legacy chunks lacking provenance or containing raw entities are safely auto-migrated in memory and asynchronously updated in IndexedDB without forcing users to clear storage or re-upload files.

### 2. Heading Extraction & Server Verification Alignment
- **`server.ts`**: Updated heading regex at lines 422 and 1127 to recognize markdown dashed headings (`--- ส่วนที่ N: ... ---`), asterisks, and newlines: `/(?:===+|---+|\*\*\*+|#+|^|\n)\s*(?:ส่วนที่|บทที่|section|chapter)\s*(\d+)/i`.
- **`server.ts:buildChunkReferences`**: Emits `isLocatorVerified: resolvedLocator.isVerified` and `sourceLocatorProvenance: resolvedLocator.provenance` along with canonical locators for both Gemini and Academic Fallback paths.
- **`src/lib/academicVerifier.ts`**: Allowed retrieved citations to validate against both raw `chunkIndex` and genuine heading numbers without false mismatch penalties.

### 3. Frontend Card Badging & Entity Safeguards
- **`src/App.tsx:522-527`**: Preserves unconfirmed locator strings and decodes entities, preventing `cleanChunkLocator` from blanking valid Thai status messages.
- **`src/App.tsx:1280-1310`**: Conditionally renders badges:
  - Green (`• ชิ้นส่วนอ้างอิง: พบเนื้อหาตรงกับเอกสาร (Chunk-Level Grounded)`) ONLY when the locator is verified.
  - Amber (`• ชิ้นส่วนอ้างอิง: ไม่สามารถยืนยันตำแหน่งได้ (Unverified Locator)`) when the locator cannot be confirmed.
  - Rose/Red (`• ชิ้นส่วนอ้างอิง: ไม่ตรงกับประเด็นคำถาม (Unsupported)`) when marked unsupported.
  - Decoded HTML entities in title, excerpt, and locator text nodes.

### 4. Verification Evidence
- Vitest targeted suite: 83/83 tests passing (0 failures).
- TypeScript check (`tsc --noEmit`): 0 errors.
- Production build (`vite build`): Succeeded.
- Dev server runtime smoke test against `http://localhost:3000/api/gemini/generate`: Returns `locator: ชิ้นส่วนที่ 1, 2, 3`, `prov: source_heading`, `status: source_grounded`, `verified: true`, with zero entity leaks.
