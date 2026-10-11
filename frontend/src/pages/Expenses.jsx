import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Search, 
  Building2, 
  Phone, 
  CreditCard, 
  IndianRupee, 
  ShieldCheck, 
  FileText, 
  Check, 
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { enqueueSyncOperation } from '../services/syncQueue';
import toast from 'react-hot-toast';

export default function Expenses() {
  const [activeTab, setActiveTab] = useState('vouchers'); // 'vouchers', 'accounts', 'topups'
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('ALL');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccountForTopUp, setSelectedAccountForTopUp] = useState(null);

  // Forms
  const [voucherForm, setVoucherForm] = useState({
    projectId: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'SITE_HARDWARE',
    description: '',
    vendorName: '',
    billNumber: '',
    paymentMode: 'CASH'
  });

  const [topUpForm, setTopUpForm] = useState({
    accountId: '',
    amount: '',
    paymentMode: 'UPI',
    referenceNumber: '',
    notes: ''
  });

  const [accountForm, setAccountForm] = useState({
    projectId: '',
    supervisorName: '',
    supervisorPhone: '',
    upiId: '',
    allocatedFloat: 25000,
    notes: ''
  });

  const fetchData = async (pId = projectId) => {
    try {
      setLoading(true);
      const query = pId && pId !== 'ALL' ? `?projectId=${pId}` : '';
      
      const [accRes, txRes, sumRes] = await Promise.all([
        api.get(`/petty-cash/accounts${query}`),
        api.get(`/petty-cash/transactions${query}`),
        api.get(`/petty-cash/summary${query}`)
      ]);

      setAccounts(accRes.data?.data?.accounts || []);
      setTransactions(txRes.data?.data?.transactions || []);
      setSummary(sumRes.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load petty cash data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then(res => {
      const pList = res.data?.data?.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setVoucherForm(prev => ({ ...prev, projectId: pList[0]._id }));
        setAccountForm(prev => ({ ...prev, projectId: pList[0]._id }));
      }
    }).catch(console.error);

    fetchData('ALL');
  }, []);

  const handleProjectFilterChange = (e) => {
    const val = e.target.value;
    setProjectId(val);
    fetchData(val);
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      await api.post('/petty-cash/vouchers', voucherForm);
      toast.success('Site expense voucher submitted for approval!');
      setIsVoucherModalOpen(false);
      setVoucherForm(prev => ({
        ...prev,
        amount: '',
        description: '',
        vendorName: '',
        billNumber: ''
      }));
      fetchData(projectId);
    } catch (error) {
      if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        enqueueSyncOperation({
          endpoint: '/petty-cash/vouchers',
          method: 'POST',
          payload: voucherForm,
          title: `Petty Cash Voucher (₹${Number(voucherForm.amount || 0).toLocaleString()} - ${voucherForm.category || 'Site Expense'})`,
          platform: 'CONTRACTOR'
        });
        toast.success('Voucher queued offline! Will auto-upload when back online.', { icon: '💾' });
        setIsVoucherModalOpen(false);
        setVoucherForm(prev => ({
          ...prev,
          amount: '',
          description: '',
          vendorName: '',
          billNumber: ''
        }));
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to submit voucher');
    }
  };

  const handleTopUpFloat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/petty-cash/top-up', topUpForm);
      toast.success('Cash float topped-up successfully!');
      setIsTopUpModalOpen(false);
      setTopUpForm({
        accountId: '',
        amount: '',
        paymentMode: 'UPI',
        referenceNumber: '',
        notes: ''
      });
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to top-up float');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/petty-cash/accounts', accountForm);
      toast.success('Supervisor cash float account created!');
      setIsAccountModalOpen(false);
      setAccountForm({
        projectId: projectId !== 'ALL' ? projectId : (projects[0]?._id || ''),
        supervisorName: '',
        supervisorPhone: '',
        upiId: '',
        allocatedFloat: 25000,
        notes: ''
      });
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handleApproveVoucher = async (id) => {
    try {
      await api.patch(`/petty-cash/vouchers/${id}/approve`);
      toast.success('Voucher approved & recorded in project P&L!');
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve voucher');
    }
  };

  const handleRejectVoucher = async (id) => {
    const reason = window.prompt('Enter reason for voucher rejection:');
    if (reason === null) return;
    try {
      await api.patch(`/petty-cash/vouchers/${id}/reject`, { rejectionReason: reason });
      toast.success('Voucher rejected');
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject voucher');
    }
  };

  const openTopUpForAccount = (acc) => {
    setSelectedAccountForTopUp(acc);
    setTopUpForm({
      accountId: acc._id,
      amount: Math.max(5000, acc.allocatedFloat - acc.currentBalance),
      paymentMode: 'UPI',
      referenceNumber: '',
      notes: `Float replenishment for ${acc.supervisorName}`
    });
    setIsTopUpModalOpen(true);
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Filter Vouchers
  const expenseVouchers = transactions.filter(t => t.type === 'EXPENSE');
  const topUpHistory = transactions.filter(t => t.type === 'TOP_UP');

  const filteredVouchers = expenseVouchers.filter(v => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = 
        (v.voucherNo || '').toLowerCase().includes(term) ||
        (v.description || '').toLowerCase().includes(term) ||
        (v.vendorName || '').toLowerCase().includes(term) ||
        (v.submittedBy || '').toLowerCase().includes(term) ||
        (v.billNumber || '').toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Site Supervisor Cash Float
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Voucher Approval
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Supervisor Petty Cash & Site Expense Vouchers</h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage site supervisor imprest floats, approve daily field purchase slips, and maintain a live audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          <select
            value={projectId}
            onChange={handleProjectFilterChange}
            className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-[240px] truncate"
          >
            <option value="ALL">All Projects (Treasury View)</option>
            {projects.map(p => (
              <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setAccountForm({
                  projectId: projectId !== 'ALL' ? projectId : (projects[0]?._id || ''),
                  supervisorName: '',
                  supervisorPhone: '',
                  upiId: '',
                  allocatedFloat: 25000,
                  notes: ''
                });
                setIsAccountModalOpen(true);
              }}
              className="btn bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>New Float Account</span>
            </button>

            <button
              onClick={() => {
                const firstAcc = accounts[0];
                setVoucherForm({
                  projectId: firstAcc?.projectId?._id || firstAcc?.projectId || (projects[0]?._id || ''),
                  accountId: firstAcc?._id || '',
                  date: new Date().toISOString().split('T')[0],
                  amount: '',
                  category: 'SITE_HARDWARE',
                  description: '',
                  vendorName: '',
                  billNumber: '',
                  paymentMode: 'CASH'
                });
                setIsVoucherModalOpen(true);
              }}
              className="btn bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Receipt className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
              <span>Submit Site Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Float in Field */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash Float in Field</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {formatINR(summary?.totalFloatInField)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Across {summary?.activeSupervisorsCount || accounts.length || 0} Site Supervisors
            </p>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vouchers Pending</p>
            <h3 className="text-2xl font-bold text-amber-600">
              {summary?.pendingVouchersCount || 0} <span className="text-sm font-normal text-slate-400">Slips</span>
            </h3>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">
              Total: {formatINR(summary?.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Site Expenses</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {formatINR(summary?.totalSpent)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Synced into Project P&L</p>
          </div>
        </div>

        {/* Sanctioned Float Total */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Funds Topped-Up</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {formatINR(summary?.totalReceived)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Limit: {formatINR(summary?.totalAllocatedFloat)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto gap-4">
          <div className="flex items-center gap-1 py-2 flex-shrink-0">
            {[
              { id: 'vouchers', label: '1. Field Expense Vouchers & Approvals', icon: Receipt, count: expenseVouchers.length },
              { id: 'accounts', label: '2. Supervisor Imprest Float Ledgers', icon: Wallet, count: accounts.length },
              { id: 'topups', label: '3. Cash Top-Up & Transfer History', icon: ArrowUpRight, count: topUpHistory.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: FIELD EXPENSE VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by voucher #, merchant, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Status: All</option>
                  <option value="PENDING">Pending Approval Only</option>
                  <option value="APPROVED">Approved Vouchers</option>
                  <option value="REJECTED">Rejected Vouchers</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Category: All</option>
                  <option value="SITE_HARDWARE">Site Hardware & Materials</option>
                  <option value="DIESEL_FUEL">Diesel & Equipment Fuel</option>
                  <option value="LABOUR_TEA_FOOD">Labour Tea & Food Refreshments</option>
                  <option value="EMERGENCY_REPAIR">Emergency Repair & Spares</option>
                  <option value="LOCAL_CARTAGE">Local Cartage / Transport</option>
                  <option value="SAFETY_PPE">Safety & PPE</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Voucher & Date</th>
                    <th className="px-4 py-3">Site Supervisor</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Purchase Description & Merchant</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action / Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        No expense vouchers matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map(v => {
                      const isPending = v.status === 'PENDING';
                      const isApproved = v.status === 'APPROVED';
                      const isRejected = v.status === 'REJECTED';

                      return (
                        <tr key={v._id} className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800">{v.voucherNo}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(v.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-700">{v.accountId?.supervisorName || 'Site Supervisor'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Bal: {formatINR(v.accountId?.currentBalance)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {v.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-sm truncate">
                            <div className="font-medium text-slate-800 truncate">{v.description}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              Vendor: <strong className="text-slate-600">{v.vendorName}</strong> {v.billNumber ? `(Memo: ${v.billNumber})` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                            {formatINR(v.amount)}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Paid via {v.paymentMode}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isApproved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              isRejected ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            }`}>
                              {isApproved ? <CheckCircle2 className="w-3 h-3" /> :
                               isRejected ? <XCircle className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveVoucher(v._id)}
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded inline-flex items-center gap-1 shadow"
                                  title="Approve Voucher"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectVoucher(v._id)}
                                  className="btn bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] px-2 py-1 rounded inline-flex items-center"
                                  title="Reject Voucher"
                                >
                                  <X className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {isApproved ? 'Reconciled' : 'Rejected'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SUPERVISOR IMPREST FLOAT LEDGERS */}
        {activeTab === 'accounts' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => {
                const percentRemaining = acc.allocatedFloat > 0 
                  ? Math.round((acc.currentBalance / acc.allocatedFloat) * 100) 
                  : 0;
                const isLow = acc.currentBalance < 5000;

                return (
                  <div key={acc._id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative ${isLow ? 'border-amber-300' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Site Imprest Account
                        </span>
                        <h4 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{acc.supervisorName}</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {acc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">{acc.notes || 'In-charge of daily site emergency purchases.'}</p>

                    {/* Balance Card */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-3 space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Cash in Hand Balance</span>
                          <span className={`text-2xl font-black ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {formatINR(acc.currentBalance)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">
                          Limit: {formatINR(acc.allocatedFloat)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>Float Remaining</span>
                          <span className={isLow ? 'text-amber-600 font-bold' : 'text-slate-600'}>{percentRemaining}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, percentRemaining))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Received</span>
                        <strong>{formatINR(acc.totalReceived)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Spent & Reconciled</span>
                        <strong className="text-rose-600">{formatINR(acc.totalSpent)}</strong>
                      </div>
                    </div>

                    {/* Contacts & Action */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div>
                        <span className="block text-[11px] font-medium text-slate-700">{acc.supervisorPhone}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{acc.upiId}</span>
                      </div>
                      <button
                        onClick={() => openTopUpForAccount(acc)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Top-up Float</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TOP-UP & REPLENISHMENT HISTORY */}
        {activeTab === 'topups' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Top-Up Slip #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Recipient Supervisor</th>
                    <th className="px-4 py-3">Description / Remarks</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3 text-right">Amount Topped-Up (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topUpHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        No cash top-up records found.
                      </td>
                    </tr>
                  ) : (
                    topUpHistory.map(t => (
                      <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-800">{t.voucherNo}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">
                          {t.accountId?.supervisorName || 'Site Supervisor'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{t.description}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {t.paymentMode}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-600 text-sm">
                          +{formatINR(t.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Disbursed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: SUBMIT EXPENSE VOUCHER */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" /> Site Cash Expense Voucher
                </span>
                <h3 className="text-lg font-bold">Submit Field Purchase Voucher</h3>
              </div>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supervisor Account *</label>
                  <select
                    value={voucherForm.accountId}
                    onChange={(e) => setVoucherForm({ ...voucherForm, accountId: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  >
                    <option value="">-- Choose Supervisor Float --</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.supervisorName} (Bal: {formatINR(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    value={voucherForm.date}
                    onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2800"
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-base text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={voucherForm.category}
                    onChange={(e) => setVoucherForm({ ...voucherForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  >
                    <option value="SITE_HARDWARE">Site Hardware, Nails & Wire</option>
                    <option value="DIESEL_FUEL">Diesel / Petrol / Generator Fuel</option>
                    <option value="LABOUR_TEA_FOOD">Labour Overtime Tea & Refreshments</option>
                    <option value="EMERGENCY_REPAIR">Emergency Equipment Spares & Repair</option>
                    <option value="LOCAL_CARTAGE">Local Tempo / Cartage Freight</option>
                    <option value="SAFETY_PPE">Safety & PPE</option>
                    <option value="OFFICE_STATIONERY">Office Stationery & Xerox</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">What was purchased? (Description) *</label>
                <textarea
                  rows="2.5"
                  placeholder="e.g. 25kg binding wire, 3-inch nails and masking tape for beam shuttering"
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merchant / Shop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shree Ganesh Hardware"
                    value={voucherForm.vendorName}
                    onChange={(e) => setVoucherForm({ ...voucherForm, vendorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cash Memo / Bill #</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-441"
                    value={voucherForm.billNumber}
                    onChange={(e) => setVoucherForm({ ...voucherForm, billNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={voucherForm.paymentMode}
                    onChange={(e) => setVoucherForm({ ...voucherForm, paymentMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="UPI">Supervisor UPI / GPay</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TOP-UP CASH FLOAT */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> Cash Float Replenishment
                </span>
                <h3 className="text-lg font-bold">Top-Up Supervisor Cash Float</h3>
              </div>
              <button onClick={() => setIsTopUpModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpFloat} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor Account *</label>
                <select
                  value={topUpForm.accountId}
                  onChange={(e) => setTopUpForm({ ...topUpForm, accountId: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.supervisorName} (Current: {formatINR(acc.currentBalance)} / Max: {formatINR(acc.allocatedFloat)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Top-Up Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={topUpForm.amount}
                    onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-base text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={topUpForm.paymentMode}
                    onChange={(e) => setTopUpForm({ ...topUpForm, paymentMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  >
                    <option value="UPI">GooglePay / UPI Transfer</option>
                    <option value="CASH">Physical Cash Handover</option>
                    <option value="BANK_TRANSFER">NEFT / IMPS Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref 4109823412 or Cash Voucher"
                  value={topUpForm.referenceNumber}
                  onChange={(e) => setTopUpForm({ ...topUpForm, referenceNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly replenishment for Tower A site"
                  value={topUpForm.notes}
                  onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Top-Up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE SUPERVISOR FLOAT ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> New Imprest Register
                </span>
                <h3 className="text-lg font-bold">Assign Supervisor Cash Float</h3>
              </div>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kishore Site Supervisor"
                  value={accountForm.supervisorName}
                  onChange={(e) => setAccountForm({ ...accountForm, supervisorName: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 9822011223"
                    value={accountForm.supervisorPhone}
                    onChange={(e) => setAccountForm({ ...accountForm, supervisorPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID for Top-Up</label>
                  <input
                    type="text"
                    placeholder="e.g. kishore@okhdfcbank"
                    value={accountForm.upiId}
                    onChange={(e) => setAccountForm({ ...accountForm, upiId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Sanctioned Imprest Float (₹) *</label>
                <input
                  type="number"
                  value={accountForm.allocatedFloat}
                  onChange={(e) => setAccountForm({ ...accountForm, allocatedFloat: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-base text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This cash float will be credited to the supervisor's live balance immediately.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Site Location Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Tower A civil construction & night pour in-charge"
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
