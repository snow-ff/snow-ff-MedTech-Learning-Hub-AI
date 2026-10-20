/**
 * Learning Source Download & Manual Import Handoff Utilities
 * Project: MedTech Learning Hub AI v1.2
 * Target: DTM67-111 ศัพท์เทคนิคทางการแพทย์ (Technical Terms in Medicine)
 * 
 * Facilitates clear, verifiable download of adapted learning source documents
 * from the Preview UI, guiding learners through the manual import handoff flow
 * into Document Library without relying on inaccessible local file pickers or proxy/cookie check HTML fallbacks.
 */

import dtmSourceRaw from '../../test-assets/ground-truth/dtm67-111-source.md?raw';
import dtmManifestRaw from '../../test-assets/ground-truth/dtm67-111-source-manifest.md?raw';

export interface LearningSourceMetadata {
  id: string;
  filename: string;
  courseCode: string;
  courseTitleThai: string;
  courseTitleEnglish: string;
  sourceUrl: string;
  manifestUrl: string;
  fileSizeBytes: number;
  sha256: string;
  license: string;
  primaryAttribution: string;
  editors: string[];
  publishers: string[];
  externalReferenceUrls: string[];
  disclaimer: string;
  hasNativePages: boolean;
  totalSections: number;
  sections: Array<{
    number: number;
    title: string;
    description: string;
    standardOrigin: string;
  }>;
}

export const DTM67_111_SOURCE_METADATA: LearningSourceMetadata = {
  id: 'dtm67-111-source',
  filename: 'dtm67-111-source.md',
  courseCode: 'DTM67-111',
  courseTitleThai: 'ศัพท์เทคนิคทางการแพทย์',
  courseTitleEnglish: 'Technical Terms in Medicine',
  sourceUrl: '/downloads/dtm67-111-source.md',
  manifestUrl: '/downloads/dtm67-111-source-manifest.md',
  fileSizeBytes: 33296,
  sha256: 'bcd17b8f10d11fb1b470b3a4f5377ad1449066b64ab1e60f090a6f6cc593deeb',
  license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
  primaryAttribution: 'Medical Terminology (2nd Edition, 2024), OpenRN, Chippewa Valley Technical College',
  editors: [
    'Kimberly Ernstmeyer, MSN, RN, CNE, CHSE, APNP-BC',
    'Elizabeth Christman, DNP, RN, CNE'
  ],
  publishers: [
    'Chippewa Valley Technical College (Eau Claire, WI)',
    'Open Resources for Nursing (Open RN)',
    'Wisconsin Technical College System (WTCS)'
  ],
  externalReferenceUrls: [
    'https://wtcs.pressbooks.pub/medterm/',
    'https://www.ncbi.nlm.nih.gov/books/NBK607454/'
  ],
  disclaimer: 'เอกสารนี้เป็นเอกสารสรุปเพื่อการเรียนรู้ที่ดัดแปลงจากแหล่งอ้างอิงแบบเปิด ไม่ใช่เอกสารการสอนอย่างเป็นทางการของมหาวิทยาลัยวลัยลักษณ์ และไม่ได้รับรองโดยเจ้าของต้นฉบับหรือมหาวิทยาลัยวลัยลักษณ์',
  hasNativePages: false,
  totalSections: 7,
  sections: [
    {
      number: 1,
      title: 'แนวคิดพื้นฐานและองค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์',
      description: 'Word Root, Prefix, Suffix, Combining Vowel/Form และกฎการวิเคราะห์ 3 ขั้นตอน',
      standardOrigin: 'OpenRN Medical Terminology 2e (Chapter 1)'
    },
    {
      number: 2,
      title: 'คำอุปสรรคและรากศัพท์กายวิภาคที่พบบ่อย',
      description: 'Prefixes (Brady-, Tachy-, Dys-) และ Roots (Cardi/o, Nephr/o, Hepat/o ฯลฯ)',
      standardOrigin: 'OpenRN Medical Terminology 2e (Chapter 1)'
    },
    {
      number: 3,
      title: 'คำปัจจัยบ่งชี้พยาธิสภาพ อาการ และหัตถการผ่าตัด',
      description: 'Suffixes (-itis, -ectomy, -ostomy, -plasty, -scopy, -centesis ฯลฯ)',
      standardOrigin: 'OpenRN Medical Terminology 2e (Chapter 1)'
    },
    {
      number: 4,
      title: 'ท่ากายวิภาคมาตรฐาน คำระบุทิศทาง และระนาบตัดขวาง',
      description: 'Anatomical Position, Directional Terms, Sagittal/Coronal/Transverse Planes',
      standardOrigin: 'OpenRN Medical Terminology 2e (Chapter 2)'
    },
    {
      number: 5,
      title: 'ช่องว่างภายในร่างกาย และจตุภาคหน้าท้อง 4 ส่วน',
      description: 'Body Cavities, 4 Abdominal Quadrants (RUQ, LUQ, RLQ, LLQ) และอาการทางคลินิก',
      standardOrigin: 'OpenRN Medical Terminology 2e (Chapter 2)'
    },
    {
      number: 6,
      title: 'ตัวย่อทางการแพทย์ กฎความปลอดภัย และรายการ "Do Not Use"',
      description: 'ข้อห้าม Trailing Zero, ข้อบังคับ Leading Zero, U, IU, QD, MS/MSO4',
      standardOrigin: 'The Joint Commission (TJC) & ISMP Patient Safety Standards'
    },
    {
      number: 7,
      title: 'มาตรฐานคำศัพท์ดิจิทัลสุขภาพ',
      description: 'ICD-10/11, SNOMED CT, LOINC, RxNorm, HL7 FHIR ในระบบเทคโนโลยีสารสนเทศสุขภาพ',
      standardOrigin: 'WHO, SNOMED International, Regenstrief Institute & HL7'
    }
  ]
};

export interface ImportHandoffStep {
  step: number;
  title: string;
  detail: string;
  tip?: string;
}

export const DTM67_111_HANDOFF_STEPS: ImportHandoffStep[] = [
  {
    step: 1,
    title: 'ดาวน์โหลดไฟล์เอกสารสรุป (.md)',
    detail: 'คลิกปุ่มดาวน์โหลดเพื่อบันทึกไฟล์ dtm67-111-source.md ลงในโฟลเดอร์ Downloads ของคอมพิวเตอร์คุณ',
    tip: 'ระบบใช้เนื้อหาที่ผูกไว้ในตัวแอป (Bundled Source) ป้องกันปัญหา Cookie check หรือหน้า HTML error จาก Proxy 100%'
  },
  {
    step: 2,
    title: 'เปิดหน้าต่างนำเข้าไฟล์เอกสาร',
    detail: 'ไปที่แท็บ "คลังเอกสาร (Document Library)" ในเมนูหลักด้านบน แล้วคลิกปุ่ม "+ นำเข้าไฟล์เอกสาร"',
    tip: 'ระบบรองรับไฟล์ .pdf, .txt, .md, .json และสกัดข้อความภายในเบราว์เซอร์ 100%'
  },
  {
    step: 3,
    title: 'ผูกรายวิชา DTM67-111',
    detail: 'ในช่อง "เชื่อมโยงกับรายวิชาในหลักสูตร" เลือก "DTM67-111: ศัพท์เทคนิคทางการแพทย์"',
    tip: 'การเลือกวิชาจะช่วยให้ AI โฟกัสบริบทการเรียนรู้ตรงกับเนื้อหาหลักสูตร DTM 2567 ม.วลัยลักษณ์'
  },
  {
    step: 4,
    title: 'เลือกหรือลากไฟล์มาวาง',
    detail: 'ลากไฟล์ dtm67-111-source.md จากโฟลเดอร์ Downloads มาวางในกรอบอัปโหลด หรือคลิกเพื่อเลือกไฟล์',
    tip: 'เอกสารจะถูกจัดเก็บใน IndexedDB เครื่องของคุณ และกำหนด hasNativePages: false เพื่อป้องกันการอ้างเลขหน้าปลอม'
  },
  {
    step: 5,
    title: 'เริ่มเรียนรู้และถามตอบอ้างอิงเอกสาร',
    detail: 'คลิกเลือกเอกสารเพื่อเริ่มโหมดถามตอบวิชาการ (Active Document Grounding Mode) พร้อมระบบตรวจสอบความจริงวิชาการ (Academic Verifier)',
    tip: 'สามารถทดสอบถามคำถาม เช่น "องค์ประกอบ 4 ส่วนของคำศัพท์การแพทย์มีอะไรบ้าง" หรือ "The Joint Commission ห้ามใช้ Trailing Zero อย่างไร"'
  }
];

/**
 * Get bundled DTM67-111 source markdown text directly (zero network risk / no cookie check risk)
 */
export function getBundledDtmSourceText(): string {
  return dtmSourceRaw;
}

/**
 * Get bundled DTM67-111 manifest text directly
 */
export function getBundledDtmManifestText(): string {
  return dtmManifestRaw;
}

/**
 * Trigger file download via programmatic link click
 */
export function triggerFileDownload(url: string, filename: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.warn('[learningSourceDownload] Failed to trigger link download, falling back to fetch blob:', err);
    return false;
  }
}

/**
 * Trigger browser file download from in-memory string content using Blob URL
 */
export function triggerBlobDownload(
  content: string,
  filename: string,
  mimeType = 'text/markdown;charset=utf-8'
): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1500);
    return true;
  } catch (err) {
    console.error('[learningSourceDownload] Failed to trigger blob download:', err);
    return false;
  }
}

/**
 * Securely download DTM67-111 source markdown using bundled raw content (guarantees exact medical terminology markdown, never HTML cookie check)
 */
export function downloadDtm67111SourceSecurely(): boolean {
  const content = getBundledDtmSourceText();
  return triggerBlobDownload(content, DTM67_111_SOURCE_METADATA.filename);
}

/**
 * Securely download DTM67-111 manifest markdown using bundled raw content
 */
export function downloadDtm67111ManifestSecurely(): boolean {
  const content = getBundledDtmManifestText();
  return triggerBlobDownload(content, 'dtm67-111-source-manifest.md');
}

/**
 * Fetch source document text asynchronously with fallback to bundled raw text
 */
export async function fetchLearningSourceText(url = DTM67_111_SOURCE_METADATA.sourceUrl): Promise<string> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      const lower = text.toLowerCase();
      // If fetched text is not HTML error / cookie check, return it
      if (!lower.includes('<!doctype html') && !lower.includes('<html') && !lower.includes('cookie check')) {
        return text;
      }
    }
  } catch (err) {
    console.warn('[learningSourceDownload] Network fetch failed, using bundled fallback:', err);
  }
  return getBundledDtmSourceText();
}

/**
 * Copy learning source text or instructions to clipboard
 */
export async function copyLearningSourceToClipboard(url = DTM67_111_SOURCE_METADATA.sourceUrl): Promise<boolean> {
  try {
    const text = await fetchLearningSourceText(url);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[learningSourceDownload] Clipboard copy failed:', err);
    return false;
  }
}
