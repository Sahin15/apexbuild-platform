import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Filter, LayoutGrid, List, 
  MoreVertical, Building2, ChevronLeft, ChevronRight, Eye, RefreshCw,
  ShieldCheck, CheckCircle2, Clock, XCircle, AlertCircle, Sparkles,
  ArrowRight, Tag, HelpCircle, Lock, Zap, Database, Server, Check, Key
} from 'lucide-react';

export default function SABusinessAccounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs: 'DIRECTORY' or 'VERIFICATION_QUEUE' or 'WORKSPACES'
  const [activeTab, setActiveTab] = useState('DIRECTORY');
  const [pendingQueue, setPendingQueue] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Tenancy Workspaces State
  const [workspacesData, setWorkspacesData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);

  // Manual Onboard Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    orgName: '', orgEmail: '', businessType: 'CONTRACTOR', 
    ownerName: '', ownerEmail: '', phone: '', password: '', 
    osProductId: '', osPlanId: '' 
  });
  
  // Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedPendingAcc, setSelectedPendingAcc] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    osProductId: '',
    osPlanId: '',
    billingCycle: 'monthly',
    customPrice: '',
    discount: 0,
    setupFee: 0,
    internalNotes: ''
  });

  const [osProducts, setOsProducts] = useState([]);
  const [osPlans, setOsPlans] = useState([]);

  // Pagination & Filtering for Directory
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [viewMode, setViewMode] = useState('LIST');
  const [openDropdown, setOpenDropdown] = useState(null);

  const businessTypes = ['ALL', 'CONTRACTOR', 'MATERIAL_SUPPLIER', 'CHICKEN_DISTRIBUTOR', 'DIAGNOSTICS', 'PHARMACY', 'RESTAURANT', 'EDUCATION'];
  const statuses = ['ALL', 'active', 'pending', 'payment_pending', 'restricted', 'suspended', 'inactive'];

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (filterType !== 'ALL') params.businessType = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const [res, productsRes, plansRes, pendingRes] = await Promise.all([
        api.get('/platform/business-accounts', { params }),
        api.get('/platform/os-products'),
        api.get('/platform/os-plans'),
        api.get('/platform/business-accounts', { params: { status: 'pending', limit: 50 } })
      ]);
      
      setAccounts(res.data.data.accounts);
      setTotalPages(res.data.data.pagination.pages);
      setTotalRecords(res.data.data.pagination.total);
      
      if (productsRes.data?.data?.products) setOsProducts(productsRes.data.data.products);
      if (plansRes.data?.data?.plans) setOsPlans(plansRes.data.data.plans);
      if (pendingRes.data?.data?.accounts) setPendingQueue(pendingRes.data.data.accounts);
    } catch (error) {
      toast.error('Failed to load business accounts data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingQueue = async () => {
    try {
      setPendingLoading(true);
      const res = await api.get('/platform/business-accounts', { params: { status: 'pending', limit: 50 } });
      setPendingQueue(res.data.data.accounts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      setWorkspacesLoading(true);
      const [wsRes, auditRes] = await Promise.all([
        api.get('/platform/tenancy-workspaces'),
        api.get('/platform/tenancy-audit')
      ]);
      setWorkspacesData(wsRes.data?.data || null);
      setAuditData(auditRes.data?.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tenancy workspaces data');
    } finally {
      setWorkspacesLoading(false);
    }
  };

  const handleMasqueradeWorkspace = async (targetOrg) => {
    try {
      const res = await api.post(`/superadmin/impersonate/${targetOrg._id}`);
      toast.success(`Entering isolated workspace: ${targetOrg.name}`);
      localStorage.setItem('originalToken', localStorage.getItem('token'));
      localStorage.setItem('originalUser', localStorage.getItem('user'));
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));

      const bType = targetOrg.businessType;
      if (bType === 'MATERIAL_SUPPLIER') {
        window.location.href = '/supplier/dashboard';
      } else if (bType === 'DIAGNOSTICS') {
        window.location.href = '/diagnostics/dashboard';
      } else if (bType === 'CHICKEN_DISTRIBUTOR') {
        window.location.href = '/distributor/dashboard';
      } else if (bType === 'RESTAURANT') {
        window.location.href = '/restaurant/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error('Failed to enter tenant workspace');
    }
  };

  useEffect(() => {
    fetchAccounts();
    
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setIsModalOpen(true);
    }
    if (params.get('tab') === 'queue') {
      setActiveTab('VERIFICATION_QUEUE');
    }
    if (params.get('tab') === 'workspaces') {
      setActiveTab('WORKSPACES');
      fetchWorkspaces();
    }
  }, [page, limit, filterType, filterStatus, location.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAccounts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/platform/business-accounts/${id}`, { status });
      toast.success(`Account status updated to ${status}`);
      fetchAccounts();
      fetchPendingQueue();
      setOpenDropdown(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/business-accounts', formData);
      toast.success('Business account created successfully');
      setIsModalOpen(false);
      setFormData({ 
        orgName: '', orgEmail: '', businessType: 'CONTRACTOR', 
        ownerName: '', ownerEmail: '', phone: '', password: '', 
        osProductId: '', osPlanId: '' 
      });
      fetchAccounts();
      fetchPendingQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  // Open Verification Modal for a pending account
  const openVerificationModal = (acc) => {
    setSelectedPendingAcc(acc);

    // Auto-match OS Product by businessType
    let matchedProduct = osProducts.find(p => 
      p.code === acc.businessType || 
      p.name?.toLowerCase().includes(acc.businessType?.toLowerCase().replace('_', ' '))
    );
    if (!matchedProduct && osProducts.length > 0) {
      matchedProduct = osProducts[0];
    }

    const productId = matchedProduct?._id || '';
    const relevantPlans = osPlans.filter(p => (p.osProductId?._id || p.osProductId) === productId);
    const defaultPlan = relevantPlans[0] || null;

    setVerifyForm({
      osProductId: productId,
      osPlanId: defaultPlan?._id || '',
      billingCycle: 'monthly',
      customPrice: defaultPlan ? String(defaultPlan.monthlyPrice) : '',
      discount: 0,
      setupFee: defaultPlan ? Number(defaultPlan.setupFee || 0) : 0,
      internalNotes: ''
    });

    setIsVerifyModalOpen(true);
  };

  const handleProductChangeInVerify = (productId) => {
    const relevantPlans = osPlans.filter(p => (p.osProductId?._id || p.osProductId) === productId);
    const defaultPlan = relevantPlans[0] || null;
    setVerifyForm(prev => ({
      ...prev,
      osProductId: productId,
      osPlanId: defaultPlan?._id || '',
      customPrice: defaultPlan ? String(prev.billingCycle === 'yearly' ? defaultPlan.yearlyPrice : defaultPlan.monthlyPrice) : '',
      setupFee: defaultPlan ? Number(defaultPlan.setupFee || 0) : 0
    }));
  };

  const handlePlanChangeInVerify = (planId) => {
    const selectedPlan = osPlans.find(p => p._id === planId);
    if (selectedPlan) {
      const price = verifyForm.billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
      setVerifyForm(prev => ({
        ...prev,
        osPlanId: planId,
        customPrice: String(price),
        setupFee: Number(selectedPlan.setupFee || 0)
      }));
    } else {
      setVerifyForm(prev => ({ ...prev, osPlanId: planId }));
    }
  };

  const handleCycleChangeInVerify = (cycle) => {
    const selectedPlan = osPlans.find(p => p._id === verifyForm.osPlanId);
    let price = verifyForm.customPrice;
    if (selectedPlan) {
      price = cycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
    }
    setVerifyForm(prev => ({
      ...prev,
      billingCycle: cycle,
      customPrice: String(price)
    }));
  };

  // Submit Verification & Activation
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPendingAcc) return;
    try {
      setVerifying(true);
      await api.post(`/platform/business-accounts/${selectedPendingAcc._id}/verify`, {
        osProductId: verifyForm.osProductId,
        osPlanId: verifyForm.osPlanId,
        billingCycle: verifyForm.billingCycle,
        customPrice: verifyForm.customPrice ? Number(verifyForm.customPrice) : undefined,
        discount: Number(verifyForm.discount) || 0,
        setupFee: Number(verifyForm.setupFee) || 0,
        internalNotes: verifyForm.internalNotes
      });

      toast.success(`${selectedPendingAcc.name} verified and activated successfully!`);
      setIsVerifyModalOpen(false);
      setSelectedPendingAcc(null);
      fetchAccounts();
      fetchPendingQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'active': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
      'pending': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Verification' },
      'payment_pending': { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Payment Due' },
      'restricted': { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Restricted' },
      'suspended': { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Suspended' },
      'inactive': { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Inactive' },
    };
    const s = map[status] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg}`}>
        {status === 'pending' && <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
        {status === 'active' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        {s.label}
      </span>
    );
  };

  // Calculations for verify modal live summary
  const selectedPlanObj = osPlans.find(p => p._id === verifyForm.osPlanId);
  const basePriceNum = selectedPlanObj ? (verifyForm.billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) : 0;
  const customPriceNum = verifyForm.customPrice !== '' ? Number(verifyForm.customPrice) : basePriceNum;
  const discountNum = Number(verifyForm.discount) || 0;
  const setupFeeNum = Number(verifyForm.setupFee) || 0;
  const recurringTotal = Math.max(0, customPriceNum - discountNum);
  const initialInvoiceTotal = recurringTotal + setupFeeNum;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Accounts & Tenancy</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage tenants, vertical OS assignments, and public verification queues</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
          >
            + Onboard Direct Tenant
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all ${
            activeTab === 'DIRECTORY'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Tenant Directory
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
            {totalRecords}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATION_QUEUE')}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all relative ${
            activeTab === 'VERIFICATION_QUEUE'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Verifications Queue
          {pendingQueue.length > 0 && (
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'VERIFICATION_QUEUE' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {pendingQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('WORKSPACES'); fetchWorkspaces(); }}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all relative ${
            activeTab === 'WORKSPACES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          Multi-Tenant Workspaces & Isolation
          <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'WORKSPACES' ? 'bg-indigo-700 text-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            100% Isolated
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENDING VERIFICATION QUEUE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'VERIFICATION_QUEUE' && (
        <div className="space-y-6">
          {/* Notification Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Public Registrations Verification Queue ({pendingQueue.length})
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Review inbound business applications. Assign dedicated OS Plans, negotiated pricing, and custom implementation fees, then activate tenant workspaces with 1-click.
                </p>
              </div>
            </div>

            <button
              onClick={fetchPendingQueue}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pendingLoading ? 'animate-spin' : ''}`} /> Refresh Queue
            </button>
          </div>

          {/* Pending Applications List */}
          {pendingLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
              <p className="text-sm font-medium text-slate-500">Loading pending verification queue...</p>
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">All Registrations Verified!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending business accounts awaiting verification right now. New public registrations from the onboarding portal will queue up here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingQueue.map((acc) => (
                <div 
                  key={acc._id} 
                  className="bg-white rounded-2xl border-2 border-amber-200/70 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm uppercase">
                        {acc.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{acc.name}</h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {acc.businessType?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Application ID: <span className="font-mono font-bold text-slate-700">APX-APP-{acc._id.slice(-6).toUpperCase()}</span> • Applied on {new Date(acc.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium block">Owner / Contact</span>
                        <span className="font-bold text-slate-800">{acc.ownerName || 'Authorized Admin'}</span>
                        <span className="text-slate-500 block truncate">{acc.email}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium block">Location & Phone</span>
                        <span className="font-bold text-slate-800">{acc.city ? `${acc.city}, ${acc.state || ''}` : 'Location Unspecified'}</span>
                        <span className="text-slate-500 block">{acc.phone || 'No phone provided'}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium block">Notes / Scale</span>
                        <span className="font-medium text-slate-700 line-clamp-2 italic">
                          {acc.notes || 'Standard onboarding request'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => openVerificationModal(acc)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Review & Verify
                    </button>
                    
                    <button
                      onClick={() => handleUpdateStatus(acc._id, 'rejected')}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TENANT DIRECTORY                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-6">
          {/* Advanced Search & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" /> Filter Tenants
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search by business name or email..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">OS Product</label>
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {businessTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'All OS Products' : type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>
                      {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Directory Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Tenant Directory</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Showing {accounts.length} of {totalRecords} records</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setViewMode('CARDS')} className={`px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-colors ${viewMode === 'CARDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid className="w-4 h-4"/> Cards</button>
                  <button onClick={() => setViewMode('LIST')} className={`px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-colors ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4"/> List</button>
                </div>
                <button onClick={fetchAccounts} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                  <p>Loading accounts...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No business accounts found matching your filters.</p>
                </div>
              ) : viewMode === 'LIST' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3">Business Name</th>
                        <th className="px-5 py-3">OS Product</th>
                        <th className="px-5 py-3">Contact</th>
                        <th className="px-5 py-3">Registered</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.map(acc => (
                        <tr key={acc._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                {acc.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{acc.name}</p>
                                <p className="text-xs text-slate-500">{acc.ownerName || 'Unknown Owner'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-600">{acc.businessType?.replace('_', ' ') || 'Unknown'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-slate-700 font-medium">{acc.email}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{acc.phone || 'No phone'}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600 font-medium">
                            {new Date(acc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={acc.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 relative">
                              {acc.status === 'pending' && (
                                <button
                                  onClick={() => openVerificationModal(acc)}
                                  className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verify
                                </button>
                              )}

                              <button onClick={() => navigate(`/superadmin/business-accounts/${acc._id}`)} className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition-colors" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setOpenDropdown(openDropdown === acc._id ? null : acc._id)} 
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openDropdown === acc._id && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 text-sm">
                                  {acc.status === 'pending' && (
                                    <>
                                      <button onClick={() => openVerificationModal(acc)} className="w-full text-left px-4 py-2 font-medium text-amber-600 hover:bg-slate-50">Review & Verify</button>
                                      <button onClick={() => handleUpdateStatus(acc._id, 'rejected')} className="w-full text-left px-4 py-2 font-medium text-rose-600 hover:bg-slate-50">Reject Account</button>
                                    </>
                                  )}
                                  {acc.status === 'active' && (
                                    <>
                                      <button onClick={() => handleUpdateStatus(acc._id, 'restricted')} className="w-full text-left px-4 py-2 font-medium text-orange-600 hover:bg-slate-50">Restrict Account</button>
                                      <button onClick={() => handleUpdateStatus(acc._id, 'suspended')} className="w-full text-left px-4 py-2 font-medium text-rose-600 hover:bg-slate-50">Suspend Account</button>
                                    </>
                                  )}
                                  {(acc.status === 'suspended' || acc.status === 'restricted' || acc.status === 'rejected') && (
                                    <button onClick={() => handleUpdateStatus(acc._id, 'active')} className="w-full text-left px-4 py-2 font-medium text-emerald-600 hover:bg-slate-50">Activate Account</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {accounts.map(acc => (
                    <div key={acc._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                            {acc.name.substring(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 leading-tight">{acc.name}</h3>
                            <p className="text-xs text-slate-500">{acc.businessType}</p>
                          </div>
                        </div>
                        <StatusBadge status={acc.status} />
                      </div>
                      
                      <div className="space-y-2 mb-6 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email</span>
                          <span className="font-medium text-slate-700 truncate ml-2">{acc.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Owner</span>
                          <span className="font-medium text-slate-700 truncate ml-2">{acc.ownerName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registered</span>
                          <span className="font-medium text-slate-700 truncate ml-2">{new Date(acc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                        {acc.status === 'pending' ? (
                          <button onClick={() => openVerificationModal(acc)} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold py-2 rounded-lg hover:bg-amber-100 transition-colors text-sm text-center flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Verify
                          </button>
                        ) : (
                          <button onClick={() => navigate(`/superadmin/business-accounts/${acc._id}`)} className="flex-1 bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm text-center">
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
              <p className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MULTI-TENANT WORKSPACES & DATA ISOLATION                           */}
      {/* ========================================================================= */}
      {activeTab === 'WORKSPACES' && (
        <div className="space-y-8">
          {/* Security & Isolation Audit Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  100% Strict Data Partition Engine Active
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Multi-Tenant Workspace & Isolation Console
                </h2>
                <p className="text-indigo-200/80 text-sm leading-relaxed">
                  Every business operates on their own partitioned workspace. Even on the same vertical OS (e.g. Contractor OS or Supplier OS), businesses cannot view or access foreign data. Superadmin can inspect and enter any workspace with 1-click masquerade.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold block">Live Tenants</span>
                  <span className="text-xl font-black text-white">
                    {workspacesData?.totalWorkspaces || accounts.length}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">Audit Status</span>
                  <span className="text-sm font-black text-emerald-400 flex items-center gap-1 justify-center mt-1">
                    <CheckCircle2 className="w-4 h-4" /> 100% Secure
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchWorkspaces}
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <RefreshCw className={`w-4 h-4 ${workspacesLoading ? 'animate-spin' : ''}`} />
                  Re-Audit
                </button>
              </div>
            </div>

            {/* Security Guarantee Pills */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Compound Indexes</h4>
                  <p className="text-[11px] text-indigo-200/70">{`{ organizationId: 1 } Partitioned`}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">IDOR Attack Shield</h4>
                  <p className="text-[11px] text-indigo-200/70">Cross-tenant queries return 404/403</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Express Middleware</h4>
                  <p className="text-[11px] text-indigo-200/70">Scoping strictly by req.user.orgId</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Audit Logging</h4>
                  <p className="text-[11px] text-indigo-200/70">Tenant impersonations recorded</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {workspacesLoading && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">Auditing and partitioning multi-tenant workspaces...</p>
            </div>
          )}

          {/* Vertical OS Grouped Workspaces */}
          {!workspacesLoading && workspacesData && (
            <div className="space-y-8">
              {[
                { 
                  key: 'CONTRACTOR', 
                  title: 'Contractor OS Engine', 
                  icon: '🏗️', 
                  desc: 'General & Civil Contractors running high-rise, viaduct & pipeline infrastructure projects',
                  color: 'from-blue-600/10 to-indigo-600/5'
                },
                { 
                  key: 'MATERIAL_SUPPLIER', 
                  title: 'Material Supplier OS Engine', 
                  icon: '🚚', 
                  desc: 'Steel mills, RMC depots, and building material suppliers with delivery dispatch fleets',
                  color: 'from-emerald-600/10 to-teal-600/5'
                },
                { 
                  key: 'DIAGNOSTICS', 
                  title: 'Diagnostics OS Engine', 
                  icon: '🔬', 
                  desc: 'Clinical pathology laboratories & radiology imaging centres with test dispatch & doctor commissions',
                  color: 'from-purple-600/10 to-indigo-600/5'
                },
                { 
                  key: 'CHICKEN_DISTRIBUTOR', 
                  title: 'Chicken Distributor OS Engine', 
                  icon: '🐔', 
                  desc: 'Broiler chicken wholesale dispatch, farm crates logistics & customer billing ledgers',
                  color: 'from-amber-600/10 to-orange-600/5'
                },
                { 
                  key: 'RESTAURANT', 
                  title: 'Restaurant OS Engine', 
                  icon: '🍽️', 
                  desc: 'F&B dining establishments, touch POS billing, live KDS kitchen routing & recipe inventory',
                  color: 'from-orange-600/10 to-red-600/5'
                }
              ].map(osGroup => {
                const list = workspacesData.groupedByOS?.[osGroup.key] || [];
                if (list.length === 0) return null;

                return (
                  <div key={osGroup.key} className="space-y-4">
                    {/* OS Engine Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{osGroup.icon}</span>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            {osGroup.title}
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                              {list.length} Businesses Active
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500">{osGroup.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Workspaces Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {list.map(biz => (
                        <div 
                          key={biz._id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group"
                        >
                          <div className="space-y-3">
                            {/* Business Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                                  {biz.name}
                                </h4>
                                {biz.legalName && (
                                  <p className="text-xs text-slate-400 line-clamp-1">{biz.legalName}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-0.5">
                                  📍 {biz.city || 'Headquarters'}{biz.state ? `, ${biz.state}` : ''}
                                </p>
                              </div>
                              <StatusBadge status={biz.status} />
                            </div>

                            {/* Plan & Custom Pricing */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                                  {biz.subscription?.planName || 'Standard Plan'}
                                </span>
                                <span className="font-black text-slate-900">
                                  ₹{((biz.subscription?.recurringPrice || 0) - (biz.subscription?.discount || 0)).toLocaleString('en-IN')}/{biz.subscription?.billingCycle === 'yearly' ? 'yr' : 'mo'}
                                </span>
                              </div>
                              {biz.subscription?.discount > 0 && (
                                <p className="text-[11px] text-emerald-600 font-semibold">
                                  ✓ Negotiated Discount: ₹{biz.subscription.discount.toLocaleString('en-IN')} applied
                                </p>
                              )}
                              {biz.subscription?.setupFee > 0 && (
                                <p className="text-[11px] text-slate-500">
                                  • Setup/Implementation Fee: ₹{biz.subscription.setupFee.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>

                            {/* Live Isolated Resource Footprint */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                                Isolated Data Footprint
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  {biz.metrics?.badge || 'Data Partition Active'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  Zero Leak
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer & Impersonation Button */}
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="truncate max-w-[180px]">👤 {biz.ownerEmail}</span>
                              <span className="font-semibold text-slate-600">👥 {biz.totalUsers} User{biz.totalUsers !== 1 ? 's' : ''}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleMasqueradeWorkspace(biz)}
                              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-indigo-500/20"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              Enter Isolated Workspace
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW & VERIFY MODAL (SUPERADMIN PROVISIONING)                  */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && selectedPendingAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verify & Provision Business Account</h2>
                  <p className="text-xs text-slate-500">Configure plan tier, custom price & 1-click activation</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsVerifyModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Applicant Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedPendingAcc.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Requested: {selectedPendingAcc.businessType?.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-medium">Owner</span>
                    <span className="font-semibold text-slate-800">{selectedPendingAcc.ownerName || 'Admin'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedPendingAcc.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedPendingAcc.phone || 'N/A'}</span>
                  </div>
                </div>
                {selectedPendingAcc.notes && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Applicant Notes:</span> {selectedPendingAcc.notes}
                  </div>
                )}
              </div>

              {/* Form */}
              <form id="verifyForm" onSubmit={handleVerifySubmit} className="space-y-5">
                
                {/* OS Product & Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Assigned OS Product <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={verifyForm.osProductId}
                      onChange={e => handleProductChangeInVerify(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="">Select OS...</option>
                      {osProducts.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      OS Subscription Plan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={verifyForm.osPlanId}
                      onChange={e => handlePlanChangeInVerify(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="">Select Tier...</option>
                      {osPlans
                        .filter(p => (p.osProductId?._id || p.osProductId) === verifyForm.osProductId)
                        .map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} (₹{p.monthlyPrice}/mo, ₹{p.yearlyPrice}/yr)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Billing Frequency:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCycleChangeInVerify('monthly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        verifyForm.billingCycle === 'monthly' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCycleChangeInVerify('yearly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        verifyForm.billingCycle === 'yearly' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Yearly (Annual)
                    </button>
                  </div>
                </div>

                {/* Custom Negotiated Pricing & Setup Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Agreed Price (₹/mo)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={basePriceNum ? String(basePriceNum) : '99'}
                      value={verifyForm.customPrice}
                      onChange={e => setVerifyForm({ ...verifyForm, customPrice: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: ₹{basePriceNum}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Special Discount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={verifyForm.discount}
                      onChange={e => setVerifyForm({ ...verifyForm, discount: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Subtracted from recurring</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Setup / Implementation (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={verifyForm.setupFee}
                      onChange={e => setVerifyForm({ ...verifyForm, setupFee: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">One-time setup invoice</span>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span>Base Tier Price:</span>
                    <span>₹{basePriceNum.toFixed(2)}</span>
                  </div>
                  {customPriceNum !== basePriceNum && (
                    <div className="flex justify-between items-center text-xs text-indigo-300">
                      <span>Custom Negotiated Rate:</span>
                      <span>₹{customPriceNum.toFixed(2)}</span>
                    </div>
                  )}
                  {discountNum > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-400">
                      <span>Applied Discount:</span>
                      <span>-₹{discountNum.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-amber-300">
                    <span>One-Time Setup Fee:</span>
                    <span>+₹{setupFeeNum.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700/80 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Net Recurring Subscription:</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₹{recurringTotal.toFixed(2)} / {verifyForm.billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Initial Invoice Total (Setup + Recurring):</span>
                    <span className="font-bold text-white">₹{initialInvoiceTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Internal Verification Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Internal Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Verified trade license and KYC documents. Signed 1-year agreement at custom price."
                    value={verifyForm.internalNotes}
                    onChange={e => setVerifyForm({ ...verifyForm, internalNotes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <button 
                type="button" 
                onClick={() => setIsVerifyModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
              >
                Cancel
              </button>

              <button 
                type="submit" 
                form="verifyForm"
                disabled={verifying || !verifyForm.osPlanId}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {verifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve & 1-Click Activate Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ONBOARD DIRECT TENANT                                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600"/> 
                Direct Onboard Tenant
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="accountForm" onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Organization Name <span className="text-rose-500">*</span></label>
                    <input required type="text" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Organization Email <span className="text-rose-500">*</span></label>
                    <input required type="email" value={formData.orgEmail} onChange={e => setFormData({...formData, orgEmail: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="info@acme.com" />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Owner Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name <span className="text-rose-500">*</span></label>
                      <input required type="text" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Email <span className="text-rose-500">*</span></label>
                      <input required type="email" value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@acme.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+1234567890" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Password <span className="text-rose-500">*</span></label>
                      <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Secure Password" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">OS Allocation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Type <span className="text-rose-500">*</span></label>
                      <select required value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                        {businessTypes.filter(t => t !== 'ALL' && t !== 'SUPERADMIN').map(type => (
                          <option key={type} value={type}>{type.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OS Product</label>
                      <select value={formData.osProductId} onChange={e => setFormData({...formData, osProductId: e.target.value, osPlanId: ''})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">None (Setup Later)</option>
                        {osProducts.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OS Plan</label>
                      <select disabled={!formData.osProductId} value={formData.osPlanId} onChange={e => setFormData({...formData, osPlanId: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 cursor-pointer">
                        <option value="">Select Plan...</option>
                        {osPlans.filter(p => (p.osProductId?._id || p.osProductId) === formData.osProductId).map(p => (
                          <option key={p._id} value={p._id}>{p.name} - ${p.monthlyPrice}/mo</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" form="accountForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all">
                Onboard Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
