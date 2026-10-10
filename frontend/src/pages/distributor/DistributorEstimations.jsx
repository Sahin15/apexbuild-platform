import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, Clock, Trash2, Calculator, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function DistributorEstimations() {
  const confirm = useConfirm();
  const [estimations, setEstimations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    requestedWeight: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/distributor/estimations?date=${selectedDate}`);
      setEstimations(res.data.data.estimations);
      setCustomers(res.data.data.customers);
    } catch (error) {
      toast.error('Failed to load estimations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Please select a customer shop');
      return;
    }
    if (!formData.requestedWeight || Number(formData.requestedWeight) <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }
    try {
      await api.post('/distributor/estimations', { ...formData, date: selectedDate });
      toast.success('Pre-order request saved');
      setShowModal(false);
      setFormData({ customerId: '', requestedWeight: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add estimation');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/distributor/estimations/${id}`, { status: newStatus });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Estimation',
      message: 'Are you sure you want to delete this pre-order? This action cannot be undone.',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    
    try {
      await api.delete(`/distributor/estimations/${id}`);
      toast.success('Pre-order deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete estimation');
    }
  };

  const totalEstimatedWeight = estimations.reduce((acc, curr) => acc + (curr.requestedWeight || 0), 0);
  const fulfilledWeight = estimations.filter(e => e.status === 'FULFILLED').reduce((acc, curr) => acc + (curr.requestedWeight || 0), 0);

  const filteredEstimations = estimations.filter(e => 
    e.customer?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.customer?.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && estimations.length === 0) {
    return (
      <div className="flex justify-center p-12 h-full items-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Pre-Orders & Demand</h1>
            <p className="text-xs font-semibold text-slate-500">Plan wholesale farm purchases</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-amber-200 transition-all active:scale-95 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Pre-Order
        </button>
      </div>

      {/* Date Filter & Overview Cards */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search customer shop or route..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm bg-white font-medium outline-none transition-colors"
          />
        </div>
        <div className="relative w-40 shrink-0">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-full py-3 px-3 rounded-xl border border-slate-200 text-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-bold text-xs outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border border-amber-200/80 flex flex-col justify-between shadow-sm">
          <p className="text-[11px] uppercase font-black text-amber-700 tracking-wider mb-1">Total Demand</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-900">{totalEstimatedWeight} <span className="text-sm font-bold opacity-75">KG</span></p>
        </div>
        <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 flex flex-col justify-between shadow-sm">
          <p className="text-[11px] uppercase font-black text-emerald-700 tracking-wider mb-1">Delivered</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900">{fulfilledWeight} <span className="text-sm font-bold opacity-75">KG</span></p>
        </div>
      </div>

      {/* Estimations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEstimations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 col-span-full">
            <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No pre-orders recorded for {new Date(selectedDate).toLocaleDateString()}.</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 underline"
            >
              + Create first pre-order
            </button>
          </div>
        ) : (
          filteredEstimations.map(est => {
            const isFulfilled = est.status === 'FULFILLED';
            return (
              <div key={est._id} className={`bg-white rounded-2xl shadow-sm border ${isFulfilled ? 'border-emerald-200' : 'border-slate-100'} p-4 flex justify-between items-center transition-all hover:shadow-md`}>
                <div className="flex flex-col gap-1 pr-2">
                  <h3 className="font-extrabold text-slate-800 text-sm">{est.customer?.shopName}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {est.customer?.route || 'No Route'} {est.notes ? `• ${est.notes}` : ''}
                  </p>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleStatusChange(est._id, isFulfilled ? 'PENDING' : 'FULFILLED')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                        isFulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isFulfilled ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {est.status}
                    </button>
                    <button 
                      onClick={() => handleDelete(est._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 active:scale-95 transition-all"
                      title="Delete pre-order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end justify-center shrink-0">
                  <span className={`text-2xl font-black ${isFulfilled ? 'text-emerald-700' : 'text-amber-600'}`}>{est.requestedWeight}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">KG</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Pre-Order Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col my-auto border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Add Pre-Order</h2>
                  <p className="text-xs text-slate-500 font-medium">Record advance demand for delivery</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Form */}
            <form id="estimationForm" onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Select Shop */}
              <div className="relative">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Select Shop *</label>
                
                <div 
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full p-4 border border-slate-200 hover:border-amber-400 rounded-2xl bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className={`text-base font-bold ${formData.customerId ? 'text-slate-800' : 'text-slate-400'}`}>
                    {formData.customerId ? customers.find(c => c._id === formData.customerId)?.shopName || 'Customer Selected' : 'Choose a customer...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showCustomerDropdown && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search shop..." 
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {customers.filter(c => c.shopName.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                        <div 
                          key={c._id} 
                          onClick={() => {
                            setFormData({...formData, customerId: c._id});
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                          className={`p-3 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors ${formData.customerId === c._id ? 'bg-amber-100/70 text-amber-900 font-extrabold' : 'text-slate-700 font-medium'}`}
                        >
                          <div className="text-sm font-bold text-slate-800">{c.shopName}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">{c.route || 'No route'} • {c.phone}</div>
                        </div>
                      ))}
                      {customers.filter(c => c.shopName.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-sm">No customers found</div>
                      )}
                    </div>
                  </div>
                )}
                
                <input type="hidden" required value={formData.customerId} />
              </div>
              
              {/* Requested Weight */}
              <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 shadow-inner">
                <label className="block text-xs font-black text-amber-700 uppercase tracking-wider mb-2">Requested Weight (KG) *</label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    step="0.5" 
                    inputMode="decimal" 
                    value={formData.requestedWeight} 
                    onChange={e => setFormData({...formData, requestedWeight: e.target.value === '' ? '' : Number(e.target.value)})} 
                    className="w-full bg-transparent focus:outline-none text-4xl font-black text-amber-900 placeholder-amber-300" 
                    placeholder="0.0" 
                  />
                  <span className="text-xl font-black text-amber-600 ml-2">KG</span>
                </div>
              </div>
              
              {/* Notes */}
              <div className="border border-slate-200 p-4 rounded-2xl bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" 
                  placeholder="E.g. Early morning delivery, fresh batch" 
                />
              </div>

              {/* Submit Button with Generous Bottom Padding */}
              <div className="pt-2 pb-1">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-base font-black shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                  Save Request <Calculator className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
