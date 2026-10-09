import { useState, useEffect } from 'react';
import { Users, ClipboardList, Activity, TestTube2, AlertCircle, Plus, ChevronRight, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DiagnosticsDashboard = () => {
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
      <div className="flex justify-center items-center h-full pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    { name: "Today's Patients", value: analytics.patients.newToday, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Tests Ordered', value: analytics.orders.totalToday, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Pending Samples', value: analytics.samples.pending, icon: TestTube2, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Reports Ready', value: analytics.orders.completedToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
        </div>
      </div>

      {/* Quick Actions - Mobile First Design */}
      <div className="grid grid-cols-4 gap-3 md:flex md:space-x-4">
        <Link to="/diagnostics/patients" className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700 text-center">New Patient</span>
        </Link>
        <Link to="/diagnostics/orders" className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700 text-center">New Order</span>
        </Link>
        <Link to="/diagnostics/samples" className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
            <TestTube2 className="h-5 w-5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700 text-center">Collect</span>
        </Link>
        <Link to="/diagnostics/reports" className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700 text-center">Verify</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Required */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-base font-bold text-red-900">Action Required</h3>
              </div>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">1 Issue</span>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-start">
                <div className="mt-0.5">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Pending Reports</p>
                  <p className="text-sm text-gray-500 mt-1">There are {analytics.orders.pendingResults} orders awaiting result entry or verification.</p>
                  <Link to="/diagnostics/results" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">View Pending Results &rarr;</Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Summaries */}
        <div className="space-y-6">
          
          {/* Daily Revenue Overview */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Today's Revenue</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold">₹{analytics.revenue.totalToday.toLocaleString('en-IN')}</h2>
            <div className="mt-4 bg-gray-800/50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Collected</p>
                <p className="font-semibold text-green-400">₹{analytics.revenue.collectionsToday.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Pending Due</p>
                <p className="font-semibold text-red-400">₹{(analytics.revenue.totalToday - analytics.revenue.collectionsToday).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Operational Status Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Lab Queue</h3>
            </div>
            <div className="p-5 space-y-5">
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Pending Collection</span>
                  <span className="font-bold text-gray-900">{analytics.samples.pending}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Processing In Lab</span>
                  <span className="font-bold text-gray-900">{analytics.samples.inLab}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Pending Results</span>
                  <span className="font-bold text-gray-900">{analytics.orders.pendingResults}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DiagnosticsDashboard;
