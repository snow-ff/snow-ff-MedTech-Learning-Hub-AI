import { OfficialCurriculum } from '../models/coreModel';

const officialSourceUrl = 'https://informatics.wu.ac.th/bachelors-degree/digital-technology-in-medicine/';
const pdfSourceUrl = 'https://cur-das.wu.ac.th/backEnd/attach/attWu/Digital-Technology-in-Medicine-2567-checo.pdf';

export const dtmCurriculum2567: OfficialCurriculum = {
  programNameThai: 'หลักสูตรวิทยาศาสตรบัณฑิต สาชาเทคโนโลยีดิจิทัลทางการแพทย์',
  programNameEnglish: 'Bachelor of Science Program in Digital Technology in Medicine',
  academicYear: 2567,
  totalCredits: 124,
  categories: {
    generalEducation: {
      categoryName: 'หมวดวิชาศึกษาทั่วไป',
      minCredits: 26,
      description: 'ครอบคลุมภาษาต่างประเทศ สังคมศาสตร์ มนุษยศาสตร์ สุนทรียศาสตร์ วิทยาศาสตร์และเทคโนโลยี การบริหารธุรกิจ และสุขภาพพลานามัย'
    },
    majorSpecific: {
      categoryName: 'หมวดวิชาเฉพาะ',
      minCredits: 92,
      description: 'ประกอบด้วยวิชาเฉพาะด้านและวิชาโท'
    },
    majorCourses: {
      categoryName: 'วิชาเฉพาะด้าน (Major Courses)',
      minCredits: 64,
      description: 'วิชาแกนและวิชาบังคับด้านเทคโนโลยีดิจิทัลทางการแพทย์'
    },
    minorCourses: {
      categoryName: 'วิชาโท (Minor Courses)',
      minCredits: 15,
      description: 'เลือกศึกษาได้ เช่น นวัตกรรมการแพทย์ดิจิทัล หรือปัญญาประดิษฐ์ทางการแพทย์'
    },
    cooperativeEducation: {
      categoryName: 'หมวดวิชาสหกิจศึกษา',
      minCredits: 13,
      description: 'ปฏิบัติงานจริงในองค์กรที่เกี่ยวข้องไม่น้อยกว่า 8 เดือน'
    },
    freeElective: {
      categoryName: 'หมวดวิชาเลือกเสรี',
      minCredits: 6,
      description: 'เลือกเรียนรายวิชาใดๆ ในมหาวิทยาลัย'
    }
  },
  minorsAvailable: [
    'นวัตกรรมการแพทย์ดิจิทัล (Digital Medical Innovation)',
    'ปัญญาประดิษฐ์ทางการแพทย์ (Medical Artificial Intelligence)'
  ],
  evidence: {
    sourceTitle: 'เว็บไซต์สำนักวิชาสารสนเทศศาสตร์ มหาวิทยาลัยวลัยลักษณ์ และเอกสารหลักสูตร พ.ศ. 2567',
    sourceUrl: officialSourceUrl,
    note: 'โครงสร้างหน่วยกิตภาพรวมได้รับการยืนยันแล้ว ส่วนรายวิชารายภาคการศึกษาและรหัสวิชายังอยู่ในสถานะ needs_review เนื่องจากรอการตรวจสอบเทียบเคียงเล่ม PDF ฉบับสมบูรณ์',
    status: 'verified'
  },
  courses: [
    {
      id: 'dtm-macro-gen',
      code: 'GEN-ED-STRUCT',
      titleThai: 'หมวดวิชาศึกษาทั่วไป (โครงสร้างรวม)',
      titleEnglish: 'General Education Courses (Macro Structure)',
      credits: 26,
      category: 'general_education',
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์',
        sourceUrl: officialSourceUrl,
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
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์',
        sourceUrl: officialSourceUrl,
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
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์',
        sourceUrl: officialSourceUrl,
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
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์',
        sourceUrl: officialSourceUrl,
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
      verificationStatus: 'verified',
      evidence: {
        sourceTitle: 'สำนักวิชาสารสนเทศศาสตร์ ม.วลัยลักษณ์',
        sourceUrl: officialSourceUrl,
        status: 'verified'
      }
    },
    {
      id: 'dtm-pending-details',
      code: 'PENDING-DETAILS',
      titleThai: '[รอการตรวจสอบเพิ่มเติมจากเล่มหลักสูตร PDF ฉบับเต็ม]',
      titleEnglish: '[Pending full PDF course breakdown review]',
      credits: 0,
      category: 'major_specific',
      verificationStatus: 'needs_review',
      evidence: {
        sourceTitle: 'เอกสารหลักสูตร DTM 2567 (PDF)',
        sourceUrl: pdfSourceUrl,
        note: 'รายวิชารายปี รายภาคการศึกษา รหัสวิชา และผลลัพธ์การเรียนรู้รายวิชาอยู่ในสถานะ needs_review',
        status: 'needs_review'
      }
    }
  ]
};
