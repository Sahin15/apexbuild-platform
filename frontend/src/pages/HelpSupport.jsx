import { useState, useEffect } from 'react';
import { Mail, User, Phone, MessageCircle, Globe, Ticket, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function HelpSupport() {
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data.data.tickets);
    } catch (error) {
      console.warn("Could not fetch tickets");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/support/tickets', ticketForm);
      toast.success('Support ticket submitted successfully!');
      setTicketForm({ subject: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to submit ticket');
    }
  };

  const contactInfo = {
    email: 'apexbuildsoftware@gmail.com',
    owner: 'Sahin Mondal',
    mobile: '8768916367',
    whatsapp: '8337850155',
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent('Hello ApexBuild Support, I need some help with the Distributor OS.');
    window.open(`https://wa.me/91${contactInfo.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-0 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Help & Support</h1>
          <p className="text-slate-400 font-medium">Need assistance? We're here to help.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Info Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> ApexBuild Software
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Founder & CEO</p>
                  <p className="font-bold text-slate-800 text-lg">{contactInfo.owner}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Support</p>
                  <a href={`tel:+91${contactInfo.mobile}`} className="font-bold text-slate-800 text-lg hover:text-emerald-600 transition-colors">
                    +91 {contactInfo.mobile}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                  <a href={`mailto:${contactInfo.email}`} className="font-bold text-slate-800 text-lg hover:text-emerald-600 transition-colors break-all">
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-6">
          
          <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-2">Chat on WhatsApp</h3>
              <p className="text-emerald-700/80 font-medium mb-6 text-sm">
                Get instant support and troubleshooting directly on WhatsApp.
              </p>
              <button 
                onClick={handleWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
              >
                <MessageCircle className="w-5 h-5" /> Start Conversation
              </button>
            </div>
            <MessageCircle className="absolute -right-6 -bottom-6 w-40 h-40 text-emerald-500 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Visit our Website</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">apexbuildsoftware.com</p>
            </div>
            <a 
              href="https://apexbuildsoftware.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>

        </div>
      </div>
      
      {/* Support Tickets Section */}
      <div className="mt-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-indigo-500" /> Submit a Support Ticket
        </h2>
        
        <form onSubmit={handleCreateTicket} className="space-y-4 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
              <input required type="text" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What do you need help with?" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
              <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (System Down)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea required value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="Please describe your issue in detail..."></textarea>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all">
            <Ticket className="w-5 h-5" /> Submit Ticket
          </button>
        </form>

        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">Your Recent Tickets</h3>
        {tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div key={ticket._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">{ticket.subject}</h4>
                  <p className="text-sm text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()} • Priority: <span className="font-semibold text-slate-700">{ticket.priority}</span></p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            You haven't submitted any support tickets yet.
          </div>
        )}
      </div>
      
      {/* Footer Branding */}
      <div className="text-center pt-8 border-t border-slate-200 mt-8">
        <h4 className="font-black text-slate-300 text-2xl uppercase tracking-widest">ApexBuild</h4>
        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Software Solutions</p>
      </div>
    </div>
  );
}
