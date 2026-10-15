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
  const [references, setReferences] = useState<Array<{ title: string; uri: string; type?: string }> | null>(null);
  const [responseSource, setResponseSource] = useState<string | null>(null);
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
    setReferences(null);
    setResponseSource(null);
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
      setResponseSource(data.source || (data.text?.includes("Academic Fallback Mode") ? "academic_fallback" : "gemini_standard"));
      if (data.references && Array.isArray(data.references)) {
        setReferences(data.references);
      }

      console.log(`[Perf Frontend] Total roundtrip duration including render parse: ${Date.now() - frontendStartTime}ms`);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถติดต่อกับ Gemini API ได้ในขณะนี้");
      console.error(`[Perf Frontend] Error after ${Date.now() - frontendStartTime}ms:`, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans selection:bg-sky-900 selection:text-sky-200">
      {/* Top Bar Contract (Strict 3-zone layout) */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#334155] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#F1F5F9] whitespace-nowrap shrink-0 flex items-center gap-2">
                MedTech Learning Hub <span className="text-xs font-semibold px-2 py-0.5 bg-sky-950 text-[#7DD3FC] rounded-full border border-sky-800">AI v1.1</span>
              </h1>
              <p className="text-xs text-[#CBD5E1] hidden sm:block">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ (Gemini Grounding Connected)</p>
            </div>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#CBD5E1]">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'home' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'knowledge' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              คลังความรู้
            </button>
            <button 
              onClick={() => setActiveTab('terms')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'terms' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              ศัพท์เทคนิค
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`hover:text-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 ${activeTab === 'about' ? 'text-[#7DD3FC] font-semibold' : ''}`}
            >
              เกี่ยวกับระบบ
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 text-xs font-semibold text-[#F1F5F9] bg-[#1E293B] hover:bg-slate-800 border border-[#334155] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              สถานะระบบ AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* Notice Banner about Gemini API connection */}
        <div className="bg-[#1E293B] border border-sky-900/50 rounded-xl p-4 text-[#F1F5F9] text-sm flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-[#7DD3FC] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-[#7DD3FC]">เชื่อมต่อ Google Search Grounding สำเร็จ (Gemini-3.8-Flash):</span> พิมพ์คำถามด้านเทคนิคการแพทย์ของคุณเพื่อรับคำอธิบายพร้อมแหล่งอ้างอิงและลิงก์เว็บไซต์ที่ตรวจสอบได้แบบเรียลไทม์
          </div>
        </div>

        {/* Hero / Intro Section */}
        <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-[#F1F5F9] rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-[#334155]">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950 text-[#7DD3FC] text-xs font-medium mb-4 border border-sky-800">
              <FlaskConical className="w-3.5 h-3.5" /> สำหรับนักศึกษาเทคนิคการแพทย์ไทย (Powered by Gemini AI + Search Grounding)
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance text-[#F1F5F9]">
              ยกระดับการเรียนรู้เทคนิคการแพทย์ด้วยความแม่นยำทางวิชาการ
            </h2>
            <p className="text-[#CBD5E1] text-sm sm:text-base leading-relaxed mb-6">
              สอบถามหลักการตรวจวิเคราะห์ทางห้องปฏิบัติการ ศัพท์ภาษาอังกฤษทางการแพทย์ และกระบวนการวิเคราะห์ตัวอย่าง พร้อมลิงก์แหล่งอ้างอิงจากเว็บที่ตรวจสอบได้
            </p>
          </div>
        </section>

        {/* Question Input Section */}
        <section className="bg-[#1E293B] rounded-2xl border border-[#334155] p-6 sm:p-8 shadow-sm">
          <form onSubmit={(e) => handleSendQuestion(e)} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="question-input" className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#7DD3FC]" />
                ตั้งคำถามหรือหัวข้อทางเทคนิคการแพทย์
              </label>
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="text-xs text-[#7DD3FC] hover:text-sky-300 font-medium underline underline-offset-2 transition-colors"
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
                className="w-full rounded-xl bg-[#0F172A] border border-[#475569] p-4 text-[#F1F5F9] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7DD3FC] focus:border-transparent text-sm sm:text-base resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#CBD5E1] font-medium">คำถามแนะนำ:</span>
                {samplePrompts.slice(0, 2).map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuestion(undefined, promptText)}
                    className="text-xs bg-[#0F172A] hover:bg-slate-800 text-[#CBD5E1] border border-[#334155] px-3 py-1.5 rounded-lg transition-colors text-left truncate max-w-[280px]"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#7DD3FC]" />
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
        <section className="bg-[#1E293B] rounded-2xl border border-[#334155] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#334155] pb-4 mb-6">
            <h3 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7DD3FC]" />
              ผลลัพธ์จาก AI (Gemini Response)
            </h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-sky-950 text-[#7DD3FC] rounded-md border border-sky-800">
              {isLoading ? "กำลังสร้างคำตอบ..." : answer ? "สำเร็จ (AI Generated)" : error ? "เกิดข้อผิดพลาด" : "พร้อมใช้งาน"}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#7DD3FC] animate-spin mb-4" />
              <h4 className="text-base font-semibold text-[#F1F5F9] mb-1">Gemini กำลังวิเคราะห์คำถามของคุณ...</h4>
              <p className="text-xs text-[#CBD5E1]">กรุณารอสักครู่ ระบบกำลังค้นหาข้อมูลและประมวลผลทางเทคนิคการแพทย์</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-950/60 border border-red-900/60 rounded-xl p-6 text-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-100 mb-1">ไม่สามารถประมวลผลคำขอได้</h4>
                <p className="text-sm text-red-300 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {/* Real Gemini Answer State */}
          {answer && !isLoading && !error && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`border rounded-xl p-4 text-xs flex items-center justify-between ${
                responseSource === 'academic_fallback' 
                  ? 'bg-amber-950/30 border-amber-900/50 text-amber-200' 
                  : 'bg-[#0F172A] border-[#334155] text-[#F1F5F9]'
              }`}>
                <span className={`font-semibold flex items-center gap-1.5 ${
                  responseSource === 'academic_fallback' ? 'text-amber-300' : 'text-[#7DD3FC]'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  {responseSource === 'academic_fallback' 
                    ? 'ข้อมูลวิชาการสำรอง (Academic Fallback Mode - API Quota Full)'
                    : responseSource === 'gemini_grounding'
                    ? 'คำตอบสร้างขึ้นโดยโมเดล Gemini AI (gemini-3.8-flash) + Google Search Grounding'
                    : 'คำตอบสร้างขึ้นโดยโมเดล Gemini AI (gemini-3.8-flash)'}
                </span>
                <span className="text-[#CBD5E1]">
                  ภาษาไทย (พร้อมคำศัพท์เทคนิค)
                </span>
              </div>

              <div className="prose prose-invert max-w-none text-[#F1F5F9] leading-relaxed whitespace-pre-wrap bg-[#0F172A] p-6 rounded-xl border border-[#334155] text-sm sm:text-base">
                {answer}
              </div>

              {/* References Section if available */}
              {references && references.length > 0 && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5 text-sm space-y-3">
                  <h4 className="font-bold text-[#F1F5F9] flex items-center gap-2 text-xs uppercase tracking-wider text-[#7DD3FC]">
                    <BookOpen className="w-4 h-4" />
                    {responseSource === 'academic_fallback'
                      ? 'ตำราและแหล่งอ้างอิงทางวิชาการ (Academic Textbooks & Standards)'
                      : 'แหล่งอ้างอิงและแหล่งข้อมูลที่ตรวจสอบได้ (Google Search Grounding)'}
                  </h4>
                  <ul className="space-y-2">
                    {references.map((ref, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#7DD3FC] text-xs font-mono mt-0.5">[{idx + 1}]</span>
                        <div className="flex-1">
                          <a 
                            href={ref.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#7DD3FC] hover:underline text-xs sm:text-sm break-all flex items-center gap-1.5"
                          >
                            <span>{ref.title || ref.uri}</span>
                            <Globe className="w-3 h-3 shrink-0 opacity-70" />
                          </a>
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {ref.type === 'academic_textbook' ? 'ตำรา/มาตรฐานวิชาการ' : 'เว็บอ้างอิง (Web Search)'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`border rounded-xl p-4 text-xs flex items-start gap-2 ${
                responseSource === 'academic_fallback'
                  ? 'bg-amber-950/40 border-amber-900/50 text-amber-200'
                  : 'bg-amber-950/40 border-amber-900/50 text-amber-200'
              }`}>
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-100">หมายเหตุ:</span> {
                    responseSource === 'academic_fallback'
                      ? 'คำตอบนี้แสดงผลจากคลังข้อมูลสำรองทางวิชาการเนื่องจากโควตาการใช้งานฟรีชั่วคราวเต็ม กรุณาตรวจสอบซ้ำกับตำราหรือแนวทางปฏิบัติมาตรฐานทางห้องปฏิบัติการ'
                      : 'คำตอบนี้ประมวลผลด้วย Generative AI ร่วมกับ Google Search Grounding ควรตรวจสอบซ้ำกับตำราหรือแนวทางปฏิบัติมาตรฐานทางห้องปฏิบัติการ'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Empty State / Preview Mode */}
          {!isLoading && !answer && !error && !isPreviewMode && (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#0F172A] text-[#7DD3FC] flex items-center justify-center mb-4 shadow-sm border border-[#334155]">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-[#F1F5F9] mb-2">พร้อมรับคำถามทางเทคนิคการแพทย์</h4>
              <p className="text-sm text-[#CBD5E1] leading-relaxed mb-6">
                พิมพ์คำถามของคุณในช่องด้านบน หรือเลือกคำถามตัวอย่างเพื่อเริ่มต้นเรียกใช้งาน Gemini AI พร้อมค้นหาแหล่งอ้างอิง
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold bg-[#0F172A] hover:bg-slate-800 text-[#7DD3FC] border border-[#334155] px-4 py-2.5 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4 text-[#7DD3FC]" />
                ดูตัวอย่างโครงสร้าง 6 ส่วน (UI Reference)
              </button>
            </div>
          )}

          {/* UI Structure Preview Mode */}
          {!isLoading && !answer && !error && isPreviewMode && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 text-[#CBD5E1] text-xs sm:text-sm flex items-center justify-between">
                <span className="font-semibold text-[#F1F5F9]">ตัวอย่างโครงสร้างหน้าจอ 6 ส่วน (สำหรับตรวจสอบการจัดวาง UI):</span>
                <button 
                  onClick={() => setIsPreviewMode(false)}
                  className="text-[#7DD3FC] hover:underline font-medium"
                >
                  ปิดตัวอย่าง
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">1. คำอธิบายภาษาไทย</h5>
                  <p className="text-xs text-[#CBD5E1]">คำอธิบายหลักการทางเทคนิคการแพทย์เป็นภาษาไทย</p>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">2. ศัพท์ภาษาอังกฤษที่สำคัญ</h5>
                  <p className="text-xs text-[#CBD5E1]">Complete Blood Count, Flow Cytometry</p>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">3. หลักฐานและแหล่งอ้างอิง</h5>
                  <p className="text-xs text-[#CBD5E1]">(สืบค้นอัตโนมัติผ่าน Google Search Grounding)</p>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">4. ต้นฉบับภาษาอังกฤษ</h5>
                  <p className="text-xs text-[#CBD5E1]">(ข้อความต้นฉบับดั้งเดิม)</p>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">5. คำแปลภาษาไทย</h5>
                  <p className="text-xs text-[#CBD5E1]">(คำแปลตรงตัว)</p>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5">
                  <h5 className="font-bold text-[#F1F5F9] text-sm mb-2">6. คำอธิบายเพิ่มเติมจาก AI</h5>
                  <p className="text-xs text-[#CBD5E1]">(เกร็ดความรู้และข้อสังเกตเพิ่มเติม)</p>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0F172A] border-t border-[#334155] py-8 px-6 mt-12 text-center text-xs text-[#CBD5E1]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-[#F1F5F9]">
            <Microscope className="w-4 h-4 text-[#7DD3FC]" />
            MedTech Learning Hub AI — ขับเคลื่อนด้วยโมเดล Gemini + Search Grounding
          </div>
          <div>
            เวอร์ชันเชื่อมต่อ API จริง (Grounding Connected) · สำหรับนักศึกษาเทคนิคการแพทย์
          </div>
        </div>
      </footer>

      {/* Connect AI Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#334155] animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-sky-950 text-[#7DD3FC] flex items-center justify-center flex-shrink-0 mb-4 border border-sky-800">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#F1F5F9] mb-2">สถานะการเชื่อมต่อ AI</h3>
            <p className="text-sm text-[#CBD5E1] mb-6 leading-relaxed">
              แอปพลิเคชันเชื่อมต่อกับโมเดล <span className="font-mono font-semibold text-[#7DD3FC]">gemini-3.8-flash</span> พร้อมระบบ <span className="font-semibold text-[#7DD3FC]">Google Search Grounding</span> ผ่านเซิร์ฟเวอร์หลังบ้านเรียบร้อยแล้ว
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
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
