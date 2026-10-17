import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  searchDocuments,
  clearAllDocuments,
  seedSampleDocumentsIfEmpty
} from './documentStorage';
import { LearningDocument } from '../models/coreModel';

describe('documentStorage', () => {
  beforeEach(async () => {
    await clearAllDocuments();
  });

  it('should save and retrieve a document', async () => {
    const doc: LearningDocument = {
      id: 'test-doc-1',
      title: 'โลหิตวิทยาคลินิก 101',
      type: 'note',
      courseCode: 'DTM101',
      totalChars: 120,
      totalPages: 1,
      chunks: [
        {
          id: 'c1',
          documentId: 'test-doc-1',
          chunkIndex: 1,
          pageNumber: 1,
          text: 'เนื้อหาเกี่ยวกับ CBC',
          charCount: 20
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveDocument(doc);

    const retrieved = await getDocumentById('test-doc-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('โลหิตวิทยาคลินิก 101');
    expect(retrieved?.courseCode).toBe('DTM101');
    expect(retrieved?.chunks).toHaveLength(1);
  });

  it('should search documents by keyword and courseCode filter', async () => {
    const docA: LearningDocument = {
      id: 'doc-a',
      title: 'การควบคุมคุณภาพ Westgard Rules',
      type: 'note',
      courseCode: 'DTM101',
      tags: ['QC', 'Chemistry'],
      totalChars: 50,
      chunks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docB: LearningDocument = {
      id: 'doc-b',
      title: 'การย้อมสีแบคทีเรีย Gram Stain',
      type: 'note',
      courseCode: 'DTM201',
      tags: ['Microbiology'],
      totalChars: 60,
      chunks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveDocument(docA);
    await saveDocument(docB);

    const resultSearchQC = await searchDocuments('Westgard');
    expect(resultSearchQC).toHaveLength(1);
    expect(resultSearchQC[0].id).toBe('doc-a');

    const resultFilterCourse = await searchDocuments('', 'DTM201');
    expect(resultFilterCourse).toHaveLength(1);
    expect(resultFilterCourse[0].id).toBe('doc-b');
  });

  it('should delete a document by id', async () => {
    const doc: LearningDocument = {
      id: 'doc-to-delete',
      title: 'เอกสารชั่วคราว',
      type: 'text',
      totalChars: 10,
      chunks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveDocument(doc);
    expect(await getDocumentById('doc-to-delete')).not.toBeNull();

    await deleteDocument('doc-to-delete');
    expect(await getDocumentById('doc-to-delete')).toBeNull();
  });

  it('should seed sample documents when library is empty', async () => {
    const seeded = await seedSampleDocumentsIfEmpty();
    expect(seeded.length).toBeGreaterThanOrEqual(2);

    const all = await getAllDocuments();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.some(d => d.title.includes('Westgard'))).toBe(true);
  });
});
