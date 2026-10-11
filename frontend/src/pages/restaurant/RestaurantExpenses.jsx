import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Receipt, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Flame, Zap, Package, Wrench, Utensils, Award,
  Clock, Check, Building, Phone, Calendar,
  Printer, ArrowUpRight, ChevronRight, FileText,
  CreditCard, Coins, AlertCircle, ShieldCheck, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export const EXPENSE_CATEGORIES = [
  { id: 'LPG_GAS', label: 'Commercial LPG & Fuel', icon: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300' },
  { id: 'UTILITIES', label: 'Electricity & Water', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  { id: 'PACKAGING_DISPOSABLES', label: 'Packaging & Takeaway Disposables', icon: '📦', color: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300' },
  { id: 'CLEANING_HYGIENE', label: 'Dishwash & Kitchen Hygiene', icon: '🧼', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300' },
  { id: 'MAINTENANCE_REPAIRS', label: 'Equipment & AC Maintenance', icon: '🔧', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  { id: 'STAFF_WELFARE_MEALS', label: 'Staff Meals & Welfare', icon: '🍲', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { id: 'MARKETING_PROMOTIONS', label: 'Marketing & Printed Menus', icon: '📢', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' },
  { id: 'LICENSES_PERMITS', label: 'FSSAI & Regulatory Permits', icon: '📜', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' },
  { id: 'PETTY_CASH', label: 'Daily Spot Petty Cash', icon: '💵', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' },
  { id: 'OTHER', label: 'General Overhead', icon: '📁', color: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300' }
];

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash at Counter', icon: '💵' },
  { id: 'UPI', label: 'UPI / QR Code', icon: '📱' },
  { id: 'CARD', label: 'Company Card', icon: '💳' },
  { id: 'BANK_TRANSFER', label: 'NEFT / RTGS Transfer', icon: '🏦' },
  { id: 'PETTY_CASH', label: 'Petty Cash Box Float', icon: '🪙' },
  { id: 'VENDOR_CREDIT', label: 'Vendor Credit Ledger', icon: '📋' }
];

export default function RestaurantExpenses() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'WEEK', 'MONTH'
  const [sortBy, setSortBy] = useState('expenseDate'); // 'expenseDate', 'amount', 'title'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Expense Form State
  const initialForm = {
    _id: null,
    category: 'LPG_GAS',
    title: '',
    amount: '',
    taxAmount: '',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    expenseDate: new Date().toISOString().split('T')[0],
    vendorOrPayee: '',
    invoiceNumber: '',
    paidBy: user?.name || 'Manager',
    notes: '',
    isRecurring: false,
    recurringFrequency: 'MONTHLY'
  };
  const [form, setForm] = useState(initialForm);

  // Fetch Data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [listRes, analyticsRes] = await Promise.all([
        api.get('/restaurant/expenses', {
          params: { sortBy, category: selectedCategory }
        }),
        api.get('/restaurant/expenses/analytics')
      ]);

      if (listRes.data?.data?.expenses) {
        setExpenses(listRes.data.data.expenses);
      }
      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant expenses:', err);
      toast.error('Unable to fetch operating expenses: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        exp.title?.toLowerCase().includes(q) ||
        exp.expenseNumber?.toLowerCase().includes(q) ||
        exp.vendorOrPayee?.toLowerCase().includes(q) ||
        exp.invoiceNumber?.toLowerCase().includes(q) ||
        exp.notes?.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || exp.category === selectedCategory;
      const matchesStatus = selectedPaymentStatus === 'ALL' || exp.paymentStatus === selectedPaymentStatus;
      const matchesMethod = selectedPaymentMethod === 'ALL' || exp.paymentMethod === selectedPaymentMethod;

      let matchesDate = true;
      if (dateFilter !== 'ALL') {
        const expDate = new Date(exp.expenseDate);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          matchesDate = expDate >= startOfToday;
        } else if (dateFilter === 'WEEK') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          matchesDate = expDate >= sevenDaysAgo;
        } else if (dateFilter === 'MONTH') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchesDate = expDate >= startOfMonth;
        }
      }

      return matchesSearch && matchesCat && matchesStatus && matchesMethod && matchesDate;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentStatus, selectedPaymentMethod, dateFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setForm(initialForm);
    setIsRecordModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp) => {
    setForm({
      _id: exp._id,
      category: exp.category || 'OTHER',
      title: exp.title || '',
      amount: exp.amount !== undefined ? String(exp.amount) : '',
      taxAmount: exp.taxAmount !== undefined ? String(exp.taxAmount) : '',
      paymentMethod: exp.paymentMethod || 'CASH',
      paymentStatus: exp.paymentStatus || 'PAID',
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : '',
      vendorOrPayee: exp.vendorOrPayee || '',
      invoiceNumber: exp.invoiceNumber || '',
      paidBy: exp.paidBy || 'Manager',
      notes: exp.notes || '',
      isRecurring: Boolean(exp.isRecurring),
      recurringFrequency: exp.recurringFrequency || 'MONTHLY'
    });
    setIsRecordModalOpen(true);
  };

  // Submit Expense (Create or Edit)
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter an expense title or item description');
      return;
    }
    if (form.amount === '' || isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: form.category,
        title: form.title.trim(),
        amount: Number(form.amount),
        taxAmount: form.taxAmount !== '' ? Number(form.taxAmount) : 0,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        expenseDate: form.expenseDate,
        vendorOrPayee: form.vendorOrPayee.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        paidBy: form.paidBy.trim(),
        notes: form.notes.trim(),
        isRecurring: form.isRecurring,
        recurringFrequency: form.isRecurring ? form.recurringFrequency : 'NONE'
      };

      if (form._id) {
        const res = await api.put(`/restaurant/expenses/${form._id}`, payload);
        toast.success('Expense voucher updated successfully');
        setExpenses(prev => prev.map(item => item._id === form._id ? res.data.data.expense : item));
      } else {
        const res = await api.post('/restaurant/expenses', payload);
        toast.success(`Expense voucher ${res.data.data.expense.expenseNumber} recorded`);
        setExpenses(prev => [res.data.data.expense, ...prev]);
      }

      setIsRecordModalOpen(false);
      // Refresh analytics
      fetchData(true);
    } catch (err) {
      console.error('Failed to save expense voucher:', err);
      toast.error(err.response?.data?.message || 'Failed to save expense voucher');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Payment Status
  const handleTogglePaymentStatus = async (exp) => {
    const newStatus = exp.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      const res = await api.put(`/restaurant/expenses/${exp._id}`, { paymentStatus: newStatus });
      setExpenses(prev => prev.map(item => item._id === exp._id ? res.data.data.expense : item));
      toast.success(`Voucher marked as ${newStatus}`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  // Delete Expense
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/expenses/${expenseToDelete._id}`);
      setExpenses(prev => prev.filter(item => item._id !== expenseToDelete._id));
      toast.success('Expense voucher archived');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      fetchData(true);
    } catch (err) {
      console.error('Failed to archive expense:', err);
      toast.error(err.response?.data?.message || 'Failed to archive expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Voucher Modal
  const handleOpenVoucher = (exp) => {
    setSelectedExpense(exp);
    setIsVoucherModalOpen(true);
  };

  // Helper for category info
  const getCatInfo = (catId) => {
    return EXPENSE_CATEGORIES.find(c => c.id === catId) || {
      id: catId,
      label: catId,
      icon: '📁',
      color: 'bg-stone-100 text-stone-700 border-stone-200'
    };
  };

  // Helper for payment method info
  const getMethodInfo = (methodId) => {
    return PAYMENT_METHODS.find(m => m.id === methodId) || {
      id: methodId,
      label: methodId,
      icon: '💵'
    };
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }
    const headers = ['Voucher Number', 'Date', 'Category', 'Title', 'Vendor/Payee', 'Invoice Number', 'Base Amount', 'Tax Amount', 'Total Amount', 'Payment Method', 'Payment Status', 'Paid By', 'Notes'];
    const rows = filteredExpenses.map(e => [
      `"${e.expenseNumber || ''}"`,
      `"${new Date(e.expenseDate).toLocaleDateString('en-IN')}"`,
      `"${e.category}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.vendorOrPayee || '').replace(/"/g, '""')}"`,
      `"${e.invoiceNumber || ''}"`,
      e.amount || 0,
      e.taxAmount || 0,
      e.totalAmount || 0,
      `"${e.paymentMethod}"`,
      `"${e.paymentStatus}"`,
      `"${e.paidBy || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `restaurant-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Expenses CSV exported successfully');
  };

  // Summary Metrics
  const summary = analytics?.summary || {
    totalThisMonth: 0,
    totalToday: 0,
    totalPrevMonth: 0,
    pendingUnpaidAmount: 0,
    pendingUnpaidCount: 0,
    totalExpensesCount: 0,
    recurringCount: 0,
    topCategory: 'N/A',
    topCategoryAmount: 0
  };

  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const dailyTrend = analytics?.dailyTrend || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl text-white shadow-sm flex items-center justify-center" style={{ backgroundColor: effectivePrimary }}>
              <Receipt className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Operating Expenses & Kitchen Overheads
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                Live Ledger
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium max-w-2xl">
            Monitor and audit all non-food restaurant overheads: commercial LPG fuel, electricity bills, takeaway packaging containers, deep-cleaning chemicals, equipment maintenance, and petty cash payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer"
            title="Refresh from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total This Month */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">This Month Overheads</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
            ₹{Number(summary.totalThisMonth).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400 mt-1">
            <span>{summary.totalExpensesCount} total recorded vouchers</span>
          </div>
        </div>

        {/* Today's Outflow */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Today's Spend</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
            ₹{Number(summary.totalToday).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
            <span>Daily operating cashflow</span>
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Top Spend Driver</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-stone-900 dark:text-stone-100 mt-2 truncate">
            {getCatInfo(summary.topCategory).label}
          </p>
          <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">
            ₹{Number(summary.topCategoryAmount).toLocaleString('en-IN')} ({summary.totalThisMonth > 0 ? Math.round((summary.topCategoryAmount / summary.totalThisMonth) * 100) : 0}% of month)
          </p>
        </div>

        {/* Pending Unpaid Vouchers */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pending Payables</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹{Number(summary.pendingUnpaidAmount).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mt-1">
            {summary.pendingUnpaidCount} unpaid {summary.pendingUnpaidCount === 1 ? 'voucher' : 'vouchers'} pending
          </p>
        </div>

      </div>

      {/* Visual Analytics Row: Category Breakdown & 14-Day Outflow Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown (1 Col) */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Overheads by Category</h3>
              <span className="text-[11px] font-bold text-stone-400">Distribution</span>
            </div>
            <p className="text-xs text-stone-400 mb-4">Proportion of non-food expenditures</p>

            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map(cat => {
                const info = getCatInfo(cat.category);
                const percent = summary.totalThisMonth > 0 
                  ? Math.round((cat.totalAmount / summary.totalThisMonth) * 100) 
                  : 0;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                        <span>{info.icon}</span>
                        <span className="truncate max-w-[150px]">{info.label}</span>
                      </div>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">
                        ₹{Number(cat.totalAmount).toLocaleString('en-IN')} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(4, percent))}%`, backgroundColor: effectivePrimary }}
                      />
                    </div>
                  </div>
                );
              })}

              {categoryBreakdown.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No category data recorded yet</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400">Recurring expenses</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {summary.recurringCount} scheduled items
            </span>
          </div>
        </div>

        {/* 14-Day Daily Outflow Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">14-Day Expense Cashflow Spike Trend</h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Daily Outflow
              </span>
            </div>
            <p className="text-xs text-stone-400 mb-4">Reveals weekly gas refill cycles, utility bill settlements, and emergency repairs</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={effectivePrimary} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={effectivePrimary} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Daily Expense']}
                    contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke={effectivePrimary} strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <span>Chart tracks daily cash and bank disbursements</span>
            <span className="font-medium text-stone-500 dark:text-stone-400">Auto-updated from live journal</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'
            }`}
          >
            All Categories ({expenses.length})
          </button>
          {EXPENSE_CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                }`}
                style={isSelected ? { backgroundColor: effectivePrimary } : {}}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search voucher #, title, payee, invoice no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Payment Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              <option value="ALL">All Payment Status</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Unpaid</option>
            </select>

            {/* Date Window */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">This Month</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Table
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Main Expense Feed & Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Loading Expense Ledger & Vouchers...
          </p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 mx-auto flex items-center justify-center text-2xl">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">No Expense Records Found</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'ALL' || selectedPaymentStatus !== 'ALL'
                ? 'No expense vouchers matched your active filter criteria. Try clearing search or category filters.'
                : 'Start tracking restaurant overheads like commercial gas, utilities, and daily petty cash.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>Record First Expense Voucher</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map(exp => {
            const catInfo = getCatInfo(exp.category);
            const methodInfo = getMethodInfo(exp.paymentMethod);
            const isPaid = exp.paymentStatus === 'PAID';

            return (
              <div 
                key={exp._id}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${catInfo.color}`}>
                      <span>{catInfo.icon}</span>
                      <span className="truncate">{catInfo.label}</span>
                    </span>

                    <button
                      onClick={() => handleTogglePaymentStatus(exp)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{exp.paymentStatus}</span>
                    </button>
                  </div>

                  {/* Title & Payee */}
                  <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">
                    {exp.title}
                  </h4>
                  
                  {exp.vendorOrPayee && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                      <Building className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{exp.vendorOrPayee}</span>
                      {exp.invoiceNumber && (
                        <span className="text-[10px] font-bold text-stone-400">
                          (Inv: {exp.invoiceNumber})
                        </span>
                      )}
                    </p>
                  )}

                  {exp.notes && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl italic line-clamp-2">
                      "{exp.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  {/* Amount Breakdown */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Voucher Total</span>
                      <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                        ₹{Number(exp.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-stone-400">
                      {exp.taxAmount > 0 ? (
                        <span>Base ₹{exp.amount} + GST ₹{exp.taxAmount}</span>
                      ) : (
                        <span>Tax Exempt / Direct</span>
                      )}
                    </div>
                  </div>

                  {/* Meta Details Row */}
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <span>{methodInfo.icon}</span>
                      <span>{methodInfo.label}</span>
                    </span>

                    <span className="text-[10px] font-bold text-stone-400">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      {exp.expenseNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenVoucher(exp)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="View & Print Payment Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(exp)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                        title="Edit Voucher Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setExpenseToDelete(exp);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Archive Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Spreadsheet Table View */
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-stone-800/80 text-stone-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-3.5 px-4">Voucher #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description / Payee</th>
                  <th className="py-3.5 px-4 text-right">Base Amount</th>
                  <th className="py-3.5 px-4 text-right">Tax / GST</th>
                  <th className="py-3.5 px-4 text-right">Total Outflow</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredExpenses.map(exp => {
                  const catInfo = getCatInfo(exp.category);
                  const methodInfo = getMethodInfo(exp.paymentMethod);
                  const isPaid = exp.paymentStatus === 'PAID';

                  return (
                    <tr key={exp._id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                        {exp.expenseNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-medium">
                        {new Date(exp.expenseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catInfo.color}`}>
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-extrabold text-stone-900 dark:text-stone-100 truncate">{exp.title}</p>
                        {exp.vendorOrPayee && (
                          <p className="text-[11px] text-stone-400 truncate">{exp.vendorOrPayee}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-400">
                        {exp.taxAmount > 0 ? `₹${Number(exp.taxAmount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900 dark:text-stone-100">
                        ₹{Number(exp.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <span>{methodInfo.icon}</span>
                          <span>{methodInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePaymentStatus(exp)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isPaid ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          <span>{exp.paymentStatus}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenVoucher(exp)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setExpenseToDelete(exp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* RECORD / EDIT EXPENSE MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl text-white" style={{ backgroundColor: effectivePrimary }}>
                  <Receipt className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    {form._id ? 'Edit Operating Expense Voucher' : 'Record Operating Expense Voucher'}
                  </h3>
                  <p className="text-xs text-stone-400">Post non-food expenditure to the restaurant ledger</p>
                </div>
              </div>

              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Overhead Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3x 19kg Commercial LPG Cylinders Refill or AC Servicing"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Amount, Tax & Calculated Total (Zero-Coercion Rule Compliant) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Base Amount (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({ ...prev, amount: val }));
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    GST / Tax Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.taxAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({ ...prev, taxAmount: val }));
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">
                    Calculated Outflow (₹)
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl text-xs font-black bg-stone-200/70 dark:bg-stone-700 text-stone-900 dark:text-stone-100 flex items-center justify-between">
                    <span>Total:</span>
                    <span>
                      ₹{(
                        (form.amount === '' ? 0 : Number(form.amount) || 0) +
                        (form.taxAmount === '' ? 0 : Number(form.taxAmount) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method, Status, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.icon} {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="PAID">PAID (Settled Immediately)</option>
                    <option value="PENDING">PENDING (Unpaid / Accrued)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Payee / Vendor & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Vendor / Payee Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shree Balaji Gas Agency, Tata Power"
                    value={form.vendorOrPayee}
                    onChange={(e) => setForm(prev => ({ ...prev, vendorOrPayee: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Invoice / Receipt Ref No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBG/26/8941 or BILL-102"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Paid By & Recurring Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Paid / Authorized By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Store Manager, Head Chef"
                    value={form.paidBy}
                    onChange={(e) => setForm(prev => ({ ...prev, paidBy: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) => setForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Recurring Operating Cost?</span>
                  </label>

                  {form.isRecurring && (
                    <select
                      value={form.recurringFrequency}
                      onChange={(e) => setForm(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Internal Notes & Justification
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional context e.g. chiller temperature calibration, emergency weekend rush requirement..."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? 'Saving Voucher...' : form._id ? 'Update Voucher' : 'Post Expense to Ledger'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PRINTABLE PAYMENT VOUCHER MODAL */}
      {isVoucherModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-stone-900 w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold tracking-wide uppercase">Official Restaurant Payment Voucher</span>
              </div>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Voucher Content */}
            <div id="printable-voucher" className="p-6 space-y-5 bg-white overflow-y-auto">
              
              {/* Restaurant Brand Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-stone-900">
                    {user?.organizationId?.name || 'Apex Restaurant & Bar'}
                  </h2>
                  <p className="text-[11px] text-stone-500 mt-0.5">Commercial Operating Expense Voucher</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-extrabold text-stone-900 block">{selectedExpense.expenseNumber}</span>
                  <span className="text-[10px] text-stone-400">Date: {new Date(selectedExpense.expenseDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Category</span>
                  <span className="font-extrabold text-stone-800">{getCatInfo(selectedExpense.category).label}</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Payment Mode</span>
                  <span className="font-extrabold text-stone-800">{getMethodInfo(selectedExpense.paymentMethod).label}</span>
                </div>
              </div>

              {/* Title & Payee */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Item / Justification</span>
                <p className="font-bold text-stone-900 text-sm bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  {selectedExpense.title}
                </p>
              </div>

              {selectedExpense.vendorOrPayee && (
                <div className="flex items-center justify-between text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Vendor / Payee</span>
                    <span className="font-bold text-stone-800">{selectedExpense.vendorOrPayee}</span>
                  </div>
                  {selectedExpense.invoiceNumber && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Ref / Invoice #</span>
                      <span className="font-mono font-bold text-stone-800">{selectedExpense.invoiceNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Calculation */}
              <div className="border-t border-b py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Base Non-Food Expense:</span>
                  <span className="font-medium">₹{Number(selectedExpense.amount).toFixed(2)}</span>
                </div>
                {selectedExpense.taxAmount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>GST / Input Tax Credit:</span>
                    <span className="font-medium">₹{Number(selectedExpense.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t">
                  <span>Net Disbursed Amount:</span>
                  <span>₹{Number(selectedExpense.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-6 text-center text-[10px] text-stone-400 uppercase tracking-wider">
                <div className="border-t pt-2">
                  <p className="font-bold text-stone-700">{selectedExpense.paidBy || 'Manager'}</p>
                  <p>Disbursed By</p>
                </div>
                <div className="border-t pt-2">
                  <p className="font-bold text-stone-700">Accountant / GM</p>
                  <p>Verified & Audited</p>
                </div>
              </div>

            </div>

            {/* Print Footer */}
            <div className="p-4 bg-stone-50 border-t flex items-center justify-between">
              <span className="text-xs text-stone-500">Official digital audit voucher</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payment Voucher</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Archive Expense Voucher?</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Are you sure you want to remove <span className="font-bold text-stone-800 dark:text-stone-200">"{expenseToDelete.title}"</span> ({expenseToDelete.expenseNumber}) from the active ledger?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {submitting ? 'Archiving...' : 'Yes, Archive Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
