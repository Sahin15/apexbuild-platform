import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Layers, Edit, Trash2, ShieldAlert,
  CheckCircle2, AlertTriangle, RefreshCw, IndianRupee, Infinity
} from 'lucide-react';

export default function SAOSPlans() {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    osProductId: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    setupFee: 0,
    isActive: true,
    description: '',
    supportLevel: 'standard',
    usageLimits: {
      users: -1,
      storageGB: 5,
      projects: -1,
      transactions: -1
    }
  });

  const supportLevels = ['standard', 'priority', 'dedicated'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodsRes] = await Promise.all([
        api.get('/platform/os-plans'),
        api.get('/platform/os-products')
      ]);
      setPlans(plansRes.data.data);
      setProducts(prodsRes.data.data);
    } catch (error) {
      toast.error("Failed to load Plans data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        osProductId: plan.osProductId?._id || plan.osProductId,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        setupFee: plan.setupFee || 0,
        isActive: plan.isActive,
        description: plan.description || '',
        supportLevel: plan.supportLevel || 'standard',
        usageLimits: plan.usageLimits || { users: -1, storageGB: 5, projects: -1, transactions: -1 }
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '', osProductId: '', monthlyPrice: 0, yearlyPrice: 0, setupFee: 0,
        isActive: true, description: '', supportLevel: 'standard',
        usageLimits: { users: -1, storageGB: 5, projects: -1, transactions: -1 }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.osProductId) {
      return toast.error("Please select a target OS Product");
    }
    try {
      if (editingPlan) {
        await api.patch(`/platform/os-plans/${editingPlan._id}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/platform/os-plans', formData);
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save Plan');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/platform/os-plans/${id}`);
      toast.success('Plan deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete Plan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plans & Pricing</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage subscription tiers and pricing strategies</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Pricing Plans Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Create pricing tiers for your OS products to start offering subscriptions to tenants.</p>
          <button onClick={() => openModal()} className="text-indigo-600 font-bold hover:underline">Create First Plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col group relative overflow-hidden">
              {!plan.isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              )}
              
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {plan.osProductId?.name || 'Unknown OS'}
                </span>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.isActive ? <CheckCircle2 className="w-3.5 h-3.5"/> : <ShieldAlert className="w-3.5 h-3.5"/>}
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">{plan.description || "Standard subscription tier"}</p>
              
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-black text-slate-900 flex items-center">
                  <IndianRupee className="w-6 h-6 mr-0.5 opacity-60"/>
                  {plan.monthlyPrice.toLocaleString()}
                </span>
                <span className="text-slate-500 font-medium mb-1">/mo</span>
              </div>
              
              <div className="space-y-3 bg-slate-50 rounded-xl p-4 mb-6 text-sm flex-1">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Yearly Price</span>
                  <span className="font-bold text-slate-800">₹{plan.yearlyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Setup Fee</span>
                  <span className="font-bold text-slate-800">₹{plan.setupFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Support</span>
                  <span className="font-bold text-slate-800 capitalize">{plan.supportLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User Limit</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {plan.usageLimits.users === -1 ? <><Infinity className="w-4 h-4"/> Unlimited</> : plan.usageLimits.users}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => openModal(plan)} 
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(plan._id, plan.name)} 
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600"/> 
                {editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="planForm" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Name <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Professional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target OS Product <span className="text-rose-500">*</span></label>
                  <select required value={formData.osProductId} onChange={e => setFormData({...formData, osProductId: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    <option value="">Select OS</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pricing Configuration</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Price (₹)</label>
                    <input required type="number" min="0" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Yearly Price (₹)</label>
                    <input required type="number" min="0" value={formData.yearlyPrice} onChange={e => setFormData({...formData, yearlyPrice: Number(e.target.value)})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Setup Fee (₹)</label>
                    <input required type="number" min="0" value={formData.setupFee} onChange={e => setFormData({...formData, setupFee: Number(e.target.value)})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Usage Limits</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" title="-1 for unlimited">Users (-1=unlimited)</label>
                    <input type="number" value={formData.usageLimits.users} onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, users: Number(e.target.value)}})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Storage (GB)</label>
                    <input type="number" min="0" value={formData.usageLimits.storageGB} onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, storageGB: Number(e.target.value)}})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Projects</label>
                    <input type="number" value={formData.usageLimits.projects} onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, projects: Number(e.target.value)}})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Transactions</label>
                    <input type="number" value={formData.usageLimits.transactions} onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, transactions: Number(e.target.value)}})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Support Level</label>
                  <select value={formData.supportLevel} onChange={e => setFormData({...formData, supportLevel: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {supportLevels.map(lvl => <option key={lvl} value={lvl} className="capitalize">{lvl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isActive" checked={formData.isActive === true} onChange={() => setFormData({...formData, isActive: true})} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isActive" checked={formData.isActive === false} onChange={() => setFormData({...formData, isActive: false})} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-medium text-slate-700">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows="2"></textarea>
              </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" form="planForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all">
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
