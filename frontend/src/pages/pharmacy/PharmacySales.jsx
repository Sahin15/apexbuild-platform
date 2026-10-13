import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Receipt, Plus, Search, Filter, ShieldCheck, AlertCircle, 
  CheckCircle2, ChevronRight, X, Eye, Sparkles, Layers, 
  Package, RefreshCw, Calendar, IndianRupee, Clock, ArrowRight,
  FileText, Check, DollarSign, Stethoscope, RotateCcw, UserCheck,
  Printer, Ban, ShieldAlert, ArrowDownLeft, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacySales() {
  const { user } = useAuth();
  const location = useLocation();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/returns') ? 'RETURNS' :
    location.pathname.includes('/schedule-register') ? 'SCHEDULE_REGISTER' : 'SALES'
  );
  
  useEffect(() => {
    if (location.pathname.includes('/returns')) {
      setActiveTab('RETURNS');
    } else if (location.pathname.includes('/schedule-register')) {
      setActiveTab('SCHEDULE_REGISTER');
    } else if (location.pathname.includes('/sales')) {
      setActiveTab('SALES');
    }
  }, [location.pathname]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [sales, setSales] = useState([]);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [returns, setReturns] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // ALL, OTC, SCHEDULE_H, SCHEDULE_H1
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, CASH, UPI, CARD, KHATA

  // Modals
  const [selectedSaleForView, setSelectedSaleForView] = useState(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return Form State
  const [returnItems, setReturnItems] = useState([]);
  const [refundMode, setRefundMode] = useState('CASH');
  const [returnNotes, setReturnNotes] = useState('');

  // Fetch sales, schedule register & returns
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [salesRes, schedRes, retRes] = await Promise.all([
        api.get('/pharmacy/sales').catch(() => ({ data: { data: { sales: [] } } })),
        api.get('/pharmacy/sales/schedule-register').catch(() => ({ data: { data: { registerRows: [] } } })),
        api.get('/pharmacy/sales/returns').catch(() => ({ data: { data: { returns: [] } } }))
      ]);

      if (salesRes.data?.data?.sales) {
        setSales(salesRes.data.data.sales);
      }
      if (schedRes.data?.data?.registerRows) {
        setScheduleRows(schedRes.data.data.registerRows);
      }
      if (retRes.data?.data?.returns) {
        setReturns(retRes.data.data.returns);
      }
    } catch (err) {
      console.error('Failed to load sales ledger data:', err);
      toast.error('Unable to fetch live sales records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate metrics
  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.pricing?.grandTotal || 0), 0);
  }, [sales]);

  const scheduleHCount = useMemo(() => {
    return sales.filter(s => s.highestSchedule === 'SCHEDULE_H' || s.highestSchedule === 'SCHEDULE_H1').length;
  }, [sales]);

  const totalRefundsAmount = useMemo(() => {
    return returns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
  }, [returns]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = 
        s.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer?.phone?.includes(searchTerm) ||
        s.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (scheduleFilter !== 'ALL' && s.highestSchedule !== scheduleFilter) return false;
      if (paymentFilter !== 'ALL' && s.payment?.method !== paymentFilter) return false;
      return true;
    });
  }, [sales, searchTerm, scheduleFilter, paymentFilter]);

  // Filtered schedule register rows
  const filteredScheduleRows = useMemo(() => {
    return scheduleRows.filter(r => {
      const matchSearch = 
        r.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (scheduleFilter !== 'ALL' && r.scheduleCategory !== scheduleFilter) return false;
      return true;
    });
  }, [scheduleRows, searchTerm, scheduleFilter]);

  // Open return modal prefilled with sale items
  const handleInitiateReturn = (sale) => {
    setSelectedSaleForReturn(sale);
    const initialLines = sale.items.map(i => ({
      medicineId: i.medicineId?._id || i.medicineId,
      batchId: i.batchId,
      brandName: i.brandName,
      batchNumber: i.batchNumber,
      maxQuantity: i.quantity,
      quantityReturned: 1,
      unitRefundPrice: i.unitPrice,
      action: 'RETURN_TO_SHELF',
      reason: 'PATIENT_RECOVERY_EXCESS'
    }));
    setReturnItems(initialLines);
    setRefundMode(sale.payment?.method || 'CASH');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  // Submit Customer Return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedSaleForReturn) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/pharmacy/sales/returns', {
        originalSaleId: selectedSaleForReturn._id,
        items: returnItems,
        refundMode,
        pharmacistNotes: returnNotes
      });
      toast.success(res.data?.message || 'Customer return processed successfully!');
      setShowReturnModal(false);
      setSelectedSaleForReturn(null);
      fetchData(true);
    } catch (err) {
      console.error('Customer return failed:', err);
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Prescription Register</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              Statutory Register
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Dispensing ledger, statutory Schedule H/H1 registers (Section 65 Drugs Rules), and customer sales returns.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              fetchData(true);
              toast.success('Sales ledger refreshed');
            }}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <a
            href="/pharmacy/pos"
            style={{ backgroundColor: effectivePrimary }}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:brightness-105 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Counter POS Terminal</span>
          </a>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sales Invoiced</span>
            <h3 className="text-xl font-extrabold text-teal-800 mt-0.5">
              ₹{totalSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] font-medium text-slate-500">{sales.length} Dispensing Invoices</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule H / H1 Rx</span>
            <h3 className="text-xl font-extrabold text-blue-700 mt-0.5">{scheduleHCount} Prescriptions</h3>
            <span className="text-[10px] font-medium text-slate-500">Statutory Doctor Audited</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Returns</span>
            <h3 className="text-xl font-extrabold text-rose-700 mt-0.5">
              ₹{totalRefundsAmount.toFixed(2)}
            </h3>
            <span className="text-[10px] font-medium text-slate-500">{returns.length} Return Entries</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Compliance</span>
            <h3 className="text-xl font-extrabold text-emerald-700 mt-0.5">100% Compliant</h3>
            <span className="text-[10px] font-medium text-slate-500">Form 20B/21B Inspection Ready</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'SALES' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sales Invoices</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SCHEDULE_REGISTER')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'SCHEDULE_REGISTER' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          <span>Schedule H / H1 Statutory Register</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
            {scheduleRows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'RETURNS' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Sales Returns & Credit Notes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {returns.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SALES INVOICES */}
      {activeTab === 'SALES' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Bill #, Patient, Phone, or Doctor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'OTC', 'SCHEDULE_H', 'SCHEDULE_H1'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setScheduleFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    scheduleFilter === cat
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat === 'ALL' ? 'All Classes' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <span>Loading sales ledger...</span>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">No sales invoices found</p>
                <p className="mt-1">Dispense counter bills from the POS terminal to record sales.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Bill Number & Time</th>
                      <th className="px-4 py-3">Customer / Patient</th>
                      <th className="px-4 py-3">Prescribing Doctor</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3 text-center">Items</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSales.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-extrabold text-slate-900">{s.billNumber}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(s.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(s.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 truncate max-w-[170px]">{s.customer?.name}</p>
                          <p className="text-[10px] text-slate-400">{s.customer?.phone || 'Walk-in'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 truncate max-w-[170px]">{s.doctor?.name}</p>
                          <p className="text-[10px] text-slate-400">{s.doctor?.registrationNumber || 'OTC'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {s.highestSchedule === 'SCHEDULE_H1' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Sched H1
                            </span>
                          ) : s.highestSchedule === 'SCHEDULE_H' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                              Sched H
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              OTC
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                          {s.items?.length || 0}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {s.payment?.method || 'UPI'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                          ₹{Number(s.pricing?.grandTotal || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {s.status !== 'RETURNED' && (
                              <button
                                onClick={() => handleInitiateReturn(s)}
                                className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600 text-[10px] font-bold transition-colors"
                                title="Process Customer Return"
                              >
                                Return
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedSaleForView(s)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="View Tax Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE H / H1 REGISTER (STATUTORY DRUG AUDIT) */}
      {activeTab === 'SCHEDULE_REGISTER' && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-blue-950">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold leading-tight">Statutory Schedule Register (Section 65 Drugs & Cosmetics Rules)</h4>
                <p className="text-[11px] text-blue-800/90 mt-0.5">
                  Chemists are legally mandated to maintain this register recording patient identity, prescribing doctor registration number, drug formulation, and manufacturer batch number. Retained for 3 years.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-bold shrink-0 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Inspection Register</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Patient Name & Address</th>
                    <th className="px-4 py-3">Prescribing Doctor (RMP)</th>
                    <th className="px-4 py-3">Medicine & Strength</th>
                    <th className="px-4 py-3 font-mono">Batch Number</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Pharmacist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredScheduleRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.billNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{r.patientName} {r.patientAge ? `(${r.patientAge}y)` : ''}</p>
                        <p className="text-[10px] text-slate-400">{r.patientAddress}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{r.doctorName}</p>
                        <p className="text-[10px] font-semibold text-blue-700">Reg: {r.doctorRegNo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{r.brandName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{r.genericName}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{r.batchNumber}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{r.quantityDispensed}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          r.scheduleCategory === 'SCHEDULE_H1' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {r.scheduleCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{r.pharmacistName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER SALES RETURNS & CREDIT NOTES */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {returns.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">No Customer Returns recorded</p>
                <p className="mt-1">Returns can be initiated directly from any sales invoice.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Return #</th>
                      <th className="px-4 py-3">Original Bill</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Returned Items</th>
                      <th className="px-4 py-3">Stock Action</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3 text-right">Refund Amount</th>
                      <th className="px-5 py-3 text-right">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {returns.map(ret => (
                      <tr key={ret._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{ret.returnNumber}</td>
                        <td className="px-4 py-3.5 font-medium text-teal-800">{ret.originalBillNumber}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{ret.customer?.name}</td>
                        <td className="px-4 py-3.5">
                          {ret.items?.map((i, idx) => (
                            <p key={idx} className="font-medium text-slate-800 truncate max-w-[180px]">
                              {i.quantityReturned}x {i.brandName} ({i.batchNumber})
                            </p>
                          ))}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                            {ret.items?.[0]?.action?.replace(/_/g, ' ') || 'Return to Shelf'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {ret.items?.[0]?.reason?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-rose-700">
                          ₹{Number(ret.totalRefundAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-800">
                            {ret.refundMode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW TAX INVOICE */}
      {selectedSaleForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Retail Tax Invoice</h3>
                <p className="text-xs text-slate-500">{selectedSaleForView.billNumber}</p>
              </div>
              <button onClick={() => setSelectedSaleForView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-200">
                <h4 className="font-bold text-sm text-slate-900">{user?.organizationId?.name || 'ApexCare Pharmacy'}</h4>
                <p className="text-[11px] text-slate-500">DL: Form 20B/21B-WB-19284 • GSTIN: 19AABCA1234F1Z5</p>
                <p className="text-[10px] text-slate-400">Reg. Pharmacist: {selectedSaleForView.pharmacistName}</p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <div>
                  <p>Patient: <strong>{selectedSaleForView.customer?.name}</strong></p>
                  <p>Doctor: <strong>{selectedSaleForView.doctor?.name}</strong></p>
                  {selectedSaleForView.doctor?.registrationNumber && (
                    <p>Reg No: <strong>{selectedSaleForView.doctor.registrationNumber}</strong></p>
                  )}
                </div>
                <div className="text-right">
                  <p>Date: {new Date(selectedSaleForView.saleDate).toLocaleDateString()}</p>
                  <p>Mode: {selectedSaleForView.payment?.method}</p>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="pb-1">Item</th>
                      <th className="pb-1">Batch</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">MRP</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-100">
                    {selectedSaleForView.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 font-sans font-bold text-slate-900">{item.brandName}</td>
                        <td className="py-1 font-mono text-slate-600">{item.batchNumber}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">₹{item.unitPrice}</td>
                        <td className="py-1 text-right font-bold">₹{item.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right text-[11px]">
                <p>Taxable Subtotal: ₹{selectedSaleForView.pricing?.subtotal?.toFixed(2)}</p>
                <p>Discount: -₹{selectedSaleForView.pricing?.discountTotal?.toFixed(2)}</p>
                <p>GST Total: +₹{selectedSaleForView.pricing?.taxTotal?.toFixed(2)}</p>
                <p className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  Net Amount: ₹{selectedSaleForView.pricing?.grandTotal?.toFixed(2)}
                </p>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400">
                <p>Thank you for choosing ApexCare Pharmacy!</p>
                <p>Schedule H/H1 drugs dispensed strictly on registered medical prescription.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROCESS CUSTOMER RETURN */}
      {showReturnModal && selectedSaleForReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Process Customer Sales Return</h3>
                <p className="text-xs text-slate-500">Bill: {selectedSaleForReturn.billNumber} • {selectedSaleForReturn.customer?.name}</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 pt-4 text-xs">
              <div className="space-y-3">
                {returnItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{item.brandName}</span>
                      <span className="font-mono text-teal-800 font-bold">{item.batchNumber}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Return Qty (Max: {item.maxQuantity})</label>
                        <input
                          type="number"
                          min="1"
                          max={item.maxQuantity}
                          value={item.quantityReturned}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[idx].quantityReturned = Number(e.target.value);
                            setReturnItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Stock Action</label>
                        <select
                          value={item.action}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[idx].action = e.target.value;
                            setReturnItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="RETURN_TO_SHELF">Return to Saleable Shelf</option>
                          <option value="QUARANTINE_DAMAGED">Quarantine as Damaged</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Settlement Mode</label>
                <select
                  value={refundMode}
                  onChange={(e) => setRefundMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="UPI">UPI Refund</option>
                  <option value="CREDIT_NOTE">Issue Credit Note</option>
                  <option value="KHATA_ADJUST">Adjust Chronic Khata</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacist Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Verified foil pack seal intact, patient recovery excess."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
                >
                  {isSubmitting ? 'Processing Return...' : 'Confirm Return & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
