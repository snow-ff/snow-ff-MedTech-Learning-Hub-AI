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

// Track B1: Learning Document Foundation Models
export type DocumentType = 'pdf' | 'slide' | 'note' | 'paper' | 'text';
export type EvidenceStatus = 'sufficient' | 'insufficient' | 'unreadable' | 'external_research';

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number; // Only present if document has genuine native pages (e.g. PDF)
  hasNativePage?: boolean;
  text: string;
  charCount: number;
  heading?: string;
}

export interface LearningDocument {
  id: string;
  title: string;
  filename?: string;
  fileSize?: number;
  type: DocumentType;
  courseCode?: string;
  courseTitle?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  totalChars: number;
  totalPages?: number;
  hasNativePages?: boolean; // true if document has physical/native pages, false for unpaged notes
  readabilityStatus?: 'readable' | 'unreadable' | 'warning';
  chunks: DocumentChunk[];
  rawSnippet?: string;
}

export interface DocumentGroundingContext {
  documentId: string;
  title: string;
  courseCode?: string;
  evidenceStatus?: EvidenceStatus;
  matchedKeywords?: string[];
  chunks: Array<{
    chunkIndex: number;
    pageNumber?: number | string;
    text: string;
  }>;
}

// Track B1.4: Academic Answer Verification Models
export type VerificationVerdict = 'PASS' | 'FAIL' | 'INSUFFICIENT_EVIDENCE' | 'WARNING';
export type AnswerFidelityStatus = 'aligned' | 'overgeneralized' | 'contradictory' | 'hallucinated' | 'insufficient_evidence';

export interface StageVerificationResult {
  retrieval: {
    passed: boolean;
    relevantChunksCount: number;
    matchedKeywords: string[];
    details: string;
  };
  evidenceFidelity: {
    passed: boolean;
    citedPages: number[];
    unsupportedCitations: string[];
    details: string;
  };
  answerFidelity: {
    passed: boolean;
    status: AnswerFidelityStatus;
    contradictions: string[];
    unsupportedClaims: string[];
    details: string;
  };
  reasoningFidelity: {
    passed: boolean;
    logicalFlaws: string[];
    priorTurnPoisoningDetected: boolean;
    details: string;
  };
}

export interface AcademicVerificationReport {
  isVerified: boolean;
  verdict: VerificationVerdict;
  stages: StageVerificationResult;
  critique: string;
}


