import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Beaker, CheckCircle, Save, X, Edit3, ClipboardCheck, 
  Clock, AlertTriangle, AlertCircle, Zap, ShieldCheck, Printer, 
  RefreshCw, CheckSquare, Square, ChevronRight, User, ArrowUpRight, 
  Layers, Stethoscope, Droplet 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getTubeConfig } from '../../components/diagnostics/BarcodeSticker';
import { checkValueAbnormal } from '../../components/diagnostics/reportUtils';
import WorklistRunSheet from '../../components/diagnostics/WorklistRunSheet';

const DEPARTMENTS = [
  { id: 'All', label: 'All Benches', icon: Layers },
  { id: 'Hematology', label: 'Hematology Bench', icon: Droplet, color: 'text-purple-600 bg-purple-50' },
  { id: 'Biochemistry', label: 'Biochemistry Bench', icon: Beaker, color: 'text-blue-600 bg-blue-50' },
  { id: 'Microbiology', label: 'Microbiology & Serology', icon: Stethoscope, color: 'text-teal-600 bg-teal-50' },
  { id: 'Radiology', label: 'Radiology & Imaging', icon: ClipboardCheck, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'Immunology', label: 'Hormones & Immuno', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' }
];

const CLINICAL_REMARK_TEMPLATES = [
  'Sample within normal biological reference intervals.',
  'Mild microcytic hypochromic picture. Correlation with serum ferritin recommended.',
  'Lipid profile reveals elevated LDL and triglycerides. Dietary modification advised.',
  'Borderline abnormal values observed. Repeat testing recommended in 7 days.',
  'Critical values telephonically communicated to attending physician.'
];

const DiagnosticsResults = () => {
  const [selectedDept, setSelectedDept] = useState('All');
  const [worklist, setWorklist] = useState([]);
  const [tatAnalytics, setTatAnalytics] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [tatFilter, setTatFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('All');

  // Multi-select for batch processing
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Result Entry Modal State
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [activeItemForEntry, setActiveItemForEntry] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  // Worklist Run Sheet Modal
  const [runSheetOpen, setRunSheetOpen] = useState(false);

  useEffect(() => {
    fetchWorklistData();
  }, [selectedDept, priorityFilter, tatFilter, stageFilter]);

  const fetchWorklistData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedDept !== 'All') queryParams.append('department', selectedDept);
      if (priorityFilter !== 'All') queryParams.append('priority', priorityFilter);
      if (tatFilter !== 'ALL') queryParams.append('tatFilter', tatFilter);
      if (stageFilter !== 'All') queryParams.append('stage', stageFilter);

      const [worklistRes, tatRes, meRes] = await Promise.all([
        api.get(`/diagnostics/worklists?${queryParams.toString()}`),
        api.get('/diagnostics/worklists/tat-analytics'),
        api.get('/auth/me')
      ]);

      setWorklist(worklistRes.data.data.worklist || []);
      setTatAnalytics(tatRes.data.data);
      if (meRes.data.data?.user?.organizationId) {
        setOrganization(meRes.data.data.user.organizationId);
      }
    } catch (error) {
      toast.error('Failed to load departmental worklists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorklistData();
  };

  // Filtered by Search
  const filteredWorklist = worklist.filter(item => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const patientName = item.patient.name.toLowerCase();
    const patientId = item.patient.patientId.toLowerCase();
    const orderNo = item.orderNumber.toLowerCase();
    const testName = item.test.name.toLowerCase();
    const barcode = item.sample?.barcode?.toLowerCase() || '';
    return patientName.includes(q) || patientId.includes(q) || orderNo.includes(q) || testName.includes(q) || barcode.includes(q);
  });

  // Open Smart Result Entry Modal
  const handleOpenEntry = (item) => {
    setActiveItemForEntry(item);
    const existingParams = item.result?.parameters || [];
    const templateParams = item.test.parameters || [];

    const mergedParams = templateParams.map(tp => {
      const existing = existingParams.find(ep => ep.name === tp.name);
      const val = existing ? existing.value : (tp.defaultValue || '');
      const abnormalCheck = checkValueAbnormal(val, tp.referenceRange);
      return {
        parameterId: tp._id,
        name: tp.name,
        value: val,
        unit: tp.unit || '',
        referenceRange: tp.referenceRange || '',
        isAbnormal: abnormalCheck.isAbnormal,
        flag: abnormalCheck.flag,
        label: abnormalCheck.label
      };
    });

    setParameters(mergedParams);
    setRemarks(item.result?.remarks || '');
    setEntryModalOpen(true);
  };

  // Real-time parameter value change & abnormal checking
  const handleParamChange = (index, value) => {
    const updated = [...parameters];
    const target = updated[index];
    target.value = value;
    const check = checkValueAbnormal(value, target.referenceRange);
    target.isAbnormal = check.isAbnormal;
    target.flag = check.flag;
    target.label = check.label;
    setParameters(updated);
  };

  // Direct manual change / override of the Auto-Flag in the Auto-Flag column
  const handleFlagChange = (index, newFlag) => {
    const updated = [...parameters];
    const target = updated[index];
    target.flag = newFlag;
    target.manualOverride = true;

    if (newFlag === 'NORMAL') {
      target.isAbnormal = false;
      target.label = '✓ Normal';
    } else if (newFlag === 'HIGH') {
      target.isAbnormal = true;
      target.label = '▲ HIGH';
    } else if (newFlag === 'LOW') {
      target.isAbnormal = true;
      target.label = '▼ LOW';
    } else if (newFlag === 'POSITIVE') {
      target.isAbnormal = true;
      target.label = '▲ POSITIVE';
    } else if (newFlag === 'ABNORMAL') {
      target.isAbnormal = true;
      target.label = '▲ ABNORMAL';
    } else if (newFlag === 'EQUIVOCAL') {
      target.isAbnormal = true;
      target.label = '● EQUIVOCAL';
    }
    setParameters(updated);
  };

  // Submit Result Entry (Draft or Verified)
  const handleSubmitResult = async (statusToSet = 'Draft') => {
    if (!activeItemForEntry) return;

    if (statusToSet === 'Verified') {
      const missing = parameters.some(p => !p.value.trim());
      if (missing) {
        return toast.error('Please enter numerical/text values for all parameters before Pathologist Verification');
      }
    }

    try {
      setSavingResult(true);
      const payload = {
        orderId: activeItemForEntry.orderId,
        testId: activeItemForEntry.test.id,
        parameters,
        status: statusToSet,
        remarks
      };

      await api.post('/diagnostics/results', payload);
      toast.success(statusToSet === 'Verified' ? 'Result verified by Pathologist & Reagents Deducted!' : 'Result saved as Draft');
      setEntryModalOpen(false);
      setActiveItemForEntry(null);
      fetchWorklistData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save test result');
    } finally {
      setSavingResult(false);
    }
  };

  // Batch Status Update
  const handleBatchUpdate = async (newStatus) => {
    if (selectedItemIds.length === 0) {
      return toast.error('Please select at least one item from the worklist');
    }

    const selectedItems = worklist.filter(w => selectedItemIds.includes(w.id));
    const sampleIds = selectedItems.map(i => i.sample?.id).filter(Boolean);
    const orderIds = [...new Set(selectedItems.map(i => i.orderId))];

    try {
      await api.patch('/diagnostics/worklists/batch-status', {
        sampleIds,
        orderIds,
        newStatus
      });
      toast.success(`Advanced ${selectedItemIds.length} sample(s) to "${newStatus}"`);
      setSelectedItemIds([]);
      fetchWorklistData();
    } catch (err) {
      toast.error('Failed to update batch status');
    }
  };

  // Multi-select toggle
  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredWorklist.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredWorklist.map(w => w.id));
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const stats = tatAnalytics || {
    totalActive: worklist.length,
    onTrackCount: 0,
    nearBreachCount: 0,
    breachedCount: 0,
    statCount: 0,
    slaComplianceRate: '100.0'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Title & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Beaker className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Clinical TAT & Departmental Worklist Station
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live Turnaround Time (TAT) SLA Engine • Bench Analyzer Dispatching • Smart Result Entry & Verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Refresh Bench Worklist"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Print Departmental Instrument Run-Sheet */}
          <button
            onClick={() => setRunSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print {selectedDept === 'All' ? 'Department' : selectedDept} Run-Sheet (A4)</span>
          </button>
        </div>
      </div>

      {/* TOP CLINICAL TAT & SLA COMPLIANCE KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Queued Samples */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Bench Queue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.totalActive}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Investigations in Progress
          </p>
        </div>

        {/* On-Time SLA Compliance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {stats.slaComplianceRate}%
          </h3>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
            On-Time Report Target
          </p>
        </div>

        {/* STAT Emergencies */}
        <div className={`rounded-2xl p-4 border shadow-2xs transition-all ${
          stats.statCount > 0 
            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              STAT Emergencies
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-700 mt-2 font-mono">
            {stats.statCount}
          </h3>
          <p className="text-[11px] text-rose-600 mt-1 font-bold">
            {stats.statCount > 0 ? '⚡ Requires Immediate Action' : 'No Critical Emergencies'}
          </p>
        </div>

        {/* Near SLA Breach */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiring Soon</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {stats.nearBreachCount}
          </h3>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">
            &lt; 45 mins to SLA Deadline
          </p>
        </div>

        {/* Breached SLA Overdue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Breached</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-red-600 mt-2 font-mono">
            {stats.breachedCount}
          </h3>
          <p className="text-[11px] text-red-500 mt-1 font-medium">
            Overdue Investigations
          </p>
        </div>
      </div>

      {/* DEPARTMENTAL BENCH TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const isSelected = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-white text-blue-900 shadow-xs ring-1 ring-black/5' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{dept.label}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER & BATCH ACTION TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Patient, Barcode, UHID, Test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Sub-Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Urgency Filter */}
          <select
            value={tatFilter}
            onChange={(e) => setTatFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All SLA Statuses</option>
            <option value="BREACHED">🚨 Breached Overdue</option>
            <option value="NEAR_BREACH">⏳ Near Breach (&lt;45m)</option>
            <option value="ON_TRACK">🟢 On Track</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="All">All Priorities</option>
            <option value="STAT">⚡ STAT Emergency Only</option>
            <option value="Urgent">Urgent</option>
            <option value="Routine">Routine</option>
          </select>

          {/* Batch Processing Buttons */}
          {selectedItemIds.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={() => handleBatchUpdate('Processing')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Beaker className="w-3.5 h-3.5" />
                <span>Mark {selectedItemIds.length} Processing</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DEPARTMENTAL WORKLIST TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredWorklist.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <Beaker className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No active tests queued for this departmental bench</p>
              <p className="text-xs text-slate-400">All tests are up to date or no matching samples found.</p>
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <button 
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {selectedItemIds.length === filteredWorklist.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Priority & Specimen</th>
                  <th className="py-3.5 px-4">Patient Demographics</th>
                  <th className="py-3.5 px-4">Test / Investigation</th>
                  <th className="py-3.5 px-4">Workflow Bench Stage</th>
                  <th className="py-3.5 px-4 text-center">Clinical TAT SLA</th>
                  <th className="py-3.5 px-5 text-right">Bench Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorklist.map((item) => {
                  const patient = item.patient || {};
                  const sample = item.sample || {};
                  const tube = getTubeConfig(sample.containerType, sample.sampleType);
                  const isSelected = selectedItemIds.includes(item.id);
                  const isStat = item.priority === 'STAT';
                  const tat = item.tat;
                  const isBreached = tat.tatStatus === 'BREACHED';
                  const isNearBreach = tat.tatStatus === 'NEAR_BREACH';

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isStat 
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-600' 
                          : isSelected
                          ? 'bg-blue-50/50 hover:bg-blue-50/70'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Priority & Specimen Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isStat 
                              ? 'bg-rose-600 text-white animate-pulse shadow-2xs' 
                              : item.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-900">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                            style={{ backgroundColor: tube.dot }}
                            title={sample.containerType}
                          ></span>
                          <span>{sample.barcode || item.orderNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block">
                          {sample.containerType || 'Standard'} • {sample.sampleType || 'Specimen'}
                        </span>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {patient.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {patient.patientId} • {patient.age ? `${patient.age}Y` : ''} {patient.gender || ''}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          Ref: {item.doctor}
                        </div>
                      </td>

                      {/* Test Name & Parameters */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {item.test.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                            {item.test.department}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.test.parameters?.length || 0} params
                          </span>
                        </div>
                      </td>

                      {/* Workflow Stage */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.workflowStage === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.workflowStage === 'RESULT_DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : item.workflowStage === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : item.workflowStage === 'IN_LAB'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.workflowStage.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Clinical TAT SLA Countdown */}
                      <td className="py-3.5 px-4 text-center">
                        {item.workflowStage === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className={`font-mono text-xs font-black inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                              isBreached 
                                ? 'bg-red-100 text-red-800 animate-pulse border border-red-300' 
                                : isNearBreach
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {isBreached 
                                  ? `+${Math.abs(tat.remainingMinutes)}m Overdue` 
                                  : `${Math.floor(tat.remainingMinutes / 60)}h ${tat.remainingMinutes % 60}m left`}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-mono block">
                              SLA: {new Date(tat.targetDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleOpenEntry(item)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{item.result?.status === 'Draft' ? 'Edit Draft' : 'Enter Results'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SMART RESULT ENTRY MODAL */}
      {entryModalOpen && activeItemForEntry && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-300">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{activeItemForEntry.test.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {activeItemForEntry.test.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Patient: {activeItemForEntry.patient.name} ({activeItemForEntry.patient.patientId}) • Specimen: {activeItemForEntry.sample?.barcode || activeItemForEntry.orderNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEntryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parameter Entry Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 bg-slate-50">
              
              {/* Parameter Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Parameter Name</th>
                      <th className="py-2.5 px-4 w-44">Observed Value *</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-4">Reference Range</th>
                      <th className="py-2.5 px-3 text-center">Auto-Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parameters.map((param, idx) => (
                      <tr key={idx} className={param.isAbnormal ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          {param.name}
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => handleParamChange(idx, e.target.value)}
                            placeholder="Enter observed value..."
                            className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold focus:ring-2 ${
                              param.isAbnormal 
                                ? 'border-rose-400 text-rose-950 focus:ring-rose-500 bg-rose-50/40' 
                                : 'border-slate-300 text-slate-900 focus:ring-blue-500'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {param.unit || '-'}
                        </td>

                        <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                          {param.referenceRange || 'Clinical Evaluation'}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {/* Direct Auto-Flag selector & override */}
                          <select
                            value={param.flag || (param.isAbnormal ? 'ABNORMAL' : (param.value ? 'NORMAL' : ''))}
                            onChange={(e) => handleFlagChange(idx, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer border outline-none transition-all shadow-2xs ${
                              param.flag === 'HIGH'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : param.flag === 'LOW'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : (param.flag === 'ABNORMAL' || param.isAbnormal)
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : param.flag === 'POSITIVE'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : param.flag === 'EQUIVOCAL'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : param.value
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            <option value="" disabled>-- Flag --</option>
                            <option value="NORMAL">✓ Normal</option>
                            <option value="HIGH">▲ High</option>
                            <option value="LOW">▼ Low</option>
                            <option value="POSITIVE">▲ Positive</option>
                            <option value="ABNORMAL">▲ Abnormal</option>
                            <option value="EQUIVOCAL">● Equivocal</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Clinical Interpretation & Remarks */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pathologist Clinical Remarks & Notes
                  </label>
                  <span className="text-[11px] text-slate-400">Click a template below to auto-insert</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CLINICAL_REMARK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRemarks(tmpl)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 border border-slate-200 rounded-lg text-[10px] text-slate-700 transition-colors"
                    >
                      {tmpl.slice(0, 35)}...
                    </button>
                  ))}
                </div>

                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter specific morphological observations, clinical interpretations, or pathologist remarks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

            </div>

            {/* Footer Action Buttons */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {parameters.filter(p => p.value.trim()).length} of {parameters.length} parameters completed
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={savingResult}
                  onClick={() => handleSubmitResult('Draft')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={savingResult}
                  onClick={() => handleSubmitResult('Verified')}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Finalize & Pathologist Verify</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DEPARTMENTAL RUN-SHEET MODAL */}
      <WorklistRunSheet
        isOpen={runSheetOpen}
        onClose={() => setRunSheetOpen(false)}
        department={selectedDept === 'All' ? 'Hematology' : selectedDept}
        items={filteredWorklist}
        organization={organization}
      />

    </div>
  );
};

export default DiagnosticsResults;
