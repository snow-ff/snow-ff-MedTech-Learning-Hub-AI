import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Tag,
  ExternalLink,
  ChevronRight,
  Compass,
  Cpu,
  Activity,
  Microscope,
  FileQuestion,
  Lightbulb,
  GitCompare,
  ListOrdered,
  Stethoscope,
  BookA
} from 'lucide-react';
import {
  LEARNING_DOMAIN_GROUPS,
  getAllLearningTopics,
  STUDY_WORKFLOW_OPTIONS,
  LearningDomainTopic,
  LearningDomainGroupId,
  StudyWorkflowType
} from '../data/learningDomainCatalog';

interface LearningDomainCatalogViewProps {
  onSelectTopicWorkflow: (topic: LearningDomainTopic, workflow: StudyWorkflowType) => void;
  onOpenLearningGuide?: (courseCode: string) => void;
}

export function LearningDomainCatalogView({
  onSelectTopicWorkflow,
  onOpenLearningGuide
}: LearningDomainCatalogViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<LearningDomainGroupId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorkflowModalTopic, setActiveWorkflowModalTopic] = useState<LearningDomainTopic | null>(null);

  const allTopics = useMemo(() => getAllLearningTopics(), []);

  const filteredTopics = useMemo(() => {
    return allTopics.filter(topic => {
      if (selectedGroup !== 'all' && topic.groupId !== selectedGroup) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        topic.nameTh.toLowerCase().includes(q) ||
        topic.nameEn.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.scope.toLowerCase().includes(q) ||
        topic.keywords.some(k => k.toLowerCase().includes(q)) ||
        topic.aliases.some(a => a.toLowerCase().includes(q)) ||
        topic.associatedCurriculumCourseCodes.some(c => c.toLowerCase().includes(q))
      );
    });
  }, [allTopics, selectedGroup, searchQuery]);

  const getGroupIcon = (groupId: LearningDomainGroupId) => {
    switch (groupId) {
      case 'medical_foundations':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'medical_technology':
        return <Microscope className="w-5 h-5 text-emerald-400" />;
      case 'digital_health_dtm':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getWorkflowIcon = (id: StudyWorkflowType) => {
    switch (id) {
      case 'explain':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'compare':
        return <GitCompare className="w-4 h-4 text-purple-400" />;
      case 'step_by_step':
        return <ListOrdered className="w-4 h-4 text-emerald-400" />;
      case 'clinical_dtm_application':
        return <Stethoscope className="w-4 h-4 text-cyan-400" />;
      case 'vocabulary':
        return <BookA className="w-4 h-4 text-blue-400" />;
      case 'quiz_review':
        return <FileQuestion className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>แผนที่การเรียนรู้และโดเมนวิชาการ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-mono border border-cyan-800">
                  v1.2 Catalog
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                โครงสร้าง 3 กลุ่มโดเมนหลัก • 28 หัวข้อการเรียนรู้ • เชื่อมโยงรหัสหลักสูตรทางการ DTM 2567 ม.วลัยลักษณ์
              </p>
            </div>
          </div>

          {/* Search Bar & Group Filter */}
          <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหัวข้อ, ศัพท์เทคนิค, คีย์เวิร์ด หรือรหัสวิชา (เช่น DTM67-111, PCR, DICOM)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedGroup === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                ทั้งหมด ({allTopics.length})
              </button>
              {LEARNING_DOMAIN_GROUPS.map(grp => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setSelectedGroup(grp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedGroup === grp.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {getGroupIcon(grp.id)}
                  <span>{grp.nameTh}</span>
                  <span className="text-[10px] opacity-80">({grp.topicsCount})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Topics Content List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {filteredTopics.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
              <p className="font-medium text-slate-300">ไม่พบหัวข้อที่ตรงกับ "{searchQuery}"</p>
              <p className="text-xs text-slate-500">ลองค้นหาด้วยคำอื่น หรือคลิก "ทั้งหมด" เพื่อดูหัวข้อทั้งหมดในระบบ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map(topic => {
                const groupInfo = LEARNING_DOMAIN_GROUPS.find(g => g.id === topic.groupId);
                return (
                  <div
                    key={topic.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm group hover:shadow-cyan-950/20"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium flex items-center gap-1">
                          {getGroupIcon(topic.groupId)}
                          <span className="truncate max-w-[140px]">{groupInfo?.nameTh}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {topic.recommendedLevel}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-semibold text-white text-base group-hover:text-cyan-300 transition-colors">
                          {topic.nameTh}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{topic.nameEn}</p>
                      </div>

                      {/* Description & Scope */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {topic.description}
                      </p>

                      {/* Availability Badges */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                        {topic.contentAvailability.hasLocalKnowledgeBase && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-medium flex items-center gap-1" title="มีเนื้อหาสำรองในคลังความรู้พื้นฐาน รองรับการเรียนรู้ออฟไลน์ทันที">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>คลังความรู้พร้อมใช้ (Offline)</span>
                          </span>
                        )}
                        {topic.contentAvailability.hasLearningGuide && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-medium flex items-center gap-1" title="มีคู่มือการเรียนรู้ DTM อย่างละเอียด">
                            <BookOpen className="w-3 h-3 text-indigo-400" />
                            <span>คู่มือการเรียนรู้ DTM</span>
                          </span>
                        )}
                        {topic.contentAvailability.isGeminiOnDemandOnly && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-medium flex items-center gap-1" title="สอบถามผ่านโมเดล Gemini AI สด หรืออัปโหลดเอกสารเพื่อติวอิงเอกสาร">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Gemini On-demand</span>
                          </span>
                        )}
                      </div>

                      {/* Official Curriculum Codes */}
                      {topic.associatedCurriculumCourseCodes.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 flex-wrap text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-slate-400 text-[10px]">รายวิชา DTM 2567:</span>
                          {topic.associatedCurriculumCourseCodes.map(code => (
                            <span
                              key={code}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Keywords */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                        {topic.keywords.slice(0, 3).map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] border border-slate-800"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {topic.contentAvailability.hasLearningGuide && topic.associatedCurriculumCourseCodes[0] && onOpenLearningGuide ? (
                        <button
                          type="button"
                          onClick={() => onOpenLearningGuide(topic.associatedCurriculumCourseCodes[0])}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ดูคู่มือ</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveWorkflowModalTopic(topic)}
                        className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>เริ่มติวหัวข้อนี้</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Selection Modal */}
      {activeWorkflowModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                  เลือกรูปแบบการเรียนรู้ (Study Workflow)
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {activeWorkflowModalTopic.nameTh}
                </h2>
                <p className="text-xs text-slate-400">{activeWorkflowModalTopic.nameEn}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkflowModalTopic(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              เลือกลักษณะคำตอบที่ต้องการให้ระบบช่วยสรุปและวิเคราะห์สำหรับหัวข้อนี้:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {STUDY_WORKFLOW_OPTIONS.map(wf => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => {
                    const topic = activeWorkflowModalTopic;
                    setActiveWorkflowModalTopic(null);
                    onSelectTopicWorkflow(topic, wf.id);
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-600/70 text-left transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white group-hover:text-cyan-300 text-xs">
                      {getWorkflowIcon(wf.id)}
                      <span>{wf.nameTh}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {wf.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-cyan-400 opacity-80 group-hover:opacity-100">
                    <span>{wf.nameEn}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>สามารถเปลี่ยนรูปแบบหรือถามต่อในแชตได้ตลอดเวลา</span>
              <button
                type="button"
                onClick={() => setActiveWorkflowModalTopic(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
