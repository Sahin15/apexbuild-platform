import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Bell, Send, Trash2, ShieldAlert, CreditCard, Radio, Activity, RefreshCw } from 'lucide-react';

export default function SANotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'ANNOUNCEMENT', targetAudience: 'ALL_TENANTS' });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/notifications');
      setNotifications(res.data.data.notifications);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/notifications', formData);
      toast.success('Notification broadcasted globally!');
      setIsModalOpen(false);
      setFormData({ title: '', message: '', type: 'ANNOUNCEMENT', targetAudience: 'ALL_TENANTS' });
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to dispatch notification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification? It will be removed from all tenant inboxes.")) return;
    try {
      await api.delete(`/platform/notifications/${id}`);
      toast.success('Notification recalled successfully');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'SECURITY': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'BILLING': return <CreditCard className="w-5 h-5 text-indigo-500" />;
      case 'SYSTEM': return <Activity className="w-5 h-5 text-amber-500" />;
      default: return <Radio className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Broadcast Engine</h1>
            <p className="text-indigo-200 text-sm font-medium mt-1">Dispatch global announcements, alerts, and system notifications.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
            <Send className="w-5 h-5" /> Dispatch Alert
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading broadcasts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Radio className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold text-slate-800 mb-1">Silence is Golden</p>
            <p className="text-sm">No active global notifications have been broadcasted yet.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{notif.type}</span>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mt-0.5">{notif.title}</h3>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {notif.message}
              </p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  {notif.targetAudience.replace('_', ' ')}
                </div>
                <button onClick={() => handleDelete(notif._id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Recall Notification">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><Radio className="w-6 h-6 text-indigo-600"/> Compose Broadcast</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Announcement Title <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg" placeholder="e.g. Scheduled Maintenance Notice" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alert Category <span className="text-rose-500">*</span></label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option value="ANNOUNCEMENT">General Announcement</option>
                    <option value="SYSTEM">System / Maintenance</option>
                    <option value="SECURITY">Security Alert</option>
                    <option value="BILLING">Billing Update</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Audience <span className="text-rose-500">*</span></label>
                  <select value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option value="ALL_TENANTS">All Connected Tenants</option>
                    <option value="SUPER_ADMINS">HQ Staff Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Payload <span className="text-rose-500">*</span></label>
                <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner" placeholder="Detailed notification content..."></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  <Send className="w-5 h-5" /> Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
