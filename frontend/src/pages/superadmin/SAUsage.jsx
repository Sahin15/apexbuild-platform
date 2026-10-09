import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Activity, HardDrive, Network, Users, ArrowLeftRight, Server, Zap } from 'lucide-react';

export default function SAUsage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/usage');
      setMetrics(res.data.data);
    } catch (error) {
      toast.error('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Usage</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Global macro-level telemetry and resource consumption.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Gathering telemetry...</p>
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Storage Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Storage</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{formatBytes(metrics.totalStorageBytes)}</div>
              <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <Server className="w-4 h-4 text-emerald-500" /> Database & Media
              </div>
            </div>
          </div>

          {/* API Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Traffic</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{formatNumber(metrics.totalApiRequests)} <span className="text-xl text-slate-400 font-bold">reqs</span></div>
              <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <Zap className="w-4 h-4 text-emerald-500" /> Across all orgs (est.)
              </div>
            </div>
          </div>

          {/* Active Seats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Seats</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{formatNumber(metrics.activeSeats)}</div>
              <div className="text-sm font-medium text-slate-500">
                Provisioned tenant users
              </div>
            </div>
          </div>

          {/* Bandwidth */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bandwidth Consumed</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{formatBytes(metrics.bandwidthBytes)}</div>
              <div className="text-sm font-medium text-slate-500">
                Data transferred
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-xl font-bold text-slate-800 mb-1">No Telemetry Available</p>
        </div>
      )}
    </div>
  );
}
