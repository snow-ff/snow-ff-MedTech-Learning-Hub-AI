import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  GraduationCap,
  Tag,
  Clock,
  Sparkles,
  MessageSquare,
  Filter,
  X,
  FileText
} from 'lucide-react';
import { CourseNote, saveCourseNote, deleteCourseNote } from '../lib/courseNotesStorage';
import { CourseItem } from '../models/coreModel';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

interface CourseNotesViewProps {
  notes: CourseNote[];
  onRefreshNotes: () => void;
  selectedCourse: CourseItem | null;
  onSelectCourse: (course: CourseItem | null) => void;
  onAskAiWithNote?: (note: CourseNote) => void;
}

export const CourseNotesView: React.FC<CourseNotesViewProps> = ({
  notes,
  onRefreshNotes,
  selectedCourse,
  onSelectCourse,
  onAskAiWithNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(
    selectedCourse?.code || 'ALL'
  );
  const [editingNote, setEditingNote] = useState<CourseNote | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Form State for Create / Edit Modal
  const [formCourseCode, setFormCourseCode] = useState(selectedCourse?.code || 'DTM67-111');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  // Synchronize filter when parent selectedCourse changes
  React.useEffect(() => {
    if (selectedCourse?.code) {
      setSelectedCourseFilter(selectedCourse.code);
    }
  }, [selectedCourse]);

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCourseFilter && selectedCourseFilter !== 'ALL') {
      result = result.filter(n => n.courseCode === selectedCourseFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(n => {
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchCourse = n.courseCode.toLowerCase().includes(q) || n.courseTitle.toLowerCase().includes(q);
        const matchTag = n.tags?.some(t => t.toLowerCase().includes(q));
        return matchTitle || matchContent || matchCourse || matchTag;
      });
    }
    return result;
  }, [notes, selectedCourseFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    const defaultCode = selectedCourse?.code || (selectedCourseFilter !== 'ALL' ? selectedCourseFilter : 'DTM67-111');
    setFormCourseCode(defaultCode);
    setFormTitle('');
    setFormContent('');
    setFormTags('');
    setIsCreatingNew(true);
    setEditingNote(null);
  };

  const handleOpenEditModal = (note: CourseNote) => {
    setFormCourseCode(note.courseCode);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setEditingNote(note);
    setIsCreatingNew(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    // Find course title
    const courseObj = OFFICIAL_COURSES_2567.find(c => c.code === formCourseCode);
    const courseTitle = courseObj?.titleThai || 'บันทึกการเรียนรู้ทั่วไป';

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    saveCourseNote({
      id: editingNote ? editingNote.id : undefined,
      courseCode: formCourseCode,
      courseTitle: courseTitle,
      title: formTitle.trim(),
      content: formContent.trim(),
      tags: tagsArray,
      sourceType: editingNote ? editingNote.sourceType : 'manual'
    });

    onRefreshNotes();
    setEditingNote(null);
    setIsCreatingNew(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`ยืนยันการลบโน้ตสรุป "${title}"?`)) {
      deleteCourseNote(id);
      onRefreshNotes();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedNoteId(id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner / Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>โน้ตสรุปบทเรียนรายวิชา</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    {filteredNotes.length} โน้ต
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  จัดเก็บความรู้ สรุปเนื้อหาสำคัญ และทบทวนบทเรียนที่สัมพันธ์กับหลักสูตร DTM 2567 (บันทึกในอุปกรณ์ของผู้เรียน)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เขียนโน้ตใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="max-w-6xl mx-auto mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">ทุกรายวิชา ({notes.length})</option>
              {OFFICIAL_COURSES_2567.map(course => {
                const count = notes.filter(n => n.courseCode === course.code).length;
                return (
                  <option key={course.code} value={course.code}>
                    {course.code} {course.titleThai} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
              <option value="GENERAL">บันทึกทั่วไป (General)</option>
            </select>
          </div>

          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโน้ตตามชื่อเรื่อง, คำสำคัญ, เนื้อหา หรือแท็ก..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">ไม่พบโน้ตสรุปบทเรียน</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
              {searchQuery
                ? `ไม่มีโน้ตที่ตรงกับคำค้นหา "${searchQuery}"`
                : 'คุณยังไม่มีโน้ตสรุปสำหรับวิชานี้ สามารถกดปุ่ม "บันทึกสรุป" ใต้คำตอบของ AI ในห้องแชท หรือกดปุ่ม "เขียนโน้ตใหม่" ได้ทันที'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างโน้ตแรกของคุณ</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map(note => {
              return (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/80 hover:border-slate-700 transition-all p-4 sm:p-5 flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    {/* Header: Course badge & actions */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono font-bold">
                          {note.courseCode}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={note.courseTitle}>
                          {note.courseTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(note.id, note.content)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="คัดลอกเนื้อหา"
                        >
                          {copiedNoteId === note.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(note)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="แก้ไขโน้ต"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id, note.title)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                          title="ลบโน้ต"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h3 className="font-semibold text-sm sm:text-base text-slate-100 mb-2 leading-snug">
                      {note.title}
                    </h3>

                    {/* Content preview */}
                    <div className="text-xs text-slate-300/90 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {note.content}
                    </div>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-800/60">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {note.tags.map(tag => (
                          <span
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-cyan-300 hover:bg-cyan-950/60 cursor-pointer transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Date & AI follow-up action */}
                  <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      {note.sourceType === 'chat_summary' && (
                        <span className="ml-1 text-[10px] text-cyan-400/80 bg-cyan-950/40 px-1 rounded border border-cyan-800/30">
                          จาก AI แชท
                        </span>
                      )}
                    </div>

                    {onAskAiWithNote && (
                      <button
                        onClick={() => onAskAiWithNote(note)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        title="นำเนื้อหาโน้ตนี้ไปเปิดคำถามต่อยอดกับ AI"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>ถาม AI ต่อ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreatingNew || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-cyan-400" />
                <span>{editingNote ? 'แก้ไขโน้ตสรุปบทเรียน' : 'เขียนโน้ตสรุปบทเรียนใหม่'}</span>
              </h3>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setIsCreatingNew(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto pr-1">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  รายวิชาที่สัมพันธ์กับโน้ต:
                </label>
                <select
                  value={formCourseCode}
                  onChange={e => setFormCourseCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {OFFICIAL_COURSES_2567.map(course => (
                    <option key={course.code} value={course.code}>
                      {course.code} - {course.titleThai}
                    </option>
                  ))}
                  <option value="GENERAL">GENERAL - บันทึกการเรียนรู้ทั่วไป</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  หัวข้อสรุป (Title):
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สรุปการอ่านค่า CBC และเม็ดเลือดขาวชนิดต่างๆ"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  เนื้อหาบันทึกสรุป (Markdown หรือข้อความ):
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="บันทึกข้อความสรุป แนวคิดสำคัญ กลไก หรือขั้นตอนปฏิบัติ..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  แท็กคำสำคัญ (คั่นด้วยจุลภาค):
                </label>
                <input
                  type="text"
                  placeholder="เช่น CBC, Hematology, เตรียมสอบ"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  {editingNote ? 'บันทึกการแก้ไข' : 'บันทึกโน้ต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
