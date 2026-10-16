// DTM Curriculum Data and Knowledge/Glossary Base for MedTech Learning Hub AI v1.2
// Baseline: DTM Curriculum Alignment Crosswalk v2 (45 entries, Academic Years 2567-2569)

import { 
  CurriculumVersion, 
  CurriculumCourse, 
  CurriculumAlignment, 
  StudentCourseRecord,
  Subject,
  Topic,
  Lesson,
  GlossaryTerm,
  Reference,
  Claim,
  EvidenceLink,
  AuditTrailRecord,
  LinkAccessStatus
} from '../models/coreModel';

export const dtmCurriculumVersion: CurriculumVersion = {
  id: "DTM-WU-2567",
  programCode: "DTM67",
  programNameTh: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาการจัดการเทคโนโลยีการตรวจวินิจฉัย (DTM)",
  programNameEn: "Bachelor of Science Program in Diagnostic Technology Management",
  university: "มหาวิทยาลัยวลัยลักษณ์ (Walailak University)",
  facultyOrSchool: "สำนักวิชาสหเวชศาสตร์ (School of Allied Health Sciences)",
  curriculumYear: 2567,
  totalCredits: 132,
  minorTrackCreditRequirement: 15,
  status: "active"
};

// 45 Curriculum Crosswalk Baseline Entries (2567-2569)
// Note: Catalogue candidates DTM67-333, DTM67-482, DTM67-484, DTM67-491, DTM67-492 are marked with unconfirmed semester placement.
// Minor tracks spanning conflicting groups are marked 'needs_review' to avoid deciding for the user.
export const dtmCrosswalk45: CurriculumAlignment[] = [
  // Year 2567 General & Core
  { alignmentId: "CW-01", sourceCode: "GEN67-001", officialCourseCode: "GEN67-001", matchedTitleTh: "ภาษาไทยเพื่อการสื่อสารร่วมสมัย", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },
  { alignmentId: "CW-02", sourceCode: "GEN67-002", officialCourseCode: "GEN67-002", matchedTitleTh: "ภาษาอังกฤษเพื่อการสื่อสารทางวิชาการ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },
  { alignmentId: "CW-03", sourceCode: "GEN67-003", officialCourseCode: "GEN67-003", matchedTitleTh: "ทักษะดิจิทัลและการรู้เท่าทันสารสนเทศ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },
  { alignmentId: "CW-04", sourceCode: "SCG67-101", officialCourseCode: "SCG67-101", matchedTitleTh: "เคมีพื้นฐานและเคมีอินทรีย์สำหรับวิทยาศาสตร์สุขภาพ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },
  { alignmentId: "CW-05", sourceCode: "SCG67-102", officialCourseCode: "SCG67-102", matchedTitleTh: "ปฏิบัติการเคมีพื้นฐานและเคมีอินทรีย์", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },
  { alignmentId: "CW-06", sourceCode: "DTM67-101", officialCourseCode: "DTM67-101", matchedTitleTh: "บทนำสู่วิชาชีพการจัดการเทคโนโลยีการตรวจวินิจฉัย", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2567" },

  { alignmentId: "CW-07", sourceCode: "GEN67-004", officialCourseCode: "GEN67-004", matchedTitleTh: "ภาษาอังกฤษเพื่อการสื่อสารข้ามวัฒนธรรม", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },
  { alignmentId: "CW-08", sourceCode: "SCG67-103", officialCourseCode: "SCG67-103", matchedTitleTh: "ชีววิทยาของเซลล์และพันธุศาสตร์มนุษย์", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },
  { alignmentId: "CW-09", sourceCode: "SCG67-104", officialCourseCode: "SCG67-104", matchedTitleTh: "ปฏิบัติการชีววิทยาของเซลล์และพันธุศาสตร์มนุษย์", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },
  { alignmentId: "CW-10", sourceCode: "SCG67-105", officialCourseCode: "SCG67-105", matchedTitleTh: "ฟิสิกส์สำหรับวิทยาศาสตร์สุขภาพและการแพทย์", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },
  { alignmentId: "CW-11", sourceCode: "DTM67-102", officialCourseCode: "DTM67-102", matchedTitleTh: "สถิติชีวภาพและระเบียบวิธีวิจัยเบื้องต้น", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },
  { alignmentId: "CW-12", sourceCode: "DTM67-103", officialCourseCode: "DTM67-103", matchedTitleTh: "ระบบสารสนเทศและการสื่อสารข้อมูลทางห้องปฏิบัติการ (LIS Overview)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2567" },

  // Year 2568 Pre-clinical & Laboratory Technology Core
  { alignmentId: "CW-13", sourceCode: "BMS67-201", officialCourseCode: "BMS67-201", matchedTitleTh: "กายวิภาคศาสตร์และสรีรวิทยาการแพทย์ 1", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2568" },
  { alignmentId: "CW-14", sourceCode: "BMS67-202", officialCourseCode: "BMS67-202", matchedTitleTh: "ชีวเคมีการแพทย์และการเมแทบอลิซึม", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2568" },
  { alignmentId: "CW-15", sourceCode: "DTM67-201", officialCourseCode: "DTM67-201", matchedTitleTh: "วิทยาการตรวจวัดและเครื่องมือวิเคราะห์ทางคลินิก (Instrumentation)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2568" },
  { alignmentId: "CW-16", sourceCode: "DTM67-202", officialCourseCode: "DTM67-202", matchedTitleTh: "การจัดการความปลอดภัยและชีวอนามัยในห้องปฏิบัติการ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2568" },
  { alignmentId: "CW-17", sourceCode: "DTM67-203", officialCourseCode: "DTM67-203", matchedTitleTh: "จุลชีววิทยาทางการแพทย์และการควบคุมการติดเชื้อ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2568" },

  { alignmentId: "CW-18", sourceCode: "BMS67-203", officialCourseCode: "BMS67-203", matchedTitleTh: "กายวิภาคศาสตร์และสรีรวิทยาการแพทย์ 2", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2568" },
  { alignmentId: "CW-19", sourceCode: "BMS67-204", officialCourseCode: "BMS67-204", matchedTitleTh: "พยาธิสรีรวิทยาและวิทยาภูมิคุ้มกันพื้นฐาน", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2568" },
  { alignmentId: "CW-20", sourceCode: "DTM67-204", officialCourseCode: "DTM67-204", matchedTitleTh: "หลักการตรวจวินิจฉัยทางโมเลกุล (Molecular Diagnostics Principles)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2568" },
  { alignmentId: "CW-21", sourceCode: "DTM67-205", officialCourseCode: "DTM67-205", matchedTitleTh: "การควบคุมคุณภาพทางห้องปฏิบัติการและ Westgard Rules (QC Systems)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2568" },
  { alignmentId: "CW-22", sourceCode: "DTM67-206", officialCourseCode: "DTM67-206", matchedTitleTh: "การจัดการห่วงโซ่อุปทานและน้ำยาทางห้องปฏิบัติการ (Inventory & Reagents)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2568" },

  // Year 2569 Diagnostic Management & Clinical Systems
  { alignmentId: "CW-23", sourceCode: "DTM67-301", officialCourseCode: "DTM67-301", matchedTitleTh: "การจัดการเทคโนโลยีการตรวจวินิจฉัยขั้นสูง (Advanced Diagnostic Systems)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2569" },
  { alignmentId: "CW-24", sourceCode: "DTM67-302", officialCourseCode: "DTM67-302", matchedTitleTh: "ระบบบริหารคุณภาพห้องปฏิบัติการตามมาตรฐานสากล ISO 15189", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2569" },
  { alignmentId: "CW-25", sourceCode: "DTM67-303", officialCourseCode: "DTM67-303", matchedTitleTh: "การเชื่อมต่อระบบ LIS/HIS และเทคโนโลยี Middleware", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2569" },
  { alignmentId: "CW-26", sourceCode: "DTM67-304", officialCourseCode: "DTM67-304", matchedTitleTh: "การตรวจวินิจฉัย ณ จุดดูแลผู้ป่วย (Point-of-Care Testing: POCT)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2569" },
  { alignmentId: "CW-27", sourceCode: "DTM67-305", officialCourseCode: "DTM67-305", matchedTitleTh: "การบำรุงรักษาเชิงป้องกันและการสอบเทียบเครื่องมือ (Calibration & PM)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "1/2569" },

  { alignmentId: "CW-28", sourceCode: "DTM67-306", officialCourseCode: "DTM67-306", matchedTitleTh: "การประเมินความคุ้มค่าและเศรษฐศาสตร์สาธารณสุขในห้องปฏิบัติการ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2569" },
  { alignmentId: "CW-29", sourceCode: "DTM67-307", officialCourseCode: "DTM67-307", matchedTitleTh: "จริยธรรมวิชาชีพ กฎหมายสุขภาพ และความปลอดภัยทางชีวภาพ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2569" },
  { alignmentId: "CW-30", sourceCode: "DTM67-308", officialCourseCode: "DTM67-308", matchedTitleTh: "การวิเคราะห์และตรวจสอบความถูกต้องของวิธีตรวจ (Method Validation)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2569" },
  { alignmentId: "CW-31", sourceCode: "DTM67-309", officialCourseCode: "DTM67-309", matchedTitleTh: "โครงงานวิจัยการจัดการเทคโนโลยีตรวจวินิจฉัย 1", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "confirmed", suggestedSemester: "2/2569" },

  // Minor Track Candidates (Single track 15 credits requirement: flagged for review if multiple track choices found)
  { alignmentId: "CW-32", sourceCode: "DTM67-M01", officialCourseCode: "DTM67-M01", matchedTitleTh: "การจัดการสารสนเทศข้อมูลสุขภาพและการวิเคราะห์ข้อมูลขั้นสูง (Health Data Analytics)", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", isMinorCandidate: true, semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกโท (Minor Track) ต้องเลือกเพียงกลุ่มเดียวครบ 15 หน่วยกิต ไม่เลือกแทนผู้เรียน" },
  { alignmentId: "CW-33", sourceCode: "DTM67-M02", officialCourseCode: "DTM67-M02", matchedTitleTh: "ความมั่นคงปลอดภัยไซเบอร์และข้อมูลส่วนบุคคลทางการแพทย์ (Medical Cyber Security)", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", isMinorCandidate: true, semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกโท (Minor Track) ต้องเลือกเพียงกลุ่มเดียวครบ 15 หน่วยกิต ไม่เลือกแทนผู้เรียน" },
  { alignmentId: "CW-34", sourceCode: "DTM67-M03", officialCourseCode: "DTM67-M03", matchedTitleTh: "การตลาดและนวัตกรรมผลิตภัณฑ์เครื่องมือตรวจวินิจฉัย (Diagnostics Commercialization)", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", isMinorCandidate: true, semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกโท (Minor Track) ต้องเลือกเพียงกลุ่มเดียวครบ 15 หน่วยกิต ไม่เลือกแทนผู้เรียน" },
  { alignmentId: "CW-35", sourceCode: "DTM67-M04", officialCourseCode: "DTM67-M04", matchedTitleTh: "การจัดการธุรกิจและผู้ประกอบการศูนย์ตรวจสุขภาพ (Diagnostic Center Business)", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", isMinorCandidate: true, semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกโท (Minor Track) ต้องเลือกเพียงกลุ่มเดียวครบ 15 หน่วยกิต ไม่เลือกแทนผู้เรียน" },

  // Supplementary / Elective entries requiring review
  { alignmentId: "CW-36", sourceCode: "DTM67-E01", officialCourseCode: "DTM67-E01", matchedTitleTh: "เทคโนโลยีการเพาะเลี้ยงและตรวจวิเคราะห์ระดับเซลล์ (Cellular Analysis Techniques)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกเสรี/วิชาเลือกตามความสนใจ" },
  { alignmentId: "CW-37", sourceCode: "DTM67-E02", officialCourseCode: "DTM67-E02", matchedTitleTh: "พันธุศาสตร์การแพทย์และการให้คำปรึกษาทางพันธุศาสตร์เบื้องต้น", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกเสรี/วิชาเลือกตามความสนใจ" },
  { alignmentId: "CW-38", sourceCode: "DTM67-E03", officialCourseCode: "DTM67-E03", matchedTitleTh: "ชีวสารสนเทศศาสตร์เบื้องต้นสำหรับการแพทย์แม่นยำ (Intro to Bioinformatics)", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "วิชาเลือกเสรี/วิชาเลือกตามความสนใจ" },

  // Ambiguous course code requiring human review (cannot guess)
  { alignmentId: "CW-39", sourceCode: "MED-UNKNOWN-99", officialCourseCode: undefined, matchedTitleTh: "รหัสวิชาไม่ตรงกับสารบบหลักสูตรทางการ", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", semesterPlacementStatus: "unconfirmed", reviewReason: "รหัสวิชาไม่ตรงกับสารบบหลักสูตรทางการ ห้ามคาดเดาหรือจับคู่แทนผู้เรียน" },
  { alignmentId: "CW-40", sourceCode: "DTM-TOPIC-AMBIG", officialCourseCode: undefined, matchedTitleTh: "หัวข้อทางเทคโนโลยีการตรวจวินิจฉัย (ชื่อคล้ายหลายวิชา)", academicYearWindow: "2567-2569", alignmentStatus: "needs_review", semesterPlacementStatus: "unconfirmed", reviewReason: "ชื่อรายวิชาคล้ายหลายวิชาในกลุ่มเลือก ต้องได้รับการยืนยันจากผู้เรียนหรือแผนการศึกษาทางการ" },

  // Catalogue candidates (Strict rule: Must NOT assign year-4 semester placement from catalogue alone)
  { alignmentId: "CW-41", sourceCode: "DTM67-333", officialCourseCode: "DTM67-333", matchedTitleTh: "การปฏิบัติการทางเทคนิคขั้นสูงในสถานประกอบการ", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "Catalogue candidate: ต้องเทียบแผนการศึกษารายภาคเรียนหรือ StudentRecord ก่อนจัดปี/เทอม" },
  { alignmentId: "CW-42", sourceCode: "DTM67-482", officialCourseCode: "DTM67-482", matchedTitleTh: "การเตรียมความพร้อมสหกิจศึกษาด้านการจัดการเทคโนโลยีตรวจวินิจฉัย", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "Catalogue candidate: ต้องเทียบแผนการศึกษารายภาคเรียนหรือ StudentRecord ก่อนจัดปี/เทอม" },
  { alignmentId: "CW-43", sourceCode: "DTM67-484", officialCourseCode: "DTM67-484", matchedTitleTh: "สหกิจศึกษาด้านการจัดการเทคโนโลยีตรวจวินิจฉัยทางการแพทย์", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "Catalogue candidate: ต้องเทียบแผนการศึกษารายภาคเรียนหรือ StudentRecord ก่อนจัดปี/เทอม" },
  { alignmentId: "CW-44", sourceCode: "DTM67-491", officialCourseCode: "DTM67-491", matchedTitleTh: "โครงงานวิจัยการจัดการเทคโนโลยีตรวจวินิจฉัย 2", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "Catalogue candidate: ต้องเทียบแผนการศึกษารายภาคเรียนหรือ StudentRecord ก่อนจัดปี/เทอม" },
  { alignmentId: "CW-45", sourceCode: "DTM67-492", officialCourseCode: "DTM67-492", matchedTitleTh: "สัมมนาประเด็นร่วมสมัยในการจัดการเทคโนโลยีตรวจวินิจฉัย", academicYearWindow: "2567-2569", alignmentStatus: "aligned", semesterPlacementStatus: "unconfirmed", reviewReason: "Catalogue candidate: ต้องเทียบแผนการศึกษารายภาคเรียนหรือ StudentRecord ก่อนจัดปี/เทอม" }
];

// Student course record is strictly separate from curriculum course catalogue
export const sampleStudentCourseRecord: StudentCourseRecord[] = [
  {
    recordId: "SR-01",
    studentId: "STUDENT-WU-DEMO",
    courseCode: "DTM67-101",
    academicYearEnrolled: 2567,
    semesterEnrolled: 1,
    grade: "A",
    enrollmentStatus: "completed",
    dataSource: "self_reported"
  },
  {
    recordId: "SR-02",
    studentId: "STUDENT-WU-DEMO",
    courseCode: "DTM67-103",
    academicYearEnrolled: 2567,
    semesterEnrolled: 2,
    grade: "B+",
    enrollmentStatus: "completed",
    dataSource: "self_reported"
  },
  {
    recordId: "SR-03",
    studentId: "STUDENT-WU-DEMO",
    courseCode: "DTM67-205",
    academicYearEnrolled: 2568,
    semesterEnrolled: 2,
    enrollmentStatus: "enrolled",
    dataSource: "self_reported"
  }
];

// Core Subjects (Hematology is clearly marked supplementary)
export const medtechSubjects: Subject[] = [
  {
    id: "dtm-qc-mgmt",
    nameTh: "การจัดการระบบคุณภาพและสารสนเทศห้องปฏิบัติการ (LIS & QC Management)",
    nameEn: "Laboratory Quality & Information Systems Management",
    code: "DTM-QC",
    descriptionTh: "ครอบคลุมการเชื่อมต่อเครื่องวิเคราะห์ (LIS/LIMS Interfacing), การควบคุมคุณภาพทางสถิติ (Westgard Multirules), การสอบเทียบเครื่องมือ (Calibration), และมาตรฐานสากล ISO 15189",
    iconName: "Layers",
    isSupplementary: false
  },
  {
    id: "dtm-mol-dx",
    nameTh: "วิทยาการวินิจฉัยระดับโมเลกุล (Molecular Diagnostics)",
    nameEn: "Molecular Diagnostic Technologies",
    code: "DTM-MDX",
    descriptionTh: "หลักการ Conventional PCR, Real-Time qPCR, ค่า Cq/Ct, การป้องกันการปนเปื้อนแอมพลิคอน, และแนวทางมาตรฐาน MIQE 2.0",
    iconName: "FlaskConical",
    isSupplementary: false
  },
  {
    id: "dtm-poct-immuno",
    nameTh: "การตรวจวินิจฉัย ณ จุดดูแลและเทคโนโลยีภูมิคุ้มกัน (POCT & Immunoassay)",
    nameEn: "Point-of-Care Testing & Diagnostic Immunology",
    code: "DTM-POCT",
    descriptionTh: "เทคโนโลยี Lateral Flow, Biosensors, การตรวจวิเคราะห์สารบ่งชี้อย่างรวดเร็ว, และการจัดการคุณภาพอุปกรณ์ POCT",
    iconName: "Sparkles",
    isSupplementary: false
  },
  {
    id: "suppl-hema",
    nameTh: "โลหิตวิทยาคลินิกและการจำแนกเซลล์ (Clinical Hematology - Supplementary Topic)",
    nameEn: "Clinical Hematology & Cell Identification (Supplementary Knowledge)",
    code: "SUPPL-HEM",
    descriptionTh: "ความรู้เสริมทางโลหิตวิทยา: การวิเคราะห์ CBC ด้วยเครื่องอัตโนมัติ (Impedance & Light Scatter), การนับแยกเม็ดเลือดขาวตามเกณฑ์ CLSI H20 3rd Ed, ภาวะเกล็ดเลือดต่ำลวง EDTA, และ Flow Cytometry",
    iconName: "Microscope",
    isSupplementary: true // Clearly supplementary, not user's primary curriculum
  }
];

// Reference Items with Evidentiary Verification status
export const curatedReferences: Reference[] = [
  {
    referenceId: "REF-CLSI-H20-3RD",
    title: "CLSI H20: Reference Leukocyte Differential Count (Proportional) and Evaluation of Instrumental Methods (3rd Edition)",
    uri: "https://clsi.org/shop/standards/h20/",
    sourceType: "clsi",
    linkAccessStatus: "unknown", // Unknown until live network reachability check is conducted
    verificationStatus: "unverified", // Default to unverified until authorized human audit recorded
    reviewer: undefined,
    reviewDate: undefined,
    evidenceLocator: "CLSI H20 3rd Ed, published April 29, 2026",
    contentVersion: "1.2"
  },
  {
    referenceId: "REF-PUBMED-25425098",
    title: "Discovery and Correction of Spurious Low Platelet Counts due to EDTA-Dependent Pseudothrombocytopenia",
    uri: "https://pubmed.ncbi.nlm.nih.gov/25425098/",
    sourceType: "pubmed",
    linkAccessStatus: "unknown",
    verificationStatus: "unverified",
    reviewer: undefined,
    reviewDate: undefined,
    evidenceLocator: "PubMed PMID: 25425098",
    contentVersion: "1.2"
  },
  {
    referenceId: "REF-MIQE2-2025",
    title: "MIQE 2.0: Revision of the Minimum Information for Publication of Quantitative Real-Time PCR Experiments Guidelines",
    uri: "https://academic.oup.com/clinchem/article/71/6/634/8119148",
    sourceType: "guideline",
    linkAccessStatus: "unknown",
    verificationStatus: "unverified",
    reviewer: undefined,
    reviewDate: undefined,
    evidenceLocator: "Clin Chem 2025; 71(6):634-648",
    contentVersion: "1.2"
  },
  {
    referenceId: "REF-NCBI-NBK608011",
    title: "Flow Cytometry Blood Cell Identification",
    uri: "https://www.ncbi.nlm.nih.gov/books/NBK608011/",
    sourceType: "textbook",
    linkAccessStatus: "unknown",
    verificationStatus: "unverified",
    reviewer: undefined,
    reviewDate: undefined,
    evidenceLocator: "StatPearls NCBI Bookshelf NBK608011",
    contentVersion: "1.2"
  },
  {
    referenceId: "REF-ISO-15189",
    title: "ISO 15189: Medical laboratories - Requirements for quality and competence",
    sourceType: "standard",
    linkAccessStatus: "unknown",
    verificationStatus: "unverified",
    reviewer: undefined,
    reviewDate: undefined,
    evidenceLocator: "ISO 15189:2022 clause 7.3 & 7.4",
    contentVersion: "1.2"
  }
];

// Curated Lessons across Basic to Advanced
export const curatedLessons: Lesson[] = [
  {
    id: "LES-QC-01",
    topicId: "TOPIC-QC-BASIC",
    titleTh: "ระบบการควบคุมคุณภาพห้องปฏิบัติการ (Internal QC) และการใช้ Westgard Multirules",
    titleEn: "Laboratory Internal Quality Control & Statistical Evaluation with Westgard Multirules",
    level: "intermediate",
    summaryTh: "ศึกษาหลักการควบคุมคุณภาพประจำวัน การประเมินความถูกต้องและความเที่ยงตรงด้วย Levey-Jennings Chart และการตัดสินใจปฏิเสธ Run ด้วย Westgard Multirules",
    blocks: [
      {
        id: "B-QC-1",
        blockType: "concept",
        titleTh: "หลักการสถิติพื้นฐานและการรวบรวมข้อมูลควบคุม",
        contentTh: "การทำ Internal QC ต้องตรวจวัดสารควบคุมอย่างน้อย 2-3 ระดับความเข้มข้น คำนวณค่า Mean และส่วนเบี่ยงเบนมาตรฐาน (SD) จากข้อมูลสะสมอย่างน้อย 20 จุดในภาวะคงที่"
      },
      {
        id: "B-QC-2",
        blockType: "quality_control",
        titleTh: "เกณฑ์การตัดสินใจด้วย Westgard Multirules",
        contentTh: "• 1_2s: กฎเตือน (Warning) เมื่อมี 1 ค่าหลุดเกิน ±2SD ไม่ปฏิเสธ Run ทันที\n• 1_3s: ปฏิเสธ Run ทันทีจาก Random Error\n• 2_2s: ปฏิเสธ Run จาก Systematic Error เมื่อ 2 ค่าติดกันเกิน ±2SD\n• R_4s: ปฏิเสธ Run เมื่อค่า 2 ค่าใน Run เดียวกันต่างกันเกิน 4SD\n• 4_1s และ 10_x: ตรวจจับ Systematic Bias"
      },
      {
        id: "B-QC-3",
        blockType: "clinical",
        titleTh: "การจัดการเมื่อพบผล Out of Control",
        contentTh: "เมื่อ QC หลุดเกณฑ์ ต้องระงับการรายงานผลผู้ป่วย ประเมินผลกระทบต่อสิ่งส่งตรวจ หาสาเหตุ แก้ไข และทวนสอบความเหมาะสมก่อนรายงานผล"
      }
    ],
    keyEnglishTerms: ["Quality Control", "Westgard Rules", "Levey-Jennings Chart", "Random Error", "Systematic Error"],
    suggestedPrompt: "อธิบายการประยุกต์ใช้ Westgard Multirules ในห้องปฏิบัติการและขั้นตอนการแก้ปัญหาเมื่อพบความผิดปกติแบบ 2_2s และ R_4s",
    referenceIds: ["REF-ISO-15189"]
  },
  {
    id: "LES-LIS-01",
    topicId: "TOPIC-LIS-INTERFACING",
    titleTh: "การเชื่อมต่อระบบ LIS/LIMS กับเครื่องตรวจวิเคราะห์อัตโนมัติ (Instrument Interfacing)",
    titleEn: "Clinical Laboratory Instrument Interfacing with LIS and LIMS",
    level: "advanced",
    summaryTh: "ทำความเข้าใจกลไก Direct Interface, Middleware, โปรโตคอล ASTM/HL7, การจับคู่บาร์โค้ดสิ่งส่งตรวจ และการป้องกันข้อผิดพลาดก่อนรายงานผล",
    blocks: [
      {
        id: "B-LIS-1",
        blockType: "concept",
        titleTh: "บทบาทของ LIS vs LIMS",
        contentTh: "LIS เน้นการรับคำสั่งตรวจ การติดตามสิ่งส่งตรวจ การตรวจรับรองผลผู้ป่วย ส่วน LIMS เน้นการติดตามตัวอย่าง สต็อกสารเคมี และการสอบเทียบเครื่องมือ"
      },
      {
        id: "B-LIS-2",
        blockType: "procedure",
        titleTh: "รูปแบบการเชื่อมต่อ (Direct vs Middleware)",
        contentTh: "Direct Interface เชื่อมต่อตรงผ่าน Serial RS-232 หรือ TCP/IP ส่วน Middleware ทำหน้าที่เป็นตัวกลางแปลงข้อมูลและคัดกรองผลตรวจตามเกณฑ์ Delta Check และ Critical Values"
      }
    ],
    keyEnglishTerms: ["LIS", "LIMS", "Middleware", "Instrument Interfacing", "Bi-directional Interfacing"],
    suggestedPrompt: "เปรียบเทียบข้อดีข้อเสียระหว่าง Direct Interfacing และการใช้ Middleware ในการเชื่อมต่อระบบสารสนเทศห้องปฏิบัติการ",
    referenceIds: ["REF-ISO-15189"]
  },
  {
    id: "LES-PCR-01",
    topicId: "TOPIC-MOL-DX",
    titleTh: "การตรวจวินิจฉัยด้วย Real-Time qPCR และเกณฑ์มาตรฐาน MIQE 2.0",
    titleEn: "Quantitative Real-Time PCR (qPCR) Diagnostics and MIQE 2.0 Standard Guidelines",
    level: "advanced",
    summaryTh: "หลักการตรวจวัดสัญญาณเรืองแสงแบบเรียลไทม์ การแปลผลค่า Cq/Ct ข้อควรระวังเรื่องเกณฑ์ตัดรอบ และการควบคุมคุณภาพด้วย No Template Control (NTC)",
    blocks: [
      {
        id: "B-PCR-1",
        blockType: "concept",
        titleTh: "หลักการของ Real-Time qPCR",
        contentTh: "วัดสัญญาณ Fluorescence ต่อรอบการเพิ่มขยาย (Cycle) ค่า Quantification Cycle (Cq) หรือ Threshold Cycle (Ct) แปรผกผันกับปริมาณกรดนิวคลีอิกตั้งต้น"
      },
      {
        id: "B-PCR-2",
        blockType: "warning",
        titleTh: "ข้อควรระวังตามมาตรฐาน MIQE 2.0 (2025)",
        contentTh: "ไม่ควรใช้เกณฑ์ตัดรอบ Ct ที่ตายตัวโดยไม่ประเมิน Assay Validation, Limit of Detection (LoD), และ Baseline ของระบบตรวจเฉพาะ"
      }
    ],
    keyEnglishTerms: ["Real-Time PCR", "qPCR", "Quantification Cycle (Cq)", "Threshold Cycle (Ct)", "MIQE 2.0", "Limit of Detection (LoD)"],
    suggestedPrompt: "อธิบายความแตกต่างระหว่าง Conventional PCR และ Real-Time qPCR พร้อมข้อควรระวังในการแปลผลค่า Cq/Ct ตามแนวทาง MIQE 2.0",
    referenceIds: ["REF-MIQE2-2025"]
  },
  {
    id: "LES-HEMA-SUPPL-01",
    topicId: "TOPIC-HEMA-SUPPL",
    titleTh: "การตรวจ CBC อัตโนมัติและการยืนยันด้วยสเมียร์เลือด (ความรู้เสริม)",
    titleEn: "Automated CBC, Smear Morphology Review & CLSI H20 3rd Edition Standards (Supplementary)",
    level: "intermediate",
    summaryTh: "ความรู้เสริมทางโลหิตวิทยา: หลักการเครื่องวิเคราะห์อัตโนมัติ (Electrical Impedance & Laser Scatter), มาตรฐาน CLSI H20 3rd Ed, และภาวะเกล็ดเลือดต่ำลวง EDTA",
    blocks: [
      {
        id: "B-HEM-1",
        blockType: "concept",
        titleTh: "หลักการตรวจวัดเม็ดเลือดอัตโนมัติ",
        contentTh: "ใช้ Electrical Impedance (Coulter Principle) วัดขนาดและนับจำนวนเม็ดเลือดแดงและเกล็ดเลือด ใช้ Optical Light Scatter จำแนกเม็ดเลือดขาว 5-Part Differential"
      },
      {
        id: "B-HEM-2",
        blockType: "procedure",
        titleTh: "ขอบเขตของมาตรฐาน CLSI H20 3rd Edition (2026)",
        contentTh: "CLSI H20 ฉบับที่ 3 (เผยแพร่ 29 เมษายน 2026 แทนที่ H20-A2) กำหนดเฉพาะวิธีอ้างอิงการนับแยกเม็ดเลือดขาวด้วยตา (Reference visual visual differential) เพื่อประเมินเครื่องตรวจ ส่วนเกณฑ์ทบทวนสไลด์เมื่อพบ Analyzer Flags เป็นแนวปฏิบัติระดับสถาบัน"
      },
      {
        id: "B-HEM-3",
        blockType: "clinical",
        titleTh: "ภาวะ EDTA-Dependent Pseudothrombocytopenia",
        contentTh: "เกิดจาก In vitro platelet clumping จากแอนติบอดีในสภาวะที่มี EDTA ยืนยันด้วยการตรวจสเมียร์เลือดและเจาะเลือดซ้ำด้วยหลอด Sodium Citrate (อ้างอิง PubMed 25425098)"
      }
    ],
    keyEnglishTerms: ["Complete Blood Count (CBC)", "CLSI H20", "Electrical Impedance", "Optical Scatter", "Pseudothrombocytopenia", "Platelet Clumping"],
    suggestedPrompt: "อธิบายหลักการตรวจ CBC ด้วยเครื่องอัตโนมัติ ข้อจำกัดที่ต้องตรวจสเมียร์เลือด และภาวะเกล็ดเลือดต่ำลวงจากสาร EDTA",
    referenceIds: ["REF-CLSI-H20-3RD", "REF-PUBMED-25425098"]
  }
];

// Curated Glossary Terms with Phonetic Thai & Clinical Context
export const curatedGlossary: GlossaryTerm[] = [
  {
    id: "TERM-01",
    subjectId: "dtm-qc-mgmt",
    termEn: "Quality Control (QC)",
    termTh: "การควบคุมคุณภาพ",
    phoneticTh: "ควอลิตี้ คอนโทรล",
    definitionTh: "กระบวนการทางสถิติและการปฏิบัติงานประจำวันเพื่อตรวจสอบความถูกต้องแม่นยำ (Accuracy & Precision) ของระบบการตรวจวิเคราะห์ก่อนรายงานผลผู้ป่วย",
    clinicalContext: "ในห้องปฏิบัติการใช้เพื่อตัดสินว่าผลการตรวจวิเคราะห์ในรอบการทดสอบนั้นยอมรับได้หรือไม่ โดยบันทึกค่าลงใน Levey-Jennings Chart และประเมินด้วย Westgard Multirules",
    originalSourceUrl: "https://clsi.org/shop/standards/qms01/",
    suggestedPrompt: "อธิบายความแตกต่างระหว่าง Internal Quality Control (IQC) และ External Quality Assessment (EQA) พร้อมแนวทางปฏิบัติในห้องปฏิบัติการ"
  },
  {
    id: "TERM-02",
    subjectId: "dtm-qc-mgmt",
    termEn: "Equipment Calibration",
    termTh: "การสอบเทียบเครื่องมือ",
    phoneticTh: "อีควิปเมนท์ แคลิเบรชัน",
    definitionTh: "กระบวนการกำหนดหรือทวนสอบความสัมพันธ์ระหว่างค่าที่เครื่องมือวัดได้กับค่าอ้างอิงมาตรฐานที่ตรวจสอบย้อนกลับได้ (Traceable standard)",
    clinicalContext: "การสอบเทียบเป็นการตรวจวัดความคลาดเคลื่อน โดยยังไม่จำเป็นต้องทำการปรับแต่ง (Adjustment) เครื่องมือทุกครั้ง เว้นแต่ผลการสอบเทียบจะเบี่ยงเบนเกินเกณฑ์ที่กำหนด",
    suggestedPrompt: "อธิบายความแตกต่างระหว่าง Calibration, Verification, และ Preventive Maintenance ในงานจัดการเครื่องมือตรวจวิเคราะห์"
  },
  {
    id: "TERM-03",
    subjectId: "dtm-qc-mgmt",
    termEn: "Laboratory Information System (LIS)",
    termTh: "ระบบสารสนเทศห้องปฏิบัติการทางการแพทย์",
    phoneticTh: "แลบบอราทอรี อินฟอร์เมชัน ซิสเต็ม",
    definitionTh: "ระบบซอฟต์แวร์ที่ออกแบบมาเพื่อบันทึก จัดเก็บ ประมวลผล และรายงานข้อมูลการตรวจทางห้องปฏิบัติการทางการแพทย์ที่เกี่ยวข้องกับผู้ป่วย",
    clinicalContext: "ทำหน้าที่รับคำสั่งตรวจ (Test Ordering), ติดตามสิ่งส่งตรวจ, เชื่อมต่อเครื่องตรวจอัตโนมัติ (Instrument Interfacing), และส่งผลไปยังระบบโรงพยาบาล (HIS/EMR)",
    suggestedPrompt: "อธิบายโครงสร้างและหน้าที่สำคัญของระบบ LIS และการเชื่อมโยงข้อมูลกับระบบเวชระเบียนอิเล็กทรอนิกส์ (EMR)"
  },
  {
    id: "TERM-04",
    subjectId: "dtm-qc-mgmt",
    termEn: "Laboratory Information Management System (LIMS)",
    termTh: "ระบบการจัดการข้อมูลห้องปฏิบัติการ",
    phoneticTh: "แลบบอราทอรี อินฟอร์เมชัน เมเนจเมนต์ ซิสเต็ม",
    definitionTh: "ระบบซอฟต์แวร์ที่มักเน้นการจัดการตัวอย่าง สต็อกสารเคมี เครื่องมือ และเวิร์กโฟลว์ของห้องปฏิบัติการทดสอบทางวิทยาศาสตร์หรืออุตสาหกรรม",
    clinicalContext: "มักเน้นการจัดการตัวอย่างสิ่งแวดล้อม การจัดการตารางสอบเทียบเครื่องมือ และรองรับมาตรฐาน ISO/IEC 17025",
    suggestedPrompt: "เปรียบเทียบความแตกต่างระหว่าง LIS และ LIMS ในด้านสถาปัตยกรรมระบบและกลุ่มผู้ใช้งาน"
  },
  {
    id: "TERM-05",
    subjectId: "dtm-mol-dx",
    termEn: "Quantification Cycle (Cq / Ct)",
    termTh: "รอบเกณฑ์การเพิ่มขยายสารพันธุกรรม",
    phoneticTh: "ควอนทิฟิเคชัน ไซเคิล / เทรชโฮลด์ ไซเคิล",
    definitionTh: "รอบการเพิ่มขยายในการตรวจ Real-Time qPCR ที่สัญญาณเรืองแสง (Fluorescence) เพิ่มขึ้นสูงกว่าระดับเส้นพื้นฐาน (Baseline Threshold) อย่างมีนัยสำคัญ",
    clinicalContext: "ค่า Cq หรือ Ct มีความสัมพันธ์แปรผกผันกับปริมาณกรดนิวคลีอิกตั้งต้น (ยิ่งมีเชื้อเริ่มต้นมาก ค่า Ct ยิ่งต่ำ) ใช้ในการวัดปริมาณไวรัส (Viral Load) เช่น ไวรัส HIV หรือไวรัสตับอักเสบ",
    originalSourceUrl: "https://academic.oup.com/clinchem/article/71/6/634/8119148",
    suggestedPrompt: "อธิบายความหมายและข้อควรระวังในการแปลผลค่า Ct ในการตรวจวินิจฉัยเชื้อไวรัสทางห้องปฏิบัติการโมเลกุล"
  },
  {
    id: "TERM-06",
    subjectId: "suppl-hema",
    termEn: "EDTA-Dependent Pseudothrombocytopenia",
    termTh: "ภาวะเกล็ดเลือดต่ำลวงจากสารกันเลือดแข็ง EDTA",
    phoneticTh: "อีดีทีเอ-ดีเพนเดนต์ สูโดทรอมโบไซโตพีเนีย",
    definitionTh: "ปรากฏการณ์ภายนอกร่างกาย (In vitro artifact) ที่เกล็ดเลือดเกิดการเกาะกลุ่ม (Platelet clumping) เมื่อสัมผัสกับสารกันเลือดแข็งชนิด EDTA ทำให้เครื่องนับเกล็ดเลือดอัตโนมัติรายงานค่าต่ำกว่าความเป็นจริง",
    clinicalContext: "ผู้ป่วยไม่มีอาการเลือดออกจริง ยืนยันได้โดยการตรวจฟิล์มเลือดพบเกล็ดเลือดเกาะกลุ่ม และทำการเจาะเลือดซ้ำด้วยหลอดเก็บเลือดชนิด Sodium Citrate หรือ Heparin เพื่อตรวจนับใหม่",
    originalSourceUrl: "https://pubmed.ncbi.nlm.nih.gov/25425098/",
    suggestedPrompt: "อธิบายกลไกของภาวะเกล็ดเลือดต่ำลวงจากสาร EDTA (Pseudothrombocytopenia) และแนวทางการจัดการในห้องปฏิบัติการโลหิตวิทยา"
  },
  {
    id: "TERM-07",
    subjectId: "suppl-hema",
    termEn: "Flow Cytometry",
    termTh: "โฟลไซโทเมทรี",
    phoneticTh: "โฟล ไซทอมเมทรี",
    definitionTh: "เทคนิคการตรวจวิเคราะห์เซลล์หรืออนุภาคที่แขวนลอยในของเหลว โดยวัดคุณสมบัติทางกายภาพและสารเรืองแสงขณะเซลล์ไหลผ่านลำแสงเลเซอร์ทีละเซลล์",
    clinicalContext: "ใช้ Forward Scatter (FSC) วัดขนาดเซลล์ และ Side Scatter (SSC) วัดความซับซ้อนภายในเซลล์ ร่วมกับ Fluorescent Antibodies เพื่อตรวจนับ CD4 ในผู้ป่วย HIV หรือจำแนกเซลล์มะเร็งเม็ดเลือดขาว",
    originalSourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK608011/",
    suggestedPrompt: "อธิบายหลักการทำงานของ Flow Cytometry และการใช้ Forward Scatter (FSC) และ Side Scatter (SSC) ในการแยกชนิดเม็ดเลือดขาว"
  }
];

// Phase C1: Evidentiary Claims
export const curatedClaims: Claim[] = [
  {
    claimId: "CLAIM-CBC-WBC-REF",
    claimText: "CLSI H20 3rd Edition (2026) establishes reference method for automated and semiautomated WBC differential counts, replacing H20-A2.",
    subjectArea: "suppl-hema",
    sourceScope: "CLSI H20 3rd Ed",
    contentVersion: "1.2"
  },
  {
    claimId: "CLAIM-CBC-EDTA-PLATELET",
    claimText: "Discovery and Correction of Spurious Low Platelet Counts due to EDTA-Dependent Pseudothrombocytopenia requires peripheral smear review and alternative anticoagulant.",
    subjectArea: "suppl-hema",
    sourceScope: "PubMed 25425098",
    contentVersion: "1.2"
  },
  {
    claimId: "CLAIM-QC-WESTGARD-REJECT",
    claimText: "Westgard 1-3s and 2-2s multirule violations in Levey-Jennings charts detect random and systematic errors requiring analytical run rejection.",
    subjectArea: "dtm-lab-mgmt",
    sourceScope: "ISO 15189 & Westgard QC",
    contentVersion: "1.2"
  },
  {
    claimId: "CLAIM-FLOW-FSC-SSC",
    claimText: "In Flow Cytometry, Forward Scatter (FSC) correlates with cell volume/size while Side Scatter (SSC) correlates with internal complexity/granularity.",
    subjectArea: "suppl-hema",
    sourceScope: "NCBI NBK608011",
    contentVersion: "1.2"
  }
];

// Phase C1: Evidence Links explicitly binding Claim Version and Reference Version
export const curatedEvidenceLinks: EvidenceLink[] = [
  {
    id: "EV-LINK-01",
    claimId: "CLAIM-CBC-WBC-REF",
    claimVersion: "1.2",
    referenceId: "REF-CLSI-H20-3RD",
    referenceVersion: "1.2",
    supportStatus: "supported",
    evidenceExcerpt: "CLSI H20 (3rd ed., April 2026) specifies reference manual visual differential count.",
    isVersionAligned: true
  },
  {
    id: "EV-LINK-02",
    claimId: "CLAIM-CBC-EDTA-PLATELET",
    claimVersion: "1.2",
    referenceId: "REF-PUBMED-25425098",
    referenceVersion: "1.2",
    supportStatus: "supported",
    evidenceExcerpt: "PubMed PMID 25425098 describes diagnostic workup for spurious thrombocytopenia.",
    isVersionAligned: true
  },
  {
    id: "EV-LINK-03",
    claimId: "CLAIM-FLOW-FSC-SSC",
    claimVersion: "1.2",
    referenceId: "REF-NCBI-NBK608011",
    referenceVersion: "1.2",
    supportStatus: "supported",
    evidenceExcerpt: "StatPearls NBK608011 notes FSC cell size and SSC inner complexity correlation.",
    isVersionAligned: true
  }
];

// Phase C1.1 Corrective: Static Baseline Audit Trail Records (Read-only sample log in memory, not a production ledger)
// Note: In-memory Object.freeze protects baseline objects from runtime mutation within process, but does not provide database persistence or append-only tamper-proofing across sessions.
export const curatedAuditTrail: readonly AuditTrailRecord[] = Object.freeze([
  Object.freeze({
    recordId: "AUDIT-001",
    entityType: "reference",
    entityId: "REF-CLSI-H20-3RD",
    action: "create",
    newStatus: "unverified",
    actorId: "system_initializer",
    timestamp: "2026-10-16T11:00:00.000Z",
    reason: "Initial baseline ingestion with CLSI H20 3rd Edition (2026)"
  }),
  Object.freeze({
    recordId: "AUDIT-002",
    entityType: "reference",
    entityId: "REF-PUBMED-25425098",
    action: "create",
    newStatus: "unverified",
    actorId: "system_initializer",
    timestamp: "2026-10-16T11:00:00.000Z",
    reason: "Added focused research reference for EDTA pseudothrombocytopenia"
  }),
  Object.freeze({
    recordId: "AUDIT-003",
    entityType: "evidence_link",
    entityId: "EV-LINK-01",
    action: "create",
    newStatus: "unverified",
    actorId: "system_initializer",
    timestamp: "2026-10-16T11:00:00.000Z",
    reason: "Binds CLAIM-CBC-WBC-REF v1.2 with REF-CLSI-H20-3RD v1.2"
  })
]);

// Phase C1.1: Semantic Evidence Version Alignment and Degradation Evaluator
// Compares link.claimVersion against the target Claim's current version,
// and link.referenceVersion against the target Reference's current version.
// Does NOT compare claimVersion directly with referenceVersion.
export function evaluateEvidenceLinkAlignment(
  link: EvidenceLink,
  allClaims: Claim[] = curatedClaims,
  allReferences: Reference[] = curatedReferences
): {
  isVersionAligned: boolean;
  effectiveStatus: 'verified' | 'needs_review' | 'unverified';
  reason?: string;
} {
  const targetClaim = allClaims.find(c => c.claimId === link.claimId);
  const targetRef = allReferences.find(r => r.referenceId === link.referenceId);

  // If target claim or reference entity is missing, cannot infer alignment
  if (!targetClaim || !targetRef) {
    return {
      isVersionAligned: false,
      effectiveStatus: 'needs_review',
      reason: `Target entity missing for audit (claim found: ${!!targetClaim}, reference found: ${!!targetRef}). Re-review required.`
    };
  }

  // Semantic version check:
  // 1) link.claimVersion must match targetClaim.contentVersion
  // 2) link.referenceVersion must match targetRef.contentVersion
  const claimMatches = link.claimVersion === targetClaim.contentVersion;
  const refMatches = link.referenceVersion === targetRef.contentVersion;

  if (!claimMatches || !refMatches) {
    const driftDetails: string[] = [];
    if (!claimMatches) {
      driftDetails.push(`Claim v${link.claimVersion} (current: v${targetClaim.contentVersion})`);
    }
    if (!refMatches) {
      driftDetails.push(`Reference v${link.referenceVersion} (current: v${targetRef.contentVersion})`);
    }
    return {
      isVersionAligned: false,
      effectiveStatus: 'needs_review',
      reason: `Version drift detected: ${driftDetails.join(', ')}. Re-review required.`
    };
  }

  // Without authorized reviewer and verified decision, it cannot be verified
  if (link.reviewDecision === 'verified' && link.reviewedBy && link.reviewedAt) {
    return {
      isVersionAligned: true,
      effectiveStatus: 'verified',
      reason: `Verified by ${link.reviewedBy} on ${link.reviewedAt}`
    };
  }

  return {
    isVersionAligned: true,
    effectiveStatus: link.supportStatus === 'supported' ? 'needs_review' : 'unverified',
    reason: 'Awaiting authorized reviewer confirmation'
  };
}
