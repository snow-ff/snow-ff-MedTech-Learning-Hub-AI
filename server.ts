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

// API endpoint for Gemini generation with retry, exponential backoff, and latency timing logs
app.post("/api/gemini/generate", async (req, res) => {
  const requestStartTime = Date.now();
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "กรุณาระบุคำถาม (Please provide a prompt)" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "ไม่พบ GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่า Secrets" });
  }

  const systemInstruction = `คุณคือผู้ช่วย AI วิชาการสำหรับ "MedTech Learning Hub AI" ซึ่งเป็นแพลตฟอร์มการเรียนรู้สำหรับนักศึกษาเทคนิคการแพทย์ไทย (Medical Technology Students)
โปรดตอบคำถามโดยใช้ภาษาไทยเป็นหลัก พร้อมทั้งรักษาคำศัพท์ภาษาอังกฤษทางการแพทย์และเทคนิคที่สำคัญไว้ (เช่น Complete Blood Count, Flow Cytometry, PCR, Spectrophotometry เป็นต้น)
ในการตอบ ให้ให้ข้อมูลวิชาการที่ถูกต้องและเป็นประโยชน์สำหรับนักศึกษาเทคนิคการแพทย์
หมายเหตุ: นี่เป็นเวอร์ชันพื้นฐานในการเชื่อมต่อ Gemini AI โปรดระบุชัดเจนว่าเนื้อหานี้สร้างขึ้นโดย AI และยังไม่ได้เชื่อมต่อระบบสืบค้นหลักฐานหรือตรวจสอบแหล่งอ้างอิงอัตโนมัติ`;

  let attempt = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStartTime = Date.now();
    try {
      // Use ThinkingLevel.LOW to optimize reasoning latency for standard academic Q&A
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const attemptDuration = Date.now() - attemptStartTime;
      const totalBackendDuration = Date.now() - requestStartTime;
      console.log(`[Perf Backend] Gemini API success on attempt ${attempt}. Call duration: ${attemptDuration}ms, Total backend duration: ${totalBackendDuration}ms`);

      const text = response.text;
      if (!text) {
        throw new Error("ไม่ได้รับคำตอบจากโมเดล Gemini");
      }

      return res.json({ text });
    } catch (err: any) {
      const attemptDuration = Date.now() - attemptStartTime;
      lastError = err;
      const message = err.message || "";
      const matchResult = message.match(/\b(503|429|500|408)\b/);
      const status = err.status || err.statusCode || (matchResult ? matchResult[1] : undefined);
      
      console.warn(`[Perf Backend] Gemini API attempt ${attempt} failed after ${attemptDuration}ms. Error: ${message}`);

      const isTransient = 
        Number(status) === 503 || Number(status) === 429 || Number(status) === 500 || Number(status) === 408 ||
        message.includes("503") || message.includes("429") || message.includes("500") || 
        message.includes("UNAVAILABLE") || message.includes("RESOURCE_EXHAUSTED") || 
        message.includes("overloaded") || message.includes("deadline") || message.includes("timeout") ||
        message.includes("fetch failed");

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
  console.error(`[Perf Backend] Gemini API Error after ${attempt} attempts (${totalBackendDuration}ms total):`, {
    message: lastError?.message,
    status: lastError?.status || lastError?.statusCode,
    name: lastError?.name
  });

  const errMessage = lastError?.message || "";
  let userMessage = "เกิดข้อผิดพลาดในการประมวลผลคำขอจาก AI กรุณาลองใหม่อีกครั้ง";
  let httpStatus = 500;

  if (errMessage.includes("503") || errMessage.includes("UNAVAILABLE") || errMessage.includes("overloaded") || errMessage.includes("Service Unavailable")) {
    userMessage = "ขณะนี้ระบบ Gemini กำลังมีผู้ใช้งานหนาแน่น (Service Unavailable / 503) ระบบได้พยายามเชื่อมต่อใหม่อัตโนมัติแล้วแต่ยังไม่สำเร็จ กรุณาลองใหม่อีกครั้งในภายหลัง";
    httpStatus = 503;
  } else if (errMessage.includes("429") || errMessage.includes("RESOURCE_EXHAUSTED") || errMessage.includes("Rate Limit")) {
    userMessage = "ระบบถูกจำกัดจำนวนคำขอชั่วคราว (Rate Limit / 429) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    httpStatus = 429;
  } else if (errMessage.includes("400") || errMessage.includes("INVALID_ARGUMENT")) {
    userMessage = "คำขอไม่ถูกต้อง กรุณาตรวจสอบรูปแบบคำถามของคุณ";
    httpStatus = 400;
  } else if (errMessage.includes("fetch failed") || errMessage.includes("network")) {
    userMessage = "ไม่สามารถเชื่อมต่อกับเครือข่ายอินเทอร์เน็ตได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ";
    httpStatus = 503;
  }

  return res.status(httpStatus).json({ error: userMessage });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
