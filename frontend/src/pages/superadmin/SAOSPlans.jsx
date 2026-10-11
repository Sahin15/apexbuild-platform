import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Layers, Edit, Trash2, ShieldAlert,
  CheckCircle2, AlertTriangle, RefreshCw, IndianRupee, Infinity,
  Check, Filter, Crown, Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';

const OS_FEATURE_OPTIONS = {
  CONTRACTOR: [
    { key: 'coreProjects', label: 'Projects & Clients Directory' },
    { key: 'boqEngine', label: 'BOQ & Measurement Calculation' },
    { key: 'dailyProgressReports', label: 'Site Daily Progress Reports (DPR)' },
    { key: 'labourAttendance', label: 'Labor Attendance & Wages' },
    { key: 'materialTracking', label: 'Material Indents & Store Issues' },
    { key: 'snagVault', label: 'Site Snag & Defect Vault' },
    { key: 'pettyCashLedger', label: 'Site Imprest Petty Cash' },
    { key: 'machineryDiesel', label: 'Heavy Equipment & Diesel Telemetry' },
    { key: 'civilPnL', label: 'Cash Flow & Civil P&L Analytics' },
    { key: 'drawingVault', label: 'GFC Blueprint Drawing Vault' },
    { key: 'customBranding', label: 'White-Label Custom Branding' },
  ],
  MATERIAL_SUPPLIER: [
    { key: 'productCatalog', label: 'Product & SKU Catalog' },
    { key: 'salesOrders', label: 'Sales Orders & Invoicing' },
    { key: 'customerLedger', label: 'Customer Balance Ledger' },
    { key: 'directCustomerLedger', label: 'Customer Credit Limit Statements' },
    { key: 'vehicleFleet', label: 'Vehicle Fleet & Driver Dispatch' },
    { key: 'inventoryLedger', label: 'Multi-Warehouse Stock Ledger' },
    { key: 'automatedChallans', label: 'Digital E-Sign Delivery Challans' },
    { key: 'customBranding', label: 'White-Label Custom Branding' },
  ],
  CHICKEN_DISTRIBUTOR: [
    { key: 'customerLedger', label: 'Retailer Balance Ledger' },
    { key: 'estimations', label: 'Pre-Orders & Weight Estimations' },
    { key: 'supplierPurchases', label: 'Supplier Purchases & Mortality' },
    { key: 'stockLedger', label: 'Daily Live Bird Stock Count' },
    { key: 'vehicleFleet', label: 'Route Delivery Fleet Tracking' },
    { key: 'driverApp', label: 'Driver Mobile App Access' },
    { key: 'advancedFinancials', label: 'Automated Daily P&L Analysis' },
    { key: 'whatsAppInvoicing', label: 'WhatsApp Statements & Invoices' },
    { key: 'customBranding', label: 'White-Label Custom Branding' },
  ],
  DIAGNOSTICS: [
    { key: 'patientRegistration', label: 'Patient Demographics & Visits' },
    { key: 'testCatalog', label: 'Test Catalog & Reference Ranges' },
    { key: 'manualResults', label: 'Manual Result Entry & PDF Reports' },
    { key: 'sampleTracking', label: 'Specimen Barcode Accessioning' },
    { key: 'doctorCommissions', label: 'Doctor Referral Cuts Ledger' },
    { key: 'automatedDispatch', label: 'Automated WhatsApp Dispatch' },
    { key: 'qualityControl', label: 'Levey-Jennings QC Calibration' },
    { key: 'customBranding', label: 'White-Label Custom Letterhead' },
  ],
  RESTAURANT: [
    { key: 'posBasic', label: 'Touch POS & Counter Billing' },
    { key: 'dineInTables', label: 'Table Layout & Floor Management' },
    { key: 'kitchenDisplay', label: 'Live Kitchen Display System (KDS)' },
    { key: 'recipeCosting', label: 'Recipe BOM & Food Cost Margin Analysis' },
    { key: 'inventoryLedger', label: 'Ingredient Stock & Auto Order Deduction' },
    { key: 'cashierShifts', label: 'Cash Drawer Float & Blind Drop Close' },
    { key: 'multiStationKDS', label: 'Multi-Station KDS Routing (3+ Stations)' },
    { key: 'customBranding', label: 'White-Label Receipt & Bill Branding' },
  ]
};

export default function SAOSPlans() {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOSFilter, setSelectedOSFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    tier: 'STARTER',
    osProductId: '',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    setupFee: 0,
    isActive: true,
    description: '',
    supportLevel: 'standard',
    featureEntitlements: {},
    usageLimits: {
      users: 5,
      storageGB: 15,
      projects: 5,
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
      setPlans(plansRes.data?.data || []);
      setProducts(prodsRes.data?.data || []);
    } catch (error) {
      toast.error("Failed to load Plans data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter plans based on active OS product filter
  const filteredPlans = useMemo(() => {
    if (selectedOSFilter === 'ALL') return plans;
    return plans.filter(p => {
      const prod = p.osProductId;
      if (!prod) return false;
      const prodId = typeof prod === 'object' ? prod._id : prod;
      const bType = typeof prod === 'object' ? prod.businessType : '';
      return prodId === selectedOSFilter || bType === selectedOSFilter;
    });
  }, [plans, selectedOSFilter]);

  // Selected product in modal form
  const selectedProductInForm = useMemo(() => {
    return products.find(p => p._id === formData.osProductId);
  }, [products, formData.osProductId]);

  const activeOSFeatures = useMemo(() => {
    const bType = selectedProductInForm?.businessType || 'CONTRACTOR';
    return OS_FEATURE_OPTIONS[bType] || OS_FEATURE_OPTIONS.CONTRACTOR;
  }, [selectedProductInForm]);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        tier: plan.tier || (plan.name?.toLowerCase().includes('enterprise') ? 'ENTERPRISE' : 'STARTER'),
        osProductId: plan.osProductId?._id || plan.osProductId,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        setupFee: plan.setupFee || 0,
        isActive: plan.isActive,
        description: plan.description || '',
        supportLevel: plan.supportLevel || 'standard',
        featureEntitlements: plan.featureEntitlements || {},
        usageLimits: plan.usageLimits || { users: 5, storageGB: 15, projects: 5, transactions: -1 }
      });
    } else {
      // Auto-select OS product if filtered
      const defaultProdId = (selectedOSFilter !== 'ALL' && products.some(p => p._id === selectedOSFilter))
        ? selectedOSFilter
        : (products[0]?._id || '');

      setEditingPlan(null);
      setFormData({
        name: '', 
        tier: 'STARTER',
        osProductId: defaultProdId, 
        monthlyPrice: 1499, 
        yearlyPrice: 14990, 
        setupFee: 0,
        isActive: true, 
        description: '', 
        supportLevel: 'standard',
        featureEntitlements: {},
        usageLimits: { users: 5, storageGB: 15, projects: 5, transactions: -1 }
      });
    }
    setIsModalOpen(true);
  };

  const handleTierChange = (newTier) => {
    const isEnt = newTier === 'ENTERPRISE';
    setFormData(prev => ({
      ...prev,
      tier: newTier,
      monthlyPrice: isEnt ? 3499 : 1499,
      yearlyPrice: isEnt ? 34990 : 14990,
      supportLevel: isEnt ? 'dedicated' : 'standard',
      usageLimits: {
        users: isEnt ? -1 : 5,
        storageGB: isEnt ? 100 : 15,
        projects: isEnt ? -1 : 5,
        transactions: -1
      }
    }));
  };

  const handleFeatureToggle = (featureKey) => {
    setFormData(prev => ({
      ...prev,
      featureEntitlements: {
        ...prev.featureEntitlements,
        [featureKey]: !prev.featureEntitlements[featureKey]
      }
    }));
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
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"? This will remove it from the OS pricing grid.`)) return;
    try {
      await api.delete(`/platform/os-plans/${id}`);
      toast.success('Plan deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete Plan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">OS Plans & 2-Tier Pricing</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                2 Plans / OS
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Centrally manage, customize, and price the 2 tiers (Growth & Enterprise) for every OS vertical.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={() => openModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm transition-all text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* OS Product Selector Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setSelectedOSFilter('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedOSFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>All OS Products</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            selectedOSFilter === 'ALL' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {plans.length}
          </span>
        </button>

        {products.map(prod => {
          const countForOS = plans.filter(p => {
            const pId = typeof p.osProductId === 'object' ? p.osProductId?._id : p.osProductId;
            return pId === prod._id || (typeof p.osProductId === 'object' && p.osProductId?.businessType === prod.businessType);
          }).length;

          const isSelected = selectedOSFilter === prod._id || selectedOSFilter === prod.businessType;

          return (
            <button
              key={prod._id}
              onClick={() => setSelectedOSFilter(prod._id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{prod.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isSelected 
                  ? 'bg-indigo-500 text-white' 
                  : countForOS === 2 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {countForOS}/2 Plans
              </span>
            </button>
          );
        })}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-sm font-semibold">Loading OS pricing plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Plans Found for Selected OS</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
            Configure the 2 required tiers (Standard and Enterprise) for this operating system.
          </p>
          <button onClick={() => openModal()} className="text-indigo-600 font-bold hover:underline text-xs">
            + Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => {
            const isEnterprise = plan.tier === 'ENTERPRISE' || plan.name?.toLowerCase().includes('enterprise');

            return (
              <div 
                key={plan._id} 
                className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                  isEnterprise 
                    ? 'border-indigo-200 ring-1 ring-indigo-100' 
                    : 'border-slate-200'
                }`}
              >
                {/* Top OS and Tier Badges */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {plan.osProductId?.name || 'Core OS'}
                    </span>
                    
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      isEnterprise 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isEnterprise ? <Crown className="w-3 h-3 text-amber-600" /> : <ShieldCheck className="w-3 h-3 text-slate-500" />}
                      {isEnterprise ? 'Tier 2: Enterprise' : 'Tier 1: Standard'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1.5">{plan.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 min-h-[32px] mb-5 leading-relaxed font-medium">
                    {plan.description || "Active subscription tier"}
                  </p>

                  {/* Pricing Box */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 mb-5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-500">Monthly</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">₹{plan.monthlyPrice.toLocaleString()}</span>
                        <span className="text-xs font-medium text-slate-400 ml-1">/mo</span>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-xs font-bold text-slate-500">Annual</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700">₹{plan.yearlyPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">/yr</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Limits & Support */}
                  <div className="space-y-2 text-xs font-medium text-slate-600 mb-6">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Users Allowed</span>
                      <span className="font-bold text-slate-800">
                        {plan.usageLimits?.users === -1 ? 'Unlimited' : plan.usageLimits?.users || 5}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Storage Quota</span>
                      <span className="font-bold text-slate-800">{plan.usageLimits?.storageGB || 15} GB</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Support Level</span>
                      <span className="font-bold text-slate-800 capitalize">{plan.supportLevel || 'standard'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-2">
                  <button 
                    onClick={() => openModal(plan)} 
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> 
                    <span>Edit Plan</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(plan._id, plan.name)} 
                    className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 font-bold rounded-xl transition-colors cursor-pointer"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5"/> 
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingPlan ? 'Edit OS Pricing Plan' : 'Create OS Pricing Plan'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Configure tier parameters, limits, and feature toggles</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <form id="planForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Target OS Product & Tier Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target OS Product <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      required 
                      value={formData.osProductId} 
                      onChange={e => setFormData({...formData, osProductId: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select Target OS</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tier Level <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTierChange('STARTER')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.tier === 'STARTER'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-black'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Tier 1: Growth
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTierChange('ENTERPRISE')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.tier === 'ENTERPRISE'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-black'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Tier 2: Enterprise
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan Name & Support Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Plan Title <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. Contractor Enterprise Suite" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Support Level</label>
                    <select 
                      value={formData.supportLevel} 
                      onChange={e => setFormData({...formData, supportLevel: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none capitalize"
                    >
                      {supportLevels.map(lvl => <option key={lvl} value={lvl} className="capitalize">{lvl}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pricing Configuration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pricing (₹)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Price (₹)</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        value={formData.monthlyPrice} 
                        onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Annual Price (₹)</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        value={formData.yearlyPrice} 
                        onChange={e => setFormData({...formData, yearlyPrice: Number(e.target.value)})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Entitlements Checkboxes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Included OS Features
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Check features granted in this tier</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                    {activeOSFeatures.map(feat => {
                      const isChecked = formData.featureEntitlements[feat.key] ?? (formData.tier === 'ENTERPRISE');
                      return (
                        <label 
                          key={feat.key} 
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs font-medium text-slate-700"
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleFeatureToggle(feat.key)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span>{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Usage Limits */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Usage Limits (-1 for unlimited)
                  </label>
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">User Seats</label>
                      <input 
                        type="number" 
                        value={formData.usageLimits.users} 
                        onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, users: Number(e.target.value)}})} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Storage (GB)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formData.usageLimits.storageGB} 
                        onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, storageGB: Number(e.target.value)}})} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Projects/Sites</label>
                      <input 
                        type="number" 
                        value={formData.usageLimits.projects} 
                        onChange={e => setFormData({...formData, usageLimits: {...formData.usageLimits, projects: Number(e.target.value)}})} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                    rows={2} 
                    placeholder="Short description of this tier and its primary audience..."
                  />
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-3xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="planForm" 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all text-xs cursor-pointer"
              >
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
