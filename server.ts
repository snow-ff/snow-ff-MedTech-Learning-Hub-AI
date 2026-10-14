import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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

// API endpoint for Gemini generation
app.post("/api/gemini/generate", async (req, res) => {
  try {
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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("ไม่ได้รับคำตอบจากโมเดล Gemini");
    }

    res.json({ text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดในการประมวลผลคำขอจาก AI" });
  }
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
