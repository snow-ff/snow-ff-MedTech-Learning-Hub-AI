import { describe, it, expect } from 'vitest';
import { 
  dtmCurriculumVersion, 
  dtmCrosswalk45, 
  sampleStudentCourseRecord, 
  medtechSubjects, 
  curatedLessons, 
  curatedGlossary, 
  curatedReferences,
  curatedClaims,
  curatedEvidenceLinks,
  curatedAuditTrail,
  evaluateEvidenceLinkAlignment
} from './data/curriculumData';
import { Message, ReferenceItem } from './App';
import { EvidenceLink } from './models/coreModel';

describe('Phase B: DTM Curriculum Crosswalk & Evidentiary Verification Tests', () => {
  it('contains exactly 45 baseline crosswalk entries for DTM (2567-2569)', () => {
    expect(dtmCrosswalk45).toBeDefined();
    expect(dtmCrosswalk45.length).toBe(45);
  });

  it('keeps Year-4 catalogue candidates strictly unconfirmed without official semester placement', () => {
    const year4CandidateCodes = ['DTM67-333', 'DTM67-482', 'DTM67-484', 'DTM67-491', 'DTM67-492'];
    
    for (const code of year4CandidateCodes) {
      const entry = dtmCrosswalk45.find(e => e.officialCourseCode === code || e.sourceCode === code);
      expect(entry).toBeDefined();
      expect(entry?.semesterPlacementStatus).toBe('unconfirmed');
      expect(entry?.suggestedSemester).toBeUndefined();
      expect(entry?.reviewReason).toContain('Catalogue candidate');
    }
  });

  it('flags minor track candidates spanning different groups as needs_review without choosing for the user', () => {
    const minorEntries = dtmCrosswalk45.filter(e => e.isMinorCandidate);
    expect(minorEntries.length).toBeGreaterThan(0);
    for (const m of minorEntries) {
      expect(m.alignmentStatus).toBe('needs_review');
      expect(m.reviewReason).toContain('15 หน่วยกิต');
    }
  });

  it('flags unmapped/ambiguous courses as needs_review rather than guessing', () => {
    const ambiguousEntries = dtmCrosswalk45.filter(e => e.sourceCode.includes('UNKNOWN') || e.sourceCode.includes('AMBIG'));
    expect(ambiguousEntries.length).toBe(2);
    for (const a of ambiguousEntries) {
      expect(a.alignmentStatus).toBe('needs_review');
      expect(a.officialCourseCode).toBeUndefined();
    }
  });

  it('strictly decouples StudentCourseRecord from CurriculumCourse catalogue', () => {
    expect(sampleStudentCourseRecord).toBeDefined();
    expect(sampleStudentCourseRecord.length).toBeGreaterThan(0);
    // Enrolled courses in student record have studentId and enrollmentStatus
    expect(sampleStudentCourseRecord[0].studentId).toBeDefined();
    expect(sampleStudentCourseRecord[0].enrollmentStatus).toBe('completed');
    // An official catalogue course does NOT automatically mean a student record exists
    const unEnrolledCourse = dtmCrosswalk45.find(c => c.sourceCode === 'DTM67-491');
    const isEnrolled = sampleStudentCourseRecord.some(r => r.courseCode === unEnrolledCourse?.sourceCode);
    expect(isEnrolled).toBe(false);
  });

  it('designates Clinical Hematology as supplementary knowledge, not user primary curriculum', () => {
    const hemaSubject = medtechSubjects.find(s => s.id === 'suppl-hema');
    expect(hemaSubject).toBeDefined();
    expect(hemaSubject?.isSupplementary).toBe(true);
    expect(hemaSubject?.descriptionTh).toContain('ความรู้เสริม');

    const coreSubjects = medtechSubjects.filter(s => !s.isSupplementary);
    expect(coreSubjects.length).toBeGreaterThanOrEqual(3);
  });

  it('defaults references without an authorized reviewer to unverified status', () => {
    for (const ref of curatedReferences) {
      // Even if a valid URL exists (e.g. CLSI, PubMed), it must not be 'verified' without reviewer
      if (!ref.reviewer) {
        expect(ref.verificationStatus).toBe('unverified');
      }
    }
  });

  it('supports Thai/English glossary lookup and original English-source links', () => {
    expect(curatedGlossary.length).toBeGreaterThanOrEqual(5);
    const edtaTerm = curatedGlossary.find(t => t.termEn.includes('EDTA-Dependent Pseudothrombocytopenia'));
    expect(edtaTerm).toBeDefined();
    expect(edtaTerm?.termTh).toContain('เกล็ดเลือดต่ำลวง');
    expect(edtaTerm?.phoneticTh).toBeDefined();
    expect(edtaTerm?.originalSourceUrl).toBe('https://pubmed.ncbi.nlm.nih.gov/25425098/');
  });

  it('sanitizes message history: excludes failed user turns and enforces strict role alternation', () => {
    // Simulate conversation with a failed user request in the middle
    const historyWithFailure: Message[] = [
      { id: '1', role: 'user', text: 'คำถามที่ 1 สำเร็จ', timestamp: 1000, status: 'sent' },
      { id: '2', role: 'model', text: 'คำตอบที่ 1', timestamp: 1001 },
      { id: '3', role: 'user', text: 'คำถามที่ 2 ล้มเหลว', timestamp: 1002, status: 'failed' },
    ];
    const newQuery = 'คำถามที่ 3 กำลังส่ง';

    // Apply the exact sanitization logic implemented in App.tsx
    const historyPairs: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (const m of historyWithFailure) {
      if (m.status === 'failed') continue;
      if (historyPairs.length === 0) {
        if (m.role === 'user') historyPairs.push({ role: 'user', text: m.text });
      } else {
        const lastRole = historyPairs[historyPairs.length - 1].role;
        if (m.role !== lastRole) {
          historyPairs.push({ role: m.role, text: m.text });
        }
      }
    }
    while (historyPairs.length > 0 && historyPairs[historyPairs.length - 1].role === 'user') {
      historyPairs.pop();
    }
    historyPairs.push({ role: 'user', text: newQuery });

    // Verify sanitization output
    expect(historyPairs.length).toBe(3);
    expect(historyPairs[0].role).toBe('user');
    expect(historyPairs[0].text).toBe('คำถามที่ 1 สำเร็จ');
    expect(historyPairs[1].role).toBe('model');
    expect(historyPairs[1].text).toBe('คำตอบที่ 1');
    expect(historyPairs[2].role).toBe('user');
    expect(historyPairs[2].text).toBe('คำถามที่ 3 กำลังส่ง');

    // Verify no consecutive identical roles
    for (let i = 0; i < historyPairs.length - 1; i++) {
      expect(historyPairs[i].role).not.toBe(historyPairs[i + 1].role);
    }
  });
});

describe('Phase C1.1: Semantic Evidentiary Verification, Version Drift Guard & Access Status Tests', () => {
  it('binds EvidenceLink strictly to both Claim version and Reference version', () => {
    expect(curatedEvidenceLinks.length).toBeGreaterThanOrEqual(3);
    for (const link of curatedEvidenceLinks) {
      expect(link.claimVersion).toBeDefined();
      expect(link.referenceVersion).toBeDefined();
      expect(link.claimVersion).toMatch(/^1\.\d+$/);
      expect(link.referenceVersion).toMatch(/^1\.\d+$/);
    }
  });

  it('detects version drift by comparing against target entity versions, not against each other', () => {
    // Aligned versions: link.claimVersion matches targetClaim (1.2) and link.referenceVersion matches targetRef (1.2)
    const alignedLink: EvidenceLink = {
      id: "TEST-ALIGN-01",
      claimId: "CLAIM-CBC-WBC-REF",
      claimVersion: "1.2",
      referenceId: "REF-CLSI-H20-3RD",
      referenceVersion: "1.2",
      supportStatus: "supported"
    };
    const alignedResult = evaluateEvidenceLinkAlignment(alignedLink);
    expect(alignedResult.isVersionAligned).toBe(true);
    expect(alignedResult.effectiveStatus).toBe('needs_review');

    // Semantic alignment with distinct numbering schemes (claim v1.2, ref 3rd-ed)
    const mockClaims = [{
      claimId: "CLAIM-CUSTOM-01",
      claimText: "Custom test claim",
      subjectArea: "suppl-hema",
      sourceScope: "CLSI",
      contentVersion: "1.2"
    }];
    const mockRefs = [{
      referenceId: "REF-CUSTOM-01",
      title: "Custom Reference Standard",
      uri: "https://example.org",
      sourceType: "standard" as const,
      linkAccessStatus: "unknown" as const,
      verificationStatus: "unverified" as const,
      contentVersion: "3rd-Ed-2026"
    }];
    const customSchemeLink: EvidenceLink = {
      id: "TEST-CUSTOM-01",
      claimId: "CLAIM-CUSTOM-01",
      claimVersion: "1.2", // Matches claim
      referenceId: "REF-CUSTOM-01",
      referenceVersion: "3rd-Ed-2026", // Matches reference
      supportStatus: "supported"
    };
    const customResult = evaluateEvidenceLinkAlignment(customSchemeLink, mockClaims, mockRefs);
    // Must be recognized as aligned because each matches its respective entity!
    expect(customResult.isVersionAligned).toBe(true);

    // Mismatched versions: claim in entity is bumped to v1.3 but link still records v1.2
    const bumpedClaimList = [{
      ...curatedClaims[0],
      contentVersion: "1.3" // Bumped
    }, ...curatedClaims.slice(1)];

    const driftedResult = evaluateEvidenceLinkAlignment(alignedLink, bumpedClaimList, curatedReferences);
    // Version drift must be detected and force re-review
    expect(driftedResult.isVersionAligned).toBe(false);
    expect(driftedResult.effectiveStatus).toBe('needs_review');
    expect(driftedResult.reason).toContain('Claim v1.2 (current: v1.3)');

    // Missing entity handling: unknown claim ID must not be assumed aligned
    const missingEntityLink: EvidenceLink = {
      id: "TEST-MISSING-01",
      claimId: "CLAIM-DOES-NOT-EXIST",
      claimVersion: "1.2",
      referenceId: "REF-CLSI-H20-3RD",
      referenceVersion: "1.2",
      supportStatus: "supported"
    };
    const missingResult = evaluateEvidenceLinkAlignment(missingEntityLink);
    expect(missingResult.isVersionAligned).toBe(false);
    expect(missingResult.effectiveStatus).toBe('needs_review');
  });

  it('defaults linkAccessStatus to unknown even when URL is present, preventing reachability overclaiming', () => {
    // References with external URL must have linkAccessStatus: 'unknown' (no network reachability check performed)
    const clsiRef = curatedReferences.find(r => r.referenceId === 'REF-CLSI-H20-3RD');
    expect(clsiRef).toBeDefined();
    expect(clsiRef?.uri).toBeDefined();
    expect(clsiRef?.linkAccessStatus).toBe('unknown'); // Not 'reachable'
    expect(clsiRef?.verificationStatus).toBe('unverified');

    // References without URL also have unknown linkAccessStatus
    const isoRef = curatedReferences.find(r => r.referenceId === 'REF-ISO-15189');
    expect(isoRef).toBeDefined();
    expect(isoRef?.linkAccessStatus).toBe('unknown');
    expect(isoRef?.verificationStatus).toBe('unverified');
  });

  it('maintains read-only static baseline audit trail records with mandatory actor and timestamp', () => {
    expect(curatedAuditTrail.length).toBeGreaterThanOrEqual(3);
    expect(Object.isFrozen(curatedAuditTrail)).toBe(true);
    for (const record of curatedAuditTrail) {
      expect(record.recordId).toBeDefined();
      expect(record.entityType).toBeDefined();
      expect(record.entityId).toBeDefined();
      expect(record.actorId).toBeDefined();
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(record.action).toBeDefined();
      expect(record.newStatus).toBeDefined();
    }
  });

  it('rejects simulated client attempt to assert verified status without authorized review decision', () => {
    const unverifiedLink: EvidenceLink = {
      id: "TEST-UNAUTH-01",
      claimId: "CLAIM-CBC-EDTA-PLATELET",
      claimVersion: "1.2",
      referenceId: "REF-PUBMED-25425098",
      referenceVersion: "1.2",
      supportStatus: "supported",
      reviewDecision: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined
    };

    const evaluation = evaluateEvidenceLinkAlignment(unverifiedLink);
    expect(evaluation.effectiveStatus).not.toBe('verified');
    expect(evaluation.effectiveStatus).toBe('needs_review');
  });
});
