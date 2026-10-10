import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, IndianRupee, CheckCircle2, AlertCircle, 
  Receipt, FileText, Printer, Download, Plus, Lock, 
  Clock, ArrowUpRight, QrCode, CreditCard, Banknote, 
  Calendar, RefreshCw, ChevronRight, UserCheck, ShieldCheck 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PaymentReceiptModal from '../../components/diagnostics/PaymentReceiptModal';
import CollectPaymentModal from '../../components/diagnostics/CollectPaymentModal';
import ShiftReconciliationModal from '../../components/diagnostics/ShiftReconciliationModal';

const DiagnosticsPayments = () => {
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts', 'dues', 'shifts'
  const [payments, setPayments] = useState([]);
  const [ordersWithDues, setOrdersWithDues] = useState([]);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [organization, setOrganization] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' or 'all'

  // Modal States
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [receiptFormat, setReceiptFormat] = useState('80mm');

  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [orderToCollect, setOrderToCollect] = useState(null);

  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [dateFilter, selectedMethod]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes, ordersRes, shiftsRes, meRes] = await Promise.all([
        api.get(`/diagnostics/payments?dateFilter=${dateFilter}&paymentMethod=${selectedMethod}`),
        api.get('/diagnostics/payments/shift-summary'),
        api.get('/diagnostics/orders'),
        api.get('/diagnostics/payments/shifts'),
        api.get('/auth/me')
      ]);

      setPayments(paymentsRes.data.data.payments || []);
      setShiftSummary(summaryRes.data.data);
      
      const allOrders = ordersRes.data.data.orders || [];
      setOrdersWithDues(allOrders.filter(o => o.dueAmount > 0));
      
      setShiftHistory(shiftsRes.data.data.shifts || []);
      if (meRes.data.data?.user?.organizationId) {
        setOrganization(meRes.data.data.user.organizationId);
      }
    } catch (error) {
      toast.error('Failed to load cashier billing records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleOpenReceipt = (receipt, order, format = '80mm') => {
    setSelectedReceipt(receipt);
    setSelectedOrderForReceipt(order || receipt?.order);
    setReceiptFormat(format);
    setReceiptModalOpen(true);
  };

  const handleOpenCollect = (order) => {
    setOrderToCollect(order);
    setCollectModalOpen(true);
  };

  const handlePaymentSuccess = (newReceipt, updatedOrder) => {
    // Refresh ledger data
    fetchAllData();
    // Auto launch receipt modal for immediate print
    handleOpenReceipt(newReceipt, updatedOrder, '80mm');
  };

  const handleShiftClosed = (closedShift) => {
    fetchAllData();
  };

  // Filter payments by search term
  const filteredPayments = payments.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const receiptMatch = p.receiptNumber?.toLowerCase().includes(q);
    const orderMatch = p.order?.orderId?.toLowerCase().includes(q);
    const patientName = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();
    const patientMatch = patientName.includes(q) || p.patient?.phone?.includes(q) || p.patient?.patientId?.toLowerCase().includes(q);
    const refMatch = p.transactionReference?.toLowerCase().includes(q);
    return receiptMatch || orderMatch || patientMatch || refMatch;
  });

  // Filter dues by search term
  const filteredDues = ordersWithDues.filter(o => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const orderMatch = o.orderId?.toLowerCase().includes(q);
    const patientName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    return orderMatch || patientName.includes(q) || o.patient?.phone?.includes(q);
  });

  const summary = shiftSummary?.summary || {
    systemCash: 0,
    systemUPI: 0,
    systemCard: 0,
    systemTotal: 0,
    totalTransactions: 0,
    totalOutstandingDues: 0
  };
  const activeShift = shiftSummary?.activeShift;
  const openingFloat = activeShift?.openingCashFloat || 0;
  const cashInRegister = openingFloat + summary.systemCash;

  const getMethodBadge = (method) => {
    switch (method) {
      case 'Cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPI':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Card':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Bank Transfer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Title & Top Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cash Desk, POS Billing & Shift Close
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enterprise Diagnostic Cashier Desk • Dual 80mm POS & A4 Tax Invoicing • Cash Drawer Reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Refresh Registers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Quick Collect Action */}
          <button
            onClick={() => {
              if (ordersWithDues.length > 0) {
                handleOpenCollect(ordersWithDues[0]);
              } else {
                toast('No outstanding dues found across orders!', { icon: 'ℹ️' });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Collect Payment / Settle Due</span>
          </button>

          {/* Shift Close / Drawer Reconciliation */}
          <button
            onClick={() => setShiftModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Shift Close & Drawer Reconciliation</span>
          </button>
        </div>
      </div>

      {/* TOP CASHIER REGISTER FINANCIAL KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Total Collections */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Collections</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{summary.systemTotal.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 font-bold">{summary.totalTransactions} Receipts</span> Issued Today
          </p>
        </div>

        {/* Cash in Drawer / Register */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash In Register</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{cashInRegister.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Float: ₹{openingFloat} + Receipts: ₹{summary.systemCash}
          </p>
        </div>

        {/* UPI / QR Collections */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">UPI / QR Collections</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-700 mt-2 font-mono">
            ₹{summary.systemUPI.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-purple-600 mt-1 font-medium">Instant Bank Settlement</p>
        </div>

        {/* Card / POS Swipes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Card / EDC Swipes</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-700 mt-2 font-mono">
            ₹{summary.systemCard.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">POS Terminal Swipes</p>
        </div>

        {/* Outstanding Patient Dues */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Dues</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-2 font-mono">
            ₹{summary.totalOutstandingDues.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-rose-500 mt-1 font-medium">
            {ordersWithDues.length} Pending Patient Balances
          </p>
        </div>
      </div>

      {/* TABS & FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('receipts')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'receipts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Payment Receipts Log</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {payments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dues')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'dues'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Pending Patient Dues</span>
              {ordersWithDues.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold font-mono">
                  {ordersWithDues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className={`pb-3 px-2 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'shifts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Cashier Shift History & Audits</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {shiftHistory.length}
              </span>
            </button>
          </div>

          {/* Quick Date Switcher for Receipts */}
          {activeTab === 'receipts' && (
            <div className="flex items-center gap-2 pb-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    dateFilter === 'today' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Today's Receipts
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    dateFilter === 'all' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  All History
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Mode Filters Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'receipts' ? 'Search Receipt #, Order, Patient, UTR...' :
                activeTab === 'dues' ? 'Search Patient, Order ID...' :
                'Search Shift records...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {activeTab === 'receipts' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Payment Modes</option>
                <option value="Cash">Cash Only</option>
                <option value="UPI">UPI / QR</option>
                <option value="Card">Card / POS</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: PAYMENT RECEIPTS LOG */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">No payment transactions recorded for this criteria</p>
                <p className="text-xs text-slate-400">Click "+ Collect Payment" above to record a new receipt.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Receipt # & Time</th>
                    <th className="px-4 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Order Ref</th>
                    <th className="px-4 py-3.5">Payment Mode</th>
                    <th className="px-4 py-3.5">Txn / UTR Ref</th>
                    <th className="px-4 py-3.5 text-right">Amount Paid</th>
                    <th className="px-4 py-3.5 text-right">Balance Due</th>
                    <th className="px-4 py-3.5">Cashier</th>
                    <th className="px-5 py-3.5 text-center">Print Receipts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const patient = p.patient || {};
                    const order = p.order || {};
                    const formattedDate = new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short'
                    });
                    const formattedTime = new Date(p.paymentDate || p.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true
                    });

                    return (
                      <tr key={p._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 font-mono block">
                            {p.receiptNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formattedDate} • {formattedTime}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {patient.patientId || patient.phone}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono font-medium">
                            {order.orderId || 'ORD-LAB'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMethodBadge(p.paymentMethod)}`}>
                            {p.paymentMethod}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                          {p.transactionReference || 'COUNTER-CASH'}
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-emerald-600 font-mono text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold font-mono">
                          {p.balanceAfterThis > 0 ? (
                            <span className="text-rose-600">₹{p.balanceAfterThis}</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                          {p.cashierName || 'Cash Desk'}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 80mm Slip Button */}
                            <button
                              onClick={() => handleOpenReceipt(p, order, '80mm')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Print 80mm POS Thermal Slip"
                            >
                              <Receipt className="w-3 h-3 text-slate-600" />
                              <span>80mm</span>
                            </button>

                            {/* A4 Tax Invoice Button */}
                            <button
                              onClick={() => handleOpenReceipt(p, order, 'A4')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Print Full A4 Tax Invoice"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>A4 Bill</span>
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

        {/* TAB 2: PENDING PATIENT DUES & CLEARANCE */}
        {activeTab === 'dues' && (
          <div className="overflow-x-auto">
            {filteredDues.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">All Patient Bills Fully Cleared!</p>
                <p className="text-xs text-slate-400">There are no outstanding dues remaining across active patient orders.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Order ID & Date</th>
                    <th className="px-4 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Tests Prescribed</th>
                    <th className="px-4 py-3.5 text-right">Total Bill</th>
                    <th className="px-4 py-3.5 text-right">Paid So Far</th>
                    <th className="px-4 py-3.5 text-right">Outstanding Due</th>
                    <th className="px-5 py-3.5 text-right">Settle Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDues.map((order) => {
                    const patient = order.patient || {};
                    const testNames = order.tests?.map(t => t.test?.name || 'Test').join(', ') || 'Diagnostic Tests';
                    return (
                      <tr key={order._id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 font-mono block">{order.orderId}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{patient.phone || patient.patientId}</span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 max-w-[220px] truncate" title={testNames}>
                          {testNames}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-slate-800 font-mono">
                          ₹{order.totalAmount}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 font-mono">
                          ₹{order.paidAmount}
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-rose-600 font-mono text-sm">
                          ₹{order.dueAmount}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenCollect(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>Settle Due Now</span>
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

        {/* TAB 3: CASHIER SHIFT HISTORY & DRAWER AUDITS */}
        {activeTab === 'shifts' && (
          <div className="overflow-x-auto">
            {shiftHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Lock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">No past shift close records yet</p>
                <p className="text-xs text-slate-400">Use "Shift Close & Drawer Reconciliation" above to archive shifts.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Shift # & Date</th>
                    <th className="px-4 py-3.5">Cashier</th>
                    <th className="px-4 py-3.5 text-right">Opening Float</th>
                    <th className="px-4 py-3.5 text-right">System Cash</th>
                    <th className="px-4 py-3.5 text-right">System UPI</th>
                    <th className="px-4 py-3.5 text-right">Physical Cash</th>
                    <th className="px-4 py-3.5 text-center">Variance / Diff</th>
                    <th className="px-4 py-3.5">Handover To</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiftHistory.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 font-mono block">{s.shiftNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(s.startTime).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {s.cashierName || 'Cashier'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                        ₹{s.openingCashFloat}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-emerald-600 font-semibold">
                        ₹{s.systemCash}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-purple-600 font-semibold">
                        ₹{s.systemUPI}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{s.physicalCashCounted}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          s.variance === 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : s.variance > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.variance >= 0 ? `+₹${s.variance}` : `-₹${Math.abs(s.variance)}`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {s.handoverTo || 'Next Shift Cashier'}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'Closed' 
                            ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* DUAL RECEIPT MODAL (80mm POS Slip + A4 Tax Invoice) */}
      <PaymentReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={selectedReceipt}
        order={selectedOrderForReceipt}
        organization={organization}
        initialFormat={receiptFormat}
      />

      {/* COLLECT PAYMENT / SETTLE DUE MODAL */}
      <CollectPaymentModal
        isOpen={collectModalOpen}
        onClose={() => setCollectModalOpen(false)}
        order={orderToCollect}
        onSuccess={handlePaymentSuccess}
      />

      {/* SHIFT CLOSE & RECONCILIATION MODAL */}
      <ShiftReconciliationModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        onShiftClosed={handleShiftClosed}
        organization={organization}
      />

    </div>
  );
};

export default DiagnosticsPayments;
