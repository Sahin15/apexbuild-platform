import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, Shield, Mail, Phone, MoreVertical, Search, CheckCircle, XCircle, ShieldAlert, KeyRound, Ban } from 'lucide-react';

export default function SATeamMembers() {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', platformRole: 'SUPER_ADMIN'
  });
  
  const fetchMembers = () => {
    setLoading(true);
    api.get('/platform/team-members')
       .then(res => setMembers(res.data.data))
       .catch(() => toast.error("Failed to load team members"))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/team-members', formData);
      toast.success('Team member created successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', platformRole: 'SUPER_ADMIN' });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team member');
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change this member's status to ${status}?`)) return;
    try {
      await api.patch(`/platform/team-members/${id}/status`, { status });
      toast.success(`Member status updated to ${status}`);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Access Control</h1>
            <p className="text-indigo-200 text-sm font-medium mt-1">Manage global administrators and HQ support staff</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search directory..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all shadow-inner backdrop-blur-sm" 
            />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all whitespace-nowrap">
            <Plus className="w-5 h-5" /> Grant Access
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
         <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading directory...</p>
         </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold text-slate-700 mb-1">No personnel found.</p>
          <p className="text-sm">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map(member => (
            <div key={member._id} className="bg-white rounded-2xl border border-slate-200 p-6 relative flex flex-col hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl uppercase shadow-sm border border-indigo-100">
                  {member.name.substring(0, 2)}
                </div>
                <div className="flex items-center gap-2">
                  {member.status === 'active' ? (
                    <button onClick={() => handleStatusChange(member._id, 'inactive')} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition-colors border border-slate-100" title="Suspend Account">
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleStatusChange(member._id, 'active')} className="text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors border border-slate-100" title="Reactivate Account">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-xl truncate pr-2">{member.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {(member.platformRole || 'STAFF').replace('_', ' ')}
                  </span>
                  {member.status === 'active' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase"><CheckCircle className="w-3 h-3"/> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase"><Ban className="w-3 h-3"/> Suspended</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-auto">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400 shrink-0"/> <span className="truncate font-medium">{member.email}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400 shrink-0"/> <span className="font-medium">{member.phone || 'Not provided'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><ShieldAlert className="w-6 h-6 text-indigo-600"/> Provision HQ Access</h2>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. Jane Doe" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address <span className="text-rose-500">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="jane@apexbuild.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="+1 234 567 890" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security Clearance <span className="text-rose-500">*</span></label>
                  <select value={formData.platformRole} onChange={e => setFormData({...formData, platformRole: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                    <option value="SUPER_ADMIN">Global Administrator</option>
                    <option value="SUPPORT_ADMIN">Support Specialist</option>
                    <option value="SALES_ADMIN">Sales Representative</option>
                    <option value="FINANCE_ADMIN">Finance Officer</option>
                    <option value="PLATFORM_ADMIN">Implementation Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Temporary Password <span className="text-rose-500">*</span></label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  <KeyRound className="w-5 h-5" /> Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
