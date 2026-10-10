import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Wallet, 
  Package, 
  Users, 
  Truck, 
  Building2, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  Download,
  Info
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import FeatureGate from '../components/common/FeatureGate';

export default function ProjectCashFlow() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [projectsList, setProjectsList] = useState([]);

  const fetchData = async (projId = selectedProjectId) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/cashflow-pnl?projectId=${projId}`);
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (error) {
      if (error.response?.data?.code !== 'FEATURE_NOT_ENTITLED') {
        toast.error(error.response?.data?.message || 'Failed to load cash flow & P&L snapshot');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch project dropdown list
    api.get('/projects').then(res => {
      const pList = res.data?.data?.projects || [];
      setProjectsList(pList);
    }).catch(console.error);

    fetchData('ALL');
  }, []);

  const handleProjectChange = (e) => {
    const val = e.target.value;
    setSelectedProjectId(val);
    fetchData(val);
  };

  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  const summary = data?.summary || {};
  const projects = data?.projects || [];
  const monthlyTrend = data?.monthlyTrend || [];

  const maxMonthlyVal = Math.max(
    ...monthlyTrend.map(m => Math.max(m.inflow, m.outflow)),
    100000
  );

  return (
    <FeatureGate feature="civilPnL" requiredTier="ENTERPRISE">
      <div className="space-y-6">
        {/* Top Banner & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Live P&L & Cash Visibility
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Working Capital Tracker
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Project Profit & Loss / Cash Flow Snapshot</h1>
          <p className="text-slate-300 text-sm mt-1">
            Actual Money In (RA Bills Certified & Paid) vs. Money Out (Materials GRN, Labour Wages & Site Fuel).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[260px] truncate"
            >
              <option value="ALL">All Projects (Portfolio View)</option>
              {projectsList.map(p => (
                <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchData(selectedProjectId)}
            disabled={loading}
            className="btn bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-2.5 rounded-lg shadow inline-flex items-center justify-center flex-shrink-0 transition-all"
            title="Refresh Financial Snapshot"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Certified Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Work Certified</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {formatINR(summary.totalGrossWorkDone)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Collected: <strong className="text-emerald-600">{formatINR(summary.totalReceived)}</strong></span>
            <span>Due: <strong className="text-amber-600">{formatINR(summary.pendingReceivable)}</strong></span>
          </div>
        </div>

        {/* 2. Total Project Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Money Out (Cost)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {formatINR(summary.totalCost)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Materials: <strong className="text-slate-700">{formatINR(summary.totalMaterialCost)}</strong></span>
            <span>Labour: <strong className="text-slate-700">{formatINR(summary.totalLabourCost)}</strong></span>
          </div>
        </div>

        {/* 3. Operating Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Net Profit</span>
            <div className={`p-2 rounded-lg ${summary.totalNetProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {summary.totalNetProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <h3 className={`text-2xl font-black ${summary.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {formatINR(summary.totalNetProfit)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Current Margin:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${
              summary.portfolioMargin >= 15 ? 'bg-emerald-100 text-emerald-700' :
              summary.portfolioMargin >= 0 ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {summary.portfolioMargin >= 0 ? `+${summary.portfolioMargin}%` : `${summary.portfolioMargin}% (Procurement)`}
            </span>
          </div>
        </div>

        {/* 4. Net Cash Flow Position */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Cash In Bank</span>
            <div className={`p-2 rounded-lg ${summary.totalNetCashFlow >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className={`text-2xl font-black ${summary.totalNetCashFlow >= 0 ? 'text-emerald-600' : 'text-indigo-950'}`}>
            {formatINR(summary.totalNetCashFlow)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Govt Retention:</span>
            <span className="font-semibold text-slate-700">{formatINR(summary.totalRetention)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown & Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Cost Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Site Cost Composition
            </h3>
            <span className="text-xs text-slate-500 font-medium">Total: {formatINR(summary.totalCost)}</span>
          </div>

          <div className="space-y-4">
            {/* Materials */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Materials (Store GRN & Bulk Purchases)
                </span>
                <span className="text-slate-900">
                  {formatINR(summary.totalMaterialCost)} 
                  <span className="text-slate-400 font-normal ml-1">
                    ({summary.totalCost > 0 ? Math.round((summary.totalMaterialCost / summary.totalCost) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${summary.totalCost > 0 ? (summary.totalMaterialCost / summary.totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Labour */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Labour & Gang Muster Roll Wages
                </span>
                <span className="text-slate-900">
                  {formatINR(summary.totalLabourCost)}
                  <span className="text-slate-400 font-normal ml-1">
                    ({summary.totalCost > 0 ? Math.round((summary.totalLabourCost / summary.totalCost) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${summary.totalCost > 0 ? (summary.totalLabourCost / summary.totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Plant & Machinery */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Equipment, Plant & Fuel
                </span>
                <span className="text-slate-900">
                  {formatINR(summary.totalEquipmentCost)}
                  <span className="text-slate-400 font-normal ml-1">
                    ({summary.totalCost > 0 ? Math.round((summary.totalEquipmentCost / summary.totalCost) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${summary.totalCost > 0 ? (summary.totalEquipmentCost / summary.totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Site Overheads */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                  Site Operations & Petty Cash
                </span>
                <span className="text-slate-900">
                  {formatINR(summary.totalOverheadCost)}
                  <span className="text-slate-400 font-normal ml-1">
                    ({summary.totalCost > 0 ? Math.round((summary.totalOverheadCost / summary.totalCost) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${summary.totalCost > 0 ? (summary.totalOverheadCost / summary.totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p>
              Costs are automatically extracted from verified Store Goods Received Notes (GRN), CPWD Form 21 Wage Sheets, and site petty cash vouchers.
            </p>
          </div>
        </div>

        {/* Right: 6-Month Inflow vs Outflow Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> 6-Month Cash In vs Cash Out Trend
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Inflow</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Outflow</span>
              </div>
            </div>

            {/* Monthly Trend Bars */}
            <div className="space-y-3 pt-2">
              {monthlyTrend.map((m, idx) => {
                const inPct = maxMonthlyVal > 0 ? (m.inflow / maxMonthlyVal) * 100 : 0;
                const outPct = maxMonthlyVal > 0 ? (m.outflow / maxMonthlyVal) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700 w-16">{m.month}</span>
                      <span className="text-slate-500 text-[11px]">
                        In: <strong className="text-emerald-600 font-semibold">{formatINR(m.inflow)}</strong> | Out: <strong className="text-rose-600 font-semibold">{formatINR(m.outflow)}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-100 h-2 rounded-full overflow-hidden flex justify-end">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, inPct)}%` }}
                        ></div>
                      </div>
                      <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, outPct)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Portfolio Tender Value: <strong>{formatINR(summary.totalContractValue)}</strong></span>
            <span>Total Liquid Disbursed: <strong className="text-rose-600">{formatINR(summary.totalCashOutflow)}</strong></span>
          </div>
        </div>
      </div>

      {/* Project Profitability Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Project Profitability Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Project-by-project breakdown of contract value, work billed, site expenditures, and margin.</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100">
            {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Project Details</th>
                <th className="px-4 py-3.5 text-right">Contract Value</th>
                <th className="px-4 py-3.5 text-right">Work Certified</th>
                <th className="px-4 py-3.5 text-right">Materials (GRN)</th>
                <th className="px-4 py-3.5 text-right">Labour (NMR)</th>
                <th className="px-4 py-3.5 text-right">Total Cost</th>
                <th className="px-4 py-3.5 text-right">Net Profit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                    No active projects found.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const isPositiveProfit = p.netProfit >= 0;
                  return (
                    <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-sm">{p.projectName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.projectCode}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-700">
                        {formatINR(p.contractValue)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600">
                        {formatINR(p.totalGrossWorkDone)}
                        <div className="text-[10px] text-slate-400 font-normal">
                          Rec: {formatINR(p.totalReceived)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-600 font-medium">
                        {formatINR(p.totalMaterialCost)}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-600 font-medium">
                        {formatINR(p.totalLabourCost)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-rose-600">
                        {formatINR(p.totalCost)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`font-bold ${isPositiveProfit ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {formatINR(p.netProfit)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.profitMargin >= 0 ? `${p.profitMargin}% Margin` : 'Material Stocking'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          p.totalGrossWorkDone > p.totalCost ? 'bg-emerald-100 text-emerald-700' :
                          p.totalGrossWorkDone > 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {p.totalGrossWorkDone > p.totalCost ? (
                            <><CheckCircle2 className="w-3 h-3" /> Profitable</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3" /> In Progress</>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {projects.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td className="px-5 py-3.5 text-slate-900">Total Portfolio</td>
                  <td className="px-4 py-3.5 text-right text-slate-900">{formatINR(summary.totalContractValue)}</td>
                  <td className="px-4 py-3.5 text-right text-emerald-600">{formatINR(summary.totalGrossWorkDone)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatINR(summary.totalMaterialCost)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatINR(summary.totalLabourCost)}</td>
                  <td className="px-4 py-3.5 text-right text-rose-600">{formatINR(summary.totalCost)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-900">{formatINR(summary.totalNetProfit)}</td>
                  <td className="px-4 py-3.5 text-center text-slate-500 font-semibold text-[11px]">
                    Net Cash: {formatINR(summary.totalNetCashFlow)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  </FeatureGate>
  );
}
