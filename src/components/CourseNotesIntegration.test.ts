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

  it('should verify that Desktop and Mobile navigation have NO Notes entrance remaining', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const appTsxPath = path.resolve(__dirname, '../App.tsx');
    const appSource = fs.readFileSync(appTsxPath, 'utf-8');

    // 1. Desktop & Mobile Nav have no setActiveTab('notes')
    expect(appSource).not.toContain("setActiveTab('notes')");

    // 2. No activeTab === 'notes' view rendering
    expect(appSource).not.toContain("activeTab === 'notes'");

    // 3. No Notes entrance buttons in chat header or course header
    expect(appSource).not.toContain('title="เปิดดูโน้ตสรุปรายวิชา"');
    expect(appSource).not.toContain('title="เปิดดูโน้ตสรุปของวิชานี้"');
    expect(appSource).not.toContain('<span>โน้ตวิชานี้</span>');
  });

  it('should preserve saving notes from AI messages and SaveNoteModal integration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const appTsxPath = path.resolve(__dirname, '../App.tsx');
    const appSource = fs.readFileSync(appTsxPath, 'utf-8');

    // SaveNoteModal is rendered
    expect(appSource).toContain('<SaveNoteModal');

    // Save note from AI message buttons exist
    expect(appSource).toContain('handleSaveMessageAsNote');
    expect(appSource).toContain('handleSaveLatestSummary');
    expect(appSource).toContain('title="บันทึกคำตอบนี้เป็นโน้ตสรุปบทเรียนรายวิชาใน localStorage"');

    // Saving note functionality remains operational
    const note = saveCourseNote({
      courseCode: 'DTM67-111',
      courseTitle: 'พื้นฐานห้องปฏิบัติการทางการแพทย์',
      title: 'ข้อความคำตอบ AI เรื่อง Fibrinogen',
      content: 'Fibrinogen พบใน Plasma แต่ไม่พบใน Serum',
      sourceType: 'chat_summary'
    });
    expect(note.id).toBeDefined();
    expect(getCourseNotes().length).toBeGreaterThan(0);
  });
});
