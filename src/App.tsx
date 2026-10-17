import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Search,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Filter,
  LogIn,
  LogOut,
  Shield,
  Trash2
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { isFirebaseReady, firebaseDatabaseId } from './lib/firebase';

export interface ReferenceItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  fullText: string;
  doi?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'gemini_grounding' | 'gemini_standard' | 'academic_fallback';
  references?: Array<{
    title: string;
    uri: string;
    type?: string;
    linkAccessStatus?: string;
    verificationStatus?: string;
    evidenceLocator?: string;
    contentVersion?: string;
  }>;
}

const mockReferences: ReferenceItem[] = [
  {
    id: 'ref-1',
    title: 'Clinical Laboratory Standards Institute (CLSI) M27-A3: Reference Method for Broth Dilution Antifungal Susceptibility Testing of Yeasts',
    category: 'Microbiology',
    summary: 'มาตรฐานสากลสำหรับการทดสอบความไวของเชื้อรากลุ่ม Yeast ต่อสารต้านเชื้อรา',
    fullText: 'CLSI M27-A3 provides reference methods for determining the susceptibility of yeasts to antifungal agents such as fluconazole, itraconazole, and amphotericin B using broth microdilution techniques.',
    doi: '10.5555/clsi.m27a3'
  },
  {
    id: 'ref-2',
    title: 'International Council for Standardization in Haematology (ICSH) Guidelines for Complete Blood Count',
    category: 'Hematology',
    summary: 'แนวทางระดับสากลในการตรวจวิเคราะห์ความสมบูรณ์ของเม็ดเลือด (CBC) และการรายงานผล',
    fullText: 'ICSH guidelines establish reference procedures for hemoglobinometry, leukocyte differential counting, and platelet enumeration using automated impedance and optical scatter technologies.',
    doi: '10.1111/ijlh.12345'
  },
  {
    id: 'ref-3',
    title: 'Clinical Chemistry: Tietz Textbook of Laboratory Medicine (7th Edition)',
    category: 'Clinical Chemistry',
    summary: 'ตำรามาตรฐานด้านเคมีคลินิกครอบคลุมการวิเคราะห์เอนไซม์ อิเล็กโทรไลต์ และสารบ่งชี้โรค',
    fullText: 'Comprehensive reference on analytical methodologies, quality assurance, reference intervals, and clinical interpretation of biomarkers in plasma, serum, and urine specimens.',
    doi: '10.1016/B978-0-323-53044-6.00012-3'
  },
  {
    id: 'ref-4',
    title: 'AABB Technical Manual (20th Edition): Blood Bank and Transfusion Medicine',
    category: 'Blood Bank',
    summary: 'หลักการตรวจหมู่เลือด ระบบ ABO/Rh, Direct Coombs Test และความปลอดภัยในการให้เลือด',
    fullText: 'The AABB Technical Manual details serological testing, crossmatching protocols, transfusion reactions investigation, and component preparation standards.',
    doi: '10.1002/trf.2021'
  },
  {
    id: 'ref-5',
    title: 'WHO Laboratory Biosafety Manual (4th Edition)',
    category: 'Laboratory Safety',
    summary: 'แนวทางความปลอดภัยทางชีวภาพในห้องปฏิบัติการทางการแพทย์และการจัดการของเสียติดเชื้อ',
    fullText: 'Risk-assessment-based framework for managing biological risks in clinical and research laboratories, covering personal protective equipment, containment, and disinfection.',
    doi: '10.9999/who.biosafety.4e'
  }
];

export const vocabularyList = [
  { term: 'Aphaeresis', thai: 'กระบวนการแยกส่วนประกอบของเลือด', category: 'Blood Bank' },
  { term: 'Anisocytosis', thai: 'ภาวะที่เม็ดเลือดแดงมีขนาดแตกต่างกันมาก', category: 'Hematology' },
  { term: 'Bacteremia', thai: 'ภาวะที่มีเชื้อแบคทีเรียอยู่ในกระแสเลือด', category: 'Microbiology' },
  { term: 'Chromatography', thai: 'กระบวนการแยกสารผสมตามคุณสมบัติทางเคมี', category: 'Clinical Chemistry' },
  { term: 'Flow Cytometry', thai: 'เทคนิคการวัดคุณสมบัติทางแสงและกายภาพของเซลล์', category: 'Hematology/Immunology' },
  { term: 'Hemolysis', thai: 'ภาวะการแตกตัวของเม็ดเลือดแดง', category: 'General Laboratory' },
  { term: 'Polymerase Chain Reaction (PCR)', thai: 'ปฏิกิริยาลูกโซ่โพลิเมอเรสสำหรับตรวจสารพันธุกรรม', category: 'Molecular Pathology' },
  { term: 'Spectrophotometry', thai: 'การวัดความเข้มแสงเพื่อวิเคราะห์ความเข้มข้นสารละลาย', category: 'Clinical Chemistry' }
];

export function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('cbc') || lower.includes('เม็ดเลือด')) {
    return 'การตรวจความสมบูรณ์ของเม็ดเลือด (Complete Blood Count - CBC) ประกอบด้วย Hemoglobin (Hb), Hematocrit (Hct), WBC count, Platelet count และ Differential WBC การแปลผลต้องพิจารณาค่าอ้างอิง (Reference Range) ตามเพศและอายุ รวมถึงความผิดปกติทางสัณฐานวิทยาของเม็ดเลือดภายใต้กล้องจุลทรรศน์';
  }
  if (lower.includes('clsi') || lower.includes('มาตรฐาน')) {
    return 'CLSI (Clinical and Laboratory Standards Institute) เป็นองค์กรสากลที่กำหนดแนวปฏิบัติและมาตรฐานสำหรับการตรวจวิเคราะห์ทางห้องปฏิบัติการทางการแพทย์ เพื่อให้ผลการตรวจมีความถูกต้อง แม่นยำ และเปรียบเทียบกันได้ทั่วโลก';
  }
  if (lower.includes('blood bank') || lower.includes('หมู่เลือด') || lower.includes('abo')) {
    return 'การตรวจหมู่เลือดระบบ ABO และ Rh Typing เป็นหัวใจสำคัญของงานธนาคารเลือด ประกอบด้วย Forward Typing (ใช้ Anti-A, Anti-B ตรวจเม็ดเลือดแดงผู้ป่วย) และ Reverse Typing (ใช้ A-cell, B-cell ตรวจซีรั่ม/พลาสมา) เพื่อป้องกันปฏิกิริยา Transfusion Reaction';
  }
  if (lower.includes('microbiology') || lower.includes('เชื้อรา') || lower.includes('แบคทีเรีย')) {
    return 'งานจุลชีววิทยาคลินิกครอบคลุมการย้อมสี Gram stain, การเพาะเชื้อบน Media ต่างๆ (เช่น Blood agar, MacConkey agar), การทดสอบความไวต่อยาต้านจุลชีพ (AST) ตามมาตรฐาน CLSI และการจำแนกชนิดเชื้อด้วยวิธี Biochemical test หรือ MALDI-TOF';
  }
  return `ขอบคุณสำหรับคำถามเกี่ยวกับ "${prompt}" ศูนย์การเรียนรู้เทคนิคการแพทย์ AI พร้อมให้คำปรึกษาเชิงวิชาการตามมาตรฐานสากล (CLSI, CAP, WHO) กรุณาเลือกหัวข้อในคลังความรู้ หรือสอบถามรายละเอียดเพิ่มเติมเกี่ยวกับเคมีคลินิก โลหิตวิทยา จุลชีววิทยา และภูมิคุ้มกันวิทยาได้เลยครับ`;
}

export default function App() {
  const { user, loading: authLoading, error: authError, signInWithGoogle, signOutUser, clearError } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'vocabulary' | 'references'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'สวัสดีครับ! ผมคือผู้ช่วยอัจฉริยะของ **MedTech Learning Hub AI v1.2** พร้อมให้บริการข้อมูลวิชาการเทคนิคการแพทย์ คลังคำศัพท์เฉพาะทาง และแหล่งอ้างอิงมาตรฐานสากล คุณสามารถพิมพ์คำถามหรือเลือกหัวข้อด้านล่างได้เลยครับ',
      timestamp: new Date()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeReference, setActiveReference] = useState<ReferenceItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatSessionIdRef = useRef<string>(Date.now().toString());

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    chatSessionIdRef.current = Date.now().toString();
    setIsGenerating(false);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'สวัสดีครับ! ผมคือผู้ช่วยอัจฉริยะของ **MedTech Learning Hub AI v1.2** พร้อมให้บริการข้อมูลวิชาการเทคนิคการแพทย์ คลังคำศัพท์เฉพาะทาง และแหล่งอ้างอิงมาตรฐานสากล คุณสามารถพิมพ์คำถามหรือเลือกหัวข้อด้านล่างได้เลยครับ',
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryText = inputQuery.trim();
    if (!queryText || isGenerating) return;

    abortControllerRef.current = new AbortController();
    const currentSessionId = chatSessionIdRef.current;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsGenerating(true);

    try {
      const historyCandidates = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          text: m.content.trim()
        }))
        .filter((m) => m.text.length > 0 && m.text.length <= 4000);

      const candidatePayload = [...historyCandidates, { role: 'user' as const, text: queryText }];
      if (candidatePayload.length === 0 || candidatePayload[candidatePayload.length - 1].role !== 'user') {
        candidatePayload.push({ role: 'user', text: queryText });
      }

      let validSlice = [...candidatePayload];
      while (validSlice.length > 0) {
        const totalChars = validSlice.reduce((acc, m) => acc + m.text.length, 0);
        const countValid = validSlice.length >= 1 && validSlice.length <= 8;
        const startsUser = validSlice[0].role === 'user';
        const endsUser = validSlice[validSlice.length - 1].role === 'user';

        let alternating = true;
        for (let i = 0; i < validSlice.length - 1; i++) {
          if (validSlice[i].role === validSlice[i + 1].role) {
            alternating = false;
            break;
          }
        }

        if (countValid && totalChars <= 15000 && startsUser && endsUser && alternating) {
          break;
        }

        if (validSlice.length > 2) {
          validSlice.splice(0, 2);
        } else {
          validSlice = [{ role: 'user', text: queryText }];
          break;
        }
      }

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: validSlice }),
        signal: abortControllerRef.current.signal
      });

      if (currentSessionId !== chatSessionIdRef.current) {
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (ไม่ใช่ JSON)');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const aiReply: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.text || 'ไม่พบข้อมูลคำตอบจากระบบ',
        timestamp: new Date(),
        source: data.source || 'academic_fallback',
        references: Array.isArray(data.references) ? data.references : undefined
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (currentSessionId !== chatSessionIdRef.current) {
        return;
      }
      const errorReply: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `*(ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'} กรุณาลองใหม่อีกครั้ง)*`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      if (currentSessionId === chatSessionIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const filteredVocab = vocabularyList.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.thai.includes(searchFilter);
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredRefs = mockReferences.filter((ref) => {
    const matchesSearch = ref.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          ref.summary.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'All' || ref.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                MedTech Learning Hub AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                v1.2
              </span>
            </div>
            <p className="text-xs text-slate-400">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ</p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            ผู้ช่วย AI วิชาการ
          </button>
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'vocabulary'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            คลังศัพท์เทคนิค
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'references'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            แหล่งอ้างอิงสากล
          </button>
        </nav>

        {/* Zone 3: Authentication & Status Modal Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium transition-all"
            title="AI System Status & Firebase Info"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>สถานะระบบ</span>
          </button>

          {authLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email}
                </span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate text-white">{user.displayName || 'ผู้ใช้งานระบบ'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="py-2 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">สถานะตัวตน:</span>
                      <span className="text-emerald-400 font-medium">Google Verified</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">UID:</span>
                      <span className="font-mono text-slate-400 truncate max-w-[140px]">{user.uid}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Database ID:</span>
                      <span className="font-mono text-cyan-400">{firebaseDatabaseId}</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        signOutUser();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      ออกจากระบบ (Sign Out)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>
          )}
        </div>
      </header>

      {/* ERROR BANNER IF ANY */}
      {authError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={clearError} className="underline text-red-200 hover:text-white">
            ปิด
          </button>
        </div>
      )}

      {/* MOBILE NAV */}
      <div className="flex md:hidden border-b border-slate-800 bg-slate-900 px-4 py-2 gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center ${
            activeTab === 'chat' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-slate-950'
          }`}
        >
          AI แชท
        </button>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center ${
            activeTab === 'vocabulary' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-slate-950'
          }`}
        >
          คลังศัพท์
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center ${
            activeTab === 'references' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-slate-950'
          }`}
        >
          อ้างอิง
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Chat header banner */}
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-sm">MedTech Academic Assistant</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 hidden sm:block">
                  มาตรฐาน CLSI / CAP / WHO / ICSH
                </div>
                <button
                  onClick={handleClearChat}
                  title="ล้างประวัติแชท"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all border border-slate-700 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>ล้างแชท</span>
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.source && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-mono border ${
                          msg.source === 'gemini_grounding'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : msg.source === 'gemini_standard'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}>
                          {msg.source === 'gemini_grounding'
                            ? 'Google Search Grounding (Live)'
                            : msg.source === 'gemini_standard'
                            ? 'Gemini AI Standard'
                            : 'Academic Fallback Mode'}
                        </span>
                      </div>
                    )}
                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          แหล่งอ้างอิง / References (Unverified External Sources)
                        </p>
                        <div className="space-y-1.5">
                          {msg.references.map((ref, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                {ref.uri && (ref.uri.startsWith('http://') || ref.uri.startsWith('https://')) ? (
                                  <a
                                    href={ref.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline font-medium break-words block"
                                  >
                                    {ref.title || ref.uri}
                                  </a>
                                ) : (
                                  <span className="text-slate-300 font-medium">{ref.title}</span>
                                )}
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                  <span>Type: {ref.type || 'reference'}</span>
                                  <span>• Status: Unverified</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div
                      className={`text-[10px] mt-2 ${
                        msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>กำลังวิเคราะห์และเรียบเรียงคำตอบตามมาตรฐานเทคนิคการแพทย์...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="สอบถามเรื่อง CBC, เกณฑ์ CLSI, การตรวจธนาคารเลือด หรือผลตรวจทางห้องปฏิบัติการ..."
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isGenerating}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
              >
                <span>ส่งคำถาม</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ หรือคำแปลไทย..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Blood Bank', 'Hematology', 'Clinical Chemistry', 'Molecular Pathology'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVocab.map((vocab, index) => (
                <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-cyan-400">{vocab.term}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                      {vocab.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{vocab.thai}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อคู่มือ มาตรฐาน หรือ DOI..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                แสดงผล {filteredRefs.length} รายการมาตรฐานสากล
              </div>
            </div>

            <div className="space-y-4">
              {filteredRefs.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => setActiveReference(ref)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {ref.title}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 shrink-0 font-mono">
                      {ref.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{ref.summary}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono">DOI: {ref.doi}</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                      ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* REFERENCE DETAIL MODAL */}
      {activeReference && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {activeReference.category}
                </span>
                <h2 className="text-lg font-bold text-white mt-2">{activeReference.title}</h2>
              </div>
              <button
                onClick={() => setActiveReference(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">บทสรุปผู้บริหาร / Summary</p>
                <p className="text-sm text-slate-200">{activeReference.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">เนื้อหาเชิงวิชาการ / Full Content</p>
                <p className="text-sm text-slate-300 leading-relaxed">{activeReference.fullText}</p>
              </div>
              {activeReference.doi && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">DOI: {activeReference.doi}</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> มาตรฐานสากลรับรอง
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveReference(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM STATUS & FIREBASE MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">สถานะระบบ & Firebase Integration</h2>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">โปรเจกต์ (Project ID):</span>
                  <span className="font-mono text-cyan-400">fresh-unfolding-dt3g1</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">ภูมิภาค (Region):</span>
                  <span className="font-mono text-slate-200">asia-southeast1 (Singapore)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Database ID:</span>
                  <span className="font-mono text-cyan-400">{firebaseDatabaseId}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">ระบบยืนยันตัวตน (Auth):</span>
                  <span className="text-emerald-400 font-medium">Google Sign-In (Client-side)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">สถานะ Firebase SDK:</span>
                  <span className="text-emerald-400 font-medium">เชื่อมต่อสำเร็จ (Initialized)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">นโยบายค่าใช้จ่าย:</span>
                  <span className="text-cyan-300 font-medium">Free-only (ไม่อัปเกรด Blaze)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-all shadow-lg shadow-cyan-600/20"
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
