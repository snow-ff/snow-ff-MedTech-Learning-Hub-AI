/**
 * Course Notes Storage for MedTech Learning Hub AI
 * Persists learner's course-specific summary notes in localStorage
 * with in-memory fallback for non-browser/SSR/test environments.
 */

export interface CourseNote {
  id: string;
  courseCode: string; // e.g. "DTM67-111", "DTM67-211", or "GENERAL"
  courseTitle: string; // e.g. "พื้นฐานห้องปฏิบัติการทางการแพทย์และโลหิตวิทยา"
  title: string;
  content: string;
  tags?: string[];
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  sourceMessageId?: string;
  sourceType?: 'chat_summary' | 'manual' | 'learning_guide';
}

export const COURSE_NOTES_STORAGE_KEY = 'medtech_course_notes';

export const SAMPLE_INITIAL_NOTES: CourseNote[] = [
  {
    id: 'note-sample-1',
    courseCode: 'DTM67-111',
    courseTitle: 'พื้นฐานห้องปฏิบัติการทางการแพทย์และโลหิตวิทยา',
    title: 'สรุปการจำแนกชนิดตัวอย่างเลือด: Serum vs Plasma & Anticoagulant',
    content: `### ประเด็นสำคัญเรื่องการเก็บและเตรียมสิ่งส่งตรวจโลหิตวิทยา
1. **EDTA (หลอดสีม่วง/Lavender top)**
   - สารต้านการแข็งตัวของเลือดชนิดยึดจับแคลเซียมไอออน (Chelates Ca2+)
   - นิยมใช้สำหรับการตรวจ Complete Blood Count (CBC) และจัดทำ Blood Smear เนื่องจากรักษาลักษณะทางสัณฐานวิทยา (Morphology) ของเม็ดเลือดได้ดีที่สุด

2. **Sodium Citrate (หลอดสีฟ้า/Light blue top)**
   - สัดส่วน Anticoagulant ต่อเลือดคือ 1:9
   - ใช้ตรวจการแข็งตัวของเลือด (Coagulation tests เช่น PT, PTT)

3. **Serum vs Plasma**
   - **Plasma**: ของเหลวที่ได้จากการปั่นแยกเลือดที่มี Anticoagulant (ยังมีโปรตีนการแข็งตัวของเลือด เช่น Fibrinogen)
   - **Serum**: ของเหลวที่ได้หลังจากปล่อยให้เลือดแข็งตัวสมบูรณ์แล้วปั่นแยก (ไม่มี Fibrinogen)`,
    tags: ['Hematology', 'Anticoagulant', 'CBC', 'สรุปทบทวน'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    sourceType: 'chat_summary'
  },
  {
    id: 'note-sample-2',
    courseCode: 'DTM67-211',
    courseTitle: 'ระบบสารสนเทศสุขภาพและมาตรฐานข้อมูลสุขภาพ',
    title: 'สรุปมาตรฐาน HL7 FHIR vs DICOM ในโรงพยาบาลดิจิทัล',
    content: `### บันทึกสรุปสถาปัตยกรรมสารสนเทศโรงพยาบาล
- **HL7 FHIR**: มาตรฐาน RESTful JSON/XML สำหรับแลกเปลี่ยน Clinical Data เช่น Patient, Observation, DiagnosticReport ข้ามระบบ EHR/EMR
- **DICOM**: มาตรฐานสำหรับภาพถ่ายรังสีและการแพทย์ (CT, MRI, X-ray) พร้อม Metadata ที่จัดเก็บใน PACS
- **จุดเชื่อมต่อ**: ในระบบ PACS สมัยใหม่ มักใช้ FHIR ImagingStudy หรือ WADO-RS เพื่อให้หมอเรียกดูรูปภาพผ่านเว็บแอปพลิเคชันได้โดยตรง`,
    tags: ['FHIR', 'DICOM', 'PACS', 'Health Informatics'],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    sourceType: 'chat_summary'
  }
];

// In-memory fallback for test and non-browser environments
let memoryNotes: CourseNote[] | null = null;

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  } catch {
    return false;
  }
}

/**
 * Retrieve all course notes
 */
export function getCourseNotes(): CourseNote[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(COURSE_NOTES_STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(COURSE_NOTES_STORAGE_KEY, JSON.stringify(SAMPLE_INITIAL_NOTES));
        return [...SAMPLE_INITIAL_NOTES];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      console.warn('Failed to parse course notes from localStorage:', err);
      return [];
    }
  }

  // Memory fallback
  if (!memoryNotes) {
    memoryNotes = [...SAMPLE_INITIAL_NOTES];
  }
  return [...memoryNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Save or update a note
 */
export function saveCourseNote(
  noteInput: Omit<CourseNote, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): CourseNote {
  const notes = getCourseNotes();
  const now = new Date().toISOString();

  if (noteInput.id) {
    const existingIndex = notes.findIndex(n => n.id === noteInput.id);
    if (existingIndex !== -1) {
      const updated: CourseNote = {
        ...notes[existingIndex],
        ...noteInput,
        id: noteInput.id,
        createdAt: notes[existingIndex].createdAt || now,
        updatedAt: now
      };
      notes[existingIndex] = updated;
      persistNotes(notes);
      return updated;
    }
  }

  const newNote: CourseNote = {
    id: noteInput.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    courseCode: noteInput.courseCode || 'GENERAL',
    courseTitle: noteInput.courseTitle || 'สรุปการเรียนรู้ทั่วไป',
    title: (noteInput.title || '').trim() || 'บันทึกสรุปบทเรียน',
    content: (noteInput.content || '').trim(),
    tags: noteInput.tags || [],
    createdAt: noteInput.createdAt || now,
    updatedAt: now,
    sourceMessageId: noteInput.sourceMessageId,
    sourceType: noteInput.sourceType || 'chat_summary'
  };

  notes.unshift(newNote);
  persistNotes(notes);
  return newNote;
}

/**
 * Delete a note by ID
 */
export function deleteCourseNote(id: string): boolean {
  const notes = getCourseNotes();
  const filtered = notes.filter(n => n.id !== id);
  if (filtered.length !== notes.length) {
    persistNotes(filtered);
    return true;
  }
  return false;
}

/**
 * Clear all course notes (primarily for testing or reset)
 */
export function clearAllCourseNotes(): void {
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(COURSE_NOTES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryNotes = [];
}

/**
 * Filter notes by course code
 */
export function getNotesByCourse(courseCode: string): CourseNote[] {
  const notes = getCourseNotes();
  if (!courseCode || courseCode === 'ALL') {
    return notes;
  }
  return notes.filter(n => n.courseCode === courseCode);
}

/**
 * Search notes by keyword in title, content, or tags
 */
export function searchCourseNotes(query: string, courseCodeFilter?: string): CourseNote[] {
  let notes = getCourseNotes();
  if (courseCodeFilter && courseCodeFilter !== 'ALL') {
    notes = notes.filter(n => n.courseCode === courseCodeFilter);
  }
  if (!query || !query.trim()) {
    return notes;
  }
  const q = query.toLowerCase().trim();
  return notes.filter(n => {
    const matchTitle = n.title.toLowerCase().includes(q);
    const matchContent = n.content.toLowerCase().includes(q);
    const matchCourse = n.courseCode.toLowerCase().includes(q) || n.courseTitle.toLowerCase().includes(q);
    const matchTags = n.tags?.some(tag => tag.toLowerCase().includes(q));
    return matchTitle || matchContent || matchCourse || matchTags;
  });
}

function persistNotes(notes: CourseNote[]): void {
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(COURSE_NOTES_STORAGE_KEY, JSON.stringify(notes));
      return;
    } catch (e) {
      console.error('Error saving notes to localStorage:', e);
    }
  }
  memoryNotes = [...notes];
}
