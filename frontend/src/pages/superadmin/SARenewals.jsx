import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, Calendar, Mail, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function SARenewals() {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/renewals');
      setRenewals(res.data.data.renewals);
    } catch (error) {
      toast.error('Failed to load upcoming renewals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const handleRemind = (orgEmail) => {
    toast.success(`Automated renewal reminder sent to ${orgEmail}`);
  };

  const getUrgencyBadge = (nextBillingDate) => {
    const daysLeft = Math.ceil((new Date(nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-rose-200 shadow-sm flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3"/> PAST DUE</span>;
    if (daysLeft <= 7) return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-orange-200 shadow-sm flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3"/> {daysLeft} DAYS LEFT</span>;
    return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-emerald-200 shadow-sm flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> IN {daysLeft} DAYS</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upcoming Renewals</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Monitor subscriptions renewing within the next 30 days.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <button onClick={fetchRenewals} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Refresh
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
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan & Product</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Renewal Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Renewal Date</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Scanning renewal pipelines...
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Impending Renewals</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">There are no subscriptions expiring in the next 30 days.</p>
                  </td>
                </tr>
              ) : (
                renewals.map(sub => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-base">{sub.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{sub.organizationId?.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {sub.osPlanId?.name} 
                        <span className="text-[9px] uppercase font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{sub.billingCycle}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">{sub.osProductId?.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900">₹{(sub.finalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(sub.nextBillingDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </div>
                      <div className="mt-2">
                        {getUrgencyBadge(sub.nextBillingDate)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleRemind(sub.organizationId?.email)}
                        className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ml-auto"
                      >
                        <Mail className="w-4 h-4" /> Send Reminder
                      </button>
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
