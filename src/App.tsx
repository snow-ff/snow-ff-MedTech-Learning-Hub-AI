import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Search,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Filter,
  LogIn,
  LogOut,
  Shield,
  Trash2,
  FileText,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
  Globe
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { isFirebaseReady, firebaseDatabaseId } from './lib/firebase';
import {
  dtmCurriculum2567,
  OFFICIAL_COURSES_2567,
  CURRICULUM_FILTER_TABS,
  officialHandbookPdfUrl,
  officialSchoolWebUrl,
  curriculumDrivePdfUrl
} from './data/curriculumData';
import { CourseItem, LearningDocument, EvidenceStatus, AcademicVerificationReport } from './models/coreModel';
import { DocumentLibrary } from './components/DocumentLibrary';
import { LearningGuideModal } from './components/LearningGuideModal';
import { hasDtmLearningGuide } from './data/dtmLearningGuides';
import { rankRelevantChunks, retrieveGroundedChunks, decodeHtmlEntities, cleanChunkLocator, filterDisplayedReferences } from './lib/documentChunker';
import { verifyAcademicAnswer } from './lib/academicVerifier';
import { getAllDocuments, seedSampleDocumentsIfEmpty } from './lib/documentStorage';

export interface ReferenceItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  fullText: string;
  doi?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'gemini_grounding' | 'gemini_standard' | 'academic_fallback' | 'document_grounding' | 'external_research';
  groundedDocumentTitle?: string;
  evidenceStatus?: EvidenceStatus;
  verification?: AcademicVerificationReport;
  webGrounding?: {
    webSearchQueries?: string[];
    searchEntryPointHtml?: string;
    linkageStatus: 'verified_linked' | 'partial_linked' | 'unlinked' | 'missing_metadata';
    segments?: Array<{
      text: string;
      startIndex: number;
      endIndex: number;
      citationIndices: number[];
      isGrounded: boolean;
    }>;
    supportedClaimCount?: number;
    unsupportedClaimCount?: number;
  };
  references?: Array<{
    title: string;
    uri: string;
    type?: string;
    linkAccessStatus?: string;
    verificationStatus?: string;
    evidenceLocator?: string;
    contentVersion?: string;
    sourceTier?: string;
    sourceTierLabel?: string;
    domain?: string;
    trustLevel?: string;
    warningNotice?: string;
    isAllowlistedAuthority?: boolean;
    excerpt?: string;
  }>;
}

const mockReferences: ReferenceItem[] = [
  {
    id: 'ref-1',
    title: 'Clinical Laboratory Standards Institute (CLSI) M27-A3: Reference Method for Broth Dilution Antifungal Susceptibility Testing of Yeasts',
    category: 'Microbiology',
    summary: 'มาตรฐานสากลสำหรับการทดสอบความไวของเชื้อรากลุ่ม Yeast ต่อสารต้านเชื้อรา',
    fullText: 'CLSI M27-A3 provides reference methods for determining the susceptibility of yeasts to antifungal agents such as fluconazole, itraconazole, and amphotericin B using broth microdilution techniques.',
    doi: '10.5555/clsi.m27a3'
  },
  {
    id: 'ref-2',
    title: 'International Council for Standardization in Haematology (ICSH) Guidelines for Complete Blood Count',
    category: 'Hematology',
    summary: 'แนวทางระดับสากลในการตรวจวิเคราะห์ความสมบูรณ์ของเม็ดเลือด (CBC) และการรายงานผล',
    fullText: 'ICSH guidelines establish reference procedures for hemoglobinometry, leukocyte differential counting, and platelet enumeration using automated impedance and optical scatter technologies.',
    doi: '10.1111/ijlh.12345'
  },
  {
    id: 'ref-3',
    title: 'Clinical Chemistry: Tietz Textbook of Laboratory Medicine (7th Edition)',
    category: 'Clinical Chemistry',
    summary: 'ตำรามาตรฐานด้านเคมีคลินิกครอบคลุมการวิเคราะห์เอนไซม์ อิเล็กโทรไลต์ และสารบ่งชี้โรค',
    fullText: 'Comprehensive reference on analytical methodologies, quality assurance, reference intervals, and clinical interpretation of biomarkers in plasma, serum, and urine specimens.',
    doi: '10.1016/B978-0-323-53044-6.00012-3'
  },
  {
    id: 'ref-4',
    title: 'AABB Technical Manual (20th Edition): Blood Bank and Transfusion Medicine',
    category: 'Blood Bank',
    summary: 'หลักการตรวจหมู่เลือด ระบบ ABO/Rh, Direct Coombs Test และความปลอดภัยในการให้เลือด',
    fullText: 'The AABB Technical Manual details serological testing, crossmatching protocols, transfusion reactions investigation, and component preparation standards.',
    doi: '10.1002/trf.2021'
  },
  {
    id: 'ref-5',
    title: 'WHO Laboratory Biosafety Manual (4th Edition)',
    category: 'Laboratory Safety',
    summary: 'แนวทางความปลอดภัยทางชีวภาพในห้องปฏิบัติการทางการแพทย์และการจัดการของเสียติดเชื้อ',
    fullText: 'Risk-assessment-based framework for managing biological risks in clinical and research laboratories, covering personal protective equipment, containment, and disinfection.',
    doi: '10.9999/who.biosafety.4e'
  }
];

export const vocabularyList = [
  // Health Informatics & Systems
  { term: 'Electronic Health Record (EHR)', thai: 'ระบบบันทึกข้อมูลสุขภาพผู้ป่วยในรูปแบบดิจิทัลที่เข้าถึงและแลกเปลี่ยนได้ข้ามสถานพยาบาล', category: 'Health Informatics' },
  { term: 'Electronic Medical Record (EMR)', thai: 'เวชระเบียนอิเล็กทรอนิกส์ที่บันทึกประวัติและการรักษาภายในสถานพยาบาลหนึ่งแห่ง', category: 'Health Informatics' },
  { term: 'Hospital Information System (HIS)', thai: 'ระบบสารสนเทศโรงพยาบาลสำหรับจัดการงานเวชระเบียน การตรวจรักษา และการบริหาร', category: 'Health Informatics' },
  { term: 'Clinical Decision Support System (CDSS)', thai: 'ระบบช่วยเตือนและสนับสนุนการตัดสินใจทางคลินิก (เช่น เตือนแพ้ยา ปฏิกิริยาระหว่างยา)', category: 'Health Informatics' },
  { term: 'Telemedicine', thai: 'การให้บริการทางการแพทย์และการปรึกษาโรคทางไกลผ่านระบบโทรคมนาคมดิจิทัล', category: 'Health Informatics' },

  // Standards & Data Classification
  { term: 'HL7 FHIR (Fast Healthcare Interoperability Resources)', thai: 'มาตรฐานสากลสำหรับการแลกเปลี่ยนข้อมูลสุขภาพผ่าน RESTful API ในรูปแบบ JSON/XML', category: 'Medical Standards' },
  { term: 'DICOM (Digital Imaging and Communications in Medicine)', thai: 'มาตรฐานสากลสำหรับโครงสร้างข้อมูลและการรับส่งภาพถ่ายทางการแพทย์ (CT, MRI, X-ray)', category: 'Medical Standards' },
  { term: 'PACS (Picture Archiving and Communication System)', thai: 'ระบบแม่ข่ายและเครือข่ายสำหรับจัดเก็บ สำรอง และกระจายภาพถ่ายทางการแพทย์ในโรงพยาบาล', category: 'Medical Standards' },
  { term: 'ICD-10 / ICD-11', thai: 'ระบบการจัดประเภทและให้รหัสโรคสากลสำหรับการวินิจฉัยและสถิติสุขภาพ', category: 'Medical Standards' },
  { term: 'LOINC (Logical Observation Identifiers Names and Codes)', thai: 'รหัสมาตรฐานสากลสำหรับระบุผลตรวจทางห้องปฏิบัติการและการวัดทางคลินิก', category: 'Medical Standards' },
  { term: 'SNOMED CT', thai: 'ระบบคำศัพท์ทางการแพทย์มาตรฐานสากลที่ครอบคลุมแนวคิดทางคลินิกและกายวิภาคอย่างละเอียด', category: 'Medical Standards' },

  // Medical AI & Data Engineering
  { term: 'Convolutional Neural Network (CNN)', thai: 'โครงข่ายประสาทเทียมแบบคอนโวลูชันที่ใช้ประมวลผล จำแนก และตรวจจับพยาธิสภาพในภาพการแพทย์', category: 'Medical AI & Data' },
  { term: 'Medical Image Segmentation (U-Net)', thai: 'เทคนิคการแบ่งส่วนภาพทางการแพทย์เพื่อระบุขอบเขตของเนื้องอก อวัยวะ หรือเซลล์เม็ดเลือด', category: 'Medical AI & Data' },
  { term: 'Biomedical Signal Processing (ECG/EEG)', thai: 'การประมวลผลสัญญาณชีวการแพทย์ เช่น คลื่นไฟฟ้าหัวใจ หรือคลื่นไฟฟ้าสมอง', category: 'Medical AI & Data' },
  { term: 'Medical Telemetry', thai: 'การวัดและส่งสัญญาณชีพของผู้ป่วยแบบไร้สายไปยังศูนย์ติดตามเฝ้าระวัง', category: 'Medical AI & Data' },

  // Core Biomedical & Lab Terminology (Retained)
  { term: 'Complete Blood Count (CBC)', thai: 'การตรวจวิเคราะห์ความสมบูรณ์ของเม็ดเลือด (Hb, Hct, WBC, Platelet)', category: 'Biomedical & Lab' },
  { term: 'Flow Cytometry', thai: 'เทคนิคการวัดคุณสมบัติทางแสงและกายภาพของเซลล์ในกระแสของเหลว', category: 'Biomedical & Lab' },
  { term: 'Polymerase Chain Reaction (PCR)', thai: 'ปฏิกิริยาลูกโซ่โพลิเมอเรสสำหรับตรวจและเพิ่มปริมาณสารพันธุกรรม', category: 'Biomedical & Lab' },
  { term: 'Spectrophotometry', thai: 'การวัดความเข้มแสงเพื่อวิเคราะห์ความเข้มข้นสารละลายในเคมีคลินิก', category: 'Biomedical & Lab' }
];

export function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('ehr') || lower.includes('emr') || lower.includes('เวชระเบียน')) {
    return 'ระบบเวชระเบียนอิเล็กทรอนิกส์ (EHR / EMR) เป็นแกนหลักของสารสนเทศสุขภาพ โดย EMR บันทึกประวัติการรักษาภายในสถานพยาบาล ส่วน EHR เน้นการเชื่อมโยงข้อมูลสุขภาพข้ามหน่วยบริการตามมาตรฐานความปลอดภัยและความเป็นส่วนตัวของข้อมูลผู้ป่วย (PDPA / HIPAA)';
  }
  if (lower.includes('dicom') || lower.includes('pacs') || lower.includes('ภาพถ่าย')) {
    return 'มาตรฐาน DICOM (Digital Imaging and Communications in Medicine) ใช้จัดเก็บและส่งผ่านข้อมูลภาพถ่ายทางการแพทย์ (CT, MRI, X-ray) พร้อมข้อมูลกำกับภาพ (Metadata) โดยทำงานร่วมกับระบบ PACS (Picture Archiving and Communication System) สำหรับการจัดเก็บและเรียกดูภาพในโรงพยาบาล';
  }
  if (lower.includes('fhir') || lower.includes('hl7') || lower.includes('มาตรฐานข้อมูล')) {
    return 'HL7 FHIR (Fast Healthcare Interoperability Resources) เป็นมาตรฐานการแลกเปลี่ยนข้อมูลสุขภาพยุคใหม่ที่ใช้สถาปัตยกรรม RESTful API และรูปแบบ JSON/XML ช่วยให้แอปพลิเคชันทางการแพทย์และระบบโรงพยาบาลเชื่อมต่อกันได้อย่างสะดวกรวดเร็วและปลอดภัย';
  }
  if (lower.includes('ai') || lower.includes('ปัญญาประดิษฐ์') || lower.includes('cnn') || lower.includes('deep learning')) {
    return 'การประยุกต์ใช้ปัญญาประดิษฐ์ทางการแพทย์ (Medical AI) ครอบคลุมการใช้ Machine Learning และ Deep Learning (เช่น สถาปัตยกรรม CNN หรือ U-Net) ในการจำแนกและแบ่งส่วนภาพถ่ายทางการแพทย์ การตรวจจับความผิดปกติ และระบบช่วยสนับสนุนการตัดสินใจทางคลินิก (CDSS)';
  }
  if (lower.includes('dtm67') || lower.includes('dtm') || lower.includes('หลักสูตร') || lower.includes('วลัยลักษณ์')) {
    return 'หลักสูตร วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (DTM ปรับปรุง 2567) มหาวิทยาลัยวลัยลักษณ์ มีจำนวนหน่วยกิตรวม 124 หน่วยกิต มุ่งเน้นการบูรณาการเทคโนโลยีสารสนเทศ การเขียนโปรแกรม ปัญญาประดิษฐ์ และระบบข้อมูลสุขภาพ เพื่อพัฒนาบริการทางการแพทย์ยุคดิจิทัล';
  }
  if (lower.includes('cbc') || lower.includes('เม็ดเลือด')) {
    return 'การตรวจความสมบูรณ์ของเม็ดเลือด (Complete Blood Count - CBC) ประกอบด้วย Hemoglobin (Hb), Hematocrit (Hct), WBC count, Platelet count และ Differential WBC การแปลผลต้องพิจารณาค่าอ้างอิงตามเพศและอายุ';
  }
  return `ขอบคุณสำหรับคำถามเกี่ยวกับ "${prompt}" MedTech Learning Hub AI ประจำหลักสูตรเทคโนโลยีดิจิทัลทางการแพทย์ (DTM 2567) ม.วลัยลักษณ์ ยินดีให้คำอธิบายแนวคิดด้านสารสนเทศสุขภาพ มาตรฐานข้อมูลการแพทย์ และ AI ทางการแพทย์ หากต้องการเริ่มเรียนรู้รายวิชาเฉพาะ สามารถเลือกวิชาจากแท็บ "หลักสูตร DTM 2567" ได้เลยครับ`;
}

export default function App() {
  const { user, loading: authLoading, error: authError, signInWithGoogle, signOutUser, clearError } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'vocabulary' | 'references' | 'curriculum'>('chat');
  const [activeDocument, setActiveDocument] = useState<LearningDocument | null>(null);
  const [selectedLearningCourse, setSelectedLearningCourse] = useState<CourseItem | null>(null);
  const [searchMode, setSearchMode] = useState<'document' | 'web_search'>('document');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'สวัสดีครับ! ผมคือผู้ช่วยอัจฉริยะของ **MedTech Learning Hub AI v1.2** ประจำหลักสูตรเทคโนโลยีดิจิทัลทางการแพทย์ (Digital Technology in Medicine: DTM 2567) ม.วลัยลักษณ์ พร้อมให้คำอธิบายแนวคิดด้านสารสนเทศสุขภาพ, มาตรฐานข้อมูลการแพทย์ (HL7 FHIR, DICOM), ระบบปัญญาประดิษฐ์ทางการแพทย์, คลังคำศัพท์เฉพาะทาง และแหล่งอ้างอิงวิชาการ คุณสามารถเลือกวิชาจากแท็บ "หลักสูตร DTM 2567" เพื่อเริ่มเรียน หรือพิมพ์คำถามด้านล่างได้เลยครับ',
      timestamp: new Date()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('กำลังเตรียมข้อมูลและวิเคราะห์คำถาม...');

  useEffect(() => {
    if (!isGenerating) {
      setGeneratingStatus('กำลังเตรียมข้อมูลและวิเคราะห์คำถาม...');
      return;
    }
    const t1 = setTimeout(() => setGeneratingStatus('กำลังค้นหาเอกสารและตรวจสอบชิ้นส่วนอ้างอิง...'), 3000);
    const t2 = setTimeout(() => setGeneratingStatus('กำลังประเมินความถูกต้องทางวิชาการและตรวจสอบข้อเท็จจริง...'), 12000);
    const t3 = setTimeout(() => setGeneratingStatus('กำลังสังเคราะห์คำตอบเชิงลึกด้วยโมเดลวิชาการ (AI กำลังประมวลผล)...'), 25000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isGenerating]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeReference, setActiveReference] = useState<ReferenceItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [expandedVerifications, setExpandedVerifications] = useState<Record<string, boolean>>({});

  const toggleVerification = (id: string) => {
    setExpandedVerifications(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Curriculum Tab States (Track A4)
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [curriculumCategory, setCurriculumCategory] = useState('all');
  const [curriculumSubCategory, setCurriculumSubCategory] = useState('all');
  const [curriculumViewMode, setCurriculumViewMode] = useState<'grid' | 'table'>('grid');
  const [activeCourseEvidence, setActiveCourseEvidence] = useState<CourseItem | null>(null);
  const [activeLearningGuideCourse, setActiveLearningGuideCourse] = useState<CourseItem | null>(null);
  const [showMacroOverview, setShowMacroOverview] = useState(true);
  const [onlyNonCredit, setOnlyNonCredit] = useState(false);

  // Filtered courses based on search & category (Track A4)
  const filteredCourses = React.useMemo(() => {
    return OFFICIAL_COURSES_2567.filter((course) => {
      if (onlyNonCredit && !course.isNonCredit) {
        return false;
      }
      if (curriculumSearch.trim()) {
        const q = curriculumSearch.toLowerCase().trim();
        const code = (course.code || '').toLowerCase();
        const th = (course.titleThai || '').toLowerCase();
        const en = (course.titleEnglish || '').toLowerCase();
        const sub = (course.subCategory || '').toLowerCase();
        const hours = (course.hours || '').toLowerCase();
        if (!code.includes(q) && !th.includes(q) && !en.includes(q) && !sub.includes(q) && !hours.includes(q)) {
          return false;
        }
      }
      if (curriculumCategory !== 'all') {
        const tab = CURRICULUM_FILTER_TABS.find((t) => t.id === curriculumCategory);
        if (tab) {
          if (tab.category && course.category !== tab.category) {
            return false;
          }
          if (tab.electiveGroup && course.electiveGroup !== tab.electiveGroup) {
            return false;
          }
        }
      }
      if (curriculumSubCategory !== 'all' && course.subCategory !== curriculumSubCategory) {
        return false;
      }
      return true;
    });
  }, [curriculumSearch, curriculumCategory, curriculumSubCategory, onlyNonCredit]);

  const availableSubCategories = React.useMemo(() => {
    const list = Array.from(
      new Set(
        OFFICIAL_COURSES_2567
          .filter((c) => {
            if (curriculumCategory === 'all') return true;
            const tab = CURRICULUM_FILTER_TABS.find((t) => t.id === curriculumCategory);
            if (!tab) return true;
            if (tab.category && c.category !== tab.category) return false;
            if (tab.electiveGroup && c.electiveGroup !== tab.electiveGroup) return false;
            return true;
          })
          .map((c) => c.subCategory)
          .filter(Boolean) as string[]
      )
    );
    return list;
  }, [curriculumCategory]);

  const totalFilteredCredits = React.useMemo(() => {
    return filteredCourses.reduce((sum, c) => sum + (c.isNonCredit ? 0 : c.credits), 0);
  }, [filteredCourses]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatSessionIdRef = useRef<string>(Date.now().toString());

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    chatSessionIdRef.current = Date.now().toString();
    setIsGenerating(false);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'สวัสดีครับ! ผมคือผู้ช่วยอัจฉริยะของ **MedTech Learning Hub AI v1.2** ประจำหลักสูตรเทคโนโลยีดิจิทัลทางการแพทย์ (Digital Technology in Medicine: DTM 2567) ม.วลัยลักษณ์ พร้อมให้คำอธิบายแนวคิดด้านสารสนเทศสุขภาพ, มาตรฐานข้อมูลการแพทย์ (HL7 FHIR, DICOM), ระบบปัญญาประดิษฐ์ทางการแพทย์, คลังคำศัพท์เฉพาะทาง และแหล่งอ้างอิงวิชาการ คุณสามารถเลือกวิชาจากแท็บ "หลักสูตร DTM 2567" เพื่อเริ่มเรียน หรือพิมพ์คำถามด้านล่างได้เลยครับ',
        timestamp: new Date()
      }
    ]);
  };

  const handleStartCourseLearning = (course: CourseItem) => {
    setSelectedLearningCourse(course);
    setActiveTab('chat');
    const courseCodeStr = course.code ? `${course.code} ` : '';
    const courseTitleTh = course.titleThai || '';
    const courseTitleEn = course.titleEnglish ? ` (${course.titleEnglish})` : '';
    const courseFullLabel = `${courseCodeStr}${courseTitleTh}${courseTitleEn}`.trim();
    setInputQuery(
      `ฉันกำลังเริ่มเรียนรายวิชา ${courseFullLabel} ในหลักสูตร DTM 2567 ช่วยปูพื้นฐานหัวข้อที่เกี่ยวข้องเป็นภาษาไทยสำหรับผู้เริ่มต้น โดยคงศัพท์เทคนิคภาษาอังกฤษที่สำคัญ อธิบายแนวคิดเป็นลำดับ พร้อมยกตัวอย่างด้านเทคโนโลยีดิจิทัลทางการแพทย์ หากไม่มีเอกสารประกอบหรือคำอธิบายรายวิชาฉบับเต็ม ให้ระบุชัดเจนว่าส่วนใดเป็นความรู้ทั่วไป และอย่าอ้างว่าเป็นคำอธิบายรายวิชาอย่างเป็นทางการ`
    );
  };

  const handleClearCourseContext = () => {
    setSelectedLearningCourse(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputQuery.trim() && !isGenerating) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryText = inputQuery.trim();
    if (!queryText || isGenerating) return;

    abortControllerRef.current = new AbortController();
    const currentSessionId = chatSessionIdRef.current;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsGenerating(true);

    try {
      const historyCandidates = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          text: m.content.trim()
        }))
        .filter((m) => m.text.length > 0 && m.text.length <= 4000);

      const candidatePayload = [...historyCandidates, { role: 'user' as const, text: queryText }];
      if (candidatePayload.length === 0 || candidatePayload[candidatePayload.length - 1].role !== 'user') {
        candidatePayload.push({ role: 'user', text: queryText });
      }

      let validSlice = [...candidatePayload];
      while (validSlice.length > 0) {
        const totalChars = validSlice.reduce((acc, m) => acc + m.text.length, 0);
        const countValid = validSlice.length >= 1 && validSlice.length <= 8;
        const startsUser = validSlice[0].role === 'user';
        const endsUser = validSlice[validSlice.length - 1].role === 'user';

        let alternating = true;
        for (let i = 0; i < validSlice.length - 1; i++) {
          if (validSlice[i].role === validSlice[i + 1].role) {
            alternating = false;
            break;
          }
        }

        if (countValid && totalChars <= 15000 && startsUser && endsUser && alternating) {
          break;
        }

        if (validSlice.length > 2) {
          validSlice.splice(0, 2);
        } else {
          validSlice = [{ role: 'user', text: queryText }];
          break;
        }
      }

      // If activeDocument is selected and searchMode is document, send all document chunks
      let documentContextPayload: any = undefined;
      if (searchMode !== 'web_search' && activeDocument && activeDocument.chunks && activeDocument.chunks.length > 0) {
        documentContextPayload = {
          title: activeDocument.title,
          courseCode: activeDocument.courseCode,
          hasNativePages: activeDocument.hasNativePages,
          totalPages: activeDocument.totalPages,
          chunks: activeDocument.chunks.map((c) => ({
            id: c.id,
            documentId: c.documentId,
            chunkIndex: c.chunkIndex,
            pageNumber: c.pageNumber,
            hasNativePage: c.hasNativePage,
            sourceLocator: c.sourceLocator,
            sourceLocatorProvenance: c.sourceLocatorProvenance,
            text: c.text
          }))
        };
      }

      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const clientStartTime = Date.now();
      console.log(`[Req ${requestId}] [Perf Frontend] Sending request to /api/gemini/generate at ${new Date().toISOString()} (searchMode: ${searchMode})`);
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({
          messages: validSlice,
          searchMode,
          documentContext: documentContextPayload,
          courseContext: selectedLearningCourse ? {
            code: selectedLearningCourse.code,
            titleThai: selectedLearningCourse.titleThai,
            titleEnglish: selectedLearningCourse.titleEnglish,
            category: selectedLearningCourse.category
          } : undefined
        }),
        signal: abortControllerRef.current.signal
      });

      if (currentSessionId !== chatSessionIdRef.current) {
        return;
      }

      const clientDuration = Date.now() - clientStartTime;
      console.log(`[Req ${requestId}] [Perf Frontend] Received response in ${clientDuration}ms. Status: ${response.status}`);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (ไม่ใช่ JSON)');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const finalEvidenceStatus = data.evidenceStatus || (documentContextPayload ? 'sufficient' : undefined);

      // Verify academic answer using backend report or client-side evaluation guardrail
      const verificationReport: AcademicVerificationReport | undefined =
        data.verification ||
        (searchMode !== 'web_search' && activeDocument
          ? verifyAcademicAnswer({
              query: queryText,
              candidateAnswer: data.text || '',
              document: {
                title: activeDocument.title,
                hasNativePages: activeDocument.hasNativePages,
                totalPages: activeDocument.totalPages,
                chunks: activeDocument.chunks
              },
              conversationHistory: validSlice as any
            })
          : undefined);

      const aiReply: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.text || 'ไม่พบข้อมูลคำตอบจากระบบ',
        timestamp: new Date(),
        source: data.source || (documentContextPayload ? 'document_grounding' : 'academic_fallback'),
        groundedDocumentTitle: (searchMode !== 'web_search' && activeDocument) ? activeDocument.title : undefined,
        evidenceStatus: finalEvidenceStatus,
        verification: verificationReport,
        webGrounding: data.webGrounding,
        references: Array.isArray(data.references) ? data.references.map((r: any) => ({
          ...r,
          title: r.title ? decodeHtmlEntities(r.title) : r.title,
          excerpt: r.excerpt ? decodeHtmlEntities(r.excerpt) : r.excerpt,
          evidenceLocator: r.evidenceLocator
            ? (r.evidenceLocator === 'ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้'
                ? 'ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้'
                : (cleanChunkLocator(r.evidenceLocator) || decodeHtmlEntities(r.evidenceLocator)))
            : r.evidenceLocator
        })) : undefined
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (currentSessionId !== chatSessionIdRef.current) {
        return;
      }
      const errorReply: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `*(ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'} กรุณาลองใหม่อีกครั้ง)*`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      if (currentSessionId === chatSessionIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const filteredVocab = vocabularyList.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.thai.includes(searchFilter);
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredRefs = mockReferences.filter((ref) => {
    const matchesSearch = ref.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          ref.summary.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'All' || ref.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                MedTech Learning Hub AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                v1.2
              </span>
            </div>
            <p className="text-xs text-slate-400">ศูนย์การเรียนรู้เทคนิคการแพทย์อัจฉริยะ</p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            ผู้ช่วย AI วิชาการ
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>คลังเอกสารการเรียน</span>
            {activeDocument && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="กำลังศึกษาเอกสารอยู่" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'vocabulary'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            คลังศัพท์เทคนิค
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'references'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            แหล่งอ้างอิงสากล
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'curriculum'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            หลักสูตร DTM 2567
          </button>
        </nav>

        {/* Zone 3: Authentication & Status Modal Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium transition-all"
            title="AI System Status & Firebase Info"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>สถานะระบบ</span>
          </button>

          {authLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email}
                </span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate text-white">{user.displayName || 'ผู้ใช้งานระบบ'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="py-2 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">สถานะตัวตน:</span>
                      <span className="text-emerald-400 font-medium">Google Verified</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">UID:</span>
                      <span className="font-mono text-slate-400 truncate max-w-[140px]">{user.uid}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Database ID:</span>
                      <span className="font-mono text-cyan-400">{firebaseDatabaseId}</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        signOutUser();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      ออกจากระบบ (Sign Out)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>
          )}
        </div>
      </header>

      {/* ERROR BANNER IF ANY */}
      {authError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={clearError} className="underline text-red-200 hover:text-white">
            ปิด
          </button>
        </div>
      )}

      {/* MOBILE & TABLET NAV */}
      <div className="flex lg:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur px-2.5 sm:px-4 py-2 gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2 px-3 rounded-lg text-xs font-medium text-center shrink-0 min-h-[40px] flex items-center justify-center transition-all ${
            activeTab === 'chat' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 bg-slate-950 hover:text-slate-200'
          }`}
        >
          AI แชท
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`py-2 px-3 rounded-lg text-xs font-medium text-center shrink-0 min-h-[40px] flex items-center justify-center relative transition-all ${
            activeTab === 'documents' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 bg-slate-950 hover:text-slate-200'
          }`}
        >
          คลังเอกสาร
          {activeDocument && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5 align-middle animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className={`py-2 px-3 rounded-lg text-xs font-medium text-center shrink-0 sm:flex-1 min-h-[40px] flex items-center justify-center transition-all ${
            activeTab === 'vocabulary' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 bg-slate-950 hover:text-slate-200'
          }`}
        >
          คลังศัพท์
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`py-2 px-3 rounded-lg text-xs font-medium text-center shrink-0 sm:flex-1 min-h-[40px] flex items-center justify-center transition-all ${
            activeTab === 'references' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 bg-slate-950 hover:text-slate-200'
          }`}
        >
          อ้างอิง
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`py-2 px-3 rounded-lg text-xs font-medium text-center shrink-0 sm:flex-1 min-h-[40px] flex items-center justify-center transition-all ${
            activeTab === 'curriculum' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 bg-slate-950 hover:text-slate-200'
          }`}
        >
          หลักสูตร
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Chat header banner */}
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-sm">MedTech Academic Assistant</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 hidden sm:block">
                  หลักสูตร DTM 2567 มหาวิทยาลัยวลัยลักษณ์
                </div>
                <button
                  onClick={handleClearChat}
                  title="ล้างประวัติแชท"
                  aria-label="ล้างประวัติแชท"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all border border-slate-700 shadow-sm min-h-[44px] sm:min-h-[38px]"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>ล้างแชท</span>
                </button>
              </div>
            </div>

            {/* Selected Learning Course Status Bar */}
            {selectedLearningCourse && (
              <div className="bg-indigo-950/60 border-b border-indigo-800/50 px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 break-words">
                    <span className="font-semibold text-white">บริบทการเรียนรู้วิชา: </span>
                    <span className="text-indigo-300 font-mono font-bold">{selectedLearningCourse.code}</span>{' '}
                    <span className="text-slate-200 font-medium">{selectedLearningCourse.titleThai}</span>
                    {selectedLearningCourse.titleEnglish && (
                      <span className="ml-1 text-slate-400 italic hidden md:inline">({selectedLearningCourse.titleEnglish})</span>
                    )}
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-900/60 text-[10px] text-indigo-200 font-mono">
                      DTM 2567
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => setActiveLearningGuideCourse(selectedLearningCourse)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-indigo-700/60 min-h-[36px]"
                    title="เปิดดูคู่มือปูพื้นฐานและคำถามทบทวนสำหรับวิชานี้"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                    <span>คู่มือปูพื้นฐาน</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className="px-2 py-1.5 text-indigo-400 hover:text-indigo-300 underline text-xs min-h-[36px] flex items-center"
                  >
                    เปลี่ยนวิชา
                  </button>
                  <button
                    onClick={handleClearCourseContext}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors min-h-[36px] flex items-center"
                    title="ยกเลิกบริบทวิชา (กลับสู่แชททั่วไป)"
                  >
                    ✕ ล้างบริบทวิชา
                  </button>
                </div>
              </div>
            )}

            {/* Active Document Grounding Status Bar */}
            {activeDocument ? (
              <div className="bg-cyan-950/50 border-b border-cyan-800/40 px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 break-words">
                    <span className="font-semibold text-white">โหมดติวอิงเอกสาร: </span>
                    <span className="text-cyan-300 font-medium">{activeDocument.title}</span>
                    {activeDocument.courseCode && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                        {activeDocument.courseCode}
                      </span>
                    )}
                    <span className="ml-2 text-slate-400 text-xs hidden sm:inline">
                      ({activeDocument.chunks.length} Chunks • Strict Anti-Hallucination)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="px-2 py-1.5 text-cyan-400 hover:text-cyan-300 underline text-xs min-h-[36px] flex items-center"
                  >
                    เปลี่ยนเอกสาร
                  </button>
                  <button
                    onClick={() => setActiveDocument(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs min-h-[36px] flex items-center transition-colors"
                    title="ปลดเอกสารออก เพื่อกลับสู่โหมด AI ทั่วไป"
                  >
                    ปลดออก
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>โหมดถามตอบทั่วไป (General AI)</span>
                </span>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                >
                  <span>เลือกเอกสาร/สไลด์สรุปเพื่อติวเจาะลึก</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-[15px] sm:text-base leading-[1.75] ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.webGrounding?.segments && msg.webGrounding.segments.length > 0 ? (
                      <div className="whitespace-pre-wrap medical-text-wrap">
                        {msg.webGrounding.segments.map((seg, sIdx) => (
                          <span key={sIdx}>
                            {seg.text}
                            {seg.citationIndices && seg.citationIndices.length > 0 && (
                              <span className="inline-flex gap-0.5 mx-0.5 align-super text-[10px] font-mono select-none">
                                {seg.citationIndices.map((cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={`#ref-${msg.id}-${cIdx}`}
                                    className="px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-800 hover:text-white border border-cyan-800 transition-colors"
                                    title={`ดูแหล่งอ้างอิงลำดับที่ [${cIdx}]`}
                                  >
                                    [{cIdx}]
                                  </a>
                                ))}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap medical-text-wrap">{msg.content}</div>
                    )}

                    {/* Google Search Grounding: Search Suggestions / Queries */}
                    {msg.webGrounding?.webSearchQueries && msg.webGrounding.webSearchQueries.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                        <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-medium text-slate-300">คำค้นหาที่เกี่ยวข้อง:</span>
                        {msg.webGrounding.webSearchQueries.map((q, qIdx) => (
                          <span key={qIdx} className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-cyan-300">
                            {q}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Web Grounding: Linkage Status Badge */}
                    {msg.webGrounding && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1.5 ${
                          msg.webGrounding.linkageStatus === 'verified_linked'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                            : msg.webGrounding.linkageStatus === 'partial_linked'
                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {msg.webGrounding.linkageStatus === 'verified_linked' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>เชื่อมโยงข้อความกับแหล่งอ้างอิงครบถ้วน ({msg.webGrounding.supportedClaimCount} ส่วน)</span>
                            </>
                          ) : msg.webGrounding.linkageStatus === 'partial_linked' ? (
                            <>
                              <AlertCircle className="w-3 h-3 text-cyan-400" />
                              <span>เชื่อมโยงข้อความบางส่วน ({msg.webGrounding.supportedClaimCount} ส่วนระบุแหล่งที่มา)</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              <span>ไม่มีการยืนยัน claim-to-source linkage ระดับประโยค (แสดงเฉพาะแหล่งอ้างอิงรวม)</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {msg.groundedDocumentTitle && (
                      <div className={`mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-medium ${
                        msg.verification?.verdict === 'FAIL'
                          ? 'text-rose-300'
                          : msg.verification?.verdict === 'WARNING'
                          ? 'text-amber-300'
                          : msg.evidenceStatus === 'insufficient'
                          ? 'text-slate-300'
                          : 'text-cyan-300'
                      }`}>
                        {msg.verification?.verdict === 'FAIL' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : msg.verification?.verdict === 'WARNING' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : msg.evidenceStatus === 'insufficient' ? (
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {msg.verification?.verdict === 'FAIL'
                            ? `ตรวจในเอกสาร: ${msg.groundedDocumentTitle} (พบข้อบกพร่อง ไม่ผ่านการรับรองวิชาการ)`
                            : msg.verification?.verdict === 'WARNING'
                            ? (msg.verification.stages.answerFidelity.unsupportedClaims.length > 0
                                ? `ตรวจในเอกสาร: ${msg.groundedDocumentTitle} (มีข้อควรระวังทางวิชาการ — สรุปเกินหลักฐาน)`
                                : `ตรวจในเอกสาร: ${msg.groundedDocumentTitle} (ข้อจำกัดทางวิชาการ — เอกสารไม่มีเลขหน้าต้นฉบับ)`)
                            : msg.evidenceStatus === 'insufficient'
                            ? `ตรวจในเอกสาร: ${msg.groundedDocumentTitle} (ไม่พบหลักฐานตรงในเอกสาร — ไม่คาดเดาข้อมูล)`
                            : msg.evidenceStatus === 'external_research'
                            ? `สืบค้นจากแหล่งวิชาการภายนอก (External Academic Research)`
                            : `อ้างอิงตรงจากเอกสาร: ${msg.groundedDocumentTitle} (มีหลักฐานรองรับ)`}
                        </span>
                      </div>
                    )}

                    {/* Academic Verification Card & Stage Breakdown (Track B1.4 & B1.5) */}
                    {msg.verification && (
                      <div className={`mt-3 pt-3 border-t rounded-xl p-3 text-xs ${
                        msg.verification.verdict === 'PASS'
                          ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
                          : msg.verification.verdict === 'WARNING'
                          ? 'border-amber-700/80 bg-amber-950/40 text-amber-200'
                          : msg.verification.verdict === 'INSUFFICIENT_EVIDENCE'
                          ? 'border-slate-700 bg-slate-950/60 text-slate-300'
                          : 'border-rose-700/80 bg-rose-950/50 text-rose-200'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold">
                            {msg.verification.verdict === 'PASS' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            {msg.verification.verdict === 'WARNING' && (
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            {msg.verification.verdict === 'INSUFFICIENT_EVIDENCE' && (
                              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                            )}
                            {msg.verification.verdict === 'FAIL' && (
                              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span>
                              {msg.verification.verdict === 'PASS' && 'ผ่านการตรวจสอบวิชาการ (Academic Verification: PASS)'}
                              {msg.verification.verdict === 'WARNING' && (
                                msg.verification.stages.answerFidelity.unsupportedClaims.length > 0
                                  ? 'คำเตือนวิชาการ: มีข้อความสรุปเกินหลักฐาน (Academic Warning)'
                                  : 'คำเตือนวิชาการ: ข้อจำกัดโครงสร้างเอกสาร (Unpaged Document Notice)'
                              )}
                              {msg.verification.verdict === 'INSUFFICIENT_EVIDENCE' && 'ปฏิเสธการตอบตามหลักวิชาการ (Strict Anti-Hallucination)'}
                              {msg.verification.verdict === 'FAIL' && 'ไม่ผ่านการตรวจสอบวิชาการ (Academic Verification: FAIL)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleVerification(msg.id)}
                            className="text-[11px] underline opacity-90 hover:opacity-100 flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                          >
                            <span>{expandedVerifications[msg.id] ? 'ย่อผลตรวจ' : 'ผลตรวจ 4 ขั้นตอน'}</span>
                            {expandedVerifications[msg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Summary / Warnings depending on verdict */}
                        {msg.verification.verdict === 'FAIL' && (
                          <div className="mt-2 text-[11px] bg-rose-950/80 p-2 rounded border border-rose-800 text-rose-200">
                            <p className="font-semibold text-rose-300">⚠️ ข้อบกพร่องที่ตรวจพบ (ห้ามใช้อ้างอิงโดยตรง):</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-200">
                              {msg.verification.stages.evidenceFidelity.unsupportedCitations.map((e, idx) => (
                                <li key={idx}>{decodeHtmlEntities(e)}</li>
                              ))}
                              {msg.verification.stages.answerFidelity.contradictions.map((e, idx) => (
                                <li key={idx}>{e}</li>
                              ))}
                              {msg.verification.stages.answerFidelity.unsupportedClaims.map((e, idx) => (
                                <li key={idx}>{e}</li>
                              ))}
                              {msg.verification.stages.reasoningFidelity.logicalFlaws.map((e, idx) => (
                                <li key={idx}>{e}</li>
                              ))}
                              {!msg.verification.stages.retrieval.passed && (
                                <li>{msg.verification.stages.retrieval.details}</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {msg.verification.verdict === 'WARNING' && msg.verification.stages.answerFidelity.unsupportedClaims.length > 0 && (
                          <div className="mt-2 text-[11px] bg-amber-950/80 p-2 rounded border border-amber-800 text-amber-200">
                            <p className="font-semibold text-amber-300">ข้อความที่ควรตรวจทานเพิ่มเติม:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-200">
                              {msg.verification.stages.answerFidelity.unsupportedClaims.map((e, idx) => (
                                <li key={idx}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.verification.verdict === 'PASS' && (
                          <p className="mt-1 text-[11px] text-emerald-300/90">
                            สืบค้นพบหลักฐาน {msg.verification.stages.retrieval.relevantChunksCount} ชิ้นส่วน และอ้างอิงตรงตามเอกสารต้นฉบับ
                          </p>
                        )}

                        {msg.verification.verdict === 'INSUFFICIENT_EVIDENCE' && (
                          <p className="mt-1 text-[11px] text-slate-300">
                            เอกสารไม่มีหลักฐานตรงกับคำถาม ระบบปฏิเสธการแต่งข้อมูลตามมาตรฐานความสัตย์ซื่อทางวิชาการ
                          </p>
                        )}

                        {/* Expanded 4-Stage Audit Details */}
                        {expandedVerifications[msg.id] && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-2 text-[11px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {/* Stage A */}
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                                <div className="flex items-center justify-between font-semibold">
                                  <span>Stage A: Retrieval</span>
                                  <span className={msg.verification.stages.retrieval.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {msg.verification.stages.retrieval.passed ? '✓ ผ่าน' : '✗ ไม่ผ่าน'}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-300">{msg.verification.stages.retrieval.details}</p>
                              </div>

                              {/* Stage B */}
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                                <div className="flex items-center justify-between font-semibold">
                                  <span>Stage B: Evidence Fidelity</span>
                                  <span className={msg.verification.stages.evidenceFidelity.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {msg.verification.stages.evidenceFidelity.passed ? '✓ ถูกต้อง' : '✗ พบข้อผิดพลาด'}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-300">{msg.verification.stages.evidenceFidelity.details}</p>
                              </div>

                              {/* Stage C */}
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                                <div className="flex items-center justify-between font-semibold">
                                  <span>Stage C: Answer Fidelity</span>
                                  <span className={msg.verification.stages.answerFidelity.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {msg.verification.stages.answerFidelity.passed ? '✓ สอดคล้อง' : '✗ ไม่สอดคล้อง'}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-300">{msg.verification.stages.answerFidelity.details}</p>
                              </div>

                              {/* Stage D */}
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                                <div className="flex items-center justify-between font-semibold">
                                  <span>Stage D: Reasoning Fidelity</span>
                                  <span className={msg.verification.stages.reasoningFidelity.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {msg.verification.stages.reasoningFidelity.passed ? '✓ สมบูรณ์' : '✗ บกพร่อง'}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-300">{msg.verification.stages.reasoningFidelity.details}</p>
                              </div>
                            </div>

                            {/* Guardrail Disclaimer (Requirement 6) */}
                            <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>
                                <strong>ขอบเขตของตัวตรวจ (Deterministic Guardrail):</strong> ระบบตรวจสอบคำสำคัญ, การมีอยู่ของหลักฐาน, เลขหน้า และโครงสร้างเชิงตรรกะ เพื่อป้องกัน Hallucination และ Citation ผิดพลาด มิได้แทนที่การประเมินความถูกต้องทางความหมายระดับผู้เชี่ยวชาญวิชาชีพ
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.source && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-mono border ${
                          msg.source === 'document_grounding'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : msg.source === 'external_research'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : msg.source === 'gemini_grounding'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : msg.source === 'gemini_standard'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}>
                          {msg.source === 'document_grounding'
                            ? '📚 Document Grounded Mode'
                            : msg.source === 'external_research'
                            ? '🌐 External Academic Research'
                            : msg.source === 'gemini_grounding'
                            ? 'Google Search Grounding (Live)'
                            : msg.source === 'gemini_standard'
                            ? 'Gemini AI Standard'
                            : 'Academic Fallback Mode'}
                        </span>
                      </div>
                    )}
                    {msg.references && (
                      (() => {
                        const isDocGrounding = msg.source === 'document_grounding' || msg.references.some(r => (r as any).type === 'document_chunk');
                        const displayedReferences = filterDisplayedReferences(msg.references, isDocGrounding);
                        const unsupportedCount = msg.references.length - displayedReferences.length;
                        return (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                            {displayedReferences.length > 0 && (
                              <>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  แหล่งอ้างอิง / References ({displayedReferences.length})
                                </p>
                                <div className="space-y-1.5">
                                  {displayedReferences.map((ref, idx) => (
                                    <div
                                      key={idx}
                                      id={`ref-${msg.id}-${idx + 1}`}
                                      className="flex items-start gap-2 text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 transition-colors"
                                    >
                                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 shrink-0 mt-0.5" title={`รายการที่ ${idx + 1}`}>
                                        รายการที่ {idx + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        {ref.uri && (ref.uri.startsWith('http://') || ref.uri.startsWith('https://')) ? (
                                          <a
                                            href={ref.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:underline font-medium break-words block flex items-center gap-1.5"
                                          >
                                            <span>{decodeHtmlEntities(ref.title || ref.uri || '')}</span>
                                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                          </a>
                                        ) : (
                                          <span className="text-slate-200 font-semibold block">{decodeHtmlEntities(ref.title || '')}</span>
                                        )}

                                        {ref.excerpt && (
                                          <p className="text-xs sm:text-[13px] text-slate-200 italic mt-1.5 bg-slate-900/90 p-2 sm:p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                                            "{decodeHtmlEntities(ref.excerpt)}"
                                          </p>
                                        )}

                                        {((ref as any).type === 'document_chunk' || (ref as any).evidenceLocator) ? (
                                          <div className="text-xs text-slate-300 font-mono mt-1.5 flex items-center gap-2 flex-wrap">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              Locator: {decodeHtmlEntities((ref as any).evidenceLocator || 'ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้')}
                                            </span>
                                            {(ref as any).verificationStatus === 'unsupported_citation' ? (
                                              <span
                                                className="text-rose-400 font-medium"
                                                title="ชิ้นส่วนนี้ไม่ตรงกับประเด็นที่สอบถาม (Unsupported Citation)"
                                              >
                                                • ชิ้นส่วนอ้างอิง: ไม่ตรงกับประเด็นคำถาม (Unsupported)
                                              </span>
                                            ) : ((ref as any).verificationStatus === 'unverified' || !(ref as any).evidenceLocator || (ref as any).evidenceLocator === 'ไม่สามารถยืนยันหมายเลขแหล่งอ้างอิงได้') ? (
                                              <span
                                                className="text-amber-400 font-medium"
                                                title="พบเนื้อหาที่เกี่ยวข้องแต่ไม่สามารถยืนยันเลขหน้าหรือหัวข้ออ้างอิงที่แน่นอนได้ (Unverified Locator)"
                                              >
                                                • ชิ้นส่วนอ้างอิง: ไม่สามารถยืนยันตำแหน่งได้ (Unverified Locator)
                                              </span>
                                            ) : (
                                              <span
                                                className="text-emerald-400 font-medium"
                                                title="ยืนยันความสอดคล้องระดับชิ้นส่วนเอกสาร (Chunk-Level Grounded) โดยไม่ได้ครอบคลุมข้อความภายนอกบริบทที่อ้างอิง"
                                              >
                                                • ชิ้นส่วนอ้างอิง: พบเนื้อหาตรงกับเอกสาร (Chunk-Level Grounded)
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-xs mt-1.5 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {ref.sourceTier === 'official_authority' ? (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-sans font-medium text-[11px]">
                                                  🏛️ องค์กรมาตรฐานทางการ
                                                </span>
                                              ) : ref.sourceTier === 'academic_database' ? (
                                                <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-sans font-medium text-[11px]">
                                                  📄 ฐานข้อมูลวิชาการ/วิจัย
                                                </span>
                                              ) : ref.sourceTier === 'university' ? (
                                                <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-sans font-medium text-[11px]">
                                                  🎓 มหาวิทยาลัย / สถาบันการศึกษา
                                                </span>
                                              ) : ref.sourceTier === 'commercial_risk' ? (
                                                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-sans font-medium text-[11px]">
                                                  ⚠️ แหล่งพาณิชย์/ความเสี่ยงสูง
                                                </span>
                                              ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-sans font-medium text-[11px]">
                                                  🌐 เว็บไซต์ทั่วไป
                                                </span>
                                              )}

                                              {ref.domain && (
                                                <span className="text-slate-400 font-mono text-[11px]">
                                                  ({ref.domain})
                                                </span>
                                              )}

                                              <span className="text-slate-500 font-mono text-[10px]">
                                                • แหล่งภายนอก Google Search
                                              </span>
                                            </div>

                                            {ref.warningNotice && (
                                              <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-1.5 rounded border border-amber-900/50 mt-1 font-sans">
                                                {ref.warningNotice}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {unsupportedCount > 0 && (
                              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 flex items-center gap-1.5 mt-2">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                <span>ระบบตรวจพบชิ้นส่วนเอกสารที่ไม่สนับสนุนคำถามหรือยังไม่ผ่านการยืนยัน ({unsupportedCount} ชิ้นส่วน) และได้ตัดออกจากการแสดงผลเพื่อความถูกต้องทางวิชาการ (คำตอบครอบคลุมเฉพาะประเด็นที่มีหลักฐานยืนยันในระดับชิ้นส่วนเอกสาร)</span>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                    <div
                      className={`text-[10px] mt-2 ${
                        msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                    <span>{generatingStatus}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Responsive Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5">
              {/* Mode & Action Control Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI Search Mode Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setSearchMode(prev => prev === 'document' ? 'web_search' : 'document')}
                    className={`px-3.5 py-2 sm:py-1.5 sm:px-3 rounded-xl font-medium flex items-center gap-1.5 transition-all min-h-[44px] sm:min-h-[38px] border ${
                      searchMode === 'document'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/60 shadow-sm'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 hover:bg-cyan-900/60 shadow-sm'
                    }`}
                    title={
                      searchMode === 'document'
                        ? 'คลิกเพื่อสลับเป็นโหมดค้นหาเว็บด้วย AI (Google Search Grounding)'
                        : 'คลิกเพื่อสลับเป็นโหมดติวอิงเอกสาร (Document Grounding)'
                    }
                    aria-label="สลับโหมดการตอบของ AI"
                  >
                    {searchMode === 'document' ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold">โหมดติวอิงเอกสาร</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-mono hidden sm:inline">
                          Anti-Hallucination
                        </span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-semibold">ค้นหาเว็บ AI</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-mono hidden sm:inline">
                          Google Search Grounding
                        </span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    {searchMode === 'document'
                      ? (activeDocument ? `(อิงจาก: ${activeDocument.title})` : '(เลือกเอกสารในคลังเพื่อตรวจสอบหลักฐาน)')
                      : '(สืบค้นข้อมูลวิชาการสดภายนอกด้วย Google Search Grounding)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="ล้างประวัติการสนทนา"
                    aria-label="ล้างประวัติการสนทนา"
                    className="px-3 py-2 sm:py-1.5 sm:px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-colors min-h-[44px] sm:min-h-[38px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">ล้างแชท</span>
                  </button>
                </div>
              </div>

              {/* Multi-line Textarea and Action Button Row */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      searchMode === 'document'
                        ? activeDocument
                          ? `ถามคำถามจาก "${activeDocument.title}" (กด Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)...`
                          : "ถามคำถามวิชาการ หรือเลือกเอกสารเพื่อเริ่มโหมดติวอิงเอกสาร..."
                        : "ถามคำถามหรือสืบค้นข้อมูลวิชาการด้วย Google Search Grounding..."
                    }
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none min-h-[56px] max-h-[160px] leading-relaxed"
                    aria-label="ช่องพิมพ์ข้อความถามคำถามวิชาการ"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isGenerating}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0 min-h-[44px]"
                  aria-label="ส่งคำถาม"
                >
                  <span>ส่งคำถาม</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentLibrary
            onSelectForChat={(doc) => {
              setActiveDocument(doc);
              setSearchMode('document');
              setActiveTab('chat');
            }}
            activeChatDocumentId={activeDocument?.id}
          />
        )}

        {activeTab === 'vocabulary' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ หรือคำแปลไทย..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Health Informatics', 'Medical Standards', 'Medical AI & Data', 'Biomedical & Lab'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVocab.map((vocab, index) => (
                <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-cyan-400">{vocab.term}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                      {vocab.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{vocab.thai}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อคู่มือ มาตรฐาน หรือ DOI..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                แสดงผล {filteredRefs.length} รายการมาตรฐานสากล
              </div>
            </div>

            <div className="space-y-4">
              {filteredRefs.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => setActiveReference(ref)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {ref.title}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 shrink-0 font-mono">
                      {ref.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{ref.summary}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono">DOI: {ref.doi}</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                      ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. CURRICULUM HEADER BANNER */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      หลักสูตรปรับปรุง พ.ศ. 2567
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ตรวจสอบหลักฐานแล้ว 69 รายวิชา (Verified 100%)</span>
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      มหาวิทยาลัยวลัยลักษณ์
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {dtmCurriculum2567.programNameThai}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {dtmCurriculum2567.programNameEnglish} (B.Sc. DTM) • สำนักวิชาสารสนเทศศาสตร์
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">หน่วยกิตรวม</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-0.5">{dtmCurriculum2567.totalCredits} นก.</p>
                  </div>
                  <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">ทะเบียนรายวิชา</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">{OFFICIAL_COURSES_2567.length} วิชา</p>
                  </div>
                </div>
              </div>

              {/* 2. COLLAPSIBLE MACRO STRUCTURE OVERVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowMacroOverview(!showMacroOverview)}
                    className="text-xs font-semibold text-slate-300 hover:text-cyan-400 flex items-center gap-2 transition-colors py-1"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>สรุปโครงสร้างหน่วยกิตภาพรวมหลักสูตร (Macro Structure)</span>
                    {showMacroOverview ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  <span className="text-xs text-slate-500 font-mono">มคอ.2 หน้า 4-8</span>
                </div>

                {showMacroOverview && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-slate-200">{dtmCurriculum2567.categories.generalEducation.categoryName}</h3>
                          <span className="text-cyan-400 font-mono font-bold text-sm">{dtmCurriculum2567.categories.generalEducation.minCredits} นก.</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{dtmCurriculum2567.categories.generalEducation.description}</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-slate-200">{dtmCurriculum2567.categories.majorSpecific.categoryName}</h3>
                          <span className="text-cyan-400 font-mono font-bold text-sm">{dtmCurriculum2567.categories.majorSpecific.minCredits} นก.</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          ประกอบด้วย วิชาเฉพาะด้าน (&ge;{dtmCurriculum2567.categories.majorCourses.minCredits} นก.), วิชาโท (&ge;{dtmCurriculum2567.categories.minorCourses.minCredits} นก.), และสหกิจศึกษา ({dtmCurriculum2567.categories.cooperativeEducation.minCredits} นก.)
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-slate-200">{dtmCurriculum2567.categories.freeElective.categoryName}</h3>
                          <span className="text-cyan-400 font-mono font-bold text-sm">{dtmCurriculum2567.categories.freeElective.minCredits} นก.</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{dtmCurriculum2567.categories.freeElective.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span>กลุ่มวิชาโทที่เปิดสอน (Minors - เลือกเรียน 15 นก.)</span>
                        </h4>
                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                          {dtmCurriculum2567.minorsAvailable.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <Info className="w-4 h-4 text-cyan-400" />
                          <span>หมวดวิชาสหกิจศึกษา (Cooperative Education - 13 นก.)</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          เตรียมสหกิจศึกษา 1 หน่วยกิต และสหกิจศึกษา 1 & 2 รวม 12 หน่วยกิต ปฏิบัติงานจริงในสถานประกอบการ โรงพยาบาล หรือศูนย์การแพทย์ดิจิทัลไม่น้อยกว่า 8 เดือน
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-2xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-emerald-200/90">
                        <p className="font-semibold text-emerald-300">สถานะการตรวจสอบหลักฐาน (Verification Status): ครบถ้วน 100% (Verified)</p>
                        <p>
                          - ข้อมูลรายวิชาทั้ง 69 รายวิชาได้รับการตรวจสอบความสอดคล้องระดับอักขระเทียบเคียงเอกสารหลักสูตรทางการ มคอ.2 (เล่มปรับปรุง พ.ศ. 2567 มหาวิทยาลัยวลัยลักษณ์) หน้า 4-8 ครบทุกวิชา
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. CURRICULUM SEARCH & INVENTORY CONTROLS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                    placeholder="ค้นหารหัสวิชา (เช่น DTM67-111, GEN67-121) หรือชื่อวิชาภาษาไทย / ภาษาอังกฤษ..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {curriculumSearch && (
                    <button
                      onClick={() => setCurriculumSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => setCurriculumViewMode('grid')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      curriculumViewMode === 'grid'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="แสดงแบบการ์ด (Grid)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>การ์ด</span>
                  </button>
                  <button
                    onClick={() => setCurriculumViewMode('table')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      curriculumViewMode === 'table'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="แสดงแบบตาราง (Table)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>ตาราง</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span>หมวดหมู่วิชาหลัก (Major Categories)</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {CURRICULUM_FILTER_TABS.map((tab) => {
                    const isActive = curriculumCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurriculumCategory(tab.id);
                          setCurriculumSubCategory('all');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                          isActive
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm shadow-cyan-900/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span>{tab.nameThai}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono text-slate-300">
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Category Filter and Non-Credit Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                {availableSubCategories.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-400 font-medium">กลุ่มย่อย:</span>
                    <button
                      onClick={() => setCurriculumSubCategory('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        curriculumSubCategory === 'all'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    {availableSubCategories.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurriculumSubCategory(sub)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          curriculumSubCategory === sub
                            ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-800 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={onlyNonCredit}
                    onChange={(e) => setOnlyNonCredit(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-0 bg-slate-950 cursor-pointer"
                  />
                  <span>เฉพาะวิชาปรับพื้นฐาน (Non-credit *)</span>
                </label>
              </div>

              {/* Results Count Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span>
                    แสดงผล <span className="text-cyan-400 font-bold font-mono">{filteredCourses.length}</span> จากทั้งหมด{' '}
                    <span className="text-slate-200 font-bold font-mono">{OFFICIAL_COURSES_2567.length}</span> รายวิชา
                  </span>
                  <span>•</span>
                  <span>
                    รวม <span className="text-emerald-400 font-bold font-mono">{totalFilteredCredits}</span> หน่วยกิตสะสม
                  </span>
                </div>

                {(curriculumSearch || curriculumCategory !== 'all' || curriculumSubCategory !== 'all' || onlyNonCredit) && (
                  <button
                    onClick={() => {
                      setCurriculumSearch('');
                      setCurriculumCategory('all');
                      setCurriculumSubCategory('all');
                      setOnlyNonCredit(false);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1 transition-colors"
                  >
                    ล้างการค้นหาและตัวกรองทั้งหมด
                  </button>
                )}
              </div>

              {/* 4. COURSE INVENTORY LIST / GRID VIEW */}
              {filteredCourses.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    ลองตรวจสอบรหัสวิชา (เช่น DTM67-, GEN67-, INF67-, CHI67-, CSP67-) หรือคำค้นหาชื่อวิชาภาษาไทย/อังกฤษอีกครั้ง
                  </p>
                  <button
                    onClick={() => {
                      setCurriculumSearch('');
                      setCurriculumCategory('all');
                      setCurriculumSubCategory('all');
                      setOnlyNonCredit(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-medium transition-colors"
                  >
                    ล้างตัวกรองเพื่อดูทุกรายวิชา
                  </button>
                </div>
              ) : curriculumViewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Course Code and Credits Header */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold tracking-wide">
                            {course.code}
                          </span>
                          <div className="text-right">
                            {course.isNonCredit ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                                ปรับพื้นฐาน {course.hours}
                              </span>
                            ) : (
                              <span className="text-xs font-mono font-bold text-slate-200 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                                {course.credits} นก. <span className="text-slate-400 font-normal">({course.hours})</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Course Titles */}
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                            {course.titleThai}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">
                            {course.titleEnglish}
                          </p>
                        </div>

                        {/* Subcategory Tag */}
                        <div>
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 inline-block">
                            {course.subCategory}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Verified Badge, Evidence Button & Start Learning Button */}
                      <div className="pt-4 mt-3 border-t border-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">มคอ.2 หน้า {course.evidence.pageNumber || '4-8'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => setActiveCourseEvidence(course)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-all border border-slate-800"
                            title="ดูหลักฐาน มคอ.2"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>หลักฐาน</span>
                          </button>
                          <button
                            onClick={() => setActiveLearningGuideCourse(course)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all border ${
                              hasDtmLearningGuide(course.code)
                                ? 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                            }`}
                            title={hasDtmLearningGuide(course.code) ? 'เปิดคู่มือปูพื้นฐานการเรียนรู้วิชานี้' : 'ดูสถานะคู่มือรายวิชา'}
                          >
                            <BookOpen className="w-3 h-3 text-indigo-300" />
                            <span>คู่มือ</span>
                          </button>
                          <button
                            onClick={() => handleStartCourseLearning(course)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
                            title="เริ่มเรียนรู้วิชานี้กับผู้ช่วย AI"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>เริ่มเรียน</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* TABLE VIEW */
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 pl-4">รหัสวิชา</th>
                        <th className="p-3.5">ชื่อวิชา (ภาษาไทย / อังกฤษ)</th>
                        <th className="p-3.5">หน่วยกิต (ชม.)</th>
                        <th className="p-3.5">กลุ่มวิชา</th>
                        <th className="p-3.5">หลักฐาน มคอ.2</th>
                        <th className="p-3.5 pr-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 pl-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                            {course.code}
                          </td>
                          <td className="p-3.5 min-w-[240px]">
                            <p className="font-semibold text-white">{course.titleThai}</p>
                            <p className="text-slate-400 italic text-[11px] mt-0.5">{course.titleEnglish}</p>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-mono">
                            {course.isNonCredit ? (
                              <span className="text-amber-400 font-medium">2* ({course.hours})</span>
                            ) : (
                              <span>{course.credits} นก. ({course.hours})</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                              {course.subCategory}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>หน้า {course.evidence.pageNumber}</span>
                            </span>
                          </td>
                          <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => setActiveCourseEvidence(course)}
                                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-colors inline-flex items-center gap-1"
                                title="ตรวจหลักฐาน มคอ.2"
                              >
                                <FileText className="w-3 h-3" />
                                <span>หลักฐาน</span>
                              </button>
                              <button
                                onClick={() => setActiveLearningGuideCourse(course)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 border ${
                                  hasDtmLearningGuide(course.code)
                                    ? 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                                }`}
                                title={hasDtmLearningGuide(course.code) ? 'เปิดคู่มือปูพื้นฐานการเรียนรู้วิชานี้' : 'ดูสถานะคู่มือรายวิชา'}
                              >
                                <BookOpen className="w-3 h-3 text-indigo-300" />
                                <span>คู่มือ</span>
                              </button>
                              <button
                                onClick={() => handleStartCourseLearning(course)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-sm shadow-cyan-600/30"
                                title="เริ่มเรียนรู้วิชานี้กับผู้ช่วย AI"
                              >
                                <GraduationCap className="w-3 h-3" />
                                <span>เริ่มเรียน</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. OFFICIAL SOURCES BAR */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400">แหล่งข้อมูลเอกสารหลักสูตรทางการ มหาวิทยาลัยวลัยลักษณ์:</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={officialHandbookPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เล่มหลักสูตรทางการ มคอ.2 (PDF CES)</span>
                  </a>
                  <a
                    href={officialSchoolWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-2 transition-all border border-slate-700"
                  >
                    <span>เว็บไซต์สำนักวิชาสารสนเทศศาสตร์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={curriculumDrivePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all border border-slate-700"
                  >
                    <span>เอกสาร Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REFERENCE DETAIL MODAL */}
      {activeReference && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {activeReference.category}
                </span>
                <h2 className="text-lg font-bold text-white mt-2">{activeReference.title}</h2>
              </div>
              <button
                onClick={() => setActiveReference(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">บทสรุปผู้บริหาร / Summary</p>
                <p className="text-sm text-slate-200">{activeReference.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">เนื้อหาเชิงวิชาการ / Full Content</p>
                <p className="text-sm text-slate-300 leading-relaxed">{activeReference.fullText}</p>
              </div>
              {activeReference.doi && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">DOI: {activeReference.doi}</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> มาตรฐานสากลรับรอง
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveReference(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* COURSE EVIDENCE DETAIL MODAL (Track A4) */}
      {activeCourseEvidence && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                    {activeCourseEvidence.code}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>หลักฐานยืนยันแล้ว (Verified 100%)</span>
                  </span>
                  {activeCourseEvidence.isNonCredit && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                      วิชาปรับพื้นฐาน (ไม่นับหน่วยกิตสะสม)
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {activeCourseEvidence.titleThai}
                </h2>
                <p className="text-sm text-slate-400 italic mt-0.5">
                  {activeCourseEvidence.titleEnglish}
                </p>
              </div>
              <button
                onClick={() => setActiveCourseEvidence(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Course Attribute Details Grid */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h3 className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                ข้อมูลโครงสร้างรายวิชา (Course Specifications)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-slate-500 mb-0.5">รหัสวิชา (Code):</p>
                  <p className="text-cyan-300 font-mono font-bold text-sm">{activeCourseEvidence.code}</p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-slate-500 mb-0.5">หน่วยกิตและชั่วโมงเรียน (Credits & Hours):</p>
                  <p className="text-slate-200 font-mono font-bold text-sm">
                    {activeCourseEvidence.credits} หน่วยกิต • {activeCourseEvidence.hours}
                  </p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-slate-500 mb-0.5">หมวดหมู่หลัก (Category):</p>
                  <p className="text-slate-200 font-medium">
                    {activeCourseEvidence.category === 'general_education' && 'หมวดวิชาศึกษาทั่วไป (General Education)'}
                    {activeCourseEvidence.category === 'major_specific' && 'หมวดวิชาเฉพาะ - กลุ่มวิชาเอก (Major Specific)'}
                    {activeCourseEvidence.category === 'minor' && 'หมวดวิชาเฉพาะ - กลุ่มวิชาโท (Minor Courses)'}
                    {activeCourseEvidence.category === 'cooperative_education' && 'หมวดวิชาสหกิจศึกษา (Cooperative Education)'}
                    {activeCourseEvidence.category === 'free_elective' && 'หมวดวิชาเลือกเสรี (Free Elective)'}
                  </p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-slate-500 mb-0.5">กลุ่มวิชาย่อย (Sub-Category):</p>
                  <p className="text-slate-200 font-medium">{activeCourseEvidence.subCategory}</p>
                </div>
              </div>
              {activeCourseEvidence.electiveGroup && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-slate-500 mb-0.5">กลุ่มวิชาเลือก / วิชาโท (Elective / Minor Track):</p>
                  <p className="text-cyan-300 font-medium">{activeCourseEvidence.electiveGroup}</p>
                </div>
              )}
            </div>

            {/* Evidence Ledger Verification Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/50 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>การรับรองหลักฐานปฐมภูมิ (Primary Source Evidence Verification)</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="text-slate-500">เอกสารหลักสูตรทางการ: </span>
                  <span className="text-slate-200">{activeCourseEvidence.evidence.sourceTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">ตำแหน่งในเอกสาร: </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-800">
                    {activeCourseEvidence.evidence.pdfPage || `หน้า ${activeCourseEvidence.evidence.pageNumber}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">สถานะความสอดคล้อง: </span>
                  <span className="text-emerald-400 font-medium">
                    ตรงกับเล่มหลักสูตร มคอ.2 พ.ศ. 2567 มหาวิทยาลัยวลัยลักษณ์ระดับอักขระ (Exact Match)
                  </span>
                </div>
                {activeCourseEvidence.note && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-200 text-xs">
                    <span className="font-semibold text-amber-300">หมายเหตุทางเอกสาร: </span>
                    {activeCourseEvidence.note}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <a
                  href={activeCourseEvidence.evidence.sourceUrl || officialHandbookPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดดูหลักฐานในคู่มือ PDF ทางการ</span>
                </a>
                <button
                  onClick={() => {
                    const c = activeCourseEvidence;
                    setActiveCourseEvidence(null);
                    setActiveLearningGuideCourse(c);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  title="เปิดดูคู่มือปูพื้นฐานสำหรับวิชานี้"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                  <span>เปิดคู่มือปูพื้นฐาน</span>
                </button>
              </div>
              <button
                onClick={() => setActiveCourseEvidence(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM STATUS & FIREBASE MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">สถานะระบบ & Firebase Integration</h2>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">โปรเจกต์ (Project ID):</span>
                  <span className="font-mono text-cyan-400">fresh-unfolding-dt3g1</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">ภูมิภาค (Region):</span>
                  <span className="font-mono text-slate-200">asia-southeast1 (Singapore)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Database ID:</span>
                  <span className="font-mono text-cyan-400">{firebaseDatabaseId}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">ระบบยืนยันตัวตน (Auth):</span>
                  <span className="text-emerald-400 font-medium">Google Sign-In (Client-side)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">สถานะ Firebase SDK:</span>
                  <span className="text-emerald-400 font-medium">เชื่อมต่อสำเร็จ (Initialized)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">นโยบายค่าใช้จ่าย:</span>
                  <span className="text-cyan-300 font-medium">Free-only (ไม่อัปเกรด Blaze)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-all shadow-lg shadow-cyan-600/20"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DTM LEARNING GUIDE MODAL (MVP) */}
      {activeLearningGuideCourse && (
        <LearningGuideModal
          key={activeLearningGuideCourse.code}
          course={activeLearningGuideCourse}
          isOpen={Boolean(activeLearningGuideCourse)}
          onClose={() => setActiveLearningGuideCourse(null)}
          onAskInChat={(prompt) => {
            setSelectedLearningCourse(activeLearningGuideCourse);
            setInputQuery(prompt);
            setActiveTab('chat');
          }}
          onSelectOtherCourse={(courseCode) => {
            const found = OFFICIAL_COURSES_2567.find((c) => c.code === courseCode);
            if (found) {
              setActiveLearningGuideCourse(found);
            }
          }}
        />
      )}
    </div>
  );
}
