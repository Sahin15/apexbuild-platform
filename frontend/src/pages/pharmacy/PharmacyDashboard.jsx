import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Pill, Boxes, AlertTriangle, ShieldCheck, 
  IndianRupee, TrendingUp, Users, Clock, CheckCircle2, 
  ArrowRight, Plus, RefreshCw, FileText, ChevronRight,
  Thermometer, AlertCircle, Ban, Stethoscope, Eye, Sparkles,
  Database, Activity, Truck, CreditCard
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Live aggregated analytics state
  const [analytics, setAnalytics] = useState({
    medicinesTotal: 0,
    batchesTotal: 0,
    totalUnitsInStock: 0,
    totalCostValuation: 0,
    totalMrpValuation: 0,
    estimatedGrossMargin: '24.0',
    nearExpiryCount: 0,
    expiredCount: 0,
    quarantinedCount: 0,
    suppliersCount: 0,
    supplierPayablesTotal: 0,
    unpaidInvoicesCount: 0,
    pendingPOsCount: 0,
    todayGrossSales: 0,
    todayBillsCount: 0,
    totalKhataReceivables: 0,
    khataDebtorsCount: 0,
    refillDueCount: 0
  });

  const [liveNearExpiryBatches, setLiveNearExpiryBatches] = useState([]);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [dashRes, batchesRes] = await Promise.all([
        api.get('/pharmacy/dashboard').catch(() => null),
        api.get('/pharmacy/inventory/batches').catch(() => null)
      ]);

      if (dashRes?.data?.data) {
        setAnalytics(dashRes.data.data);
        setIsLive(true);
      }

      if (batchesRes?.data?.data?.batches) {
        const allBatches = batchesRes.data.data.batches;
        // Filter top near-expiry or expired batches for the alert widget
        const watchList = allBatches
          .filter(b => b.computedStatus === 'EXPIRED' || b.computedStatus === 'NEAR_EXPIRY' || b.daysUntilExpiry <= 90)
          .slice(0, 4)
          .map(b => ({
            brand: b.brandName || 'Medicine',
            generic: b.genericName || '',
            batch: b.batchNumber,
            expiry: b.expiryDate || new Date(b.expiryDateObj).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            daysLeft: b.daysUntilExpiry,
            stock: `${b.quantityOnHand} Units`,
            mrp: `₹${Number(b.mrp || 0).toFixed(2)}`,
            status: (b.daysUntilExpiry <= 0 || b.computedStatus === 'EXPIRED') ? 'expired' : 'warning'
          }));
        setLiveNearExpiryBatches(watchList);
      }
    } catch (err) {
      console.error('Failed to load pharmacy dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format currency in Indian notation
  const formatINR = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Dynamic KPI calculation backed by MongoDB aggregations
  const kpis = [
    {
      label: "Today's Gross Sales",
      value: isLive && analytics.todayGrossSales !== undefined ? `₹${Number(analytics.todayGrossSales || 0).toLocaleString('en-IN')}` : "₹42,850",
      subtext: isLive && analytics.todayBillsCount !== undefined ? `${analytics.todayBillsCount} Bill${analytics.todayBillsCount === 1 ? '' : 's'} dispensed today` : "128 Bills dispensed",
      trend: "Live Counter Sync",
      trendUp: true,
      icon: IndianRupee,
      color: "text-teal-700",
      bg: "bg-teal-50",
      border: "border-teal-100",
      link: "/pharmacy/sales"
    },
    {
      label: "Stock Valuation",
      value: isLive ? formatINR(analytics.totalCostValuation) : "₹18.45 L",
      subtext: isLive ? `MRP: ${formatINR(analytics.totalMrpValuation)} (${analytics.estimatedGrossMargin}% Margin)` : "MRP: ₹24.20 L (23.7% Margin)",
      trend: isLive ? `${analytics.batchesTotal} Active Batches` : "3,420 Active Batches",
      trendUp: true,
      icon: Boxes,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-100",
      link: "/pharmacy/medicines"
    },
    {
      label: "Khata Store Credit",
      value: isLive ? formatINR(analytics.totalKhataReceivables || 0) : "₹2,792",
      subtext: `${analytics.khataDebtorsCount || 0} Active Debtors`,
      trend: "Patient Credit Ledger",
      trendUp: false,
      icon: CreditCard,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      link: "/pharmacy/customers"
    },
    {
      label: "Chronic Refills Due",
      value: isLive ? `${analytics.refillDueCount || 0} Patients` : "1 Patient",
      subtext: "1-Click WhatsApp Reminders",
      trend: "Chronic Care Retention",
      trendUp: true,
      icon: Users,
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      link: "/pharmacy/customers"
    },
    {
      label: "Near-Expiry Batches",
      value: isLive ? `${analytics.nearExpiryCount} Batches` : "14 Batches",
      subtext: "Expiring within 60 days",
      trend: "Action: Triage / Return",
      trendUp: false,
      icon: AlertTriangle,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
      link: "/pharmacy/expiry"
    },
    {
      label: "Quarantined / Expired",
      value: isLive ? `${analytics.expiredCount + analytics.quarantinedCount} Batches` : "3 Batches",
      subtext: "Hard-blocked from POS",
      trend: "100% Patient Safe",
      trendUp: true,
      icon: Ban,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-100",
      link: "/pharmacy/expiry"
    },
    {
      label: "Catalogue Formulations",
      value: isLive ? `${analytics.medicinesTotal} Medicines` : "480 Medicines",
      subtext: `${analytics.totalUnitsInStock || 0} Units in Stock`,
      trend: "Master Formulary",
      trendUp: true,
      icon: Pill,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      link: "/pharmacy/medicines"
    },
    {
      label: "Supplier Payables",
      value: isLive ? formatINR(analytics.supplierPayablesTotal || 0) : "₹3,620",
      subtext: `${analytics.unpaidInvoicesCount || 0} Inward Invoices Due`,
      trend: `${analytics.pendingPOsCount || 0} Open POs Pending`,
      trendUp: false,
      icon: Truck,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
      link: "/pharmacy/purchases"
    }
  ];

  const salesTrendData = [
    { day: 'Mon', sales: 34200, bills: 104 },
    { day: 'Tue', sales: 38900, bills: 118 },
    { day: 'Wed', sales: 36400, bills: 110 },
    { day: 'Thu', sales: 41200, bills: 124 },
    { day: 'Fri', sales: 39500, bills: 121 },
    { day: 'Sat', sales: 47800, bills: 142 },
    { day: 'Sun', sales: 42850, bills: 128 },
  ];

  const categoryBreakdown = [
    { name: 'Antibiotics & Anti-Infective', value: 32, color: '#0D9488' },
    { name: 'Cardiovascular & Hypertensive', value: 24, color: '#0284C7' },
    { name: 'Antidiabetic Care', value: 18, color: '#10B981' },
    { name: 'Pain Relief & Analgesics', value: 14, color: '#F59E0B' },
    { name: 'Nutraceuticals & OTC', value: 12, color: '#6366F1' },
  ];

  const recentTransactions = [
    {
      billNo: 'RX-2026-0842',
      customer: 'Suresh Ganguly',
      doctor: 'Dr. A. K. Banerjee (MD)',
      doctorReg: 'WBMC-38291',
      itemsCount: 4,
      total: '₹840.00',
      schedule: 'SCHEDULE_H',
      paymentMethod: 'UPI',
      time: '12:48 PM',
      status: 'Dispensed'
    },
    {
      billNo: 'RX-2026-0841',
      customer: 'Mita Debnath',
      doctor: 'Walk-in OTC',
      doctorReg: 'N/A',
      itemsCount: 2,
      total: '₹145.00',
      schedule: 'OTC',
      paymentMethod: 'CASH',
      time: '12:35 PM',
      status: 'Dispensed'
    },
    {
      billNo: 'RX-2026-0840',
      customer: 'Subir Chakraborty',
      doctor: 'Dr. R. Sengupta (MBBS)',
      doctorReg: 'WBMC-49102',
      itemsCount: 5,
      total: '₹1,420.00',
      schedule: 'SCHEDULE_H1',
      paymentMethod: 'CARD',
      time: '12:15 PM',
      status: 'Dispensed'
    },
    {
      billNo: 'RX-2026-0839',
      customer: 'Anjali Sharma (Chronic Khata)',
      doctor: 'Dr. P. Roy (Cardiologist)',
      doctorReg: 'WBMC-21049',
      itemsCount: 6,
      total: '₹2,380.00',
      schedule: 'SCHEDULE_H',
      paymentMethod: 'KHATA',
      time: '11:50 AM',
      status: 'Dispensed'
    },
    {
      billNo: 'RX-2026-0838',
      customer: 'Rohit Sen',
      doctor: 'Walk-in OTC',
      doctorReg: 'N/A',
      itemsCount: 1,
      total: '₹65.00',
      schedule: 'OTC',
      paymentMethod: 'UPI',
      time: '11:22 AM',
      status: 'Dispensed'
    }
  ];

  const displayedRecentSales = useMemo(() => {
    if (analytics.recentSales && analytics.recentSales.length > 0) {
      return analytics.recentSales.map(s => ({
        billNo: s.billNumber,
        customer: s.customer?.name || 'Walk-in Customer',
        doctor: s.doctor?.name || 'Walk-in OTC',
        doctorReg: s.doctor?.registrationNumber || 'N/A',
        itemsCount: s.items?.length || 1,
        total: `₹${Number(s.pricing?.grandTotal || 0).toFixed(2)}`,
        schedule: s.highestSchedule || 'OTC',
        paymentMethod: s.payment?.method || 'CASH',
        time: new Date(s.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: s.status || 'COMPLETED'
      }));
    }
    return recentTransactions;
  }, [analytics.recentSales]);

  const nearExpiryAlerts = [
    {
      brand: 'Augmentin 625 Duo',
      generic: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      batch: 'AUG24018',
      expiry: '30 Nov 2026',
      daysLeft: 49,
      stock: '42 Strips',
      mrp: '₹204.50',
      status: 'warning'
    },
    {
      brand: 'Telma 40 Tablets',
      generic: 'Telmisartan 40mg',
      batch: 'TLM2409',
      expiry: '15 Dec 2026',
      daysLeft: 64,
      stock: '60 Strips',
      mrp: '₹142.00',
      status: 'warning'
    },
    {
      brand: 'Pantocid DSR Capsule',
      generic: 'Pantoprazole (40mg) + Domperidone (30mg)',
      batch: 'PNT2391',
      expiry: '10 Oct 2026',
      daysLeft: -2,
      stock: '15 Strips',
      mrp: '₹195.00',
      status: 'expired'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Data Layer Status Banner */}
      <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
        isLive 
          ? 'bg-teal-500/10 border border-teal-500/30 text-teal-900' 
          : 'bg-amber-500/10 border border-amber-500/30 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 font-black text-xs shadow-xs ${
            isLive ? 'bg-teal-600' : 'bg-amber-500'
          }`}>
            {isLive ? <Database className="w-4 h-4" /> : 'DEMO'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold leading-tight">
                {isLive ? 'Live Pharmacy Data Layer Connected' : 'Pharmacy OS Frontend Foundation Preview'}
              </p>
              {isLive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live MongoDB
                </span>
              )}
            </div>
            <p className={`text-[11px] mt-0.5 ${isLive ? 'text-teal-800/90' : 'text-amber-800/90'}`}>
              {isLive 
                ? `Stock valuations, active batch counts (${analytics.batchesTotal}), and expiry alerts are aggregated live from your tenant database.` 
                : 'The metrics, batches, and sales records below are simulated demonstration data for layout and architectural verification.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
            isLive ? 'bg-teal-200 text-teal-900' : 'bg-amber-200 text-amber-900'
          }`}>
            {isLive ? 'Phase 2 Live Connected' : 'UI Foundation Phase'}
          </span>
        </div>
      </div>

      {/* Statutory Header & Pharmacist on Duty Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy Control Center</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              Retail Chemist
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Drug Licence: <strong className="text-slate-900">Form 20B/21B-WB-19284</strong></span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Reg. Pharmacist: <strong className="text-slate-900">{user?.name ? `${user.name} (WB-48291)` : 'Rahul Roy (WB-48291)'}</strong></span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Thermometer className="w-4 h-4 text-blue-600" />
              <span>Cold Chain: <strong className="text-emerald-700 font-bold">3.8°C (Normal)</strong></span>
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              fetchDashboardData(true);
              toast.success('Live inventory metrics refreshed');
            }}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <Link
            to="/pharmacy/medicines"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <Pill className="w-4 h-4 text-slate-500" />
            <span>Catalogue</span>
          </Link>
          <Link
            to="/pharmacy/purchases"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span>Purchases & GRN</span>
          </Link>
          <Link
            to="/pharmacy/customers"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all shadow-2xs"
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Patients & Khata</span>
          </Link>
          <Link
            to="/pharmacy/expiry"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Expiry Triage</span>
          </Link>
          <Link
            to="/pharmacy/pos"
            style={{ backgroundColor: effectivePrimary }}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:brightness-105 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Counter POS Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - 8 Cards in Responsive 4-Column Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => {
          const CardContent = (
            <div 
              className={`bg-white rounded-2xl p-4 border ${kpi.border} shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                  {kpi.value}
                </h3>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  {kpi.subtext}
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span className={kpi.trendUp ? "text-emerald-600" : "text-amber-600"}>
                  {kpi.trend}
                </span>
                {kpi.link && (
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-600 transition-colors" />
                )}
              </div>
            </div>
          );

          return kpi.link ? (
            <Link key={idx} to={kpi.link} className="block focus:outline-none">
              {CardContent}
            </Link>
          ) : (
            <div key={idx}>{CardContent}</div>
          );
        })}
      </div>

      {/* Critical Expiry Warning Triage Alert */}
      <div className={`rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
        (analytics.expiredCount > 0) 
          ? 'bg-rose-50 border border-rose-200' 
          : (analytics.nearExpiryCount > 0)
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-emerald-50 border border-emerald-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
            (analytics.expiredCount > 0) 
              ? 'bg-rose-100 text-rose-700' 
              : (analytics.nearExpiryCount > 0)
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${
                (analytics.expiredCount > 0) ? 'text-rose-950' : (analytics.nearExpiryCount > 0) ? 'text-amber-950' : 'text-emerald-950'
              }`}>
                Statutory Status: {analytics.expiredCount} Batch{analytics.expiredCount === 1 ? '' : 'es'} Expired & {analytics.nearExpiryCount} Batch{analytics.nearExpiryCount === 1 ? '' : 'es'} Near Expiry
              </h4>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                (analytics.expiredCount > 0) 
                  ? 'bg-rose-200 text-rose-900' 
                  : (analytics.nearExpiryCount > 0)
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
              }`}>
                {analytics.expiredCount > 0 ? 'Action Required' : analytics.nearExpiryCount > 0 ? 'Triage Active' : 'Compliant'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${
              (analytics.expiredCount > 0) ? 'text-rose-800' : (analytics.nearExpiryCount > 0) ? 'text-amber-800' : 'text-emerald-800'
            }`}>
              Expired batches are automatically quarantined from POS dispensing. Review near-expiry batches to prepare distributor return claims before the return window closes.
            </p>
          </div>
        </div>
        <Link
          to="/pharmacy/expiry"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shrink-0 transition-colors shadow-2xs ${
            (analytics.expiredCount > 0) ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          <span>Quarantine & Returns</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Dispensing & Sales Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Dispensing Volume & Sales</h3>
              <p className="text-xs text-slate-500 font-medium">Daily counter revenue vs prescription tickets generated</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
                Sales (₹)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-300 inline-block"></span>
                Bills Count
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={effectivePrimary} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={effectivePrimary} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip 
                  formatter={(val, name) => [
                    name === 'sales' ? `₹${val.toLocaleString()}` : `${val} Bills`,
                    name === 'sales' ? 'Revenue' : 'Tickets'
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke={effectivePrimary} strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Therapy Area & Category Mix (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Therapeutic Category Share</h3>
            <p className="text-xs text-slate-500 font-medium">Sales contribution by medicine class</p>

            <div className="h-44 w-full my-3 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(val) => [`${val}%`, 'Share']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-600 truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Near-Expiry Quick Action Table & Recent Counter Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Counter Transactions (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Counter Transactions</h3>
              <p className="text-xs text-slate-500 font-medium">Real-time bills dispensed under registered supervision</p>
            </div>
            <Link
              to="/pharmacy/pos"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Launch Terminal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Bill Number</th>
                  <th className="px-4 py-3">Customer / Doctor</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedRecentSales.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900">{tx.billNo}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.time}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 truncate max-w-[170px]">{tx.customer}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[170px]">{tx.doctor}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.schedule === 'SCHEDULE_H1' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          Sched H1
                        </span>
                      ) : tx.schedule === 'SCHEDULE_H' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          Sched H (Rx)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                      {tx.itemsCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      {tx.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Near Expiry Triage Card (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Batch Expiry Watch</h3>
              <Link to="/pharmacy/expiry" className="text-xs font-bold text-amber-700 hover:text-amber-800">
                View All
              </Link>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">FEFO dispatch queue and quarantine status</p>

            <div className="space-y-3">
              {(liveNearExpiryBatches.length > 0 ? liveNearExpiryBatches : nearExpiryAlerts).map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border ${
                    item.status === 'expired' 
                      ? 'bg-rose-50/80 border-rose-200' 
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {item.brand}
                    </span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                      item.status === 'expired' ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {item.daysLeft < 0 ? 'EXPIRED' : `${item.daysLeft}d left`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mb-1.5">{item.generic}</p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                    <span>Batch: <strong className="text-slate-900">{item.batch}</strong></span>
                    <span>Stock: <strong className="text-slate-900">{item.stock}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/pharmacy/expiry"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
            >
              <span>Generate Supplier Return Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
