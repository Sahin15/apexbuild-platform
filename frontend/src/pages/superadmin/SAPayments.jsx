import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle2, XCircle, Plus, RefreshCw, IndianRupee, Clock, ShieldAlert, FileText, Ban } from 'lucide-react';

export default function SAPayments() {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    organizationId: '', 
    invoiceId: '',
    amount: '', 
    paymentMethod: 'CASH', 
    transactionReference: '' 
  });
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, accRes, invRes] = await Promise.all([
        api.get('/platform/payments'),
        api.get('/platform/business-accounts'),
        api.get('/platform/invoices')
      ]);
      setPayments(payRes.data.data);
      setAccounts(accRes.data.data.accounts);
      setInvoices(invRes.data.data.filter(inv => inv.status !== 'PAID')); // Only show unpaid invoices
    } catch (error) {
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this payment as ${status}?`)) return;
    try {
      await api.post(`/platform/payments/${id}/verify`, { status });
      toast.success(`Payment marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.amount) {
      return toast.error("Please fill required fields");
    }
    try {
      await api.post('/platform/payments', {
        ...formData,
        amount: Number(formData.amount)
      });
      toast.success('Manual payment recorded successfully!');
      setIsModalOpen(false);
      setFormData({ organizationId: '', invoiceId: '', amount: '', paymentMethod: 'CASH', transactionReference: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add manual payment');
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'VERIFIED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Verified', icon: CheckCircle2 },
      'SUBMITTED': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Under Review', icon: Clock },
      'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', icon: Clock },
      'REJECTED': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected', icon: Ban },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: ShieldAlert };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${s.bg} ${s.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Verify and log manual offline transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Log Payment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Payments Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">There are no payment records in the system.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold hover:underline">Log First Payment</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method & Ref</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(pay => (
                  <tr key={pay._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{pay.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{pay.invoiceId ? `Linked: ${pay.invoiceId.invoiceNumber}` : 'Unlinked Payment'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <IndianRupee className="w-3.5 h-3.5 opacity-60"/>
                        {pay.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{pay.paymentMethod}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{pay.transactionReference || 'No Ref ID'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pay.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pay.status === 'SUBMITTED' || pay.status === 'UNDER_REVIEW' || pay.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleVerify(pay._id, 'VERIFIED')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Verify Payment">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleVerify(pay._id, 'REJECTED')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Reject Payment">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm font-medium">{pay.status === 'VERIFIED' ? 'Processed' : 'Closed'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl relative my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600"/> 
                Log Manual Payment
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Account <span className="text-rose-500">*</span></label>
                <select required value={formData.organizationId} onChange={e => setFormData({...formData, organizationId: e.target.value, invoiceId: ''})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Link to Invoice (Optional)</label>
                <select value={formData.invoiceId} onChange={e => {
                  const invId = e.target.value;
                  const inv = invoices.find(i => i._id === invId);
                  setFormData({...formData, invoiceId: invId, amount: inv ? inv.dueAmount : formData.amount});
                }} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" disabled={!formData.organizationId}>
                  <option value="">No linked invoice (Unallocated Credit)</option>
                  {invoices.filter(i => i.organizationId?._id === formData.organizationId).map(inv => (
                    <option key={inv._id} value={inv._id}>{inv.invoiceNumber} (Due: ₹{inv.dueAmount})</option>
                  ))}
                </select>
                {formData.organizationId && invoices.filter(i => i.organizationId?._id === formData.organizationId).length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No pending invoices for this account.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount Paid (₹) <span className="text-rose-500">*</span></label>
                  <input required type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference ID</label>
                <input type="text" value={formData.transactionReference} onChange={e => setFormData({...formData, transactionReference: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. UTR Number, Receipt #" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
