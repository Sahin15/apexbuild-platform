import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Calendar, Download, Printer, RefreshCw, AlertTriangle, 
  CheckCircle2, Sparkles, PieChart as PieIcon, Layers,
  ChevronDown, ChevronUp, ChevronRight, X, ArrowUpRight,
  Flame, Zap, Package, Wrench, Utensils, UtensilsCrossed,
  Clock, ShieldCheck, FileSpreadsheet, Building, Store,
  CreditCard, Coins, ShoppingBag, Truck, Info, Percent
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, ComposedChart, Line
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantReports() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dayparts, setDayparts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'today', 'week', 'month', 'last_month', 'quarter', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Expandable sections in P&L
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    cogs: true,
    opex: true,
    channels: true
  });

  // Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toggle Section
  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch Report Data
  const fetchReport = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = { period: selectedPeriod };
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const [pnlRes, daypartsRes] = await Promise.all([
        api.get('/restaurant/reports/pnl', { params }),
        api.get('/restaurant/reports/dayparts', { params })
      ]);

      if (pnlRes.data?.data) {
        setReportData(pnlRes.data.data);
      }
      if (daypartsRes.data?.data?.dayparts) {
        setDayparts(daypartsRes.data.data.dayparts);
      }
    } catch (err) {
      console.error('Failed to load restaurant P&L report:', err);
      toast.error('Unable to fetch financial statement: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData) return;
    const { revenue, cogs, grossProfit, opex, profitability } = reportData;

    const lines = [
      ['ApexBuild Restaurant OS - Statement of Profit and Loss (P&L)'],
      [`Period: ${selectedPeriod.toUpperCase()}`, `Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [''],
      ['Line Item', 'Amount (INR)', '% of Net Revenue'],
      ['1. OPERATING REVENUE'],
      ['Gross Food Sales', revenue.grossFoodSales, ''],
      ['Gross Beverage Sales', revenue.grossBeverageSales, ''],
      ['Promotional Discounts (Deduction)', `-${revenue.discountsTotal}`, ''],
      ['Service Charge Collected', revenue.serviceChargeTotal, ''],
      ['NET OPERATING SALES', revenue.netSales, '100.0%'],
      ['Taxes Collected (GST Liability)', revenue.taxesCollected, ''],
      ['Total Cash Received (Gross with Tax)', revenue.grandTotalRevenue, ''],
      [''],
      ['2. COST OF GOODS SOLD (COGS)'],
      ['Raw Ingredient Usage (Recipe BOM)', cogs.rawIngredientCost, ''],
      ['Inventory Spoilage / Wastage', cogs.spoilageLoss, ''],
      ['TOTAL COST OF GOODS SOLD', cogs.totalCogs, `${cogs.foodCostPercentage}%`],
      [''],
      ['3. GROSS PROFIT', grossProfit.grossProfit, `${grossProfit.grossMarginPercentage}%`],
      [''],
      ['4. OPERATING OVERHEADS (OPEX)'],
      ['Commercial LPG Cylinders & Fuel', opex.lpgGasFuel, ''],
      ['Electricity & Water Utilities', opex.utilitiesPowerWater, ''],
      ['Takeaway Packaging & Disposables', opex.packagingDisposables, ''],
      ['Cleaning & Kitchen Chemicals', opex.cleaningHygiene, ''],
      ['Equipment Maintenance & Servicing', opex.maintenanceRepairs, ''],
      ['Staff Welfare & Family Meals', opex.staffWelfareMeals, ''],
      ['Marketing & Printed Menus', opex.marketingPromotions, ''],
      ['Statutory Licenses & Permits', opex.licensesPermits, ''],
      ['Petty Cash & Sundry Overheads', opex.pettyCashMisc, ''],
      ['TOTAL OPERATING OVERHEADS', opex.totalOpex, `${opex.opexPercentage}%`],
      [''],
      ['5. NET OPERATING PROFIT (EBITDA)', profitability.netProfit, `${profitability.netMarginPercentage}%`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `restaurant-pnl-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('P&L financial statement exported to CSV');
  };

  // Safe destructure with defaults
  const rev = reportData?.revenue || { grossFoodSales: 0, grossBeverageSales: 0, discountsTotal: 0, serviceChargeTotal: 0, taxesCollected: 0, netSales: 0, grandTotalRevenue: 0, ordersCount: 0, averageCheckSize: 0 };
  const cogs = reportData?.cogs || { rawIngredientCost: 0, spoilageLoss: 0, totalCogs: 0, foodCostPercentage: 0, status: 'OPTIMAL' };
  const gp = reportData?.grossProfit || { grossProfit: 0, grossMarginPercentage: 0 };
  const opex = reportData?.opex || { lpgGasFuel: 0, utilitiesPowerWater: 0, packagingDisposables: 0, cleaningHygiene: 0, maintenanceRepairs: 0, staffWelfareMeals: 0, marketingPromotions: 0, licensesPermits: 0, pettyCashMisc: 0, totalOpex: 0, opexPercentage: 0 };
  const prof = reportData?.profitability || { operatingEbitda: 0, netProfit: 0, netMarginPercentage: 0, status: 'PROFITABLE' };
  const channels = reportData?.channels || [];
  const dailyTrend = reportData?.dailyTrend || [];
  const topItems = reportData?.topItems || [];

  // Cost composition pie data
  const costPieData = useMemo(() => {
    if (!reportData) return [];
    return [
      { name: 'Food & Ingredients', value: cogs.totalCogs, color: '#EA580C' },
      { name: 'LPG Gas & Fuel', value: opex.lpgGasFuel, color: '#F97316' },
      { name: 'Electricity & Water', value: opex.utilitiesPowerWater, color: '#FBBF24' },
      { name: 'Takeaway Packaging', value: opex.packagingDisposables, color: '#3B82F6' },
      { name: 'Cleaning & Maintenance', value: opex.cleaningHygiene + opex.maintenanceRepairs, color: '#06B6D4' },
      { name: 'Staff Welfare Meals', value: opex.staffWelfareMeals, color: '#10B981' },
      { name: 'Other Overheads', value: opex.marketingPromotions + opex.licensesPermits + opex.pettyCashMisc, color: '#8B5CF6' }
    ].filter(item => item.value > 0);
  }, [reportData, cogs, opex]);

  const totalExpenditure = cogs.totalCogs + opex.totalOpex;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl text-white shadow-sm flex items-center justify-center" style={{ backgroundColor: effectivePrimary }}>
              <BarChart3 className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Financial Reports & Real-Time Profit & Loss (P&L)
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                Audited Ledger
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium max-w-2xl">
            Live managerial financial statement unifying Point-of-Sale revenue, Recipe BOM raw food cost, inventory spoilage write-offs, and kitchen operating overheads into true bottom-line profitability.
          </p>
        </div>

        {/* Global Period Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Buttons */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'Month (MTD)' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'quarter', label: 'Quarter' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Printer className="w-4 h-4" />
            <span>Official Statement</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Compiling Real-Time Profit & Loss Financial Statement...
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            
            {/* 1. Net Sales Revenue */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Net Operating Revenue</span>
              <p className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
                ₹{Number(rev.netSales).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                <span>{rev.ordersCount} settled bills</span>
                <span className="font-bold text-stone-700 dark:text-stone-300">AOV: ₹{rev.averageCheckSize}</span>
              </div>
            </div>

            {/* 2. Total COGS / Food Cost */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Food Cost (COGS)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  cogs.status === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {cogs.foodCostPercentage}%
                </span>
              </div>
              <p className="text-xl font-black text-orange-600 mt-1">
                ₹{Number(cogs.totalCogs).toLocaleString('en-IN')}
              </p>
              <div className="text-[11px] text-stone-400 mt-1 pt-1 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span>BOM & Raw Spoilage</span>
                <span className="text-emerald-600 font-bold">{cogs.status}</span>
              </div>
            </div>

            {/* 3. Gross Margin */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Gross Margin</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  {gp.grossMarginPercentage}%
                </span>
              </div>
              <p className="text-xl font-black text-blue-600 mt-1">
                ₹{Number(gp.grossProfit).toLocaleString('en-IN')}
              </p>
              <div className="text-[11px] text-stone-400 mt-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                <span>Revenue minus Prime COGS</span>
              </div>
            </div>

            {/* 4. Operating Overheads */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Kitchen Overheads</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {opex.opexPercentage}%
                </span>
              </div>
              <p className="text-xl font-black text-stone-800 dark:text-stone-200 mt-1">
                ₹{Number(opex.totalOpex).toLocaleString('en-IN')}
              </p>
              <div className="text-[11px] text-stone-400 mt-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                <span>LPG, Power, Packaging, Cleaning</span>
              </div>
            </div>

            {/* 5. Net Operating Profit (Bottom Line) */}
            <div className={`p-4 rounded-2xl border shadow-2xs ${
              prof.netProfit >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Net Profit (EBITDA)</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  prof.netProfit >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {prof.netMarginPercentage}%
                </span>
              </div>
              <p className={`text-xl font-black mt-1 ${
                prof.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                ₹{Number(prof.netProfit).toLocaleString('en-IN')}
              </p>
              <div className="text-[11px] font-bold mt-1 pt-1 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between">
                <span>Bottom Line Return</span>
                <span className={prof.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {prof.status}
                </span>
              </div>
            </div>

          </div>

          {/* Visual Charts Deck: Multi-Series Trend & Cost Allocation Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Revenue, Costs & Margin Waterfall (2 Cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Daily Revenue, Prime Costs & Operating Cashflow Velocity
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Compare daily food sales with ingredient COGS and non-food overheads
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  {dailyTrend.length} Days Tracked
                </span>
              </div>

              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        `₹${Number(value).toLocaleString('en-IN')}`, 
                        name === 'sales' ? 'Net Sales' : name === 'cogs' ? 'Food Cost (COGS)' : name === 'opex' ? 'Operating Overheads' : 'Net Margin'
                      ]}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="sales" fill={effectivePrimary} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Line type="monotone" dataKey="cogs" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2 font-bold text-stone-700 dark:text-stone-300">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: effectivePrimary }} />
                  <span>Net Sales</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-stone-700 dark:text-stone-300">
                  <span className="w-3 h-1 bg-amber-500 rounded" />
                  <span>Food Cost (COGS)</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-stone-700 dark:text-stone-300">
                  <span className="w-3 h-1 bg-emerald-500 rounded" />
                  <span>Net Bottom Line</span>
                </div>
              </div>
            </div>

            {/* Expenditure Allocation Donut (1 Col) */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Expenditure Breakdown
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">Where total restaurant rupees are disbursed</p>

                <div className="h-48 w-full relative flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {costPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Disbursed']}
                        contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-base font-black text-stone-800 dark:text-stone-200 block">
                      ₹{totalExpenditure >= 1000 ? `${(totalExpenditure/1000).toFixed(0)}k` : totalExpenditure}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">Total Costs</span>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  {costPieData.slice(0, 4).map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-stone-600 dark:text-stone-400 font-medium truncate max-w-[130px]">{item.name}</span>
                      </div>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        ₹{Number(item.value).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Raw food accounts for</span>
                <span className="font-extrabold text-orange-600">
                  {totalExpenditure > 0 ? Math.round((cogs.totalCogs / totalExpenditure) * 100) : 0}% of total costs
                </span>
              </div>
            </div>

          </div>

          {/* Channels & Dayparts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dining Channels Contribution */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Dining Mode & Channel Contribution</h3>
                  <p className="text-xs text-stone-400">Dine-In covers vs Takeaway vs Delivery margins</p>
                </div>
                <ShoppingBag className="w-4 h-4 text-orange-600" />
              </div>

              <div className="space-y-3">
                {channels.map(ch => {
                  const percent = rev.netSales > 0 ? Math.round((ch.sales / rev.netSales) * 100) : 0;
                  const icon = ch.channel.includes('Dine') ? <Utensils className="w-3.5 h-3.5 text-orange-600" />
                    : ch.channel.includes('Take') ? <Store className="w-3.5 h-3.5 text-amber-600" />
                    : <Truck className="w-3.5 h-3.5 text-blue-600" />;

                  return (
                    <div key={ch.channel} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                          {icon}
                          <span>{ch.channel}</span>
                        </div>
                        <span className="text-stone-900 dark:text-stone-100">
                          ₹{Number(ch.sales).toLocaleString('en-IN')} ({percent}%)
                        </span>
                      </div>

                      <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden my-2">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>{ch.orders} orders ({ch.covers} covers)</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">Avg Check: ₹{ch.avgAOV}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daypart Velocity & Peak Hours */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Daypart Rush Velocity (Shift Trends)</h3>
                  <p className="text-xs text-stone-400">Lunch rush vs Dinner peak sales volume</p>
                </div>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3">
                {dayparts.map(dp => {
                  const percent = rev.netSales > 0 ? Math.round((dp.revenue / rev.netSales) * 100) : 0;

                  return (
                    <div key={dp.id} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-stone-900 dark:text-stone-100">{dp.label}</span>
                        <span className="text-stone-900 dark:text-stone-100">
                          ₹{Number(dp.revenue).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden my-2">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>{dp.orders} orders processed</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">Check Size: ₹{dp.aov}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Structured Restaurant P&L Statement (Ledger Waterfall) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  Managerial Statement of Profit & Loss (P&L Waterfall)
                </h3>
                <p className="text-xs text-stone-400">
                  Detailed line-item accounting breakdown for auditing & statutory reconciliation
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-xl">
                INR (₹) Standard
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              
              {/* SECTION 1: REVENUE */}
              <div>
                <div 
                  onClick={() => toggleSection('revenue')}
                  className="p-4 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between cursor-pointer hover:bg-stone-100/70 dark:hover:bg-stone-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-400">1.0</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px]">
                      Operating Revenue (Point of Sale Receipts)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">
                      ₹{Number(rev.netSales).toLocaleString('en-IN')} (100.0%)
                    </span>
                    {expandedSections.revenue ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {expandedSections.revenue && (
                  <div className="p-4 space-y-2.5 bg-white dark:bg-stone-900 pl-8">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Gross Food & Kitchen Sales</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">₹{Number(rev.grossFoodSales).toLocaleString('en-IN')}</span>
                    </div>
                    {rev.grossBeverageSales > 0 && (
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Beverage & Bar Sales</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">₹{Number(rev.grossBeverageSales).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {rev.discountsTotal > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Less: Promotional & VIP Discounts</span>
                        <span className="font-bold">-₹{Number(rev.discountsTotal).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {rev.serviceChargeTotal > 0 && (
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Add: Service Charge & Packaging Charges</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">+₹{Number(rev.serviceChargeTotal).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-400 text-[11px] pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
                      <span>GST Output Tax Collected (Held for Govt Remittance)</span>
                      <span>₹{Number(rev.taxesCollected).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: COGS */}
              <div>
                <div 
                  onClick={() => toggleSection('cogs')}
                  className="p-4 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between cursor-pointer hover:bg-stone-100/70 dark:hover:bg-stone-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-400">2.0</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px]">
                      Cost of Goods Sold (Prime Raw Food Cost)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-orange-600">
                      ₹{Number(cogs.totalCogs).toLocaleString('en-IN')} ({cogs.foodCostPercentage}%)
                    </span>
                    {expandedSections.cogs ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {expandedSections.cogs && (
                  <div className="p-4 space-y-2.5 bg-white dark:bg-stone-900 pl-8">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Recipe Bill of Materials (BOM) Ingredient Usage</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">₹{Number(cogs.rawIngredientCost).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Inventory Spoilage & Cold-Chain Wastage</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {cogs.spoilageLoss > 0 ? `₹${Number(cogs.spoilageLoss).toLocaleString('en-IN')}` : '₹0.00 (Zero Recorded Spoilage)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 text-[11px] pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
                      <span>Food Cost Efficiency Rating</span>
                      <span className="font-bold">{cogs.status} ({cogs.benchmark})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* GROSS MARGIN HIGHLIGHT ROW */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between font-extrabold text-blue-900 dark:text-blue-300">
                <span className="text-xs uppercase tracking-wide">3.0 GROSS PROFIT (Revenue minus Food COGS)</span>
                <span className="text-sm">₹{Number(gp.grossProfit).toLocaleString('en-IN')} ({gp.grossMarginPercentage}%)</span>
              </div>

              {/* SECTION 4: OPERATING OVERHEADS */}
              <div>
                <div 
                  onClick={() => toggleSection('opex')}
                  className="p-4 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between cursor-pointer hover:bg-stone-100/70 dark:hover:bg-stone-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-400">4.0</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px]">
                      Operating Overheads (Opex / Controllable Non-Food Costs)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-stone-800 dark:text-stone-200">
                      ₹{Number(opex.totalOpex).toLocaleString('en-IN')} ({opex.opexPercentage}%)
                    </span>
                    {expandedSections.opex ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {expandedSections.opex && (
                  <div className="p-4 space-y-2 bg-white dark:bg-stone-900 pl-8">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Commercial LPG Gas Cylinders & Fuel</span>
                      <span>₹{Number(opex.lpgGasFuel).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Commercial Electricity & Water Power</span>
                      <span>₹{Number(opex.utilitiesPowerWater).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Takeaway Containers & Food-Grade Packaging</span>
                      <span>₹{Number(opex.packagingDisposables).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Dishwashing Detergent & Kitchen Floor Sanitizers</span>
                      <span>₹{Number(opex.cleaningHygiene).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Equipment Servicing, Walk-In Chiller AMC</span>
                      <span>₹{Number(opex.maintenanceRepairs).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Staff Family Meal Provisions & Tea</span>
                      <span>₹{Number(opex.staffWelfareMeals).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Marketing, Local Social Media & Printed Menus</span>
                      <span>₹{Number(opex.marketingPromotions).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>FSSAI Licenses, Fire Safety & Permits</span>
                      <span>₹{Number(opex.licensesPermits).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Daily Spot Petty Cash (Lemons, Mint, Ice)</span>
                      <span>₹{Number(opex.pettyCashMisc).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* NET OPERATING PROFIT / BOTTOM LINE HIGHLIGHT */}
              <div className={`p-5 flex items-center justify-between font-black ${
                prof.netProfit >= 0
                  ? 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-950 dark:text-rose-300'
              }`}>
                <div>
                  <span className="text-sm uppercase tracking-wide block">5.0 NET OPERATING PROFIT (EBITDA)</span>
                  <span className="text-[11px] font-medium opacity-80">True bottom-line return after all prime costs and operating expenses</span>
                </div>
                <div className="text-right">
                  <span className="text-xl block">₹{Number(prof.netProfit).toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold">{prof.netMarginPercentage}% Net Margin</span>
                </div>
              </div>

            </div>
          </div>

          {/* Top Selling Menu Items Margin Matrix */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Menu Engineering & Contribution Matrix
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">Top revenue contributors and individual portion margins</p>
              </div>
              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300">
                <thead className="bg-stone-50 dark:bg-stone-800/80 text-stone-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4 text-center">Dietary</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Sales Revenue</th>
                    <th className="py-3 px-4 text-right">Raw Food Cost</th>
                    <th className="py-3 px-4 text-right">Portion Margin</th>
                    <th className="py-3 px-4 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {topItems.map(item => (
                    <tr key={item.name} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {item.quantity} portions
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-stone-900 dark:text-stone-100">
                        ₹{Number(item.revenue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-500">
                        ₹{Number(item.cost).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        ₹{Number(item.margin).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                          {item.marginPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* OFFICIAL PRINTABLE P&L STATEMENT MODAL */}
      {isPrintModalOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-stone-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold tracking-wide uppercase">Official Profit & Loss Statement (Managerial Audit)</span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Content */}
            <div id="printable-pnl" className="p-8 space-y-6 bg-white overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-stone-900">
                    {user?.organizationId?.name || 'Apex Restaurant & Bar'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">Managerial Financial Performance Statement</p>
                  <p className="text-[11px] text-stone-400">GSTIN: {user?.organizationId?.gstin || '27AABCU9603R1ZM'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-stone-900 block">Period: {selectedPeriod.toUpperCase()}</span>
                  <span className="text-[11px] text-stone-500">Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Accounting Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b font-extrabold text-stone-500 uppercase text-[10px]">
                    <th className="py-2 text-left">Accounting Item</th>
                    <th className="py-2 text-right">Amount (INR)</th>
                    <th className="py-2 text-right">% Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-stone-700">
                  <tr className="font-extrabold text-stone-900 bg-stone-50">
                    <td className="py-2.5">1. NET OPERATING SALES REVENUE</td>
                    <td className="py-2.5 text-right font-black">₹{Number(rev.netSales).toFixed(2)}</td>
                    <td className="py-2.5 text-right">100.0%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Gross Food Sales</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(rev.grossFoodSales).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  {rev.discountsTotal > 0 && (
                    <tr>
                      <td className="py-1.5 pl-4 text-rose-600">Less: Discounts & Concessions</td>
                      <td className="py-1.5 text-right text-rose-600">-₹{Number(rev.discountsTotal).toFixed(2)}</td>
                      <td className="py-1.5 text-right text-stone-400"></td>
                    </tr>
                  )}
                  <tr className="font-extrabold text-stone-900 bg-stone-50">
                    <td className="py-2.5">2. COST OF GOODS SOLD (PRIME FOOD COGS)</td>
                    <td className="py-2.5 text-right font-black text-orange-600">₹{Number(cogs.totalCogs).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold">{cogs.foodCostPercentage}%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Raw Recipe BOM Ingredients Usage</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(cogs.rawIngredientCost).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr className="font-black text-stone-900 bg-blue-50">
                    <td className="py-2.5">3. GROSS OPERATING MARGIN</td>
                    <td className="py-2.5 text-right font-black text-blue-700">₹{Number(gp.grossProfit).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold">{gp.grossMarginPercentage}%</td>
                  </tr>
                  <tr className="font-extrabold text-stone-900 bg-stone-50">
                    <td className="py-2.5">4. OPERATING OVERHEADS (OPEX)</td>
                    <td className="py-2.5 text-right font-black">₹{Number(opex.totalOpex).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold">{opex.opexPercentage}%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">LPG Commercial Gas & Cooking Fuel</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.lpgGasFuel).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Power, HVAC, Chillers & Utilities</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.utilitiesPowerWater).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Takeaway Containers & Disposables</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.packagingDisposables).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Dishwash, Sanitation & Deep Cleaning</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.cleaningHygiene).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Equipment Repairs, Maintenance & AMC</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.maintenanceRepairs).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pl-4 text-stone-500">Staff Family Meals & Daily Tea</td>
                    <td className="py-1.5 text-right text-stone-500">₹{Number(opex.staffWelfareMeals).toFixed(2)}</td>
                    <td className="py-1.5 text-right text-stone-400"></td>
                  </tr>
                  <tr className="font-black text-stone-900 bg-emerald-50 text-sm">
                    <td className="py-3">5. NET OPERATING PROFIT (EBITDA)</td>
                    <td className="py-3 text-right font-black text-emerald-700">₹{Number(prof.netProfit).toFixed(2)}</td>
                    <td className="py-3 text-right font-black text-emerald-700">{prof.netMarginPercentage}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-stone-400 uppercase tracking-wider">
                <div className="border-t pt-2">
                  <p className="font-bold text-stone-700">Operations Manager</p>
                  <p>Verified Internal P&L</p>
                </div>
                <div className="border-t pt-2">
                  <p className="font-bold text-stone-700">General Manager / Owner</p>
                  <p>Approved & Filed</p>
                </div>
              </div>

            </div>

            {/* Print Footer */}
            <div className="p-4 bg-stone-50 border-t flex items-center justify-between">
              <span className="text-xs text-stone-500">Print or save as PDF</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
