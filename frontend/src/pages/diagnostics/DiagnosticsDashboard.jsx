import { useState, useEffect } from 'react';
import { 
  Users, ClipboardList, Activity, TestTube2, AlertCircle, 
  Plus, CheckCircle2, DollarSign, TrendingUp, Clock, 
  ChevronRight, FileText, ActivitySquare, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export default function DiagnosticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/diagnostics/analytics/dashboard');
        setAnalytics(res.data.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpis = [
    { name: "Today's Patients", value: analytics.patients.newToday, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Tests Ordered', value: analytics.orders.totalToday, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { name: 'Pending Samples', value: analytics.samples.pending, icon: TestTube2, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: 'Reports Ready', value: analytics.orders.completedToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostics Control Center</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Real-time overview of your laboratory operations.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link to="/diagnostics/patients" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-xl shadow-sm transition-all text-sm">
            <Users className="w-4 h-4" /> Patient
          </Link>
          <Link to="/diagnostics/orders" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition-all text-sm">
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((stat) => (
          <div key={stat.name} className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.name}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 relative z-10">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Stable Volume</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Critical Alerts */}
          {analytics.orders.pendingResults > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-rose-900">Action Required: Pending Reports</h3>
                <p className="text-sm text-rose-700 mt-0.5">
                  You have <span className="font-bold">{analytics.orders.pendingResults}</span> orders awaiting result entry or pathologist verification. Prompt action helps maintain TAT (Turnaround Time) targets.
                </p>
                <Link to="/diagnostics/results" className="inline-flex items-center gap-1 text-sm font-bold text-rose-700 hover:text-rose-800 mt-2">
                  View Pending Results <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Revenue & Volume Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">7-Day Revenue & Volume Trend</h3>
              <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-medium">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operational Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ActivitySquare className="w-5 h-5 text-indigo-500" /> Live Operational Queue
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <TestTube2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Samples Pending Collection</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Orders registered but samples not yet collected</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-extrabold text-slate-800">{analytics.samples.pending}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Samples In Lab Processing</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Samples accepted and currently under analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-extrabold text-slate-800">{analytics.samples.inLab}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Reports Awaiting Dispatch</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Results verified and ready for patients</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-extrabold text-slate-800">{analytics.orders.completedToday}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

            </div>
          </div>

          {/* Top Doctor Referral Contributions */}
          {analytics.topDoctors && analytics.topDoctors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">Top Referring Clinicians</h3>
                  <p className="text-xs text-slate-400">Doctor referral volume & commission tracking</p>
                </div>
                <Link to="/diagnostics/doctors" className="text-xs font-bold text-blue-600 hover:underline">
                  View All Doctors &rarr;
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {analytics.topDoctors.map((doc, idx) => (
                  <div key={doc._id || idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                        <p className="text-[10px] text-slate-500">{doc.specialization || 'General Physician'} • {doc.hospital || 'Private Clinic'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 font-mono block">
                        {doc.totalReferrals || 0} Referrals
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">
                        ₹{(doc.totalCommission || 0).toLocaleString('en-IN')} Payout
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Revenue Breakdown */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Background design */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Today's Revenue</h3>
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                ₹{analytics.revenue.totalToday.toLocaleString('en-IN')}
              </h2>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">Collected</p>
                  <p className="text-lg font-bold text-emerald-400">₹{analytics.revenue.collectionsToday.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">Due / Pending</p>
                  <p className="text-lg font-bold text-rose-400">₹{(analytics.revenue.totalToday - analytics.revenue.collectionsToday).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Volume by Department</h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.departmentData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(analytics.departmentData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-800">
                  {(analytics.departmentData || []).reduce((acc, d) => acc + d.value, 0)}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase">Tests</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2">
              {(analytics.departmentData || []).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-medium text-slate-600 truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Control (IQC) Analyzer Health */}
          {analytics.qcSummary && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Quality Control Status</h3>
                </div>
                <Link to="/diagnostics/qc" className="text-xs font-bold text-blue-600 hover:underline">
                  QC Station &rarr;
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Analyzers Monitored</span>
                  <p className="text-lg font-black text-slate-900">{analytics.qcSummary.totalLots || 0} Lots</p>
                </div>
                <div>
                  {analytics.qcSummary.status === 'ALERT' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      🚨 Out-of-Control
                    </span>
                  ) : analytics.qcSummary.status === 'WARNING' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                      ⚠️ QC Warning
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ In Control
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">In Control</span>
                  <p className="text-sm font-black text-emerald-800">{analytics.qcSummary.inControlLots || 0}</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">NABL ISO 15189</span>
                  <p className="text-sm font-black text-slate-800">Pass</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Support / Contact */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">ApexHealth Support</h3>
            <p className="text-xs text-slate-600 mb-4">Need help setting up a new diagnostic machine interface?</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm transition-colors shadow-sm">
              Contact Support
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
