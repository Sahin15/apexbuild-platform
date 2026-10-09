import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, ArrowLeftRight, CheckCircle2, ShieldAlert,
  AlertTriangle, RefreshCw, IndianRupee, Clock, Search, MoreVertical, Ban, PauseCircle
} from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function SASubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    organizationId: '', 
    osProductId: '', 
    osPlanId: '', 
    billingCycle: 'monthly',
    status: 'ACTIVE',
    discount: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, accRes, prodRes, planRes] = await Promise.all([
        api.get('/platform/subscriptions'),
        api.get('/platform/business-accounts'),
        api.get('/platform/os-products'),
        api.get('/platform/os-plans')
      ]);
      setSubscriptions(subRes.data.data.subscriptions);
      setAccounts(accRes.data.data.accounts);
      setProducts(prodRes.data.data);
      setPlans(planRes.data.data);
    } catch (error) {
      toast.error("Failed to load Subscriptions data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccountChange = (e) => {
    const orgId = e.target.value;
    const org = accounts.find(a => a._id === orgId);
    
    if (org) {
      const bType = org.businessType;
      let matchedProduct = null;
      
      if (bType === 'DIAGNOSTICS') matchedProduct = products.find(p => p.name.toUpperCase().includes('DIAGNOSTICS'));
      else if (bType === 'CONTRACTOR') matchedProduct = products.find(p => p.name.toUpperCase().includes('CONTRACTOR'));
      else if (bType === 'CHICKEN_DISTRIBUTOR') matchedProduct = products.find(p => p.name.toUpperCase().includes('DISTRIBUTOR'));
      else if (bType === 'MATERIAL_SUPPLIER') matchedProduct = products.find(p => p.name.toUpperCase().includes('SUPPLIER'));
      
      if (!matchedProduct) {
        matchedProduct = products.find(p => p.name.toUpperCase().includes(bType.split('_')[0]));
      }

      setFormData({
        ...formData,
        organizationId: orgId,
        osProductId: matchedProduct ? matchedProduct._id : '',
        osPlanId: ''
      });
    } else {
      setFormData({ ...formData, organizationId: orgId, osProductId: '', osPlanId: '' });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.osPlanId || !formData.osProductId) {
      return toast.error("Please fill in all required fields.");
    }
    try {
      await api.post('/platform/subscriptions', formData);
      toast.success('Subscription assigned successfully');
      setIsModalOpen(false);
      setFormData({ organizationId: '', osProductId: '', osPlanId: '', billingCycle: 'monthly', status: 'ACTIVE', discount: 0 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;
    try {
      await api.patch(`/platform/subscriptions/${id}/status`, { status: newStatus });
      toast.success(`Subscription marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update subscription status');
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'ACTIVE': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active', icon: CheckCircle2 },
      'PENDING_PAYMENT': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Payment Pending', icon: Clock },
      'SUSPENDED': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Suspended', icon: PauseCircle },
      'CANCELLED': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled', icon: Ban },
    };
    const s = map[status] || { bg: 'bg-indigo-100', text: 'text-indigo-700', label: status, icon: ShieldAlert };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${s.bg} ${s.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sub.organizationId?.name?.toLowerCase().includes(q) || 
           sub.osProductId?.name?.toLowerCase().includes(q) ||
           sub.osPlanId?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage tenant plans, billing cycles, and access controls</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search subscriptions..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors hidden md:block">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors text-sm w-full md:w-auto">
            <Plus className="w-4 h-4" /> Assign Subscription
          </button>
        </div>
      </div>

      {/* List view */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Subscriptions Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Tenants have not been assigned to any OS Plans yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold hover:underline">Assign First Subscription</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant (Business Account)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product & Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Billing</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map(sub => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{sub.organizationId?.name || 'Unknown Account'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{sub.organizationId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{sub.osProductId?.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">{sub.osPlanId?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Since: {formatDate(sub.startDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <IndianRupee className="w-3.5 h-3.5 opacity-60"/>
                        {sub.finalAmount.toLocaleString()} <span className="text-xs text-slate-500 font-medium">/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Next: {formatDate(sub.nextBillingDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {sub.status !== 'SUSPENDED' && sub.status !== 'CANCELLED' && (
                          <button onClick={() => handleStatusChange(sub._id, 'SUSPENDED')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Suspend Subscription">
                            <PauseCircle className="w-5 h-5" />
                          </button>
                        )}
                        {sub.status === 'SUSPENDED' && (
                          <button onClick={() => handleStatusChange(sub._id, 'ACTIVE')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Reactivate Subscription">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {sub.status !== 'CANCELLED' && (
                          <button onClick={() => handleStatusChange(sub._id, 'CANCELLED')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel Subscription">
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600"/> 
                Assign Subscription
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="subscriptionForm" onSubmit={handleCreate} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Business Account (Tenant) <span className="text-rose-500">*</span></label>
                <select required value={formData.organizationId} onChange={handleAccountChange} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.businessType?.replace('_', ' ') || 'Unknown'})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Select the tenant you are onboarding or upgrading.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OS Product <span className="text-rose-500">*</span></label>
                  <select required value={formData.osProductId} onChange={e => setFormData({...formData, osProductId: e.target.value, osPlanId: ''})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select OS Product</option>
                    {products.map(prod => (
                      <option key={prod._id} value={prod._id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pricing Plan <span className="text-rose-500">*</span></label>
                  <select required value={formData.osPlanId} onChange={e => setFormData({...formData, osPlanId: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" disabled={!formData.osProductId}>
                    <option value="">Select Plan</option>
                    {plans.filter(p => (p.osProductId?._id || p.osProductId) === formData.osProductId).map(plan => (
                      <option key={plan._id} value={plan._id}>{plan.name} (₹{plan.monthlyPrice}/mo)</option>
                    ))}
                  </select>
                  {formData.osProductId && plans.filter(p => (p.osProductId?._id || p.osProductId) === formData.osProductId).length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">No plans exist for this OS Product.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Billing Cycle</label>
                  <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Special Discount (₹)</label>
                  <input type="number" min="0" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="ACTIVE">Active (Immediate)</option>
                    <option value="PENDING_PAYMENT">Pending Payment</option>
                  </select>
                </div>
              </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" form="subscriptionForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Finalize Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
