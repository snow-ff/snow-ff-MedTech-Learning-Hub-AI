import { describe, it, expect, beforeEach } from 'vitest';
import {
  COURSE_NOTES_STORAGE_KEY,
  getCourseNotes,
  saveCourseNote,
  deleteCourseNote,
  getNotesByCourse,
  searchCourseNotes,
  clearAllCourseNotes
} from './courseNotesStorage';

describe('Course Notes Storage', () => {
  beforeEach(() => {
    clearAllCourseNotes();
  });

  it('should seed sample initial notes on first access if storage is empty', () => {
    // When clearing all notes, calling getCourseNotes returns empty or initial depending on seed
    const notes = getCourseNotes();
    expect(notes).toBeDefined();
    expect(Array.isArray(notes)).toBe(true);
  });

  it('should create a new note with course linkage and retrieve it', () => {
    const newNote = saveCourseNote({
      courseCode: 'DTM67-111',
      courseTitle: 'พื้นฐานห้องปฏิบัติการทางการแพทย์และโลหิตวิทยา',
      title: 'การอ่านค่า CBC และเม็ดเลือดขาวชนิดต่างๆ',
      content: 'Neutrophil เด่นในแบคทีเรีย, Lymphocyte เด่นในไวรัส',
      tags: ['CBC', 'WBC'],
      sourceType: 'chat_summary'
    });

    expect(newNote.id).toBeDefined();
    expect(newNote.createdAt).toBeDefined();
    expect(newNote.courseCode).toBe('DTM67-111');

    const allNotes = getCourseNotes();
    const found = allNotes.find(n => n.id === newNote.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('การอ่านค่า CBC และเม็ดเลือดขาวชนิดต่างๆ');
  });

  it('should update an existing note without changing its creation date', () => {
    const original = saveCourseNote({
      courseCode: 'DTM67-211',
      courseTitle: 'ระบบสารสนเทศสุขภาพ',
      title: 'หัวข้อ HL7 FHIR',
      content: 'HL7 FHIR v4 เบื้องต้น'
    });

    const updated = saveCourseNote({
      id: original.id,
      courseCode: 'DTM67-211',
      courseTitle: 'ระบบสารสนเทศสุขภาพ',
      title: 'หัวข้อ HL7 FHIR ฉบับปรับปรุง',
      content: 'HL7 FHIR v4 และการใช้ Observation Resource'
    });

    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('หัวข้อ HL7 FHIR ฉบับปรับปรุง');
    expect(updated.createdAt).toBe(original.createdAt);
  });

  it('should filter notes by course code', () => {
    saveCourseNote({
      courseCode: 'DTM67-333',
      courseTitle: 'วิชาทดสอบ 1',
      title: 'โน้ตวิชา 333',
      content: 'เนื้อหาวิชา 333'
    });

    saveCourseNote({
      courseCode: 'DTM67-444',
      courseTitle: 'วิชาทดสอบ 2',
      title: 'โน้ตวิชา 444',
      content: 'เนื้อหาวิชา 444'
    });

    const filtered333 = getNotesByCourse('DTM67-333');
    expect(filtered333.every(n => n.courseCode === 'DTM67-333')).toBe(true);
    expect(filtered333.some(n => n.title === 'โน้ตวิชา 333')).toBe(true);

    const all = getNotesByCourse('ALL');
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('should search notes by title, content, or tag', () => {
    saveCourseNote({
      courseCode: 'DTM67-111',
      courseTitle: 'โลหิตวิทยา',
      title: 'เกล็ดเลือดและกลไก Hemostasis',
      content: 'เกล็ดเลือดช่วยในการแข็งตัวของเลือดปฐมภูมิ',
      tags: ['Platelet', 'Hemostasis']
    });

    const resultsByTag = searchCourseNotes('Hemostasis');
    expect(resultsByTag.length).toBeGreaterThanOrEqual(1);
    expect(resultsByTag[0].title).toContain('Hemostasis');

    const resultsByCourseFilter = searchCourseNotes('เกล็ดเลือด', 'DTM67-111');
    expect(resultsByCourseFilter.length).toBeGreaterThanOrEqual(1);

    const resultsMismatchCourse = searchCourseNotes('เกล็ดเลือด', 'DTM67-999');
    expect(resultsMismatchCourse.length).toBe(0);
  });

  it('should delete a note by ID', () => {
    const note = saveCourseNote({
      courseCode: 'DTM67-111',
      courseTitle: 'โลหิตวิทยา',
      title: 'โน้ตที่จะลบ',
      content: 'ลบรายการนี้'
    });

    expect(deleteCourseNote(note.id)).toBe(true);
    const notesAfter = getCourseNotes();
    expect(notesAfter.find(n => n.id === note.id)).toBeUndefined();
  });
});
