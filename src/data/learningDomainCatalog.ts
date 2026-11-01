import {
  LearningDomainGroup,
  LearningDomainTopic,
  LearningDomainGroupId,
  StudyWorkflowType
} from '../models/coreModel';

export type {
  LearningDomainGroup,
  LearningDomainTopic,
  LearningDomainGroupId,
  StudyWorkflowType
};

export interface StudyWorkflowOption {
  id: StudyWorkflowType;
  labelTh: string;
  labelEn: string;
  descriptionTh: string;
  iconName: string;
  promptPrefix: string;
  // Aliases for compatibility
  nameTh: string;
  nameEn: string;
  description: string;
  icon: string;
  guideline: string;
}

export const STUDY_WORKFLOW_OPTIONS: StudyWorkflowOption[] = [
  {
    id: 'explain',
    labelTh: 'อธิบายแนวคิด',
    labelEn: 'Explain Concept',
    descriptionTh: 'อธิบายหลักการทางวิชาการ นิยาม และกลไกพื้นฐานถึงระดับลึกอย่างเป็นลำดับ',
    iconName: 'BookOpen',
    promptPrefix: 'ช่วยอธิบายแนวคิดพื้นฐานถึงเชิงลึก หลักการสำคัญ และข้อควรระวังทางวิชาการเกี่ยวกับ',
    nameTh: 'อธิบายแนวคิด',
    nameEn: 'Explain Concept',
    description: 'อธิบายหลักการทางวิชาการ นิยาม และกลไกพื้นฐานถึงระดับลึกอย่างเป็นลำดับ',
    icon: '💡',
    guideline: 'อธิบายแนวคิดพื้นฐาน นิยาม กลไก และข้อควรระวังทางวิชาการ'
  },
  {
    id: 'compare',
    labelTh: 'เปรียบเทียบข้อแตกต่าง',
    labelEn: 'Compare & Contrast',
    descriptionTh: 'เปรียบเทียบสิ่งที่มีความคล้ายคลึง ข้อดี-ข้อจำกัด และข้อบ่งชี้ในการเลือกใช้',
    iconName: 'GitCompare',
    promptPrefix: 'ช่วยเปรียบเทียบความแตกต่างและความเหมือน ข้อดี-ข้อจำกัด และการเลือกใช้ในทางปฏิบัติของ',
    nameTh: 'เปรียบเทียบจุดต่าง',
    nameEn: 'Compare & Contrast',
    description: 'เปรียบเทียบสิ่งที่มีความคล้ายคลึง ข้อดี-ข้อจำกัด และข้อบ่งชี้ในการเลือกใช้',
    icon: '⚖️',
    guideline: 'เปรียบเทียบความแตกต่าง จุดร่วม ข้อดี-ข้อจำกัด พร้อมตารางหรือประเด็นสรุป'
  },
  {
    id: 'step_by_step',
    labelTh: 'ลำดับขั้นตอน / กลไก',
    labelEn: 'Step-by-Step Procedure',
    descriptionTh: 'อธิบายขั้นตอนการปฏิบัติงานในห้องปฏิบัติการหรือกระบวนการทำงานของระบบดิจิทัลทีละขั้นตอน',
    iconName: 'ListOrdered',
    promptPrefix: 'ช่วยอธิบายลำดับขั้นตอนการปฏิบัติงาน (Step-by-step SOP / Pipeline) จุดวิกฤตที่ต้องระวัง และการควบคุมคุณภาพของ',
    nameTh: 'ขั้นตอนปฏิบัติ',
    nameEn: 'Step-by-Step Procedure',
    description: 'อธิบายขั้นตอนการปฏิบัติงานในห้องปฏิบัติการหรือกระบวนการทำงานของระบบดิจิทัลทีละขั้นตอน',
    icon: '📋',
    guideline: 'อธิบายขั้นตอนทีละขั้น (Step-by-Step) จุดวิกฤต (Critical points) และการควบคุมคุณภาพ'
  },
  {
    id: 'clinical_dtm_application',
    labelTh: 'การประยุกต์ใช้ทางคลินิก / DTM',
    labelEn: 'Clinical & DTM Application',
    descriptionTh: 'แสดงตัวอย่างสถานการณ์จริงในโรงพยาบาล ห้องปฏิบัติการ และระบบสุขภาพดิจิทัล',
    iconName: 'Activity',
    promptPrefix: 'ช่วยยกตัวอย่างการนำไปประยุกต์ใช้จริงในงานบริการทางคลินิก ห้องปฏิบัติการ และระบบเทคโนโลยีดิจิทัลทางการแพทย์ (DTM) ของ',
    nameTh: 'ประยุกต์คลินิก/DTM',
    nameEn: 'Clinical & DTM Application',
    description: 'แสดงตัวอย่างสถานการณ์จริงในโรงพยาบาล ห้องปฏิบัติการ และระบบสุขภาพดิจิทัล',
    icon: '🏥',
    guideline: 'ยกตัวอย่างการประยุกต์ใช้จริงในโรงพยาบาล คลินิก หรือระบบเทคโนโลยีดิจิทัลทางการแพทย์'
  },
  {
    id: 'vocabulary',
    labelTh: 'ศัพท์เทคนิคภาษาอังกฤษ',
    labelEn: 'Technical Vocabulary',
    descriptionTh: 'สรุปศัพท์เทคนิค คำย่อทางการแพทย์และคอมพิวเตอร์ รากศัพท์ และตัวอย่างการใช้ในเวชระเบียน',
    iconName: 'Languages',
    promptPrefix: 'ช่วยสรุปศัพท์เทคนิคภาษาอังกฤษ (Technical Terms), คำย่อ, รากศัพท์ (Root/Prefix/Suffix) และตัวอย่างการบันทึกข้อมูลเกี่ยวกับ',
    nameTh: 'ศัพท์เทคนิค',
    nameEn: 'Technical Vocabulary',
    description: 'สรุปศัพท์เทคนิค คำย่อทางการแพทย์และคอมพิวเตอร์ รากศัพท์ และตัวอย่างการใช้ในเวชระเบียน',
    icon: '📖',
    guideline: 'ระบุศัพท์เทคนิคภาษาอังกฤษ คำย่อ รากศัพท์ และความหมายอย่างเป็นระบบ'
  },
  {
    id: 'quiz_review',
    labelTh: 'แบบทบทวนความเข้าใจ',
    labelEn: 'Review Quiz & Self-Check',
    descriptionTh: 'แบบทดสอบประเมินตนเองพร้อมเฉลยและเหตุผลทางวิชาการเพื่อทบทวนบทเรียน',
    iconName: 'HelpCircle',
    promptPrefix: 'ช่วยสร้างคำถามทบทวนความเข้าใจ (Self-assessment Quiz) 3-4 ข้อ พร้อมเฉลยและเหตุผลประกอบทางวิชาการเกี่ยวกับ',
    nameTh: 'คำถามทบทวน',
    nameEn: 'Review Quiz',
    description: 'แบบทดสอบประเมินตนเองพร้อมเฉลยและเหตุผลทางวิชาการเพื่อทบทวนบทเรียน',
    icon: '✍️',
    guideline: 'จัดทำคำถามทบทวน 3-4 ข้อ พร้อมเฉลยละเอียดและเหตุผลทางวิชาการ'
  }
];

export const LEARNING_DOMAIN_GROUPS: LearningDomainGroup[] = [
  {
    id: 'medical_foundations',
    nameTh: 'วิทยาศาสตร์การแพทย์พื้นฐาน',
    nameEn: 'Medical Foundations',
    descriptionTh: 'รากฐานทางวิทยาศาสตร์การแพทย์ กายวิภาค สรีรวิทยา ชีววิทยาโมเลกุล และจุลชีววิทยา',
    iconName: 'HeartPulse'
  },
  {
    id: 'medical_technology',
    nameTh: 'เทคนิคการแพทย์และการตรวจวินิจฉัย',
    nameEn: 'Medical Technology',
    descriptionTh: 'วิทยาการตรวจวิเคราะห์ทางห้องปฏิบัติการคลินิก เคมี โลหิตวิทยา ธนาคารเลือด โมเลกุล และการควบคุมคุณภาพ',
    iconName: 'Microscope'
  },
  {
    id: 'digital_health_dtm',
    nameTh: 'เทคโนโลยีดิจิทัลทางการแพทย์ (DTM)',
    nameEn: 'Digital Health & DTM',
    descriptionTh: 'ระบบสารสนเทศสุขภาพ เวชระเบียนอิเล็กทรอนิกส์ มาตรฐาน HL7 FHIR/DICOM, AI และความมั่นคงปลอดภัยไซเบอร์',
    iconName: 'Cpu'
  }
];

export const LEARNING_DOMAIN_TOPICS: LearningDomainTopic[] = [
  // =========================================================================
  // หมวด A: วิทยาศาสตร์การแพทย์พื้นฐาน (Medical Foundations)
  // =========================================================================
  {
    id: 'mf-anatomy-physiology',
    groupId: 'medical_foundations',
    nameTh: 'กายวิภาคศาสตร์และสรีรวิทยา',
    nameEn: 'Anatomy and Physiology',
    keywords: ['anatomy', 'physiology', 'ระบบร่างกาย', 'อวัยวะ', 'กล้ามเนื้อ', 'หัวใจ', 'ปอด', 'หลอดเลือด', 'เซลล์', 'สรีรวิทยา'],
    aliases: ['กายวิภาค', 'สรีรวิทยาของมนุษย์', 'Human Anatomy & Physiology'],
    description: 'การศึกษาโครงสร้างและตำแหน่งของอวัยวะ (Anatomy) ตลอดจนกลไกการทำงานของระบบต่างๆ ในร่างกายมนุษย์ (Physiology) เพื่อเป็นพื้นฐานในการแปลผลการตรวจวิเคราะห์',
    scope: 'ระบบไหลเวียนโลหิต, ระบบทางเดินหายใจ, ระบบประสาท, ระบบขับถ่ายปัสสาวะ, ระบบทางเดินอาหาร, และระบบต่อมไร้ท่อ',
    recommendedLevel: 'introductory',
    prerequisites: ['ความรู้พื้นฐานชีววิทยาระดับมัธยมศึกษาตอนปลาย'],
    relatedTopicIds: ['mf-cell-biology', 'mt-hematology', 'dtm-medical-terminology'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-cell-biology',
    groupId: 'medical_foundations',
    nameTh: 'ชีววิทยาของเซลล์',
    nameEn: 'Cell Biology',
    keywords: ['cell', 'organelle', 'membrane', 'mitochondria', 'nucleus', 'เซลล์', 'ออร์แกเนลล์', 'เยื่อหุ้มเซลล์'],
    aliases: ['ชีววิทยาเซลล์', 'Cellular Biology'],
    description: 'การศึกษาโครงสร้าง หน้าที่ และเมแทบอลิซึมระดับเซลล์ การขนส่งสารผ่านเยื่อหุ้มเซลล์ และการส่งสัญญาณระหว่างเซลล์ (Signal Transduction)',
    scope: 'เยื่อหุ้มเซลล์, การแบ่งเซลล์ (Mitosis/Meiosis), ออร์แกเนลล์, เมแทบอลิซึมพลังงาน, และการตายของเซลล์ (Apoptosis)',
    recommendedLevel: 'introductory',
    prerequisites: ['mf-anatomy-physiology'],
    relatedTopicIds: ['mf-biochemistry', 'mf-genetics-molbio'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-biochemistry',
    groupId: 'medical_foundations',
    nameTh: 'ชีวเคมีทางการแพทย์',
    nameEn: 'Biochemistry',
    keywords: ['biochemistry', 'protein', 'enzyme', 'metabolism', 'glucose', 'lipid', 'ชีวเคมี', 'เอนไซม์', 'เมแทบอลิซึม'],
    aliases: ['เคมีชีวภาพทางการแพทย์', 'Medical Biochemistry'],
    description: 'โครงสร้างทางเคมี สมบัติ และปฏิกิริยาของชีวโมเลกุลในสิ่งมีชีวิต เช่น คาร์โบไฮเดรต โปรตีน ลิพิด กรดนิวคลีอิก และจลนศาสตร์ของเอนไซม์',
    scope: 'Glycolysis, Krebs cycle, Oxidative phosphorylation, เอนไซม์และโคเอนไซม์, เมแทบอลิซึมไขมันและกรดอะมิโน',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-cell-biology'],
    relatedTopicIds: ['mt-clinical-chemistry', 'mf-genetics-molbio'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-genetics-molbio',
    groupId: 'medical_foundations',
    nameTh: 'พันธุศาสตร์และชีววิทยาโมเลกุล',
    nameEn: 'Genetics and Molecular Biology',
    keywords: ['dna', 'rna', 'gene', 'transcription', 'translation', 'mutation', 'พันธุศาสตร์', 'ดีเอ็นเอ', 'การกลายพันธุ์'],
    aliases: ['ชีววิทยาโมเลกุล', 'Medical Genetics & Molecular Biology'],
    description: 'หลักการถ่ายทอดลักษณะทางพันธุกรรม โครงสร้างของ DNA/RNA กลไก Central Dogma (Replication, Transcription, Translation) และการกลายพันธุ์',
    scope: 'โครงสร้างโครโมโซม, Central Dogma, การควบคุมการแสดงออกของยีน, โรคทางพันธุกรรม, และเทคนิค recombinant DNA',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-cell-biology', 'mf-biochemistry'],
    relatedTopicIds: ['mt-molecular-diagnostics'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-immunology',
    groupId: 'medical_foundations',
    nameTh: 'วิทยาภูมิคุ้มกัน',
    nameEn: 'Immunology',
    keywords: ['immune', 'antibody', 'antigen', 't-cell', 'b-cell', 'ภูมิคุ้มกัน', 'แอนติบอดี', 'แอนติเจน'],
    aliases: ['ระบบภูมิคุ้มกัน', 'Basic Immunology'],
    description: 'กลไกการป้องกันตนเองของร่างกายจากสิ่งแปลกปลอม ทั้งระบบภูมิคุ้มกันแต่กำเนิด (Innate Immunity) และระบบภูมิคุ้มกันแบบจำเพาะ (Adaptive Immunity)',
    scope: 'เซลล์และอวัยวะในระบบภูมิคุ้มกัน, แอนติเจนและแอนติบอดี (Immunoglobulins), Complement system, ภาวะภูมิแพ้ และภูมิต้านตนเอง',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-cell-biology'],
    relatedTopicIds: ['mt-immunology-serology', 'mt-transfusion-medicine'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-pathology',
    groupId: 'medical_foundations',
    nameTh: 'พยาธิวิทยา',
    nameEn: 'Pathology',
    keywords: ['pathology', 'disease', 'inflammation', 'necrosis', 'neoplasia', 'พยาธิวิทยา', 'การอักเสบ', 'เนื้องอก'],
    aliases: ['พยาธิสรีรวิทยา', 'General Pathology'],
    description: 'การศึกษาสาเหตุ กลไกการเกิดโรค (Pathogenesis) การเปลี่ยนแปลงโครงสร้างเนื้อเยื่อ และผลกระทบต่อสรีรวิทยาของอวัยวะ',
    scope: 'การบาดเจ็บของเซลล์ (Cell injury), การอักเสบ (Inflammation & Healing), ความผิดปกติของการไหลเวียนเลือด, และมะเร็ง (Neoplasia)',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-anatomy-physiology', 'mf-cell-biology'],
    relatedTopicIds: ['mt-clinical-chemistry', 'mt-hematology'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-microbiology',
    groupId: 'medical_foundations',
    nameTh: 'จุลชีววิทยา',
    nameEn: 'Microbiology',
    keywords: ['bacteria', 'virus', 'fungi', 'microbiology', 'เชื้อโรค', 'แบคทีเรีย', 'ไวรัส', 'เชื้อรา'],
    aliases: ['จุลชีววิทยาทั่วไป', 'General Microbiology'],
    description: 'การศึกษาลักษณะ สัณฐานวิทยา เมแทบอลิซึม การเจริญเติบโต และการควบคุมจุลชีพที่มีความสำคัญทางการแพทย์',
    scope: 'แบคทีเรีย, ไวรัส, เชื้อรา, สารต้านจุลชีพ และการดื้อยา (Antimicrobial resistance)',
    recommendedLevel: 'introductory',
    prerequisites: ['mf-cell-biology'],
    relatedTopicIds: ['mt-clinical-microbiology', 'mf-parasitology'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mf-parasitology',
    groupId: 'medical_foundations',
    nameTh: 'ปรสิตวิทยาทางการแพทย์',
    nameEn: 'Parasitology',
    keywords: ['parasite', 'protozoa', 'helminth', 'malaria', 'ปรสิต', 'โปรโตซัว', 'หนอนพยาธิ', 'มาลาเรีย'],
    aliases: ['ปรสิตวิทยาคลินิก', 'Medical Parasitology'],
    description: 'การศึกษาวงจรชีวิต สัณฐานวิทยา พยาธิสภาพ และการตรวจวินิจฉัยโปรโตซัว หนอนพยาธิ และสัตว์ขาข้อที่เป็นพาหะนำโรคในมนุษย์',
    scope: 'Protozoa ทางเดินอาหารและเลือด (เช่น Plasmodium, Entamoeba), Nematodes, Cestodes, Trematodes, และ Arthropods',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-microbiology'],
    relatedTopicIds: ['mt-clinical-microscopy', 'mt-clinical-microbiology'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },

  // =========================================================================
  // หมวด B: เทคนิคการแพทย์และการตรวจวินิจฉัย (Medical Technology)
  // =========================================================================
  {
    id: 'mt-hematology',
    groupId: 'medical_technology',
    nameTh: 'โลหิตวิทยาคลินิก',
    nameEn: 'Hematology',
    keywords: ['hematology', 'cbc', 'hemoglobin', 'hematocrit', 'wbc', 'rbc', 'platelet', 'leukemia', 'โลหิตวิทยา', 'เม็ดเลือด'],
    aliases: ['การตรวจความสมบูรณ์ของเม็ดเลือด', 'Clinical Hematology'],
    description: 'การตรวจวิเคราะห์ความสมบูรณ์ของเม็ดเลือด (Complete Blood Count: CBC) การตรวจสเมียร์เลือด รูปร่างเม็ดเลือด และความผิดปกติทางโลหิตวิทยา',
    scope: 'พารามิเตอร์ CBC (Hb, Hct, MCV, MCH, MCHC, RDW), เม็ดเลือดขาวชนิดต่างๆ, เกล็ดเลือด, ภาวะโลหิตจาง, และลูคีเมีย',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-anatomy-physiology', 'mf-cell-biology'],
    relatedTopicIds: ['mt-immunology-serology', 'mt-quality-control'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: cbc, dengue
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-clinical-chemistry',
    groupId: 'medical_technology',
    nameTh: 'เคมีคลินิก',
    nameEn: 'Clinical Chemistry',
    keywords: ['chemistry', 'serum', 'plasma', 'electrolytes', 'glucose', 'bun', 'creatinine', 'alt', 'เคมีคลินิก', 'ซีรั่ม', 'พลาสมา'],
    aliases: ['ชีวเคมีคลินิก', 'Clinical Biochemistry'],
    description: 'การตรวจวิเคราะห์สารชีวเคมี เอนไซม์ อิเล็กโทรไลต์ ฮอร์โมน และเมแทบอไลต์ในซีรั่มและพลาสมา เพื่อประเมินการทำงานของตับ ไต หัวใจ และระบบเมแทบอลิซึม',
    scope: 'ความแตกต่างของ Serum vs Plasma, หลอดเก็บสิ่งส่งตรวจ, การตรวจการทำงานของไต (BUN/Cr), การทำงานของตับ (AST/ALT/ALP), เกลือแร่ (Electrolytes)',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-biochemistry'],
    relatedTopicIds: ['mt-quality-control', 'mt-lab-instrumentation'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: serum
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-clinical-microbiology',
    groupId: 'medical_technology',
    nameTh: 'จุลชีววิทยาคลินิก',
    nameEn: 'Clinical Microbiology',
    keywords: ['microbiology', 'gram stain', 'culture', 'susceptibility', 'ย้อมสีแกรม', 'เพาะเชื้อ', 'การทดสอบความไว'],
    aliases: ['การตรวจวินิจฉัยทางจุลชีววิทยา', 'Diagnostic Microbiology'],
    description: 'การย้อมสี การเพาะเลี้ยง การจำแนกชนิดแบคทีเรียก่อโรค และการทดสอบความไวต่อสารต้านจุลชีพ (Antimicrobial Susceptibility Testing: AST)',
    scope: 'ขั้นตอนและหลักการย้อมสีแกรม (Gram Stain), การควบคุมคุณภาพสี, อาหารเลี้ยงเชื้อ, และเกณฑ์มาตรฐานสากล (CLSI/EUCAST)',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-microbiology'],
    relatedTopicIds: ['mt-molecular-diagnostics', 'mt-quality-control'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: gram
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-immunology-serology',
    groupId: 'medical_technology',
    nameTh: 'วิทยาภูมิคุ้มกันคลินิกและซีโรโลยี',
    nameEn: 'Clinical Immunology and Serology',
    keywords: ['immunology', 'serology', 'flow cytometry', 'elisa', 'cd4', 'cd8', 'แอนติบอดี', 'โฟลไซโทเมทรี'],
    aliases: ['การตรวจวิเคราะห์ทางซีโรโลยี', 'Immunodiagnostics'],
    description: 'การตรวจวิเคราะห์แอนติเจนและแอนติบอดีในซีรั่ม (Serological tests), เทคนิค ELISA, Rapid tests และการวิเคราะห์เซลล์เดี่ยวด้วย Flow Cytometry',
    scope: 'Flow Cytometry (FSC/SSC, CD markers), การตรวจคัดกรองโรคติดเชื้อ (HIV, Viral Hepatitis), และการประเมินภาวะภูมิคุ้มกัน',
    recommendedLevel: 'intermediate',
    prerequisites: ['mf-immunology'],
    relatedTopicIds: ['mt-hematology', 'mt-transfusion-medicine'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: flow
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-transfusion-medicine',
    groupId: 'medical_technology',
    nameTh: 'เวชศาสตร์การบริการโลหิตและธนาคารเลือด',
    nameEn: 'Transfusion Medicine',
    keywords: ['blood bank', 'crossmatch', 'abo', 'rh', 'coombs', 'ธนาคารเลือด', 'ตรวจหมู่เลือด', 'ครอสแมตช์'],
    aliases: ['ธนาคารเลือด', 'Immunohematology & Blood Banking'],
    description: 'การตรวจหมู่เลือดระบบ ABO และ Rh, การทดสอบความเข้ากันได้ของเลือด (Crossmatching), การตรวจกรองแอนติบอดี และความปลอดภัยในการให้เลือด',
    scope: 'Major/Minor Crossmatch, Immediate spin, 37°C AHG phase, Coombs test (DAT/IAT), และการเตรียมส่วนประกอบของเลือด (Blood Components)',
    recommendedLevel: 'advanced',
    prerequisites: ['mf-immunology', 'mt-hematology'],
    relatedTopicIds: ['mt-immunology-serology', 'mt-quality-control'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: cross
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-clinical-microscopy',
    groupId: 'medical_technology',
    nameTh: 'จุลทรรศน์ศาสตร์คลินิกและตรวจปัสสาวะ',
    nameEn: 'Clinical Microscopy & Urinalysis',
    keywords: ['urinalysis', 'microscopy', 'sediment', 'urine dipstick', 'ตรวจปัสสาวะ', 'ตะกอนปัสสาวะ', 'กล้องจุลทรรศน์'],
    aliases: ['การตรวจปัสสาวะและสารคัดหลั่ง', 'Body Fluid Analysis'],
    description: 'การตรวจวิเคราะห์ปัสสาวะทางกายภาพ เคมี และการส่องกล้องจุลทรรศน์ตรวจตะกอน (Casts, Crystals, Cells) ตลอดจนการตรวจอุจจาระและของเหลวในโพรงร่างกาย',
    scope: 'แถบตรวจปัสสาวะ (Dipstick chemical tests), การส่องตะกอนปัสสาวะ, การตรวจวิเคราะห์น้ำไขสันหลัง (CSF), และของเหลวจากข้อ',
    recommendedLevel: 'introductory',
    prerequisites: ['mf-anatomy-physiology'],
    relatedTopicIds: ['mt-clinical-chemistry', 'mt-hematology'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-molecular-diagnostics',
    groupId: 'medical_technology',
    nameTh: 'การวินิจฉัยระดับโมเลกุล',
    nameEn: 'Molecular Diagnostics',
    keywords: ['pcr', 'qpcr', 'real-time pcr', 'sequencing', 'ct', 'cq', 'miqe', 'โมเลกุล', 'พีซีอาร์'],
    aliases: ['การตรวจวินิจฉัยโมเลกุล', 'Molecular Pathology'],
    description: 'การตรวจวิเคราะห์สารพันธุกรรม DNA/RNA เพื่อตรวจหาเชื้อโรค ยีนกลายพันธุ์ และมะเร็ง ด้วยเทคนิค Conventional PCR, Real-Time PCR (qPCR) และ Sequencing',
    scope: 'Conventional vs qPCR, SYBR Green vs TaqMan probe, ค่า Cq/Ct, แนวทางมาตรฐาน MIQE 2.0 (2025), และ Viral load monitoring',
    recommendedLevel: 'advanced',
    prerequisites: ['mf-genetics-molbio', 'mt-clinical-microbiology'],
    relatedTopicIds: ['mt-lab-instrumentation', 'mt-quality-control'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: pcr
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-lab-instrumentation',
    groupId: 'medical_technology',
    nameTh: 'เครื่องมือตรวจวิเคราะห์ทางห้องปฏิบัติการ',
    nameEn: 'Laboratory Instrumentation',
    keywords: ['instrument', 'analyzer', 'spectrophotometer', 'flow cytometer', 'pcr machine', 'เครื่องตรวจแล็บ', 'ออโตเมชัน'],
    aliases: ['เครื่องมือวิทยาศาสตร์การแพทย์', 'Clinical Laboratory Instruments'],
    description: 'หลักการฟิสิกส์ การทำงาน และการบำรุงรักษาเครื่องมือวิเคราะห์อัตโนมัติ (Automated Analyzers) เช่น Spectrophotometer, Flow Cytometer, และ Thermal Cycler',
    scope: 'ระบบไฮดรอลิกส์, ระบบเชิงแสง (Optics/Laser), การปรับเทียบ (Calibration), และการเชื่อมต่อผลเข้าสู่ LIS',
    recommendedLevel: 'intermediate',
    prerequisites: ['mt-clinical-chemistry', 'mt-hematology'],
    relatedTopicIds: ['mt-quality-control', 'dtm-clinical-systems-ehr'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: flow, pcr
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'mt-quality-control',
    groupId: 'medical_technology',
    nameTh: 'การควบคุมและประกันคุณภาพห้องปฏิบัติการ',
    nameEn: 'Laboratory Quality Control and Assurance',
    keywords: ['westgard', 'levey-jennings', 'qc', 'qa', 'iqc', 'eqas', 'iso 15189', 'เวสต์การ์ด', 'ควบคุมคุณภาพ'],
    aliases: ['การควบคุมคุณภาพในห้องปฏิบัติการ', 'Laboratory QA/QC'],
    description: 'การควบคุมคุณภาพภายใน (IQC) ด้วยกฎ Westgard Multi-rules, แผนภูมิ Levey-Jennings, การประเมินความแม่นและความเที่ยง (Accuracy & Precision), และมาตรฐาน ISO 15189',
    scope: 'กฎ Westgard (1_3s, 2_2s, R_4s, 4_1s, 10_x), Systematic vs Random error, และการเข้าร่วมโครงการทดสอบความชำนาญภายนอก (EQAS)',
    recommendedLevel: 'intermediate',
    prerequisites: ['mt-clinical-chemistry', 'mt-hematology'],
    relatedTopicIds: ['mt-lab-instrumentation'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: westgard
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },

  // =========================================================================
  // หมวด C: เทคโนโลยีดิจิทัลทางการแพทย์ (Digital Health and DTM)
  // =========================================================================
  {
    id: 'dtm-medical-terminology',
    groupId: 'digital_health_dtm',
    nameTh: 'ศัพท์เทคนิคทางการแพทย์',
    nameEn: 'Medical Terminology',
    keywords: ['prefix', 'root', 'suffix', 'combining vowel', 'ศัพท์แพทย์', 'รากศัพท์', 'คำอุปสรรค', 'คำปัจจัย', 'dtm67-111'],
    aliases: ['การวิเคราะห์ศัพท์ทางการแพทย์', 'Medical Words Construction'],
    description: 'โครงสร้างคำศัพท์ทางการแพทย์ (Prefix, Root, Suffix, Combining form) จากรากภาษากรีกและละติน เพื่อใช้ในการสื่อสารทางคลินิกและระบบสารสนเทศสุขภาพ',
    scope: 'หลักการแยกชิ้นส่วนคำศัพท์, ศัพท์บอกตำแหน่งกายวิภาค, ศัพท์อาการและหัตถการ, และการลดความกำกวมของตัวย่อในเวชระเบียน',
    recommendedLevel: 'introductory',
    prerequisites: ['ทักษะภาษาอังกฤษพื้นฐาน'],
    relatedTopicIds: ['dtm-health-info-systems', 'dtm-clinical-nlp'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-111
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-111']
  },
  {
    id: 'dtm-health-info-systems',
    groupId: 'digital_health_dtm',
    nameTh: 'ระบบสารสนเทศสุขภาพและโรงพยาบาล',
    nameEn: 'Health Information Systems',
    keywords: ['his', 'health informatics', 'cdss', 'hospital system', 'ระบบโรงพยาบาล', 'สารสนเทศสุขภาพ', 'dtm67-212'],
    aliases: ['ระบบสารสนเทศโรงพยาบาล', 'Hospital Information Systems'],
    description: 'โครงสร้างและสถาปัตยกรรมของระบบสารสนเทศโรงพยาบาล (HIS), โมดูลงานทะเบียน คลินิก เภสัชกรรม และระบบสนับสนุนการตัดสินใจทางคลินิก (CDSS)',
    scope: 'ผังการไหลเวียนข้อมูลทางคลินิก (Clinical Workflow), CPOE, การเชื่อมต่อระบบสนับสนุน และการประเมินความปลอดภัยของผู้ป่วย',
    recommendedLevel: 'intermediate',
    prerequisites: ['dtm-medical-terminology'],
    relatedTopicIds: ['dtm-clinical-systems-ehr', 'dtm-standards-interoperability'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-212
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-212', 'DTM67-123']
  },
  {
    id: 'dtm-clinical-systems-ehr',
    groupId: 'digital_health_dtm',
    nameTh: 'ระบบสนับสนุนคลินิกและเวชระเบียนอิเล็กทรอนิกส์ (HIS, LIS, RIS, PACS, EMR, EHR)',
    nameEn: 'HIS, LIS, RIS, PACS, EMR and EHR',
    keywords: ['his', 'lis', 'ris', 'pacs', 'emr', 'ehr', 'เวชระเบียน', 'ระบบแล็บ', 'ระบบภาพถ่ายการแพทย์'],
    aliases: ['Clinical Support Systems & EHR Architecture'],
    description: 'ความแตกต่างเชิงสถาปัตยกรรมและบทบาทหน้าที่ระหว่างระบบ EMR (สถานพยาบาลเดี่ยว) กับ EHR (แลกเปลี่ยนข้ามเครือข่าย), LIS, RIS และ PACS',
    scope: 'LIS เชื่อมต่อเครื่องตรวจอัตโนมัติ, RIS จัดการคิวรังสี, PACS จัดเก็บไฟล์ DICOM, และการบูรณาการระบบทั้งหมดผ่าน HL7',
    recommendedLevel: 'intermediate',
    prerequisites: ['dtm-health-info-systems'],
    relatedTopicIds: ['dtm-standards-interoperability', 'mt-lab-instrumentation'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-212
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-212']
  },
  {
    id: 'dtm-standards-interoperability',
    groupId: 'digital_health_dtm',
    nameTh: 'มาตรฐานข้อมูลสุขภาพ (HL7 FHIR, DICOM, LOINC, SNOMED CT, ICD)',
    nameEn: 'HL7 FHIR, DICOM, LOINC, SNOMED CT and ICD',
    keywords: ['fhir', 'hl7', 'dicom', 'loinc', 'snomed', 'icd-10', 'icd-11', 'มาตรฐานข้อมูลสุขภาพ', 'interoperability'],
    aliases: ['มาตรฐานการแลกเปลี่ยนข้อมูลสุขภาพ', 'Healthcare Interoperability Standards'],
    description: 'มาตรฐานสากลในการจัดเก็บและส่งต่อข้อมูลสุขภาพ: HL7 FHIR (REST/JSON), DICOM (ภาพถ่ายการแพทย์), LOINC (รหัสแล็บ), SNOMED CT (ศัพท์คลินิก) และ ICD-10 (รหัสโรค)',
    scope: 'FHIR Resources (Patient, Observation, Condition), DICOM Metadata Tags, Semantic Interoperability, และการทำ Terminology Mapping',
    recommendedLevel: 'advanced',
    prerequisites: ['dtm-health-info-systems', 'dtm-medical-terminology'],
    relatedTopicIds: ['dtm-clinical-systems-ehr', 'dtm-cybersecurity-privacy'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-212
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-212']
  },
  {
    id: 'dtm-database-health-data',
    groupId: 'digital_health_dtm',
    nameTh: 'ฐานข้อมูลและวิศวกรรมข้อมูลสุขภาพ',
    nameEn: 'Database and Health Data Engineering',
    keywords: ['sql', 'database', 'etl', 'data warehouse', 'omop', 'data pipeline', 'ฐานข้อมูลการแพทย์', 'วิศวกรรมข้อมูล'],
    aliases: ['ฐานข้อมูลสุขภาพ', 'Healthcare Data Architecture'],
    description: 'การออกแบบฐานข้อมูลเชิงสัมพันธ์ (Relational DB) และ NoSQL สำหรับข้อมูลผู้ป่วย, ETL Pipelines, Data Warehouse และ Common Data Models (เช่น OMOP CDM)',
    scope: 'Normalization, Time-series health data, Big data analytics, และการจัดทำ Longitudinal Patient Records',
    recommendedLevel: 'intermediate',
    prerequisites: ['dtm-health-info-systems'],
    relatedTopicIds: ['dtm-standards-interoperability', 'dtm-medical-ai-ml'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'dtm-medical-software-api',
    groupId: 'digital_health_dtm',
    nameTh: 'ซอฟต์แวร์และการเชื่อมต่อ API ทางการแพทย์',
    nameEn: 'Medical Software and API',
    keywords: ['api', 'restful', 'oauth2', 'smart on fhir', 'software engineering', 'เว็บเซอร์วิส', 'การเขียนโปรแกรมการแพทย์'],
    aliases: ['การพัฒนาซอฟต์แวร์สุขภาพ', 'Medical Software Engineering'],
    description: 'หลักการพัฒนาแอปพลิเคชันทางการแพทย์ การสร้าง RESTful APIs สำหรับข้อมูลคลินิก และมาตรฐาน SMART on FHIR เพื่อการเข้าถึงแอปอย่างปลอดภัย',
    scope: 'สถาปัตยกรรม Microservices ในโรงพยาบาล, OAuth 2.0 / OpenID Connect ในระบบสุขภาพ, และ API Security',
    recommendedLevel: 'advanced',
    prerequisites: ['dtm-database-health-data', 'dtm-standards-interoperability'],
    relatedTopicIds: ['dtm-cybersecurity-privacy'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'dtm-medical-ai-ml',
    groupId: 'digital_health_dtm',
    nameTh: 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่องทางการแพทย์',
    nameEn: 'Medical AI and Machine Learning',
    keywords: ['ai', 'machine learning', 'deep learning', 'cnn', 'u-net', 'medical ai', 'ปัญญาประดิษฐ์ทางการแพทย์'],
    aliases: ['เอไอทางการแพทย์', 'Clinical Machine Learning'],
    description: 'การประยุกต์ใช้โมเดล Machine Learning และ Deep Learning (CNN, U-Net) ในการจำแนกโรคและแบ่งส่วนภาพถ่ายทางการแพทย์ (Segmentation) ตลอดจนข้อกำหนดด้านจริยธรรม',
    scope: 'Classification & Segmentation, การวัดประสิทธิภาพ (Sensitivity, Specificity, AUC-ROC), Algorithmic Bias, และ Explainable AI (XAI เช่น Grad-CAM)',
    recommendedLevel: 'advanced',
    prerequisites: ['mf-anatomy-physiology', 'dtm-standards-interoperability'],
    relatedTopicIds: ['dtm-imaging-biosignals', 'dtm-clinical-nlp'],
    contentAvailability: {
      hasLocalKnowledgeBase: true, // มีใน fallback: dtm_ai
      hasLearningGuide: false,
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'dtm-clinical-nlp',
    groupId: 'digital_health_dtm',
    nameTh: 'การประมวลผลภาษาธรรมชาติทางคลินิก (Clinical NLP)',
    nameEn: 'Clinical NLP',
    keywords: ['nlp', 'ner', 'llm', 'clinical notes', 'free text', 'text mining', 'การประมวลผลภาษาธรรมชาติ'],
    aliases: ['การวิเคราะห์ข้อความเวชระเบียน', 'Clinical Natural Language Processing'],
    description: 'การสกัดและจำแนกข้อมูลโรค อาการ และยา จากบันทึกเวชระเบียนของแพทย์ที่เป็นข้อความอิสระ (Free-text Clinical Notes) ด้วยเทคนิค Named Entity Recognition (NER)',
    scope: 'Clinical NER, Rule-based vs Transformer models, BioBERT/ClinicalBERT, และการตรวจจับตัวย่อทางคลินิก',
    recommendedLevel: 'advanced',
    prerequisites: ['dtm-medical-terminology', 'dtm-medical-ai-ml'],
    relatedTopicIds: ['dtm-health-info-systems'],
    contentAvailability: {
      hasLocalKnowledgeBase: false,
      hasLearningGuide: false,
      isGeminiOnDemandOnly: true
    },
    associatedCurriculumCourseCodes: []
  },
  {
    id: 'dtm-imaging-biosignals',
    groupId: 'digital_health_dtm',
    nameTh: 'การประมวลผลภาพถ่ายและสัญญาณชีวภาพทางการแพทย์',
    nameEn: 'Medical Imaging and Biosignal Processing',
    keywords: ['dicom', 'image processing', 'biosignals', 'ecg', 'eeg', 'สัญญาณชีพ', 'คลื่นไฟฟ้าหัวใจ', 'ภาพถ่ายการแพทย์'],
    aliases: ['การประมวลผลสัญญาณทางการแพทย์', 'Biomedical Signal & Image Processing'],
    description: 'การตรวจวัด การกรองสัญญาณรบกวน (Filtering) และการวิเคราะห์สัญญาณชีวภาพ (ECG, PPG, EEG) ตลอดจนการประมวลผลภาพถ่ายรังสีและคลื่นสะท้อนในสนามแม่เหล็ก',
    scope: 'การกรองสัญญาณรบกวนความถี่ (Bandpass filters), การแปลงฟูเรียร์ (FFT), การแปลงค่าพิกเซลและ Windowing ในภาพ CT/MRI',
    recommendedLevel: 'advanced',
    prerequisites: ['dtm-standards-interoperability', 'mf-anatomy-physiology'],
    relatedTopicIds: ['dtm-iomt-medical-devices', 'dtm-medical-ai-ml'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-123
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-123']
  },
  {
    id: 'dtm-iomt-medical-devices',
    groupId: 'digital_health_dtm',
    nameTh: 'อินเทอร์เน็ตของสรรพสิ่งทางการแพทย์และเครื่องมือแพทย์ (IoMT)',
    nameEn: 'IoMT and Medical Devices',
    keywords: ['iomt', 'iot', 'sensors', 'wearables', 'medical device', 'อุปกรณ์สวมใส่', 'เซนเซอร์การแพทย์', 'dtm67-123'],
    aliases: ['อุปกรณ์การแพทย์เชื่อมต่ออินเทอร์เน็ต', 'Internet of Medical Things'],
    description: 'เครือข่ายอุปกรณ์เครื่องมือแพทย์และอุปกรณ์สวมใส่ (Wearables / Sensors) ที่รวบรวมและส่งผ่านสัญญาณชีพแบบเรียลไทม์เพื่อการเฝ้าติดตามทางไกล (RPM)',
    scope: 'Continuous Glucose Monitoring (CGM), สมาร์ตวอทช์ตรวจวัด ECG, ความน่าเชื่อถือระดับเครื่องมือแพทย์ (Medical Grade), และ Edge Computing',
    recommendedLevel: 'intermediate',
    prerequisites: ['dtm-health-info-systems'],
    relatedTopicIds: ['dtm-imaging-biosignals', 'dtm-cybersecurity-privacy'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-123
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-123']
  },
  {
    id: 'dtm-cybersecurity-privacy',
    groupId: 'digital_health_dtm',
    nameTh: 'ความมั่นคงปลอดภัยไซเบอร์ ความเป็นส่วนตัว และธรรมาภิบาลข้อมูล (PDPA/HIPAA)',
    nameEn: 'Cybersecurity, Privacy and Interoperability',
    keywords: ['security', 'privacy', 'pdpa', 'hipaa', 'encryption', 'rbac', 'cybersecurity', 'ความปลอดภัยไซเบอร์', 'ข้อมูลส่วนบุคคล'],
    aliases: ['ความมั่นคงปลอดภัยข้อมูลสุขภาพ', 'Health Data Privacy & Security'],
    description: 'การปกป้องระบบเครื่องมือแพทย์และข้อมูลสุขภาพผู้ป่วยจากการโจมตีทางไซเบอร์ การเข้ารหัสข้อมูล การควบคุมสิทธิ์ (RBAC) และการปฏิบัติตามกฎหมาย PDPA / HIPAA',
    scope: 'Network Segmentation ป้องกันมัลแวร์ในห้อง ICU, Audit Logs, Data De-identification / Anonymization, และ Ransomware incident response',
    recommendedLevel: 'intermediate',
    prerequisites: ['dtm-health-info-systems'],
    relatedTopicIds: ['dtm-standards-interoperability', 'dtm-medical-software-api'],
    contentAvailability: {
      hasLocalKnowledgeBase: true,
      hasLearningGuide: true, // DTM67-123
      isGeminiOnDemandOnly: false
    },
    associatedCurriculumCourseCodes: ['DTM67-123']
  }
];

// Helper functions for easy querying
export function getAllLearningTopics(): LearningDomainTopic[] {
  return LEARNING_DOMAIN_TOPICS;
}

export function getTopicsByGroup(groupId: LearningDomainGroupId): LearningDomainTopic[] {
  return LEARNING_DOMAIN_TOPICS.filter(t => t.groupId === groupId);
}

export function getTopicById(topicId: string): LearningDomainTopic | undefined {
  return LEARNING_DOMAIN_TOPICS.find(t => t.id === topicId);
}

export function findTopicsByQuery(query: string): LearningDomainTopic[] {
  if (!query || !query.trim()) return LEARNING_DOMAIN_TOPICS;
  const q = query.toLowerCase().trim();
  return LEARNING_DOMAIN_TOPICS.filter(t => {
    return (
      t.nameTh.toLowerCase().includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.keywords.some(k => k.toLowerCase().includes(q)) ||
      t.aliases.some(a => a.toLowerCase().includes(q)) ||
      t.description.toLowerCase().includes(q) ||
      t.associatedCurriculumCourseCodes.some(c => c.toLowerCase().includes(q))
    );
  });
}

export function getWorkflowById(workflowId?: StudyWorkflowType): StudyWorkflowOption {
  const found = STUDY_WORKFLOW_OPTIONS.find(w => w.id === workflowId);
  return found || STUDY_WORKFLOW_OPTIONS[0];
}

export function buildStudyWorkflowPrompt(topic: LearningDomainTopic, workflow: StudyWorkflowType): string {
  const opt = getWorkflowById(workflow);
  return `${opt.promptPrefix} "${topic.nameTh} (${topic.nameEn})" ในบริบทของเทคนิคการแพทย์และเทคโนโลยีดิจิทัลทางการแพทย์ (DTM)`;
}
