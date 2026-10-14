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
  Activity,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'knowledge' | 'terms' | 'about'>('home');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const samplePrompts = [
    "อธิบายหลักการทำงานของ Flow Cytometry ในการจำแนกชนิดเม็ดเลือดขาว",
    "ความแตกต่างระหว่าง RT-PCR และ Real-Time PCR ในงานตรวจวินิจฉัยโมเลกุล",
    "การแปลผล Complete Blood Count (CBC) ในผู้ป่วยติดเชื้อเดงกี่ (Dengue)",
    "ขั้นตอนการทำ Crossmatching และการตรวจหมู่เลือด Blood Grouping"
  ];

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    // In this UI-only version, we show a notification or switch to preview/empty state notice
    setIsPreviewMode(true);
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
                MedTech Learning Hub <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">AI v1.0</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ</p>
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
              เชื่อมต่อระบบ AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* Notice Banner about UI-only version */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">โหมดส่วนติดต่อผู้ใช้ (UI Prototype Only):</span> แอปพลิเคชันนี้อยู่ในเวอร์ชันแรกสำหรับการพัฒนาและตรวจสอบโครงสร้างหน้าจอ 
            ระบบยังไม่ได้เชื่อมต่อ API, ฐานข้อมูล, การค้นหาไฟล์ หรือบริการภายนอก และไม่มีการจำลองข้อมูลการทดลองหรือบทความวิจัยปลอม
          </div>
        </div>

        {/* Hero / Intro Section */}
        <section className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium mb-4 border border-teal-500/30">
              <FlaskConical className="w-3.5 h-3.5" /> สำหรับนักศึกษาเทคนิคการแพทย์ไทย (For Thai Medical Technology Students)
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
              ยกระดับการเรียนรู้เทคนิคการแพทย์ด้วยความแม่นยำทางวิชาการ
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              ค้นคว้าหลักการตรวจวิเคราะห์ทางห้องปฏิบัติการ ศัพท์ภาษาอังกฤษทางการแพทย์ และหลักฐานอ้างอิงระดับสากล 
              ออกแบบมาเพื่อสนับสนุนการเรียนการสอนและการฝึกปฏิบัติงานทางเทคนิคการแพทย์อย่างมืออาชีพ
            </p>
          </div>
        </section>

        {/* Question Input Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSendQuestion} className="flex flex-col gap-4">
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
                {isPreviewMode ? "ซ่อนตัวอย่างโครงสร้างการแสดงผล" : "ดูตัวอย่างโครงสร้างคำตอบ (UI Preview)"}
              </button>
            </div>

            <div className="relative">
              <textarea
                id="question-input"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="พิมพ์คำถามด้านเทคนิคการแพทย์ของคุณ..."
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">ตัวอย่างคำถาม:</span>
                {samplePrompts.slice(0, 2).map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestion(promptText)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors text-left truncate max-w-[280px]"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm shrink-0"
              >
                <span>ส่งคำถาม</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>

        {/* Response Area Container (6 Required Sections + Empty State + Source Distinction) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              พื้นที่แสดงผลคำตอบและหลักฐานวิชาการ (Response Area)
            </h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
              {isPreviewMode ? "แสดงตัวอย่างโครงสร้าง (Preview Mode)" : "สถานะ: รอการเชื่อมต่อระบบ AI"}
            </span>
          </div>

          {!isPreviewMode ? (
            /* 8. Empty State Requirement */
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">ยังไม่มีคำถามหรือข้อมูลในขณะนี้</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                คำตอบ แหล่งอ้างอิง และข้อความต้นฉบับจะแสดงที่นี่เมื่อมีการเชื่อมต่อระบบ AI ในอนาคต 
                คุณสามารถทดลองพิมพ์คำถามด้านบนหรือคลิกปุ่ม <span className="font-medium text-teal-700">"ดูตัวอย่างโครงสร้างคำตอบ"</span> เพื่อดูรูปแบบการจัดวางข้อมูล
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                ดูตัวอย่างโครงสร้าง 6 ส่วน
              </button>
            </div>
          ) : (
            /* 6 & 7. Response Area with Separate Sections & Source Distinction */
            <div className="space-y-8 animate-fadeIn">
              
              {/* Notice that this is UI Preview structure */}
              <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 text-teal-900 text-xs sm:text-sm flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">โครงสร้างการแสดงผล (UI Structure Preview):</span> ด้านล่างนี้คือตัวอย่างการจัดแบ่ง 6 ส่วนตามข้อกำหนดของหลักสูตร 
                  โดยมีการแยกแยะระหว่าง <span className="font-semibold underline">ข้อความแหล่งอ้างอิงต้นฉบับ</span> และ <span className="font-semibold underline">การอธิบายเพิ่มเติมโดย AI</span> อย่างชัดเจน
                </div>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Section 1: คำอธิบายภาษาไทย */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">1</span>
                        คำอธิบายภาษาไทย
                      </h5>
                      <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        AI Synthesis
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      อธิบายหลักการและกระบวนการทางเทคนิคการแพทย์อย่างละเอียดเป็นภาษาไทย 
                      เพื่อให้นักศึกษาสามารถทำความเข้าใจกลไกทางห้องปฏิบัติการได้อย่างชัดเจนและถูกต้องตามหลักวิชาการ
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                    * สร้างขึ้นโดยระบบ AI สำหรับการอธิบายเชิงการศึกษา
                  </div>
                </div>

                {/* Section 2: ศัพท์ภาษาอังกฤษที่สำคัญ */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">2</span>
                        ศัพท์ภาษาอังกฤษที่สำคัญ (Key Terminology)
                      </h5>
                      <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Preserved Terms
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
                        Complete Blood Count (CBC)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
                        Flow Cytometry
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
                        Polymerase Chain Reaction (PCR)
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                    * คำศัพท์เทคนิคสากลที่คงรูปภาษาอังกฤษไว้ตามข้อกำหนด
                  </div>
                </div>

                {/* Section 3: หลักฐานและแหล่งอ้างอิง */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
                        หลักฐานและแหล่งอ้างอิง (Evidence & References)
                      </h5>
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Verified Source
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <BookMarked className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Clinical Laboratory Science Review, 5th Edition (Standard Textbook Reference)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <BookMarked className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>WHO Guidelines on Laboratory Quality Management and Diagnostics</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-blue-600 font-medium">
                    ✓ แหล่งอ้างอิงและเอกสารวิชาการมาตรฐาน
                  </div>
                </div>

                {/* Section 4: ต้นฉบับภาษาอังกฤษ (Original English) */}
                <div className="bg-blue-50/40 border border-blue-200/70 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">4</span>
                        ต้นฉบับภาษาอังกฤษ (Original English Quotation)
                      </h5>
                      <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        Original Text (Verbatim)
                      </span>
                    </div>
                    <blockquote className="bg-white/80 border-l-2 border-blue-500 p-3 rounded-r-lg text-xs font-mono text-slate-800 italic">
                      "Flow cytometry is a laser- or impedance-based technology used to cell counting, cell sorting, biomarker detection and protein engineering, by suspending cells in a stream of fluid and passing them through an electronic detection apparatus."
                    </blockquote>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200/50 text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> ข้อความต้นฉบับดั้งเดิม (แยกจากคำอธิบาย AI อย่างชัดเจน)
                  </div>
                </div>

                {/* Section 5: คำแปลภาษาไทย */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">5</span>
                        คำแปลภาษาไทย (Thai Translation)
                      </h5>
                      <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Direct Translation
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      "โฟลว์ไซโตเมทรี (Flow Cytometry) คือเทคโนโลยีที่ใช้แสงเลเซอร์หรือความต้านทานไฟฟ้าสำหรับการนับเซลล์ การคัดแยกเซลล์ การตรวจหาไบโอมาร์กเกอร์ และวิศวกรรมโปรตีน โดยการแขวนลอยเซลล์ในสายของของเหลวและให้ไหลผ่านอุปกรณ์ตรวจจับอิเล็กทรอนิกส์"
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                    * คำแปลตรงตัวจากข้อความต้นฉบับภาษาอังกฤษ
                  </div>
                </div>

                {/* Section 6: คำอธิบายเพิ่มเติมจาก AI */}
                <div className="bg-teal-50/50 border border-teal-200/70 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-teal-200 text-teal-900 flex items-center justify-center text-xs font-bold">6</span>
                        คำอธิบายเพิ่มเติมจาก AI (Additional AI Insights)
                      </h5>
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                        AI Insights
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      ในมุมมองทางเทคนิคการแพทย์ การประยุกต์ใช้ Flow Cytometry มีความสำคัญอย่างยิ่งในการวินิจฉัยโรคมะเร็งเม็ดเลือดขาว (Leukemia) 
                      และการตรวจวัด CD4 T-lymphocytes ในผู้ป่วย HIV โดยนักศึกษาควรทำความเข้าใจพารามิเตอร์ Forward Scatter (FSC) และ Side Scatter (SSC) ควบคู่กัน
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-teal-200/50 text-[11px] text-teal-700 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> ข้อสังเกตและเกร็ดความรู้เพิ่มเติมโดย AI
                  </div>
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
            MedTech Learning Hub AI — สำหรับการศึกษาและเรียนรู้ของนักศึกษาเทคนิคการแพทย์
          </div>
          <div>
            พัฒนาด้วยมาตรฐานวิชาการเทคนิคการแพทย์ไทย · เวอร์ชัน UI Prototype
          </div>
        </div>
      </footer>

      {/* Connect AI Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">เชื่อมต่อระบบ AI (Future Feature)</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ฟังก์ชันเชื่อมต่อระบบปัญญาประดิษฐ์ (Gemini AI API) คลังข้อมูลวิชาการ และระบบตรวจสอบแหล่งอ้างอิงอัตโนมัติ จะเปิดให้บริการในเวอร์ชันถัดไปตามแผนการพัฒนา
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
