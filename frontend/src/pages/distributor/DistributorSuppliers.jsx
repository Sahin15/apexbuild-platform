import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Phone, X, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DistributorSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    openingDue: ''
  });

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/distributor/suppliers');
      setSuppliers(res.data.data.suppliers);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/distributor/suppliers/${editingId}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/distributor/suppliers', formData);
        toast.success('Supplier added successfully');
      }
      closeModal();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      companyName: supplier.companyName || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone,
      address: supplier.address || '',
      openingDue: supplier.openingDue || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', companyName: '', contactPerson: '', phone: '', address: '', openingDue: '' });
  };

  const handleCall = (phone) => {
    if (!phone) return toast.error('Phone number not available');
    window.location.href = `tel:${phone}`;
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Suppliers</h1>
            <p className="text-xs font-bold text-slate-500">Total: {suppliers.length} farms</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search farms..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm bg-white"
        />
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No suppliers found.</p>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div key={supplier._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-sm border border-slate-200">
                    {supplier.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">{supplier.name}</h3>
                    {supplier.companyName && <p className="text-xs text-slate-500 mt-1">{supplier.companyName}</p>}
                    {supplier.address && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/>{supplier.address}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black text-sm ${supplier.currentPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ₹{supplier.currentPayable?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Payable</p>
                </div>
              </div>
              
              <div className="border-t border-slate-50 p-2 flex justify-between bg-slate-50/50">
                <button 
                  onClick={() => handleCall(supplier.phone)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 active:bg-blue-100 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
                <button 
                  onClick={() => handleEdit(supplier)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 active:bg-slate-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Form Full-screen Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full md:max-w-xl h-[90vh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={closeModal} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="supplierForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Supplier Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-slate-800 placeholder-slate-400" placeholder="e.g. SK Farms" />
                </div>
                
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Company Name</label>
                  <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-transparent focus:outline-none text-base font-bold text-slate-800 placeholder-slate-400" placeholder="Optional" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Contact Person</label>
                    <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="Optional" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone *</label>
                    <input type="tel" required inputMode="tel" pattern="[0-9]*" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="10 digits" />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Address</label>
                  <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="Farm address" />
                </div>

                <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                  <label className="block text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Opening Payable (₹)</label>
                  <input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={formData.openingDue} onChange={e => setFormData({...formData, openingDue: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-red-800 placeholder-red-300" placeholder="0" disabled={!!editingId} />
                  {!!editingId && <p className="text-[10px] text-red-600 mt-1">Opening balance cannot be changed.</p>}
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 pb-safe">
              <button form="supplierForm" type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all">
                {editingId ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
