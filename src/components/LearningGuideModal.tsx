import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  X,
  FileText
} from 'lucide-react';
import { CourseItem } from '../models/coreModel';
import {
  getDtmLearningGuide,
  hasDtmLearningGuide,
  DtmLearningGuide,
  KeyConcept,
  TechnicalVocabularyItem,
  ApplicationExample,
  ReviewQuestion
} from '../data/dtmLearningGuides';

interface LearningGuideModalProps {
  course: CourseItem;
  isOpen: boolean;
  onClose: () => void;
  onAskInChat: (prompt: string) => void;
  onSelectOtherCourse?: (courseCode: string) => void;
}

export const LearningGuideModal: React.FC<LearningGuideModalProps> = ({
  course,
  isOpen,
  onClose,
  onAskInChat,
  onSelectOtherCourse
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'concepts' | 'vocabulary' | 'applications' | 'questions' | 'pathway'>('overview');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Reset internal tab and revealed answers when course prop changes
  React.useEffect(() => {
    setActiveSection('overview');
    setRevealedAnswers({});
  }, [course.code]);

  if (!isOpen) return null;

  const guide: DtmLearningGuide | undefined = getDtmLearningGuide(course.code);

  const toggleAnswer = (qId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleAskPrompt = (prompt: string) => {
    onAskInChat(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold tracking-wide">
                {course.code || 'DTM'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                หลักสูตร DTM 2567 ม.วลัยลักษณ์
              </span>
              {guide ? (
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>มีคู่มือปูพื้นฐาน (Learning Guide)</span>
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                  ยังไม่มีคู่มือปูพื้นฐานฉบับย่อย
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {course.titleThai}
            </h2>
            {course.titleEnglish && (
              <p className="text-xs sm:text-sm text-slate-400 italic">
                {course.titleEnglish} • {course.credits} นก. ({course.hours})
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
            title="ปิดหน้าต่างคู่มือ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Distinction Banner (Mandatory Requirement 4) */}
        <div className="px-6 py-3 bg-amber-950/40 border-b border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300 leading-snug">
              “คู่มือปูพื้นฐานเพื่อการเรียนรู้ — จัดทำจากความรู้ทั่วไปตามหัวข้อที่เกี่ยวข้อง ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการ และยังไม่ได้ยืนยันว่าเป็นเนื้อหาการสอนทั้งหมดของรายวิชานี้”
            </p>
            <p className="text-[11px] text-amber-300/80">
              ชื่อวิชา รหัส หน่วยกิต และกลุ่มวิชาอ้างอิงจาก มคอ.2 ม.วลัยลักษณ์ (หน้า 4–8) ซึ่งไม่มีการระบุปีการศึกษา/ภาคเรียนในเล่มหลักสูตร ส่วนเนื้อหาการเรียนรู้ด้านล่างจัดทำเป็นแนวคิดทั่วไปสำหรับผู้เริ่มต้น
            </p>
          </div>
        </div>

        {/* Modal Body */}
        {guide ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-slate-950/60 p-3 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col gap-1 overflow-x-auto shrink-0 text-xs">
              <button
                onClick={() => setActiveSection('overview')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center gap-2 shrink-0 ${
                  activeSection === 'overview'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>ภาพรวม & สิ่งที่ควรเข้าใจ</span>
              </button>

              <button
                onClick={() => setActiveSection('concepts')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 shrink-0 ${
                  activeSection === 'concepts'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>แนวคิดสำคัญ (Key Concepts)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300">
                  {guide.keyConcepts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('vocabulary')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 shrink-0 ${
                  activeSection === 'vocabulary'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>ศัพท์เทคนิค (Vocabulary)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300">
                  {guide.technicalVocabulary.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('applications')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 shrink-0 ${
                  activeSection === 'applications'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>การประยุกต์จริงใน DTM</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300">
                  {guide.applicationExamples.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('questions')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 shrink-0 ${
                  activeSection === 'questions'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>คำถามทบทวนความรู้</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300">
                  {guide.reviewQuestions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('pathway')}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center gap-2 shrink-0 ${
                  activeSection === 'pathway'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span>เส้นทางศึกษาต่อยอด</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* SECTION 1: OVERVIEW & TAKEAWAYS */}
              {activeSection === 'overview' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>ภาพรวมของขอบเขตหัวข้อวิชา (Topic Overview)</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {guide.topicOverview}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>สิ่งที่ควรเข้าใจให้ได้จากคู่มือนี้ (Study Goals)</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ไม่ใช่ CLO/PLO ทางการ
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                      {guide.keyTakeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Start Chat Prompt */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-950 border border-cyan-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">ต้องการเริ่มเรียนรู้หัวข้อนี้กับผู้ช่วย AI หรือไม่?</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ระบบจะนำคำถามเริ่มต้นไปใส่ในช่องแชท ให้คุณตรวจสอบก่อนกดส่ง
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleAskPrompt(
                          `ช่วยสรุปภาพรวมและอธิบายแนวคิดพื้นฐานของวิชา ${course.code} ${course.titleThai} ในบริบทเทคโนโลยีดิจิทัลทางการแพทย์ให้เข้าใจง่ายสำหรับผู้เริ่มต้น`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>นำหัวข้อไปใส่ในช่องแชท</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: KEY CONCEPTS */}
              {activeSection === 'concepts' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>แนวคิดสำคัญ (Key Concepts เรียงจากพื้นฐานไปสู่เรื่องซับซ้อน)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      รวม {guide.keyConcepts.length} แนวคิด
                    </span>
                  </div>

                  <div className="space-y-3">
                    {guide.keyConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {concept.order}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {concept.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleAskPrompt(concept.suggestedChatPrompt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 text-[11px] font-medium flex items-center gap-1 border border-slate-800 hover:border-cyan-700 transition-colors shrink-0"
                            title="ถามต่อเกี่ยวกับแนวคิดนี้ในช่องแชท"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>ถามต่อใน Chat</span>
                          </button>
                        </div>

                        <p className="text-xs font-medium text-cyan-300/90 pl-8">
                          {concept.summary}
                        </p>
                        <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                          {concept.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: TECHNICAL VOCABULARY */}
              {activeSection === 'vocabulary' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      <span>คลังศัพท์เทคนิคเฉพาะทาง (Technical Vocabulary)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      รวม {guide.technicalVocabulary.length} คำศัพท์
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {guide.technicalVocabulary.map((vocab) => (
                      <div
                        key={vocab.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-sm font-bold text-white font-mono">
                              {vocab.termEn}
                            </span>
                            <p className="text-xs text-cyan-400 font-medium mt-0.5">
                              {vocab.termTh}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAskPrompt(vocab.suggestedChatPrompt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-900/60 text-indigo-300 hover:text-indigo-200 text-[11px] font-medium flex items-center gap-1 border border-slate-800 hover:border-indigo-700 transition-colors shrink-0"
                            title="ถามเพิ่มเติมเกี่ยวกับศัพท์คำนี้"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>ถามต่อใน Chat</span>
                          </button>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1.5 pt-1 border-t border-slate-900">
                          <p>
                            <span className="text-slate-500">ความหมายเข้าใจง่าย: </span>
                            {vocab.simpleExplanation}
                          </p>
                          <p className="text-indigo-200/90 bg-indigo-950/30 p-2 rounded-lg border border-indigo-900/30">
                            <span className="text-indigo-400 font-semibold">บริบท DTM: </span>
                            {vocab.dtmContextExample}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: APPLICATIONS */}
              {activeSection === 'applications' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>ตัวอย่างการประยุกต์ใช้งานจริง (Real-World Applications)</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {guide.applicationExamples.map((app) => (
                      <div
                        key={app.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                              {app.domainLabel}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white mt-1.5">
                              {app.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleAskPrompt(app.suggestedChatPrompt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 text-[11px] font-medium flex items-center gap-1 border border-slate-800 hover:border-cyan-700 transition-colors shrink-0"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>ถามต่อใน Chat</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {app.description}
                        </p>

                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            สถานการณ์จำลองในโลกจริง (Scenario):
                          </p>
                          <p className="leading-relaxed">{app.realWorldScenario}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: REVIEW QUESTIONS */}
              {activeSection === 'questions' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>คำถามทบทวนความรู้ด้วยตนเอง (พร้อมเฉลยและเหตุผล)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {guide.reviewQuestions.length} ข้อ
                    </span>
                  </div>

                  <div className="space-y-3">
                    {guide.reviewQuestions.map((q) => {
                      const isRevealed = Boolean(revealedAnswers[q.id]);
                      return (
                        <div
                          key={q.id}
                          className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                Q{q.questionNumber}
                              </span>
                              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                                {q.question}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAskPrompt(q.suggestedChatPrompt)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 text-[11px] font-medium flex items-center gap-1 border border-slate-800 hover:border-cyan-700 transition-colors shrink-0"
                              title="ถามคำถามนี้ในแชท"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>ถามใน Chat</span>
                            </button>
                          </div>

                          {/* Reveal Answer Toggle */}
                          <div className="pt-2 border-t border-slate-900">
                            <button
                              type="button"
                              onClick={() => toggleAnswer(q.id)}
                              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>{isRevealed ? 'ซ่อนเฉลย' : 'ดูเฉลยและเหตุผลประกอบ'}</span>
                              {isRevealed ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {isRevealed && (
                              <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 space-y-2 text-xs text-emerald-200 animate-in fade-in duration-150">
                                <div>
                                  <span className="font-bold text-emerald-400">คำตอบที่ถูกต้อง: </span>
                                  <span className="text-emerald-100">{q.answer}</span>
                                </div>
                                <div className="text-[11px] text-emerald-300/80 pt-1.5 border-t border-emerald-900/30">
                                  <span className="font-semibold text-emerald-400">เหตุผลประกอบ: </span>
                                  <span>{q.rationale}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 6: LEARNING PATHWAY */}
              {activeSection === 'pathway' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                      <span>เส้นทางศึกษาต่อยอด (Learning Pathway Recommendations)</span>
                    </h3>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-400">
                    <p className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>{guide.learningPathway.labelNote}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prerequisites */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>ความรู้พื้นฐานที่ควรเข้าใจก่อน</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {guide.learningPathway.prerequisiteSuggestions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subsequent topics */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span>หัวข้อที่สามารถศึกษาต่อยอดได้</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {guide.learningPathway.subsequentSuggestions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* When Course does NOT have a Learning Guide */
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col items-center justify-center text-center space-y-4 bg-slate-950/40">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-bold text-white">
                ยังไม่มีคู่มือปูพื้นฐานที่จัดเตรียมไว้สำหรับรายวิชา {course.code || ''}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ขณะนี้ระบบจัดเตรียมคู่มือนำร่อง (MVP) ไว้สำหรับ 3 รายวิชาหลักในหลักสูตร DTM 2567 เพื่อควบคุมความถูกต้องทางวิชาการและไม่แต่งข้อมูลขึ้นเอง
              </p>
            </div>

            {/* Quick Switch to Available Guides */}
            <div className="pt-2 w-full max-w-md">
              <p className="text-xs font-semibold text-slate-300 mb-2">
                เลือกดูคู่มือปูพื้นฐานของ 3 รายวิชาที่มีอยู่ในระบบ:
              </p>
              <div className="grid grid-cols-1 gap-2 text-left">
                {[
                  { code: 'DTM67-111', title: 'ศัพท์เทคนิคทางการแพทย์' },
                  { code: 'DTM67-123', title: 'พื้นฐานเทคโนโลยีดิจิทัลทางการแพทย์' },
                  { code: 'DTM67-212', title: 'ระบบบริหารสารสนเทศสุขภาพและการแพทย์' }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => onSelectOtherCourse && onSelectOtherCourse(item.code)}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-xs text-slate-200 transition-all"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-300 mr-2">{item.code}</span>
                      <span>{item.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>หลักสูตร DTM 2567 มหาวิทยาลัยวลัยลักษณ์ • ปลอด Hallucination</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-all"
            >
              ปิดคู่มือ
            </button>
            <button
              onClick={() => {
                const codeStr = course.code ? `${course.code} ` : '';
                const titleStr = course.titleThai || '';
                handleAskPrompt(
                  `ฉันกำลังศึกษาหัวข้อเกี่ยวกับ ${codeStr}${titleStr} ในหลักสูตร DTM 2567 ช่วยอธิบายประเด็นสำคัญและยกตัวอย่างการประยุกต์ใช้งานในระบบสุขภาพให้เข้าใจง่าย`
                );
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ถามวิชานี้ใน Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
