import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, ShieldAlert, FileText, Search, RefreshCw, Activity, Terminal, ArrowRight, User } from 'lucide-react';

export default function SAAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/audit-logs');
      setLogs(res.data.data.logs);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ActionBadge = ({ action }) => {
    let colorClass = 'bg-slate-100 text-slate-700';
    
    if (action.includes('CREATED') || action.includes('GENERATED') || action.includes('RECORDED')) {
      colorClass = 'bg-emerald-100 text-emerald-700';
    } else if (action.includes('UPDATED') || action.includes('VERIFIED')) {
      colorClass = 'bg-indigo-100 text-indigo-700';
    } else if (action.includes('DELETED') || action.includes('SUSPENDED') || action.includes('REJECTED') || action.includes('CANCELLED')) {
      colorClass = 'bg-rose-100 text-rose-700';
    } else if (action.includes('LOGIN') || action.includes('AUTH')) {
      colorClass = 'bg-amber-100 text-amber-700';
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-tight ${colorClass}`}>
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return log.action.toLowerCase().includes(q) || 
           log.adminId?.name?.toLowerCase().includes(q) ||
           log.entityType.toLowerCase().includes(q) ||
           log.ipAddress.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Immutable record of all super admin actions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search actions, IPs, admins..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors hidden md:block">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading security logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Audit Records Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">There are no administrative actions logged matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action Event</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target Entity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">IP / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{log.adminId?.name || 'System Auto'}</div>
                          {log.adminId?.platformRole && (
                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{log.adminId.platformRole.replace('_', ' ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        {log.entityType}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-[200px]" title={log.entityId}>
                        ID: {log.entityId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-xs text-slate-600 font-bold">{log.ipAddress}</div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px] ml-auto" title={log.userAgent}>
                        {log.userAgent?.split(' ')[0] || 'Unknown Device'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
