import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Headset, Plus, LifeBuoy, AlertCircle, CheckCircle2, Clock, CheckCircle, Ticket, XCircle } from 'lucide-react';

export default function SASupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ organizationId: '', subject: '', description: '', priority: 'MEDIUM' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [tickRes, accRes] = await Promise.all([
        api.get('/platform/support-tickets'),
        api.get('/platform/business-accounts')
      ]);
      setTickets(tickRes.data.data.tickets);
      setAccounts(accRes.data.data.accounts);
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/platform/support-tickets/${id}/status`, { status });
      toast.success('Ticket status updated');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/support-tickets', formData);
      toast.success('Support ticket created!');
      setIsModalOpen(false);
      setFormData({ organizationId: '', subject: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL': return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold border border-rose-200 shadow-sm flex items-center gap-1 w-max"><AlertCircle className="w-3.5 h-3.5" /> CRITICAL</span>;
      case 'HIGH': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200 shadow-sm flex items-center gap-1 w-max"><AlertCircle className="w-3.5 h-3.5" /> HIGH</span>;
      case 'MEDIUM': return <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-md text-xs font-bold border border-sky-200 shadow-sm flex items-center gap-1 w-max">MEDIUM</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1 w-max">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><Ticket className="w-3 h-3" /> OPEN</span>;
      case 'IN_PROGRESS': return <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><Clock className="w-3 h-3" /> IN PROGRESS</span>;
      case 'RESOLVED': return <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> RESOLVED</span>;
      default: return <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><XCircle className="w-3 h-3" /> CLOSED</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Headset className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Central Helpdesk</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage and resolve cross-OS support requests from all tenants.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" /> Log Incident
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Details</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Profile</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Level</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LifeBuoy className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Inbox Zero!</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">There are no open support tickets. Your tenants are happy.</p>
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-base">{ticket.subject}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1 text-ellipsis overflow-hidden max-w-[250px] whitespace-nowrap">ID: {ticket._id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{ticket.organizationId?.name || 'Unknown Account'}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 px-2 py-0.5 bg-slate-100 rounded w-max border border-slate-200">
                        {ticket.osProduct.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <select 
                        value={ticket.status} 
                        onChange={(e) => handleUpdate(ticket._id, e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <LifeBuoy className="w-6 h-6 text-indigo-600"/> 
                Log Support Incident
              </h2>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Affected Business Account <span className="text-rose-500">*</span></label>
                <select required value={formData.organizationId} onChange={e => setFormData({...formData, organizationId: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                  <option value="">Select Tenant Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.businessType.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Incident Subject <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Brief summary of the issue" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority Level <span className="text-rose-500">*</span></label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold">
                  <option value="LOW">Low - Minimal Impact</option>
                  <option value="MEDIUM">Medium - Degraded Performance</option>
                  <option value="HIGH">High - Significant Impact</option>
                  <option value="CRITICAL">Critical - System Outage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Description <span className="text-rose-500">*</span></label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="Provide steps to reproduce and any relevant information..."></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
