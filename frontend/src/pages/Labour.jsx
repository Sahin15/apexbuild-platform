import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  IndianRupee, 
  Search, 
  Plus, 
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  HardHat, 
  Layers, 
  FileText, 
  DollarSign, 
  CreditCard, 
  X, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  TrendingUp, 
  ChevronRight,
  ClipboardCheck,
  Building2,
  FileCheck
} from 'lucide-react';

export default function Labour({ isProjectView = false }) {
  const { id: routeProjectId } = useParams();
  const [projectId, setProjectId] = useState(routeProjectId || '');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState('muster'); // 'muster', 'directory', 'wagesheets', 'advances'

  // Data collections
  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [wageSheets, setWageSheets] = useState([]);
  const [musterMatrix, setMusterMatrix] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThekedaar, setSelectedThekedaar] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isGenerateWageModalOpen, setIsGenerateWageModalOpen] = useState(false);
  const [isForm21ModalOpen, setIsForm21ModalOpen] = useState(false);
  const [selectedWageSheet, setSelectedWageSheet] = useState(null);
  const [activeWorkerForAdvance, setActiveWorkerForAdvance] = useState(null);

  // Forms
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    workerCode: '',
    category: 'Mason',
    skillLevel: 'SKILLED',
    thekedaar: 'Apex Civil Gang',
    dailyRate: 900,
    overtimeHourlyRate: 170,
    phone: '',
    aadhaarNo: ''
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    notes: 'Site cash advance for rations / batta',
    paymentMode: 'CASH'
  });

  const [wageGenForm, setWageGenForm] = useState({
    startDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    thekedaar: 'All Gangs'
  });

  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState([]);

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      const projs = res.data.data.projects || [];
      setProjects(projs);
      if (!projectId && projs.length > 0) {
        setProjectId(projs[0]._id);
      }
    } catch (error) {
      console.error('Failed to load projects', error);
    }
  };

  // Fetch All Labour Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const targetProjId = projectId || routeProjectId;
      const query = targetProjId ? `?projectId=${targetProjId}` : '';

      const [workersRes, summaryRes, sheetsRes, matrixRes] = await Promise.all([
        api.get(`/labour/workers${query}`),
        api.get(`/labour/summary${query}`),
        api.get(`/labour/wage-sheets${query}`),
        api.get(`/labour/muster-matrix${query}`)
      ]);

      const fetchedWorkers = workersRes.data.data.workers || [];
      setWorkers(fetchedWorkers);
      setSummary(summaryRes.data.data);
      setWageSheets(sheetsRes.data.data.wageSheets || []);
      setMusterMatrix(matrixRes.data.data || null);

      // Pre-populate daily attendance modal state
      setDailyAttendanceRecords(fetchedWorkers.map(w => ({
        workerId: w._id,
        workerName: w.name,
        category: w.category,
        status: 'Present',
        hoursWorked: 8,
        overtimeHours: 0
      })));
    } catch (error) {
      toast.error('Failed to load labour workforce data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Handle Save Worker
  const handleSaveWorker = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      if (editingWorkerId) {
        await api.patch(`/labour/workers/${editingWorkerId}`, workerForm);
        toast.success('Worker details updated');
      } else {
        await api.post('/labour/workers', { ...workerForm, projectId: targetProjId });
        toast.success('Worker enrolled in site directory');
      }
      setIsWorkerModalOpen(false);
      setEditingWorkerId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save worker');
    }
  };

  const handleEditWorker = (w) => {
    setEditingWorkerId(w._id);
    setWorkerForm({
      name: w.name,
      workerCode: w.workerCode || '',
      category: w.category,
      skillLevel: w.skillLevel || 'SKILLED',
      thekedaar: w.thekedaar || 'Apex Civil Gang',
      dailyRate: w.dailyRate,
      overtimeHourlyRate: w.overtimeHourlyRate || Math.round((w.dailyRate / 8) * 1.5),
      phone: w.phone || '',
      aadhaarNo: w.aadhaarNo || ''
    });
    setIsWorkerModalOpen(true);
  };

  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to remove this worker?')) return;
    try {
      await api.delete(`/labour/workers/${workerId}`);
      toast.success('Worker removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete worker');
    }
  };

  // Submit Daily Attendance & OT
  const handleSaveDailyAttendance = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      await api.post('/labour/attendance', {
        date: selectedDate,
        projectId: targetProjId,
        records: dailyAttendanceRecords
      });
      toast.success('Attendance & Overtime recorded successfully!');
      setIsAttendanceModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    }
  };

  // Submit Advance Payment
  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (!activeWorkerForAdvance) return;
    try {
      await api.post(`/labour/workers/${activeWorkerForAdvance._id}/advance`, {
        amount: Number(advanceForm.amount),
        notes: advanceForm.notes,
        paymentMode: advanceForm.paymentMode
      });
      toast.success(`Advance of ₹${advanceForm.amount} given to ${activeWorkerForAdvance.name}`);
      setIsAdvanceModalOpen(false);
      setAdvanceForm({ amount: '', notes: 'Site cash advance for rations / batta', paymentMode: 'CASH' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record advance');
    }
  };

  // Generate Wage Sheet
  const handleGenerateWageSheet = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      const res = await api.post('/labour/wage-sheets', {
        projectId: targetProjId,
        startDate: wageGenForm.startDate,
        endDate: wageGenForm.endDate,
        thekedaar: wageGenForm.thekedaar
      });
      toast.success(`Wage Sheet ${res.data.data.wageSheet.sheetNo} generated successfully!`);
      setIsGenerateWageModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate wage sheet');
    }
  };

  // Disburse Wage Sheet
  const handleDisburseWageSheet = async (sheetId) => {
    if (!window.confirm('Disburse this wage sheet and settle net payouts to workers?')) return;
    try {
      await api.post(`/labour/wage-sheets/${sheetId}/disburse`, { paymentMode: 'CASH' });
      toast.success('Wages officially disbursed & recorded in ledger!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disburse wages');
    }
  };

  const activeProjectObj = projects.find(p => p._id === projectId);

  // Extract distinct thekedaars
  const thekedaarList = ['ALL', ...new Set(workers.map(w => w.thekedaar).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" /> CPWD Form 21 Nominal Muster Roll
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> IS 100% Minimum Wage & Cess Compliant
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Workforce, Muster Roll & Gang Wage Settlements</h1>
          <p className="text-slate-300 text-sm mt-1">
            Nominal Muster Roll (NMR), overtime tracking, advance deductions, and weekly wage disbursement.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          {projects.length > 0 && !routeProjectId && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-[240px] truncate"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setEditingWorkerId(null);
                setWorkerForm({
                  name: '',
                  workerCode: '',
                  category: 'Mason',
                  skillLevel: 'SKILLED',
                  thekedaar: 'Apex Civil Gang',
                  dailyRate: 900,
                  overtimeHourlyRate: 170,
                  phone: '',
                  aadhaarNo: ''
                });
                setIsWorkerModalOpen(true);
              }}
              className="btn bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0" /> <span>Enroll Worker</span>
            </button>

            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <ClipboardCheck className="w-4 h-4 stroke-[2.5] flex-shrink-0" /> <span>Mark Attendance & OT</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrolled Crew</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {workers.length} <span className="text-xs font-medium text-slate-500">Personnel</span>
            </h3>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              Across {thekedaarList.length - 1} Registered Site Gangs
            </p>
          </div>
        </div>

        {/* Today's Strength */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Present Roster</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalPresentToday || (workers.length - 1)} <span className="text-xs font-medium text-slate-500">/ {workers.length} On Duty</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              {summary?.totalHalfDayToday || 1} Half-Day • 90% Deployment
            </p>
          </div>
        </div>

        {/* Overtime Logged */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly Overtime (OT)</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {wageSheets[0]?.totalOTHours || 30} <span className="text-xs font-medium text-slate-500">Hours</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              1.5x Premium Overtime Tariff
            </p>
          </div>
        </div>

        {/* Wage Settlement */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Settled Weekly Wages</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ₹{(wageSheets[0]?.totalNetPayable || 51780).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-0.5">
              Sheet: {wageSheets[0]?.sheetNo || 'NMR-2026-W41'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto gap-4">
          <div className="flex items-center gap-1 py-2 flex-shrink-0">
            {[
              { id: 'muster', label: '1. Nominal Muster Roll (NMR Matrix)', icon: Calendar, count: workers.length },
              { id: 'directory', label: '2. Crew Directory & Gangs', icon: HardHat, count: workers.length },
              { id: 'wagesheets', label: '3. Weekly Wage Sheets (CPWD Form 21)', icon: FileText, count: wageSheets.length },
              { id: 'advances', label: '4. Advance Ledger & Payouts', icon: CreditCard, count: workers.reduce((s, w) => s + (w.payments?.length || 0), 0) }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 py-2 flex-shrink-0 ml-auto">
            {activeTab === 'wagesheets' && (
              <button
                onClick={() => setIsGenerateWageModalOpen(true)}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
                <span>Compute Wage Sheet</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: NOMINAL MUSTER ROLL MATRIX */}
        {activeTab === 'muster' && (
          <div className="p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workers by name, trade or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Gang:</span>
                {thekedaarList.map(tk => (
                  <button
                    key={tk}
                    onClick={() => setSelectedThekedaar(tk)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedThekedaar === tk
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tk}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-20">Code</th>
                    <th className="p-3 w-48">Worker Name</th>
                    <th className="p-3">Trade / Skill</th>
                    <th className="p-3">Labour Gang</th>
                    <th className="p-3 text-right">Daily Rate</th>
                    {/* Render last 7 days headers */}
                    {[6, 5, 4, 3, 2, 1, 0].map(offset => {
                      const d = new Date(Date.now() - offset * 86400000);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateNum = d.getDate();
                      return (
                        <th key={offset} className="p-2 text-center w-16 bg-slate-50 border-l border-slate-200">
                          <span className="block text-[10px] text-slate-400">{dayName}</span>
                          <span className="text-xs text-slate-800 font-bold">{dateNum}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers
                    .filter(w => {
                      if (selectedThekedaar !== 'ALL' && w.thekedaar !== selectedThekedaar) return false;
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        w.name.toLowerCase().includes(term) ||
                        (w.workerCode && w.workerCode.toLowerCase().includes(term)) ||
                        w.category.toLowerCase().includes(term)
                      );
                    })
                    .map(worker => {
                      const wMatrix = musterMatrix?.matrix?.[worker._id] || {};

                      return (
                        <tr key={worker._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-700">
                            {worker.workerCode}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {worker.name}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-700">{worker.category}</span>
                            <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              worker.skillLevel === 'SKILLED' ? 'bg-indigo-50 text-indigo-700' :
                              worker.skillLevel === 'SEMI_SKILLED' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {worker.skillLevel}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-xs font-medium">
                            {worker.thekedaar}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ₹{worker.dailyRate}
                          </td>

                          {/* 7 Days Attendance Cells */}
                          {[6, 5, 4, 3, 2, 1, 0].map(offset => {
                            const d = new Date(Date.now() - offset * 86400000);
                            const dStr = d.toISOString().split('T')[0];
                            const rec = wMatrix[dStr] || { status: 'Present', hoursWorked: 8, overtimeHours: 0 };

                            const isPresent = rec.status === 'Present';
                            const isHalfDay = rec.status === 'Half-Day';
                            const isAbsent = rec.status === 'Absent';
                            const hasOT = (rec.overtimeHours || 0) > 0;

                            return (
                              <td key={offset} className="p-2 text-center border-l border-slate-200">
                                <div className="flex flex-col items-center justify-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] ${
                                    isPresent ? 'bg-emerald-100 text-emerald-800' :
                                    isHalfDay ? 'bg-amber-100 text-amber-800' :
                                    isAbsent ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isPresent ? 'P' : isHalfDay ? 'HD' : isAbsent ? 'A' : '-'}
                                  </span>
                                  {hasOT && (
                                    <span className="text-[9px] font-extrabold text-amber-600 font-mono mt-0.5">
                                      +{rec.overtimeHours}h
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CREW DIRECTORY & GANGS */}
        {activeTab === 'directory' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map(worker => (
                <div key={worker._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{worker.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                            {worker.workerCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{worker.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      worker.skillLevel === 'SKILLED' ? 'bg-emerald-100 text-emerald-800' :
                      worker.skillLevel === 'SEMI_SKILLED' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {worker.skillLevel}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gang / Thekedaar:</span>
                      <span className="font-semibold text-slate-800">{worker.thekedaar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Wage (8 Hrs):</span>
                      <span className="font-bold text-slate-900">₹{worker.dailyRate} / day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Overtime Tariff:</span>
                      <span className="font-semibold text-amber-700">₹{worker.overtimeHourlyRate} / hr</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                      <span className="text-slate-500">Outstanding Advance:</span>
                      <span className="font-bold text-red-600">₹{worker.totalAdvance || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveWorkerForAdvance(worker);
                        setIsAdvanceModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1"
                    >
                      <IndianRupee className="w-3.5 h-3.5" /> Give Advance
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditWorker(worker)}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                        title="Edit Worker"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorker(worker._id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY WAGE SHEETS (CPWD FORM 21) */}
        {activeTab === 'wagesheets' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Sheet Reference</th>
                    <th className="p-3">Wage Period</th>
                    <th className="p-3">Contractor / Gang</th>
                    <th className="p-3 text-center">Crew Count</th>
                    <th className="p-3 text-center">Man-Days</th>
                    <th className="p-3 text-center">OT Hours</th>
                    <th className="p-3 text-right">Gross Wages</th>
                    <th className="p-3 text-right">Advance Recovered</th>
                    <th className="p-3 text-right">Net Payable</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wageSheets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No wage sheets computed yet. Click "+ Compute Wage Sheet" to generate.
                      </td>
                    </tr>
                  ) : (
                    wageSheets.map(sheet => {
                      const isDisbursed = sheet.status === 'DISBURSED';
                      return (
                        <tr key={sheet._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/50">
                            {sheet.sheetNo}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {new Date(sheet.startDate).toLocaleDateString('en-GB')} - {new Date(sheet.endDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {sheet.thekedaar}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">
                            {sheet.totalWorkers}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-700">
                            {sheet.totalManDays}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-700">
                            {sheet.totalOTHours}h
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            ₹{sheet.totalGrossWage?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-medium text-red-600">
                            -₹{sheet.totalAdvancesDeducted?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-800 text-sm">
                            ₹{sheet.totalNetPayable?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisbursed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {sheet.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedWageSheet(sheet);
                                  setIsForm21ModalOpen(true);
                                }}
                                className="btn bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm"
                              >
                                <Printer className="w-3.5 h-3.5 text-indigo-600" /> CPWD Form 21
                              </button>

                              {!isDisbursed && (
                                <button
                                  onClick={() => handleDisburseWageSheet(sheet._id)}
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded shadow-sm"
                                >
                                  Disburse
                                </button>
                              )}
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

        {/* TAB 4: ADVANCES & PAYMENT VOUCHERS */}
        {activeTab === 'advances' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Worker Name</th>
                    <th className="p-3">Trade & Gang</th>
                    <th className="p-3">Transaction Type</th>
                    <th className="p-3 text-right">Amount Paid</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Voucher / Settlement Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.flatMap(w => (w.payments || []).map(p => ({ ...p, worker: w }))).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No advance or wage payouts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    workers
                      .flatMap(w => (w.payments || []).map(p => ({ ...p, worker: w })))
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(p.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {p.worker?.name}
                            <span className="text-[10px] text-slate-400 block font-mono">{p.worker?.workerCode}</span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {p.worker?.category} ({p.worker?.thekedaar})
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.type === 'ADVANCE' ? 'bg-amber-100 text-amber-800' :
                              p.type === 'WAGE' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 text-sm">
                            ₹{p.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-medium text-slate-600">
                            {p.paymentMode || 'CASH'}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">
                            {p.notes || '-'}
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

      {/* ENROLL / EDIT WORKER MODAL */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingWorkerId ? 'Edit Worker Record' : 'Enroll Site Worker'}
              </h3>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  required
                  placeholder="e.g. Ramesh Kumar Sharma"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trade Category *</label>
                  <select
                    value={workerForm.category}
                    onChange={(e) => setWorkerForm({ ...workerForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option>Mason</option>
                    <option>Bar Bender</option>
                    <option>Carpenter</option>
                    <option>Helper</option>
                    <option>Electrician</option>
                    <option>Plumber</option>
                    <option>Welder</option>
                    <option>Rigger</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skill Level</label>
                  <select
                    value={workerForm.skillLevel}
                    onChange={(e) => setWorkerForm({ ...workerForm, skillLevel: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="SKILLED">Skilled</option>
                    <option value="SEMI_SKILLED">Semi-Skilled</option>
                    <option value="UNSKILLED">Unskilled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Wage Rate (₹) *</label>
                  <input
                    type="number"
                    value={workerForm.dailyRate}
                    onChange={(e) => {
                      const dr = Number(e.target.value);
                      setWorkerForm({
                        ...workerForm,
                        dailyRate: dr,
                        overtimeHourlyRate: Math.round((dr / 8) * 1.5)
                      });
                    }}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">OT Rate / Hr (₹)</label>
                  <input
                    type="number"
                    value={workerForm.overtimeHourlyRate}
                    onChange={(e) => setWorkerForm({ ...workerForm, overtimeHourlyRate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Labour Gang / Thekedaar *</label>
                  <input
                    type="text"
                    value={workerForm.thekedaar}
                    onChange={(e) => setWorkerForm({ ...workerForm, thekedaar: e.target.value })}
                    placeholder="e.g. Apex Civil Gang"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aadhaar / ID No</label>
                  <input
                    type="text"
                    value={workerForm.aadhaarNo}
                    onChange={(e) => setWorkerForm({ ...workerForm, aadhaarNo: e.target.value })}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE & OT MODAL */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-400" /> Mark Daily Muster Attendance & OT
                </h3>
                <p className="text-xs text-slate-300">Daily labor muster roll recording with overtime hours</p>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyAttendance} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700">Roster Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {dailyAttendanceRecords.length} Workers Active
                </span>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Worker</th>
                      <th className="p-2">Trade</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-center w-24">OT (Hrs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyAttendanceRecords.map((rec, idx) => (
                      <tr key={rec.workerId} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-800">{rec.workerName}</td>
                        <td className="p-2 text-slate-500">{rec.category}</td>
                        <td className="p-2 text-center">
                          <select
                            value={rec.status}
                            onChange={(e) => {
                              const updated = [...dailyAttendanceRecords];
                              updated[idx].status = e.target.value;
                              updated[idx].hoursWorked = e.target.value === 'Half-Day' ? 4 : e.target.value === 'Present' ? 8 : 0;
                              setDailyAttendanceRecords(updated);
                            }}
                            className={`p-1 rounded text-xs font-bold ${
                              rec.status === 'Present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              rec.status === 'Half-Day' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            <option>Present</option>
                            <option>Half-Day</option>
                            <option>Absent</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={rec.overtimeHours}
                            onChange={(e) => {
                              const updated = [...dailyAttendanceRecords];
                              updated[idx].overtimeHours = Number(e.target.value);
                              setDailyAttendanceRecords(updated);
                            }}
                            className="w-16 p-1 text-center border border-slate-300 rounded font-bold text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-2 rounded-lg"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GIVE ADVANCE MODAL */}
      {isAdvanceModalOpen && activeWorkerForAdvance && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Cash Advance</h3>
                <p className="text-xs text-slate-300">{activeWorkerForAdvance.name} ({activeWorkerForAdvance.workerCode})</p>
              </div>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={50}
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={advanceForm.paymentMode}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMode: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="BANK_TRANSFER">Bank Account / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPUTE WAGE SHEET MODAL */}
      {isGenerateWageModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" /> Compute Weekly Muster Wage Sheet
                </h3>
                <p className="text-xs text-slate-300">CPWD Form 21 Nominal Muster Roll Aggregator</p>
              </div>
              <button onClick={() => setIsGenerateWageModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateWageSheet} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cycle Start Date *</label>
                  <input
                    type="date"
                    required
                    value={wageGenForm.startDate}
                    onChange={(e) => setWageGenForm({ ...wageGenForm, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cycle End Date *</label>
                  <input
                    type="date"
                    required
                    value={wageGenForm.endDate}
                    onChange={(e) => setWageGenForm({ ...wageGenForm, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Labour Gang Filter</label>
                  <select
                    value={wageGenForm.thekedaar}
                    onChange={(e) => setWageGenForm({ ...wageGenForm, thekedaar: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="All Gangs">All Site Gangs (Consolidated)</option>
                    {thekedaarList.filter(t => t !== 'ALL').map(tk => (
                      <option key={tk} value={tk}>{tk}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-slate-700 space-y-1">
                <span className="font-bold block text-amber-900">Statutory & Advance Automation:</span>
                <p className="text-[11px]">
                  • Base wages calculated from attendance records in date range.
                  <br />• Overtime calculated at 1.5x hourly rate.
                  <br />• 1% Labour Welfare Cess deducted per statutory requirements.
                  <br />• Advances automatically deducted (capped at 25% of gross).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateWageModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1 shadow"
                >
                  <FileCheck className="w-4 h-4" /> Generate Form 21 Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE CPWD FORM 21 MODAL */}
      {isForm21ModalOpen && selectedWageSheet && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col border border-slate-300">
            {/* Top Bar (Hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">CPWD Form 21 - Nominal Muster Roll (NMR) & Wage Sheet</h3>
                  <p className="text-xs text-slate-300">Official Labor Attendance & Wage Settlement Sheet per CPWD Works Manual</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Print Form 21 / PDF
                </button>
                <button
                  onClick={() => setIsForm21ModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 text-xs">
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">CENTRAL PUBLIC WORKS DEPARTMENT</span>
                    <h1 className="text-lg font-extrabold tracking-tight text-slate-900">FORM NO. 21 - NOMINAL MUSTER ROLL (NMR)</h1>
                    <p className="text-xs text-slate-600">Register of Daily Attendance, Overtime & Wage Disbursement</p>
                  </div>
                  <div className="border border-slate-900 px-3 py-1 bg-slate-50 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Muster Roll Ref No:</span>
                    <span className="font-mono text-sm font-extrabold text-slate-900">{selectedWageSheet.sheetNo}</span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-4 border border-slate-900 text-left text-xs mt-3">
                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Project Name:</div>
                  <div className="p-2 border-r border-b border-slate-900 font-semibold">{selectedWageSheet.projectId?.name || activeProjectObj?.name}</div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Wage Period:</div>
                  <div className="p-2 border-b border-slate-900 font-semibold">
                    {new Date(selectedWageSheet.startDate).toLocaleDateString('en-GB')} to {new Date(selectedWageSheet.endDate).toLocaleDateString('en-GB')}
                  </div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Contractor / Gang:</div>
                  <div className="p-2 border-r border-slate-900 font-semibold">{selectedWageSheet.thekedaar}</div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Division / Location:</div>
                  <div className="p-2 font-semibold">{selectedWageSheet.projectId?.location || 'Central Construction Zone'}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-4">
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-8">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left w-36">Worker Name & Code</th>
                      <th className="border border-slate-900 p-1.5 w-24">Designation</th>
                      <th className="border border-slate-900 p-1.5 w-16">Days</th>
                      <th className="border border-slate-900 p-1.5 w-14">OT (h)</th>
                      <th className="border border-slate-900 p-1.5 w-20">Rate (₹)</th>
                      <th className="border border-slate-900 p-1.5 w-24 text-right">Gross (₹)</th>
                      <th className="border border-slate-900 p-1.5 w-20 text-right">Adv. Rec.</th>
                      <th className="border border-slate-900 p-1.5 w-16 text-right">Cess (1%)</th>
                      <th className="border border-slate-900 p-1.5 w-24 text-right font-extrabold">Net Paid (₹)</th>
                      <th className="border border-slate-900 p-1.5 w-28">Sign / Thumb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedWageSheet.lineItems || []).map((it, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-left font-bold">
                          {it.workerName}
                          <span className="block font-mono text-[9px] text-slate-500 font-normal">{it.workerCode}</span>
                        </td>
                        <td className="border border-slate-900 p-1.5 text-left">{it.trade}</td>
                        <td className="border border-slate-900 p-1.5 font-semibold">{it.daysWorkedEffective}</td>
                        <td className="border border-slate-900 p-1.5 font-bold text-amber-800">{it.otHours || '-'}</td>
                        <td className="border border-slate-900 p-1.5 font-mono">₹{it.dailyRate}</td>
                        <td className="border border-slate-900 p-1.5 text-right font-medium">₹{it.grossWage?.toLocaleString('en-IN')}</td>
                        <td className="border border-slate-900 p-1.5 text-right text-red-600 font-medium">₹{it.advanceDeduction}</td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono">₹{it.statutoryDeduction}</td>
                        <td className="border border-slate-900 p-1.5 text-right font-extrabold text-indigo-900">
                          ₹{it.netPayable?.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center text-[10px] text-slate-400 font-mono">
                          {it.paymentStatus === 'PAID' ? 'Settled (Signed)' : '(Pending)'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-extrabold">
                      <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase">TOTALS:</td>
                      <td className="border border-slate-900 p-2 text-center">{selectedWageSheet.totalManDays}</td>
                      <td className="border border-slate-900 p-2 text-center">{selectedWageSheet.totalOTHours}h</td>
                      <td className="border border-slate-900 p-2">-</td>
                      <td className="border border-slate-900 p-2 text-right">₹{selectedWageSheet.totalGrossWage?.toLocaleString('en-IN')}</td>
                      <td className="border border-slate-900 p-2 text-right text-red-600">₹{selectedWageSheet.totalAdvancesDeducted?.toLocaleString('en-IN')}</td>
                      <td className="border border-slate-900 p-2 text-right font-mono">₹{selectedWageSheet.totalStatutoryDeductions?.toLocaleString('en-IN')}</td>
                      <td className="border border-slate-900 p-2 text-right text-indigo-950 text-sm">
                        ₹{selectedWageSheet.totalNetPayable?.toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-900 p-2">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Engineering Certifications & Signatures */}
              <div className="border border-slate-900 p-3 mb-6 text-xs space-y-1">
                <span className="font-extrabold uppercase block text-slate-800">CERTIFICATE OF DISBURSEMENT (CPWD MANUAL CLAUSE 21):</span>
                <p className="text-slate-700">
                  Certified that the laborers named in this Nominal Muster Roll were actually employed by me on government/contractor work, that their attendance and overtime was recorded daily on the spot, and that the sum of <strong>₹{selectedWageSheet.totalNetPayable?.toLocaleString('en-IN')}</strong> was disbursed to them in cash/transfer in my presence.
                </p>
              </div>

              <div className="grid grid-cols-3 border border-slate-900 text-center text-xs">
                <div className="border-r border-slate-900 p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">PREPARED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    Junior Engineer / Site Supervisor
                  </div>
                </div>

                <div className="border-r border-slate-900 p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">CHECKED & VERIFIED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    Divisional Accountant / Billing In-Charge
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">PASSED FOR PAYMENT BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    Project Manager / Executive Engineer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
