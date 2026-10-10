import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, CheckCircle2, ShieldAlert, AlertTriangle, RefreshCw, 
  Clock, Search, MoreVertical, Ban, PauseCircle, Edit, DollarSign,
  TrendingUp, Building2, Calendar, Tag, ShieldCheck
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Assign Subscription Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    organizationId: '', 
    osProductId: '', 
    osPlanId: '', 
    billingCycle: 'monthly',
    customPrice: '',
    discount: 0,
    status: 'ACTIVE'
  });

  // Edit Subscription / Custom Contract Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [editForm, setEditForm] = useState({
    osPlanId: '',
    billingCycle: 'monthly',
    customPrice: '',
    discount: 0,
    status: 'ACTIVE',
    nextBillingDate: ''
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
      setSubscriptions(subRes.data.data?.subscriptions || []);
      setAccounts(accRes.data.data?.accounts || []);
      setProducts(prodRes.data.data?.products || prodRes.data.data || []);
      setPlans(planRes.data.data?.plans || planRes.data.data || []);
    } catch (error) {
      toast.error("Failed to load subscriptions data");
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
      let matchedProduct = products.find(p => 
        p.code === bType || 
        p.name?.toUpperCase().includes(bType.replace('_', ' '))
      );
      if (!matchedProduct && products.length > 0) matchedProduct = products[0];

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
      const selectedPlan = plans.find(p => p._id === formData.osPlanId);
      const basePrice = selectedPlan ? (formData.billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice) : 0;
      const customPrice = formData.customPrice !== '' ? Number(formData.customPrice) : basePrice;
      const discount = Number(formData.discount) || 0;
      const finalAmount = Math.max(0, customPrice - discount);

      await api.post('/platform/subscriptions', {
        ...formData,
        basePrice,
        customPrice,
        discount,
        finalAmount
      });
      toast.success('Subscription provisioned successfully');
      setIsModalOpen(false);
      setFormData({ 
        organizationId: '', 
        osProductId: '', 
        osPlanId: '', 
        billingCycle: 'monthly', 
        customPrice: '',
        discount: 0,
        status: 'ACTIVE' 
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    }
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setEditForm({
      osPlanId: sub.osPlanId?._id || sub.osPlanId || '',
      billingCycle: sub.billingCycle || 'monthly',
      customPrice: sub.customPrice !== undefined ? String(sub.customPrice) : String(sub.basePrice || ''),
      discount: sub.discount || 0,
      status: sub.status || 'ACTIVE',
      nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      const selectedPlan = plans.find(p => p._id === editForm.osPlanId);
      const basePrice = selectedPlan ? (editForm.billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice) : editingSub.basePrice;
      const customPrice = editForm.customPrice !== '' ? Number(editForm.customPrice) : basePrice;
      const discount = Number(editForm.discount) || 0;

      await api.patch(`/platform/subscriptions/${editingSub._id}`, {
        osPlanId: editForm.osPlanId,
        billingCycle: editForm.billingCycle,
        basePrice,
        customPrice,
        discount,
        status: editForm.status,
        nextBillingDate: editForm.nextBillingDate ? new Date(editForm.nextBillingDate) : undefined
      });

      toast.success('Subscription terms updated successfully!');
      setEditModalOpen(false);
      setEditingSub(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/platform/subscriptions/${id}/status`, { status: newStatus });
      toast.success(`Subscription marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update subscription status');
    }
  };

  // Metrics
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
  const totalMRR = activeSubs.reduce((sum, s) => {
    const rate = s.finalAmount || 0;
    return sum + (s.billingCycle === 'yearly' ? rate / 12 : rate);
  }, 0);
  const customRateCount = subscriptions.filter(s => s.discount > 0 || (s.customPrice && s.customPrice !== s.basePrice)).length;
  const overdueCount = subscriptions.filter(s => s.status === 'PAYMENT_DUE' || s.status === 'RESTRICTED').length;

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.organizationId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.organizationId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.osProductId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const map = {
      'ACTIVE': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active', icon: CheckCircle2 },
      'PAYMENT_DUE': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Payment Due', icon: Clock },
      'GRACE_PERIOD': { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Grace Period', icon: AlertTriangle },
      'RESTRICTED': { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Restricted', icon: ShieldAlert },
      'SUSPENDED': { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Suspended', icon: Ban },
      'CANCELLED': { bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Cancelled', icon: PauseCircle },
    };
    const s = map[status] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status, icon: Clock };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OS Subscriptions & Custom Contracts</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage recurring contracts, custom negotiated pricing, and renewals across tenants</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Provision Subscription
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Subscriptions</div>
          <div className="text-2xl font-black text-slate-900">{activeSubs.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across all vertical OSs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Estimated MRR</div>
          <div className="text-2xl font-black text-emerald-600">₹{totalMRR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-emerald-700/80 mt-1">ARR: ₹{(totalMRR * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Custom Contracts</div>
          <div className="text-2xl font-black text-indigo-600">{customRateCount}</div>
          <div className="text-xs text-indigo-700/80 mt-1">Tailored discounts / pricing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Overdue / Past Due</div>
          <div className="text-2xl font-black text-amber-600">{overdueCount}</div>
          <div className="text-xs text-amber-700/80 mt-1">Action required</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tenant or OS..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAYMENT_DUE">Payment Due</option>
            <option value="RESTRICTED">Restricted</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tenant Business</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">OS Product & Tier</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Pricing Terms</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Net Rate</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Next Renewal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No subscriptions found</p>
                    <p className="text-xs text-slate-400 mt-1">Verify tenant accounts or click 'Provision Subscription' above.</p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map(sub => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{sub.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{sub.organizationId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-indigo-700">{sub.osProductId?.name || 'General OS'}</div>
                      <div className="text-xs text-slate-500 font-medium">Plan: {sub.osPlanId?.name || 'Standard Tier'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-slate-700">{sub.billingCycle}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div>Base: ₹{sub.basePrice?.toLocaleString()}</div>
                      {sub.customPrice && sub.customPrice !== sub.basePrice && (
                        <div className="text-indigo-600 font-bold">Custom: ₹{sub.customPrice?.toLocaleString()}</div>
                      )}
                      {sub.discount > 0 && (
                        <div className="text-emerald-600 font-medium">Discount: -₹{sub.discount?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        ₹{sub.finalAmount?.toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal">/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Edit Custom Terms"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Terms
                        </button>
                        {sub.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(sub._id, 'SUSPENDED')}
                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                            title="Suspend Subscription"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(sub._id, 'ACTIVE')}
                            className="px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors"
                            title="Reactivate Subscription"
                          >
                            Reactivate
                          </button>
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

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT SUBSCRIPTION / CUSTOM CONTRACT MODAL                        */}
      {/* ========================================================================= */}
      {editModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600"/> 
                Adjust Contract Terms - {editingSub.organizationId?.name}
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Assigned Plan Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.osPlanId}
                  onChange={e => {
                    const newPlanId = e.target.value;
                    const newPlan = plans.find(p => p._id === newPlanId);
                    const newPrice = newPlan ? (editForm.billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice) : '';
                    setEditForm({ ...editForm, osPlanId: newPlanId, customPrice: String(newPrice) });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {plans
                    .filter(p => {
                      const subProdId = editingSub?.osProductId?._id || editingSub?.osProductId;
                      const planProdId = p.osProductId?._id || p.osProductId;
                      return !subProdId || planProdId === subProdId;
                    })
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        [{p.tier === 'ENTERPRISE' ? 'Tier 2 Enterprise' : 'Tier 1 Starter'}] {p.name} (₹{p.monthlyPrice}/mo, ₹{p.yearlyPrice}/yr)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Billing Frequency</label>
                  <select
                    value={editForm.billingCycle}
                    onChange={e => setEditForm({ ...editForm, billingCycle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Subscription Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAYMENT_DUE">Payment Due</option>
                    <option value="GRACE_PERIOD">Grace Period</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Custom Negotiated Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1499"
                    value={editForm.customPrice}
                    onChange={e => setEditForm({ ...editForm, customPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Contract Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={editForm.discount}
                    onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Next Renewal Date</label>
                <input
                  type="date"
                  value={editForm.nextBillingDate}
                  onChange={e => setEditForm({ ...editForm, nextBillingDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Net Calculated Rate:</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  ₹{Math.max(0, (Number(editForm.customPrice) || 0) - (Number(editForm.discount) || 0)).toLocaleString()} / {editForm.billingCycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROVISION NEW SUBSCRIPTION MODAL                                */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600"/> 
                Provision OS Subscription
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tenant Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.organizationId}
                  onChange={handleAccountChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Business...</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.businessType?.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  OS Product <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.osProductId}
                  onChange={e => setFormData({ ...formData, osProductId: e.target.value, osPlanId: '' })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select OS Product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Plan Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!formData.osProductId}
                  value={formData.osPlanId}
                  onChange={e => setFormData({ ...formData, osPlanId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">Select Tier...</option>
                  {plans
                    .filter(p => (p.osProductId?._id || p.osProductId) === formData.osProductId)
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        [{p.tier === 'ENTERPRISE' ? 'Tier 2 Enterprise' : 'Tier 1 Starter'}] {p.name} - ₹{p.monthlyPrice}/mo
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Custom Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Leave blank for base"
                    value={formData.customPrice}
                    onChange={e => setFormData({ ...formData, customPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Discount (₹)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="0"
                  value={formData.discount}
                  onChange={e => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm">
                  Provision Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
