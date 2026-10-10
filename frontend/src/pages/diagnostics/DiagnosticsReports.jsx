import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, FileText, CheckCircle, Download, FileCheck, 
  Award, Printer, X, Eye, ShieldCheck, Clock, User, Calendar, 
  AlertTriangle, MessageSquare, Send, PhoneCall, ShieldAlert, 
  RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, Zap, Bell 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import DiagnosticsReportModal from '../../components/diagnostics/DiagnosticsReportModal';
import CriticalCallLogModal from '../../components/diagnostics/CriticalCallLogModal';
import ReportDispatchModal from '../../components/diagnostics/ReportDispatchModal';

const DiagnosticsReports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'critical_alerts', 'dispatches'
  
  const [orders, setOrders] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, PARTIAL

  // Modal States
  const [activeReportOrderId, setActiveReportOrderId] = useState(null);
  const [selectedAlertForCall, setSelectedAlertForCall] = useState(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersRes, alertsRes, dispatchesRes, summaryRes, meRes] = await Promise.all([
        api.get('/diagnostics/orders'),
        api.get('/diagnostics/alerts'),
        api.get('/diagnostics/dispatches'),
        api.get('/diagnostics/alerts/summary'),
        api.get('/auth/me')
      ]);

      const reportableOrders = (ordersRes.data?.data?.orders || []).filter(
        o => ['Partial Results', 'Completed'].includes(o.orderStatus)
      );
      setOrders(reportableOrders);
      setCriticalAlerts(alertsRes.data?.data?.alerts || []);
      setDispatches(dispatchesRes.data?.data?.dispatches || []);
      setSummaryStats(summaryRes.data?.data);

      if (meRes.data?.data?.user?.organizationId) {
        setOrganization(meRes.data.data.user.organizationId);
      }
    } catch (error) {
      toast.error('Failed to load laboratory reports and dispatch logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleOpenDispatch = (order) => {
    setSelectedOrderForDispatch(order);
  };

  const handleOpenCriticalCall = (alert) => {
    setSelectedAlertForCall(alert);
  };

  const handleDispatchSuccess = (newDispatch) => {
    fetchAllData();
  };

  const handleCallLoggedSuccess = (updatedAlert) => {
    fetchAllData();
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      o.orderId?.toLowerCase().includes(q) || 
      o.patient?.firstName?.toLowerCase().includes(q) ||
      o.patient?.lastName?.toLowerCase().includes(q) ||
      o.patient?.phone?.includes(searchTerm);

    if (statusFilter === 'COMPLETED') return matchesSearch && o.orderStatus === 'Completed';
    if (statusFilter === 'PARTIAL') return matchesSearch && o.orderStatus === 'Partial Results';
    return matchesSearch;
  });

  // Filtered Alerts
  const filteredAlerts = criticalAlerts.filter(a => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.alertNumber?.toLowerCase().includes(q) ||
      a.parameterName?.toLowerCase().includes(q) ||
      a.patient?.firstName?.toLowerCase().includes(q) ||
      a.patient?.lastName?.toLowerCase().includes(q) ||
      a.order?.orderId?.toLowerCase().includes(q)
    );
  });

  // Filtered Dispatches
  const filteredDispatches = dispatches.filter(d => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.dispatchId?.toLowerCase().includes(q) ||
      d.recipientName?.toLowerCase().includes(q) ||
      d.recipientPhone?.includes(q) ||
      d.order?.orderId?.toLowerCase().includes(q)
    );
  });

  const pendingPanicCount = summaryStats?.pendingCriticalCount || 0;
  const communicatedCount = summaryStats?.communicatedTodayCount || 0;
  const dispatchesToday = summaryStats?.totalDispatchesToday || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* CRITICAL PANIC ALERT EMERGENCY BANNER (If any un-communicated panic values exist) */}
      {pendingPanicCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-lg border-2 border-red-300 flex flex-col sm:flex-row justify-between items-center gap-3 animate-pulse">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wider bg-white text-red-700 px-2 py-0.5 rounded">
                  EMERGENCY PANIC ALERT
                </span>
                <span className="text-xs font-bold text-red-100">Statutory NABL Requirement</span>
              </div>
              <p className="text-sm font-bold mt-1">
                {pendingPanicCount} Critical Panic Value(s) Pending Telephonic Doctor Communication!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const pendingAlert = criticalAlerts.find(a => a.communicationStatus === 'PENDING_COMMUNICATION');
              if (pendingAlert) {
                handleOpenCriticalCall(pendingAlert);
              } else {
                setActiveTab('critical_alerts');
              }
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-red-700 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>Log Doctor Call Now</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Verified Reports & Patient Dispatch Station
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                NABL PDF Authentication • WhatsApp & SMS Dispatch Engine • Critical Panic Value Communication Register
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOP SUMMARY KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verified Reports Ready */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Reports</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {orders.length}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Pathologist Authenticated
          </p>
        </div>

        {/* WhatsApp & SMS Dispatches Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatched Today</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {dispatchesToday}
          </h3>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
            Patient WhatsApp & SMS Notifications
          </p>
        </div>

        {/* Critical Panic Alerts */}
        <div className={`rounded-2xl p-4 border shadow-2xs ${
          pendingPanicCount > 0 
            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Panic Value Calls
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-700 mt-2 font-mono">
            {pendingPanicCount} Pending
          </h3>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            {communicatedCount} Communicated Today
          </p>
        </div>

        {/* Completed Rate */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch Audit Total</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-700 mt-2 font-mono">
            {summaryStats?.totalDispatchesAll || dispatches.length}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Lifetime Patient Communications
          </p>
        </div>
      </div>

      {/* TABS & TOOLBAR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Tab Headers */}
        <div className="px-5 pt-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Verified Reports & Patient Dispatch</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('critical_alerts')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'critical_alerts'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Critical Panic Values Register (NABL Audit)</span>
              {pendingPanicCount > 0 ? (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-black font-mono animate-pulse">
                  {pendingPanicCount} PENDING
                </span>
              ) : (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                  {criticalAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dispatches')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'dispatches'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp & SMS Dispatch Logs</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {dispatches.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'reports' ? 'Search Order ID, Patient, Phone...' :
                activeTab === 'critical_alerts' ? 'Search Panic Alert #, Parameter, Patient...' :
                'Search Dispatch ID, Phone, Recipient...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {activeTab === 'reports' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Report Statuses</option>
                <option value="COMPLETED">Fully Completed</option>
                <option value="PARTIAL">Partial Results</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: VERIFIED REPORTS & PATIENT DISPATCH */}
        {activeTab === 'reports' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No verified reports matching criteria</p>
                <p className="text-xs text-slate-400">Reports appear here once test results are entered and verified.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Order ID & Date</th>
                    <th className="py-3.5 px-4">Patient Profile</th>
                    <th className="py-3.5 px-4">Investigations Included</th>
                    <th className="py-3.5 px-4">Doctor</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions & Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const patient = order.patient || {};
                    const testNames = (order.tests || []).map(t => t.test?.name || 'Test').join(', ');
                    const hasDispatched = dispatches.some(d => d.order?._id === order._id || d.order === order._id);
                    const hasCritical = criticalAlerts.some(a => (a.order?._id === order._id || a.order === order._id) && a.communicationStatus === 'PENDING_COMMUNICATION');

                    return (
                      <tr key={order._id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 font-mono block">{order.orderId}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {patient.patientId} • {patient.phone || 'No phone'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-700" title={testNames}>
                          {testNames}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 truncate max-w-[140px]">
                          {order.referringDoctor?.name || 'Self / Walk-In'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.orderStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Critical Panic Badge Trigger */}
                            {hasCritical && (
                              <button
                                onClick={() => {
                                  const alertItem = criticalAlerts.find(a => (a.order?._id === order._id || a.order === order._id) && a.communicationStatus === 'PENDING_COMMUNICATION');
                                  if (alertItem) handleOpenCriticalCall(alertItem);
                                }}
                                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs animate-pulse cursor-pointer"
                                title="Pending Critical Value Call"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Panic Call</span>
                              </button>
                            )}

                            {/* WhatsApp Dispatch Button */}
                            <button
                              onClick={() => handleOpenDispatch(order)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                hasDispatched 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                              title="Dispatch Report via WhatsApp or SMS"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{hasDispatched ? 'Sent ✓' : 'WhatsApp'}</span>
                            </button>

                            {/* View / Download PDF Report */}
                            <button
                              onClick={() => setActiveReportOrderId(order._id)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="View & Download Official NABL Report PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Report PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: CRITICAL PANIC VALUES REGISTER (NABL AUDIT LOG) */}
        {activeTab === 'critical_alerts' && (
          <div className="overflow-x-auto">
            {filteredAlerts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No Critical Panic Values Recorded</p>
                <p className="text-xs text-slate-400">All patient observed test values are within non-critical physiological limits.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Alert # & Time</th>
                    <th className="py-3.5 px-4">Patient & Order</th>
                    <th className="py-3.5 px-4">Critical Parameter</th>
                    <th className="py-3.5 px-4">Observed Value</th>
                    <th className="py-3.5 px-4">NABL Panic Threshold</th>
                    <th className="py-3.5 px-4 text-center">Communication Status</th>
                    <th className="py-3.5 px-4">Notified Details</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlerts.map((alert) => {
                    const isPending = alert.communicationStatus === 'PENDING_COMMUNICATION';
                    const patient = alert.patient || {};
                    return (
                      <tr 
                        key={alert._id} 
                        className={`transition-colors ${
                          isPending ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 font-mono block">{alert.alertNumber}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(alert.createdAt).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {alert.order?.orderId} • {patient.phone}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {alert.parameterName}
                          <span className="text-[10px] text-slate-500 block font-normal">{alert.test?.name}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-sm font-black font-mono text-rose-700 bg-rose-100 border border-rose-300 inline-block">
                            {alert.observedValue} {alert.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-[200px]">
                          {alert.criticalThreshold}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPending 
                              ? 'bg-rose-600 text-white animate-pulse' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {isPending ? 'CALL PENDING' : 'COMMUNICATED ✓'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[11px]">
                          {alert.communicationStatus === 'COMMUNICATED' ? (
                            <div>
                              <div className="font-bold text-slate-900">{alert.communicatedTo} ({alert.communicatedToRole})</div>
                              <span className="text-[10px] text-slate-500">
                                By {alert.communicatedByName} • Read-back {alert.readBackConfirmed ? '✓' : '✗'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-medium">Doctor call not logged yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleOpenCriticalCall(alert)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              isPending
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{isPending ? 'Log Call Now' : 'Edit Log'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: WHATSAPP & SMS DISPATCH DELIVERY LOGS */}
        {activeTab === 'dispatches' && (
          <div className="overflow-x-auto">
            {filteredDispatches.length === 0 ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No report dispatches recorded yet</p>
                <p className="text-xs text-slate-400">Use the WhatsApp button on any verified report to dispatch directly.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Dispatch ID & Date</th>
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Recipient Name & Mobile</th>
                    <th className="py-3.5 px-4 text-center">Channel</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Dispatched By</th>
                    <th className="py-3.5 px-5">Message Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDispatches.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 font-mono block">{d.dispatchId}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(d.dispatchedAt || d.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-medium">
                          {d.order?.orderId || 'ORD-0000'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{d.recipientName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{d.recipientPhone}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.channel === 'WHATSAPP' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          <MessageSquare className="w-3 h-3" />
                          <span>{d.channel}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {d.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {d.dispatchedByName || 'Automated'}
                      </td>

                      <td className="py-3.5 px-5 max-w-[260px] truncate text-slate-500 text-[11px]" title={d.messageContent}>
                        {d.messageContent?.slice(0, 70)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* COMPREHENSIVE NABL REPORT MODAL */}
      {activeReportOrderId && (
        <DiagnosticsReportModal
          orderId={activeReportOrderId}
          onClose={() => setActiveReportOrderId(null)}
          onVerified={() => fetchAllData()}
        />
      )}

      {/* CRITICAL CALL LOG MODAL */}
      <CriticalCallLogModal
        isOpen={!!selectedAlertForCall}
        onClose={() => setSelectedAlertForCall(null)}
        alert={selectedAlertForCall}
        onSuccess={handleCallLoggedSuccess}
      />

      {/* REPORT DISPATCH MODAL */}
      <ReportDispatchModal
        isOpen={!!selectedOrderForDispatch}
        onClose={() => setSelectedOrderForDispatch(null)}
        order={selectedOrderForDispatch}
        organization={organization}
        onSuccess={handleDispatchSuccess}
      />

    </div>
  );
};

export default DiagnosticsReports;
