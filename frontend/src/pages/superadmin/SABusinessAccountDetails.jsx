import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Building2, ArrowLeft, Mail, Phone, MapPin, Calendar, 
  ShieldAlert, UserCheck, Edit, Shield, CheckCircle2, 
  AlertTriangle, Monitor, FileText, CreditCard
} from 'lucide-react';

export default function SABusinessAccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const businessTypes = ['CONTRACTOR', 'MATERIAL_SUPPLIER', 'CHICKEN_DISTRIBUTOR', 'DIAGNOSTICS', 'PHARMACY', 'RESTAURANT', 'EDUCATION'];

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/platform/business-accounts/${id}`);
      setAccount(res.data.data);
    } catch (error) {
      toast.error('Failed to load account details');
      navigate('/superadmin/business-accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.patch(`/platform/business-accounts/${id}`, { status: newStatus });
      toast.success(`Account marked as ${newStatus}`);
      fetchDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleMasquerade = async () => {
    try {
      // Assuming a dedicated impersonate endpoint exists like before
      const res = await api.post(`/superadmin/impersonate/${id}`);
      toast.success('Masquerading initiated');
      localStorage.setItem('originalToken', localStorage.getItem('token'));
      localStorage.setItem('originalUser', localStorage.getItem('user'));
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      window.location.href = '/dashboard'; 
    } catch (error) {
      toast.error('Failed to impersonate tenant');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/platform/business-accounts/${id}`, editFormData);
      toast.success('Account profile updated successfully');
      setIsEditModalOpen(false);
      fetchDetails();
    } catch (error) {
      toast.error('Failed to update account profile');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      name: account.name || '',
      legalName: account.legalName || '',
      ownerName: account.ownerName || '',
      phone: account.phone || '',
      businessType: account.businessType || 'CONTRACTOR',
      address: account.address || '',
      city: account.city || '',
      state: account.state || '',
      pincode: account.pincode || '',
      gstNumber: account.gstNumber || '',
      panNumber: account.panNumber || ''
    });
    setIsEditModalOpen(true);
  };

  if (loading || !account) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const map = {
      'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
      'pending': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      'payment_pending': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Payment Due' },
      'on_hold': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Restricted' },
      'suspended': { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
      'inactive': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inactive' },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
      <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <button 
        onClick={() => navigate('/superadmin/business-accounts')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {account.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Application Under Review (Pending Superadmin Verification)</h4>
              <p className="text-xs text-amber-700">This business submitted registration and cannot log in until an OS Plan is provisioned and approved.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/superadmin/business-accounts?tab=queue')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Review in Queue & Provision ➔
          </button>
        </div>
      )}

      {/* Header Profile */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black uppercase shadow-inner border border-indigo-100">
              {account.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{account.name}</h1>
                <StatusBadge status={account.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {account.businessType.replace('_', ' ')}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {account.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {new Date(account.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={openEditModal}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            
            {account.status === 'active' && (
              <>
                <button onClick={handleMasquerade} className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 shadow-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Impersonate
                </button>
                <button onClick={() => setIsRestrictModalOpen(true)} className="px-4 py-2 bg-white border border-orange-200 text-orange-600 font-bold rounded-lg hover:bg-orange-50 shadow-sm">
                  Restrict
                </button>
                <button onClick={() => setIsSuspendModalOpen(true)} className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-50 shadow-sm">
                  Suspend
                </button>
              </>
            )}
            
            {account.status === 'pending' && (
              <>
                <button 
                  onClick={() => navigate('/superadmin/business-accounts?tab=queue')} 
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Verify & Provision
                </button>
                <button onClick={() => handleStatusUpdate('rejected')} className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-50 shadow-sm">
                  Reject
                </button>
              </>
            )}

            {(account.status === 'suspended' || account.status === 'on_hold') && (
              <button onClick={() => handleStatusUpdate('active')} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Reactivate Account
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Meta */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name</p>
                <p className="font-semibold text-slate-800">{account.ownerName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  {account.email} <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-black">VERIFIED</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="font-semibold text-slate-800">{account.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</p>
                <p className="font-semibold text-slate-800">
                  {account.address ? `${account.address}, ${account.city || ''} ${account.state || ''} ${account.pincode || ''}` : 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Legal & Business</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Legal Name</p>
                <p className="font-semibold text-slate-800">{account.legalName || account.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GST Number</p>
                <p className="font-semibold text-slate-800">{account.gstNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</p>
                <p className="font-semibold text-slate-800">{account.panNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Partner / Referral</p>
                <p className="font-semibold text-slate-800">{account.partnerId?.name || 'Direct Signup'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 px-6 gap-6 bg-slate-50">
              {['Overview', 'Subscriptions', 'Users & Access'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold border-b-2 transition-all ${
                    activeTab === tab 
                      ? 'text-indigo-600 border-indigo-600' 
                      : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Technical State Dashboard */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Platform Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500">Registered Users</p>
                          <p className="text-2xl font-black text-slate-800">{account.technicalState?.totalUsers || 0}</p>
                          <p className="text-xs text-emerald-600 font-semibold">{account.technicalState?.activeUsers || 0} currently active</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500">Last Active Session</p>
                          <p className="text-lg font-bold text-slate-800">
                            {account.technicalState?.lastActiveAt ? new Date(account.technicalState.lastActiveAt).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Internal Notes</h3>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-amber-800 text-sm whitespace-pre-wrap">
                        {account.internalNotes || account.notes || 'No internal notes found. Click Edit Profile to add administrative notes.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Subscriptions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Plans</h3>
                    <button onClick={() => toast('Coming in future phase', { icon: '🚧' })} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Assign Plan</button>
                  </div>
                  
                  {account.subscriptions && account.subscriptions.length > 0 ? (
                    account.subscriptions.map(sub => (
                      <div key={sub._id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Monitor className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{account.businessType.replace('_', ' ')} OS</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{sub.billingCycle} billing</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">₹{sub.finalAmount}</p>
                          <p className={`text-xs font-bold ${sub.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>{sub.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                      <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No active subscriptions found.</p>
                      <button onClick={() => toast('Coming in future phase', { icon: '🚧' })} className="mt-3 text-indigo-600 font-bold text-sm hover:underline">Add Subscription</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Users & Access' && (
                <div className="text-center p-12 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                  <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">User Management Module</p>
                  <p className="text-slate-400 text-sm mt-1">Full granular control over tenant users is coming in a future phase.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600"/> 
                Edit Business Profile
              </h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="editProfileForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Name <span className="text-rose-500">*</span></label>
                    <input required type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Legal Name</label>
                    <input type="text" value={editFormData.legalName} onChange={e => setEditFormData({...editFormData, legalName: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name</label>
                    <input type="text" value={editFormData.ownerName} onChange={e => setEditFormData({...editFormData, ownerName: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Type</label>
                  <select value={editFormData.businessType} onChange={e => setEditFormData({...editFormData, businessType: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GST Number</label>
                    <input type="text" value={editFormData.gstNumber} onChange={e => setEditFormData({...editFormData, gstNumber: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</label>
                    <input type="text" value={editFormData.panNumber} onChange={e => setEditFormData({...editFormData, panNumber: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                  <input type="text" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                    <input type="text" value={editFormData.city} onChange={e => setEditFormData({...editFormData, city: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                    <input type="text" value={editFormData.state} onChange={e => setEditFormData({...editFormData, state: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                    <input type="text" value={editFormData.pincode} onChange={e => setEditFormData({...editFormData, pincode: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
              <button disabled={saving} type="submit" form="editProfileForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-rose-100 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Suspend Account?</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Are you sure you want to suspend <strong className="text-slate-800">{account.name}</strong>? 
                This action will immediately revoke all access for all users under this tenant.
              </p>
            </div>
            
            <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                type="button" 
                onClick={() => setIsSuspendModalOpen(false)} 
                className="flex-1 px-5 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  handleStatusUpdate('suspended');
                  setIsSuspendModalOpen(false);
                }} 
                className="flex-1 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm transition-all shadow-rose-200 hover:shadow-rose-300"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Confirmation Modal */}
      {isRestrictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto border-4 border-orange-100 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Restrict Account?</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Are you sure you want to restrict <strong className="text-slate-800">{account.name}</strong>? 
                This action will limit the tenant's features and operations until the restriction is lifted.
              </p>
            </div>
            
            <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                type="button" 
                onClick={() => setIsRestrictModalOpen(false)} 
                className="flex-1 px-5 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  handleStatusUpdate('on_hold');
                  setIsRestrictModalOpen(false);
                }} 
                className="flex-1 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-sm transition-all shadow-orange-200 hover:shadow-orange-300"
              >
                Yes, Restrict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
