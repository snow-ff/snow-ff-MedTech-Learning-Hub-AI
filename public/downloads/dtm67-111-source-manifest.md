# ทะเบียนแหล่งข้อมูลเอกสารต้นฉบับและการตรวจสอบความตรง (Ground-Truth & Source Fidelity Manifest)
**DTM67-111 — Source Fidelity & Page-Reference Audit**
**MedTech Learning Hub AI v1.2**

---

### 1. ข้อมูลระบุประเภทเอกสารและสถานะทางกายภาพ (Document Nature & Integrity)

* **ประเภทเอกสาร (Document Type)**: **เอกสารสรุปภาษาไทยเพื่อการเรียนรู้ ดัดแปลงจากแหล่งอ้างอิงแบบเปิด (Adapted Study Guide in Markdown)**
* **สถานะการอ้างอิงหน้า (Page Reference Reality)**:
  - **มิใช่ PDF ต้นฉบับ** และ **มิได้มีเลขหน้าจริงของหนังสือต้นฉบับ**
  - กำหนดค่าทางเทคนิคในระบบ: `hasNativePages: false`, `totalPages: undefined`
  - การแบ่งสัดส่วนเนื้อหาในไฟล์แบ่งออกเป็น **"ส่วนที่ 1 ถึง ส่วนที่ 7 (Sections 1–7)"** เพื่อใช้กำหนดขอบเขตหัวข้อ มิใช่เลขหน้าแท้ของหนังสือ
* **ตำแหน่งจัดเก็บไฟล์ (Local File Path)**: `test-assets/ground-truth/dtm67-111-source.md`
* **ขนาดไฟล์จริง (File Size)**: **33,296 bytes**
* **SHA-256 Checksum**:
  `bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb`

---

### 2. แหล่งอ้างอิงต้นฉบับ เครดิต และใบอนุญาต (Attribution, Provenance & Licensing)

* **หนังสืออ้างอิงหลัก (Primary Reference Textbook)**: *Medical Terminology (2nd Edition, 2024)*
* **บรรณาธิการต้นฉบับ (Original Editors)**: 
  1. Kimberly Ernstmeyer, MSN, RN, CNE, CHSE, APNP-BC
  2. Elizabeth Christman, DNP, RN, CNE
* **สถาบันและกลุ่มผู้จัดทำ (Original Workgroup & Publisher)**:
  - Wisconsin Technical College System (WTCS) Faculty Workgroup
  - Chippewa Valley Technical College, Eau Claire, Wisconsin, USA
  - Open Resources for Nursing (Open RN)
* **สัญญาอนุญาตลิขสิทธิ์ต้นฉบับ (Original License)**: 
  Creative Commons Attribution 4.0 International (CC BY 4.0)
* **URL แหล่งข้อมูลเปิดที่ตรวจสอบได้จริง**:
  - WisTech Open Textbook: `https://wtcs.pressbooks.pub/medterm/`
  - U.S. National Library of Medicine (NCBI Bookshelf): `https://www.ncbi.nlm.nih.gov/books/NBK607454/` (Accession: NBK607454)
* **ข้อชี้แจงการดัดแปลงและการไม่รับรอง (Adaptation & Non-Endorsement Notice)**:
  เอกสารฉบับนี้จัดทำขึ้นโดยการแปล ย่อความ เรียบเรียงเป็นภาษาไทย และจัดโครงสร้างใหม่เพื่อใช้เป็นคู่มือการเรียนรู้เบื้องต้น โดยผู้จัดทำโครงการ MedTech Learning Hub AI มิใช่ผลงานที่จัดทำหรือรับรองโดยตรงจากบรรณาธิการต้นฉบับหรือ Chippewa Valley Technical College และมิใช่เอกสารการสอนทางการของมหาวิทยาลัยวลัยลักษณ์

---

### 3. ตารางตรวจสอบความตรงกับต้นฉบับรายส่วน (Source Fidelity Matrix)

| ส่วนในไฟล์ที่สร้าง | หัวข้อเนื้อหา | แหล่งต้นฉบับและ URL | ชื่อบท/หัวข้อย่อยที่ตรวจสอบได้ | สถานะความตรงกับต้นฉบับ | ข้อจำกัดและส่วนที่ยังยืนยันไม่ได้ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ส่วนที่ 1** | แนวคิดพื้นฐานและองค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์ (Root, Prefix, Suffix, Combining Vowel/Form, Rules) | *Medical Terminology 2e*<br>`https://www.ncbi.nlm.nih.gov/books/NBK607454/`<br>`https://wtcs.pressbooks.pub/medterm/` | **Chapter 1: Foundational Concepts - Identifying Word Parts**<br>• Introduction to Word Parts<br>• Word Components & Categories<br>• Rules for Analyzing Medical Terms | **ตรงกับต้นฉบับระดับสูง (High Fidelity)**<br>เนื้อหานิยาม 4 องค์ประกอบ และกฎ 3 ขั้นตอนตรงตามบทเรียนใน Chapter 1 | แปลและสรุปเป็นภาษาไทยเพื่อการศึกษา มิได้คัดลอกข้อความภาษาอังกฤษทั้งบท |
| **ส่วนที่ 2** | คำอุปสรรค (Prefixes) และรากศัพท์กายวิภาค (Roots) ที่พบบ่อย | *Medical Terminology 2e*<br>`https://www.ncbi.nlm.nih.gov/books/NBK607454/` | **Chapter 1: Foundational Concepts**<br>• Common Prefixes<br>• Common Word Roots & Combining Vowels | **ตรงกับต้นฉบับระดับสูง (High Fidelity)**<br>คำศัพท์ *Brady-*, *Tachy-*, *Dys-*, *Cardi/o*, *Nephr/o*, *Hepat/o* ฯลฯ ตรงกับตารางคำศัพท์ใน Chapter 1 | คัดเลือกเฉพาะคำศัพท์พื้นฐานที่สำคัญในทางคลินิก มิได้ยกมาทุกคำในตารางต้นฉบับ |
| **ส่วนที่ 3** | คำปัจจัยบ่งชี้พยาธิสภาพ อาการ และหัตถการผ่าตัด (Suffixes) | *Medical Terminology 2e*<br>`https://www.ncbi.nlm.nih.gov/books/NBK607454/` | **Chapter 1: Foundational Concepts**<br>• Common Suffixes (Surgical, Diagnostic, Pathological) | **ตรงกับต้นฉบับระดับสูง (High Fidelity)**<br>คำปัจจัย *-itis*, *-ectomy*, *-otomy*, *-ostomy*, *-plasty*, *-scopy*, *-centesis* ตรงกับรายการใน Chapter 1 | แปลความหมายและยกตัวอย่างประกอบทางคลินิกเป็นภาษาไทย |
| **ส่วนที่ 4** | ท่ากายวิภาคมาตรฐาน คำระบุทิศทาง และระนาบตัดขวาง (Anatomical Planes) | *Medical Terminology 2e*<br>`https://www.ncbi.nlm.nih.gov/books/NBK607454/` | **Chapter 2: Medical Language Related to the Whole Body**<br>• Anatomical Views, Positions & Locations<br>• Directional Terms<br>• Body Planes (Sagittal, Coronal, Transverse) | **ตรงกับต้นฉบับระดับสูง (High Fidelity)**<br>นิยามท่ามาตรฐาน ทิศทาง และระนาบทั้ง 3 ระนาบตรงตาม Chapter 2 | เพิ่มเติมคำอธิบายการประยุกต์ใช้ในภาพถ่าย CT/MRI ในบริบทเทคโนโลยีทางการแพทย์ |
| **ส่วนที่ 5** | ช่องว่างภายในร่างกาย (Cavities) และจตุภาคหน้าท้อง 4 ส่วน (Abdominal Quadrants) | *Medical Terminology 2e*<br>`https://www.ncbi.nlm.nih.gov/books/NBK607454/` | **Chapter 2: Medical Language Related to the Whole Body**<br>• Body Cavities & Regions<br>• Abdominal Quadrants (RUQ, LUQ, RLQ, LLQ) | **ตรงกับต้นฉบับระดับสูง (High Fidelity)**<br>ช่องว่าง Cranial/Spinal/Thoracic/Abdominopelvic และ 4 จตุภาคตรงตาม Chapter 2 | เชื่อมโยงอาการปวด Appendicitis/Diverticulitis กับตำแหน่งจตุภาคหน้าท้อง |
| **ส่วนที่ 6** | ตัวย่อทางการแพทย์ กฎความปลอดภัย และรายการ "Do Not Use" | **The Joint Commission (TJC)** Official "Do Not Use" List & **ISMP**<br>`https://www.jointcommission.org/resources/news-and-multimedia/fact-sheets/facts-about-do-not-use-list/` | **TJC National Patient Safety Goals (NPSG)**<br>• Standardized Do Not Use Abbreviations (U, IU, QD, QOD, Trailing Zero, Lack of Leading Zero, MS/MSO4/MgSO4) | **มีแหล่งอ้างอิงเฉพาะแยกต่างหาก (Accurately Grounded in TJC/ISMP Standards)** | **ข้อจำกัด:** หนังสือ OpenRN กล่าวถึงความปลอดภัยและตัวย่อในแบบฝึกหัด แต่กฎข้อห้ามทั้ง 7 ข้อมีที่มาจากเกณฑ์มาตรฐานของ The Joint Commission โดยตรง จึงต้องระบุแหล่งอ้างอิงของ TJC แยกต่างหาก มิได้อ้างอิงจากหนังสือ OpenRN เพียงลำพัง |
| **ส่วนที่ 7** | มาตรฐานคำศัพท์ดิจิทัลสุขภาพ (ICD-10/11, SNOMED CT, LOINC, RxNorm, HL7 FHIR) | **มาตรฐานข้อมูลสุขภาพสากล:**<br>• WHO (ICD-10/ICD-11)<br>• SNOMED International<br>• Regenstrief Institute (LOINC)<br>• U.S. NLM (RxNorm)<br>• HL7 International (FHIR) | **International Health Informatics Standards & Ontologies**<br>• WHO Classification: `https://www.who.int/standards/classifications/classification-of-diseases`<br>• SNOMED CT: `https://www.snomed.org/`<br>• LOINC: `https://loinc.org/` | **เนื้อหาสังเคราะห์เชื่อมโยงมาตรฐานสากล (Synthesized Informatics Extension)** | **ข้อจำกัด:** หนังสือ OpenRN มุ่งเน้นศัพท์ทางคลินิกพื้นฐานสำหรับพยาบาลและสาธารณสุข **มิได้มีบทสอนมาตรฐาน SNOMED CT หรือ HL7 FHIR** เนื้อหาส่วนนี้จัดทำขึ้นเป็นการสังเคราะห์เสริมเพื่อเชื่อมโยงความรู้สู่หลักสูตรเทคโนโลยีดิจิทัลทางการแพทย์ (DTM 2567) ห้ามอ้างว่าเนื้อหานี้มาจากหนังสือ OpenRN |

---

### 4. การเชื่อมโยงกับหลักสูตร DTM 2567 (Curriculum Data Verification)

* **รหัสวิชาทางการ**: **DTM67-111** (ตรวจยืนยันโดยตรงจาก `src/data/curriculumData.ts`)
* **ชื่อวิชาภาษาไทย**: **ศัพท์เทคนิคทางการแพทย์**
* **ชื่อวิชาภาษาอังกฤษ**: **Technical Terms in Medicine**
* **หน่วยกิต**: **3(3-0-6)** (ทฤษฎี 3 ชั่วโมง, ปฏิบัติ 0 ชั่วโมง, ค้นคว้าด้วยตนเอง 6 ชั่วโมงต่อสัปดาห์)
* **หมวดวิชา**: หมวดวิชาเฉพาะ (Major Specific)
* **กลุ่มวิชา**: กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ (Biomedical & Health Data Sciences)
* **หลักฐานอ้างอิงทางการ (Official Evidence Ledger)**:
  - เล่ม มคอ.2 หลักสูตร วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) มหาวิทยาลัยวลัยลักษณ์ (ปรากฏในเล่มคู่มือนักศึกษา หน้า 6)
  - URL เล่มทางการ: `https://ces.wu.ac.th/registrar/StudentHandbook/2567/22_IMI_01.pdf` (หน้า 6)
* **ข้อจำกัดสำคัญด้านหลักสูตร**:
  - เอกสารสรุปชุดนี้เป็น **สื่อเสริมเพื่อการเรียนรู้ด้วยตนเอง** ที่ดัดแปลงจากแหล่งข้อมูลเปิด มิใช่ประมวลรายวิชา (Course Syllabus) อย่างเป็นทางการ และยังไม่ได้รับรองว่าเป็นเนื้อหาการสอนทั้งหมดของรายวิชานี้

---

### 5. ความพร้อมก่อนนำเข้า Document Library (Document Library Ingestion Readiness)

1. **การรองรับชนิดไฟล์ของระบบปัจจุบัน**:
   - `DocumentLibrary.tsx` และ `pdfExtractor.ts` รองรับการนำเข้าไฟล์รูปแบบ `.pdf`, `.txt`, `.md`, `.json`, `.csv`
   - เมื่อนำเข้าไฟล์ Markdown (`dtm67-111-source.md`) ระบบจะกำหนดชนิดเอกสารเป็น `type: 'note'` และกำหนด `hasNativePages: false` อย่างถูกต้องตามจริง
2. **การอ้างอิงในการตรวจสอบวิชาการ (Academic Verification)**:
   - เนื่องจากเอกสารนี้มี `hasNativePages: false` ระบบ **Academic Verifier** จะตรวจสอบว่าคำตอบต้องไม่อ้างเลขหน้าหนังสือปลอม (Fake Page Hallucination)
   - การอ้างอิงที่ถูกต้องตามระบบจะอ้างอิงตามหมายเลขชิ้นส่วน `[ส่วนอ้างอิง: ชิ้นส่วนที่ ...]` หรือระบุว่าเป็นเนื้อหาจาก "ส่วนที่ 1–7" ของเอกสารสรุป
3. **การนำเข้าสู่ระบบ**:
   - ไม่มีการแอบนำข้อมูลเข้า IndexedDB หรือเขียนทับข้อมูลผู้ใช้โดยตรงในงานตรวจสอบนี้
   - ผู้เรียนสามารถนำเข้าไฟล์ `test-assets/ground-truth/dtm67-111-source.md` ผ่านหน้าต่าง "อัปโหลดเอกสาร" ในแท็บ Document Library ของแอปพลิเคชันได้โดยตรง
