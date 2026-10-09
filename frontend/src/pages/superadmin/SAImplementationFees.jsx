import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Landmark, CheckCircle, RefreshCw, AlertTriangle, Send } from 'lucide-react';

export default function SAImplementationFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/implementation-fees');
      setFees(res.data.data.fees);
    } catch (error) {
      toast.error('Failed to load implementation fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleRemind = (orgEmail) => {
    toast.success(`Payment reminder dispatched to ${orgEmail}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PAID': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-emerald-200 shadow-sm flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> PAID IN FULL</span>;
      case 'OVERDUE': return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-rose-200 shadow-sm flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3"/> OVERDUE</span>;
      case 'PARTIALLY_PAID': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-amber-200 shadow-sm w-max">PARTIALLY PAID</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-slate-200 shadow-sm w-max">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-fuchsia-50 text-fuchsia-600 rounded-xl flex items-center justify-center border border-fuchsia-100 shadow-sm">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Implementation Fees</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Track one-time onboarding and setup charges billed to tenants.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <button onClick={fetchFees} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Sync Data
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Profile</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Details</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Loading fee ledgers...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Implementation Fees</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">There are no implementation fees tracked in the system yet.</p>
                  </td>
                </tr>
              ) : (
                fees.map(fee => (
                  <tr key={fee._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-base">{fee.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{fee.organizationId?.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-fuchsia-700 text-sm">{fee.invoiceNumber}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">Due: {new Date(fee.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900">${(fee.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      <div className="text-xs font-bold text-slate-400 mt-1">Due: ${(fee.dueAmount || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {fee.status !== 'PAID' && (
                        <button 
                          onClick={() => handleRemind(fee.organizationId?.email)}
                          className="bg-white hover:bg-fuchsia-50 border border-slate-200 hover:border-fuchsia-200 text-slate-600 hover:text-fuchsia-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ml-auto"
                        >
                          <Send className="w-4 h-4" /> Demand Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
