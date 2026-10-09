import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Monitor, Server, Cpu, HardDrive, Wifi, ShieldAlert, CheckCircle2, Activity
} from 'lucide-react';

export default function SAOSPerformance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/os-performance');
      setPerformance(res.data.data);
    } catch (error) {
      toast.error('Failed to load OS performance data');
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

  if (!performance) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-5"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <Monitor className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">OS Performance</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Real-time system health, resources, and infrastructure status.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">CPU Utilization</p>
            <h2 className="text-4xl font-black text-slate-900">{performance.cpuUsage}%</h2>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
              <div className={`h-1.5 rounded-full ${performance.cpuUsage > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${performance.cpuUsage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HardDrive className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Memory Allocation</p>
            <h2 className="text-4xl font-black text-slate-900">{performance.memoryUsage}%</h2>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
              <div className={`h-1.5 rounded-full ${performance.memoryUsage > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${performance.memoryUsage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-sky-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">API Latency</p>
            <h2 className="text-4xl font-black text-slate-900">{performance.apiLatency}</h2>
            <p className="text-xs font-semibold text-sky-600 mt-2 bg-sky-50 inline-block px-2 py-0.5 rounded">Global Average</p>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="w-16 h-16 text-amber-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">System Uptime</p>
            <h2 className="text-4xl font-black text-slate-900">{performance.uptime}</h2>
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Last 30 Days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <Wifi className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-800 text-lg">Subsystem Status</h2>
          </div>
          <div className="p-0">
            {performance.servicesStatus.map((service, index) => (
              <div key={index} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="font-semibold text-slate-700">{service.name}</div>
                <div>
                  {service.status === 'operational' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      Operational
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      <ShieldAlert className="w-3 h-3" />
                      Degraded
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-900 rounded-2xl shadow-sm overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-30"></div>
          
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 relative z-10">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-slate-100 text-lg">Live Telemetry</h2>
          </div>
          
          <div className="p-8 relative z-10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Websockets</p>
              <p className="text-3xl font-mono text-indigo-300">{performance.activeConnections.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Error Rate (5xx)</p>
              <p className="text-3xl font-mono text-emerald-400">{performance.errorRate}</p>
            </div>
            <div className="col-span-2 pt-4 border-t border-slate-800 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Database Cluster Connected
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Redis Cache Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
