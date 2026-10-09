import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Activity, Users, TrendingUp, UserMinus, BarChart3, Target, PieChart, ArrowUpRight
} from 'lucide-react';

export default function SADeepAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/deep-analytics');
      setAnalytics(res.data.data);
    } catch (error) {
      toast.error('Failed to load deep analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deep Analytics</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Platform engagement, retention, and feature adoption metrics.</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">User Growth</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">{analytics.userGrowth}</h2>
            <span className="text-xs font-bold text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> MoM</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
            <UserMinus className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Churn Rate</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">{analytics.churnRate}%</h2>
            <span className="text-xs font-bold text-slate-400 text-slate-500">Annualized</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Monthly Active Users (MAU)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">{analytics.mau.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Daily Active Users (DAU)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">{analytics.dau.toLocaleString()}</h2>
            <span className="text-xs font-bold text-slate-400 text-slate-500">{((analytics.dau / Math.max(1, analytics.mau)) * 100).toFixed(1)}% ratio</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Adoption */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <PieChart className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 text-lg">Feature Adoption</h2>
          </div>
          <div className="p-6 space-y-6">
            {analytics.featureAdoption.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">{item.feature}</span>
                  <span className="font-bold text-indigo-600">{item.adoption}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${item.adoption}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty placeholder for future charts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 text-lg">Retention Cohorts</h2>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center bg-slate-50/50">
            <div className="text-center text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">More detailed cohort data collection is running.</p>
              <p className="text-xs mt-1">Graphs will appear once sufficient data is aggregated.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
