import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Receipt, Search, Filter, Printer, Download, 
  IndianRupee, CreditCard, QrCode, Banknote, Calendar, 
  ChevronRight, X, RefreshCw, AlertTriangle, CheckCircle2, 
  FileText, ArrowDownToLine, Eye, Ban, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantBilling() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    paidCount: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalServiceCharge: 0,
    cashTotal: 0,
    upiTotal: 0,
    cardTotal: 0,
    avgTicket: 0
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL'); // 'ALL' | 'CASH' | 'UPI' | 'CARD'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'VOID'
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'

  // Modal states
  const [selectedBill, setSelectedBill] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState('THERMAL'); // 'THERMAL' | 'A4_INVOICE'
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [billToVoid, setBillToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch bills from backend
  const loadBillsData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (methodFilter !== 'ALL') params.paymentMethod = methodFilter;

      if (dateFilter === 'TODAY') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.startDate = monthAgo.toISOString();
      }

      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/restaurant/bills', { params });
      if (res.data?.data) {
        setBills(res.data.data.bills || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load bills data:', err);
      toast.error('Unable to fetch billing ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, methodFilter, dateFilter, searchQuery]);

  useEffect(() => {
    loadBillsData();
  }, [loadBillsData]);

  // Filtered bills by client search if needed
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const q = searchQuery.toLowerCase();
      const matchNumber = (b.billNumber || '').toLowerCase().includes(q);
      const matchOrder = (b.orderId?.orderNumber || '').toLowerCase().includes(q);
      const matchTable = (b.orderId?.tableName || '').toLowerCase().includes(q);
      const matchCustomer = (b.orderId?.customerName || '').toLowerCase().includes(q) ||
                            (b.orderId?.customerPhone || '').toLowerCase().includes(q);
      return matchNumber || matchOrder || matchTable || matchCustomer;
    });
  }, [bills, searchQuery]);

  // View Receipt
  const handleViewReceipt = async (bill) => {
    try {
      const res = await api.get(`/restaurant/bills/${bill._id}`);
      setSelectedBill(res.data?.data?.bill || bill);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.error('Failed to load bill detail:', err);
      setSelectedBill(bill);
      setIsReceiptModalOpen(true);
    }
  };

  // Void Bill
  const handleConfirmVoid = async () => {
    if (!billToVoid) return;
    try {
      setSubmitting(true);
      await api.post(`/restaurant/bills/${billToVoid._id}/void`, {
        voidReason: voidReason.trim() || 'Manager Void'
      });

      toast.success(`Bill ${billToVoid.billNumber} voided successfully`);
      setIsVoidModalOpen(false);
      setBillToVoid(null);
      setVoidReason('');
      loadBillsData(true);
    } catch (err) {
      console.error('Failed to void bill:', err);
      toast.error(err.response?.data?.message || 'Error voiding bill');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (bills.length === 0) {
      toast.error('No bills to export');
      return;
    }

    const headers = ['Bill Number', 'Date', 'Order Number', 'Channel / Table', 'Payment Mode', 'Subtotal', 'CGST', 'SGST', 'Service Charge', 'Grand Total', 'Status'];
    const rows = bills.map(b => [
      b.billNumber,
      new Date(b.invoiceDate || b.createdAt).toLocaleDateString('en-IN'),
      b.orderId?.orderNumber || 'N/A',
      b.orderId?.tableName || b.orderId?.orderType || 'DINE_IN',
      b.paymentSplits?.[0]?.method || 'CASH',
      b.subTotal || 0,
      b.cgst || 0,
      b.sgst || 0,
      b.serviceCharge || 0,
      b.grandTotal || 0,
      b.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `restaurant_bills_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Billing report exported to CSV');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: effectivePrimary }}
            >
              Tax & Settlement
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              GST 5% Compliant (CGST 2.5% + SGST 2.5%)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Billing History & Tax Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Search settlements, print 80mm thermal receipts or full GST tax invoices, and track payment mode collections.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => loadBillsData(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{summary.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">
            {summary.paidCount} Paid Invoices
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Register</span>
            <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{summary.cashTotal.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Physical Drawer Cash</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UPI Digital</span>
            <div className="p-1 rounded-lg bg-orange-50 text-orange-600">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{summary.upiTotal.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-orange-600 font-medium">Instant QR Transfers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Swipes</span>
            <div className="p-1 rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{summary.cardTotal.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-purple-600 font-medium">POS Terminal Cards</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total GST</span>
            <div className="p-1 rounded-lg bg-orange-50 text-orange-600">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{(summary.totalCGST + summary.totalSGST).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-orange-600 font-bold">
            ₹{summary.totalCGST} CGST • ₹{summary.totalSGST} SGST
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Ticket (AOV)</span>
            <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
              <Store className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{summary.avgTicket}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Per Settled Bill</span>
        </div>

      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Bill #, Order #, Table, Customer..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Payment Method */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI Digital</option>
            <option value="CARD">Credit / Debit Card</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid Only</option>
            <option value="VOID">Voided Only</option>
          </select>

          {/* Date range */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">This Month</option>
          </select>

        </div>

      </div>

      {/* Billing Ledger Table */}
      {loading && bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Loading Billing Records & Tax Ledger...
          </p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Invoices Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No bills match your current filters. Settle an active order from Touch POS to see invoices recorded here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Invoice / Date</th>
                  <th className="py-3 px-3">Order / Table</th>
                  <th className="py-3 px-3">Customer / Steward</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3">Subtotal & Tax</th>
                  <th className="py-3 px-3">Grand Total</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => {
                  const isVoid = b.paymentStatus === 'VOID';
                  const primaryMethod = b.paymentSplits?.[0]?.method || 'CASH';
                  const dateStr = new Date(b.invoiceDate || b.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = new Date(b.invoiceDate || b.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={b._id} className={`transition-colors ${isVoid ? 'bg-rose-50/20 opacity-60' : 'hover:bg-slate-50/70'}`}>
                      
                      {/* Invoice # & Time */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block font-mono text-xs">{b.billNumber}</span>
                        <span className="text-[10px] text-slate-400">{dateStr} • {timeStr}</span>
                      </td>

                      {/* Order / Table */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {b.orderId?.tableName || b.orderId?.orderType || 'DINE_IN'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.orderId?.orderNumber || 'ORD-N/A'}
                        </span>
                      </td>

                      {/* Customer / Steward */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block truncate max-w-[130px]">
                          {b.orderId?.customerName || 'Walk-in Guest'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                          Steward: {b.settledBy?.name || b.orderId?.stewardName || 'Staff'}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-600">
                        {b.orderId?.items?.map(i => `${i.name} (${i.quantity})`).join(', ') || 'Itemized details'}
                      </td>

                      {/* Subtotal & GST */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 block">₹{b.subTotal}</span>
                        <span className="text-[10px] text-slate-400">
                          GST: ₹{(b.cgst || 0) + (b.sgst || 0)}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-3 font-black text-slate-900 text-sm">
                        ₹{b.grandTotal}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            primaryMethod === 'CASH'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : primaryMethod === 'UPI'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {primaryMethod}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                            isVoid ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewReceipt(b)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer transition-colors"
                            title="Print Receipt / View Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isVoid && (
                            <button
                              onClick={() => {
                                setBillToVoid(b);
                                setIsVoidModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Void Bill"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECEIPT & GST TAX INVOICE PREVIEW */}
      {isReceiptModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            
            {/* Modal Controls Header (Hidden in Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setReceiptType('THERMAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    receiptType === 'THERMAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  80mm Thermal Receipt
                </button>
                <button
                  onClick={() => setReceiptType('A4_INVOICE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    receiptType === 'A4_INVOICE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  A4 GST Tax Invoice
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINTABLE CONTENT AREA */}
            <div id="printable-receipt" className="py-4">
              
              {receiptType === 'THERMAL' ? (
                
                /* 80mm Thermal Receipt Layout */
                <div className="font-mono text-xs text-slate-900 max-w-xs mx-auto p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-3">
                  
                  {/* Header */}
                  <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                    <h2 className="text-base font-black tracking-tight uppercase">
                      {user?.organizationId?.name || 'ApexBuild Restaurant'}
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      Gourmet Fine Dine & Bar
                    </p>
                    <p className="text-[9px] text-slate-500">
                      GSTIN: {user?.organizationId?.gstNumber || '19AABCA1234F1Z5'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Ph: {user?.organizationId?.phone || '+91 98300 12345'}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                    <div className="flex justify-between">
                      <span>Invoice: {selectedBill.billNumber}</span>
                      <span>{new Date(selectedBill.invoiceDate || selectedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order: {selectedBill.orderId?.orderNumber || 'ORD-N/A'}</span>
                      <span>{new Date(selectedBill.invoiceDate || selectedBill.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Table: {selectedBill.orderId?.tableName || 'Counter'}</span>
                      <span>Steward: {selectedBill.settledBy?.name || 'Staff'}</span>
                    </div>
                    {selectedBill.orderId?.customerName && (
                      <div className="flex justify-between">
                        <span>Guest: {selectedBill.orderId.customerName}</span>
                        <span>{selectedBill.orderId.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Table */}
                  <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[10px]">
                    <div className="flex justify-between font-bold text-slate-600 pb-0.5 border-b border-slate-200">
                      <span>Item</span>
                      <span className="text-center w-8">Qty</span>
                      <span className="text-right">Amt</span>
                    </div>
                    {selectedBill.orderId?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate flex-1 pr-1">{item.name}</span>
                        <span className="text-center w-8">{item.quantity}</span>
                        <span className="text-right">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{selectedBill.subTotal}</span>
                    </div>
                    {selectedBill.serviceCharge > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Service Charge (5%)</span>
                        <span>₹{selectedBill.serviceCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (2.5%)</span>
                      <span>₹{selectedBill.cgst}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (2.5%)</span>
                      <span>₹{selectedBill.sgst}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                      <span>GRAND TOTAL</span>
                      <span>₹{selectedBill.grandTotal}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-bold">{selectedBill.paymentSplits?.[0]?.method || 'CASH'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold uppercase text-emerald-700">{selectedBill.paymentStatus}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                    <p className="font-bold text-slate-700">Thank you for dining with us!</p>
                    <p>Have a wonderful day • Visit again</p>
                  </div>

                </div>

              ) : (

                /* A4 Formal GST Tax Invoice Layout */
                <div className="text-xs text-slate-800 p-6 border border-slate-200 rounded-2xl bg-white space-y-4">
                  
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-slate-800">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase">
                        {user?.organizationId?.name || 'ApexBuild Restaurant'}
                      </h2>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Restaurant & Hospitality Services
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold mt-1">
                        GSTIN: {user?.organizationId?.gstNumber || '19AABCA1234F1Z5'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                        TAX INVOICE
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{selectedBill.billNumber}</p>
                      <p className="text-[10px] text-slate-500">
                        Date: {new Date(selectedBill.invoiceDate || selectedBill.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Bill To & Order Info */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Billed To:</span>
                      <p className="font-bold text-slate-900">{selectedBill.orderId?.customerName || 'Walk-in Guest'}</p>
                      <p className="text-slate-500 text-[11px]">{selectedBill.orderId?.customerPhone || 'Direct Service'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Order Details:</span>
                      <p className="font-bold text-slate-900">Table: {selectedBill.orderId?.tableName || 'Counter'}</p>
                      <p className="text-slate-500 text-[11px]">Mode: {selectedBill.orderId?.orderType || 'DINE_IN'}</p>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 font-bold text-slate-700 bg-slate-50">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Description</th>
                        <th className="py-2 px-2">HSN/SAC</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Rate</th>
                        <th className="py-2 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBill.orderId?.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-bold text-slate-900">{item.name}</td>
                          <td className="py-1.5 px-2 text-slate-500">996331</td>
                          <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                          <td className="py-1.5 px-2 text-right">₹{item.price}</td>
                          <td className="py-1.5 px-2 text-right font-bold">₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculations */}
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <div className="w-64 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Amount</span>
                        <span>₹{selectedBill.subTotal}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (2.5%)</span>
                        <span>₹{selectedBill.cgst}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (2.5%)</span>
                        <span>₹{selectedBill.sgst}</span>
                      </div>
                      {selectedBill.serviceCharge > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Service Charge (5%)</span>
                          <span>₹{selectedBill.serviceCharge}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-800">
                        <span>Invoice Total</span>
                        <span className="text-orange-600">₹{selectedBill.grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Invoice Footer & Signatory */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <p className="font-bold text-slate-700">Payment: {selectedBill.paymentSplits?.[0]?.method || 'CASH'}</p>
                      <p>Terms: GST collected as per CGST/SGST Act, 2017</p>
                    </div>
                    <div className="text-right">
                      <div className="h-8" />
                      <p className="font-bold text-slate-800 border-t border-slate-300 pt-1">
                        For {user?.organizationId?.name || 'Restaurant Demo'}
                      </p>
                      <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VOID BILL CONFIRMATION */}
      {isVoidModalOpen && billToVoid && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Ban className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Void Invoice {billToVoid.billNumber}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This invoice of <span className="font-bold text-slate-800">₹{billToVoid.grandTotal}</span> will be cancelled and reversed from daily revenue totals.
            </p>

            <div className="mt-3.5 space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Void Reason / Explanation *
              </label>
              <input
                type="text"
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Wrong items billed / customer returned"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Voiding...' : 'Yes, Void Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
