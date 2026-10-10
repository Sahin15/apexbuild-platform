import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  Eye, 
  FileText, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  HardHat, 
  Truck, 
  Wrench, 
  ShieldCheck, 
  Sun, 
  CloudRain, 
  Layers, 
  Trash2, 
  Building2, 
  X, 
  FileCheck,
  ClipboardList,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Camera,
  Barcode,
  Share2,
  PenTool
} from 'lucide-react';
import useOfflineDraft from '../hooks/useOfflineDraft';
import OfflineDraftIndicator from '../components/common/OfflineDraftIndicator';
import BarcodeScannerModal from '../components/common/BarcodeScannerModal';
import SignaturePadModal from '../components/common/SignaturePadModal';
import CameraPhotoCaptureModal from '../components/common/CameraPhotoCaptureModal';
import PullToRefreshContainer from '../components/common/PullToRefreshContainer';
import haptics from '../utils/haptics';
import { notifyDprSubmitted } from '../utils/notifications';
import { enqueueSyncOperation } from '../services/syncQueue';
import { shareCivilDPR } from '../utils/share';
import { formatBytes } from '../utils/imageCompressor';

export default function SiteReports({ isProjectView }) {
  const { id: routeProjectId } = useParams();
  const [projectId, setProjectId] = useState(routeProjectId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isForm62ModalOpen, setIsForm62ModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Form State
  const initialForm = {
    projectId: projectId || '',
    reportDate: new Date().toISOString().split('T')[0],
    dprNo: `DPR-${new Date().toISOString().split('T')[0]}`,
    weather: 'Sunny & Clear',
    weatherDetails: {
      condition: 'SUNNY',
      tempMax: 34,
      tempMin: 22,
      rainfallMm: 0,
      shiftHours: 8,
      shiftsWorked: 1
    },
    manpower: [
      { trade: 'Barbenders & Steel Fixers', contractorName: 'Apex Rebar Gang', skilledCount: 12, unskilledCount: 6, totalCount: 18, hoursWorked: 8 },
      { trade: 'Shuttering Carpenters', contractorName: 'Precision Formworks', skilledCount: 10, unskilledCount: 4, totalCount: 14, hoursWorked: 8 },
      { trade: 'Masons & Concreting Gang', contractorName: 'Apex Civil', skilledCount: 8, unskilledCount: 12, totalCount: 20, hoursWorked: 8 },
      { trade: 'General Site Helpers', contractorName: 'Day Labour Guild', skilledCount: 0, unskilledCount: 16, totalCount: 16, hoursWorked: 8 }
    ],
    equipment: [
      { name: 'Tower Crane TC-5040', regNumber: 'EQ-TC-01', hoursRun: 7.5, hoursIdle: 0.5, breakdownHours: 0, remarks: 'Full lifting operations' },
      { name: 'Schwing Stetter Boom Placer', regNumber: 'BP-36', hoursRun: 6.0, hoursIdle: 2.0, breakdownHours: 0, remarks: 'Monolithic pour support' }
    ],
    materialsReceived: [
      { materialName: 'UltraTech OPC 53 Grade Cement', quantity: 300, unit: 'Bags', supplier: 'UltraTech Cement Corp', challanNo: 'CH-9921', vehicleNo: 'DL-1L-AA-3041' },
      { materialName: 'Fe 550D TMT Rebar 20mm', quantity: 12.5, unit: 'MT', supplier: 'Kamdhenu Steel Ltd', challanNo: 'CH-9922', vehicleNo: 'HR-55-AC-9122' }
    ],
    workActivities: [
      { location: 'Foundation Raft Grid B2-E5', description: 'Rebar fixing and staging props alignment', quantityExecuted: 18.5, unit: 'MT', status: 'Completed' },
      { location: 'Basement 2 Retaining Wall', description: 'Shuttering fixing & tie rod positioning', quantityExecuted: 45, unit: 'sqm', status: 'In Progress' }
    ],
    workCompleted: 'Completed foundation rebar tying along Grid B2-E5. Checked cover and shuttering alignment with laser level.',
    overallProgress: 52,
    safetyToolboxTopic: 'Working at height, crane lifting zone clearance, and mandatory safety harness anchoring',
    safetyIncidents: 0,
    qualityTests: 'Slump test checked at 130mm. 6 concrete cube samples cast for 7-day and 28-day compressive tests.',
    issues: 'Heavy traffic near outer ring road delayed afternoon material delivery by 35 minutes.',
    delays: 'Zero impact on critical milestone path.',
    nextDayPlan: 'Commence M30 design mix pour for Raft Grid C1-E4. Position backup needle vibrators.',
    status: 'SUBMITTED',
    engineerSignature: null,
    signedBy: '',
    sitePhotos: []
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Offline Draft Hook
  const dprDraftKey = `contractor_dpr_${projectId || routeProjectId || 'default'}`;
  const { hasDraft, draftData, lastSaved, clearDraft } = useOfflineDraft(dprDraftKey, formData, isCreateModalOpen);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      const targetProjId = projectId || routeProjectId;
      if (targetProjId) queryParams.append('projectId', targetProjId);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await api.get(`/site-reports?${queryParams.toString()}`);
      setReports(res.data.data.reports || []);
    } catch (error) {
      toast.error('Failed to load daily site reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const targetProjId = projectId || routeProjectId;
      const res = await api.get(`/site-reports/summary${targetProjId ? `?projectId=${targetProjId}` : ''}`);
      setSummary(res.data.data.summary);
    } catch (error) {
      console.error('Failed to load DPR summary', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      const projs = res.data.data.projects || [];
      setProjects(projs);
      if (!projectId && projs.length > 0) {
        setProjectId(projs[0]._id);
        setFormData(prev => ({ ...prev, projectId: projs[0]._id }));
      }
    } catch (error) {
      console.error('Failed to load projects', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchReports();
    fetchSummary();
    const handleReconnect = () => {
      fetchReports();
      fetchSummary();
    };
    window.addEventListener('apex-network-reconnect', handleReconnect);
    window.addEventListener('online', handleReconnect);
    return () => {
      window.removeEventListener('apex-network-reconnect', handleReconnect);
      window.removeEventListener('online', handleReconnect);
    };
  }, [projectId, statusFilter]);

  // Form Dynamic Array Handlers
  const handleAddManpower = () => {
    setFormData(prev => ({
      ...prev,
      manpower: [
        ...prev.manpower,
        { trade: '', contractorName: 'General Labour', skilledCount: 0, unskilledCount: 0, totalCount: 0, hoursWorked: 8 }
      ]
    }));
  };

  const handleRemoveManpower = (index) => {
    setFormData(prev => ({
      ...prev,
      manpower: prev.manpower.filter((_, i) => i !== index)
    }));
  };

  const handleManpowerChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.manpower];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'skilledCount' || field === 'unskilledCount') {
        const s = Number(field === 'skilledCount' ? value : updated[index].skilledCount) || 0;
        const u = Number(field === 'unskilledCount' ? value : updated[index].unskilledCount) || 0;
        updated[index].totalCount = s + u;
      }
      return { ...prev, manpower: updated };
    });
  };

  const handleAddEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipment: [
        ...prev.equipment,
        { name: '', regNumber: '', hoursRun: 8, hoursIdle: 0, breakdownHours: 0, remarks: 'Operational' }
      ]
    }));
  };

  const handleRemoveEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const handleEquipmentChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.equipment];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, equipment: updated };
    });
  };

  const handleAddMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materialsReceived: [
        ...prev.materialsReceived,
        { materialName: '', quantity: 0, unit: 'Bags', supplier: '', challanNo: '', vehicleNo: '' }
      ]
    }));
  };

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materialsReceived: prev.materialsReceived.filter((_, i) => i !== index)
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.materialsReceived];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, materialsReceived: updated };
    });
  };

  const handleAddWorkActivity = () => {
    setFormData(prev => ({
      ...prev,
      workActivities: [
        ...prev.workActivities,
        { location: '', description: '', quantityExecuted: 0, unit: 'cum', status: 'Completed' }
      ]
    }));
  };

  const handleRemoveWorkActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      workActivities: prev.workActivities.filter((_, i) => i !== index)
    }));
  };

  const handleWorkActivityChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.workActivities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, workActivities: updated };
    });
  };

  // Submit DPR
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = formData.projectId || projectId || routeProjectId;
      if (!targetProjId) {
        haptics.warning();
        return toast.error('Please select an active project');
      }

      const payload = {
        ...formData,
        projectId: targetProjId
      };

      if (!navigator.onLine) {
        enqueueSyncOperation({
          endpoint: '/site-reports',
          method: 'POST',
          payload,
          title: `DPR ${formData.dprNo} (${activeProjectObj?.name || 'Site'})`,
          platform: 'CONTRACTOR_CIVIL'
        });
        haptics.success();
        toast.success('Offline mode: DPR saved to sync queue! Will upload automatically once online.');
        clearDraft();
        setIsCreateModalOpen(false);
        return;
      }

      await api.post('/site-reports', payload);
      haptics.success();
      toast.success('Daily Progress Report submitted successfully!');
      notifyDprSubmitted({ dprNo: formData.dprNo, projectName: activeProjectObj?.name || 'Selected Site' });
      clearDraft();
      setIsCreateModalOpen(false);
      fetchReports();
      fetchSummary();
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to submit DPR');
    }
  };

  // Approve DPR
  const handleApprove = async (reportId) => {
    try {
      await api.post(`/site-reports/${reportId}/approve`);
      haptics.success();
      toast.success('DPR officially approved & signed off!');
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchReports();
      fetchSummary();
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to approve report');
    }
  };

  // Reject DPR
  const handleReject = async (reportId) => {
    const reason = window.prompt('Enter reason for DPR revision or rejection:');
    if (!reason) return;
    try {
      await api.post(`/site-reports/${reportId}/reject`, { reason });
      haptics.warning();
      toast.success('Report marked for revision');
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchReports();
      fetchSummary();
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to reject report');
    }
  };

  // Delete DPR
  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this Daily Site Diary record?')) return;
    try {
      await api.delete(`/site-reports/${reportId}`);
      haptics.heavy();
      toast.success('Daily report deleted');
      fetchReports();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const openForm62Modal = (report) => {
    setSelectedReport(report);
    setIsForm62ModalOpen(true);
  };

  const activeProjectObj = projects.find(p => p._id === projectId);

  const handlePullRefresh = async () => {
    await Promise.all([fetchReports(), fetchSummary()]);
  };

  return (
    <PullToRefreshContainer onRefresh={handlePullRefresh}>
      <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" /> CPWD Form 62 & FIDIC Compliant
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ISO 9001:2015 QA/QC
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Daily Progress Reports (DPR) & Site Diary</h1>
          <p className="text-slate-300 text-sm mt-1">
            Muster roll headcount, plant machinery hours, gate delivery receipts, and verified site activities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          {projects.length > 0 && !routeProjectId && (
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setFormData(prev => ({ ...prev, projectId: e.target.value }));
              }}
              className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-[240px] truncate"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setFormData({
                ...initialForm,
                projectId: projectId || (projects[0]?._id || ''),
                reportDate: new Date().toISOString().split('T')[0],
                dprNo: `DPR-${new Date().toISOString().split('T')[0]}`
              });
              setIsCreateModalOpen(true);
            }}
            className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-lg inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap flex-shrink-0 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3] flex-shrink-0" />
            <span>Log Daily DPR</span>
          </button>
        </div>
      </div>

      {/* Enterprise KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Workforce</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalWorkforceToday || (reports[0]?.totalManpower || 0)} <span className="text-xs font-medium text-slate-500">Personnel</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> 5 Trade Gangs Deployed
            </p>
          </div>
        </div>

        {/* Machinery Operating */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Heavy Plants</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalEquipmentActive || 4} <span className="text-xs font-medium text-slate-500">Units Running</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Boom Placer, Cranes & Mixers
            </p>
          </div>
        </div>

        {/* Materials Inward */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gate Deliveries</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalMaterialsReceived || 3} <span className="text-xs font-medium text-slate-500">Challans Today</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              RMC M30, Cement & Rebar
            </p>
          </div>
        </div>

        {/* HSE Safety Record */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zero-LTI Safety Streak</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.safetyDaysWithoutIncident || 48} <span className="text-xs font-medium text-slate-500">Days Incident-Free</span>
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-0.5">
              Toolbox: Fall & Height Safety
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full max-w-md relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by DPR No, challan, engineer, activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            title="Scan Challan Barcode / QR"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* DPR Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">Site Diary & Daily Progress Register</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {reports.length} Records
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Project: <strong className="text-slate-700">{activeProjectObj?.name || 'Selected Site'}</strong>
          </span>
        </div>

        {/* Mobile DPR Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading site reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">No Daily Progress Reports found.</p>
            </div>
          ) : (
            reports
              .filter(r => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  (r.dprNo && r.dprNo.toLowerCase().includes(term)) ||
                  (r.siteEngineerId?.name && r.siteEngineerId.name.toLowerCase().includes(term)) ||
                  (r.workCompleted && r.workCompleted.toLowerCase().includes(term)) ||
                  (r.weather && r.weather.toLowerCase().includes(term))
                );
              })
              .map((report) => {
                const isApproved = report.status === 'APPROVED';
                return (
                  <div 
                    key={report._id} 
                    onClick={() => openViewModal(report)}
                    className="p-4 hover:bg-slate-50 transition-colors space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                          {report.dprNo || `DPR-${new Date(report.reportDate).toISOString().split('T')[0]}`}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {new Date(report.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      {report.workCompleted || (report.workActivities?.[0]?.description) || 'Daily work logged in sheet'}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          <HardHat className="w-3 h-3" /> {report.totalManpower || 0} Staff
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                          <Wrench className="w-3 h-3" /> {(report.equipment || []).length} Plants
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const pObj = projects.find(p => p._id === report.projectId) || { name: report.project?.name };
                            shareCivilDPR(report, pObj);
                          }}
                          title="Share DPR Summary"
                          className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg touch-manipulation active:scale-95 transition-transform"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openForm62Modal(report)}
                          title="Print CPWD Form 62 Diary"
                          className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg touch-manipulation active:scale-95 transition-transform"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openViewModal(report)}
                          title="View Details"
                          className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg touch-manipulation active:scale-95 transition-transform"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Desktop DPR Register Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100/75 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">DPR Reference</th>
                <th className="px-5 py-3.5 font-semibold">Date & Weather</th>
                <th className="px-5 py-3.5 font-semibold">Engineer In-Charge</th>
                <th className="px-5 py-3.5 font-semibold">Manpower & Plants</th>
                <th className="px-5 py-3.5 font-semibold">Operations Performed</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading site reports...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No Daily Progress Reports found.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Log Daily DPR" above to record site activities.</p>
                  </td>
                </tr>
              ) : (
                reports
                  .filter(r => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      (r.dprNo && r.dprNo.toLowerCase().includes(term)) ||
                      (r.siteEngineerId?.name && r.siteEngineerId.name.toLowerCase().includes(term)) ||
                      (r.workCompleted && r.workCompleted.toLowerCase().includes(term)) ||
                      (r.weather && r.weather.toLowerCase().includes(term))
                    );
                  })
                  .map((report) => {
                    const isApproved = report.status === 'APPROVED';
                    const isRejected = report.status === 'REJECTED';
                    const isSubmitted = report.status === 'SUBMITTED';

                    return (
                      <tr 
                        key={report._id} 
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                        onClick={() => openViewModal(report)}
                      >
                        {/* DPR Ref */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 text-xs">
                              {report.dprNo || `DPR-${new Date(report.reportDate).toISOString().split('T')[0]}`}
                            </span>
                          </div>
                        </td>

                        {/* Date & Weather */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">
                            {new Date(report.reportDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>{report.weather || 'Sunny'} ({report.weatherDetails?.tempMax || 34}°C)</span>
                          </div>
                        </td>

                        {/* Site Engineer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                              {(report.siteEngineerId?.name || 'SE').charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-xs leading-tight">
                                {report.siteEngineerId?.name || 'Site In-Charge'}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase">Site Engineer</p>
                            </div>
                          </div>
                        </td>

                        {/* Manpower & Equipment */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                              <HardHat className="w-3 h-3" /> {report.totalManpower || 0} Staff
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                              <Wrench className="w-3 h-3" /> {(report.equipment || []).length} Plants
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {(report.materialsReceived || []).length} Inwards Gate Deliveries
                          </div>
                        </td>

                        {/* Operations Summary */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-slate-700 text-xs truncate font-medium">
                            {report.workCompleted || (report.workActivities?.[0]?.description) || 'Daily work logged in sheet'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Next: {report.nextDayPlan || 'Scheduled works'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isSubmitted ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            isRejected ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {isApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                             isSubmitted ? <Clock className="w-3.5 h-3.5 text-blue-600" /> :
                             isRejected ? <XCircle className="w-3.5 h-3.5 text-red-600" /> : null}
                            {isApproved ? 'Certified / Approved' :
                             isSubmitted ? 'Pending Sign-off' :
                             isRejected ? 'Needs Revision' : report.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const pObj = projects.find(p => p._id === report.projectId) || { name: report.project?.name };
                                shareCivilDPR(report, pObj);
                              }}
                              title="Share DPR Summary"
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openForm62Modal(report)}
                              title="Print CPWD Form 62 Diary"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openViewModal(report)}
                              title="View Details"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {!isApproved && (
                              <button
                                onClick={() => handleApprove(report._id)}
                                title="Approve & Sign DPR"
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(report._id)}
                              title="Delete DPR"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* CREATE DPR MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[94dvh] sm:h-auto sm:max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-t-2xl sm:rounded-t-none flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">New Daily Progress Report (CPWD Form 62)</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Record daily muster roll, equipment runtime, material receipts, and site operations.
                </p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center overflow-x-auto bg-slate-50 border-b border-slate-200 px-4 pt-2 gap-1 text-xs font-semibold">
              {[
                { id: 'general', label: '1. General & Weather', icon: Sun },
                { id: 'manpower', label: '2. Labour Muster Roll', icon: HardHat },
                { id: 'equipment', label: '3. Plant & Machinery', icon: Wrench },
                { id: 'materials', label: '4. Gate Deliveries', icon: Truck },
                { id: 'work', label: '5. Work Done & Progress', icon: Layers },
                { id: 'safety', label: '6. HSE & Quality', icon: ShieldCheck }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2.5 px-3 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                      isActive 
                        ? 'border-indigo-600 text-indigo-700 bg-white font-bold shadow-sm'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <OfflineDraftIndicator
                  hasDraft={hasDraft}
                  lastSaved={lastSaved}
                  onRestore={() => {
                    if (draftData) {
                      setFormData(draftData);
                      toast.success('DPR draft restored!');
                    }
                  }}
                  onDiscard={() => {
                    clearDraft();
                    toast.info('Draft discarded.');
                  }}
                />

                {/* TAB 1: General & Weather */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                        <select
                          value={formData.projectId}
                          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                          required
                          className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Project --</option>
                          {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.projectCode})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Report Date *</label>
                        <input
                          type="date"
                          value={formData.reportDate}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              reportDate: e.target.value,
                              dprNo: `DPR-${e.target.value}`
                            });
                          }}
                          required
                          className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">DPR Ref Number</label>
                        <input
                          type="text"
                          value={formData.dprNo}
                          onChange={(e) => setFormData({ ...formData, dprNo: e.target.value })}
                          className="w-full text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-500" /> Weather & Shift Conditions
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weather Condition</label>
                          <select
                            value={formData.weather}
                            onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                          >
                            <option>Sunny & Clear</option>
                            <option>Partly Cloudy</option>
                            <option>Hot & Dry</option>
                            <option>Light Rain / Drizzle</option>
                            <option>Heavy Downpour</option>
                            <option>Windy / Dust Storm</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Temp (°C)</label>
                          <input
                            type="number"
                            value={formData.weatherDetails.tempMax}
                            onChange={(e) => setFormData({
                              ...formData,
                              weatherDetails: { ...formData.weatherDetails, tempMax: Number(e.target.value) }
                            })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shift Hours</label>
                          <input
                            type="number"
                            value={formData.weatherDetails.shiftHours}
                            onChange={(e) => setFormData({
                              ...formData,
                              weatherDetails: { ...formData.weatherDetails, shiftHours: Number(e.target.value) }
                            })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shifts Worked</label>
                          <select
                            value={formData.weatherDetails.shiftsWorked}
                            onChange={(e) => setFormData({
                              ...formData,
                              weatherDetails: { ...formData.weatherDetails, shiftsWorked: Number(e.target.value) }
                            })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                          >
                            <option value={1}>1 Shift (Day Only)</option>
                            <option value={2}>2 Shifts (Day + Night Pour)</option>
                            <option value={3}>3 Shifts (Round the clock)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Labour Muster Roll */}
                {activeTab === 'manpower' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Trade-Wise Headcount Deployment</h4>
                        <p className="text-xs text-slate-500">Record all skilled artisans, sub-contractors, and helpers.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddManpower}
                        className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Trade Row
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Trade / Work Classification</th>
                            <th className="p-3">Contractor / Gang</th>
                            <th className="p-3 w-20 text-center">Skilled</th>
                            <th className="p-3 w-20 text-center">Unskilled</th>
                            <th className="p-3 w-20 text-center">Total</th>
                            <th className="p-3 w-20 text-center">Hours</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.manpower.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.trade}
                                  placeholder="e.g. Barbenders, Masons"
                                  onChange={(e) => handleManpowerChange(idx, 'trade', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.contractorName}
                                  placeholder="Sub-contractor"
                                  onChange={(e) => handleManpowerChange(idx, 'contractorName', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.skilledCount}
                                  min={0}
                                  onChange={(e) => handleManpowerChange(idx, 'skilledCount', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.unskilledCount}
                                  min={0}
                                  onChange={(e) => handleManpowerChange(idx, 'unskilledCount', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center"
                                />
                              </td>
                              <td className="p-2 text-center font-bold text-indigo-700 bg-indigo-50/50">
                                {row.totalCount}
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.hoursWorked}
                                  min={1}
                                  max={24}
                                  onChange={(e) => handleManpowerChange(idx, 'hoursWorked', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveManpower(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="p-3 text-right uppercase text-slate-600">Total Site Workforce Deployed:</td>
                            <td className="p-3 text-center text-sm font-extrabold text-indigo-700">
                              {formData.manpower.reduce((acc, m) => acc + (Number(m.totalCount) || 0), 0)}
                            </td>
                            <td colSpan={2} className="p-3 text-xs text-slate-500">Personnel</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: Plant & Machinery */}
                {activeTab === 'equipment' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Plant, Machinery & Heavy Equipment</h4>
                        <p className="text-xs text-slate-500">Log operating hours, idle time, and breakdown maintenance.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEquipment}
                        className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Equipment Row
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Equipment / Machine Name</th>
                            <th className="p-3">Fleet / Reg No</th>
                            <th className="p-3 w-20 text-center">Run (Hrs)</th>
                            <th className="p-3 w-20 text-center">Idle (Hrs)</th>
                            <th className="p-3 w-20 text-center">B/D (Hrs)</th>
                            <th className="p-3">Remarks / Usage</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.equipment.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.name}
                                  placeholder="e.g. Tower Crane, Boom Placer"
                                  onChange={(e) => handleEquipmentChange(idx, 'name', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.regNumber}
                                  placeholder="Plate / ID"
                                  onChange={(e) => handleEquipmentChange(idx, 'regNumber', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.hoursRun}
                                  min={0}
                                  max={24}
                                  onChange={(e) => handleEquipmentChange(idx, 'hoursRun', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold text-emerald-700 bg-emerald-50/30"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.hoursIdle}
                                  min={0}
                                  max={24}
                                  onChange={(e) => handleEquipmentChange(idx, 'hoursIdle', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center text-amber-700"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.breakdownHours}
                                  min={0}
                                  max={24}
                                  onChange={(e) => handleEquipmentChange(idx, 'breakdownHours', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center text-red-600 font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.remarks}
                                  placeholder="Remarks"
                                  onChange={(e) => handleEquipmentChange(idx, 'remarks', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEquipment(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: Inward Materials */}
                {activeTab === 'materials' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Materials Received at Site Gate</h4>
                        <p className="text-xs text-slate-500">Log delivery challans, truck numbers, and inward quantities.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Inward Challan
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Material Description</th>
                            <th className="p-3 w-24">Quantity</th>
                            <th className="p-3 w-20">Unit</th>
                            <th className="p-3">Supplier / Brand</th>
                            <th className="p-3">Challan No</th>
                            <th className="p-3">Vehicle No</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.materialsReceived.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.materialName}
                                  placeholder="e.g. OPC 53 Cement"
                                  onChange={(e) => handleMaterialChange(idx, 'materialName', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.quantity}
                                  onChange={(e) => handleMaterialChange(idx, 'quantity', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.unit}
                                  onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                >
                                  <option>Bags</option>
                                  <option>MT</option>
                                  <option>cum</option>
                                  <option>Tonnes</option>
                                  <option>sqm</option>
                                  <option>Liters</option>
                                  <option>Nos</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.supplier}
                                  placeholder="Supplier / Mill"
                                  onChange={(e) => handleMaterialChange(idx, 'supplier', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.challanNo}
                                  placeholder="CH-XXXX"
                                  onChange={(e) => handleMaterialChange(idx, 'challanNo', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.vehicleNo}
                                  placeholder="Plate No"
                                  onChange={(e) => handleMaterialChange(idx, 'vehicleNo', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterial(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5: Work Activities */}
                {activeTab === 'work' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Work Activities Executed</h4>
                        <p className="text-xs text-slate-500">Record specific physical locations, dimensions, and outputs.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddWorkActivity}
                        className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Work Item
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3 w-40">Grid / Location</th>
                            <th className="p-3">Description of Operations</th>
                            <th className="p-3 w-24">Quantity</th>
                            <th className="p-3 w-20">Unit</th>
                            <th className="p-3 w-28">Status</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.workActivities.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.location}
                                  placeholder="e.g. Raft Grid B1-C4"
                                  onChange={(e) => handleWorkActivityChange(idx, 'location', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs font-medium"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.description}
                                  placeholder="Description of work done"
                                  onChange={(e) => handleWorkActivityChange(idx, 'description', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.quantityExecuted}
                                  onChange={(e) => handleWorkActivityChange(idx, 'quantityExecuted', Number(e.target.value))}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.unit}
                                  onChange={(e) => handleWorkActivityChange(idx, 'unit', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                >
                                  <option>cum</option>
                                  <option>sqm</option>
                                  <option>MT</option>
                                  <option>m</option>
                                  <option>Nos</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.status}
                                  onChange={(e) => handleWorkActivityChange(idx, 'status', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                >
                                  <option>Completed</option>
                                  <option>In Progress</option>
                                  <option>Partial</option>
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkActivity(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Executive Work Summary *</label>
                      <textarea
                        rows={3}
                        value={formData.workCompleted}
                        onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
                        placeholder="Comprehensive summary of progress achieved across the site today..."
                        className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* TAB 6: Safety & Quality */}
                {activeTab === 'safety' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> HSE Safety & Toolbox Talk
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Morning Toolbox Talk Topic</label>
                          <input
                            type="text"
                            value={formData.safetyToolboxTopic}
                            onChange={(e) => setFormData({ ...formData, safetyToolboxTopic: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Safety Incidents Today</label>
                          <input
                            type="number"
                            min={0}
                            value={formData.safetyIncidents}
                            onChange={(e) => setFormData({ ...formData, safetyIncidents: Number(e.target.value) })}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">QA/QC Quality Tests & Inspections</label>
                      <textarea
                        rows={2}
                        value={formData.qualityTests}
                        onChange={(e) => setFormData({ ...formData, qualityTests: e.target.value })}
                        placeholder="Concrete cube samples cast, slump test results, rebar cover inspection..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Site Issues / Delays</label>
                        <textarea
                          rows={2}
                          value={formData.issues}
                          onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                          placeholder="Obstacles, material delivery delays, drawing clarifications..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Next Day Execution Plan</label>
                        <textarea
                          rows={2}
                          value={formData.nextDayPlan}
                          onChange={(e) => setFormData({ ...formData, nextDayPlan: e.target.value })}
                          placeholder="Planned concrete pours, formwork strikes, rebar deliveries..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attached Site Photos Strip */}
              {formData.sitePhotos?.length > 0 && (
                <div className="px-4 py-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-600" /> Photos:
                  </span>
                  {formData.sitePhotos.map((photo, idx) => (
                    <div key={idx} className="relative group shrink-0 w-12 h-12 rounded-lg border border-slate-300 overflow-hidden bg-black/10">
                      <img src={photo.dataUrl} alt={`Site Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            sitePhotos: prev.sitePhotos.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-amber-400 text-slate-400 hover:text-amber-600 flex items-center justify-center transition-colors"
                    title="Add another photo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 sticky bottom-0">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Workforce: <span className="text-indigo-700 font-extrabold">{formData.manpower.reduce((acc, m) => acc + (Number(m.totalCount) || 0), 0)}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500">
                    {formData.workActivities.length} Operations Logged
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Camera Photo Capture Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className={`btn text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 ${
                      formData.sitePhotos?.length > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>{formData.sitePhotos?.length > 0 ? `Photos (${formData.sitePhotos.length})` : 'Add Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className={`btn text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 ${
                      formData.engineerSignature
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formData.engineerSignature ? 'Re-sign DPR' : 'Sign DPR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 sm:flex-initial btn btn-secondary text-xs px-4 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit DPR Form 62
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK VIEW DPR DETAIL MODAL */}
      {isViewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl sm:rounded-t-none flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-500/30">
                    {selectedReport.dprNo || 'DPR'}
                  </span>
                  <h3 className="font-bold text-lg">Daily Progress Site Log</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {new Date(selectedReport.reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Meta stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReport.status}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Workforce</span>
                  <p className="font-bold text-indigo-700 text-sm mt-0.5">{selectedReport.totalManpower} Workers</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Weather</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReport.weather || 'Sunny'} ({selectedReport.weatherDetails?.tempMax || 34}°C)</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Engineer</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReport.siteEngineerId?.name || 'Engineer'}</p>
                </div>
              </div>

              {/* Work Completed */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" /> Work Summary Executed Today
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedReport.workCompleted || 'No summary provided.'}
                </div>
              </div>

              {/* Work Activities Breakdown */}
              {selectedReport.workActivities?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">Operations Breakdown</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Location</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right">Quantity</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.workActivities.map((act, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-semibold text-slate-800">{act.location}</td>
                            <td className="p-2.5 text-slate-600">{act.description}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800">{act.quantityExecuted} {act.unit}</td>
                            <td className="p-2.5 text-center">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {act.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Manpower Breakdown */}
              {selectedReport.manpower?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-600" /> Labour Deployment Muster Roll
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2">Trade</th>
                          <th className="p-2">Contractor</th>
                          <th className="p-2 text-center">Skilled</th>
                          <th className="p-2 text-center">Unskilled</th>
                          <th className="p-2 text-center font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.manpower.map((m, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium text-slate-800">{m.trade}</td>
                            <td className="p-2 text-slate-500">{m.contractorName}</td>
                            <td className="p-2 text-center">{m.skilledCount}</td>
                            <td className="p-2 text-center">{m.unskilledCount}</td>
                            <td className="p-2 text-center font-bold text-indigo-700">{m.totalCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Materials Inward */}
              {selectedReport.materialsReceived?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" /> Materials Received (Inward Gate Receipts)
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2">Material Description</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Supplier</th>
                          <th className="p-2">Challan No</th>
                          <th className="p-2">Vehicle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.materialsReceived.map((mat, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold text-slate-800">{mat.materialName}</td>
                            <td className="p-2 font-bold text-slate-700">{mat.quantity} {mat.unit}</td>
                            <td className="p-2 text-slate-500">{mat.supplier}</td>
                            <td className="p-2 font-mono text-[11px] text-indigo-700">{mat.challanNo}</td>
                            <td className="p-2 font-mono text-[11px] text-slate-600">{mat.vehicleNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety & QA */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Safety Toolbox Topic:</span>
                  <span className="text-slate-600">{selectedReport.safetyToolboxTopic || 'Site safety review'}</span>
                </div>
                {selectedReport.qualityTests && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Quality Control / Cube Tests:</span>
                    <p className="text-slate-600">{selectedReport.qualityTests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 sticky bottom-0">
              <button
                type="button"
                onClick={() => openForm62Modal(selectedReport)}
                className="btn bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-indigo-600" /> Print Official CPWD Form 62
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 sm:flex-initial btn btn-secondary text-xs px-4 py-2.5"
                >
                  Close
                </button>
                {selectedReport.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedReport._id)}
                    className="flex-1 sm:flex-initial btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Sign DPR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL CPWD FORM 62 PRINTABLE MODAL */}
      {isForm62ModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[94dvh] sm:h-auto sm:max-h-[96vh] flex flex-col border border-slate-300 overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>
            {/* Action Bar (Hidden in Print) */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white rounded-t-2xl sm:rounded-t-none flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">CPWD Form 62 - Daily Progress Report & Site Diary</h3>
                  <p className="text-[11px] text-slate-300 hidden sm:block">Official contractor daily record per CPWD Works Manual / FIDIC Red Book Sub-Clause 4.23</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print Form 62 / PDF
                </button>
                <button
                  onClick={() => setIsForm62ModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-left">
                    <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">CENTRAL PUBLIC WORKS DEPARTMENT / FIDIC</span>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">FORM NO. 62 - DAILY SITE DIARY & PROGRESS REPORT</h1>
                    <p className="text-xs text-slate-600 font-medium">Standard Execution Record of Civil Works & Labour Deployment</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block border border-slate-900 px-3 py-1 bg-slate-50 text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">DPR Reference No:</span>
                      <span className="font-mono text-sm font-extrabold text-slate-900">{selectedReport.dprNo}</span>
                    </div>
                  </div>
                </div>

                {/* Meta details table */}
                <div className="grid grid-cols-4 border border-slate-900 text-left text-xs mt-3">
                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Project Name:</div>
                  <div className="p-2 border-r border-b border-slate-900 col-span-3 font-semibold">{selectedReport.projectId?.name || activeProjectObj?.name}</div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Report Date:</div>
                  <div className="p-2 border-r border-b border-slate-900 font-semibold">
                    {new Date(selectedReport.reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Weather & Temp:</div>
                  <div className="p-2 border-b border-slate-900 font-semibold">
                    {selectedReport.weather || 'Sunny'} ({selectedReport.weatherDetails?.tempMax || 34}°C Max / {selectedReport.weatherDetails?.tempMin || 22}°C Min)
                  </div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Site Engineer:</div>
                  <div className="p-2 border-r border-slate-900 font-semibold">{selectedReport.siteEngineerId?.name || 'Engineer In-Charge'}</div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Shifts Worked:</div>
                  <div className="p-2 font-semibold">
                    {selectedReport.weatherDetails?.shiftsWorked || 1} Shift(s) ({selectedReport.weatherDetails?.shiftHours || 8} hrs/shift)
                  </div>
                </div>
              </div>

              {/* Section A: Muster Roll & Labour Deployment */}
              <div className="mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-200 px-2 py-1 text-slate-900 border border-slate-900 mb-1">
                  SECTION A: LABOUR DEPLOYMENT & MUSTER ROLL REGISTER
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-10">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left">Trade / Category of Labour</th>
                      <th className="border border-slate-900 p-1.5 text-left">Contractor / Gang</th>
                      <th className="border border-slate-900 p-1.5 w-20">Skilled</th>
                      <th className="border border-slate-900 p-1.5 w-20">Unskilled</th>
                      <th className="border border-slate-900 p-1.5 w-20">Total Nos</th>
                      <th className="border border-slate-900 p-1.5 w-20">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.manpower || []).map((row, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-left font-medium">{row.trade}</td>
                        <td className="border border-slate-900 p-1.5 text-left text-slate-600">{row.contractorName}</td>
                        <td className="border border-slate-900 p-1.5">{row.skilledCount}</td>
                        <td className="border border-slate-900 p-1.5">{row.unskilledCount}</td>
                        <td className="border border-slate-900 p-1.5 font-bold">{row.totalCount}</td>
                        <td className="border border-slate-900 p-1.5">{row.hoursWorked}</td>
                      </tr>
                    ))}
                    <tr className="font-extrabold bg-slate-50 text-center">
                      <td colSpan={3} className="border border-slate-900 p-1.5 text-right uppercase">TOTAL MANPOWER DEPLOYED:</td>
                      <td className="border border-slate-900 p-1.5">
                        {(selectedReport.manpower || []).reduce((acc, m) => acc + (Number(m.skilledCount) || 0), 0)}
                      </td>
                      <td className="border border-slate-900 p-1.5">
                        {(selectedReport.manpower || []).reduce((acc, m) => acc + (Number(m.unskilledCount) || 0), 0)}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-indigo-900 font-extrabold text-sm">
                        {selectedReport.totalManpower}
                      </td>
                      <td className="border border-slate-900 p-1.5">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section B: Plant & Machinery */}
              <div className="mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-200 px-2 py-1 text-slate-900 border border-slate-900 mb-1">
                  SECTION B: PLANT, MACHINERY & EQUIPMENT UTILIZATION LOG
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-10">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left">Equipment / Machine Name</th>
                      <th className="border border-slate-900 p-1.5 w-28">Reg / Fleet No</th>
                      <th className="border border-slate-900 p-1.5 w-20">Hours Run</th>
                      <th className="border border-slate-900 p-1.5 w-20">Hours Idle</th>
                      <th className="border border-slate-900 p-1.5 w-20">Breakdown</th>
                      <th className="border border-slate-900 p-1.5 text-left">Remarks & Utilization Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.equipment || []).map((eq, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-left font-semibold">{eq.name}</td>
                        <td className="border border-slate-900 p-1.5 font-mono">{eq.regNumber || '-'}</td>
                        <td className="border border-slate-900 p-1.5 font-bold text-emerald-800">{eq.hoursRun}</td>
                        <td className="border border-slate-900 p-1.5 text-amber-700">{eq.hoursIdle}</td>
                        <td className="border border-slate-900 p-1.5 text-red-700">{eq.breakdownHours}</td>
                        <td className="border border-slate-900 p-1.5 text-left text-slate-600">{eq.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section C: Materials Received at Site Gate */}
              <div className="mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-200 px-2 py-1 text-slate-900 border border-slate-900 mb-1">
                  SECTION C: MATERIALS RECEIVED AT SITE (INWARD GATE PASS REGISTER)
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-10">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left">Material Description</th>
                      <th className="border border-slate-900 p-1.5 w-24">Quantity</th>
                      <th className="border border-slate-900 p-1.5 w-16">Unit</th>
                      <th className="border border-slate-900 p-1.5 text-left">Supplier / Manufacturer</th>
                      <th className="border border-slate-900 p-1.5 w-28">Challan No</th>
                      <th className="border border-slate-900 p-1.5 w-28">Vehicle No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.materialsReceived || []).map((mat, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-left font-semibold">{mat.materialName}</td>
                        <td className="border border-slate-900 p-1.5 font-bold">{mat.quantity}</td>
                        <td className="border border-slate-900 p-1.5">{mat.unit}</td>
                        <td className="border border-slate-900 p-1.5 text-left">{mat.supplier}</td>
                        <td className="border border-slate-900 p-1.5 font-mono">{mat.challanNo}</td>
                        <td className="border border-slate-900 p-1.5 font-mono">{mat.vehicleNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section D: Work Activities */}
              <div className="mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-200 px-2 py-1 text-slate-900 border border-slate-900 mb-1">
                  SECTION D: DETAILS OF WORK EXECUTED TODAY
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-10">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left w-44">Location / Grid Reference</th>
                      <th className="border border-slate-900 p-1.5 text-left">Nature of Work Executed</th>
                      <th className="border border-slate-900 p-1.5 w-24">Qty Done</th>
                      <th className="border border-slate-900 p-1.5 w-16">Unit</th>
                      <th className="border border-slate-900 p-1.5 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.workActivities || []).map((act, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-left font-bold">{act.location}</td>
                        <td className="border border-slate-900 p-1.5 text-left">{act.description}</td>
                        <td className="border border-slate-900 p-1.5 font-bold">{act.quantityExecuted}</td>
                        <td className="border border-slate-900 p-1.5">{act.unit}</td>
                        <td className="border border-slate-900 p-1.5 font-medium">{act.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section E: HSE & QA/QC */}
              <div className="border border-slate-900 p-3 mb-4 text-xs space-y-2">
                <div className="font-extrabold uppercase text-slate-800 border-b border-slate-300 pb-1">
                  SECTION E: HEALTH, SAFETY, ENVIRONMENT (HSE) & QUALITY ASSURANCE (QA/QC)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold block">Safety Toolbox Talk Topic:</span>
                    <p className="text-slate-700">{selectedReport.safetyToolboxTopic || 'General Site Safety, PPE, and Scaffolding Inspection'}</p>
                    <span className="font-bold block mt-2">Safety Incidents / Near Misses:</span>
                    <p className="text-slate-700 font-bold text-emerald-800">{selectedReport.safetyIncidents || 0} (Zero Lost Time Injury)</p>
                  </div>
                  <div>
                    <span className="font-bold block">Quality Control Sampling & Tests:</span>
                    <p className="text-slate-700">{selectedReport.qualityTests || 'Cube samples taken per IS 456 frequency. Slump measured and compliant.'}</p>
                    <span className="font-bold block mt-2">Site Issues / Impediments:</span>
                    <p className="text-slate-700">{selectedReport.issues || 'No critical site impediments encountered.'}</p>
                  </div>
                </div>
              </div>

              {/* 3-Tier Official Signature Grid */}
              <div className="grid grid-cols-3 border border-slate-900 mt-6 text-center text-xs">
                <div className="border-r border-slate-900 p-3 sm:p-4 flex flex-col justify-between h-32">
                  <div className="font-bold text-slate-700">PREPARED BY:</div>
                  {selectedReport.engineerSignature ? (
                    <img src={selectedReport.engineerSignature} alt="Site Engineer Signature" className="h-10 mx-auto object-contain my-1" />
                  ) : null}
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {selectedReport.signedBy || selectedReport.siteEngineerId?.name || 'Site Engineer'}
                    <span className="block text-[10px] text-slate-500 font-normal">Junior Engineer / Site Supervisor</span>
                  </div>
                </div>

                <div className="border-r border-slate-900 p-4 flex flex-col justify-between h-28">
                  <div className="font-bold text-slate-700">VERIFIED & SUBMITTED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    ApexBuild Project Controls
                    <span className="block text-[10px] text-slate-500 font-normal">Project Manager / Resident Engineer</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between h-28 bg-slate-50/50">
                  <div className="font-bold text-slate-700">INSPECTED & APPROVED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {selectedReport.status === 'APPROVED' ? 'Certified / Verified' : '(Awaiting Sign-off)'}
                    <span className="block text-[10px] text-slate-500 font-normal">Client Engineer / PMC Consultant</span>
                  </div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="text-[10px] text-slate-500 text-center mt-4">
                This Daily Progress Report is generated by ApexBuild Platform. Certified record under CPWD Works Manual / General Conditions of Contract.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Camera Barcode & QR Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setSearchTerm(code);
          toast.success(`Scanned: ${code}`);
        }}
        title="Scan Delivery Challan / QR"
        subtitle="Align the delivery gate challan QR code or vehicle tag"
      />

      {/* Engineer Certification Signature Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        initialSignerName={formData.signedBy || 'Site Engineer In-Charge'}
        roleLabel="Site Engineer / Certification Authority"
        title="DPR Form 62 Certification Sign-off"
        subtitle="Digital sign-off verifying manpower headcount & day activities"
        onSave={({ signatureDataUrl, signerName }) => {
          setFormData(prev => ({
            ...prev,
            engineerSignature: signatureDataUrl,
            signedBy: signerName
          }));
        }}
      />

      {/* Mobile Camera Site Progress & Defect Photo Capture */}
      <CameraPhotoCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        title="Capture DPR Site Progress Photo"
        subtitle="Capture rebar, shuttering, concrete, or site inspections"
        instructionGuide="Frame construction activity or inspection item clearly"
        onCapture={(result) => {
          setFormData(prev => ({
            ...prev,
            sitePhotos: [...(prev.sitePhotos || []), {
              dataUrl: result.dataUrl,
              size: result.compressedBytes,
              capturedAt: new Date().toISOString()
            }]
          }));
          toast.success(`Site photo captured & compressed (${formatBytes(result.compressedBytes)})`);
        }}
      />
      </div>
    </PullToRefreshContainer>
  );
}
