export type VerificationStatus = 'verified' | 'unconfirmed' | 'needs_review';

export interface CurriculumEvidence {
  sourceTitle: string;
  sourceUrl: string;
  pageNumber?: number;
  pdfPage?: string;
  note?: string;
  status: VerificationStatus;
}

export interface CourseItem {
  id: string;
  code?: string;
  titleThai?: string;
  titleEnglish?: string;
  credits: number;
  hours?: string;
  lectureHours?: number;
  labHours?: number;
  selfHours?: number;
  isNonCredit?: boolean;
  category: 'general_education' | 'major_specific' | 'minor' | 'cooperative_education' | 'free_elective';
  subCategory?: string;
  electiveGroup?: string;
  year?: number;
  semester?: number;
  prerequisites?: string[];
  isMacro?: boolean;
  verificationStatus: VerificationStatus;
  evidence: CurriculumEvidence;
  note?: string;
}

export interface CurriculumCategory {
  categoryName: string;
  minCredits: number;
  description: string;
}

export interface OfficialCurriculum {
  programNameThai: string;
  programNameEnglish: string;
  academicYear: number;
  totalCredits: number;
  categories: {
    generalEducation: CurriculumCategory;
    majorSpecific: CurriculumCategory;
    majorCourses: CurriculumCategory;
    minorCourses: CurriculumCategory;
    cooperativeEducation: CurriculumCategory;
    freeElective: CurriculumCategory;
  };
  minorsAvailable: string[];
  evidence: CurriculumEvidence;
  courses: CourseItem[];
}
