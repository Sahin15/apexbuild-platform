import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, Building2, MapPin, Phone, Mail, CheckCircle, XCircle, RefreshCw, Briefcase, Award } from 'lucide-react';

export default function SAPartners() {
  const [partners, setPartners] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ companyName: '', contactPerson: '', email: '', phone: '', region: '', partnershipType: 'RESELLER', commissionRate: 10, notes: '' });

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/partners');
      setPartners(res.data.data.partners);
    } catch (error) {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/partners', formData);
      toast.success('Partner onboarded successfully!');
      setIsModalOpen(false);
      setFormData({ companyName: '', contactPerson: '', email: '', phone: '', region: '', partnershipType: 'RESELLER', commissionRate: 10, notes: '' });
      fetchPartners();
    } catch (error) {
      toast.error('Failed to onboard partner');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/platform/partners/${id}/status`, { status });
      toast.success(`Partner status updated to ${status}`);
      fetchPartners();
    } catch (error) {
      toast.error('Failed to update partner status');
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'STRATEGIC': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-200">STRATEGIC</span>;
      case 'INTEGRATOR': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200">INTEGRATOR</span>;
      case 'REFERRAL': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">REFERRAL</span>;
      default: return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">RESELLER</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Network</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage global resellers, integrators, and strategic alliances.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" /> Onboard Partner
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading network data...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold text-slate-800 mb-1">No Partners Yet</p>
            <p className="text-sm">Start building your global sales network by onboarding a partner.</p>
          </div>
        ) : (
          partners.map(partner => (
            <div key={partner._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col group relative">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm">
                    {partner.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[150px]">{partner.companyName}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {partner.region}</p>
                  </div>
                </div>
                {getTypeBadge(partner.partnershipType)}
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Users className="w-4 h-4 text-slate-400" /> {partner.contactPerson}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400" /> {partner.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400" /> {partner.phone}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Commission</span>
                  <span className="font-black text-indigo-600 text-sm flex items-center gap-1"><Award className="w-4 h-4"/> {partner.commissionRate}%</span>
                </div>
                <select 
                  value={partner.status} 
                  onChange={(e) => handleStatusChange(partner._id, e.target.value)}
                  className={`border rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition-colors shadow-sm ${partner.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : partner.status === 'INACTIVE' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><Building2 className="w-6 h-6 text-indigo-600"/> Onboard New Partner</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Contact <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address <span className="text-rose-500">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Region/Territory <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="e.g. North America" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Partner Type <span className="text-rose-500">*</span></label>
                  <select value={formData.partnershipType} onChange={e => setFormData({...formData, partnershipType: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option value="RESELLER">Reseller</option>
                    <option value="INTEGRATOR">System Integrator</option>
                    <option value="REFERRAL">Referral Partner</option>
                    <option value="STRATEGIC">Strategic Alliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Commission (%) <span className="text-rose-500">*</span></label>
                  <input required type="number" min="0" max="100" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Onboard Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
