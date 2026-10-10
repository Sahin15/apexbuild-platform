import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Filter, LayoutGrid, List, Download, 
  MoreVertical, Building2, Edit, ChevronLeft, ChevronRight, Eye, RefreshCw
} from 'lucide-react';

export default function SABusinessAccounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ orgName: '', orgEmail: '', businessType: 'CONTRACTOR', ownerName: '', ownerEmail: '', phone: '', password: '', osProductId: '', osPlanId: '' });
  
  const [osProducts, setOsProducts] = useState([]);
  const [osPlans, setOsPlans] = useState([]);
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [viewMode, setViewMode] = useState('LIST');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Stats (Could also be fetched, but we'll infer some basics or rely on dashboard for high-level)
  const businessTypes = ['ALL', 'CONTRACTOR', 'MATERIAL_SUPPLIER', 'CHICKEN_DISTRIBUTOR', 'DIAGNOSTICS', 'PHARMACY', 'RESTAURANT', 'EDUCATION'];
  const statuses = ['ALL', 'active', 'pending', 'payment_pending', 'restricted', 'suspended', 'inactive'];

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (filterType !== 'ALL') params.businessType = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const [res, productsRes, plansRes] = await Promise.all([
        api.get('/platform/business-accounts', { params }),
        api.get('/platform/os-products'),
        api.get('/platform/os-plans')
      ]);
      
      setAccounts(res.data.data.accounts);
      setTotalPages(res.data.data.pagination.pages);
      setTotalRecords(res.data.data.pagination.total);
      
      if (productsRes.data?.data?.products) setOsProducts(productsRes.data.data.products);
      if (plansRes.data?.data?.plans) setOsPlans(plansRes.data.data.plans);
    } catch (error) {
      toast.error('Failed to load business accounts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    
    // Open modal if ?new=true
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setIsModalOpen(true);
    }
  }, [page, limit, filterType, filterStatus, location.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      fetchAccounts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/platform/business-accounts/${id}`, { status });
      toast.success(`Account status updated to ${status}`);
      fetchAccounts();
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
      setFormData({ orgName: '', orgEmail: '', businessType: 'CONTRACTOR', ownerName: '', ownerEmail: '', phone: '', password: '', osProductId: '', osPlanId: '' });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
      'pending': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      'payment_pending': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Payment Due' },
      'restricted': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Restricted' },
      'suspended': { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
      'inactive': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inactive' },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Accounts</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage tenants across all ApexBuild OS products</p>
          </div>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm">
          Add New Business
        </button>
      </div>

      {/* Advanced Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Filter className="w-4 h-4 text-indigo-500" /> Filters</h3>
        
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
            <h2 className="font-bold text-slate-800">Directory</h2>
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
                <thead className="bg-slate-50/50 text-slate-500 font-semibold">
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
                                  <button onClick={() => handleUpdateStatus(acc._id, 'active')} className="w-full text-left px-4 py-2 font-medium text-emerald-600 hover:bg-slate-50">Approve Account</button>
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
                    <button onClick={() => navigate(`/superadmin/business-accounts/${acc._id}`)} className="flex-1 bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm text-center">
                      Details
                    </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600"/> 
                Onboard New Tenant
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                        {osPlans.filter(p => p.osProductId?._id === formData.osProductId || p.osProductId === formData.osProductId).map(p => (
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
