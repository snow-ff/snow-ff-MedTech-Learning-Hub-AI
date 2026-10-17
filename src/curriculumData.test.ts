import { describe, it, expect } from 'vitest';
import {
  dtmCurriculum2567,
  OFFICIAL_COURSES_2567,
  CURRICULUM_FILTER_TABS
} from './data/curriculumData';

describe('Curriculum Data & Inventory (Track A4)', () => {
  it('contains exactly 69 official verified courses from B.E. 2567 curriculum handbook', () => {
    expect(OFFICIAL_COURSES_2567).toHaveLength(69);
  });

  it('all 69 courses have verified status and primary evidence', () => {
    OFFICIAL_COURSES_2567.forEach((course) => {
      expect(course.verificationStatus).toBe('verified');
      expect(course.evidence.status).toBe('verified');
      expect(course.evidence.sourceTitle).toContain('มคอ.2');
      expect(course.evidence.pageNumber).toBeGreaterThanOrEqual(4);
      expect(course.evidence.pageNumber).toBeLessThanOrEqual(8);
      expect(course.code).toMatch(/^[A-Z]{3}67-\d{3}$/);
      expect(course.titleThai).toBeTruthy();
      expect(course.titleEnglish).toBeTruthy();
      expect(course.hours).toBeTruthy();
    });
  });

  it('verifies category distribution matches the official 124 credits structure', () => {
    const geCourses = OFFICIAL_COURSES_2567.filter((c) => c.category === 'general_education');
    const majorCourses = OFFICIAL_COURSES_2567.filter((c) => c.category === 'major_specific');
    const minorCourses = OFFICIAL_COURSES_2567.filter((c) => c.category === 'minor');
    const coopCourses = OFFICIAL_COURSES_2567.filter((c) => c.category === 'cooperative_education');

    expect(geCourses).toHaveLength(31);
    expect(majorCourses).toHaveLength(25);
    expect(minorCourses).toHaveLength(10);
    expect(coopCourses).toHaveLength(3);

    // Major compulsory courses must total 64 credits
    const majorCredits = majorCourses.reduce((sum, c) => sum + c.credits, 0);
    expect(majorCredits).toBe(64);

    // Minor groups (5 courses each * 3 credits = 15 credits)
    const minor1 = minorCourses.filter((c) => c.electiveGroup === 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล');
    const minor2 = minorCourses.filter((c) => c.electiveGroup === 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์');
    expect(minor1).toHaveLength(5);
    expect(minor2).toHaveLength(5);
    expect(minor1.reduce((sum, c) => sum + c.credits, 0)).toBe(15);
    expect(minor2.reduce((sum, c) => sum + c.credits, 0)).toBe(15);

    // Cooperative Education: 1 + 6 + 6 = 13 credits
    const coopCredits = coopCourses.reduce((sum, c) => sum + c.credits, 0);
    expect(coopCredits).toBe(13);

    // Macro categories check
    expect(dtmCurriculum2567.totalCredits).toBe(124);
    expect(dtmCurriculum2567.categories.generalEducation.minCredits).toBe(26);
    expect(dtmCurriculum2567.categories.majorSpecific.minCredits).toBe(92);
    expect(dtmCurriculum2567.categories.freeElective.minCredits).toBe(6);
  });

  it('preserves macro course items for backward compatibility in dtmCurriculum2567.courses', () => {
    const macroItems = dtmCurriculum2567.courses.filter((c) => c.isMacro);
    expect(macroItems.length).toBeGreaterThanOrEqual(5);

    const macroGen = dtmCurriculum2567.courses.find((c) => c.id === 'dtm-macro-gen');
    expect(macroGen).toBeDefined();
    expect(macroGen?.credits).toBe(26);
  });

  it('validates filter tabs definitions', () => {
    expect(CURRICULUM_FILTER_TABS).toHaveLength(6);
    const allTab = CURRICULUM_FILTER_TABS.find((t) => t.id === 'all');
    expect(allTab?.count).toBe(69);
  });
});
