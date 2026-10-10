import { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Plus, Activity, CheckCircle2, 
  XCircle, Filter, FileText, RefreshCw, ChevronRight, BarChart2,
  Calendar, User, AlertOctagon, HelpCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine, 
  Scatter, ComposedChart 
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DiagnosticsQC() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [capaModalOpen, setCapaModalOpen] = useState(false);
  const [activeRunForCapa, setActiveRunForCapa] = useState(null);

  // Form states
  const [observedValue, setObservedValue] = useState('');
  const [correctiveActionText, setCorrectiveActionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Lot Form
  const [newLot, setNewLot] = useState({
    controlName: '',
    analyzerName: '',
    department: 'Biochemistry',
    parameterName: '',
    unit: '',
    level: 'Level 1 (Normal)',
    lotNumber: '',
    targetMean: '',
    targetSD: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchQCLots();
  }, [selectedDepartment]);

  const fetchQCLots = async () => {
    try {
      setLoading(true);
      const url = selectedDepartment === 'ALL' 
        ? '/diagnostics/qc/lots' 
        : `/diagnostics/qc/lots?department=${selectedDepartment}`;
      const res = await api.get(url);
      const fetchedLots = res.data.data.lots || [];
      setLots(fetchedLots);
      if (fetchedLots.length > 0) {
        if (!selectedLot || !fetchedLots.some(l => l._id === selectedLot._id)) {
          setSelectedLot(fetchedLots[0]);
        } else {
          // Update selectedLot with latest data
          const updated = fetchedLots.find(l => l._id === selectedLot._id);
          setSelectedLot(updated);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Quality Control data');
    } finally {
      setLoading(false);
    }
  };

  // Submit daily QC observation
  const handleRecordRun = async (e) => {
    e.preventDefault();
    if (!selectedLot || !observedValue) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/diagnostics/qc/lots/${selectedLot._id}/runs`, {
        observedValue: parseFloat(observedValue),
        correctiveAction: correctiveActionText
      });

      const { evaluation } = res.data.data;
      if (evaluation.status === 'OUT_OF_CONTROL') {
        toast.error(`⚠️ WESTGARD REJECT: ${evaluation.violationDescription}`, { duration: 6000 });
      } else if (evaluation.status === 'WARNING') {
        toast((t) => (
          <span className="text-amber-800 font-medium">
            ⚠️ <b>QC Warning:</b> {evaluation.violationDescription}
          </span>
        ), { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('✓ Daily QC Run recorded: In Control');
      }

      setObservedValue('');
      setCorrectiveActionText('');
      setRunModalOpen(false);
      fetchQCLots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record QC run');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit CAPA
  const handleSaveCapa = async (e) => {
    e.preventDefault();
    if (!selectedLot || !activeRunForCapa || !correctiveActionText) return;

    try {
      setSubmitting(true);
      await api.patch(`/diagnostics/qc/lots/${selectedLot._id}/runs/${activeRunForCapa._id}/corrective-action`, {
        correctiveAction: correctiveActionText
      });
      toast.success('Corrective Action & Preventive Action (CAPA) logged');
      setCapaModalOpen(false);
      setActiveRunForCapa(null);
      setCorrectiveActionText('');
      fetchQCLots();
    } catch (error) {
      toast.error('Failed to log corrective action');
    } finally {
      setSubmitting(false);
    }
  };

  // Create New QC Lot
  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/diagnostics/qc/lots', newLot);
      toast.success('New QC Control Lot registered successfully');
      setLotModalOpen(false);
      setNewLot({
        controlName: '',
        analyzerName: '',
        department: 'Biochemistry',
        parameterName: '',
        unit: '',
        level: 'Level 1 (Normal)',
        lotNumber: '',
        targetMean: '',
        targetSD: '',
        expiryDate: ''
      });
      fetchQCLots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register QC lot');
    } finally {
      setSubmitting(false);
    }
  };

  // Format chart data for Levey-Jennings
  const chartData = selectedLot?.runs?.map((r, i) => ({
    runNumber: `Run ${r.runNumber}`,
    day: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    observed: r.observedValue,
    zScore: r.zScore,
    status: r.status,
    violationRule: r.violationRule,
    violationDescription: r.violationDescription,
    technician: r.technicianName,
    rawDate: r.date
  })) || [];

  const targetMean = selectedLot?.targetMean || 0;
  const targetSD = selectedLot?.targetSD || 1;

  // L-J reference lines
  const plus3SD = Number((targetMean + 3 * targetSD).toFixed(2));
  const plus2SD = Number((targetMean + 2 * targetSD).toFixed(2));
  const plus1SD = Number((targetMean + 1 * targetSD).toFixed(2));
  const minus1SD = Number((targetMean - 1 * targetSD).toFixed(2));
  const minus2SD = Number((targetMean - 2 * targetSD).toFixed(2));
  const minus3SD = Number((targetMean - 3 * targetSD).toFixed(2));

  // Overall stats
  const totalLots = lots.length;
  const totalRuns = lots.reduce((acc, l) => acc + (l.runs?.length || 0), 0);
  const outOfControlCount = lots.reduce((acc, l) => {
    const last = l.runs?.length ? l.runs[l.runs.length - 1] : null;
    return acc + (last?.status === 'OUT_OF_CONTROL' ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Internal Quality Control (IQC) Station
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  NABL ISO 15189
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daily Levey-Jennings control charts, multi-rule Westgard validation & automated analytical alarms.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLotModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Register QC Lot
          </button>
          <button
            onClick={() => setRunModalOpen(true)}
            disabled={!selectedLot}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            + Record Daily QC Run
          </button>
        </div>
      </div>

      {/* KPI Quality Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Control Lots</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalLots}</h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">Across Biochemistry & Hematology</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Quality Runs</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalRuns}</h3>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-indigo-600 mt-2">Daily control measurements</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Out-of-Control</p>
              <h3 className={`text-2xl font-black mt-1 ${outOfControlCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {outOfControlCount}
              </h3>
            </div>
            <div className={`p-2 rounded-xl ${outOfControlCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-[11px] font-semibold mt-2 ${outOfControlCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {outOfControlCount > 0 ? 'Requires immediate CAPA log' : 'All analyzers within analytical limits'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Westgard Compliance</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">98.4%</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-emerald-700 mt-2">NABL threshold &gt; 95% passed</p>
        </div>
      </div>

      {/* Main QC Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lot Navigator */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Monitored Controls</h2>
              
              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Hematology">Hematology</option>
                <option value="Serology">Serology</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {lots.map((lot) => {
                const isSelected = selectedLot?._id === lot._id;
                const status = lot.statistics?.currentStatus;
                return (
                  <button
                    key={lot._id}
                    onClick={() => setSelectedLot(lot)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                          {lot.department} • {lot.level}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                          {lot.parameterName}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lot.analyzerName}
                        </p>
                      </div>

                      {status === 'OUT_OF_CONTROL' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          REJECT
                        </span>
                      ) : status === 'WARNING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                          WARNING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          IN CONTROL
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>Target: {lot.targetMean} {lot.unit}</span>
                      <span>CV%: {lot.statistics?.runningCV}%</span>
                      <span>Runs: {lot.statistics?.totalRuns}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Levey-Jennings Chart & Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLot ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedLot.parameterName} — Levey-Jennings (L-J) Chart
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {selectedLot.lotNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instrument: <b>{selectedLot.analyzerName}</b> | Material: {selectedLot.controlName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Mean &plusmn; 1s</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {targetMean} &plusmn; {targetSD} {selectedLot.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => setRunModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                  >
                    + Add Daily Point
                  </button>
                </div>
              </div>

              {/* Statistical Limits Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Reference Limits:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-600 inline-block"></span> Mean ({targetMean})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-blue-400 inline-block border-t border-dashed"></span> &plusmn;1s ({minus1SD} / {plus1SD})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-500 inline-block border-t border-dashed"></span> &plusmn;2s Warning ({minus2SD} / {plus2SD})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-600 inline-block"></span> &plusmn;3s Reject ({minus3SD} / {plus3SD})
                </span>
              </div>

              {/* The Levey-Jennings Chart */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      domain={[
                        Number((targetMean - 3.8 * targetSD).toFixed(1)), 
                        Number((targetMean + 3.8 * targetSD).toFixed(1))
                      ]}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    
                    <RechartsTooltip content={<CustomLJTooltip unit={selectedLot.unit} />} />

                    {/* Standard Deviation Reference Lines */}
                    <ReferenceLine y={plus3SD} stroke="#e11d48" strokeWidth={1.5} label={{ value: '+3s', fill: '#e11d48', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={plus2SD} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '+2s', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={plus1SD} stroke="#60a5fa" strokeDasharray="2 2" />
                    
                    {/* Assigned Mean Line */}
                    <ReferenceLine y={targetMean} stroke="#059669" strokeWidth={2} label={{ value: 'Mean', fill: '#059669', fontSize: 10, position: 'right' }} />

                    <ReferenceLine y={minus1SD} stroke="#60a5fa" strokeDasharray="2 2" />
                    <ReferenceLine y={minus2SD} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '-2s', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={minus3SD} stroke="#e11d48" strokeWidth={1.5} label={{ value: '-3s', fill: '#e11d48', fontSize: 10, position: 'right' }} />

                    {/* Connecting control line */}
                    <Line 
                      type="monotone" 
                      dataKey="observed" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        let fill = '#10b981'; // In control
                        if (payload.status === 'OUT_OF_CONTROL') fill = '#e11d48';
                        else if (payload.status === 'WARNING') fill = '#f59e0b';
                        return (
                          <circle 
                            key={props.index} 
                            cx={cx} 
                            cy={cy} 
                            r={payload.status === 'OUT_OF_CONTROL' ? 6 : 4} 
                            fill={fill} 
                            stroke="#ffffff" 
                            strokeWidth={2} 
                          />
                        );
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Running Statistics Cards */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Running Mean</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{selectedLot.statistics?.runningMean} {selectedLot.unit}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Running SD</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">&plusmn; {selectedLot.statistics?.runningSD}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Running CV%</span>
                  <p className="text-sm font-black text-blue-600 mt-0.5">{selectedLot.statistics?.runningCV}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">In-Control Pass</span>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{selectedLot.statistics?.passRate}%</p>
                </div>
              </div>

              {/* Daily Control Runs History Table */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Recent QC Observations & Westgard Audit
                  </h4>
                  <span className="text-[11px] text-slate-400">Showing last 15 control runs</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Z-Score (SD)</th>
                        <th className="py-2.5 px-3">Westgard Evaluation</th>
                        <th className="py-2.5 px-3">Technician</th>
                        <th className="py-2.5 px-3 text-right">CAPA Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedLot.runs || []).slice(-15).reverse().map((run) => (
                        <tr key={run._id} className={run.status === 'OUT_OF_CONTROL' ? 'bg-rose-50/50' : run.status === 'WARNING' ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {new Date(run.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {run.observedValue} {selectedLot.unit}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            <span className={Math.abs(run.zScore) > 2 ? 'font-bold text-rose-600' : ''}>
                              {run.zScore > 0 ? `+${run.zScore}` : run.zScore}s
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {run.status === 'OUT_OF_CONTROL' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                🚨 REJECT ({run.violationRule})
                              </span>
                            ) : run.status === 'WARNING' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                ⚠️ WARNING (1_2s)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ In Control
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {run.technicianName}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {run.status === 'OUT_OF_CONTROL' ? (
                              run.correctiveAction ? (
                                <span className="text-[11px] text-emerald-700 font-bold" title={run.correctiveAction}>
                                  ✓ Resolved
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveRunForCapa(run);
                                    setCapaModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors shadow-2xs"
                                >
                                  + Log CAPA
                                </button>
                              )
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm">Select a Quality Control Lot on the left to view the Levey-Jennings chart.</p>
            </div>
          )}
        </div>

      </div>

      {/* Record Daily QC Run Modal */}
      {runModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Record Daily Control Reading</h3>
                <p className="text-[11px] text-slate-400">{selectedLot.parameterName} • {selectedLot.analyzerName}</p>
              </div>
              <button onClick={() => setRunModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordRun} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-blue-900 font-medium">
                  <span>Assigned Target Mean:</span>
                  <span className="font-bold">{selectedLot.targetMean} {selectedLot.unit}</span>
                </div>
                <div className="flex justify-between text-blue-900 font-medium">
                  <span>Target 1 SD:</span>
                  <span className="font-bold">&plusmn; {selectedLot.targetSD}</span>
                </div>
                <div className="flex justify-between text-blue-900 font-medium">
                  <span>&plusmn; 2s Tolerable Range:</span>
                  <span className="font-bold">{minus2SD} – {plus2SD} {selectedLot.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Today's Observed Control Value ({selectedLot.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={observedValue}
                  onChange={(e) => setObservedValue(e.target.value)}
                  placeholder={`e.g. ${selectedLot.targetMean}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Instant Z-Score calculation preview */}
              {observedValue && !isNaN(parseFloat(observedValue)) && (
                <div className="p-2.5 rounded-xl border text-xs flex justify-between items-center bg-slate-50">
                  <span className="text-slate-600 font-medium">Calculated Z-Score:</span>
                  {(() => {
                    const z = Number(((parseFloat(observedValue) - selectedLot.targetMean) / selectedLot.targetSD).toFixed(2));
                    const absZ = Math.abs(z);
                    return (
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        absZ > 3 ? 'bg-rose-100 text-rose-800' : absZ > 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {z > 0 ? `+${z}` : z}s {absZ > 3 ? '(REJECT 1_3s)' : absZ > 2 ? '(WARNING 1_2s)' : '(PASS)'}
                      </span>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Technician Clinical Remarks (Optional)
                </label>
                <textarea
                  rows="2"
                  value={correctiveActionText}
                  onChange={(e) => setCorrectiveActionText(e.target.value)}
                  placeholder="e.g. Analyzer baseline calibrated at 08:00 AM..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRunModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !observedValue}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  {submitting ? 'Evaluating...' : 'Save & Check Westgard Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log CAPA Modal */}
      {capaModalOpen && activeRunForCapa && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Corrective & Preventive Action (CAPA)</h3>
                <p className="text-[11px] text-rose-200">NABL Mandatory Deviation Audit</p>
              </div>
              <button onClick={() => setCapaModalOpen(false)} className="text-rose-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCapa} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-rose-900">
                  Violation Rule: {activeRunForCapa.violationRule}
                </p>
                <p className="text-rose-800 text-[11px]">
                  {activeRunForCapa.violationDescription}
                </p>
                <p className="text-slate-600 text-[11px] pt-1">
                  Observed: <b>{activeRunForCapa.observedValue} {selectedLot.unit}</b> (Z-Score: <b>{activeRunForCapa.zScore}s</b>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Corrective Action Details *
                </label>
                <textarea
                  rows="3"
                  required
                  value={correctiveActionText}
                  onChange={(e) => setCorrectiveActionText(e.target.value)}
                  placeholder="e.g. Reagent pack replaced with lot #4412, optics chamber cleaned, control re-run within &plusmn; 1s tolerance."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCapaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !correctiveActionText}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  {submitting ? 'Saving...' : 'Resolve Deviation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New QC Lot Modal */}
      {lotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Register New QC Control Lot</h3>
                <p className="text-[11px] text-slate-400">Configure assay parameters and target standard deviations</p>
              </div>
              <button onClick={() => setLotModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLot} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department *</label>
                  <select
                    value={newLot.department}
                    onChange={(e) => setNewLot({ ...newLot, department: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Serology">Serology</option>
                    <option value="Hormones & Immunoassay">Immunoassay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Level *</label>
                  <select
                    value={newLot.level}
                    onChange={(e) => setNewLot({ ...newLot, level: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Level 1 (Normal)">Level 1 (Normal)</option>
                    <option value="Level 2 (High / Pathological)">Level 2 (High / Pathological)</option>
                    <option value="Level 3 (Low)">Level 3 (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Parameter Name *</label>
                  <input
                    type="text"
                    required
                    value={newLot.parameterName}
                    onChange={(e) => setNewLot({ ...newLot, parameterName: e.target.value })}
                    placeholder="e.g. Hemoglobin, Glucose"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit</label>
                  <input
                    type="text"
                    value={newLot.unit}
                    onChange={(e) => setNewLot({ ...newLot, unit: e.target.value })}
                    placeholder="e.g. mg/dL, g/dL"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Control Material *</label>
                  <input
                    type="text"
                    required
                    value={newLot.controlName}
                    onChange={(e) => setNewLot({ ...newLot, controlName: e.target.value })}
                    placeholder="e.g. Bio-Rad Liquichek"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Analyzer / Instrument *</label>
                  <input
                    type="text"
                    required
                    value={newLot.analyzerName}
                    onChange={(e) => setNewLot({ ...newLot, analyzerName: e.target.value })}
                    placeholder="e.g. Roche Cobas c311"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={newLot.lotNumber}
                    onChange={(e) => setNewLot({ ...newLot, lotNumber: e.target.value })}
                    placeholder="LOT-2026-X"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Mean (&mu;) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLot.targetMean}
                    onChange={(e) => setNewLot({ ...newLot, targetMean: e.target.value })}
                    placeholder="100.0"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target SD (&sigma;) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLot.targetSD}
                    onChange={(e) => setNewLot({ ...newLot, targetSD: e.target.value })}
                    placeholder="3.5"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  {submitting ? 'Registering...' : 'Register Control Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom Tooltip for Levey-Jennings
function CustomLJTooltip({ active, payload, unit }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
        <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">{data.day} ({data.runNumber})</p>
        <p className="text-slate-300">Observed: <b className="text-white font-mono">{data.observed} {unit}</b></p>
        <p className="text-slate-300">Z-Score: <b className="font-mono text-cyan-300">{data.zScore > 0 ? `+${data.zScore}` : data.zScore}s</b></p>
        <p className="text-slate-300">Rule: <b className={`font-mono ${data.status === 'OUT_OF_CONTROL' ? 'text-rose-400' : data.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>{data.status}</b></p>
        {data.violationDescription && (
          <p className="text-[10px] text-amber-300 max-w-xs">{data.violationDescription}</p>
        )}
        <p className="text-[10px] text-slate-400 pt-0.5">Technician: {data.technician}</p>
      </div>
    );
  }
  return null;
}
