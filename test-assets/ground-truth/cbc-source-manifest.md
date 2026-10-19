# ทะเบียนแหล่งข้อมูลเอกสารต้นฉบับ (Ground-Truth Document Manifest)
**Track B1.6.1 — Ground-Truth Document Acquisition**
**MedTech Learning Hub AI v1.2**

---

### 1. ข้อมูลเอกสารและแหล่งที่มา (Document Identification & Provenance)

* **ชื่อเอกสาร (Title)**: Complete Blood Count Reference Intervals and Patterns of Changes Across Pediatric, Adult, and Geriatric Ages in Korea
* **ผู้แต่ง (Authors)**: Eun-Hee Nah, M.D., Suyoung Kim, M.S., Seon Cho, M.S., and Han-Ik Cho, M.D.
* **สถาบัน (Affiliations)**: 
  1. Department of Laboratory Medicine and Health Promotion Research Institute, Korea Association of Health Promotion, Seoul, Korea
  2. MEDIcheck LAB, Korea Association of Health Promotion, Cheongju, Korea
* **วารสารวิชาการ (Journal)**: *Annals of Laboratory Medicine*, Vol. 38, No. 6, November 2018, pp. 503–511
* **ปีที่เผยแพร่ / เวอร์ชัน**: November 2018 (eISSN: 2234-3814, pISSN: 2234-3806)
* **Digital Object Identifier (DOI)**: [https://doi.org/10.3343/alm.2018.38.6.503](https://doi.org/10.3343/alm.2018.38.6.503)
* **PubMed Central Identifier (PMCID)**: PMC6056387 (PMID: 29992791)
* **URL ต้นฉบับของผู้เผยแพร่ (Original Publisher URL)**:
  `https://synapse.koreamed.org/pdf/10.3343/alm.2018.38.6.503`
  (กระจายผ่าน PubMed Central: `https://pmc.ncbi.nlm.nih.gov/articles/PMC6056387/pdf/alm-38-503.pdf`)
* **เงื่อนไขการใช้งานและลิขสิทธิ์ (License & Copyright)**: 
  Creative Commons Attribution Non-Commercial License (CC BY-NC 4.0) — อนุญาตให้นำมาใช้เพื่อการศึกษา การวิเคราะห์ และการวิจัยโดยไม่มีวัตถุประสงค์เชิงพาณิชย์

---

### 2. ข้อมูลไฟล์ใน Workspace ปัจจุบัน (File Verification & Integrity)

* **ตำแหน่งจัดเก็บไฟล์ (Local File Path)**: `test-assets/ground-truth/cbc-source.pdf`
* **ขนาดไฟล์จริง (File Size)**: 1,385,642 bytes (1.32 MB / 1.4 MB)
* **SHA-256 Checksum**:
  `c2fa362a3dc366b253fa48da1a4855c7f8d2c5db4ca75aacdbf83eb615a20b50`
* **จำนวนหน้าจริงของ PDF (Total Native Pages)**: **9 หน้า** (หน้า 1 ถึง 9 ในไฟล์ PDF สอดคล้องกับเลขหน้าวารสาร 503 ถึง 511)
* **การตรวจสอบความสมบูรณ์ของ PDF**: ตรวจสอบโครงสร้าง PDF 1.4 Binary สกัด Object สตรีม และถอดรหัสข้อความผ่าน zlib ได้ครบถ้วนทั้ง 9 หน้า

---

### 3. รายละเอียดข้อเท็จจริง ค่าอ้างอิง และตำแหน่งหน้าจริง (Verifiable Ground-Truth Facts)

#### ก. ระเบียบวิธีวิจัยและเครื่องมือวิเคราะห์ (Methodology & Pre-analytics)
* **ตำแหน่งหน้า**: **หน้า 1–2 (เลขหน้าวารสาร 503–504)**
* **ประชากรศึกษา**: กลุ่มตัวอย่างประชากรสุขภาพดี 804,623 ราย (คัดกรองเหลือกลุ่มอ้างอิง 781,857 ราย หลังตัด Outliers)
* **มาตรฐานการคำนวณช่วงอ้างอิง**: Clinical and Laboratory Standards Institute (CLSI) C28-A3 guidelines
* **เครื่องตรวจวิเคราะห์อัตโนมัติ (Analyzer)**: Sysmex XE-2100 (Sysmex, Kobe, Japan)
* **หลอดและสารกันเลือดแข็ง**: เลือดดำ (Venous blood) บรรจุในหลอด K2-EDTA

---

#### ข. ค่าอ้างอิงระบบเม็ดเลือดแดง (Red Blood Cell Parameters)
* **ตำแหน่งหน้า**: **หน้า 3 (เลขหน้าวารสาร 505, Table 1)**

| พารามิเตอร์ (Parameter) | ช่วงอายุ (Age) | เพศ (Sex) | ช่วงอ้างอิง (2.5th–97.5th Percentile) | หน่วย (Unit) |
| :--- | :--- | :--- | :--- | :--- |
| **Hemoglobin (Hb)** | ผู้ใหญ่ (18–99 ปี) | ชาย (Male) | **130 – 170** (เทียบเท่า 13.0 – 17.0) | g/L (g/dL) |
| **Hemoglobin (Hb)** | ผู้ใหญ่ (18–99 ปี) | หญิง (Female) | **111 – 148** (เทียบเท่า 11.1 – 14.8) | g/L (g/dL) |
| **Hematocrit (Hct)** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | ชาย (Male) | **38.7 – 50.0** | % |
| **Hematocrit (Hct)** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | หญิง (Female) | **33.0 – 44.0** | % |
| **Red Blood Cell count (RBC)** | ผู้ใหญ่ (18–45 ปี) | ชาย (Male) | **4.4 – 5.6** | x 10¹²/L (x 10⁶/μL) |
| **Red Blood Cell count (RBC)** | ผู้ใหญ่ (18–45 ปี) | หญิง (Female) | **3.8 – 5.1** | x 10¹²/L (x 10⁶/μL) |
| **Mean Corpuscular Volume (MCV)** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | รวมทั้งสองเพศ | **83.3 – 98.0** | fL |
| **Mean Corpuscular Hemoglobin (MCH)** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | รวมทั้งสองเพศ | **27.7 – 33.2** | pg/cell |
| **MCHC** | ประชากรทั่วไป (3–99 ปี) | ชาย (Male) | **323 – 359** | g/L |
| **MCHC** | ประชากรทั่วไป (3–99 ปี) | หญิง (Female) | **317 – 351** | g/L |
| **RDW** | ประชากรทั่วไป (3–74 ปี) | รวมทั้งสองเพศ | **11.9 – 14.3** | % |

* **ข้อความสนับสนุนจากเอกสาร**:
  > *"RBC parameters increased with age until adulthood and decreased with age in males... In Table 1: Hb (g/L) for 18–99 yr male: 130–170, female: 111–148. Hct (%) for 15–99 yr male: 38.7–50.0, female: 33.0–44.0."*

---

#### ค. ค่าอ้างอิงเม็ดเลือดขาวและเกล็ดเลือด (White Blood Cell & Platelet Parameters)
* **ตำแหน่งหน้า**: **หน้า 4 (เลขหน้าวารสาร 506, Table 2)**

| พารามิเตอร์ (Parameter) | ช่วงอายุ (Age) | เพศ (Sex) | ช่วงอ้างอิง (2.5th–97.5th Percentile) | หน่วย (Unit) |
| :--- | :--- | :--- | :--- | :--- |
| **White Blood Cell count (WBC)** | ทั่วไป (3–99 ปี) | ชาย (Male) | **4.0 – 10.3** | x 10⁹/L |
| **White Blood Cell count (WBC)** | ทั่วไป (3–99 ปี) | หญิง (Female) | **3.5 – 9.6** | x 10⁹/L |
| **Neutrophils** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | รวมทั้งสองเพศ | **37.2 – 70.0** | % |
| **Lymphocytes** | วัยรุ่น–ผู้ใหญ่ (15–99 ปี) | รวมทั้งสองเพศ | **21.9 – 52.6** | % |
| **Monocytes** | ทั่วไป (3–99 ปี) | รวมทั้งสองเพศ | **3.9 – 10.0** | % |
| **Eosinophils** | ทั่วไป (3–99 ปี) | รวมทั้งสองเพศ | **0.4 – 7.5** | % |
| **Basophils** | วัยรุ่น–ผู้ใหญ่ (12–99 ปี) | รวมทั้งสองเพศ | **0.1 – 1.2** | % |
| **Platelet count** | วัยรุ่น–ผู้ใหญ่ (12–99 ปี) | รวมทั้งสองเพศ | **159.0 – 367.0** | x 10⁹/L |
| **Platelet Distribution Width (PDW)** | ทั่วไป (6–99 ปี) | รวมทั้งสองเพศ | **9.2 – 14.6** | % |
| **Mean Platelet Volume (MPV)** | ทั่วไป (3–99 ปี) | รวมทั้งสองเพศ | **8.9 – 11.8** | fL |

* **ข้อความสนับสนุนจากเอกสาร**:
  > *"Table 2: White blood cell count (10^9/L) 3-99 yr: Male 4.0-10.3, Female 3.5-9.6. Platelet count (10^9/L) 12-99 yr: 159.0-367.0."*

---

#### ง. เกณฑ์องค์การอนามัยโลก (WHO Anemia Thresholds Mentioned)
* **ตำแหน่งหน้า**: **หน้า 4 (เลขหน้าวารสาร 506, Discussion)**
* **ข้อเท็จจริง**: เอกสารอภิปรายถึงเกณฑ์ของ WHO ในการวินิจฉัยภาวะโลหิตจาง (Anemia Cutoff):
  * เพศชาย: **130 g/L (13.0 g/dL)**
  * เพศหญิงที่ไม่ตั้งครรภ์: **120 g/L (12.0 g/dL)**
* **ข้อความสนับสนุนจากเอกสาร**:
  > *"The WHO Hb cutoff for mild anemia in adults is 130 g/L for men and 120 g/L for non-pregnant women..."*

---

#### จ. ข้อมูลที่เอกสารนี้ **ไม่มี** (สำหรับทดสอบ Insufficient Evidence / Anti-Hallucination)
1. **HbA1c และเกณฑ์วินิจฉัยโรคเบาหวาน (Diabetes Mellitus)**: เอกสารนี้ไม่มีการตรวจระดับน้ำตาลหรือเกณฑ์ของ ADA
2. **การย้อมสีแบคทีเรีย Gram stain**: เอกสารนี้ไม่มีข้อมูลจุลชีววิทยา
3. **การทดสอบหมู่เลือด ABO / Rh Forward/Reverse Typing**: เอกสารนี้ไม่มีข้อมูล Blood Bank
4. **เลขหน้า 10 เป็นต้นไป**: เอกสารมีเพียง 9 หน้า การอ้างอิงหน้า 10, 11 หรือ 99 ถือเป็น Citation Hallucination

---

### 4. สรุปความพร้อมสำหรับการทดสอบ B1.6 (Live Validation Readiness)
เอกสารฉบับนี้เป็นเอกสารปฐมภูมิต้นฉบับจริง สามารถนำมาใช้เป็น Ground Truth ในการตรวจสอบความถูกต้องของคำตอบทั้ง 5 ประเภท (Direct, Crosslingual, Multi-evidence, Insufficient-evidence, และ Citation Validation) ได้อย่างแม่นยำและตรวจสอบย้อนกลับได้จริง
