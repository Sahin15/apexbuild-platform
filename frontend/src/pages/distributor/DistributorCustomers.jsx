import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, MessageCircle, Eye, Phone, MapPin, X, Users, Store, Share2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PullToRefreshContainer from '../../components/common/PullToRefreshContainer';
import { shareCustomerLedger } from '../../utils/share';
import CustomerKhataModal from '../../components/common/CustomerKhataModal';

export default function DistributorCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [khataCustomerId, setKhataCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    area: '',
    route: '',
    openingDue: '',
    creditLimit: '',
    defaultSellingRate: ''
  });

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/distributor/customers');
      setCustomers(res.data.data.customers);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/distributor/customers/${editingId}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/distributor/customers', formData);
        toast.success('Customer added successfully');
      }
      closeModal();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleWhatsAppReminder = (customer) => {
    if (!customer.phone && !customer.whatsapp) {
      toast.error('Customer phone number not available');
      return;
    }
    const due = customer.currentDue || 0;
    const text = `Hello *${customer.shopName}*,\n\nThis is a gentle reminder from ApexSupply. Your current outstanding balance is *₹${due.toLocaleString()}*.\n\nPlease clear the dues at your earliest convenience to ensure smooth daily deliveries.\n\nThank you,\nApexSupply.`;
    const encodedText = encodeURIComponent(text);
    let phone = (customer.whatsapp || customer.phone).replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  const handleCall = (customer) => {
    if (!customer.phone) return toast.error('Phone number not available');
    window.location.href = `tel:${customer.phone}`;
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setFormData({
      shopName: customer.shopName,
      ownerName: customer.ownerName || '',
      phone: customer.phone,
      whatsapp: customer.whatsapp || '',
      address: customer.address || '',
      area: customer.area || '',
      route: customer.route || '',
      openingDue: customer.openingDue || '',
      creditLimit: customer.creditLimit || '',
      defaultSellingRate: customer.defaultSellingRate || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ shopName: '', ownerName: '', phone: '', whatsapp: '', address: '', area: '', route: '', openingDue: '', creditLimit: '', defaultSellingRate: '' });
  };

  const filteredCustomers = customers.filter(c => 
    c.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <PullToRefreshContainer onRefresh={fetchCustomers}>
      <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Customers</h1>
            <p className="text-xs font-bold text-slate-500">Total: {customers.length} shops</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95 touch-manipulation"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by shop or phone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm bg-white"
        />
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No customers found.</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:bg-slate-50 transition-colors">
              <Link to={`/distributor/customers/${customer._id}`} className="block p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 font-bold uppercase text-sm border border-amber-200">
                      {customer.shopName.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{customer.shopName}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {customer.route || 'No route'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${customer.currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₹{customer.currentDue?.toLocaleString() || 0}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Due Balance</p>
                  </div>
                </div>
              </Link>
              
              <div className="border-t border-slate-50 p-2 flex justify-between bg-slate-50/50">
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleCall(customer)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-blue-600 bg-blue-50 active:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleWhatsAppReminder(customer)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-emerald-600 bg-emerald-50 active:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => shareCustomerLedger(customer)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-indigo-600 bg-indigo-50 active:bg-indigo-100 transition-colors"
                    title="Share Customer Ledger Statement"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setKhataCustomerId(customer._id)}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-black text-amber-800 bg-amber-100 hover:bg-amber-200 active:scale-95 transition-all shadow-2xs"
                    title="Open Customer Khata Ledger"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Khata</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(customer)}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 active:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Form Full-screen Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full md:max-w-xl h-[92dvh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
            <div className="pt-2 pb-1 flex justify-center md:hidden bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">{editingId ? 'Edit Shop' : 'Add New Shop'}</h2>
              <button onClick={closeModal} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Shop Name *</label>
                    <input type="text" required value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-slate-800 placeholder-slate-400" placeholder="e.g. Royal Chicken Center" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone *</label>
                      <input type="tel" required inputMode="tel" pattern="[0-9]*" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent focus:outline-none text-base font-bold text-slate-800 placeholder-slate-400" placeholder="10 digits" />
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                      <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">WhatsApp</label>
                      <input type="tel" inputMode="tel" pattern="[0-9]*" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-transparent focus:outline-none text-base font-bold text-emerald-800 placeholder-emerald-300" placeholder="Optional" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Route</label>
                      <input type="text" value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="e.g. North Area" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Def. Rate (₹) *</label>
                      <input type="number" required min="1" step="0.5" inputMode="decimal" pattern="[0-9]*" value={formData.defaultSellingRate} onChange={e => setFormData({...formData, defaultSellingRate: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-amber-700 placeholder-slate-400" placeholder="0" />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Address</label>
                    <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="Full shop address" />
                  </div>

                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Opening Due (₹)</label>
                    <input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={formData.openingDue} onChange={e => setFormData({...formData, openingDue: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-amber-800 placeholder-amber-300" placeholder="0" disabled={!!editingId} />
                    {!!editingId && <p className="text-[10px] text-amber-600 mt-1">Opening due cannot be changed after creation.</p>}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 sticky bottom-0">
              <button form="customerForm" type="submit" className="w-full py-4 bg-amber-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-amber-200 hover:bg-amber-700 active:scale-95 transition-all touch-manipulation">
                {editingId ? 'Save Changes' : 'Add Shop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Khata & Credit Ledger Modal */}
      <CustomerKhataModal
        isOpen={!!khataCustomerId}
        onClose={() => setKhataCustomerId(null)}
        customerId={khataCustomerId}
        platform="CHICKEN_DISTRIBUTOR"
        onPaymentRecorded={() => fetchCustomers()}
      />
      </div>
    </PullToRefreshContainer>
  );
}
