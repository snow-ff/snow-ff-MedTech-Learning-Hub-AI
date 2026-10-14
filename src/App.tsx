import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Send, 
  BookOpen, 
  FileText, 
  Globe, 
  Sparkles, 
  Brain, 
  Info, 
  CheckCircle2, 
  HelpCircle, 
  BookMarked,
  Layers,
  FlaskConical,
  Microscope,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'knowledge' | 'terms' | 'about'>('home');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const samplePrompts = [
    "อธิบายหลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว",
    "ความแตกต่างระหว่าง RT-PCR และ Real-Time PCR ในงานตรวจวินิจฉัยโมเลกุล",
    "การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อเดงกี่ (Dengue)",
    "ขั้นตอนการทำ Crossmatching และการตรวจหมู่เลือด Blood Grouping"
  ];

  const handleSendQuestion = async (e?: React.FormEvent, promptText?: string) => {
    if (e) e.preventDefault();
    const queryToSubmit = promptText || question;
    if (!queryToSubmit.trim()) return;

    if (promptText) {
      setQuestion(promptText);
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setIsPreviewMode(false);

    const frontendStartTime = Date.now();

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: queryToSubmit }),
      });

      const textBody = await res.text();
      const networkAndGenDuration = Date.now() - frontendStartTime;
      console.log(`[Perf Frontend] Fetch request completed in ${networkAndGenDuration}ms`);

      let data: any = {};
      try {
        if (textBody.trim().startsWith("{") || textBody.trim().startsWith("[")) {
          data = JSON.parse(textBody);
        }
      } catch (parseErr) {
        // Not valid JSON
      }

      if (textBody.trim().toLowerCase().startsWith("<!doctype") || textBody.trim().toLowerCase().startsWith("<html")) {
        throw new Error("เซิร์ฟเวอร์ตอบกลับเป็นหน้าเว็บ HTML แทนที่จะเป็น JSON (Unexpected HTML response) กรุณาลองใหม่อีกครั้งในภายหลัง");
      }

      if (!res.ok) {
        throw new Error(data.error || textBody || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }

      if (!data.text) {
        throw new Error(data.error || "ไม่ได้รับข้อมูลคำตอบจากเซิร์ฟเวอร์");
      }

      setAnswer(data.text);
      console.log(`[Perf Frontend] Total roundtrip duration including render parse: ${Date.now() - frontendStartTime}ms`);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถติดต่อกับ Gemini API ได้ในขณะนี้");
      console.error(`[Perf Frontend] Error after ${Date.now() - frontendStartTime}ms:`, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Bar Contract (Strict 3-zone layout) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2">
                MedTech Learning Hub <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">AI v1.1</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ (Gemini Connected)</p>
            </div>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'home' ? 'text-teal-700 font-semibold' : ''}`}
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')} 
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'knowledge' ? 'text-teal-700 font-semibold' : ''}`}
            >
              คลังความรู้
            </button>
            <button 
              onClick={() => setActiveTab('terms')} 
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'terms' ? 'text-teal-700 font-semibold' : ''}`}
            >
              ศัพท์เทคนิค
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'about' ? 'text-teal-700 font-semibold' : ''}`}
            >
              เกี่ยวกับระบบ
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              สถานะระบบ AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* Notice Banner about Gemini API connection */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-teal-900 text-sm flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">เชื่อมต่อ Gemini AI สำเร็จ (Gemini-3.8-Flash):</span> พิมพ์คำถามด้านเทคนิคการแพทย์ของคุณเพื่อรับคำอธิบายเชิงวิชาการแบบเรียลไทม์ 
            (หมายเหตุ: เวอร์ชันนี้เป็นการเชื่อมต่อคำตอบจาก AI โดยตรง ยังไม่มีการสืบค้นหลักฐานหรือตรวจสอบแหล่งอ้างอิงอัตโนมัติ)
          </div>
        </div>

        {/* Hero / Intro Section */}
        <section className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium mb-4 border border-teal-500/30">
              <FlaskConical className="w-3.5 h-3.5" /> สำหรับนักศึกษาเทคนิคการแพทย์ไทย (Powered by Gemini AI)
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
              ยกระดับการเรียนรู้เทคนิคการแพทย์ด้วยความแม่นยำทางวิชาการ
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              สอบถามหลักการตรวจวิเคราะห์ทางห้องปฏิบัติการ ศัพท์ภาษาอังกฤษทางการแพทย์ และกระบวนการวิเคราะห์ตัวอย่าง 
              ประมวลผลด้วยโมเดล Gemini สำหรับนักศึกษาและบุคลากรทางการแพทย์
            </p>
          </div>
        </section>

        {/* Question Input Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={(e) => handleSendQuestion(e)} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="question-input" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                ตั้งคำถามหรือหัวข้อทางเทคนิคการแพทย์
              </label>
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2 transition-colors"
              >
                {isPreviewMode ? "ซ่อนตัวอย่างโครงสร้าง" : "ดูตัวอย่างโครงสร้างคำตอบ"}
              </button>
            </div>

            <div className="relative">
              <textarea
                id="question-input"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="พิมพ์คำถามด้านเทคนิคการแพทย์ของคุณ เช่น หลักการทำ CBC หรือ Flow Cytometry..."
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">คำถามแนะนำ:</span>
                {samplePrompts.slice(0, 2).map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuestion(undefined, promptText)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors text-left truncate max-w-[280px]"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <span>ส่งคำถาม</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Response Area Container */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              ผลลัพธ์จาก AI (Gemini Response)
            </h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
              {isLoading ? "กำลังสร้างคำตอบ..." : answer ? "สำเร็จ (AI Generated)" : error ? "เกิดข้อผิดพลาด" : "พร้อมใช้งาน"}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <h4 className="text-base font-semibold text-slate-800 mb-1">Gemini กำลังวิเคราะห์คำถามของคุณ...</h4>
              <p className="text-xs text-slate-500">กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลทางเทคนิคการแพทย์</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">ไม่สามารถประมวลผลคำขอได้</h4>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {/* Real Gemini Answer State */}
          {answer && !isLoading && !error && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-4 text-teal-900 text-xs flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  คำตอบสร้างขึ้นโดยโมเดล Gemini AI (gemini-3.8-flash)
                </span>
                <span className="text-slate-500">
                  ภาษาไทย (พร้อมคำศัพท์เทคนิค)
                </span>
              </div>

              <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-6 rounded-xl border border-slate-200/80 text-sm sm:text-base">
                {answer}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">หมายเหตุ:</span> คำตอบนี้เป็นผลลัพธ์จาก Generative AI สำหรับสนับสนุนการเรียนการสอน 
                  ยังไม่มีการเชื่อมต่อระบบสืบค้นเอกสารหรือยืนยันแหล่งอ้างอิงอัตโนมัติ (จะเพิ่มในขั้นตอนถัดไป)
                </div>
              </div>
            </div>
          )}

          {/* Empty State / Preview Mode */}
          {!isLoading && !answer && !error && !isPreviewMode && (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">พร้อมรับคำถามทางเทคนิคการแพทย์</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                พิมพ์คำถามของคุณในช่องด้านบน หรือเลือกคำถามตัวอย่างเพื่อเริ่มต้นเรียกใช้งาน Gemini AI ได้ทันที
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4 text-teal-600" />
                ดูตัวอย่างโครงสร้าง 6 ส่วน (UI Reference)
              </button>
            </div>
          )}

          {/* UI Structure Preview Mode */}
          {!isLoading && !answer && !error && isPreviewMode && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-slate-700 text-xs sm:text-sm flex items-center justify-between">
                <span className="font-semibold">ตัวอย่างโครงสร้างหน้าจอ 6 ส่วน (สำหรับตรวจสอบการจัดวาง UI):</span>
                <button 
                  onClick={() => setIsPreviewMode(false)}
                  className="text-teal-700 hover:underline font-medium"
                >
                  ปิดตัวอย่าง
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">1. คำอธิบายภาษาไทย</h5>
                  <p className="text-xs text-slate-600">คำอธิบายหลักการทางเทคนิคการแพทย์เป็นภาษาไทย</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">2. ศัพท์ภาษาอังกฤษที่สำคัญ</h5>
                  <p className="text-xs text-slate-600">Complete Blood Count, Flow Cytometry</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">3. หลักฐานและแหล่งอ้างอิง</h5>
                  <p className="text-xs text-slate-600">(จะเชื่อมต่อในขั้นตอนถัดไป)</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">4. ต้นฉบับภาษาอังกฤษ</h5>
                  <p className="text-xs text-slate-600">(ข้อความต้นฉบับดั้งเดิม)</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">5. คำแปลภาษาไทย</h5>
                  <p className="text-xs text-slate-600">(คำแปลตรงตัว)</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">6. คำอธิบายเพิ่มเติมจาก AI</h5>
                  <p className="text-xs text-slate-600">(เกร็ดความรู้และข้อสังเกตเพิ่มเติม)</p>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Microscope className="w-4 h-4 text-teal-600" />
            MedTech Learning Hub AI — ขับเคลื่อนด้วยโมเดล Gemini
          </div>
          <div>
            เวอร์ชันเชื่อมต่อ API จริง (Gemini Connected) · สำหรับนักศึกษาเทคนิคการแพทย์
          </div>
        </div>
      </footer>

      {/* Connect AI Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">สถานะการเชื่อมต่อ AI</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              แップพลิเคชันเชื่อมต่อกับโมเดล <span className="font-mono font-semibold text-teal-700">gemini-3.8-flash</span> ผ่านเซิร์ฟเวอร์หลังบ้านเรียบร้อยแล้ว คีย์ API ถูกจัดเก็บอย่างปลอดภัยผ่านระบบ Secrets
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
