import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Receipt, FileText, Plus, RefreshCw, IndianRupee, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function SAInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    organizationId: '', 
    type: 'IMPLEMENTATION', 
    amount: '', 
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, accRes] = await Promise.all([
        api.get('/platform/invoices'),
        api.get('/platform/business-accounts')
      ]);
      setInvoices(invRes.data.data);
      setAccounts(accRes.data.data.accounts);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.amount) {
      return toast.error("Please provide account and amount");
    }
    try {
      const amount = Number(formData.amount);
      const payload = {
        organizationId: formData.organizationId,
        type: formData.type,
        implementationFee: formData.type === 'IMPLEMENTATION' ? amount : 0,
        subscriptionFee: formData.type !== 'IMPLEMENTATION' ? amount : 0,
        dueDate: formData.dueDate
      };

      await api.post('/platform/invoices', payload);
      toast.success('Invoice generated successfully!');
      setIsModalOpen(false);
      setFormData({ 
        organizationId: '', 
        type: 'IMPLEMENTATION', 
        amount: '', 
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'PAID': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid', icon: CheckCircle2 },
      'PARTIALLY_PAID': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Partial', icon: CheckCircle2 },
      'ISSUED': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Issued (Pending)', icon: Clock },
      'OVERDUE': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Overdue', icon: AlertTriangle },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: Receipt };
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
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Generate and track tenant billing operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Invoices Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">You have not generated any manual or automatic invoices yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold hover:underline">Create First Invoice</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Account</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{inv.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{inv.organizationId?.businessType?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{inv.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <IndianRupee className="w-3.5 h-3.5 opacity-60"/>
                        {inv.total.toLocaleString()}
                      </div>
                      {inv.dueAmount > 0 && inv.dueAmount < inv.total && (
                        <div className="text-xs text-amber-600 mt-0.5">Due: ₹{inv.dueAmount.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download PDF">
                        <FileText className="w-5 h-5" />
                      </button>
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
                <Receipt className="w-5 h-5 text-indigo-600"/> 
                Generate Invoice
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Account <span className="text-rose-500">*</span></label>
                <select required value={formData.organizationId} onChange={e => setFormData({...formData, organizationId: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="">Select Tenant Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="IMPLEMENTATION">Implementation Fee</option>
                    <option value="CUSTOM">Custom Service</option>
                    <option value="ADDON">Add-on Module</option>
                    <option value="SUBSCRIPTION">Subscription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-2">Base Amount (₹) <span className="text-rose-500">*</span></label>
                <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Enter base amount" />
                <p className="text-xs text-slate-500 mt-2">Note: 18% GST will be calculated and added automatically to the final invoice total.</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
