import { useState, useEffect } from 'react';
import { 
  FileText, Folder, Upload, Search, Download, Trash2, File, 
  Compass, Layers, CheckCircle2, AlertTriangle, ShieldCheck,
  Clock, Eye, History, Plus, Filter, ExternalLink, X, FileCheck,
  FlaskConical, Activity, Award, Building2, HardHat, Sparkles
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Documents({ isProjectView = false }) {
  const confirm = useConfirm();
  
  // State
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  // Workspace navigation & filtering
  const [activeTab, setActiveTab] = useState('drawings'); // 'drawings', 'quality', 'contracts'
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [qualityTestFilter, setQualityTestFilter] = useState('ALL');

  // Modals
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Forms
  const [drawingForm, setDrawingForm] = useState({
    projectId: '',
    drawingNumber: '',
    title: '',
    discipline: 'STRUCTURAL',
    revision: 'R0',
    status: 'GFC_ACTIVE',
    issuedBy: 'Sterling Structural Consultants LLP',
    releaseDate: new Date().toISOString().split('T')[0],
    revisionNotes: 'GFC released for site casting and fabrication',
    description: ''
  });

  const [revisionForm, setRevisionForm] = useState({
    targetDocId: '',
    drawingNumber: '',
    title: '',
    revision: '',
    issuedBy: '',
    releaseDate: new Date().toISOString().split('T')[0],
    revisionNotes: ''
  });

  const [qualityForm, setQualityForm] = useState({
    projectId: '',
    title: '',
    testType: 'CONCRETE_CUBE_TEST',
    certificateNumber: '',
    testingAgency: 'State Material & Highway Testing Lab (NABL)',
    testDate: new Date().toISOString().split('T')[0],
    concreteGrade: 'M30',
    locationElement: '',
    sevenDayStrength: '',
    twentyEightDayStrength: '',
    targetStrength: '30',
    complianceStatus: 'PASS',
    description: ''
  });

  // Fetch data
  const fetchData = async (pId = selectedProjectId) => {
    try {
      setLoading(true);
      const query = pId && pId !== 'ALL' ? `?projectId=${pId}` : '';
      
      const [docsRes, sumRes] = await Promise.all([
        api.get(`/documents${query}`),
        api.get(`/documents/summary${query}`)
      ]);

      setDocuments(docsRes.data?.data?.documents || []);
      setSummary(sumRes.data?.data || null);
    } catch (error) {
      toast.error('Failed to load drawing & document vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then(res => {
      const pList = res.data?.data?.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setDrawingForm(prev => ({ ...prev, projectId: pList[0]._id }));
        setQualityForm(prev => ({ ...prev, projectId: pList[0]._id }));
      }
    }).catch(console.error);

    fetchData('ALL');
  }, []);

  const handleProjectFilterChange = (pId) => {
    setSelectedProjectId(pId);
    fetchData(pId);
  };

  // Form Submissions
  const handleCreateDrawing = async (e) => {
    e.preventDefault();
    if (!drawingForm.drawingNumber || !drawingForm.title || !drawingForm.projectId) {
      return toast.error('Please fill required drawing fields');
    }

    try {
      await api.post('/documents', {
        ...drawingForm,
        docType: 'DRAWING_GFC',
        category: 'Drawings & Blueprints'
      });
      toast.success(`Drawing ${drawingForm.drawingNumber} (${drawingForm.revision}) registered as GFC!`);
      setIsDrawingModalOpen(false);
      setDrawingForm({
        projectId: projects[0]?._id || '',
        drawingNumber: '',
        title: '',
        discipline: 'STRUCTURAL',
        revision: 'R0',
        status: 'GFC_ACTIVE',
        issuedBy: 'Sterling Structural Consultants LLP',
        releaseDate: new Date().toISOString().split('T')[0],
        revisionNotes: 'GFC released for site casting and fabrication',
        description: ''
      });
      fetchData(selectedProjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload drawing');
    }
  };

  const handleOpenRevisionModal = (doc) => {
    setSelectedDoc(doc);
    const revNum = parseInt(doc.revision.replace(/\D/g, '') || 0);
    setRevisionForm({
      targetDocId: doc._id,
      drawingNumber: doc.drawingNumber,
      title: doc.title,
      revision: `R${revNum + 1}`,
      issuedBy: doc.issuedBy || 'Consulting Structural Engineer',
      releaseDate: new Date().toISOString().split('T')[0],
      revisionNotes: `Revision update from ${doc.revision}. Previous revision automatically marked SUPERSEDED.`
    });
    setIsRevisionModalOpen(true);
  };

  const handleUploadRevision = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/documents/${revisionForm.targetDocId}/revision`, {
        revision: revisionForm.revision,
        issuedBy: revisionForm.issuedBy,
        releaseDate: revisionForm.releaseDate,
        revisionNotes: revisionForm.revisionNotes
      });
      toast.success(`Revision ${revisionForm.revision} uploaded! Previous version marked SUPERSEDED.`);
      setIsRevisionModalOpen(false);
      fetchData(selectedProjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload revision');
    }
  };

  const handleCreateQualityCert = async (e) => {
    e.preventDefault();
    if (!qualityForm.certificateNumber || !qualityForm.title || !qualityForm.projectId) {
      return toast.error('Please fill required certificate fields');
    }

    try {
      await api.post('/documents', {
        ...qualityForm,
        docType: 'QUALITY_CERTIFICATE',
        category: 'Quality & Test Certificates'
      });
      toast.success(`Quality Certificate ${qualityForm.certificateNumber} logged successfully!`);
      setIsQualityModalOpen(false);
      setQualityForm({
        projectId: projects[0]?._id || '',
        title: '',
        testType: 'CONCRETE_CUBE_TEST',
        certificateNumber: '',
        testingAgency: 'State Material & Highway Testing Lab (NABL)',
        testDate: new Date().toISOString().split('T')[0],
        concreteGrade: 'M30',
        locationElement: '',
        sevenDayStrength: '',
        twentyEightDayStrength: '',
        targetStrength: '30',
        complianceStatus: 'PASS',
        description: ''
      });
      fetchData(selectedProjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log quality certificate');
    }
  };

  const handleDelete = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'Delete Document / Blueprint',
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      confirmText: 'Delete Document'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/documents/${id}`);
        toast.success('Document deleted successfully');
        fetchData(selectedProjectId);
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const handleSimulateDownload = (doc) => {
    toast.success(`Downloading ${doc.fileName || doc.drawingNumber || doc.title}...`, {
      icon: '📥',
      duration: 3000
    });
  };

  // Filtered views
  const drawingsList = documents.filter(d => d.docType === 'DRAWING_GFC');
  const qualityList = documents.filter(d => d.docType === 'QUALITY_CERTIFICATE');
  const generalList = documents.filter(d => d.docType !== 'DRAWING_GFC' && d.docType !== 'QUALITY_CERTIFICATE');

  const filteredDrawings = drawingsList.filter(d => {
    const matchesSearch = !searchTerm || 
      d.drawingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.revisionNotes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = disciplineFilter === 'ALL' || d.discipline === disciplineFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const filteredQuality = qualityList.filter(d => {
    const matchesSearch = !searchTerm ||
      d.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.locationElement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.concreteGrade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTest = qualityTestFilter === 'ALL' || d.testType === qualityTestFilter;
    return matchesSearch && matchesTest;
  });

  const filteredGeneral = generalList.filter(d => {
    return !searchTerm ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getDisciplineBadge = (discipline) => {
    switch (discipline) {
      case 'STRUCTURAL':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px]">STRUCTURAL</span>;
      case 'ARCHITECTURAL':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold text-[10px]">ARCHITECTURAL</span>;
      case 'MEP_PLUMBING':
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold text-[10px]">MEP & PLUMBING</span>;
      case 'CIVIL_INFRA':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">CIVIL INFRA</span>;
      case 'ELECTRICAL':
        return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded font-bold text-[10px]">ELECTRICAL</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">{discipline}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Drawing & Document Vault
            </h1>
            <span className="bg-emerald-500/10 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              GFC Revision Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Civil Blueprint Revisions, Active GFC Stamping & NABL Concrete Cube Test Registers
          </p>
        </div>

        {/* Action Controls & Project Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.projectCode || 'PROJ'})</option>
            ))}
          </select>

          <button
            onClick={() => setIsDrawingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            + Upload GFC Drawing
          </button>

          <button
            onClick={() => setIsQualityModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <FlaskConical className="w-4 h-4 text-amber-400" />
            + Log Cube / MTC Cert
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active GFC Drawings */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active GFC Blueprints</p>
            <h3 className="text-2xl font-black text-slate-800">
              {summary?.activeGfcCount ?? 0}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Authorized for Site Work</p>
          </div>
        </div>

        {/* Superseded Drawings */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Superseded Revisions</p>
            <h3 className="text-2xl font-black text-slate-800">
              {summary?.supersededCount ?? 0}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Obsolete (Execution Blocked)</p>
          </div>
        </div>

        {/* NABL Quality Certificates */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Compliance & Cube Tests</p>
            <h3 className="text-2xl font-black text-slate-800">
              {summary?.qualityCertsCount ?? 0}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              Pass Rate: {summary?.cubePassRate ?? 100}%
            </p>
          </div>
        </div>

        {/* Drawings Under Review */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Drawings Under Vetting</p>
            <h3 className="text-2xl font-black text-slate-800">
              {summary?.underReviewCount ?? 0}
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting Consultant Vetting</p>
          </div>
        </div>
      </div>

      {/* Main Workspace with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto gap-4">
          <div className="flex items-center gap-1 py-2.5 flex-shrink-0">
            {[
              { id: 'drawings', label: '1. GFC Drawings & Revision Vault', icon: Compass, count: drawingsList.length },
              { id: 'quality', label: '2. NABL Concrete Cube & Steel Tests', icon: FlaskConical, count: qualityList.length },
              { id: 'contracts', label: '3. Contracts, LOA & Statutory NOCs', icon: FileCheck, count: generalList.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: GFC DRAWINGS & REVISION VAULT */}
        {activeTab === 'drawings' && (
          <div className="p-4 md:p-6 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search drawing # (e.g. STR-COL-004), title, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Discipline: All</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="ARCHITECTURAL">Architectural</option>
                  <option value="MEP_PLUMBING">MEP & Plumbing</option>
                  <option value="CIVIL_INFRA">Civil Infra</option>
                  <option value="ELECTRICAL">Electrical</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Status: All</option>
                  <option value="GFC_ACTIVE">GFC Active (Authorized)</option>
                  <option value="SUPERSEDED">Superseded (Obsolete)</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </div>
            </div>

            {/* Drawings List / Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Drawing # & Revision</th>
                    <th className="px-4 py-3">Discipline</th>
                    <th className="px-4 py-3">Drawing Title & Release Notes</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Issued By & Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDrawings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                        No drawings match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    filteredDrawings.map(d => {
                      const isGfc = d.status === 'GFC_ACTIVE';
                      const isSuperseded = d.status === 'SUPERSEDED';
                      const isUnderReview = d.status === 'UNDER_REVIEW';

                      return (
                        <tr 
                          key={d._id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSuperseded ? 'bg-rose-50/20 opacity-80' : isGfc ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Drawing # and Rev */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {d.drawingNumber || 'DWG'}
                              </span>
                              <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {d.revision}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {d.projectId?.name || 'Project Blueprint'}
                            </div>
                          </td>

                          {/* Discipline */}
                          <td className="px-4 py-3.5">
                            {getDisciplineBadge(d.discipline)}
                          </td>

                          {/* Title & Notes */}
                          <td className="px-4 py-3.5 max-w-md truncate">
                            <div className="font-bold text-slate-800 text-xs truncate">
                              {d.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {d.revisionNotes || d.description || 'No release notes entered.'}
                            </div>
                            {isSuperseded && d.supersededBy && (
                              <div className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                Superseded by revision {d.supersededBy.revision || 'Newer Rev'}
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            {isGfc && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                GFC ACTIVE
                              </span>
                            )}
                            {isSuperseded && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                SUPERSEDED
                              </span>
                            )}
                            {isUnderReview && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                UNDER REVIEW
                              </span>
                            )}
                          </td>

                          {/* Issued By & Date */}
                          <td className="px-4 py-3.5">
                            <div className="text-[11px] font-semibold text-slate-700 truncate max-w-xs">
                              {d.issuedBy}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(d.releaseDate || d.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isGfc && (
                                <button
                                  onClick={() => handleOpenRevisionModal(d)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                  title="Upload Next Revision for this Drawing"
                                >
                                  <History className="w-3 h-3" />
                                  + Next Rev
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedDoc(d);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="View Drawing Details & Title Block"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleSimulateDownload(d)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                                title="Download Blueprint PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(d._id, `${d.drawingNumber} (${d.revision})`)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: NABL CONCRETE CUBE & QUALITY TEST CERTIFICATES */}
        {activeTab === 'quality' && (
          <div className="p-4 md:p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cert #, structural element, grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={qualityTestFilter}
                  onChange={(e) => setQualityTestFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Test Types</option>
                  <option value="CONCRETE_CUBE_TEST">Concrete Cube Compressive Strength</option>
                  <option value="STEEL_MTC">Steel Mill Test Certificate (MTC)</option>
                  <option value="SOIL_COMPACTION">Soil Dry Density & Compaction</option>
                </select>
              </div>
            </div>

            {/* Quality Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuality.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                  No quality or material test certificates found.
                </div>
              ) : (
                filteredQuality.map(c => {
                  const isPass = c.complianceStatus === 'PASS';
                  const isCubeTest = c.testType === 'CONCRETE_CUBE_TEST';

                  return (
                    <div 
                      key={c._id}
                      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Header: Cert # and Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {c.certificateNumber}
                            </span>
                            {c.concreteGrade && c.concreteGrade !== 'N/A' && (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-black text-[10px] px-2 py-0.5 rounded">
                                Grade {c.concreteGrade}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            isPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {c.complianceStatus}
                          </span>
                        </div>

                        {/* Title & Element */}
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{c.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Element: <strong className="text-slate-700">{c.locationElement || 'Site Location'}</strong>
                          </p>
                        </div>

                        {/* Cube Strength Visualizer (If concrete test) */}
                        {isCubeTest && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Compressive Strength:</span>
                              <span className="font-mono font-black text-slate-900">
                                {c.twentyEightDayStrength ? `${c.twentyEightDayStrength} N/mm² (28-Day)` : `${c.sevenDayStrength} N/mm² (7-Day)`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, Math.round(((c.twentyEightDayStrength || c.sevenDayStrength) / (c.targetStrength || 30)) * 100))}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Target: {c.targetStrength} N/mm²</span>
                              <span className="text-emerald-600 font-bold">
                                {Math.round(((c.twentyEightDayStrength || c.sevenDayStrength) / (c.targetStrength || 30)) * 100)}% of Target Achieved
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400">
                          Tested by: <strong className="text-slate-600">{c.testingAgency}</strong> on {new Date(c.testDate).toLocaleDateString('en-IN')}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {c.fileName || 'NABL_Certificate.pdf'} ({(c.fileSize / 1000000).toFixed(1)} MB)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSimulateDownload(c)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, c.certificateNumber)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONTRACTS, LOA & STATUTORY NOCS */}
        {activeTab === 'contracts' && (
          <div className="p-4 md:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Document Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Upload Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredGeneral.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-slate-400">
                        No contract agreements or statutory clearance documents found.
                      </td>
                    </tr>
                  ) : (
                    filteredGeneral.map(doc => (
                      <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {doc.fileName || 'Contract_Doc.pdf'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-sm truncate text-slate-600">
                          {doc.description || 'Statutory contract file'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSimulateDownload(doc)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                            <button
                              onClick={() => handleDelete(doc._id, doc.title)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: UPLOAD GFC DRAWING */}
      {isDrawingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Upload GFC Drawing</h3>
                  <p className="text-[11px] text-slate-500">Good-For-Construction Blueprint with Revision Stamping</p>
                </div>
              </div>
              <button onClick={() => setIsDrawingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrawing} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Project *</label>
                <select
                  value={drawingForm.projectId}
                  onChange={(e) => setDrawingForm({ ...drawingForm, projectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.projectCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. STR-COL-005"
                    value={drawingForm.drawingNumber}
                    onChange={(e) => setDrawingForm({ ...drawingForm, drawingNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discipline *</label>
                  <select
                    value={drawingForm.discipline}
                    onChange={(e) => setDrawingForm({ ...drawingForm, discipline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="STRUCTURAL">Structural</option>
                    <option value="ARCHITECTURAL">Architectural</option>
                    <option value="MEP_PLUMBING">MEP & Plumbing</option>
                    <option value="CIVIL_INFRA">Civil Infrastructure</option>
                    <option value="ELECTRICAL">Electrical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 4th to 7th Floor Column Reinforcement Details"
                  value={drawingForm.title}
                  onChange={(e) => setDrawingForm({ ...drawingForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Revision</label>
                  <input
                    type="text"
                    placeholder="R0"
                    value={drawingForm.revision}
                    onChange={(e) => setDrawingForm({ ...drawingForm, revision: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GFC Status</label>
                  <select
                    value={drawingForm.status}
                    onChange={(e) => setDrawingForm({ ...drawingForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GFC_ACTIVE">GFC Active (Authorized)</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issued By (Design Firm / Client)</label>
                <input
                  type="text"
                  placeholder="e.g. Sterling Structural Consultants LLP"
                  value={drawingForm.issuedBy}
                  onChange={(e) => setDrawingForm({ ...drawingForm, issuedBy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Initial GFC release signed for site execution."
                  value={drawingForm.revisionNotes}
                  onChange={(e) => setDrawingForm({ ...drawingForm, revisionNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save & Register GFC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD NEXT REVISION */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    Upload Revision for {revisionForm.drawingNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">Previous revision will be automatically marked as SUPERSEDED</p>
                </div>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadRevision} className="space-y-3.5 text-xs">
              <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Auto-Supersede Active
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  Uploading this new revision will automatically mark the current revision of <strong>{revisionForm.drawingNumber}</strong> as <strong>SUPERSEDED</strong> across all site engineering records.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Revision Tag *</label>
                  <input
                    type="text"
                    value={revisionForm.revision}
                    onChange={(e) => setRevisionForm({ ...revisionForm, revision: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase font-black focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={revisionForm.releaseDate}
                    onChange={(e) => setRevisionForm({ ...revisionForm, releaseDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issued By</label>
                <input
                  type="text"
                  value={revisionForm.issuedBy}
                  onChange={(e) => setRevisionForm({ ...revisionForm, issuedBy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Notes (What Changed?) *</label>
                <textarea
                  rows="3"
                  value={revisionForm.revisionNotes}
                  onChange={(e) => setRevisionForm({ ...revisionForm, revisionNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                  placeholder="Detail changes (e.g. Lap length increased from 45d to 50d; Column C4 bar diameter increased to 25mm)"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Promote to Active GFC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG QUALITY & CONCRETE CUBE CERTIFICATE */}
      {isQualityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FlaskConical className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Log Quality & Material Certificate</h3>
                  <p className="text-[11px] text-slate-500">NABL Concrete Cube Test, Steel MTC & Soil Density Reports</p>
                </div>
              </div>
              <button onClick={() => setIsQualityModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQualityCert} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Project *</label>
                  <select
                    value={qualityForm.projectId}
                    onChange={(e) => setQualityForm({ ...qualityForm, projectId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    required
                  >
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Test Type *</label>
                  <select
                    value={qualityForm.testType}
                    onChange={(e) => setQualityForm({ ...qualityForm, testType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="CONCRETE_CUBE_TEST">Concrete Cube Compressive Strength</option>
                    <option value="STEEL_MTC">Steel Mill Test Certificate (MTC)</option>
                    <option value="SOIL_COMPACTION">Soil Dry Density & Compaction</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Certificate # *</label>
                  <input
                    type="text"
                    placeholder="e.g. NABL-2026-CUB-201"
                    value={qualityForm.certificateNumber}
                    onChange={(e) => setQualityForm({ ...qualityForm, certificateNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Concrete Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. M30"
                    value={qualityForm.concreteGrade}
                    onChange={(e) => setQualityForm({ ...qualityForm, concreteGrade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Report Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 28-Day Concrete Cube Test - 4th Floor Columns"
                  value={qualityForm.title}
                  onChange={(e) => setQualityForm({ ...qualityForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Structural Element / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Tower A - 4th Floor Columns C1 to C12 (Pour #2)"
                  value={qualityForm.locationElement}
                  onChange={(e) => setQualityForm({ ...qualityForm, locationElement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">7-Day (N/mm²)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="22.5"
                    value={qualityForm.sevenDayStrength}
                    onChange={(e) => setQualityForm({ ...qualityForm, sevenDayStrength: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">28-Day (N/mm²)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="35.2"
                    value={qualityForm.twentyEightDayStrength}
                    onChange={(e) => setQualityForm({ ...qualityForm, twentyEightDayStrength: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target (N/mm²)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="30"
                    value={qualityForm.targetStrength}
                    onChange={(e) => setQualityForm({ ...qualityForm, targetStrength: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compliance Result</label>
                  <select
                    value={qualityForm.complianceStatus}
                    onChange={(e) => setQualityForm({ ...qualityForm, complianceStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="PASS">PASS (Compliant)</option>
                    <option value="FAIL">FAIL (Deficient)</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Testing Agency / Lab</label>
                  <input
                    type="text"
                    value={qualityForm.testingAgency}
                    onChange={(e) => setQualityForm({ ...qualityForm, testingAgency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQualityModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Certificate Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BLUEPRINT DETAILS & PREVIEW */}
      {isPreviewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-900 text-white rounded-xl">
                  <Compass className="w-5 h-5 text-emerald-400" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    {selectedDoc.drawingNumber} ({selectedDoc.revision})
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedDoc.title}</p>
                </div>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CAD / Blueprint Viewer Simulation Frame */}
            <div className="bg-slate-950 text-slate-300 p-6 rounded-xl border border-slate-800 font-mono text-xs space-y-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedDoc.status === 'GFC_ACTIVE' 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-rose-500 text-white'
                }`}>
                  {selectedDoc.status === 'GFC_ACTIVE' ? 'APPROVED GFC' : 'SUPERSEDED'}
                </span>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <div className="text-[10px] text-slate-500">APEXBUILD CAD TITLE BLOCK</div>
                <div className="text-white font-bold text-sm">{selectedDoc.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Discipline: {selectedDoc.discipline} • Scale: 1:100 / NTS</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <div className="text-slate-500">DRAWING NUMBER:</div>
                  <div className="text-emerald-400 font-bold">{selectedDoc.drawingNumber}</div>
                </div>
                <div>
                  <div className="text-slate-500">CURRENT REVISION:</div>
                  <div className="text-emerald-400 font-bold">{selectedDoc.revision}</div>
                </div>
                <div>
                  <div className="text-slate-500">ISSUED BY:</div>
                  <div className="text-white">{selectedDoc.issuedBy}</div>
                </div>
                <div>
                  <div className="text-slate-500">DATE OF RELEASE:</div>
                  <div className="text-white">{new Date(selectedDoc.releaseDate).toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 text-[11px]">
                <div className="text-slate-400 font-bold mb-1">REVISION NOTES:</div>
                <div className="text-slate-200">
                  {selectedDoc.revisionNotes || 'Standard GFC release. Approved for site reinforcement and concrete casting.'}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Format: PDF • {(selectedDoc.fileSize / 1000000).toFixed(1)} MB
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSimulateDownload(selectedDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Blueprint PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
