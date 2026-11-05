import React, { useState } from 'react';
import { Bookmark, X, Check, GraduationCap } from 'lucide-react';
import { CourseItem } from '../models/coreModel';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';
import { saveCourseNote } from '../lib/courseNotesStorage';

interface SaveNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  sourceMessageId?: string;
  activeCourse: CourseItem | null;
  onSavedSuccess: (courseCode: string, noteTitle: string) => void;
}

export const SaveNoteModal: React.FC<SaveNoteModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  sourceMessageId,
  activeCourse,
  onSavedSuccess
}) => {
  if (!isOpen) return null;

  // Extract a sensible default title from content (first heading or first 60 chars)
  const defaultTitle = React.useMemo(() => {
    const lines = initialContent.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const clean = line.replace(/^[#*\-•\s]+/, '').trim();
      if (clean.length > 5 && clean.length < 80) {
        return clean;
      }
    }
    return 'สรุปบทเรียน ' + (activeCourse?.code ? activeCourse.code : 'ทั่วไป');
  }, [initialContent, activeCourse]);

  const [courseCode, setCourseCode] = useState<string>(activeCourse?.code || 'DTM67-111');
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState('สรุป AI, ทบทวน');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const courseObj = OFFICIAL_COURSES_2567.find(c => c.code === courseCode);
    const courseTitle = courseObj?.titleThai || 'บันทึกการเรียนรู้ทั่วไป';

    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    saveCourseNote({
      courseCode,
      courseTitle,
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
      sourceMessageId,
      sourceType: 'chat_summary'
    });

    onSavedSuccess(courseCode, title.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white">บันทึกสรุปบทเรียนลงรายวิชา</h3>
              <p className="text-[11px] text-slate-400">บันทึกลงใน localStorage สำหรับอ่านทบทวนและเตรียมสอบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3.5 mt-4 overflow-y-auto pr-1">
          {/* Course select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              เลือกรายวิชาที่ต้องการผูกบันทึกสรุป:
            </label>
            <select
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              ชื่อหัวข้อสรุป:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              เนื้อหาที่ต้องการบันทึกสรุป:
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              แท็กกำกับ:
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="เช่น CBC, ข้อสอบ, แล็บ"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกสรุป</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
