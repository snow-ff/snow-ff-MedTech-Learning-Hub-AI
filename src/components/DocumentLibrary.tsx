import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Sparkles,
  Tag,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  X,
  Layers,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { LearningDocument, DocumentChunk, DocumentType } from '../models/coreModel';
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  seedSampleDocumentsIfEmpty
} from '../lib/documentStorage';
import { chunkText } from '../lib/documentChunker';
import { extractTextFromFile } from '../lib/pdfExtractor';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

interface DocumentLibraryProps {
  onSelectForChat: (doc: LearningDocument) => void;
  activeChatDocumentId?: string | null;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  onSelectForChat,
  activeChatDocumentId
}) => {
  const [documents, setDocuments] = useState<LearningDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<LearningDocument | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState<string>('');

  // Manual Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCourseCode, setNoteCourseCode] = useState('');
  const [noteType, setNoteType] = useState<DocumentType>('note');
  const [noteTags, setNoteTags] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const list = await seedSampleDocumentsIfEmpty();
      setDocuments(list);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    if (selectedCourseFilter !== 'all' && doc.courseCode !== selectedCourseFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && doc.type !== selectedTypeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = doc.title.toLowerCase().includes(q);
      const inCourse = (doc.courseCode || '').toLowerCase().includes(q);
      const inFilename = (doc.filename || '').toLowerCase().includes(q);
      const inTags = doc.tags?.some((t) => t.toLowerCase().includes(q));
      const inSnippet = (doc.rawSnippet || '').toLowerCase().includes(q);
      return inTitle || inCourse || inFilename || inTags || inSnippet;
    }
    return true;
  });

  // Handle File Upload (.txt, .md, .pdf)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validExtensions = ['.pdf', '.txt', '.md', '.json', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('รองรับเฉพาะไฟล์ .pdf, .txt, .md, .json เท่านั้น');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress('กำลังอ่านและสกัดข้อความภายในเบราว์เซอร์ (Local-First)...');

    try {
      const extracted = await extractTextFromFile(file);

      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new Error('ไม่พบเนื้อหาข้อความในไฟล์ หรือไฟล์ได้รับการเข้ารหัส');
      }

      setUploadProgress('กำลังจัดทำดัชนีและแบ่งชิ้นส่วนข้อความ (Chunking)...');

      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const chunks = chunkText(extracted.text, {
        documentId: docId,
        pages: extracted.pages,
        maxChunkChars: 900,
        overlapChars: 120
      });

      // Find course title if selected
      const courseInfo = OFFICIAL_COURSES_2567.find((c) => c.code === selectedCourseForUpload);

      const newDoc: LearningDocument = {
        id: docId,
        title: extracted.title,
        filename: file.name,
        fileSize: file.size,
        type: extracted.fileType,
        courseCode: selectedCourseForUpload || undefined,
        courseTitle: courseInfo?.titleThai || courseInfo?.titleEnglish,
        tags: [extracted.fileType, file.name.split('.').pop() || 'doc'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalChars: extracted.text.length,
        totalPages: extracted.pages ? extracted.pages.length : Math.max(1, Math.ceil(extracted.text.length / 1000)),
        chunks,
        rawSnippet: extracted.text.slice(0, 240) + '...'
      };

      await saveDocument(newDoc);
      await loadDocs();
      setShowUploadModal(false);
      setSelectedCourseForUpload('');
    } catch (err: any) {
      console.error('File extraction failed:', err);
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Create Manual Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหาโน้ตสรุป');
      return;
    }

    const docId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chunks = chunkText(noteContent, {
      documentId: docId,
      maxChunkChars: 800,
      overlapChars: 100
    });

    const courseInfo = OFFICIAL_COURSES_2567.find((c) => c.code === noteCourseCode);
    const tagsArray = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newNoteDoc: LearningDocument = {
      id: docId,
      title: noteTitle.trim(),
      filename: `${noteTitle.trim().replace(/\s+/g, '_')}.md`,
      fileSize: noteContent.length,
      type: noteType,
      courseCode: noteCourseCode || undefined,
      courseTitle: courseInfo?.titleThai || courseInfo?.titleEnglish,
      tags: tagsArray.length > 0 ? tagsArray : ['บันทึกสรุป', 'note'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalChars: noteContent.length,
      totalPages: Math.max(1, Math.ceil(noteContent.length / 800)),
      chunks,
      rawSnippet: noteContent.slice(0, 220) + '...'
    };

    await saveDocument(newNoteDoc);
    await loadDocs();

    // Reset Form
    setNoteTitle('');
    setNoteContent('');
    setNoteCourseCode('');
    setNoteTags('');
    setShowNoteModal(false);
  };

  const handleDelete = async (doc: LearningDocument) => {
    if (confirm(`คุณต้องการลบเอกสาร "${doc.title}" ออกจากคลังเครื่องนี้หรือไม่?`)) {
      await deleteDocument(doc.id);
      if (viewingDoc?.id === doc.id) {
        setViewingDoc(null);
      }
      await loadDocs();
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Track B1 • Local-First Learning Document MVP
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                เบราว์เซอร์ 100% ปลอดภัย ไร้ค่าใช้จ่ายคลาวด์
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              คลังเอกสารและสไลด์สรุปการเรียน (Document Library)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              นำเข้าไฟล์เอกสาร (.txt, .md, .pdf) หรือจดโน้ตสรุป จัดเก็บในเครื่องผู้ใช้ด้วย IndexedDB พร้อมระบบแตกชิ้นส่วน (Chunks) เพื่อถามตอบวิชาการกับ AI อย่างแม่นยำ ปราศจากข้อมูลลวง
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs md:text-sm shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>นำเข้าไฟล์เอกสาร</span>
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs md:text-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>เขียนโน้ตสรุป</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเอกสาร, คำสำคัญ, หรือเนื้อหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="all">ทุกรายวิชา (All Courses)</option>
              {OFFICIAL_COURSES_2567.map((c) => (
                <option key={c.id} value={c.code || c.id}>
                  {c.code ? `${c.code}: ` : ''}
                  {c.titleThai || c.titleEnglish}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="all">ทุกประเภทเอกสาร (All Types)</option>
              <option value="note">บันทึกสรุป / เลกเชอร์ (Note)</option>
              <option value="pdf">เอกสาร PDF (PDF Document)</option>
              <option value="slide">สไลด์บรรยาย (Slide)</option>
              <option value="paper">รายงาน / บทความวิชาการ (Paper)</option>
              <option value="text">ข้อความธรรมดา (Plain Text)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid / List */}
      <div className="flex-1">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-xs">กำลังโหลดคลังเอกสารภายในเครื่อง...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">ยังไม่พบเอกสารในเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              คุณสามารถกดปุ่ม "นำเข้าไฟล์เอกสาร" หรือ "เขียนโน้ตสรุป" เพื่อเริ่มสร้างคลังการเรียนรู้ส่วนตัวได้ทันที
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
              >
                นำเข้าไฟล์
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                เขียนโน้ตสรุป
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const isActiveChat = activeChatDocumentId === doc.id;

              return (
                <div
                  key={doc.id}
                  className={`flex flex-col bg-slate-900/80 border rounded-2xl p-4 transition-all duration-200 hover:border-slate-700 hover:shadow-xl relative group ${
                    isActiveChat
                      ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {doc.type}
                        </span>
                        {doc.courseCode && (
                          <span className="ml-1.5 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            {doc.courseCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="ดูรายละเอียดชิ้นส่วนเนื้อหา (Chunks)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="ลบเอกสาร"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & snippet */}
                  <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 mb-1">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                    {doc.rawSnippet || 'ไม่มีข้อความตัวอย่าง'}
                  </p>

                  {/* Metadata Stats */}
                  <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" title="จำนวนชิ้นส่วนข้อความ">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{doc.chunks.length} Chunks</span>
                      </span>
                      <span className="flex items-center gap-1" title="ความยาวตัวอักษร">
                        <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{doc.totalChars.toLocaleString()} ตัวอักษร</span>
                      </span>
                    </div>

                    <span className="text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Active study or start study button */}
                  <div className="mt-3">
                    <button
                      onClick={() => onSelectForChat(doc)}
                      className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isActiveChat
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-400 border border-slate-700/80'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isActiveChat ? 'กำลังศึกษาเอกสารนี้อยู่ (Active)' : 'ถามตอบกับ AI จากเอกสารนี้'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setUploadError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">นำเข้าไฟล์เอกสารเพื่อการเรียนรู้</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              ไฟล์จะถูกแยกข้อความเป็นชิ้นส่วน (Chunks) ในเครื่องของคุณ ไม่มีการอัปโหลดไฟล์ไปเก็บบนเซิร์ฟเวอร์ภายนอก
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  เชื่อมโยงกับรายวิชาในหลักสูตร (ไม่บังคับ)
                </label>
                <select
                  value={selectedCourseForUpload}
                  onChange={(e) => setSelectedCourseForUpload(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- ไม่ระบุรายวิชา (เอกสารทั่วไป) --</option>
                  {OFFICIAL_COURSES_2567.map((c) => (
                    <option key={c.id} value={c.code || c.id}>
                      {c.code ? `${c.code}: ` : ''}
                      {c.titleThai || c.titleEnglish}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50 hover:bg-cyan-950/10"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  รองรับ: PDF (.pdf), สรุปข้อความ (.txt, .md)
                </p>
              </div>

              {uploadProgress && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0"></div>
                  <span>{uploadProgress}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Write Manual Note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowNoteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">บันทึกสรุปเนื้อหาการเรียน (Study Note)</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              พิมพ์หรือวางข้อความสรุป เลกเชอร์ หรือคู่มือ เพื่อให้ AI นำไปใช้อ้างอิงในการตอบคำถาม
            </p>

            <form onSubmit={handleCreateNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อบันทึก / หัวข้อ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สรุปการย้อมสีแกรมและแบคทีเรียที่พบบ่อย"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    เชื่อมโยงรายวิชา (ไม่บังคับ)
                  </label>
                  <select
                    value={noteCourseCode}
                    onChange={(e) => setNoteCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- ไม่ระบุรายวิชา --</option>
                    {OFFICIAL_COURSES_2567.map((c) => (
                      <option key={c.id} value={c.code || c.id}>
                        {c.code ? `${c.code}: ` : ''}
                        {c.titleThai || c.titleEnglish}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ประเภท</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="note">บันทึกสรุป (Note)</option>
                    <option value="slide">สรุปจากสไลด์ (Slide Summary)</option>
                    <option value="paper">บทความ / เปเปอร์ (Paper)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  แท็กคำสำคัญ (คั่นด้วยจุลภาค เช่น เคมีคลินิก, QC)
                </label>
                <input
                  type="text"
                  placeholder="จุลชีววิทยา, Gram Stain, QC"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">เนื้อหาบันทึกสรุป *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="พิมพ์หรือวางเนื้อหาวิชาการที่นี่... (รองรับการแตกชิ้นส่วน Chunks อัตโนมัติ)"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
                >
                  บันทึกเข้าคลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Chunks & Document Details */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white truncate max-w-[80%]">
                {viewingDoc.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
              <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase font-semibold text-[10px]">
                {viewingDoc.type}
              </span>
              {viewingDoc.courseCode && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                  วิชา: {viewingDoc.courseCode} {viewingDoc.courseTitle ? `(${viewingDoc.courseTitle})` : ''}
                </span>
              )}
              <span>{viewingDoc.chunks.length} Chunks</span>
              <span>{viewingDoc.totalChars.toLocaleString()} ตัวอักษร</span>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs font-medium text-slate-300">
                รายการชิ้นส่วนข้อความ (Indexed Document Chunks for AI Grounding):
              </p>
              {viewingDoc.chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                    <span>
                      Chunk #{chunk.chunkIndex}
                      {chunk.pageNumber ? ` • หน้า ${chunk.pageNumber}` : ''}
                    </span>
                    <span className="text-slate-500">{chunk.charCount} chars</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleDelete(viewingDoc)}
                className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-medium"
              >
                ลบเอกสารนี้
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    onSelectForChat(viewingDoc);
                    setViewingDoc(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>เริ่มถามตอบกับ AI จากเอกสารนี้</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
