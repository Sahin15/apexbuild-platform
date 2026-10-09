import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Activity, RefreshCw, TrendingUp, DollarSign, Wallet, ArrowUpRight, CheckCircle } from 'lucide-react';

export default function SARevenue() {
  const [analytics, setAnalytics] = useState({
    mrr: 0,
    arr: 0,
    totalCollected: 0,
    totalOutstanding: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/revenue-analytics');
      setAnalytics(res.data.data);
    } catch (error) {
      toast.error('Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Revenue Intelligence</h1>
            <p className="text-emerald-200 text-sm font-medium mt-1">Real-time macro-level financial analytics and projections.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <button onClick={fetchAnalytics} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Sync Metrics
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-emerald-300 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">Monthly Recurring</h3>
            </div>
            {loading ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse w-3/4"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${(analytics.mrr || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                <span className="text-emerald-500 font-bold text-sm flex items-center"><ArrowUpRight className="w-4 h-4"/> 12%</span>
              </div>
            )}
            <p className="text-xs text-slate-500 font-medium mt-2 border-t border-slate-100 pt-3">Projected MRR based on active plans</p>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-teal-300 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 rounded-full blur-2xl group-hover:bg-teal-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">Annual Run Rate</h3>
            </div>
            {loading ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse w-3/4"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${(analytics.arr || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                <span className="text-teal-500 font-bold text-sm flex items-center"><ArrowUpRight className="w-4 h-4"/> 18%</span>
              </div>
            )}
            <p className="text-xs text-slate-500 font-medium mt-2 border-t border-slate-100 pt-3">Projected 12-month trailing revenue</p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-indigo-300 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">Net Collected</h3>
            </div>
            {loading ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse w-3/4"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${(analytics.totalCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              </div>
            )}
            <p className="text-xs text-slate-500 font-medium mt-2 border-t border-slate-100 pt-3">Total historical captured payments</p>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-amber-300 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">A/R Outstanding</h3>
            </div>
            {loading ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse w-3/4"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${(analytics.totalOutstanding || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              </div>
            )}
            <p className="text-xs text-amber-600 font-bold mt-2 border-t border-slate-100 pt-3">Action required: Follow up on invoices</p>
          </div>
        </div>
      </div>
      
      {/* Chart Mockup (Placeholder for future Chart.js/Recharts implementation) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Revenue Trajectory (YTD)</h2>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-4 py-2 outline-none">
            <option>Last 12 Months</option>
            <option>Year to Date</option>
            <option>All Time</option>
          </select>
        </div>
        
        <div className="h-72 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
          {/* Aesthetic Mockup Lines */}
          <div className="absolute bottom-0 left-0 w-full h-full opacity-20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 L0,80 Q25,90 50,60 T100,20 L100,100 Z" fill="url(#grad)" />
              <path d="M0,80 Q25,90 50,60 T100,20" fill="none" stroke="#10b981" strokeWidth="2" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative z-10 text-center">
            <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Interactive Visualizations</p>
            <p className="text-slate-400 text-xs mt-2">To be populated by Recharts engine in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
