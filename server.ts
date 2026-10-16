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
  const isContextualFollowUp = !p.includes("flow cytometry") && !p.includes("pcr") && !p.includes("cbc") && !p.includes("เดงกี่") && !p.includes("dengue") && !p.includes("crossmatching") && !p.includes("blood") && !p.includes("หมู่เลือด") && !p.includes("เม็ดเลือดขาว");
  
  const prefixNotice = isContextualFollowUp 
    ? `*(หมายเหตุ: ระบบอยู่ในโหมดข้อมูลสำรองทางวิชาการ (Academic Fallback Mode) เนื่องจากโควตา API เต็ม และคำถามของคุณอาจอ้างถึงบริบทก่อนหน้าซึ่งระบบออฟไลน์ไม่สามารถประมวลผลต่อเนื่องแบบ Multi-turn ได้อย่างสมบูรณ์ กรุณาระบุชื่อหัวข้อเต็ม เช่น Flow Cytometry หรือ PCR เพื่อรับข้อมูลสำรองที่ถูกต้อง)*\n\n`
    : `*(หมายเหตุ: โควตาการใช้งานฟรีของ Gemini API เต็มชั่วคราว ระบบได้แสดงข้อมูลวิชาการสำรอง (Academic Fallback Mode) เพื่อให้การเรียนรู้ดำเนินต่อไปได้)*\n\n`;

  if (p.includes("flow cytometry") || p.includes("เม็ดเลือดขาว")) {
    return {
      text: prefixNotice + `**หลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว (Leukocyte Differentiation)**

1. **หลักการพื้นฐาน (Core Principle):**
   - Flow Cytometry อาศัยการตรวจวัดคุณสมบัติทางแสงและฟิสิกส์ของเซลล์ทีละเซลล์ (Single-cell analysis) ขณะที่เซลล์ไหลผ่านลำแสงเลเซอร์ (Laser beam) ในของเหลวที่มีการจัดระเบียบแบบ Hydrodynamic focusing

2. **พารามิเตอร์หลักในการวิเคราะห์:**
   - **Forward Scatter (FSC):** สะท้อนขนาดของเซลล์ (Cell size / Volume) เซลล์ที่มีขนาดใหญ่จะมีค่า FSC สูง
   - **Side Scatter (SSC):** สะท้อนความซับซ้อนภายในเซลล์หรือการมี Granule (Cell granularity / Complexity) เช่น นิวเคลียสและแกรนูลในเม็ดเลือดขาวชนิดต่างๆ

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
        { title: "ScienceDirect Topics - Flow Cytometry", uri: "https://www.sciencedirect.com/topics/biochemistry-genetics-and-molecular-biology/flow-cytometry" }
      ]
    };
  } else if (p.includes("pcr") || p.includes("real-time")) {
    return {
      text: prefixNotice + `**ความแตกต่างระหว่าง Conventional PCR และ Real-Time PCR (qPCR) ในงานตรวจวินิจฉัยโมเลกุล**

1. **Conventional PCR (Polymerase Chain Reaction):**
   - **การตรวจวัดผล (Detection):** อาศัยการทำ Agarose Gel Electrophoresis หลังปฏิกิริยาเสร็จสิ้น (End-point analysis)
   - **การบอกปริมาณ (Quantitation):** เป็นแบบกึ่งปริมาณ (Semi-quantitative) หรือ Qualitative (ตรวจพบหรือไม่พบเท่านั้น) เนื่องจากไม่สามารถวัดปริมาณ DNA ในช่วง Exponential phase ได้แม่นยำ
   - **ความเสี่ยง:** มีโอกาสเกิด Cross-contamination สูงเนื่องจากต้องเปิดฝาหลอดเพื่อนำผลิตภัณฑ์ไปทำ Gel Electrophoresis

2. **Real-Time PCR (qPCR):**
   - **การตรวจวัดผล:** วัดสัญญาณเรืองแสง (Fluorescence) แบบเรียลไทม์ในทุกรอบการเพิ่มขยาย (Cycle) โดยใช้สีย้อมเช่น SYBR Green หรือโพรบจำเพาะเช่น TaqMan Probe
   - **การบอกปริมาณ (Quantitation):** เป็นแบบเชิงปริมาณแท้จริง (Absolute / Relative Quantification) ผ่านค่า **Threshold Cycle (Ct)** ซึ่งแปรผกผันกับปริมาณ DNA เริ่มต้น
   - **ข้อดี:** ไม่ต้องเปิดหลอดหลังปฏิกิริยา ลดการปนเปื้อน (Closed-tube system) และมีความไว (Sensitivity) สูงกว่ามาก

3. **การประยุกต์ทางเทคนิคการแพทย์:**
   - ตรวจหาเชื้อไวรัสและแบคทีเรีย (Viral Load testing เช่น HIV, HBV, HCV, SARS-CoV-2)
   - ตรวจสอบยีนกลายพันธุ์ในโรคมะเร็งและโรคทางพันธุกรรม`,
      references: []
    };
  } else if (p.includes("cbc") || p.includes("เดงกี่") || p.includes("dengue")) {
    return {
      text: prefixNotice + `**การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อไวรัสเดงกี่ (Dengue Infection)**

1. **ลักษณะทางโลหิตวิทยาที่สำคัญในโรคไข้เลือดออก (Dengue Hemorrhagic Fever - DHF):**
   - **Hemoglobin (Hb) & Hematocrit (Hct):** 
     - เกิดการรั่วของพลาสมา (Plasma leakage) ออกจากหลอดเลือดเนื่องจากความซึมได้ของหลอดเลือดฝอยเพิ่มขึ้น
     - ทำให้ค่า **Hematocrit (Hct) เพิ่มสูงขึ้นมากกว่าหรือเท่ากับ 20%** จากค่าพื้นฐานเดิม ซึ่งถือเป็นเกณฑ์สำคัญในการวินิจฉัยภาวะ Hemoconcentration
   - **White Blood Cell (WBC) Count:**
     - มักพบภาวะ **Leukopenia** (เม็ดเลือดขาวต่ำ) โดยเฉพาะในระยะไข้ (Febrile phase)
     - อาจพบเม็ดเลือดขาวชนิด Atypical lymphocytes เพิ่มสูงขึ้น
   - **Platelet Count (เกล็ดเลือด):**
     - พบภาวะ **Thrombocytopenia** อย่างเด่นชัด (เกล็ดเลือดต่ำกว่า 100,000 cells/mm³) ซึ่งเกิดจากการกดไขกระดูกและการทำลายเกล็ดเลือดเพิ่มขึ้น

2. **ความสำคัญทางห้องปฏิบัติการ:**
   - การติดตามค่า Hct และ Platelet อย่างใกล้ชิดช่วยให้แพทย์ประเมินความรุนแรงของโรคและภาวะ Shock ได้ทันท่วงที`,
      references: [
        { title: "WHO Guidelines - Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control (2009)", uri: "https://www.who.int/publications/i/item/9789241547871" },
        { title: "CDC Clinical Guidance - Dengue", uri: "https://www.cdc.gov/dengue/clinical-guidance/index.html" }
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
   - หากผลทดสอบทุกเฟส **ไม่มีการตกตะกอนหรือเม็ดเลือดแตก (No Agglutination & No Hemolysis)** ถือว่าเข้ากันได้ (Compatible) สามารถจ่ายเลือดให้ผู้ป่วยได้`,
      references: [
        { title: "AABB Technical Manual Information", uri: "https://www.aabb.org/standards-and-accreditation/technical-manual" },
        { title: "NCBI Bookshelf (NBK2265) - Blood Groups and Red Cell Antigens", uri: "https://www.ncbi.nlm.nih.gov/books/NBK2265/" }
      ]
    };
  } else {
    return {
      text: prefixNotice + `**คำตอบทางวิชาการสำหรับการสอบถามของคุณ**

1. **ภาพรวมทางเทคนิคการแพทย์ (Clinical Laboratory Overview):**
   - ในการวิเคราะห์และตรวจสอบทางห้องปฏิบัติการทางการแพทย์ การยึดถือมาตรฐานความถูกต้องแม่นยำ (Accuracy & Precision) ควบคู่กับการควบคุมคุณภาพ (Quality Control - QC) เป็นสิ่งสำคัญสูงสุด
   - ผลการวิเคราะห์จะต้องได้รับการประเมินร่วมกับบริบททางคลินิก อาการผู้ป่วย และค่าอ้างอิงมาตรฐาน (Reference Intervals)

2. **หลักการและข้อควรระวัง:**
   - การเตรียมสิ่งส่งตรวจ (Specimen collection and handling) ต้องปราศจากสิ่งปนเปื้อน เพื่อป้องกันผลบวกลวงหรือลบลวง (False positive / False negative)
   - การรายงานผลต้องมีความชัดเจน พร้อมระบุหน่วยวัดและข้อเสนอแนะเพิ่มเติมหากพบค่าผิดปกติวิกฤต (Critical values)

3. **การสืบค้นเพิ่มเติม:**
   - ขอแนะนำให้นักศึกษาศึกษาค้นคว้าเพิ่มเติมจากตำรามาตรฐานโลหิตวิทยา จุลชีววิทยาคลินิก เคมีคลินิก และระเบียบวิธีวิจัยทางเทคนิคการแพทย์`,
      references: [
        { title: "CLSI (Clinical and Laboratory Standards Institute)", uri: "https://clsi.org/" }
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
        references: hasGrounding ? references.map(r => ({ ...r, type: "web_search" })) : undefined,
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
    references: fallback.references.map(r => ({ ...r, type: "academic_textbook" })),
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
