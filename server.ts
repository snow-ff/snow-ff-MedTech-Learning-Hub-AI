import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize GoogleGenAI client server-side with verified model and config
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Academic fallback generator for robust offline / quota-exceeded handling
export function getAcademicFallback(prompt: string) {
  const p = prompt.toLowerCase();
  const isContextualFollowUp = !p.includes("flow cytometry") && 
    !p.includes("pcr") && 
    !p.includes("qpcr") && 
    !p.includes("cbc") && 
    !p.includes("เดงกี่") && 
    !p.includes("dengue") && 
    !p.includes("crossmatching") && 
    !p.includes("blood") && 
    !p.includes("หมู่เลือด") && 
    !p.includes("เม็ดเลือดขาว") && 
    !p.includes("gram") && 
    !p.includes("แกรม") && 
    !p.includes("stain");
  
  const prefixNotice = isContextualFollowUp 
    ? `*(หมายเหตุ: ระบบอยู่ในโหมดข้อมูลสำรองทางวิชาการ (Academic Fallback Mode) เนื่องจากโควตา API เต็ม และคำถามของคุณอาจอ้างถึงบริบทก่อนหน้าซึ่งระบบออฟไลน์ไม่สามารถประมวลผลต่อเนื่องแบบ Multi-turn ได้อย่างสมบูรณ์ กรุณาระบุชื่อหัวข้อเต็ม เช่น Flow Cytometry หรือ PCR เพื่อรับข้อมูลสำรองที่ถูกต้อง)*\n\n`
    : `*(หมายเหตุ: โควตาการใช้งานฟรีของ Gemini API เต็มชั่วคราว ระบบได้แสดงข้อมูลวิชาการสำรอง (Academic Fallback Mode) เพื่อให้การเรียนรู้ดำเนินต่อไปได้)*\n\n`;

  if (p.includes("flow cytometry") || (p.includes("เม็ดเลือดขาว") && !p.includes("cbc"))) {
    return {
      text: prefixNotice + `**หลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว (Leukocyte Differentiation)**

1. **หลักการพื้นฐาน (Core Principle):**
   - Flow Cytometry อาศัยการตรวจวัดคุณสมบัติทางแสงและฟิสิกส์ของเซลล์ทีละเซลล์ (Single-cell analysis) ขณะที่เซลล์ไหลผ่านลำแสงเลเซอร์ (Laser beam) ในของเหลวที่มีการจัดระเบียบแบบ Hydrodynamic focusing

2. **พารามิเตอร์หลักในการวิเคราะห์:**
   - **Forward Scatter (FSC):** สะท้อนขนาดของเซลล์ (Cell size / Volume) เซลล์ที่มีขนาดใหญ่จะมีค่า FSC สูง
   - **Side Scatter (SSC):** สะท้อนความซับซ้อนภายในเซลล์หรือการมี Granule (Cell granularity / Complexity) เช่น นิวเคลียสและแกรนูลในเม็ดเลือดขาวชนิดต่างๆ
   - **ข้อควรระวังสำคัญ (Caveat):** การกระจายตัวของ FSC และ SSC เพียงอย่างเดียวช่วยในการจำแนกกลุ่มเซลล์เม็ดเลือดขาวเบื้องต้นแบบกว้าง (Broad initial cell discrimination เช่น แยกกลุ่ม Lymphocytes, Monocytes, Granulocytes) แต่**ไม่เพียงพอสำหรับการจำแนกชนิดเซลล์อย่างเด็ดขาด (Definitive classification)** เนื่องจากมีความแปรปรวนและความทับซ้อนของประชากรเซลล์ จำเป็นต้องอาศัยการย้อมด้วย Monoclonal antibodies ติดฉลากสารเรืองแสงจำเพาะ (Immunophenotyping) และการตั้งเกณฑ์การคัดแยก (Gating strategies เช่น CD45 vs SSC) ร่วมด้วยเสมอ

3. **การจำแนกชนิดเม็ดเลือดขาว (Immunophenotyping):**
   - ใช้ Monoclonal antibodies ที่ติดฉลากด้วยสารเรืองแสง (Fluorochrome) เพื่อจับกับ Surface markers (CD markers) จำเพาะ เช่น:
     - **T-lymphocytes:** CD3+, CD4+ (Helper), CD8+ (Cytotoxic)
     - **B-lymphocytes:** CD19+, CD20+
     - **Natural Killer (NK) cells:** CD16+, CD56+
     - **Monocytes & Granulocytes:** จำแนกได้ชัดเจนตามกราฟการกระจายตัวของ FSC/SSC และ CD marker เฉพาะ

4. **การประยุกต์ทางคลินิก:**
   - การวินิจฉัยและติดตามโรคทางโลหิตวิทยา เช่น Leukemia และ Lymphoma
   - การประเมินเซลล์เม็ดเลือดขาว CD4 ในผู้ป่วย HIV
   - การทดสอบความเข้ากันได้และการปลูกถ่ายเซลล์`,
      references: [
        { 
          title: "Flow Cytometry Blood Cell Identification", 
          uri: "https://www.ncbi.nlm.nih.gov/books/NBK608011/" 
        }
      ]
    };
  } else if (p.includes("pcr") || p.includes("real-time") || p.includes("qpcr")) {
    return {
      text: prefixNotice + `**ความแตกต่างระหว่าง Conventional PCR และ Real-Time PCR (qPCR) ในงานตรวจวินิจฉัยโมเลกุล**

1. **Conventional PCR (Polymerase Chain Reaction):**
   - **การตรวจวัดผล (Detection):** อาศัยการทำ Agarose Gel Electrophoresis หลังปฏิกิริยาเสร็จสิ้น (End-point analysis)
   - **การบอกปริมาณ (Quantitation):** เป็นแบบกึ่งปริมาณ (Semi-quantitative) หรือ Qualitative (ตรวจพบหรือไม่พบเท่านั้น) เนื่องจากไม่สามารถวัดปริมาณ DNA ในช่วง Exponential phase ได้แม่นยำ
   - **ความเสี่ยง:** มีโอกาสเกิด Cross-contamination สูงเนื่องจากต้องเปิดฝาหลอดเพื่อนำผลิตภัณฑ์ไปทำ Gel Electrophoresis

2. **Real-Time PCR (qPCR):**
   - **การตรวจวัดผล:** วัดสัญญาณเรืองแสง (Fluorescence) แบบเรียลไทม์ในทุกรอบการเพิ่มขยาย (Cycle) โดยใช้สีย้อม intercalating dye เช่น SYBR Green หรือโพรบจำเพาะเช่น TaqMan Hydrolysis Probe
   - **การบอกปริมาณ (Quantitation):** เป็นแบบเชิงปริมาณแท้จริง (Absolute / Relative Quantification) ผ่านค่า **Quantification Cycle (Cq)** หรือ **Threshold Cycle (Ct)** ซึ่งแปรผกผันกับปริมาณกรดนิวคลีอิกเริ่มต้น
   - **ข้อได้เปรียบทางเทคนิค:** ระบบหลอดปิด (Closed-tube system) ช่วยลดความเสี่ยงการปนเปื้อนของแอมพลิคอนข้ามหลอด (Carryover contamination) และลดขั้นตอนการทำเจลอิเล็กโทรโฟเรซิส ทั้งนี้ ความไวในการตรวจวัด (Analytical Sensitivity) ขึ้นอยู่กับการออกแบบไพรเมอร์ ประสิทธิภาพของปฏิกิริยา และคุณภาพของการสกัด ไม่ควรเหมารวมว่า Real-Time PCR ต้องมีความไวสูงกว่า Conventional PCR ในทุกกรณีเสมอไป

3. **ข้อควรระวังในการแปลผลรอบ (Cq/Ct Interpretation):**
   - ตามแนวทางมาตรฐานสากล **MIQE 2.0 (2025)** การแปลผลค่า Cq/Ct ขึ้นอยู่กับการตรวจสอบความถูกต้องของวิธีตรวจเฉพาะ (Assay validation), ขีดจำกัดการตรวจพบ (Limit of Detection - LoD), การตั้งค่า Baseline/Threshold และการควบคุมคุณภาพด้วยชุดควบคุม (Positive, Negative, NTC) จึงไม่ควรใช้เกณฑ์ตัดรอบที่ตายตัวแบบเหมารวม (เช่น การสรุปว่า Ct > 40 เป็นลบ หรือ Ct < 40 เป็นบวกเสมอ) โดยปราศจากการประเมินประสิทธิภาพของระบบตรวจและสภาวะการทดสอบ

4. **การประยุกต์ทางเทคนิคการแพทย์:**
   - ตรวจหาเชื้อไวรัสและแบคทีเรียและวัดปริมาณไวรัส (Viral Load testing เช่น HIV-1, HBV, HCV, SARS-CoV-2)
   - ตรวจสอบยีนกลายพันธุ์ในโรคมะเร็งและโรคทางพันธุกรรม`,
      references: [
        { 
          title: "MIQE 2.0: Revision of the Minimum Information for Publication of Quantitative Real-Time PCR Experiments Guidelines (Clinical Chemistry, 2025)", 
          uri: "https://academic.oup.com/clinchem/article/71/6/634/8119148" 
        },
        { 
          title: "A Basic Guide to Real Time PCR in Microbial Diagnostics: Definitions, Parameters, and Everything (Frontiers in Microbiology, 2017)", 
          uri: "https://pubmed.ncbi.nlm.nih.gov/28210243/" 
        }
      ]
    };
  } else if (p.includes("gram") || p.includes("แกรม") || p.includes("stain")) {
    return {
      text: prefixNotice + `**หลักการย้อมสีแกรม (Gram Stain Protocols) และการควบคุมคุณภาพทางจุลชีววิทยาคลินิก**

1. **หลักการพื้นฐาน (Core Principle):**
   - การย้อมสีแยกชนิดแบคทีเรีย (Differential Staining) ตามโครงสร้างและความหนาของชั้น Peptidoglycan ในผนังเซลล์
   - **Gram-positive bacteria:** มีผนังเซลล์ Peptidoglycan หนาและมีสาร Teichoic acid ช่วยกักเก็บสารเชิงซ้อน Crystal Violet - Iodine (CV-I complex) ไม่ให้ถูกชะล้างออก ติดสีม่วง (Purple/Deep Blue)
   - **Gram-negative bacteria:** มีชั้น Peptidoglycan บาง และมีผนังเซลล์ชั้นนอก (Outer membrane) ที่มี Lipids สูง เมื่อถูกชะด้วยตัวทำละลายอินทรีย์ ลิพิดจะละลายและเกิดรูพรุน ทำให้ CV-I complex หลุดออก และติดสีทับ (Counterstain) ย้อมสีแดงหรือชมพู (Pink/Red)

2. **ขั้นตอนมาตรฐานและข้อควรระวังเรื่องระยะเวลาฟอกสี (Method-Dependent Decolorization):**
   - **Step 1 (Primary Stain):** ย้อมด้วย Crystal Violet
   - **Step 2 (Mordant):** หยด Gram's Iodine เพื่อสร้างสารเชิงซ้อนขนาดใหญ่ (CV-I complex) ตรึงในเซลล์
   - **Step 3 (Decolorization - ขั้นตอนวิกฤต):** ล้างด้วย Decolorizer (เช่น 95% Ethanol หรือ Acetone-Alcohol mixture)
     - **ข้อควรระวังเรื่องระยะเวลาการฟอกสี:** ตามโพรโทคอลมาตรฐานของ ASM ระยะเวลาการฟอกสีขึ้นอยู่กับชนิดของตัวทำละลายและความหนาของรอยสเมียร์ (Method-dependent & Smear thickness-dependent) โดย Acetone ออกฤทธิ์เร็วกว่าแอลกอฮอล์มาก จึงไม่สามารถกำหนดระยะเวลาเป็นวินาทีตายตัวสำหรับทุกระบบน้ำยาได้ วิธีปฏิบัติมาตรฐานคือหยดสารฟอกสีให้ไหลผ่านสเมียร์จนกระทั่งสารละลายที่ไหลลงมาไม่มีสีม่วงหลุดออกมาอีก (Flow of decolorizer runs clear) แล้วรีบล้างน้ำทันทีเพื่อหยุดปฏิกิริยา การฟอกสีนานเกินไป (Over-decolorization) จะทำให้แบคทีเรียแกรมบวกติดสีแดงลวง และการฟอกสีน้อยเกินไป (Under-decolorization) จะทำให้แบคทีเรียแกรมลบติดสีม่วงลวง
   - **Step 4 (Counterstain):** ย้อมสีทับด้วย Safranin หรือ 0.1% Basic Fuchsin

3. **การควบคุมคุณภาพ (Quality Control):**
   - ย้อมสไลด์ QC ร่วมด้วยเสมอ เช่น *Staphylococcus aureus* (Gram-positive cocci) และ *Escherichia coli* (Gram-negative bacilli) จากโคโลนีที่เพาะเลี้ยงสดใหม่ (18-24 ชั่วโมง)`,
      references: [
        { title: "Gram Stain Protocols", uri: "https://asm.org/protocols/gram-stain-protocols" }
      ]
    };
  } else if (p.includes("เดงกี่") || p.includes("dengue")) {
    return {
      text: prefixNotice + `**การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อไวรัสเดงกี่ (Dengue Infection)**

1. **ลักษณะทางโลหิตวิทยาที่สำคัญในโรคไข้เลือดออก (Dengue Hemorrhagic Fever - DHF):**
   - **Hemoglobin (Hb) & Hematocrit (Hct):** 
     - เกิดการรั่วของพลาสมา (Plasma leakage) ออกจากหลอดเลือดเนื่องจากความซึมได้ของหลอดเลือดฝอยเพิ่มขึ้น
     - เกณฑ์การเพิ่มขึ้นของค่า **Hematocrit (Hct) ≥ 20%** จากค่าพื้นฐานเดิม เป็นเกณฑ์ประเมินภาวะ Hemoconcentration ในเชิงประวัติศาสตร์ตามแนวทางขององค์การอนามัยโลก (WHO 2009 Historical Criterion) ทั้งนี้ในแนวทางเวชปฏิบัติปัจจุบัน ไม่ได้ใช้ตัวเลข 20% เป็นเกณฑ์วินิจฉัยสากลเพียงข้อเดียว แต่ต้องประเมินแนวโน้มการเปลี่ยนแปลงของ Hct ควบคู่กับอาการทางคลินิก สัญญาณชีพ และสมดุลสารน้ำของผู้ป่วยอย่างใกล้ชิด
   - **White Blood Cell (WBC) Count:**
     - มักพบภาวะ **Leukopenia** (เม็ดเลือดขาวต่ำ) โดยเฉพาะในระยะไข้ (Febrile phase)
     - อาจพบเม็ดเลือดขาวชนิด Atypical lymphocytes เพิ่มสูงขึ้น
   - **Platelet Count (เกล็ดเลือด):**
     - พบภาวะ **Thrombocytopenia** อย่างเด่นชัด (เกล็ดเลือดต่ำกว่า 100,000 cells/mm³) ซึ่งเกิดจากการกดไขกระดูกและการทำลายเกล็ดเลือดเพิ่มขึ้น

2. **ความสำคัญทางห้องปฏิบัติการ:**
   - การติดตามค่า Hct และ Platelet อย่างใกล้ชิดช่วยให้แพทย์ประเมินความรุนแรงของโรคและภาวะ Shock ได้ทันท่วงที`,
      references: [
        { title: "WHO Guidelines - Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control (2009)", uri: "https://www.who.int/publications/i/item/9789241547871" },
        { title: "Clinical Care of Dengue | Dengue | CDC", uri: "https://www.cdc.gov/dengue/hcp/clinical-care/" }
      ]
    };
  } else if (p.includes("cbc") || p.includes("เม็ดเลือด")) {
    return {
      text: prefixNotice + `**หลักการตรวจวิเคราะห์ Complete Blood Count (CBC), การตรวจแยกชนิดเม็ดเลือดขาว และการควบคุมคุณภาพด้วย Westgard Rules**

1. **หลักการตรวจวัดด้วยเครื่องวิเคราะห์อัตโนมัติ (Automated Hematology Analyzer):**
   - **Electrical Impedance (Coulter Principle):** อาศัยการเปลี่ยนแปลงความต้านทานไฟฟ้าเมื่อเซลล์ผ่านช่อง Aperture เพื่อตรวจนับจำนวนและประเมินขนาดของเม็ดเลือดแดง (RBC) และเกล็ดเลือด (Platelets)
   - **Optical Light Scatter / Flow-based Detection:** ใช้แสงเลเซอร์วัดการกระเจิงของแสง (Forward Scatter วัดขนาดเซลล์, Side Scatter วัดความซับซ้อนภายใน) ร่วมกับการย้อมไซโตเคมีเพื่อจำแนกชนิดเม็ดเลือดขาว (WBC 5-Part Differential)

2. **การตรวจแยกชนิดเม็ดเลือดขาวและข้อจำกัดของเครื่องอัตโนมัติ (Leukocyte Differential & Smear Review):**
   - **วิธีอ้างอิงสำหรับการนับแยกชนิดเม็ดเลือดขาว:**
     *(อ้างอิงมาตรฐาน: CLSI H20 3rd Edition — มีขอบเขตเฉพาะวิธีอ้างอิงแมนนวลเพื่อประเมินความถูกต้องของเครื่องตรวจนับ WBC Differential)*
     - มาตรฐาน CLSI H20 ฉบับที่ 3 (Third Edition, เผยแพร่ 29 เมษายน 2026 แทนที่ H20-A2 เดิม) กำหนดวิธีอ้างอิงในการนับแยกชนิดเม็ดเลือดขาวด้วยสายตา (Reference visual WBC differential) เพื่อใช้ประเมินและทวนสอบความแม่นยำของเครื่องตรวจอัตโนมัติ
   - **การตรวจยืนยันสัณฐานวิทยาทางโลหิตวิทยา (Hematologic Morphology Review):**
     *(หมายเหตุ: เกณฑ์การตรวจสเมียร์เลือดเมื่อพบสัญญาณเตือน Analyzer Flags หรือสงสัยเซลล์ตัวอ่อน เช่น Blasts เป็นแนวทางปฏิบัติทั่วไปของห้องปฏิบัติการตามเกณฑ์ทบทวนสไลด์ระดับสถาบัน มิได้ครอบคลุมอยู่ในมาตรฐาน CLSI H20)*
     - เมื่อเครื่องตรวจส่งสัญญาณเตือน (Flags) หรือตรวจพบความผิดปกติที่เครื่องไม่สามารถจำแนกได้อย่างแม่นยำ นักเทคนิคการแพทย์จำเป็นต้องย้อมและตรวจดูแผ่นฟิล์มเลือดเพื่อตรวจยืนยันความผิดปกติทางสัณฐานวิทยา เช่น การพบเม็ดเลือดขาวตัวอ่อน หรือความผิดปกติของเม็ดเลือดแดง (เช่น Schistocytes ในภาวะ MAHA)
   - **ภาวะเกล็ดเลือดต่ำลวงจากสารกันเลือดแข็ง EDTA (EDTA-Dependent Pseudothrombocytopenia):**
     *(อ้างอิงบทความวิจัย: Lippi G, et al. PubMed 25425098)*
     - เป็นปรากฏการณ์ภายนอกร่างกาย (In vitro artifact) ที่เกิดจากแอนติบอดีจับกับเกล็ดเลือดเมื่อมีสาร EDTA ทำให้เกิดการเกาะกลุ่ม (Platelet clumping) จนเครื่องตรวจนับผิดพลาดเป็นเกล็ดเลือดต่ำ การยืนยันทำได้โดยการตรวจดูสเมียร์เลือดและเจาะเลือดซ้ำด้วยหลอดเก็บเลือดที่มีสารกันเลือดแข็งชนิดอื่น เช่น Sodium Citrate หรือ Heparin

3. **การควบคุมคุณภาพเชิงสถิติ (Statistical Quality Control & Westgard Multirules):**
   *(อ้างอิงเฉพาะกฎการควบคุมคุณภาพ: Westgard JO, et al. Clin Chem 1981)*
   - ทำ Internal QC อย่างน้อย 2-3 ระดับ (Low, Normal, High) บันทึกลง Levey-Jennings Chart ประเมินด้วย Westgard Multirules:
     - **1_2s:** กฎเตือน (Warning Rule) เมื่อมี 1 ค่าหลุดเกิน ±2SD (ให้ตรวจสอบเพิ่มเติม ไม่ปฏิเสธ Run ทันที)
     - **1_3s:** ปฏิเสธการทดสอบ (Rejection / Random Error) เมื่อมี 1 ค่าหลุดเกิน ±3SD
     - **2_2s:** ปฏิเสธการทดสอบ (Rejection / Systematic Error) เมื่อมี 2 ค่าติดต่อกันหลุดเกิน ±2SD ในทิศทางเดียวกัน
     - **R_4s:** ปฏิเสธการทดสอบ (Rejection / Random Error) เมื่อผลต่างระหว่าง 2 ค่าใน Run เดียวกันห่างกันเกิน 4SD
     - **4_1s และ 10_x:** ตรวจจับ Systematic Bias เมื่อมี 4 ค่าต่อเนื่องเกิน ±1SD หรือ 10 ค่าต่อเนื่องอยู่ฝั่งเดียวกันของ Mean`,
      references: [
        { title: "CLSI H20: Reference Leukocyte Differential Count (Proportional) and Evaluation of Instrumental Methods (3rd Edition)", uri: "https://clsi.org/shop/standards/h20/" },
        { title: "Discovery and Correction of Spurious Low Platelet Counts due to EDTA-Dependent Pseudothrombocytopenia", uri: "https://pubmed.ncbi.nlm.nih.gov/25425098/" },
        { title: "Westgard JO, et al. A Multi-Rule Shewhart Chart for Quality Control in Clinical Chemistry (Clin Chem 1981 / PubMed 7201955)", uri: "https://pubmed.ncbi.nlm.nih.gov/7201955/" }
      ]
    };
  } else if (p.includes("crossmatching") || p.includes("blood grouping") || p.includes("หมู่เลือด")) {
    return {
      text: prefixNotice + `**ขั้นตอนการทำ Crossmatching และการตรวจหมู่เลือด (Blood Grouping & Crossmatch)**

1. **การตรวจหมู่เลือด (Blood Grouping):**
   - **ABO Grouping:** 
     - *Cell grouping (Forward typing):* ตรวจแอนติเจนบนเม็ดเลือดแดงของผู้ป่วยด้วย Anti-A, Anti-B, และ Anti-AB
     - *Serum grouping (Reverse typing):* ตรวจแอนติบอดีในซีรั่มของผู้ป่วยด้วย A1 cells และ B cells ผลทั้งสองด้านต้องตรงกันจึงจะยืนยันหมู่เลือดได้
   - **Rh Typing:** ตรวจหาแอนติเจน D โดยใช้ Anti-D หากพบการตกตะกอนถือเป็น Rh Positive

2. **ขั้นตอนการทดสอบความเข้ากันได้ (Crossmatching):**
   - **Major Crossmatch:** นำ **ซีรั่ม (Serum/Plasma) ของผู้ป่วย** มาทดสอบกับ **เม็ดเลือดแดงของผู้บริจาค (Donor red cells)** เพื่อตรวจหาแอนติบอดีในผู้ป่วยที่อาจไปทำลายเม็ดเลือดแดงผู้บริจาค
   - **Minor Crossmatch (ปัจจุบันมักถูกทดแทนด้วยการตรวจ Donor Screening):** นำซีรั่มของผู้บริจาคมาทดสอบกับเม็ดเลือดแดงผู้ป่วย

3. **เทคนิคและระยะเวลาทดสอบ:**
   - **Immediate Spin Phase:** ตรวจสอบหมู่เลือด ABO mismatch (ใช้เวลาประมาณ 1-2 นาที)
   - **37°C Incubation & AHG (Antiglobulin Test / Coombs' Test) Phase:** ตรวจสอบแอนติบอดีชนิด IgG ที่ไม่เกาะกลุ่มในเบื้องต้น (เช่น Anti-Rh, Anti-Kell) โดยใช้ AHG reagent
   - หากผลทดสอบทุกเฟส **ไม่มีการตกตะกอนหรือเม็ดเลือดแตก (No Agglutination & No Hemolysis)** ถือว่าเข้ากันได้ (Compatible) สามารถจ่ายเลือดให้ผู้ป่วยได้

4. **ข้อกำหนดความปลอดภัย (Disclaimer):**
   - ขั้นตอนข้างต้นเป็นเพียงสรุปหลักการทางทฤษฎีเพื่อการศึกษาเท่านั้น ไม่ใช่แนวทางปฏิบัติงานมาตรฐานทางคลินิก (Clinical SOP) การปฏิบัติงานจริงในห้องปฏิบัติการธนาคารเลือดต้องยึดถือตาม SOP ที่ผ่านการรับรองของแต่ละสถาบันและข้อกำหนดมาตรฐานงานบริการโลหิตอย่างเคร่งครัด`,
      references: [
        { title: "AABB Technical Manual, 22nd Edition", uri: "https://www.aabb.org/aabb-store/product/technical-manual-22nd-edition-print-21871175" },
        { title: "Blood Groups and Red Cell Antigens", uri: "https://www.ncbi.nlm.nih.gov/books/NBK2261/" }
      ]
    };
  } else {
    return {
      text: prefixNotice + `**คำตอบทางวิชาการสำหรับการสอบถามของคุณ**

1. **ระบบบริหารคุณภาพห้องปฏิบัติการ (Quality Management System):**
   *(อ้างอิงมาตรฐานระบบคุณภาพ: CLSI QMS01 Ed5)*
   - การตรวจวิเคราะห์ทางห้องปฏิบัติการทางการแพทย์ต้องดำเนินงานภายใต้ระบบบริหารคุณภาพ (QMS) ที่ครอบคลุม 12 องค์ประกอบคุณภาพสำคัญ (Quality System Essentials) ตั้งแต่ระยะก่อนการวิเคราะห์ (Pre-examination), ระหว่างการวิเคราะห์ (Examination), จนถึงหลังการวิเคราะห์ (Post-examination)

2. **การควบคุมคุณภาพตามการประเมินความเสี่ยง (Risk-Based Quality Control):**
   *(อ้างอิงมาตรฐานการควบคุมคุณภาพ: CLSI EP23)*
   - การวางแผนควบคุมคุณภาพ (Quality Control Plan - QCP) ต้องอาศัยหลักการประเมินและบริหารความเสี่ยงที่เหมาะสมกับระบบตรวจวิเคราะห์แต่ละชนิด เพื่อป้องกันและตรวจจับข้อผิดพลาดทั้งเชิงสุ่ม (Random Error) และเชิงระบบ (Systematic Error)

3. **การกำหนดและทวนสอบค่าอ้างอิง (Reference Intervals):**
   *(อ้างอิงมาตรฐานค่าอ้างอิง: CLSI EP28-A3c)*
   - ผลการตรวจวิเคราะห์ต้องได้รับการแปลผลร่วมกับช่วงค่าอ้างอิง (Reference Intervals) ที่ผ่านการศึกษาและทวนสอบความเหมาะสมกับกลุ่มประชากรและวิธีตรวจของห้องปฏิบัติการ`,
      references: [
        { title: "CLSI QMS01: A Quality Management System Model for Laboratory Services (5th Edition)", uri: "https://clsi.org/shop/standards/qms01/" },
        { title: "CLSI EP23: Laboratory Quality Control Based on Risk Management (2nd Edition)", uri: "https://clsi.org/shop/standards/ep23/" },
        { title: "CLSI EP28-A3c: Defining, Establishing, and Verifying Reference Intervals in the Clinical Laboratory (3rd Edition)", uri: "https://clsi.org/shop/standards/ep28/" }
      ]
    };
  }
}

// API endpoint for Gemini generation with multi-turn messages, retry, exponential backoff, and Google Search Grounding
app.post("/api/gemini/generate", async (req, res) => {
  const requestStartTime = Date.now();
  const { messages, prompt } = req.body;

  // Server-side validation of messages array
  let validatedMessages: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(messages)) {
    if (messages.length === 0 || messages.length > 8) {
      return res.status(400).json({ error: "จำนวนข้อความในประวัติการสนทนาต้องอยู่ระหว่าง 1 ถึง 8 ข้อความ" });
    }
    let totalChars = 0;
    for (const msg of messages) {
      if (!msg || (msg.role !== 'user' && msg.role !== 'model') || typeof msg.text !== 'string' || !msg.text.trim()) {
        return res.status(400).json({ error: "รูปแบบข้อความใน messages ไม่ถูกต้อง (role หรือ text ไม่ผ่านการตรวจสอบ)" });
      }
      if (msg.text.length > 4000) {
        return res.status(400).json({ error: "ข้อความมีความยาวเกินกำหนด (สูงสุด 4,000 ตัวอักษรต่อข้อความ)" });
      }
      totalChars += msg.text.length;
      validatedMessages.push({ role: msg.role, text: msg.text.trim() });
    }

    const MAX_TOTAL_CHARS = 15000;
    if (totalChars > MAX_TOTAL_CHARS) {
      return res.status(400).json({ error: "ความยาวรวมของข้อความทั้งหมดเกินกำหนด (สูงสุด 15,000 ตัวอักษร)" });
    }

    // Must start with user
    if (validatedMessages[0].role !== 'user') {
      return res.status(400).json({ error: "ประวัติการสนทนาต้องเริ่มต้นด้วยผู้ใช้ (user)" });
    }

    // Check strict role alternation (no consecutive duplicate roles)
    for (let i = 0; i < validatedMessages.length - 1; i++) {
      if (validatedMessages[i].role === validatedMessages[i + 1].role) {
        return res.status(400).json({ error: "ลำดับบทบาทผู้ใช้และโมเดลต้องสลับกัน (ไม่สามารถมี role ซ้ำติดกันได้)" });
      }
    }

    // Ensure last message is from user
    if (validatedMessages[validatedMessages.length - 1].role !== 'user') {
      return res.status(400).json({ error: "ข้อความล่าสุดในประวัติการสนทนาต้องมาจากผู้ใช้ (user)" });
    }
  } else if (prompt && typeof prompt === 'string' && prompt.trim()) {
    // Backward compatibility for single prompt requests
    validatedMessages = [{ role: 'user', text: prompt.trim() }];
  } else {
    return res.status(400).json({ error: "กรุณาระบุประวัติการสนทนา (messages) หรือคำถาม (prompt)" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "ไม่พบ GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่า Secrets" });
  }

  const latestPrompt = validatedMessages[validatedMessages.length - 1].text;

  const systemInstruction = `คุณคือผู้ช่วย AI วิชาการสำหรับ "MedTech Learning Hub AI" ซึ่งเป็นแพลตฟอร์มการเรียนรู้สำหรับนักศึกษาเทคนิคการแพทย์ไทย (Medical Technology Students)
โปรดตอบคำถามโดยใช้ภาษาไทยเป็นหลัก พร้อมทั้งรักษาคำศัพท์ภาษาอังกฤษทางการแพทย์และเทคนิคที่สำคัญไว้ (เช่น Complete Blood Count, Flow Cytometry, PCR, Spectrophotometry เป็นต้น)
ในการตอบ ให้ให้ข้อมูลวิชาการที่ถูกต้องและเป็นประโยชน์สำหรับนักศึกษาเทคนิคการแพทย์ พร้อมอ้างอิงจากแหล่งข้อมูลที่น่าเชื่อถือ`;

  // Map validated messages to Gemini SDK contents format
  const contents = validatedMessages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  let attempt = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStartTime = Date.now();
    try {
      // Use ThinkingLevel.LOW and googleSearch grounding tool with multi-turn contents
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: [{ googleSearch: {} }],
        },
      });

      const attemptDuration = Date.now() - attemptStartTime;
      const totalBackendDuration = Date.now() - requestStartTime;
      console.log(`[Perf Backend] Gemini API success on attempt ${attempt}. Call duration: ${attemptDuration}ms, Total backend duration: ${totalBackendDuration}ms`);

      const text = response.text;
      if (!text) {
        throw new Error("ไม่ได้รับคำตอบจากโมเดล Gemini");
      }

      // Safely extract grounding metadata references
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const references: Array<{ title: string; uri: string }> = [];
      if (groundingMetadata && groundingMetadata.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web && chunk.web.uri && chunk.web.title) {
            const uri = chunk.web.uri;
            if (uri.startsWith("http://") || uri.startsWith("https://")) {
              if (!references.some(r => r.uri === uri)) {
                references.push({
                  title: chunk.web.title,
                  uri: uri,
                });
              }
            }
          }
        }
      }

      const hasGrounding = references.length > 0;
      return res.json({
        text,
        source: hasGrounding ? "gemini_grounding" : "gemini_standard",
        references: hasGrounding ? references.map(r => ({ 
          ...r, 
          type: "web_search",
          linkAccessStatus: "unknown",
          verificationStatus: "unverified",
          reviewer: null,
          reviewDate: null,
          evidenceLocator: null,
          contentVersion: "1.2"
        })) : undefined,
      });
    } catch (err: any) {
      const attemptDuration = Date.now() - attemptStartTime;
      lastError = err;
      const message = err.message || "";
      const matchResult = message.match(/\b(503|429|500|408)\b/);
      const status = err.status || err.statusCode || (matchResult ? matchResult[1] : undefined);
      
      console.warn(`[Perf Backend] Gemini API attempt ${attempt} failed after ${attemptDuration}ms. Error: ${message}`);

      // Do not treat quota exhaustion (RESOURCE_EXHAUSTED / free tier request limit) as transient
      const isQuotaExhausted = message.includes("RESOURCE_EXHAUSTED") || message.includes("generate_content_free_tier_requests") || message.includes("Quota exceeded");

      const isTransient = !isQuotaExhausted && (
        Number(status) === 503 || Number(status) === 429 || Number(status) === 500 || Number(status) === 408 ||
        message.includes("503") || message.includes("429") || message.includes("500") || 
        message.includes("UNAVAILABLE") || 
        message.includes("overloaded") || message.includes("deadline") || message.includes("timeout") ||
        message.includes("fetch failed")
      );

      if (!isTransient || attempt >= maxAttempts) {
        break;
      }

      // Exponential backoff with random jitter (~1s, then ~2s + jitter)
      const backoffMs = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
      console.warn(`[Perf Backend] Retrying in ${Math.round(backoffMs)}ms (attempt ${attempt}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  const totalBackendDuration = Date.now() - requestStartTime;
  console.warn(`[Perf Backend] Gemini API encountered issue after ${attempt} attempts (${totalBackendDuration}ms total), serving robust academic fallback:`, lastError?.message);

  // Fallback to academic responses when API quota is exhausted or unavailable (using latestPrompt)
  const fallback = getAcademicFallback(latestPrompt);
  return res.json({
    text: fallback.text,
    source: "academic_fallback",
    references: fallback.references.map(r => ({
      ...r,
      type: r.uri ? "external_academic_link" : "simulated_reference",
      linkAccessStatus: "unknown",
      verificationStatus: "unverified",
      reviewer: null,
      reviewDate: null,
      evidenceLocator: r.uri ? "Direct Academic Source" : null,
      contentVersion: "1.2"
    })),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
