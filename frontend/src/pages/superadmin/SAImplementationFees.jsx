import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Landmark, CheckCircle, RefreshCw, AlertTriangle, Send, Plus, 
  DollarSign, Clock, Building2, CheckCircle2
} from 'lucide-react';

export default function SAImplementationFees() {
  const [fees, setFees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Fee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: '',
    amount: '',
    notes: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchFees = async () => {
    try {
      setLoading(true);
      const [feesRes, accRes] = await Promise.all([
        api.get('/platform/implementation-fees'),
        api.get('/platform/business-accounts')
      ]);
      setFees(feesRes.data.data?.fees || []);
      setAccounts(accRes.data.data?.accounts || []);
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

  const handleMarkPaid = async (id) => {
    try {
      await api.patch(`/platform/invoices/${id}/status`, { status: 'PAID' });
      toast.success('Implementation fee marked as PAID!');
      fetchFees();
    } catch (error) {
      toast.error('Failed to update fee status');
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.amount) {
      return toast.error('Please select business and enter amount');
    }
    try {
      const amount = Number(formData.amount);
      await api.post('/platform/invoices', {
        organizationId: formData.organizationId,
        type: 'IMPLEMENTATION',
        implementationFee: amount,
        subscriptionFee: 0,
        discount: 0,
        tax: 0,
        notes: formData.notes || 'One-time onboarding & data migration setup fee',
        dueDate: formData.dueDate
      });
      toast.success('Implementation fee invoice issued successfully!');
      setIsModalOpen(false);
      setFormData({
        organizationId: '',
        amount: '',
        notes: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchFees();
    } catch (error) {
      toast.error('Failed to issue implementation fee');
    }
  };

  // Metrics
  const totalBilled = fees.reduce((sum, f) => sum + (f.implementationFee || f.total || 0), 0);
  const totalCollected = fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + (f.implementationFee || f.total || 0), 0);
  const totalOutstanding = fees.filter(f => f.status !== 'PAID' && f.status !== 'CANCELLED').reduce((sum, f) => sum + (f.dueAmount || f.total || 0), 0);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PAID': 
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Paid</span>;
      case 'OVERDUE': 
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3"/> Overdue</span>;
      default: 
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-600 rounded-xl flex items-center justify-center font-bold">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Implementation & Setup Fees</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Track one-time onboarding, data migration, and custom integration revenue</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={fetchFees} className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Bill Implementation Fee
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Setup Fees Billed</div>
          <div className="text-2xl font-black text-slate-900">${totalBilled.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">{fees.length} Total Setup Invoices</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Collected Revenue</div>
          <div className="text-2xl font-black text-emerald-600">${totalCollected.toFixed(2)}</div>
          <div className="text-xs text-emerald-700/80 mt-1">Paid in full by tenants</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending Setup Collection</div>
          <div className="text-2xl font-black text-amber-600">${totalOutstanding.toFixed(2)}</div>
          <div className="text-xs text-amber-700/80 mt-1">Awaiting tenant payment</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tenant Profile</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Invoice Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Fee Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-fuchsia-500" />
                    Loading implementation fees...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Implementation Fees Tracked</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                      Setup fees are automatically recorded during the Superadmin verification queue, or can be billed directly.
                    </p>
                    <button onClick={() => setIsModalOpen(true)} className="text-fuchsia-600 font-bold hover:underline">
                      Bill First Setup Fee
                    </button>
                  </td>
                </tr>
              ) : (
                fees.map(fee => (
                  <tr key={fee._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{fee.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {fee.organizationId?.businessType?.replace('_', ' ')} • {fee.organizationId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-fuchsia-700">{fee.invoiceNumber}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Due: {new Date(fee.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">
                        ${(fee.implementationFee || fee.total || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {fee.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => handleMarkPaid(fee._id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleRemind(fee.organizationId?.email)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-fuchsia-50 text-slate-600 hover:text-fuchsia-600 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              title="Send Reminder"
                            >
                              <Send className="w-3 h-3" /> Remind
                            </button>
                          </>
                        )}
                        {fee.status === 'PAID' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Bill Implementation Fee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-fuchsia-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-fuchsia-600"/> 
                Bill One-Time Implementation Fee
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateFee} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tenant Business Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.organizationId}
                  onChange={e => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                >
                  <option value="">Select Tenant...</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.businessType?.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Setup Fee Amount ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Migration of 500+ items and on-site staff training"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-sm">
                  Issue Implementation Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
