import { OfficialCurriculum, CourseItem } from '../models/coreModel';

export const officialHandbookPdfUrl = 'https://ces.wu.ac.th/registrar/StudentHandbook/2567/22_IMI_01.pdf';
export const officialSchoolWebUrl = 'https://informatics.wu.ac.th/bachelors-degree/digital-technology-in-medicine/';
export const curriculumDrivePdfUrl = 'https://drive.google.com/file/d/14sRYBe6Ipm0NCrG37Y6vsDO2yvKEm8I4/view?usp=sharing';

/**
 * ทะเบียนรายวิชาทางการ 69 รายวิชา จากเล่ม มคอ.2 หลักสูตร วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง 2567)
 * มหาวิทยาลัยวลัยลักษณ์ ผ่านการตรวจสอบความสอดคล้องหลักฐาน (Evidence Ledger Track A3.3.3) ครบถ้วน 100%
 */
export const OFFICIAL_COURSES_2567: CourseItem[] = [
  {
    id: 'gen67_011',
    code: 'GEN67-011',
    titleThai: 'ภาษาไทยพื้นฐาน',
    titleEnglish: 'Fundamental Thai',
    credits: 2,
    hours: '2(2-0-4)*',
    isNonCredit: true,
    category: 'general_education',
    subCategory: 'วิชาภาษาไทย (ปรับพื้นฐานไม่นับหน่วยกิต)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_111',
    code: 'GEN67-111',
    titleThai: 'ภาษาไทยเพื่อการนำเสนอ',
    titleEnglish: 'Thai for Presentation',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาไทย (บังคับเรียน)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_021',
    code: 'GEN67-021',
    titleThai: 'ภาษาอังกฤษพื้นฐาน',
    titleEnglish: 'Fundamental English',
    credits: 2,
    hours: '2(2-0-4)*',
    isNonCredit: true,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ปรับพื้นฐานไม่นับหน่วยกิต)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_121',
    code: 'GEN67-121',
    titleThai: 'ภาษาอังกฤษแบบบูรณาการสำหรับผู้ใช้ภาษาขั้นเริ่มต้นระดับสูง',
    titleEnglish: 'Integrated English for High Beginners',
    credits: 3,
    hours: '3(2-3-6)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาอังกฤษ)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_122',
    code: 'GEN67-122',
    titleThai: 'ภาษาอังกฤษการฟัง-พูดสำหรับผู้ใช้ภาษาระดับต้น',
    titleEnglish: 'English Listening and Speaking for Elementary Users',
    credits: 3,
    hours: '3(2-3-6)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาอังกฤษ)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_123',
    code: 'GEN67-123',
    titleThai: 'ภาษาอังกฤษการอ่าน-การเขียนสำหรับผู้ใช้ภาษาระดับต้น',
    titleEnglish: 'English Reading and Writing for Elementary Users',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาอังกฤษ)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 4)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 4,
      pdfPage: 'หน้า 4',
      status: 'verified'
    }
  },
  {
    id: 'gen67_124',
    code: 'GEN67-124',
    titleThai: 'ภาษาอังกฤษเพื่อการพูดในที่สาธารณะและการนำเสนอสำหรับผู้ใช้ภาษาขั้นอิสระ',
    titleEnglish: 'English for Public Speaking and Presentation for Independent Users',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาอังกฤษ)',
    note: 'ในเล่ม มคอ.2 สะกด foe แทน for',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'chi67_121',
    code: 'CHI67-121',
    titleThai: 'ภาษาจีนพื้นฐาน',
    titleEnglish: 'Basic Chinese',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาจีน)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'chi67_122',
    code: 'CHI67-122',
    titleThai: 'ภาษาจีนสำหรับชีวิตประจำวัน',
    titleEnglish: 'Chinese for Daily Life',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาจีน)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'chi67_123',
    code: 'CHI67-123',
    titleThai: 'ภาษาจีนเพื่อการสื่อสาร',
    titleEnglish: 'Chinese for Communication',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาภาษาต่างประเทศ (ภาษาจีน)',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'gen67_132',
    code: 'GEN67-132',
    titleThai: 'ปรัชญา จริยศาสตร์ และวิธีคิดแบบวิพากษ์',
    titleEnglish: 'Philosophy, Ethics and Critical Thinking',
    credits: 2,
    hours: '2(1-2-3)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชามนุษยศาสตร์และสังคมศาสตร์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'gen67_141',
    code: 'GEN67-141',
    titleThai: 'การแสวงหาความรู้และการวิจัยเบื้องต้น',
    titleEnglish: 'Knowledge Inquiry and Fundamental Research',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาวิทยาศาสตร์และคณิตศาสตร์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'gen67_142',
    code: 'GEN67-142',
    titleThai: 'การอนุรักษ์สิ่งแวดล้อมและสภาวะโลกร้อน',
    titleEnglish: 'Environmental Conservation and Global Warming',
    credits: 2,
    hours: '2(1-2-3)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาวิทยาศาสตร์และคณิตศาสตร์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'gen67_161',
    code: 'GEN67-161',
    titleThai: 'นวัตกรรมและผู้ประกอบการ',
    titleEnglish: 'Innovation and Entrepreneurship',
    credits: 2,
    hours: '2(1-2-3)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาการบริหารจัดการและผู้ประกอบการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'inf67_171',
    code: 'INF67-171',
    titleThai: 'เทคโนโลยีสารสนเทศในยุคดิจิทัล',
    titleEnglish: 'Information Technology in Digital Era',
    credits: 1,
    hours: '1(1-0-2)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาเทคโนโลยีสารสนเทศและการสื่อสาร',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'inf67_173',
    code: 'INF67-173',
    titleThai: 'การใช้ซอฟต์แวร์ตารางคำนวณเพื่อการวิเคราะห์ข้อมูล',
    titleEnglish: 'Use of Spreadsheet Software for Data Analysis',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาเทคโนโลยีสารสนเทศและการสื่อสาร',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_151',
    code: 'CSP67-151',
    titleThai: 'กีฬาฟุตบอล',
    titleEnglish: 'Football',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_152',
    code: 'CSP67-152',
    titleThai: 'กีฬาฟุตซอล',
    titleEnglish: 'Futsal',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_153',
    code: 'CSP67-153',
    titleThai: 'กีฬาบาสเกตบอล',
    titleEnglish: 'Basketball',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_154',
    code: 'CSP67-154',
    titleThai: 'กีฬาวอลเลย์บอล',
    titleEnglish: 'Volleyball',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_155',
    code: 'CSP67-155',
    titleThai: 'กีฬาแบดมินตัน',
    titleEnglish: 'Badminton',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_156',
    code: 'CSP67-156',
    titleThai: 'กีฬาเปตอง',
    titleEnglish: 'Petanque',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 5)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 5,
      pdfPage: 'หน้า 5',
      status: 'verified'
    }
  },
  {
    id: 'csp67_157',
    code: 'CSP67-157',
    titleThai: 'กีฬาเทนนิส',
    titleEnglish: 'Tennis',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_158',
    code: 'CSP67-158',
    titleThai: 'กีฬากอล์ฟ',
    titleEnglish: 'Golf',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_159',
    code: 'CSP67-159',
    titleThai: 'กีฬาว่ายน้ำ',
    titleEnglish: 'Swimming',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_160',
    code: 'CSP67-160',
    titleThai: 'กีฬามวยไทย',
    titleEnglish: 'Thai Boxing',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_161',
    code: 'CSP67-161',
    titleThai: 'กีฬาเทเบิลเทนนิส',
    titleEnglish: 'Table Tennis',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_162',
    code: 'CSP67-162',
    titleThai: 'กรีฑา',
    titleEnglish: 'Athletics',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_163',
    code: 'CSP67-163',
    titleThai: 'การฝึกด้วยน้ำหนัก',
    titleEnglish: 'Weight Training',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_164',
    code: 'CSP67-164',
    titleThai: 'โยคะเพื่อสุขภาพ',
    titleEnglish: 'Yoga for Health',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'csp67_165',
    code: 'CSP67-165',
    titleThai: 'แอโรบิกเพื่อสุขภาพ',
    titleEnglish: 'Aerobic for Health',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'general_education',
    subCategory: 'วิชาพลศึกษาและนันทนาการ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_111',
    code: 'DTM67-111',
    titleThai: 'ศัพท์เทคนิคทางการแพทย์',
    titleEnglish: 'Technical Terms in Medicine',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_112',
    code: 'DTM67-112',
    titleThai: 'วิทยาศาสตร์การแพทย์',
    titleEnglish: 'Medical Science',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_113',
    code: 'DTM67-113',
    titleThai: 'การจัดองค์กรและข้อมูลสถานพยาบาล',
    titleEnglish: 'Healthcare Organization and Information Management',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_211',
    code: 'DTM67-211',
    titleThai: 'เวชระเบียนศาสตร์',
    titleEnglish: 'Medical Record Science',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_212',
    code: 'DTM67-212',
    titleThai: 'ระบบบริหารสารสนเทศสุขภาพและการแพทย์',
    titleEnglish: 'Health and Medical Information Management Systems',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_213',
    code: 'DTM67-213',
    titleThai: 'ระบบจำแนกข้อมูลด้านสุขภาพ',
    titleEnglish: 'Health Data Classification Systems',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาชีวการแพทย์และข้อมูลสุขภาพ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_121',
    code: 'DTM67-121',
    titleThai: 'การคิดเชิงออกแบบทางการแพทย์ดิจิทัล',
    titleEnglish: 'Design Thinking in Digital Healthcare',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพื้นฐานและทฤษฎีเทคโนโลยีดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 6)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 6,
      pdfPage: 'หน้า 6',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_122',
    code: 'DTM67-122',
    titleThai: 'การแก้ปัญหาและขั้นตอนวิธี',
    titleEnglish: 'Problem Solving and Algorithm',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพื้นฐานและทฤษฎีเทคโนโลยีดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_123',
    code: 'DTM67-123',
    titleThai: 'พื้นฐานเทคโนโลยีดิจิทัลทางการแพทย์',
    titleEnglish: 'Fundamentals of Digital Technology in Medicine',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพื้นฐานและทฤษฎีเทคโนโลยีดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_221',
    code: 'DTM67-221',
    titleThai: 'สถิติและชีวสถิติขั้นพื้นฐาน',
    titleEnglish: 'Fundamentals of Statistics and Biostatistics',
    credits: 3,
    hours: '3(3-0-6)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพื้นฐานและทฤษฎีเทคโนโลยีดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_222',
    code: 'DTM67-222',
    titleThai: 'เทคโนโลยีการปฏิสัมพันธ์ระหว่างมนุษย์กับคอมพิวเตอร์ สำหรับการแพทย์ดิจิทัล',
    titleEnglish: 'Human-Computer Interaction for Digital Medicine',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพื้นฐานและทฤษฎีเทคโนโลยีดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_481',
    code: 'DTM67-481',
    titleThai: 'สัมมนาเทคโนโลยีดิจิทัลทางการแพทย์ 1',
    titleEnglish: 'Digital Technology in Medicine Seminar I',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาสัมมนาและโครงงาน',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_482',
    code: 'DTM67-482',
    titleThai: 'สัมมนาเทคโนโลยีดิจิทัลทางการแพทย์ 2',
    titleEnglish: 'Digital Technology in Medicine Seminar II',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาสัมมนาและโครงงาน',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_483',
    code: 'DTM67-483',
    titleThai: 'โครงงานเทคโนโลยีดิจิทัลทางการแพทย์ 1',
    titleEnglish: 'Digital Technology in Medicine Project I',
    credits: 3,
    hours: '3(0-9-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาสัมมนาและโครงงาน',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_484',
    code: 'DTM67-484',
    titleThai: 'โครงงานเทคโนโลยีดิจิทัลทางการแพทย์ 2',
    titleEnglish: 'Digital Technology in Medicine Project II',
    credits: 3,
    hours: '3(0-9-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาสัมมนาและโครงงาน',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_131',
    code: 'DTM67-131',
    titleThai: 'การเขียนโปรแกรมคอมพิวเตอร์',
    titleEnglish: 'Computer Programming',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_231',
    code: 'DTM67-231',
    titleThai: 'สถาปัตยกรรมเทคโนโลยีดิจิทัลทางการแพทย์',
    titleEnglish: 'Digital Technology in Medicine Architecture',
    credits: 1,
    hours: '1(1-0-2)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_232',
    code: 'DTM67-232',
    titleThai: 'การวิเคราะห์และออกแบบเชิงวัตถุ',
    titleEnglish: 'Object-oriented Analysis and Design',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_233',
    code: 'DTM67-233',
    titleThai: 'ส่วนต่อประสานผู้ใช้งานและประสบการณ์ผู้ใช้งานทางการแพทย์ดิจิทัล',
    titleEnglish: 'User Interface and User Experience in Digital Healthcare',
    credits: 2,
    hours: '2(2-0-4)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_234',
    code: 'DTM67-234',
    titleThai: 'ระบบฐานข้อมูลทางการแพทย์และสุขภาพ',
    titleEnglish: 'Medical and Health Database Systems',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_235',
    code: 'DTM67-235',
    titleThai: 'การเขียนโปรแกรมเชิงวัตถุ',
    titleEnglish: 'Object-oriented Programming',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_236',
    code: 'DTM67-236',
    titleThai: 'การพัฒนากรอบงานส่วนหน้าสำหรับเว็บไซต์และอุปกรณ์เคลื่อนที่',
    titleEnglish: 'Frontend Development for Web and Mobile',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_331',
    code: 'DTM67-331',
    titleThai: 'การพัฒนากรอบงานส่วนหลัง',
    titleEnglish: 'Backend Development',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_332',
    code: 'DTM67-332',
    titleThai: 'การทดสอบซอฟต์แวร์อัตโนมัติ',
    titleEnglish: 'Automated Software Testing',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_333',
    code: 'DTM67-333',
    titleThai: 'การพัฒนาโปรแกรมประยุกต์สำหรับอุปกรณ์เคลื่อนที่',
    titleEnglish: 'Mobile Application Development',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'major_specific',
    subCategory: 'กลุ่มวิชาพัฒนาซอฟต์แวร์และระบบสารสนเทศ',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 7)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 7,
      pdfPage: 'หน้า 7',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_241',
    code: 'DTM67-241',
    titleThai: 'เทคโนโลยีความจริงเสริม และความจริงเสมือนสำหรับการแพทย์และสุขภาพ',
    titleEnglish: 'Augmented Reality and Virtual Reality Technology for Medicine and Health',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    note: 'ในเล่ม มคอ.2 พิมพ์ชื่อภาษาอังกฤษซ้ำเป็น Human-Computer Interaction for Digital Medicine',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_341',
    code: 'DTM67-341',
    titleThai: 'พื้นฐานเครื่องมือวัดทางชีวการแพทย์',
    titleEnglish: 'Fundamentals of Biomedical Instrumentation',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_342',
    code: 'DTM67-342',
    titleThai: 'อินเทอร์เน็ตของสรรพสิ่งเพื่องานประยุกต์ทางการแพทย์',
    titleEnglish: 'Internet of Things for Medical Application',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_343',
    code: 'DTM67-343',
    titleThai: 'สัญญาณชีวการแพทย์และการประยุกต์ใช้งาน',
    titleEnglish: 'Biomedical Signals and Applications',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_344',
    code: 'DTM67-344',
    titleThai: 'การเชื่อมต่อสมองกับคอมพิวเตอร์',
    titleEnglish: 'Brain-Computer Interfaces',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_251',
    code: 'DTM67-251',
    titleThai: 'เทคโนโลยีปัญญาประดิษฐ์',
    titleEnglish: 'Artificial Intelligence Technology',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_351',
    code: 'DTM67-351',
    titleThai: 'วิศวกรรมข้อมูลทางการแพทย์',
    titleEnglish: 'Medical Data Engineering',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_352',
    code: 'DTM67-352',
    titleThai: 'การเรียนรู้เชิงลึกด้านเทคโนโลยีทางการแพทย์',
    titleEnglish: 'Deep Learning in Medical Technology',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_353',
    code: 'DTM67-353',
    titleThai: 'การประยุกต์ใช้ปัญญาประดิษฐ์',
    titleEnglish: 'Artificial Intelligence Application',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_354',
    code: 'DTM67-354',
    titleThai: 'การวิเคราะห์ภาพถ่ายทางการแพทย์',
    titleEnglish: 'Medical Image Analytics',
    credits: 3,
    hours: '3(2-2-5)',
    isNonCredit: false,
    category: 'minor',
    subCategory: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_391',
    code: 'DTM67-391',
    titleThai: 'เตรียมสหกิจศึกษา',
    titleEnglish: 'Pre-Cooperative Education',
    credits: 1,
    hours: '1(0-2-1)',
    isNonCredit: false,
    category: 'cooperative_education',
    subCategory: 'หมวดวิชาสหกิจศึกษา',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_491',
    code: 'DTM67-491',
    titleThai: 'สหกิจศึกษา 1',
    titleEnglish: 'Cooperative Education I',
    credits: 6,
    hours: '6(0-40-0)',
    isNonCredit: false,
    category: 'cooperative_education',
    subCategory: 'หมวดวิชาสหกิจศึกษา',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
  {
    id: 'dtm67_492',
    code: 'DTM67-492',
    titleThai: 'สหกิจศึกษา 2',
    titleEnglish: 'Cooperative Education II',
    credits: 6,
    hours: '6(0-40-0)',
    isNonCredit: false,
    category: 'cooperative_education',
    subCategory: 'หมวดวิชาสหกิจศึกษา',
    isMacro: false,
    verificationStatus: 'verified',
    evidence: {
      sourceTitle: 'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ (หน้า 8)',
      sourceUrl: officialHandbookPdfUrl,
      pageNumber: 8,
      pdfPage: 'หน้า 8',
      status: 'verified'
    }
  },
];

/**
 * ข้อมูลโครงสร้างหลักสูตรทางการ พ.ศ. 2567
 * รองรับทั้ง Macro Structure ดั้งเดิม และ Detailed Course Inventory 69 รายวิชา เพื่อ Backward Compatibility สมบูรณ์
 */
export const dtmCurriculum2567: OfficialCurriculum = {
  programNameThai: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาเทคโนโลยีดิจิทัลทางการแพทย์',
  programNameEnglish: 'Bachelor of Science Program in Digital Technology in Medicine',
  academicYear: 2567,
  totalCredits: 124,
  categories: {
    generalEducation: {
      categoryName: 'หมวดวิชาศึกษาทั่วไป',
      minCredits: 26,
      description: 'หมวดศึกษาทั่วไป 26 หน่วยกิต ครอบคลุมภาษาไทย ภาษาอังกฤษ/ภาษาจีน มนุษยศาสตร์และสังคมศาสตร์ วิทยาศาสตร์และคณิตศาสตร์ การบริหารจัดการและนวัตกรรม เทคโนโลยีสารสนเทศ และพลศึกษา'
    },
    majorSpecific: {
      categoryName: 'หมวดวิชาเฉพาะ',
      minCredits: 92,
      description: 'หมวดวิชาเฉพาะ 92 หน่วยกิต ประกอบด้วย กลุ่มวิชาเอก 64 หน่วยกิต, กลุ่มวิชาโท 15 หน่วยกิต, และกลุ่มวิชาสหกิจศึกษา 13 หน่วยกิต'
    },
    majorCourses: {
      categoryName: 'วิชาเฉพาะด้าน (Major Courses)',
      minCredits: 64,
      description: 'วิชาแกนและวิชาชีพเฉพาะด้าน 64 หน่วยกิต (25 รายวิชา) ครอบคลุมวิทยาศาสตร์การแพทย์ เวชระเบียน ชีวสถิติ การเขียนโปรแกรม ฐานข้อมูล สถาปัตยกรรมระบบ สัมมนา และโครงงาน'
    },
    minorCourses: {
      categoryName: 'วิชาโท (Minor Courses)',
      minCredits: 15,
      description: 'เลือกเรียน 1 กลุ่มวิชาโท (15 หน่วยกิต / 5 รายวิชา): นวัตกรรมการแพทย์ดิจิทัล หรือ ปัญญาประดิษฐ์ทางการแพทย์'
    },
    cooperativeEducation: {
      categoryName: 'หมวดวิชาสหกิจศึกษา',
      minCredits: 13,
      description: 'หมวดวิชาสหกิจศึกษา 13 หน่วยกิต (3 รายวิชา) ประกอบด้วย เตรียมสหกิจศึกษา 1 หน่วยกิต และสหกิจศึกษา 1 และ 2 รวม 12 หน่วยกิต (ปฏิบัติงานจริงในสถานประกอบการ/โรงพยาบาล 8 เดือน)'
    },
    freeElective: {
      categoryName: 'หมวดวิชาเลือกเสรี',
      minCredits: 6,
      description: 'เลือกเรียนรายวิชาใดๆ ในมหาวิทยาลัยวลัยลักษณ์ ไม่น้อยกว่า 6 หน่วยกิต'
    }
  },
  minorsAvailable: [
    'นวัตกรรมการแพทย์ดิจิทัล (Digital Medical Innovation)',
    'ปัญญาประดิษฐ์ทางการแพทย์ (Medical Artificial Intelligence)'
  ],
  evidence: {
    sourceTitle: 'คู่มือนักศึกษาและเอกสารหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์',
    sourceUrl: officialHandbookPdfUrl,
    pageNumber: 4,
    note: 'โครงสร้างหน่วยกิตรวม (124 หน่วยกิต) และรายวิชาทั้ง 69 รายวิชาได้รับการตรวจสอบเทียบเคียงเอกสารหลักสูตรทางการ พ.ศ. 2567 หน้า 4-8 ครบถ้วนแล้ว',
    status: 'verified'
  },
  courses: [
    // Macro Structure Bundles เพื่อรักษา Backward Compatibility กับโค้ดเดิม
    {
      id: 'dtm-macro-gen',
      code: 'GEN-ED-STRUCT',
      titleThai: 'หมวดวิชาศึกษาทั่วไป (โครงสร้างรวม)',
      titleEnglish: 'General Education Courses (Macro Structure)',
      credits: 26,
      category: 'general_education',
      isMacro: true,
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'คู่มือนักศึกษา ม.วลัยลักษณ์ พ.ศ. 2567',
        sourceUrl: officialHandbookPdfUrl,
        pageNumber: 4,
        status: 'verified'
      }
    },
    {
      id: 'dtm-macro-major',
      code: 'MAJOR-STRUCT',
      titleThai: 'หมวดวิชาเฉพาะด้าน (โครงสร้างรวม)',
      titleEnglish: 'Major Courses (Macro Structure)',
      credits: 64,
      category: 'major_specific',
      isMacro: true,
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'คู่มือนักศึกษา ม.วลัยลักษณ์ พ.ศ. 2567',
        sourceUrl: officialHandbookPdfUrl,
        pageNumber: 6,
        status: 'verified'
      }
    },
    {
      id: 'dtm-macro-minor',
      code: 'MINOR-STRUCT',
      titleThai: 'หมวดวิชาโท (โครงสร้างรวม)',
      titleEnglish: 'Minor Courses (Macro Structure)',
      credits: 15,
      category: 'minor',
      isMacro: true,
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'คู่มือนักศึกษา ม.วลัยลักษณ์ พ.ศ. 2567',
        sourceUrl: officialHandbookPdfUrl,
        pageNumber: 8,
        status: 'verified'
      }
    },
    {
      id: 'dtm-macro-coop',
      code: 'COOP-STRUCT',
      titleThai: 'หมวดวิชาสหกิจศึกษา (โครงสร้างรวม)',
      titleEnglish: 'Cooperative Education (Macro Structure)',
      credits: 13,
      category: 'cooperative_education',
      isMacro: true,
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'คู่มือนักศึกษา ม.วลัยลักษณ์ พ.ศ. 2567',
        sourceUrl: officialHandbookPdfUrl,
        pageNumber: 8,
        status: 'verified'
      }
    },
    {
      id: 'dtm-macro-free',
      code: 'FREE-STRUCT',
      titleThai: 'หมวดวิชาเลือกเสรี (โครงสร้างรวม)',
      titleEnglish: 'Free Elective Courses (Macro Structure)',
      credits: 6,
      category: 'free_elective',
      isMacro: true,
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'คู่มือนักศึกษา ม.วลัยลักษณ์ พ.ศ. 2567',
        sourceUrl: officialHandbookPdfUrl,
        pageNumber: 4,
        status: 'verified'
      }
    },
    // รายวิชาทางการที่ผ่านการตรวจสอบ 69 รายวิชา
    ...OFFICIAL_COURSES_2567
  ]
};

export interface CurriculumFilterCategory {
  id: string;
  nameThai: string;
  nameEnglish: string;
  count: number;
  creditsLabel: string;
  category?: CourseItem['category'];
  subCategory?: string;
  electiveGroup?: string;
}

export const CURRICULUM_FILTER_TABS: CurriculumFilterCategory[] = [
  {
    id: 'all',
    nameThai: 'ทุกรายวิชา (All)',
    nameEnglish: 'All Verified Courses',
    count: 69,
    creditsLabel: '69 รายวิชา'
  },
  {
    id: 'general_education',
    nameThai: 'หมวดวิชาศึกษาทั่วไป',
    nameEnglish: 'General Education',
    count: 31,
    creditsLabel: 'กำหนดเรียน 26 หน่วยกิต (มีให้เลือก 31 วิชา)',
    category: 'general_education'
  },
  {
    id: 'major_core',
    nameThai: 'วิชาชีพเฉพาะด้าน (Major Core)',
    nameEnglish: 'Major Compulsory Courses',
    count: 25,
    creditsLabel: '64 หน่วยกิต (25 รายวิชาบังคับ)',
    category: 'major_specific'
  },
  {
    id: 'minor_innovation',
    nameThai: 'วิชาโทนวัตกรรมการแพทย์ดิจิทัล',
    nameEnglish: 'Minor: Digital Medical Innovation',
    count: 5,
    creditsLabel: '15 หน่วยกิต (5 รายวิชา)',
    category: 'minor',
    electiveGroup: 'กลุ่มวิชาโทนวัตกรรมการแพทย์ดิจิทัล'
  },
  {
    id: 'minor_ai',
    nameThai: 'วิชาโทปัญญาประดิษฐ์ทางการแพทย์',
    nameEnglish: 'Minor: Medical AI',
    count: 5,
    creditsLabel: '15 หน่วยกิต (5 รายวิชา)',
    category: 'minor',
    electiveGroup: 'กลุ่มวิชาโทปัญญาประดิษฐ์ทางการแพทย์'
  },
  {
    id: 'cooperative_education',
    nameThai: 'หมวดวิชาสหกิจศึกษา',
    nameEnglish: 'Cooperative Education',
    count: 3,
    creditsLabel: '13 หน่วยกิต (3 รายวิชา รวมปฏิบัติงาน 8 เดือน)',
    category: 'cooperative_education'
  }
];
