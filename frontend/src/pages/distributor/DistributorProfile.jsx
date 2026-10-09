import { useState, useEffect } from 'react';
import { User as UserIcon, Phone, MapPin, Activity, FileText, CheckCircle2, ShieldAlert, Edit2, Save, CreditCard, Bell, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorProfile() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    licenseNumber: user?.licenseNumber || '',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', formData);
      toast.success('Profile updated successfully!');
      
      const currentToken = localStorage.getItem('token');
      login(res.data.data.user, currentToken);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isDriver = user?.role === 'DRIVER';

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-8 p-4 md:p-8 space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row items-center p-6 md:p-8 gap-6">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0 text-3xl font-black uppercase border-4 border-white">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">{user?.name}</h1>
          <p className="text-slate-500 font-medium mt-1">{user?.email || 'user@example.com'}</p>
          <p className="text-emerald-700 font-bold tracking-wide text-[10px] bg-emerald-100 border border-emerald-200 inline-block px-3 py-1 rounded-full mt-3 uppercase">
            {user?.role} ROLE
          </p>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex flex-row gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'personal' ? 'bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'}`}
        >
          <UserIcon className="w-5 h-5" /> <span className="font-bold text-sm">Personal Details</span>
        </button>

        <button 
          onClick={() => setActiveTab('address')}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'address' ? 'bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'}`}
        >
          <MapPin className="w-5 h-5" /> <span className="font-bold text-sm">Contact Address</span>
        </button>

        <button 
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'bank' ? 'bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'}`}
        >
          <CreditCard className="w-5 h-5" /> <span className="font-bold text-sm">Bank Details</span>
        </button>

        <button 
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'documents' ? 'bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'}`}
        >
          <FileText className="w-5 h-5" /> <span className="font-bold text-sm">Documents</span>
        </button>

        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'}`}
        >
          <Bell className="w-5 h-5" /> <span className="font-bold text-sm">Notifications</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10">
        
        {/* PERSONAL DETAILS TAB */}
        {activeTab === 'personal' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800">Personal Details</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage your basic identity and emergency contact information.</p>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="font-bold text-slate-800 text-lg">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" /> {user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</p>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> {user?.bloodGroup ? <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase text-sm">{user.bloodGroup}</span> : 'Not provided'}</p>
                  </div>
                </div>

                <div className="space-y-6 bg-red-50 p-6 rounded-2xl border border-red-100 self-start">
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4" /> Emergency Contact
                  </h3>
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Contact Name</p>
                    <p className="font-bold text-red-900 text-lg">{user?.emergencyContactName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Contact Phone</p>
                    <p className="font-bold text-red-900 text-lg flex items-center gap-2"><Phone className="w-4 h-4 text-red-400" /> {user?.emergencyContactPhone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone Number</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Blood Group</label>
                    <CustomSelect 
                      value={formData.bloodGroup}
                      onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }))}
                      placeholder="Select Blood Group"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Emergency Contact Name</label>
                      <input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Emergency Contact Phone</label>
                      <input type="text" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-purple-200 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* CONTACT ADDRESS TAB */}
        {activeTab === 'address' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Contact Address</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Update your permanent and current living address.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Residential Address</label>
                <textarea rows="4" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Enter your complete address..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-purple-200 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BANK DETAILS TAB */}
        {activeTab === 'bank' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Bank Details</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Configure your bank account for payroll and settlements.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); toast.success('Bank details saved (Mock)'); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Account Holder Name</label>
                  <input type="text" placeholder="As it appears on bank statement" value={formData.bankAccountName} onChange={e => setFormData({...formData, bankAccountName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Account Number</label>
                  <input type="password" placeholder="••••••••••••" value={formData.bankAccountNumber} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">IFSC Code</label>
                  <input type="text" placeholder="e.g. SBIN0001234" value={formData.bankIfsc} onChange={e => setFormData({...formData, bankIfsc: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none uppercase" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Bank Name</label>
                  <input type="text" placeholder="e.g. State Bank of India" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-purple-200 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Update Bank Info
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Identity Documents</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Upload and manage your required KYC documents.</p>
            </div>

            <div className="space-y-6">
              {isDriver && (
                <div className="p-6 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600 border border-slate-200">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Driving License</h3>
                      <p className="text-sm text-slate-500 font-medium">Required for operating assigned vehicles.</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors w-full md:w-auto">
                    Upload License
                  </button>
                </div>
              )}

              <div className="p-6 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600 border border-slate-200">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Aadhar Card / National ID</h3>
                    <p className="text-sm text-slate-500 font-medium">Required for KYC verification.</p>
                  </div>
                </div>
                <button className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors w-full md:w-auto">
                  Upload ID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Notification Preferences</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Control how and when you receive alerts from the system.</p>
            </div>

            <div className="space-y-6 max-w-2xl">
              <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded text-[#a855f7] focus:ring-[#a855f7]" />
                <div>
                  <h3 className="font-bold text-slate-800">App Push Notifications</h3>
                  <p className="text-sm text-slate-500 font-medium">Receive real-time alerts inside the application for assignments and messages.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded text-[#a855f7] focus:ring-[#a855f7]" />
                <div>
                  <h3 className="font-bold text-slate-800">Email Summary</h3>
                  <p className="text-sm text-slate-500 font-medium">Receive a daily digest of tasks, sales, and payments to your registered email.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded text-[#a855f7] focus:ring-[#a855f7]" />
                <div>
                  <h3 className="font-bold text-slate-800">WhatsApp Alerts</h3>
                  <p className="text-sm text-slate-500 font-medium">Get instant notifications on your WhatsApp for critical events (requires Professional Plan).</p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                <button className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-purple-200">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
