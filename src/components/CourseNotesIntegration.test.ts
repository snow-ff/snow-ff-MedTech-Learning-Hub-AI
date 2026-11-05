import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCourseNote,
  getCourseNotes,
  clearAllCourseNotes,
  getNotesByCourse,
  searchCourseNotes
} from '../lib/courseNotesStorage';
import { OFFICIAL_COURSES_2567 } from '../data/curriculumData';

describe('Course Notes Feature Integration', () => {
  beforeEach(() => {
    clearAllCourseNotes();
  });

  it('should associate saved notes with official DTM 2567 course codes', () => {
    const course = OFFICIAL_COURSES_2567[0]; // DTM67-101 or DTM67-111
    expect(course.code).toBeDefined();

    const saved = saveCourseNote({
      courseCode: course.code!,
      courseTitle: course.titleThai || 'วิชาหลักสูตร DTM',
      title: `สรุปความรู้สำคัญวิชา ${course.code}`,
      content: 'เนื้อหาการเรียนรู้และการเตรียมสอบภาคปฏิบัติ',
      tags: ['DTM2567', 'สรุป'],
      sourceType: 'chat_summary'
    });

    expect(saved.id).toBeDefined();
    expect(saved.courseCode).toBe(course.code);

    const notesForCourse = getNotesByCourse(course.code!);
    expect(notesForCourse.length).toBe(1);
    expect(notesForCourse[0].title).toContain(course.code);
  });

  it('should search notes across multiple courses and keywords correctly', () => {
    saveCourseNote({
      courseCode: 'DTM67-111',
      courseTitle: 'พื้นฐานห้องปฏิบัติการทางการแพทย์และโลหิตวิทยา',
      title: 'การแยกเซลล์เม็ดเลือดและเกล็ดเลือด',
      content: 'การเตรียม Blood Smear ด้วยสี Wright-Giemsa stain',
      tags: ['Staining', 'Blood Smear']
    });

    saveCourseNote({
      courseCode: 'DTM67-211',
      courseTitle: 'ระบบสารสนเทศสุขภาพและมาตรฐานข้อมูลสุขภาพ',
      title: 'HL7 FHIR DiagnosticReport Resource',
      content: 'โครงสร้างข้อมูลผลตรวจทางห้องปฏิบัติการในระบบ LIS เชื่อมโยง HIS',
      tags: ['LIS', 'FHIR']
    });

    // Search by keyword in content
    const stainResults = searchCourseNotes('Wright-Giemsa');
    expect(stainResults.length).toBe(1);
    expect(stainResults[0].courseCode).toBe('DTM67-111');

    // Search by tag
    const fhirResults = searchCourseNotes('LIS');
    expect(fhirResults.length).toBe(1);
    expect(fhirResults[0].courseCode).toBe('DTM67-211');

    // Filter by course
    const dtm211Only = searchCourseNotes('', 'DTM67-211');
    expect(dtm211Only.length).toBe(1);
    expect(dtm211Only[0].courseCode).toBe('DTM67-211');
  });
});
