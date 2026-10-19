/**
 * DTM Learning Map MVP — Course-to-Actual-Learning Foundation
 * 
 * คู่มือปูพื้นฐานเพื่อการเรียนรู้สำหรับรายวิชาในหลักสูตร วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (DTM 2567)
 * มหาวิทยาลัยวลัยลักษณ์
 * 
 * ข้อกำหนดความปลอดภัยและความถูกต้องทางวิชาการ:
 * 1. ข้อมูลนี้เป็น "คู่มือปูพื้นฐานความรู้ทั่วไปตามหัวข้อที่เกี่ยวข้อง" ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการ
 * 2. ห้ามสร้าง CLO, PLO, แผนการสอน, หรือสัดส่วนชั่วโมงรายสัปดาห์ขึ้นเอง
 * 3. ห้ามแต่ง URL, DOI, หรือเลขหน้าอ้างอิง
 * 4. เนื้อหาในคู่มือนี้จัดทำเพื่อการเรียนรู้เบื้องต้น และจะไม่ถูกนำไปใช้เป็น Document Grounding หรือ Citation โดยอัตโนมัติ
 */

export const DTM_LEARNING_GUIDE_DISCLAIMER =
  'คู่มือปูพื้นฐานเพื่อการเรียนรู้ — จัดทำจากความรู้ทั่วไปตามหัวข้อที่เกี่ยวข้อง ไม่ใช่คำอธิบายรายวิชาอย่างเป็นทางการ และยังไม่ได้ยืนยันว่าเป็นเนื้อหาการสอนทั้งหมดของรายวิชานี้';

export interface KeyConcept {
  id: string;
  order: number;
  title: string;
  summary: string;
  explanation: string;
  suggestedChatPrompt: string;
}

export interface TechnicalVocabularyItem {
  id: string;
  termEn: string;
  termTh: string;
  simpleExplanation: string;
  dtmContextExample: string;
  suggestedChatPrompt: string;
}

export interface ApplicationExample {
  id: string;
  title: string;
  domain: 'health_information_systems' | 'medical_ai' | 'health_data' | 'digital_health_technology';
  domainLabel: string;
  description: string;
  realWorldScenario: string;
  suggestedChatPrompt: string;
}

export interface ReviewQuestion {
  id: string;
  questionNumber: number;
  question: string;
  answer: string;
  rationale: string;
  suggestedChatPrompt: string;
}

export interface LearningPathway {
  prerequisiteSuggestions: string[]; // ข้อเสนอแนะความรู้พื้นฐานที่ควรทำความเข้าใจก่อน (ไม่ใช่ prerequisite ทางการ)
  subsequentSuggestions: string[];   // ข้อเสนอแนะหัวข้อที่ศึกษาเพิ่มเติมภายหลัง (ไม่ใช่ prerequisite ทางการ)
  labelNote: string;
}

export interface DtmLearningGuide {
  courseCode: string;
  topicOverview: string;
  disclaimer: string;
  keyTakeaways: string[]; // สิ่งที่ควรเข้าใจให้ได้สำหรับคู่มือนี้ (ไม่ใช่ CLO/PLO ทางการ)
  keyConcepts: KeyConcept[];
  technicalVocabulary: TechnicalVocabularyItem[];
  applicationExamples: ApplicationExample[];
  reviewQuestions: ReviewQuestion[];
  learningPathway: LearningPathway;
  sourceStatus: {
    guideType: 'general_knowledge_learning_guide';
    officialDescriptionAvailable: boolean;
    hasPrimarySyllabusDocument: boolean;
    academicYearConfirmed: boolean;
    confirmedSourceReference: string;
  };
}

export const DTM_LEARNING_GUIDES: Record<string, DtmLearningGuide> = {
  // =========================================================================
  // 1. DTM67-111: ศัพท์เทคนิคทางการแพทย์ (Technical Terms in Medicine)
  // =========================================================================
  'DTM67-111': {
    courseCode: 'DTM67-111',
    topicOverview:
      'การศึกษาหลักการโครงสร้างและที่มาของศัพท์เฉพาะทางการแพทย์ (Medical Terminology) ซึ่งประกอบขึ้นจากคำอุปสรรค (Prefix), รากศัพท์ (Root word), สระเชื่อม (Combining vowel) และคำปัจจัย (Suffix) จากรากภาษากรีกและละติน เพื่อใช้ในการสื่อสารทางคลินิกอย่างแม่นยำ รวมถึงการประยุกต์ใช้ในการจัดทำพจนานุกรมข้อมูลสุขภาพ (Clinical Data Dictionary), ระบบเวชระเบียนดิจิทัล (EHR/EMR) และการประมวลผลภาษาธรรมชาติทางการแพทย์ (Medical NLP)',
    disclaimer: DTM_LEARNING_GUIDE_DISCLAIMER,
    keyTakeaways: [
      'เข้าใจโครงสร้างพื้นฐาน 4 องค์ประกอบของคำศัพท์การแพทย์ (Prefix, Root, Suffix, Combining form) และวิเคราะห์ความหมายได้โดยไม่ต้องท่องจำเดี่ยวๆ',
      'คุ้นเคยกับคำศัพท์ระบุตำแหน่ง กายวิภาค และระบบอวัยวะสำคัญของร่างกายมนุษย์',
      'ตระหนักถึงความสำคัญของความถูกต้องระดับอักขระของคำศัพท์ เพื่อป้องกันข้อผิดพลาดในการบันทึกเวชระเบียนอิเล็กทรอนิกส์และการแลกเปลี่ยนข้อมูลข้ามระบบ',
      'เข้าใจการแปลงคำศัพท์ทางการแพทย์ไปสู่การจัดกลุ่มข้อมูลในระบบสารสนเทศสุขภาพดิจิทัล'
    ],
    keyConcepts: [
      {
        id: 'dtm111-concept-1',
        order: 1,
        title: 'โครงสร้างส่วนประกอบคำศัพท์ทางการแพทย์ (Word Components)',
        summary: 'หลักการแยกคำศัพท์ออกเป็น 4 ส่วน: Prefix (ส่วนหน้า), Root (แกนกลาง), Combining Vowel (สระเชื่อม), และ Suffix (ส่วนท้าย)',
        explanation:
          'คำศัพท์ทางการแพทย์ส่วนใหญ่มีที่มาจากภาษากรีกและละติน โดยแกนความหมายหลักอยู่ที่ Root (เช่น Cardi- หมายถึงหัวใจ) เติม Prefix เพื่อระบุทิศทาง ปริมาณ หรือเวลา (เช่น Brady- หมายถึงช้า กลายเป็น Bradycardia: ภาวะหัวใจเต้นช้า) และเติม Suffix เพื่อระบุสภาวะหรือหัตถการ (เช่น -itis หมายถึงการอักเสบ กลายเป็น Carditis: หัวใจอักเสบ)',
        suggestedChatPrompt:
          'ช่วยอธิบายหลักการแยกส่วนประกอบของคำศัพท์ทางการแพทย์ (Prefix, Root, Combining Vowel, Suffix) พร้อมยกตัวอย่างคำศัพท์ที่พบบ่อย 3 คำ'
      },
      {
        id: 'dtm111-concept-2',
        order: 2,
        title: 'คำศัพท์ระบุทิศทาง ตำแหน่ง และระนาบกายวิภาค (Anatomical Directions & Planes)',
        summary: 'คำศัพท์มาตรฐานสากลที่ใช้บอกตำแหน่งของอวัยวะและรอยโรคในร่างกายผู้ป่วย',
        explanation:
          'ในการตรวจวินิจฉัยและภาพถ่ายการแพทย์ การระบุตำแหน่งต้องชัดเจน เช่น Anterior/Ventral (ด้านหน้า), Posterior/Dorsal (ด้านหลัง), Superior (ด้านบน), Inferior (ด้านล่าง), Medial (เข้าหาแนวกึ่งกลาง), Lateral (ออกด้านข้าง) รวมถึงระนาบ Sagittal, Coronal และ Transverse ซึ่งจำเป็นต่อการมาร์กตำแหน่งในภาพถ่าย CT/MRI',
        suggestedChatPrompt:
          'ช่วยอธิบายคำศัพท์ระบุตำแหน่งและระนาบกายวิภาค เช่น Anterior, Posterior, Sagittal, Coronal และการนำไปใช้ในภาพถ่ายการแพทย์'
      },
      {
        id: 'dtm111-concept-3',
        order: 3,
        title: 'คำศัพท์อาการ พยาธิสภาพ และหัตถการ (Symptoms, Pathologies & Procedures)',
        summary: 'คำปัจจัยและคำรวมที่ระบุการอักเสบ การตรวจวินิจฉัย การผ่าตัด และผลการตรวจแล็บ',
        explanation:
          'คำปัจจัยกลุ่มหัตถการมีความสำคัญอย่างยิ่งในระบบสารสนเทศ เช่น -scopy (การส่องกล้องตรวจ เช่น Endoscopy), -centesis (การเจาะดูดของเหลว), -ectomy (การผ่าตัดเอาออก เช่น Appendectomy), -plasty (การผ่าตัดตกแต่งเสริมสร้าง) และ -stomy (การผ่าตัดเปิดช่อง)',
        suggestedChatPrompt:
          'ช่วยสรุปคำปัจจัย (Suffixes) ทางการแพทย์ที่ใช้บ่อยในหมวดหัตถการและการผ่าตัด พร้อมคำแปลและความหมาย'
      },
      {
        id: 'dtm111-concept-4',
        order: 4,
        title: 'ตัวย่อทางการแพทย์และข้อควรระวังเรื่องความกำกวม (Medical Abbreviations & Ambiguity)',
        summary: 'การใช้งานตัวย่อทางคลินิกและแนวทาง Do Not Use List เพื่อความปลอดภัยของผู้ป่วย',
        explanation:
          'ในเวชระเบียนมักพบตัวย่อ เช่น BP (Blood Pressure), HR (Heart Rate), CBC (Complete Blood Count), Rx (ใบสั่งยา/การรักษา) แต่มีตัวย่อหลายคำที่กำกวม เช่น "MS" อาจหมายถึง Multiple Sclerosis หรือ Morphine Sulfate สถาบันความปลอดภัยทางการแพทย์จึงกำหนดแนวทางมาตรฐานในการลดการใช้ตัวย่อที่มีความเสี่ยงสูง',
        suggestedChatPrompt:
          'ทำไมตัวย่อทางการแพทย์จึงอาจก่อให้เกิดความผิดพลาดในระบบเวชระเบียน และมีแนวทางมาตรฐานในการควบคุมอย่างไร?'
      },
      {
        id: 'dtm111-concept-5',
        order: 5,
        title: 'คำศัพท์เฉพาะในระบบข้อมูลสุขภาพและรหัสมาตรฐาน (Terminology & Clinical Coding Standards)',
        summary: 'การเชื่อมต่อระหว่างคำศัพท์ภาษาธรรมชาติกับรหัสมาตรฐานสากล เช่น ICD-10, SNOMED-CT และ LOINC',
        explanation:
          'ในสายงานเทคโนโลยีดิจิทัลทางการแพทย์ คำศัพท์ของแพทย์จะต้องถูกแมป (Map) เข้ากับมาตรฐานรหัสสากล เช่น ICD-10 (รหัสโรค), SNOMED CT (ศัพท์และแนวคิดทางคลินิกแบบ Ontology), และ LOINC (รหัสการตรวจทางห้องปฏิบัติการ) เพื่อให้ระบบสารสนเทศประมวลผลได้อย่างเป็นระบบ',
        suggestedChatPrompt:
          'ช่วยอธิบายความสัมพันธ์ระหว่างคำศัพท์การแพทย์ภาษาธรรมชาติ กับรหัสมาตรฐานสากลอย่าง ICD-10 และ SNOMED-CT'
      }
    ],
    technicalVocabulary: [
      {
        id: 'dtm111-vocab-1',
        termEn: 'Prefix',
        termTh: 'คำอุปสรรค / ส่วนเติมหน้าคำ',
        simpleExplanation: 'ส่วนประกอบที่อยู่หน้าสุดของคำศัพท์ เพื่อบ่งบอกปริมาณ ทิศทาง ตำแหน่ง หรือเวลา',
        dtmContextExample: 'ตัวอย่าง: "Brady-" (ช้า) ใน Bradycardia หรือ "Hyper-" (สูง/เกิน) ใน Hypertension',
        suggestedChatPrompt: 'ยกตัวอย่าง Prefix ทางการแพทย์ที่บอกปริมาณและทิศทาง พร้อมตัวอย่างคำศัพท์'
      },
      {
        id: 'dtm111-vocab-2',
        termEn: 'Root Word',
        termTh: 'รากศัพท์',
        simpleExplanation: 'แกนความหมายหลักของคำศัพท์ มักบ่งชี้ถึงระบบอวัยวะหรือเนื้อเยื่อในร่างกาย',
        dtmContextExample: 'ตัวอย่าง: "Cardi/o" (หัวใจ), "Nephr/o" (ไต), "Hepat/o" (ตับ), "Encephal/o" (สมอง)',
        suggestedChatPrompt: 'รวมรากศัพท์ทางการแพทย์ (Root Words) ที่เกี่ยวกับอวัยวะสำคัญในร่างกาย 5 คำ'
      },
      {
        id: 'dtm111-vocab-3',
        termEn: 'Suffix',
        termTh: 'คำปัจจัย / ส่วนเติมท้ายคำ',
        simpleExplanation: 'ส่วนท้ายของคำที่บ่งบอกสภาพ ความผิดปกติ โรค หรือหัตถการทางการแพทย์',
        dtmContextExample: 'ตัวอย่าง: "-itis" (การอักเสบ) ใน Hepatitis, "-ectomy" (การผ่าตัดตัดออก) ใน Nephrectomy',
        suggestedChatPrompt: 'ช่วยอธิบายความหมายของ Suffix ทางการแพทย์ที่พบบ่อยในการผ่าตัดและการตรวจรักษา'
      },
      {
        id: 'dtm111-vocab-4',
        termEn: 'Combining Vowel',
        termTh: 'สระเชื่อม',
        simpleExplanation: 'สระ (ส่วนใหญ่คือตัว "o") ที่ใช้คั่นระหว่างรากศัพท์กับส่วนอื่นเพื่อให้ออกเสียงได้ราบรื่น',
        dtmContextExample: 'ตัวอย่าง: Gastr/o + enter/o + logy = Gastroenterology (การศึกษาโรคกระเพาะอาหารและลำไส้)',
        suggestedChatPrompt: 'ทำไมในคำศัพท์การแพทย์จึงต้องมี Combining Vowel และมีกฎการใช้อย่างไร?'
      },
      {
        id: 'dtm111-vocab-5',
        termEn: 'Clinical Named Entity Recognition (Clinical NER)',
        termTh: 'การรู้จำสิ่งเฉพาะเจาะจงทางคลินิก',
        simpleExplanation: 'เทคนิค AI ในการตรวจจับและจำแนกคำศัพท์โรค อาการ ยา และหัตถการจากข้อความบันทึกของแพทย์',
        dtmContextExample: 'โมเดล NLP สกัดคำว่า "Metformin" เป็นชื่อยา และ "Type 2 Diabetes" เป็นโรค ออกจากบันทึกพยาบาล',
        suggestedChatPrompt: 'Clinical NER นำคำศัพท์การแพทย์ไปประยุกต์ใช้อย่างไรในระบบ AI ตรวจสอบบันทึกเวชระเบียน?'
      }
    ],
    applicationExamples: [
      {
        id: 'dtm111-app-1',
        title: 'การสร้าง Data Dictionary สำหรับระบบเวชระเบียนอิเล็กทรอนิกส์ (EHR)',
        domain: 'health_information_systems',
        domainLabel: 'ระบบสารสนเทศสุขภาพ',
        description: 'การกำหนดมาตรฐานชื่อฟิลด์และชุดคำศัพท์ทางการแพทย์ในฐานข้อมูลของโรงพยาบาล',
        realWorldScenario:
          'โรงพยาบาลต้องการรวมข้อมูลจากคลินิกโรคหัวใจและคลินิกอายุรกรรม ทีมเทคโนโลยีดิจิทัลต้องจัดทำ Data Dictionary ที่อิงตาม Medical Terminology สากล เพื่อให้ทั้งสองแผนกบันทึกภาวะเดียวกันด้วยคำที่ระบบเชื่อมโยงกันได้',
        suggestedChatPrompt:
          'ช่วยยกตัวอย่างการจัดทำ Data Dictionary ในระบบเวชระเบียนอิเล็กทรอนิกส์โดยใช้ศัพท์ทางการแพทย์เป็นมาตรฐาน'
      },
      {
        id: 'dtm111-app-2',
        title: 'ระบบ AI ช่วยสกัดข้อมูลอาการและโรคจากบันทึกภาษาธรรมชาติ (Clinical NLP)',
        domain: 'medical_ai',
        domainLabel: 'ปัญญาประดิษฐ์ทางการแพทย์',
        description: 'การฝึกโมเดล Machine Learning เพื่ออ่านบันทึกประวัติการรักษาแบบ Free-text',
        realWorldScenario:
          'แพทย์บันทึกข้อความสรุปอาการผู้ป่วย ระบบ AI ประมวลผลภาษาธรรมชาติใช้คลังคำศัพท์ Prefix/Root/Suffix ในการตรวจจับและแท็ก (Tag) ว่าผู้ป่วยมีอาการอักเสบที่ตำแหน่งใด แล้วสรุปเป็นประวัติให้อัตโนมัติ',
        suggestedChatPrompt:
          'การประมวลผลภาษาธรรมชาติ (NLP) ในวงการแพทย์ใช้คลังคำศัพท์ Terminology อย่างไรในการวิเคราะห์บันทึกแพทย์?'
      }
    ],
    reviewQuestions: [
      {
        id: 'dtm111-q1',
        questionNumber: 1,
        question: 'คำว่า "Gastroenteritis" แยกองค์ประกอบโครงสร้างคำและแปลความหมายได้อย่างไร?',
        answer: 'Gastr/o (รากศัพท์: กระเพาะอาหาร) + enter/o (รากศัพท์: ลำไส้เล็ก) + -itis (ปัจจัย: การอักเสบ) = ภาวะกระเพาะอาหารและลำไส้อักเสบ',
        rationale:
          'คำนี้ประกอบด้วยรากศัพท์ 2 คำเชื่อมกันด้วยสระ "o" และลงท้ายด้วยปัจจัยแสดงอาการอักเสบ (-itis) ซึ่งเป็นรูปแบบมาตรฐานของการสร้างคำศัพท์ระบุกลุ่มโรค',
        suggestedChatPrompt: 'ช่วยวิเคราะห์โครงสร้างคำของคำว่า Gastroenteritis และคำที่ลงท้ายด้วย -itis อื่นๆ'
      },
      {
        id: 'dtm111-q2',
        questionNumber: 2,
        question: 'หากแพทย์บันทึกการผ่าตัดเอาถุงน้ำดีออก จะตรงกับคำศัพท์ภาษาอังกฤษที่มีคำปัจจัย (Suffix) ใด?',
        answer: 'Cholecystectomy (คำปัจจัยคือ -ectomy หมายถึงการผ่าตัดตัดอวัยวะออก)',
        rationale:
          'Cholecyst/o หมายถึงถุงน้ำดี เมื่อรวมกับ -ectomy (Surgical removal) จึงหมายถึงการผ่าตัดตัดถุงน้ำดีออก แตกต่างจาก -otomy (การผ่าตัดเปิด) หรือ -ostomy (การผ่าตัดเปิดรูเชื่อม)',
        suggestedChatPrompt: 'ช่วยเปรียบเทียบความแตกต่างระหว่าง -ectomy, -otomy และ -ostomy พร้อมยกตัวอย่าง'
      },
      {
        id: 'dtm111-q3',
        questionNumber: 3,
        question: 'ในมุมมองของนักเทคโนโลยีดิจิทัลทางการแพทย์ เหตุใดการบันทึกคำศัพท์โดยปราศจากข้อผิดพลาดตัวสะกดจึงมีความสำคัญอย่างยิ่งต่อระบบอัตโนมัติ?',
        answer:
          'เพราะระบบคอมพิวเตอร์และขั้นตอนวิธี AI จำเป็นต้องแมปคำศัพท์เข้ากับรหัสมาตรฐาน (เช่น ICD หรือ SNOMED) หากสะกดผิด ตัวเชื่อมต่อข้อมูล (Data Pipeline) อาจแปลงค่าไม่ได้ หรือระบบสนับสนุนการตัดสินใจทางคลินิก (CDSS) อาจไม่แจ้งเตือนภาวะแพ้ยาที่ร้ายแรง',
        rationale:
          'Semantic Interoperability และ Patient Safety ขึ้นอยู่กับความถูกต้องของข้อมูลต้นทาง (Garbage in, Garbage out)',
        suggestedChatPrompt:
          'อธิบายผลกระทบของคำศัพท์ทางการแพทย์ที่ไม่ถูกต้องต่อระบบ Clinical Decision Support System (CDSS)'
      }
    ],
    learningPathway: {
      prerequisiteSuggestions: [
        'ความรู้พื้นฐานเกี่ยวกับระบบร่างกายและอวัยวะมนุษย์เบื้องต้น',
        'ทักษะภาษาอังกฤษพื้นฐานด้านการอ่านและการสังเกตโครงสร้างคำศัพท์'
      ],
      subsequentSuggestions: [
        'มาตรฐานการจัดทำรหัสโรคสากล (ICD-10 และ ICD-11)',
        'มาตรฐานคำศัพท์และแนวคิดทางคลินิกสากล (SNOMED-CT และ LOINC)',
        'การประมวลผลภาษาธรรมชาติทางการแพทย์ (Medical NLP & Clinical Text Mining)'
      ],
      labelNote: 'ข้อเสนอแนะด้านการเรียนรู้เพื่อวางแผนศึกษาด้วยตนเอง — ไม่ใช่ prerequisite ทางการของหลักสูตร'
    },
    sourceStatus: {
      guideType: 'general_knowledge_learning_guide',
      officialDescriptionAvailable: false,
      hasPrimarySyllabusDocument: false,
      academicYearConfirmed: false,
      confirmedSourceReference:
        'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ หน้า 6'
    }
  },

  // =========================================================================
  // 2. DTM67-123: พื้นฐานเทคโนโลยีดิจิทัลทางการแพทย์ (Fundamentals of Digital Technology in Medicine)
  // =========================================================================
  'DTM67-123': {
    courseCode: 'DTM67-123',
    topicOverview:
      'การศึกษาภาพรวมและรากฐานของเทคโนโลยีดิจิทัลในการแพทย์และการสาธารณสุขสมัยใหม่ ครอบคลุมระบบนิเวศสุขภาพดิจิทัล (Digital Health Ecosystem), อุปกรณ์และเซนเซอร์การแพทย์เชื่อมต่ออินเทอร์เน็ต (Internet of Medical Things: IoMT), สถาปัตยกรรมคลาวด์และเครือข่ายสำหรับข้อมูลสุขภาพ, หลักการความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity) ตลอดจนกฎหมายและจริยธรรมในการคุ้มครองข้อมูลสุขภาพผู้ป่วย (PDPA / HIPAA)',
    disclaimer: DTM_LEARNING_GUIDE_DISCLAIMER,
    keyTakeaways: [
      'เข้าใจองค์ประกอบของระบบนิเวศสุขภาพดิจิทัล (Digital Health Ecosystem) และบทบาทของนักเทคโนโลยีดิจิทัลทางการแพทย์',
      'เข้าใจกลไกการทำงานของอุปกรณ์ IoMT และการเก็บรวบรวมสัญญาณชีวภาพ (Biosignals) เบื้องต้น',
      'ตระหนักถึงความท้าทายด้านความมั่นคงปลอดภัยไซเบอร์และความเป็นส่วนตัวของข้อมูลผู้ป่วยตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล',
      'เห็นภาพการบูรณาการเทคโนโลยีสารสนเทศเข้ากับกระบวนการรักษาพยาบาลในโรงพยาบาลอัจฉริยะ (Smart Hospital)'
    ],
    keyConcepts: [
      {
        id: 'dtm123-concept-1',
        order: 1,
        title: 'ระบบนิเวศสุขภาพดิจิทัลและวงจรชีวิตเทคโนโลยี (Digital Health Ecosystem & Lifecycle)',
        summary: 'ภาพรวมปฏิสัมพันธ์ระหว่างผู้ป่วย บุคลากรทางการแพทย์ อุปกรณ์ และโครงสร้างพื้นฐานดิจิทัล',
        explanation:
          'ระบบนิเวศสุขภาพดิจิทัลประกอบด้วยผู้มีส่วนได้ส่วนเสียหลายฝ่าย ได้แก่ ผู้ป่วย แพทย์ พยาบาล นักวิจัย และวิศวกรซอฟต์แวร์ เทคโนโลยีดิจิทัลทำหน้าที่เป็นสะพานเชื่อมตั้งแต่การป้องกันโรค (Prevention) การตรวจคัดกรอง (Screening) การวินิจฉัย (Diagnosis) การรักษา (Treatment) ไปจนถึงการฟื้นฟูสมรรถภาพ (Rehabilitation)',
        suggestedChatPrompt:
          'ช่วยสรุปองค์ประกอบของ Digital Health Ecosystem และวงจรชีวิตการดูแลผู้ป่วยด้วยเทคโนโลยีดิจิทัล'
      },
      {
        id: 'dtm123-concept-2',
        order: 2,
        title: 'อินเทอร์เน็ตของสรรพสิ่งทางการแพทย์ (Internet of Medical Things: IoMT)',
        summary: 'เครือข่ายอุปกรณ์เครื่องมือแพทย์และอุปกรณ์สวมใส่ที่ตรวจจับและส่งผ่านข้อมูลสัญญาณชีพแบบเรียลไทม์',
        explanation:
          'IoMT พัฒนาต่อยอดจาก IoT ทั่วไป โดยเน้นความแม่นยำระดับการแพทย์ (Medical Grade) อุปกรณ์ตรวจวัด เช่น เครื่องวัดคลื่นไฟฟ้าหัวใจ (ECG), เครื่องวัดระดับน้ำตาลในเลือด (CGM), และ Smartwatch ส่งข้อมูลสัญญาณชีพผ่านบลูทูธหรือ Wi-Fi เข้าสู่ระบบเกตเวย์เพื่อส่งต่อให้แพทย์ตรวจสอบได้ตลอดเวลา',
        suggestedChatPrompt:
          'ช่วยอธิบายหลักการทำงานของ Internet of Medical Things (IoMT) พร้อมยกตัวอย่างอุปกรณ์ทางการแพทย์ที่ใช้งานจริง'
      },
      {
        id: 'dtm123-concept-3',
        order: 3,
        title: 'การประมวลผลบนคลาวด์และเอดจ์ทางการแพทย์ (Healthcare Cloud & Edge Computing)',
        summary: 'โครงสร้างพื้นฐานสำหรับจัดเก็บ ประมวลผล และวิเคราะห์ข้อมูลสุขภาพขนาดใหญ่ (Big Health Data)',
        explanation:
          'การจัดเก็บข้อมูลสุขภาพต้องการความพร้อมใช้งานสูง (High Availability) และความเร็วในการตอบสนอง Edge Computing ช่วยประมวลผลสัญญาณชีพ ณ บริเวณเตียงผู้ป่วยเพื่อตรวจจับภาวะวิกฤตแบบเรียลไทม์ ขณะที่ Cloud Computing ทำหน้าที่รวมศูนย์ข้อมูลสำหรับประมวลผลโมเดล AI ขนาดใหญ่และการวิจัยเชิงระบาดวิทยา',
        suggestedChatPrompt:
          'เปรียบเทียบการใช้งาน Edge Computing กับ Cloud Computing ในระบบติดตามสัญญาณชีพผู้ป่วยในโรงพยาบาล'
      },
      {
        id: 'dtm123-concept-4',
        order: 4,
        title: 'ความมั่นคงปลอดภัยไซเบอร์และความเป็นส่วนตัวของข้อมูลสุขภาพ (Cybersecurity & Health Data Privacy)',
        summary: 'การปกป้องระบบเครื่องมือแพทย์จากการโจมตี และการปฏิบัติตามกฎหมาย PDPA / HIPAA',
        explanation:
          'ข้อมูลสุขภาพจัดเป็นข้อมูลส่วนบุคคลที่มีความอ่อนไหวสูงสุด (Sensitive Data) โรงพยาบาลมักตกเป็นเป้าหมายของการโจมตีด้วยมัลแวร์เรียกค่าไถ่ (Ransomware) นักเทคโนโลยีดิจิทัลทางการแพทย์จึงต้องเข้าใจการเข้ารหัสข้อมูล (Encryption at rest & in transit), การควบคุมสิทธิ์ (Role-based Access Control: RBAC) และการตรวจสอบย้อนกลับ (Audit Log)',
        suggestedChatPrompt:
          'ช่วยอธิบายแนวทางการรักษาความมั่นคงปลอดภัยไซเบอร์สำหรับอุปกรณ์เครื่องมือแพทย์และระบบเวชระเบียนตามหลัก PDPA'
      },
      {
        id: 'dtm123-concept-5',
        order: 5,
        title: 'การเปลี่ยนผ่านสู่โรงพยาบาลอัจฉริยะ (Smart Hospital Transformation)',
        summary: 'การประยุกต์ใช้ระบบดิจิทัลเพื่อเพิ่มประสิทธิภาพการดูแลรักษา ลดข้อผิดพลาด และยกระดับประสบการณ์ผู้ป่วย',
        explanation:
          'โรงพยาบาลอัจฉริยะผสานระบบอัตโนมัติต่างๆ เช่น ระบบคิวอัจฉริยะ, หุ่นยนต์นำทางและขนส่งยา, ระบบติดตามตำแหน่งทรัพย์สินและผู้ป่วยแบบเรียลไทม์ (RTLS) และระบบสั่งการรักษาด้วยคอมพิวเตอร์ (CPOE) เพื่อลดภาระงานของบุคลากรทางการแพทย์',
        suggestedChatPrompt:
          'อะไรคือหัวใจสำคัญในการเปลี่ยนผ่านโรงพยาบาลดั้งเดิมไปสู่ Smart Hospital ในยุคดิจิทัล?'
      }
    ],
    technicalVocabulary: [
      {
        id: 'dtm123-vocab-1',
        termEn: 'Internet of Medical Things (IoMT)',
        termTh: 'อินเทอร์เน็ตของสรรพสิ่งทางการแพทย์',
        simpleExplanation: 'เครือข่ายอุปกรณ์เครื่องมือแพทย์และเซนเซอร์ที่สามารถรวบรวมและส่งผ่านข้อมูลสุขภาพทางระบบเครือข่าย',
        dtmContextExample: 'เครื่องวัดระดับออกซิเจนในเลือดแบบสวมใส่ส่งสัญญาณเตือนผ่าน Wi-Fi เข้าแท็บเล็ตของพยาบาลประจำตึก',
        suggestedChatPrompt: 'IoMT แตกต่างจาก IoT ทั่วไปอย่างไรในแง่ของความแม่นยำและความปลอดภัย?'
      },
      {
        id: 'dtm123-vocab-2',
        termEn: 'Remote Patient Monitoring (RPM)',
        termTh: 'การเฝ้าติดตามผู้ป่วยทางไกล',
        simpleExplanation: 'การใช้เทคโนโลยีดิจิทัลติดตามข้อมูลสุขภาพของผู้ป่วยที่พักฟื้นอยู่ที่บ้านหรือพื้นที่ห่างไกล',
        dtmContextExample: 'ผู้ป่วยโรคความดันโลหิตสูงวัดความดันที่บ้าน ข้อมูลส่งเข้าระบบโรงพยาบาลเพื่อให้อายุรแพทย์ปรับขนาดยา',
        suggestedChatPrompt: 'ประโยชน์และความท้าทายของการใช้ระบบ Remote Patient Monitoring (RPM) ในผู้ป่วยโรคเรื้อรัง'
      },
      {
        id: 'dtm123-vocab-3',
        termEn: 'Sensitive Personal Data (Data Privacy)',
        termTh: 'ข้อมูลส่วนบุคคลที่มีความอ่อนไหว',
        simpleExplanation: 'ข้อมูลที่หากถูกเปิดเผยโดยมิชอบอาจกระทบต่อสิทธิ เสรีภาพ หรือก่อให้เกิดการเลือกปฏิบัติ เช่น ข้อมูลพันธุกรรม โรคประจำตัว หรือผลแล็บ',
        dtmContextExample: 'การเข้าถึงข้อมูลผลตรวจการติดเชื้อต้องมีการยืนยันตัวตนสองชั้น (MFA) และบันทึก Audit Log ทุกครั้ง',
        suggestedChatPrompt: 'ข้อกำหนดของ PDPA ด้านข้อมูลสุขภาพมีความเข้มงวดมากกว่าข้อมูลส่วนบุคคลทั่วไปอย่างไร?'
      },
      {
        id: 'dtm123-vocab-4',
        termEn: 'Interoperability',
        termTh: 'ความสามารถในการทำงานร่วมกันระหว่างระบบ',
        simpleExplanation: 'ความสามารถของซอฟต์แวร์หรืออุปกรณ์ต่างยี่ห้อในการสื่อสาร แลกเปลี่ยน และนำข้อมูลไปประมวลผลต่อได้โดยไม่สูญเสียความหมาย',
        dtmContextExample: 'เครื่องวัดสัญญาณชีพส่งข้อมูลเข้าสู่ระบบเวชระเบียนอิเล็กทรอนิกส์ข้ามผู้ผลิตได้โดยอัตโนมัติ',
        suggestedChatPrompt: 'Interoperability ทางการแพทย์มีกี่ระดับ และทำไมระดับ Semantic จึงสำคัญที่สุด?'
      },
      {
        id: 'dtm123-vocab-5',
        termEn: 'Telemedicine / Telehealth',
        termTh: 'การแพทย์ทางไกล / การบริการสุขภาพทางไกล',
        simpleExplanation: 'การให้คำปรึกษา การตรวจวินิจฉัย และการรักษาทางการแพทย์ผ่านระบบโทรคมนาคมและวิดีโอคอนเฟอเรนซ์',
        dtmContextExample: 'แพทย์ผู้เชี่ยวชาญให้คำปรึกษาแก่เจ้าหน้าที่ในโรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) ผ่านระบบ Telemedicine',
        suggestedChatPrompt: 'โครงสร้างพื้นฐานดิจิทัลที่จำเป็นต่อการให้บริการ Telemedicine ที่มีคุณภาพและปลอดภัยมีอะไรบ้าง?'
      }
    ],
    applicationExamples: [
      {
        id: 'dtm123-app-1',
        title: 'ระบบติดตามผู้ป่วยโรคเรื้อรังที่บ้านด้วย IoMT (Continuous Glucose Monitoring)',
        domain: 'digital_health_technology',
        domainLabel: 'เทคโนโลยีดิจิทัลสุขภาพ',
        description: 'การนำเซนเซอร์ตรวจวัดน้ำตาลใต้ผิวหนังส่งข้อมูลเข้าสู่สมาร์ตโฟนและระบบคลาวด์',
        realWorldScenario:
          'ผู้ป่วยโรคเบาหวานสวมเซนเซอร์ตรวจระดับน้ำตาลแบบต่อเนื่อง (CGM) ค่าระดับน้ำตาลจะถูกส่งผ่านบลูทูธเข้าสู่สมาร์ตโฟน หากค่าน้ำตาลลดต่ำเกินเกณฑ์อันตราย ระบบจะส่งพิกัดและแจ้งเตือนไปยังญาติและศูนย์ฉุกเฉินของโรงพยาบาลทันที',
        suggestedChatPrompt:
          'ช่วยออกแบบสถาปัตยกรรมระบบติดตามผู้ป่วยเบาหวานทางไกลโดยใช้อุปกรณ์ IoMT และระบบแจ้งเตือนฉุกเฉิน'
      },
      {
        id: 'dtm123-app-2',
        title: 'การป้องกันการโจมตีทางไซเบอร์ในเครือข่ายอุปกรณ์การแพทย์ของห้องไอซียู',
        domain: 'health_data',
        domainLabel: 'ความมั่นคงปลอดภัยข้อมูลสุขภาพ',
        description: 'การแยกเครือข่าย (Network Segmentation) และการเฝ้าระวังความผิดปกติของเครื่องช่วยหายใจ',
        realWorldScenario:
          'ทีมเทคโนโลยีดิจิทัลการแพทย์ออกแบบสถาปัตยกรรมเครือข่ายของโรงพยาบาล โดยแยกอุปกรณ์ช่วยชีวิต (Life-support devices) ออกจากเครือข่ายอินเทอร์เน็ตสาธารณะ เพื่อป้องกันไม่ให้มัลแวร์จากภายนอกเข้าแทรกแซงการทำงานของเครื่องมือแพทย์',
        suggestedChatPrompt:
          'หลักการ Network Segmentation และ Zero Trust Architecture นำมาใช้ปกป้องอุปกรณ์การแพทย์ในโรงพยาบาลอย่างไร?'
      }
    ],
    reviewQuestions: [
      {
        id: 'dtm123-q1',
        questionNumber: 1,
        question: 'คำว่า IoMT (Internet of Medical Things) แตกต่างจากอุปกรณ์ IoT สำหรับผู้บริโภคทั่วไปอย่างไร?',
        answer:
          'IoMT ต้องผ่านการรับรองมาตรฐานความแม่นยำระดับเครื่องมือแพทย์ (Medical-grade accuracy), มีความน่าเชื่อถือสูงมากในการทำงานต่อเนื่อง (High reliability), และต้องมีระบบรักษาความปลอดภัยและการเข้ารหัสข้อมูลสุขภาพที่เข้มงวดตามมาตรฐานการแพทย์',
        rationale:
          'เนื่องจากความผิดพลาดของข้อมูลจากอุปกรณ์ IoMT อาจส่งผลกระทบโดยตรงต่อชีวิตและการตัดสินใจทางคลินิกของผู้ป่วย',
        suggestedChatPrompt: 'เปรียบเทียบมาตรฐานความปลอดภัยและการรับรองระหว่าง Consumer IoT กับ IoMT'
      },
      {
        id: 'dtm123-q2',
        questionNumber: 2,
        question: 'ทำไมข้อมูลประวัติการรักษาผู้ป่วยจึงถือเป็น Sensitive Personal Data ตามกฎหมาย PDPA?',
        answer:
          'เพราะข้อมูลสุขภาพมีความอ่อนไหวสูง หากเกิดการรั่วไหลอาจส่งผลให้เจ้าของข้อมูลถูกริดรอนสิทธิ์ ถูกเลือกปฏิบัติทางสังคมหรือการประกันภัย และอาจสร้างความเสียหายร้ายแรงต่อชื่อเสียงหรือสิทธิส่วนบุคคล',
        rationale:
          'กฎหมายจึงกำหนดให้การประมวลผลข้อมูลสุขภาพต้องได้รับความยินยอมโดยชัดแจ้ง (Explicit Consent) หรือมีข้อยกเว้นทางกฎหมายที่ชัดเจน เช่น เพื่อประโยชน์ในการรักษาชีวิต',
        suggestedChatPrompt: 'อธิบายข้อยกเว้นตามกฎหมายในการประมวลผลข้อมูลสุขภาพผู้ป่วยในกรณีฉุกเฉินทางการแพทย์'
      },
      {
        id: 'dtm123-q3',
        questionNumber: 3,
        question: 'ปัญหาการขาดความสามารถในการทำงานร่วมกัน (Lack of Interoperability) ส่งผลเสียต่อการดูแลผู้ป่วยอย่างไร?',
        answer:
          'ทำให้ข้อมูลถูกขังอยู่ในระบบของแต่ละบริษัท (Data Silos) แพทย์ไม่สามารถเข้าถึงประวัติการแพ้ยาหรือผลแล็บจากโรงพยาบาลอื่นได้ ทำให้ต้องเจาะเลือดซ้ำ เสียเวลาในการส่งต่อผู้ป่วย และอาจเกิดข้อผิดพลาดในการสั่งยาขัดกัน',
        rationale:
          'Interoperability จึงเป็นเป้าหมายหลักของการพัฒนาระบบสุขภาพดิจิทัล เพื่อให้ข้อมูลเดินทางไปพร้อมกับผู้ป่วยได้อย่างไร้รอยต่อ',
        suggestedChatPrompt: 'ยกตัวอย่างผลกระทบของ Data Silo ในโรงพยาบาล และแนวทางการแก้ไขด้วยมาตรฐานสากล'
      }
    ],
    learningPathway: {
      prerequisiteSuggestions: [
        'พื้นฐานการใช้งานคอมพิวเตอร์ เครือข่าย และอินเทอร์เน็ตทั่วไป',
        'ความรู้พื้นฐานเกี่ยวกับระบบบริการสาธารณสุขและโรงพยาบาล'
      ],
      subsequentSuggestions: [
        'ระบบบริหารสารสนเทศสุขภาพและการแพทย์ (DTM67-212)',
        'การเขียนโปรแกรมและการเชื่อมต่อ API ทางการแพทย์',
        'ระบบปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูลทางการแพทย์ (Medical Data Science & AI)'
      ],
      labelNote: 'ข้อเสนอแนะด้านการเรียนรู้เพื่อวางแผนศึกษาด้วยตนเอง — ไม่ใช่ prerequisite ทางการของหลักสูตร'
    },
    sourceStatus: {
      guideType: 'general_knowledge_learning_guide',
      officialDescriptionAvailable: false,
      hasPrimarySyllabusDocument: false,
      academicYearConfirmed: false,
      confirmedSourceReference:
        'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ หน้า 7'
    }
  },

  // =========================================================================
  // 3. DTM67-212: ระบบบริหารสารสนเทศสุขภาพและการแพทย์ (Health and Medical Information Management Systems)
  // =========================================================================
  'DTM67-212': {
    courseCode: 'DTM67-212',
    topicOverview:
      'การศึกษาโครงสร้าง สถาปัตยกรรม และการบริหารจัดการระบบสารสนเทศในโรงพยาบาลและเครือข่ายสุขภาพ ประกอบด้วยระบบสารสนเทศโรงพยาบาล (Hospital Information System: HIS), เวชระเบียนอิเล็กทรอนิกส์ (EMR และ EHR), ระบบสารสนเทศห้องปฏิบัติการ (LIS), ระบบภาพถ่ายการแพทย์และการสื่อสาร (PACS/RIS) ตลอดจนมาตรฐานการแลกเปลี่ยนข้อมูลระดับสากล เช่น HL7 FHIR และ DICOM รวมถึงการออกแบบกระบวนการทำงานทางคลินิก (Clinical Workflow) ให้มีประสิทธิภาพและปลอดภัย',
    disclaimer: DTM_LEARNING_GUIDE_DISCLAIMER,
    keyTakeaways: [
      'เข้าใจความแตกต่างเชิงสถาปัตยกรรมและบทบาทหน้าที่ระหว่าง HIS, EMR, EHR, LIS, RIS และ PACS',
      'เข้าใจหลักการทำงานของมาตรฐานการแลกเปลี่ยนข้อมูลสุขภาพระดับสากล โดยเฉพาะ HL7 FHIR และ DICOM',
      'สามารถวิเคราะห์ Clinical Workflow ตั้งแต่การลงทะเบียนผู้ป่วย การสั่งตรวจ การรายงานผล ไปจนถึงการจำหน่ายและเรียกเก็บเงิน',
      'เข้าใจการบริหารคุณภาพ ความถูกต้อง และความสมบูรณ์ของข้อมูลสุขภาพในระบบฐานข้อมูลขนาดใหญ่'
    ],
    keyConcepts: [
      {
        id: 'dtm212-concept-1',
        order: 1,
        title: 'สถาปัตยกรรมระบบสารสนเทศโรงพยาบาล (Hospital Information System: HIS Architecture)',
        summary: 'ระบบซอฟต์แวร์แกนกลางที่บูรณาการงานบริการทางการแพทย์ งานสนับสนุน และงานบริหารจัดการของโรงพยาบาล',
        explanation:
          'HIS ทำหน้าที่เป็นโครงข่ายประสาทของโรงพยาบาล เชื่อมโยงโมดูลทะเบียนผู้ป่วย (Patient Registration / Master Patient Index), การนัดหมาย (Appointment), การตรวจรักษาของแพทย์ (Doctor Order Entry / OPD / IPD), งานพยาบาล, คลังยาและเภสัชกรรม, ตลอดจนระบบบัญชีและการเบิกจ่ายค่ารักษา',
        suggestedChatPrompt:
          'ช่วยอธิบายโมดูลหลักต่างๆ ที่ประกอบขึ้นเป็นระบบสารสนเทศโรงพยาบาล (HIS) และความเชื่อมโยงระหว่างกัน'
      },
      {
        id: 'dtm212-concept-2',
        order: 2,
        title: 'เวชระเบียนอิเล็กทรอนิกส์: EMR เทียบกับ EHR (Electronic Medical Records vs Electronic Health Records)',
        summary: 'ความแตกต่างระหว่างการบันทึกประวัติภายในสถานพยาบาลเดี่ยว (EMR) กับการเชื่อมโยงข้อมูลสุขภาพข้ามสถานพยาบาล (EHR)',
        explanation:
          'EMR มุ่งเน้นการบันทึกประวัติการตรวจรักษาและการสั่งยาภายในองค์กรพยาบาลเดียว ในขณะที่ EHR มีสถาปัตยกรรมที่เปิดกว้างและมุ่งเน้นความสามารถในการแลกเปลี่ยนข้อมูลตามมาตรฐาน ทำให้ข้อมูลเดินทางไปพร้อมผู้ป่วยเมื่อเปลี่ยนสถานพยาบาล',
        suggestedChatPrompt:
          'เปรียบเทียบความแตกต่างระหว่าง EMR และ EHR ทั้งในแง่ของขอบเขตข้อมูล ความเป็นเจ้าของ และการแลกเปลี่ยนข้อมูล'
      },
      {
        id: 'dtm212-concept-3',
        order: 3,
        title: 'ระบบสนับสนุนทางคลินิกเฉพาะทาง: LIS, RIS และ PACS (Specialized Clinical Systems)',
        summary: 'ระบบสารสนเทศห้องปฏิบัติการ ระบบสารสนเทศรังสีวิทยา และระบบจัดเก็บส่งผ่านภาพถ่ายทางการแพทย์',
        explanation:
          'ระบบสนับสนุนทางคลินิกมีลักษณะเฉพาะ: LIS เชื่อมต่อกับเครื่องตรวจวิเคราะห์เลือดและปัสสาวะอัตโนมัติ (Lab Automation); RIS บริหารจัดการคิวและการนัดหมายตรวจรังสี; ส่วน PACS ทำหน้าที่จัดเก็บภาพถ่ายดิจิทัลความละเอียดสูง (X-ray, CT, MRI) และแสดงผลบนหน้าจอมาตรฐานทางการแพทย์',
        suggestedChatPrompt:
          'ช่วยอธิบายบทบาทและการทำงานร่วมกันระหว่างระบบ LIS, RIS และ PACS ในโรงพยาบาล'
      },
      {
        id: 'dtm212-concept-4',
        order: 4,
        title: 'มาตรฐานการแลกเปลี่ยนข้อมูลสุขภาพ: HL7 FHIR และ DICOM (Interoperability Standards)',
        summary: 'โปรโตคอลมาตรฐานที่ทำให้อุปกรณ์และซอฟต์แวร์ทางการแพทย์สื่อสารกันได้อย่างถูกต้อง',
        explanation:
          'HL7 FHIR (Fast Healthcare Interoperability Resources) ใช้เว็บสถาปัตยกรรม RESTful API และ JSON ในการแลกเปลี่ยนทรัพยากรสุขภาพ (เช่น Patient, Observation, MedicationRequest) ส่วน DICOM เป็นมาตรฐานเฉพาะสำหรับภาพถ่ายทางการแพทย์และข้อมูลเมทาดาทาของภาพ',
        suggestedChatPrompt:
          'ช่วยอธิบายโครงสร้าง Resource ของ HL7 FHIR เช่น Patient, Observation และวิธีการส่งข้อมูลผ่าน RESTful API'
      },
      {
        id: 'dtm212-concept-5',
        order: 5,
        title: 'การวิเคราะห์กระบวนการทำงานทางคลินิกและการนำระบบไปใช้ (Clinical Workflow & Change Management)',
        summary: 'การวิเคราะห์ผังการไหลเวียนของงาน การป้อนคำสั่งการรักษา (CPOE) และการลดภาระงานของบุคลากรทางการแพทย์',
        explanation:
          'การนำระบบสารสนเทศไปใช้ให้สำเร็จไม่ได้ขึ้นอยู่กับเทคโนโลยีเพียงอย่างเดียว แต่ต้องเข้าใจขั้นตอนการทำงานจริงของแพทย์และพยาบาล การออกแบบระบบ CPOE (Computerized Physician Order Entry) ที่ดีต้องช่วยป้องกันการสั่งยาผิดขนาด และไม่สร้างภาระคลิกซ้ำซ้อนให้ผู้ใช้งาน',
        suggestedChatPrompt:
          'การออกแบบระบบ Computerized Physician Order Entry (CPOE) ที่ดีควรมีหลักการเพื่อความปลอดภัยของผู้ป่วยอย่างไร?'
      }
    ],
    technicalVocabulary: [
      {
        id: 'dtm212-vocab-1',
        termEn: 'Hospital Information System (HIS)',
        termTh: 'ระบบสารสนเทศโรงพยาบาล',
        simpleExplanation: 'ระบบซอฟต์แวร์คอมพิวเตอร์รวมศูนย์ที่บริหารจัดการข้อมูลผู้ป่วย งานบริการคลินิก การเงิน และการดำเนินงานของโรงพยาบาล',
        dtmContextExample: 'แพทย์เปิดดูประวัติผู้ป่วยผ่านระบบ HIS ขณะที่ฝ่ายการเงินใช้ระบบเดียวกันตัดยอดค่ารักษาพยาบาล',
        suggestedChatPrompt: 'ระบบ HIS มีส่วนช่วยลดระยะเวลารอคอยของผู้ป่วยในแผนกผู้ป่วยนอก (OPD) อย่างไร?'
      },
      {
        id: 'dtm212-vocab-2',
        termEn: 'HL7 FHIR (Fast Healthcare Interoperability Resources)',
        termTh: 'มาตรฐานการแลกเปลี่ยนข้อมูลสุขภาพแบบเอฟเอชไออาร์',
        simpleExplanation: 'มาตรฐานสากลยุคใหม่ที่ใช้เทคโนโลยีเว็บ (REST, JSON) ในการแลกเปลี่ยนข้อมูลสุขภาพระหว่างแอปพลิเคชัน',
        dtmContextExample: 'แอปพลิเคชันสุขภาพบนมือถือของผู้ป่วยดึงข้อมูลผลแล็บจากโรงพยาบาลผ่าน FHIR Observation Resource',
        suggestedChatPrompt: 'ยกตัวอย่าง JSON Payload ของ HL7 FHIR Patient Resource และอธิบายความหมายของแต่ละฟิลด์'
      },
      {
        id: 'dtm212-vocab-3',
        termEn: 'DICOM (Digital Imaging and Communications in Medicine)',
        termTh: 'มาตรฐานการสื่อสารและจัดเก็บภาพถ่ายทางการแพทย์ดิจิทัล',
        simpleExplanation: 'มาตรฐานสากลสำหรับไฟล์ภาพถ่ายการแพทย์ (CT, MRI, X-ray) ที่บันทึกข้อมูลภาพคู่กับข้อมูลผู้ป่วย (Metadata)',
        dtmContextExample: 'เครื่องสแกน CT ส่งไฟล์ภาพ DICOM ผ่านเครือข่ายเข้าสู่ระบบจัดเก็บ PACS เพื่อให้รังสีแพทย์อ่านผล',
        suggestedChatPrompt: 'ไฟล์ภาพ DICOM แตกต่างจากไฟล์ภาพทั่วไปอย่าง JPEG หรือ PNG อย่างไรในแง่ของ Metadata?'
      },
      {
        id: 'dtm212-vocab-4',
        termEn: 'PACS (Picture Archiving and Communication System)',
        termTh: 'ระบบจัดเก็บและรับส่งภาพถ่ายทางการแพทย์',
        simpleExplanation: 'ระบบเซิร์ฟเวอร์และซอฟต์แวร์สำหรับจัดเก็บ ค้นหา และแสดงภาพรังสีวิทยาทางการแพทย์แทนการใช้ฟิล์มเอกซเรย์แบบเดิม',
        dtmContextExample: 'แพทย์ห้องผ่าตัดเปิดดูภาพเอกซเรย์คอมพิวเตอร์จากระบบ PACS บนจอความละเอียดสูงระหว่างทำการผ่าตัด',
        suggestedChatPrompt: 'PACS ทำงานร่วมกับระบบ RIS (Radiology Information System) อย่างไรในการรับส่งคิวตรวจและรายงานผล?'
      },
      {
        id: 'dtm212-vocab-5',
        termEn: 'Laboratory Information System (LIS)',
        termTh: 'ระบบสารสนเทศห้องปฏิบัติการทางการแพทย์',
        simpleExplanation: 'ระบบซอฟต์แวร์ที่รับคำสั่งตรวจแล็บ เชื่อมต่อเครื่องตรวจเลือดอัตโนมัติ ตรวจสอบคุณภาพ และส่งผลตรวจเข้าเวชระเบียน',
        dtmContextExample: 'เครื่องตรวจ Complete Blood Count (CBC) ส่งค่าเม็ดเลือดแดงและเกล็ดเลือดเข้า LIS เพื่อให้เทคนิคการแพทย์ตรวจสอบก่อนส่งเข้า HIS',
        suggestedChatPrompt: 'กระบวนการทำงานของ LIS ตั้งแต่การรับ Barcode หลอดเลือด จนถึงการ Verify ผลตรวจทางคลินิกเป็นอย่างไร?'
      }
    ],
    applicationExamples: [
      {
        id: 'dtm212-app-1',
        title: 'การส่งต่อข้อมูลผลตรวจแล็บจาก LIS สู่ EHR ของแพทย์แบบอัตโนมัติด้วย HL7 FHIR',
        domain: 'health_information_systems',
        domainLabel: 'ระบบสารสนเทศโรงพยาบาล',
        description: 'การเชื่อมต่อเครื่องตรวจอัตโนมัติเข้ากับฐานข้อมูลเวชระเบียนแบบสองทาง (Bidirectional Interoperability)',
        realWorldScenario:
          'เมื่อนักเทคนิคการแพทย์ตรวจสอบความถูกต้องของผลตรวจเลือด CBC ในระบบ LIS เสร็จสิ้น ระบบจะสร้าง FHIR DiagnosticReport และ Observation Resource ส่งผ่าน API เข้าสู่ระบบ EHR ของแพทย์ผู้สั่งตรวจทันที พร้อมแจ้งเตือนหากค่าวิกฤต (Critical Value)',
        suggestedChatPrompt:
          'ช่วยอธิบายขั้นตอนการไหลของข้อมูลผลตรวจทางห้องปฏิบัติการจากเครื่องตรวจวิเคราะห์อัตโนมัติไปยังจอภาพของแพทย์'
      },
      {
        id: 'dtm212-app-2',
        title: 'การเชื่อมต่อระบบ PACS กับ AI โมเดลตรวจคัดกรองรอยโรคในเอกซเรย์ปอด (Chest X-Ray)',
        domain: 'medical_ai',
        domainLabel: 'ปัญญาประดิษฐ์ทางการแพทย์',
        description: 'การสร้าง Pipeline ดึงภาพ DICOM จาก PACS ส่งเข้าโมเดล Deep Learning แล้วส่งผลทำนายกลับเข้าระบบ RIS',
        realWorldScenario:
          'เมื่อเครื่องถ่ายภาพเอกซเรย์ส่งภาพ DICOM เข้าสู่ PACS ระบบ Routing อัตโนมัติจะส่งสำเนาภาพไปยัง AI Inference Server เพื่อคัดกรองรอยโรคปอดอักเสบ หากพบความเสี่ยงสูง ระบบจะจัดลำดับความสำคัญ (Triage) ของเคสนี้ให้รังสีแพทย์อ่านผลเป็นลำดับแรก',
        suggestedChatPrompt:
          'การผสานโมเดล AI คัดกรองภาพถ่ายรังสีเข้ากับระบบ PACS และ RIS ควรมีสถาปัตยกรรมการแลกเปลี่ยนข้อมูลอย่างไร?'
      }
    ],
    reviewQuestions: [
      {
        id: 'dtm212-q1',
        questionNumber: 1,
        question: 'ระบบ HIS, EMR และ EHR มีความแตกต่างกันอย่างไรในขอบเขตการทำงาน?',
        answer:
          'HIS คือระบบรวมศูนย์บริหารจัดการทั้งโรงพยาบาล (รวมทั้งการเงิน งานทะเบียน คลังยา); EMR คือเวชระเบียนบันทึกประวัติการตรวจรักษาภายในสถานพยาบาลแห่งเดียว; ส่วน EHR คือเวชระเบียนที่ออกแบบมาเพื่อแลกเปลี่ยนข้อมูลสุขภาพของผู้ป่วยข้ามสถานพยาบาลได้อย่างปลอดภัย',
        rationale:
          'การเข้าใจขอบเขตของแต่ละระบบเป็นพื้นฐานสำคัญของสถาปัตยกรรมสารสนเทศสุขภาพ เพื่อไม่ให้เกิดความสับสนในการออกแบบระบบ',
        suggestedChatPrompt: 'ช่วยสรุปเปรียบเทียบฟังก์ชันการทำงานระหว่าง HIS, EMR และ EHR ในตารางสรุป'
      },
      {
        id: 'dtm212-q2',
        questionNumber: 2,
        question: 'เหตุใดมาตรฐาน HL7 FHIR จึงได้รับความนิยมอย่างกว้างขวางเมื่อเทียบกับมาตรฐาน HL7 เวอร์ชันเดิม (เช่น HL7 v2)?',
        answer:
          'เพราะ FHIR สร้างขึ้นบนเทคโนโลยีเว็บสมัยใหม่ ใช้ RESTful API, JSON และ XML ซึ่งโปรแกรมเมอร์และนักพัฒนาซอฟต์แวร์คุ้นเคยเป็นอย่างดี ทำให้เชื่อมต่อแอปพลิเคชันบนมือถือและคลาวด์ได้ง่าย รวดเร็ว และมีเอกสารอ้างอิงที่ชัดเจนกว่าข้อความ Delimited ของ HL7 v2',
        rationale:
          'ความง่ายในการพัฒนา (Developer-friendliness) และความเข้ากันได้กับระบบเว็บสมัยใหม่ทำให้ FHIR กลายเป็นมาตรฐานหลักของสุขภาพดิจิทัลทั่วโลก',
        suggestedChatPrompt: 'เปรียบเทียบข้อดีข้อเสียระหว่างข้อความ HL7 v2 (Pipe-delimited) กับ HL7 FHIR (REST/JSON)'
      },
      {
        id: 'dtm212-q3',
        questionNumber: 3,
        question: 'ในระบบภาพถ่ายทางการแพทย์ ข้อมูลที่เรียกว่า Metadata ในไฟล์ DICOM ประกอบด้วยอะไรบ้าง และทำไมจึงห้ามแยกออกจากตัวภาพ?',
        answer:
          'Metadata ใน DICOM ประกอบด้วยข้อมูลผู้ป่วย (ชื่อ, รหัส HN, เพศ, วันเกิด), ข้อมูลการตรวจ (วันที่, ชนิดเครื่องตรวจ, พารามิเตอร์การแผ่รังสี), และข้อมูลภาพ (ขนาดพิกเซล, ความลึกบิต) ห้ามแยกออกจากกันเพื่อป้องกันความผิดพลาดสลับภาพผู้ป่วยผิดคน (Patient misidentification) ซึ่งอาจเป็นอันตรายถึงชีวิต',
        rationale:
          'ความปลอดภัยของผู้ป่วย (Patient Safety) กำหนดให้ข้อมูลภาพและข้อมูลผู้ป่วยต้องผูกติดกันเป็นเอกภาพเสมอ',
        suggestedChatPrompt: 'ยกตัวอย่างแท็ก Metadata ที่สำคัญในมาตรฐาน DICOM Header เช่น PatientID, StudyDate, Modality'
      }
    ],
    learningPathway: {
      prerequisiteSuggestions: [
        'พื้นฐานเทคโนโลยีดิจิทัลทางการแพทย์ (DTM67-123)',
        'พื้นฐานระบบฐานข้อมูลและเครือข่ายคอมพิวเตอร์เบื้องต้น'
      ],
      subsequentSuggestions: [
        'วิศวกรรมข้อมูลทางการแพทย์ (Medical Data Engineering)',
        'การวิเคราะห์ภาพถ่ายทางการแพทย์ (Medical Image Analytics)',
        'การพัฒนาแอปพลิเคชันเชื่อมโยงสุขภาพตามมาตรฐาน HL7 FHIR'
      ],
      labelNote: 'ข้อเสนอแนะด้านการเรียนรู้เพื่อวางแผนศึกษาด้วยตนเอง — ไม่ใช่ prerequisite ทางการของหลักสูตร'
    },
    sourceStatus: {
      guideType: 'general_knowledge_learning_guide',
      officialDescriptionAvailable: false,
      hasPrimarySyllabusDocument: false,
      academicYearConfirmed: false,
      confirmedSourceReference:
        'เล่มหลักสูตร มคอ.2 วท.บ. สาขาเทคโนโลยีดิจิทัลทางการแพทย์ (ปรับปรุง พ.ศ. 2567) ม.วลัยลักษณ์ หน้า 6'
    }
  }
};

/**
 * ดึง Learning Guide ตามรหัสวิชา
 * คืนค่า undefined หากยังไม่มีคู่มือสำหรับวิชานั้น (ห้ามแสดงวิชาอื่นแทนโดยเงียบๆ)
 */
export function getDtmLearningGuide(courseCode?: string): DtmLearningGuide | undefined {
  if (!courseCode) return undefined;
  const normalized = courseCode.trim().toUpperCase();
  return DTM_LEARNING_GUIDES[normalized];
}

/**
 * ตรวจสอบว่าวิชานั้นมี Learning Guide จัดเตรียมไว้หรือไม่
 */
export function hasDtmLearningGuide(courseCode?: string): boolean {
  return Boolean(getDtmLearningGuide(courseCode));
}

/**
 * รายการรหัสวิชาที่มี Learning Guide ในระบบปัจจุบัน
 */
export function getAvailableLearningGuideCourseCodes(): string[] {
  return Object.keys(DTM_LEARNING_GUIDES);
}
