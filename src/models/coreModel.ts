// Core Domain Models for MedTech Learning Hub AI v1.2
// Decoupled architecture supporting DTM Curriculum, Student Records, Evidentiary Verification, and Knowledge/Glossary

export interface CurriculumVersion {
  id: string;
  programCode: string;
  programNameTh: string;
  programNameEn: string;
  university: string;
  facultyOrSchool: string;
  curriculumYear: number; // e.g. 2567
  totalCredits: number;
  minorTrackCreditRequirement: number; // e.g. 15 credits
  status: 'active' | 'archived' | 'draft';
}

export interface CurriculumCourse {
  courseCode: string; // e.g. "DTM67-101"
  courseNameTh: string;
  courseNameEn: string;
  credits: number;
  category: 'general_education' | 'core' | 'major_required' | 'major_elective' | 'minor' | 'free_elective';
  minorTrack?: string;
  yearLevelSuggestion?: number; // 1, 2, 3, 4
  prerequisites?: string[];
  isCatalogueCandidate?: boolean; // For year-4 courses awaiting official semester schedule
}

export interface StudentCourseRecord {
  recordId: string;
  studentId: string;
  courseCode: string;
  academicYearEnrolled?: number; // 2567, 2568, 2569
  semesterEnrolled?: 1 | 2 | 3;
  grade?: string; // "A", "B+", etc.
  enrollmentStatus: 'completed' | 'enrolled' | 'planned' | 'unconfirmed';
  dataSource: 'student_transcript' | 'self_reported' | 'unconfirmed';
}

export interface AssessmentRequirement {
  requirementId: string;
  courseCode: string;
  assessmentType: 'written_exam' | 'ospe' | 'laboratory_practical' | 'project' | 'internship';
  weightPercentage: number;
  passingScore: number;
}

export interface LearningOutcome {
  id: string;
  code: string; // e.g. "PLO-1", "CLO-1.1"
  descriptionTh: string;
  descriptionEn: string;
}

export interface CurriculumAlignment {
  alignmentId: string;
  sourceCode: string; // e.g. user input code
  officialCourseCode?: string;
  matchedTitleTh?: string;
  academicYearWindow: string; // "2567-2569"
  alignmentStatus: 'aligned' | 'needs_review' | 'unmapped';
  reviewReason?: string;
  isMinorCandidate?: boolean;
  semesterPlacementStatus: 'confirmed' | 'unconfirmed';
  suggestedSemester?: string;
}

export interface Subject {
  id: string;
  nameTh: string;
  nameEn: string;
  code: string;
  descriptionTh: string;
  isSupplementary?: boolean; // e.g. Hematology is supplementary to DTM
  iconName: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  titleTh: string;
  titleEn: string;
  level: 'basic' | 'intermediate' | 'advanced';
  descriptionTh: string;
}

export interface LessonBlock {
  id: string;
  blockType: 'concept' | 'clinical' | 'procedure' | 'warning' | 'quality_control';
  titleTh?: string;
  contentTh: string;
  contentEn?: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  titleTh: string;
  titleEn: string;
  level: 'basic' | 'intermediate' | 'advanced';
  summaryTh: string;
  blocks: LessonBlock[];
  keyEnglishTerms: string[];
  suggestedPrompt: string;
  referenceIds: string[];
}

export interface GlossaryTerm {
  id: string;
  subjectId: string;
  termEn: string;
  termTh: string;
  phoneticTh?: string;
  definitionTh: string;
  clinicalContext: string;
  originalSourceUrl?: string;
  suggestedPrompt: string;
  referenceIds?: string[];
}

export interface TopicGlossaryLink {
  topicId: string;
  termId: string;
}

// Evidentiary Verification Entities (Strictly separating URL availability from verification)
export interface Claim {
  claimId: string;
  claimText: string;
  subjectArea: string;
  sourceScope: string;
  contentVersion: string;
}

export interface ClaimUsage {
  usageId: string;
  claimId: string;
  usedInType: 'lesson' | 'fallback' | 'glossary';
  usedInId: string;
}

export interface Reference {
  referenceId: string;
  title: string;
  uri?: string;
  sourceType: 'clsi' | 'guideline' | 'pubmed' | 'textbook' | 'standard' | 'web';
  verificationStatus: 'verified' | 'unverified' | 'needs_review';
  reviewer?: string; // Authorized reviewer name/ID
  reviewDate?: string; // ISO date of audit
  evidenceLocator?: string; // e.g. "Section 4.2, p. 18" or "PMID: 25425098"
  contentVersion?: string; // e.g. "1.2"
}

export interface EvidenceLink {
  id: string;
  claimId: string;
  referenceId: string;
  supportStatus: 'supported' | 'refuted' | 'partial' | 'unverified';
  evidenceExcerpt?: string;
}

export interface ChatContext {
  contextId: string;
  activeTopicId?: string;
  activeSubjectId?: string;
  historyMode: 'multi_turn' | 'single_turn';
}
