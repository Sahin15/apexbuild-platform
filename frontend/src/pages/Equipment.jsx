import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Fuel, 
  Clock, 
  Gauge, 
  Wrench, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  X, 
  Filter, 
  Search, 
  ShieldCheck, 
  IndianRupee,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Equipment() {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'fleet', 'efficiency'
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('ALL');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  // Forms
  const [logForm, setLogForm] = useState({
    projectId: '',
    equipmentId: '',
    logDate: new Date().toISOString().split('T')[0],
    slipNo: '',
    shift: 'DAY',
    startMeter: 0,
    endMeter: 0,
    idleHours: 0,
    breakdownHours: 0,
    fuelIssuedLiters: 0,
    fuelRatePerLiter: 92,
    fuelSource: 'SITE_TANK',
    fuelSlipNumber: '',
    operatorCost: 500,
    workDescription: '',
    location: 'Main Site Yard',
    operatorName: '',
    supervisorName: 'Kishore Site Supv',
    remarks: ''
  });

  const [equipmentForm, setEquipmentForm] = useState({
    projectId: '',
    name: '',
    equipmentCode: '',
    category: 'EARTHMOVING',
    ownership: 'RENTED',
    supplierOrOwner: '',
    registrationNo: '',
    modelYear: '2024',
    operatorName: '',
    operatorPhone: '',
    rateType: 'HOURLY',
    rentalRate: 1200,
    fuelType: 'DIESEL',
    fuelTankCapacity: 150,
    standardConsumptionPerHour: 6,
    initialMeterReading: 0,
    notes: ''
  });

  const fetchData = async (pId = projectId) => {
    try {
      setLoading(true);
      const query = pId && pId !== 'ALL' ? `?projectId=${pId}` : '';
      
      const [eqRes, logRes, sumRes] = await Promise.all([
        api.get(`/equipment${query}`),
        api.get(`/equipment/logs${query}`),
        api.get(`/equipment/summary${query}`)
      ]);

      setEquipments(eqRes.data?.data?.equipments || []);
      setLogs(logRes.data?.data?.logs || []);
      setSummary(sumRes.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then(res => {
      const pList = res.data?.data?.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setLogForm(prev => ({ ...prev, projectId: pList[0]._id }));
        setEquipmentForm(prev => ({ ...prev, projectId: pList[0]._id }));
      }
    }).catch(console.error);

    fetchData('ALL');
  }, []);

  const handleProjectFilterChange = (e) => {
    const val = e.target.value;
    setProjectId(val);
    fetchData(val);
  };

  // On Equipment select in Log Form, prefill meter & operator
  const handleSelectEquipmentInLog = (eqId) => {
    const selected = equipments.find(e => e._id === eqId);
    if (selected) {
      const start = selected.currentMeterReading || 0;
      setLogForm(prev => ({
        ...prev,
        equipmentId: eqId,
        projectId: selected.projectId?._id || selected.projectId || prev.projectId,
        startMeter: start,
        endMeter: Number((start + 8).toFixed(1)),
        operatorName: selected.operatorName || prev.operatorName
      }));
    } else {
      setLogForm(prev => ({ ...prev, equipmentId: eqId }));
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logForm.equipmentId) {
      toast.error('Please select an equipment asset');
      return;
    }
    try {
      await api.post('/equipment/logs', logForm);
      toast.success('Machine hours & fuel log recorded successfully!');
      setIsLogModalOpen(false);
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record equipment log');
    }
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/equipment', equipmentForm);
      toast.success('Equipment asset registered successfully!');
      setIsEquipmentModalOpen(false);
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register equipment');
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Delete this equipment log entry?')) return;
    try {
      await api.delete(`/equipment/logs/${id}`);
      toast.success('Log entry deleted');
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete log');
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Plant, Fleet & Heavy Machinery
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" /> Diesel Slip & Anti-Theft Tracker
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Plant, Machinery & Diesel Fuel Log</h1>
          <p className="text-slate-300 text-sm mt-1">
            Track daily operating hours, idle time, diesel issuance slips, equipment hire bills & fuel burn efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          <select
            value={projectId}
            onChange={handleProjectFilterChange}
            className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-[240px] truncate"
          >
            <option value="ALL">All Projects (Fleet View)</option>
            {projects.map(p => (
              <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setEquipmentForm({
                  projectId: projectId !== 'ALL' ? projectId : (projects[0]?._id || ''),
                  name: '',
                  equipmentCode: `EQ-${Math.floor(100 + Math.random() * 900)}`,
                  category: 'EARTHMOVING',
                  ownership: 'RENTED',
                  supplierOrOwner: '',
                  registrationNo: '',
                  modelYear: '2024',
                  operatorName: '',
                  operatorPhone: '',
                  rateType: 'HOURLY',
                  rentalRate: 1200,
                  fuelType: 'DIESEL',
                  fuelTankCapacity: 150,
                  standardConsumptionPerHour: 6,
                  initialMeterReading: 0,
                  notes: ''
                });
                setIsEquipmentModalOpen(true);
              }}
              className="btn bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Add Machine</span>
            </button>

            <button
              onClick={() => {
                const firstEq = equipments[0];
                const start = firstEq?.currentMeterReading || 0;
                setLogForm({
                  projectId: firstEq?.projectId?._id || firstEq?.projectId || (projects[0]?._id || ''),
                  equipmentId: firstEq?._id || '',
                  logDate: new Date().toISOString().split('T')[0],
                  slipNo: `LOG-${new Date().toISOString().split('T')[0]}-${Math.floor(100 + Math.random() * 900)}`,
                  shift: 'DAY',
                  startMeter: start,
                  endMeter: Number((start + 8).toFixed(1)),
                  idleHours: 0,
                  breakdownHours: 0,
                  fuelIssuedLiters: 40,
                  fuelRatePerLiter: 92,
                  fuelSource: 'SITE_TANK',
                  fuelSlipNumber: `DSL-${Math.floor(1000 + Math.random() * 9000)}`,
                  operatorCost: 500,
                  workDescription: 'Site work & shifting',
                  location: 'Main Yard',
                  operatorName: firstEq?.operatorName || '',
                  supervisorName: 'Kishore Site Supv',
                  remarks: 'Operational'
                });
                setIsLogModalOpen(true);
              }}
              className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Fuel className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
              <span>Log Machine & Fuel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Machines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Plant & Fleet</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.activeMachines || equipments.length || 0} <span className="text-sm font-normal text-slate-400">Units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.rentedMachines || 0} Hired | {summary?.ownedMachines || 0} Owned
            </p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engine Hours Run</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalHoursRun || 0} <span className="text-sm font-normal text-slate-400">Hours</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.totalIdleHours || 0}h Idle Recorded
            </p>
          </div>
        </div>

        {/* Diesel Issued */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diesel Issued to Site</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalDieselLiters || 0} <span className="text-sm font-normal text-slate-400">Liters</span>
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              Cost: {formatINR(summary?.totalDieselCost)}
            </p>
          </div>
        </div>

        {/* Total Expenditure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Machinery Cost</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {formatINR(summary?.totalExpenditure)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hire: {formatINR(summary?.totalRentalCost)}
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
              { id: 'logs', label: '1. Daily Machine Run & Diesel Slips', icon: Clock, count: logs.length },
              { id: 'fleet', label: '2. Plant & Fleet Inventory', icon: Truck, count: equipments.length },
              { id: 'efficiency', label: '3. Diesel Burn Efficiency & Audits', icon: Gauge, count: equipments.length }
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
        </div>

        {/* TAB 1: DAILY RUN & DIESEL LOGS */}
        {activeTab === 'logs' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Slip Ref & Date</th>
                    <th className="px-4 py-3">Machine / Asset</th>
                    <th className="px-4 py-3 text-right">Engine Hours</th>
                    <th className="px-4 py-3 text-right">Diesel Issued</th>
                    <th className="px-4 py-3 text-right">Hire & Op Cost</th>
                    <th className="px-4 py-3 text-right">Total Day Cost</th>
                    <th className="px-4 py-3">Work Executed</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                        No equipment logs recorded yet. Click "Log Machine & Fuel" to enter shift hours.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const eq = log.equipmentId || {};
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800">{log.slipNo}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(log.logDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {log.shift} Shift
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800">{eq.name || 'Unlinked Machine'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {eq.equipmentCode} • {eq.registrationNo || 'No Plate'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-bold text-blue-600 text-sm">{log.operatingHours} hrs</span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {log.startMeter} ➔ {log.endMeter}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-bold text-emerald-600 text-sm">{log.fuelIssuedLiters} L</span>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {formatINR(log.fuelTotalCost)} ({log.fuelSource})
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-700 font-medium">
                            <div>Rent: {formatINR(log.equipmentRentalCost)}</div>
                            <div className="text-[10px] text-slate-400">Op: {formatINR(log.operatorCost)}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                            {formatINR(log.totalDayCost)}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate">
                            <div className="font-medium text-slate-700 truncate">{log.workDescription || 'Site activities'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{log.location}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-700">{log.operatorName || 'Assigned'}</div>
                            <div className="text-[10px] text-slate-400">Supv: {log.supervisorName}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => handleDeleteLog(log._id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              title="Delete Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* TAB 2: PLANT & FLEET INVENTORY */}
        {activeTab === 'fleet' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipments.map(eq => (
                <div key={eq._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {eq.equipmentCode} • {eq.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{eq.name}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      eq.ownership === 'OWNED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}>
                      {eq.ownership}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{eq.notes || 'Deployed on main site operations.'}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registration No</span>
                      <strong className="text-slate-700">{eq.registrationNo || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rental / Hire Tariff</span>
                      <strong className="text-indigo-600">
                        {eq.rentalRate > 0 ? `${formatINR(eq.rentalRate)} / ${eq.rateType.toLowerCase()}` : 'Owned Asset'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Meter Hours</span>
                      <strong className="text-blue-600">{eq.currentMeterReading} hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Std Fuel Burn</span>
                      <strong className="text-slate-700">{eq.standardConsumptionPerHour} L / hr</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Operator: <strong className="text-slate-800">{eq.operatorName || 'Assigned'}</strong>
                    </span>
                    <span className="text-slate-400">{eq.operatorPhone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIESEL BURN EFFICIENCY & AUDITS */}
        {activeTab === 'efficiency' && (
          <div className="p-4 space-y-4">
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Anti-Theft Diesel Audit & Telemetry Benchmarking:</strong>
                <p className="mt-0.5 text-amber-800">
                  Compares actual liters consumed against standard manufacturer benchmark (L/hr). Equipment running with &gt;20% excess consumption is automatically flagged for maintenance or fuel pilferage investigation.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Asset / Machine</th>
                    <th className="px-4 py-3 text-right">Logged Run Hours</th>
                    <th className="px-4 py-3 text-right">Diesel Filled</th>
                    <th className="px-4 py-3 text-right">Actual Burn Rate</th>
                    <th className="px-4 py-3 text-right">Standard Benchmark</th>
                    <th className="px-4 py-3 text-center">Efficiency Audit</th>
                    <th className="px-4 py-3 text-right">Diesel Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {equipments.map(eq => {
                    const eqLogs = logs.filter(l => (l.equipmentId?._id || l.equipmentId) === eq._id);
                    const totalHours = eqLogs.reduce((s, l) => s + (l.operatingHours || 0), 0);
                    const totalLtr = eqLogs.reduce((s, l) => s + (l.fuelIssuedLiters || 0), 0);
                    const totalFuelCost = eqLogs.reduce((s, l) => s + (l.fuelTotalCost || 0), 0);

                    const actualRate = totalHours > 0 ? Number((totalLtr / totalHours).toFixed(2)) : 0;
                    const stdRate = eq.standardConsumptionPerHour || 5;
                    const isExcessive = actualRate > stdRate * 1.25;

                    return (
                      <tr key={eq._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800">{eq.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{eq.equipmentCode} • {eq.ownership}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                          {totalHours.toFixed(1)} hrs
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                          {totalLtr} Liters
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                          {actualRate > 0 ? `${actualRate} L/hr` : 'No logs'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-500 font-mono">
                          {stdRate} L/hr
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {actualRate === 0 ? (
                            <span className="text-slate-400 text-[11px]">Pending Logs</span>
                          ) : isExcessive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> High Fuel Burn (+{Math.round(((actualRate - stdRate) / stdRate) * 100)}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Optimum Efficiency
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                          {formatINR(totalFuelCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: LOG MACHINE HOURS & FUEL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" /> Shift Machinery Log Slip
                </span>
                <h3 className="text-lg font-bold">Record Machine Run Hours & Diesel Issued</h3>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Machine / Plant Asset *</label>
                  <select
                    value={logForm.equipmentId}
                    onChange={(e) => handleSelectEquipmentInLog(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Choose Machine --</option>
                    {equipments.map(eq => (
                      <option key={eq._id} value={eq._id}>
                        {eq.name} ({eq.equipmentCode}) - {eq.ownership}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Log Date & Shift *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={logForm.logDate}
                      onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                      required
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none"
                    />
                    <select
                      value={logForm.shift}
                      onChange={(e) => setLogForm({ ...logForm, shift: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                      <option value="DOUBLE">Double Shift</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Meter Hours */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Engine Hour Meter (Hours)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Start Meter</label>
                    <input
                      type="number"
                      step="0.1"
                      value={logForm.startMeter}
                      onChange={(e) => setLogForm({ ...logForm, startMeter: Number(e.target.value) })}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">End Meter</label>
                    <input
                      type="number"
                      step="0.1"
                      value={logForm.endMeter}
                      onChange={(e) => setLogForm({ ...logForm, endMeter: Number(e.target.value) })}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Net Run Hours</label>
                    <div className="bg-blue-100 text-blue-900 font-extrabold text-sm p-2.5 rounded-lg text-center">
                      {(Math.max(0, logForm.endMeter - logForm.startMeter)).toFixed(1)} hrs
                    </div>
                  </div>
                </div>
              </div>

              {/* Fuel Issuance */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-emerald-600" /> Diesel Fuel Issuance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Diesel Issued (Liters)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={logForm.fuelIssuedLiters}
                      onChange={(e) => setLogForm({ ...logForm, fuelIssuedLiters: Number(e.target.value) })}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Fuel Rate (₹/L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={logForm.fuelRatePerLiter}
                      onChange={(e) => setLogForm({ ...logForm, fuelRatePerLiter: Number(e.target.value) })}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Total Fuel Cost</label>
                    <div className="bg-emerald-100 text-emerald-900 font-extrabold text-sm p-2.5 rounded-lg text-center">
                      {formatINR(logForm.fuelIssuedLiters * logForm.fuelRatePerLiter)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Fuel Source</label>
                    <select
                      value={logForm.fuelSource}
                      onChange={(e) => setLogForm({ ...logForm, fuelSource: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                    >
                      <option value="SITE_TANK">Site Diesel Bowser / Tank</option>
                      <option value="LOCAL_PUMP">Local Petrol Pump (Cash/Credit)</option>
                      <option value="BARREL_DRUM">Site Storage Barrels</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Fuel Slip / Receipt No</label>
                    <input
                      type="text"
                      placeholder="e.g. DSL-2026-401"
                      value={logForm.fuelSlipNumber}
                      onChange={(e) => setLogForm({ ...logForm, fuelSlipNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Work & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Done / Operation Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Basement raft excavation & trimming"
                    value={logForm.workDescription}
                    onChange={(e) => setLogForm({ ...logForm, workDescription: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Location / Grid</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower A Raft North"
                    value={logForm.location}
                    onChange={(e) => setLogForm({ ...logForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Operator & Supervisor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator Name</label>
                  <input
                    type="text"
                    value={logForm.operatorName}
                    onChange={(e) => setLogForm({ ...logForm, operatorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator Day Allowance (₹)</label>
                  <input
                    type="number"
                    value={logForm.operatorCost}
                    onChange={(e) => setLogForm({ ...logForm, operatorCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Supervisor In-Charge</label>
                  <input
                    type="text"
                    value={logForm.supervisorName}
                    onChange={(e) => setLogForm({ ...logForm, supervisorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Shift Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW MACHINE */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Fleet Master Register
                </span>
                <h3 className="text-lg font-bold">Register Plant & Machinery Asset</h3>
              </div>
              <button onClick={() => setIsEquipmentModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Equipment Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Hitachi EX200 Excavator"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. EQ-EXC-02"
                    value={equipmentForm.equipmentCode}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentCode: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={equipmentForm.category}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="EXCAVATION">Excavation</option>
                    <option value="EARTHMOVING">Earthmoving</option>
                    <option value="CONCRETING">Concreting</option>
                    <option value="LIFTING">Lifting / Cranes</option>
                    <option value="POWER_GENERATION">Power Generation</option>
                    <option value="COMPACTION">Compaction</option>
                    <option value="PUMPING">Pumping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ownership</label>
                  <select
                    value={equipmentForm.ownership}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, ownership: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="RENTED">Hired / Rented</option>
                    <option value="OWNED">Company Owned</option>
                    <option value="SUBCONTRACT">Subcontractor Machine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration / Plate #</label>
                  <input
                    type="text"
                    placeholder="MH-12-AB-1234"
                    value={equipmentForm.registrationNo}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, registrationNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Rental Agency</label>
                  <input
                    type="text"
                    placeholder="e.g. National Earth Works Pvt Ltd"
                    value={equipmentForm.supplierOrOwner}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, supplierOrOwner: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rental Tariff (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={equipmentForm.rentalRate}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, rentalRate: Number(e.target.value) })}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <select
                      value={equipmentForm.rateType}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, rateType: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    >
                      <option value="HOURLY">Per Hour</option>
                      <option value="DAILY">Per Day</option>
                      <option value="MONTHLY">Per Month</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tank Capacity (L)</label>
                  <input
                    type="number"
                    value={equipmentForm.fuelTankCapacity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, fuelTankCapacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Std Burn Rate (L/hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={equipmentForm.standardConsumptionPerHour}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, standardConsumptionPerHour: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Meter (hrs)</label>
                  <input
                    type="number"
                    value={equipmentForm.initialMeterReading}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, initialMeterReading: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Operator</label>
                  <input
                    type="text"
                    placeholder="e.g. Gurdeep Singh"
                    value={equipmentForm.operatorName}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, operatorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. 9822998811"
                    value={equipmentForm.operatorPhone}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, operatorPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Machine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
