import { LearningDocument } from '../models/coreModel';
import { chunkText } from './documentChunker';

const DB_NAME = 'MedTechLearningHub_DB';
const DB_VERSION = 1;
const STORE_NAME = 'learning_documents';

// In-memory fallback cache for SSR/Vitest environments or when IndexedDB is not available
const memoryStorage: Map<string, LearningDocument> = new Map();

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('courseCode', 'courseCode', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save or update a learning document in IndexedDB (or memory fallback).
 */
export async function saveDocument(doc: LearningDocument): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStorage.set(doc.id, { ...doc });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const all = Array.from(memoryStorage.values());
        window.localStorage.setItem('medtech_docs_fallback', JSON.stringify(all));
      }
    } catch {
      // Ignore localStorage quote limits
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Error saving document'));
  });
}

/**
 * Get all learning documents sorted by createdAt descending.
 */
export async function getAllDocuments(): Promise<LearningDocument[]> {
  if (!isIndexedDBAvailable()) {
    if (memoryStorage.size === 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('medtech_docs_fallback');
        if (raw) {
          const list: LearningDocument[] = JSON.parse(raw);
          list.forEach(d => memoryStorage.set(d.id, d));
        }
      } catch {
        // Ignore JSON error
      }
    }
    return Array.from(memoryStorage.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const docs: LearningDocument[] = request.result || [];
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(docs);
    };

    request.onerror = () => reject(request.error || new Error('Error retrieving documents'));
  });
}

/**
 * Get document by its unique ID.
 */
export async function getDocumentById(id: string): Promise<LearningDocument | null> {
  if (!isIndexedDBAvailable()) {
    return memoryStorage.get(id) || null;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Error retrieving document'));
  });
}

/**
 * Delete a document by its ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStorage.delete(id);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const all = Array.from(memoryStorage.values());
        window.localStorage.setItem('medtech_docs_fallback', JSON.stringify(all));
      }
    } catch {
      // Ignore
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Error deleting document'));
  });
}

/**
 * Search documents by title, tags, or course code.
 */
export async function searchDocuments(query: string, courseCode?: string): Promise<LearningDocument[]> {
  const allDocs = await getAllDocuments();
  const q = (query || '').toLowerCase().trim();

  return allDocs.filter(doc => {
    if (courseCode && courseCode !== 'all' && doc.courseCode !== courseCode) {
      return false;
    }

    if (!q) return true;

    const titleMatch = doc.title.toLowerCase().includes(q);
    const filenameMatch = (doc.filename || '').toLowerCase().includes(q);
    const courseMatch = (doc.courseCode || '').toLowerCase().includes(q) || (doc.courseTitle || '').toLowerCase().includes(q);
    const tagMatch = doc.tags?.some(t => t.toLowerCase().includes(q));
    const snippetMatch = (doc.rawSnippet || '').toLowerCase().includes(q);

    return titleMatch || filenameMatch || courseMatch || tagMatch || snippetMatch;
  });
}

/**
 * Clear all documents (for reset/testing).
 */
export async function clearAllDocuments(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStorage.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('medtech_docs_fallback');
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Error clearing documents'));
  });
}

/**
 * Seed initial high-quality sample documents if the library is empty.
 */
export async function seedSampleDocumentsIfEmpty(): Promise<LearningDocument[]> {
  const existing = await getAllDocuments();
  if (existing.length > 0) {
    return existing;
  }

  const sample1Text = `คู่มือปฏิบัติการเคมีคลินิกและการควบคุมคุณภาพ (Clinical Chemistry & QC Guide)
บทที่ 1: การตรวจวิเคราะห์ระดับน้ำตาลและไขมันในเลือด
การตรวจวัด Fasting Plasma Glucose (FPG) ตามเกณฑ์สากล ADA:
- ค่าปกติ: 70 - 99 mg/dL
- ภาวะเสี่ยงเบาหวาน (Impaired Fasting Glucose): 100 - 125 mg/dL
- เบาหวาน (Diabetes Mellitus): >= 126 mg/dL (ตรวจยืนยันอย่างน้อย 2 ครั้ง)

การตรวจ HbA1c (Glycated Hemoglobin):
- ค่าปกติ: < 5.7%
- ภาวะก่อนเบาหวาน: 5.7% - 6.4%
- เบาหวาน: >= 6.5%

บทที่ 2: กฎ Westgard Rules ในการควบคุมคุณภาพภายในห้องปฏิบัติการ (Internal Quality Control)
การแปลผลการทดสอบตามข้อกำหนด Westgard Multirule เพื่อตรวจสอบ Systematic และ Random Error:
1. 1(2s): ค่าควบคุม 1 ค่าออกนอกช่วง +/- 2SD ใช้เป็น Warning rule
2. 1(3s): ค่าควบคุม 1 ค่าออกนอกช่วง +/- 3SD บ่งชี้ Random Error หรือเริ่มมี Systematic Error ขนาดใหญ่ (ห้ามรายงานผล)
3. 2(2s): ค่าควบคุม 2 ค่าติดต่อกันออกนอกช่วง +/- 2SD ในทิศทางเดียวกัน บ่งชี้ Systematic Error
4. R(4s): ค่าควบคุม 2 ค่าในรอบเดียวกันมีผลต่างกันเกิน 4SD (เช่น ค่าหนึ่ง +2SD อีกค่า -2SD) บ่งชี้ Random Error
5. 4(1s): ค่าควบคุม 4 ค่าติดต่อกันออกนอกช่วง +/- 1SD ในทิศทางเดียวกัน บ่งชี้ Systematic Shift
6. 10(x): ค่าควบคุม 10 ค่าติดต่อกันอยู่ฝั่งเดียวกันของค่าเฉลี่ย (Mean) บ่งชี้ Systematic Bias`;

  const sample2Text = `สรุปเนื้อหาวิชาการ: ปัญญาประดิษฐ์และการประมวลผลสัญญาณทางการแพทย์ (DTM201)
หัวข้อ: การจำแนกภาพถ่ายเซลล์เม็ดเลือดด้วย Deep Learning (CNN)
1. การเตรียมข้อมูลภาพเม็ดเลือด (Peripheral Blood Smear Preprocessing):
- การปรับค่าแสง (Color Normalization) ตามเทคนิค Reinhard หรือ Macenko เพื่อชดเชยความต่างของการย้อมสี Wright-Giemsa
- การแบ่งส่วนภาพเซลล์ (Cell Segmentation) ด้วยสถาปัตยกรรม U-Net เพื่อแยก Red Blood Cell, White Blood Cell และ Platelet

2. ตัวชี้วัดประสิทธิภาพของโมเดลทางการแพทย์ (Medical Model Evaluation Metrics):
- ความไว (Sensitivity / Recall) = TP / (TP + FN) - มีความสำคัญสูงสุดในการคัดกรองโรค (Screening) เพื่อป้องกันการพลาดเคสผู้ป่วย (False Negative)
- ความจำเพาะ (Specificity) = TN / (TN + FP) - มีความสำคัญในการยืนยันผล (Confirmation)
- ค่าความแม่นยำเฉลี่ย (mAP / Mean Average Precision) สำหรับโมเดล Object Detection เช่น YOLOv8 ในการนับจำนวนเม็ดเลือดอัตโนมัติ`;

  const doc1Id = 'doc-sample-cc-qc';
  const chunks1 = chunkText(sample1Text, { documentId: doc1Id, maxChunkChars: 600 });
  const doc1: LearningDocument = {
    id: doc1Id,
    title: 'คู่มือปฏิบัติการเคมีคลินิกและการควบคุมคุณภาพ (QC & Westgard Rules)',
    filename: 'clinical_chemistry_qc_guide.md',
    fileSize: sample1Text.length,
    type: 'note',
    courseCode: 'DTM101',
    courseTitle: 'Introduction to Health Informatics',
    tags: ['เคมีคลินิก', 'Westgard Rules', 'QC', 'เบาหวาน'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    totalChars: sample1Text.length,
    totalPages: Math.max(1, Math.ceil(sample1Text.length / 800)),
    chunks: chunks1,
    rawSnippet: sample1Text.slice(0, 200) + '...'
  };

  const doc2Id = 'doc-sample-dtm-ai';
  const chunks2 = chunkText(sample2Text, { documentId: doc2Id, maxChunkChars: 600 });
  const doc2: LearningDocument = {
    id: doc2Id,
    title: 'สรุปบรรยาย: ปัญญาประดิษฐ์วิเคราะห์ภาพเซลล์เม็ดเลือด (CNN & U-Net)',
    filename: 'dtm201_blood_cell_ai_notes.md',
    fileSize: sample2Text.length,
    type: 'note',
    courseCode: 'DTM201',
    courseTitle: 'Data Structure and Algorithm in Medicine',
    tags: ['AI เมดิคัล', 'โลหิตวิทยา', 'CNN', 'U-Net'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    totalChars: sample2Text.length,
    totalPages: Math.max(1, Math.ceil(sample2Text.length / 800)),
    chunks: chunks2,
    rawSnippet: sample2Text.slice(0, 200) + '...'
  };

  await saveDocument(doc1);
  await saveDocument(doc2);

  return [doc1, doc2];
}
