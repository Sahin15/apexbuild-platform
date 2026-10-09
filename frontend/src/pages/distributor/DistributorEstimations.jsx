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
    try {
      await api.post('/distributor/estimations', { ...formData, date: selectedDate });
      toast.success('Estimation added');
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
      message: 'Are you sure you want to delete this estimation? This action cannot be undone.',
      confirmText: 'Delete Estimation'
    });
    if (!isConfirmed) return;
    
    try {
      await api.delete(`/distributor/estimations/${id}`);
      toast.success('Estimation deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete estimation');
    }
  };

  const totalEstimatedWeight = estimations.reduce((acc, curr) => acc + curr.requestedWeight, 0);
  const fulfilledWeight = estimations.filter(e => e.status === 'FULFILLED').reduce((acc, curr) => acc + curr.requestedWeight, 0);

  const filteredEstimations = estimations.filter(e => 
    e.customer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.customer?.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && estimations.length === 0) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Pre-Orders</h1>
            <p className="text-xs font-bold text-slate-500">Plan purchases</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Date Filter & Overview Cards */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
          />
        </div>
        <div className="relative w-32 shrink-0">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-full py-3 px-3 rounded-xl border border-slate-200 text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-bold text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Total Needed</p>
          <p className="text-2xl font-black text-indigo-800">{totalEstimatedWeight} <span className="text-sm font-bold opacity-70">KG</span></p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Delivered</p>
          <p className="text-2xl font-black text-emerald-800">{fulfilledWeight} <span className="text-sm font-bold opacity-70">KG</span></p>
        </div>
      </div>

      {/* Estimations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEstimations.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No pre-orders for {new Date(selectedDate).toLocaleDateString()}.</p>
          </div>
        ) : (
          filteredEstimations.map(est => {
            const isFulfilled = est.status === 'FULFILLED';
            return (
              <div key={est._id} className={`bg-white rounded-2xl shadow-sm border ${isFulfilled ? 'border-emerald-200' : 'border-slate-100'} p-4 flex justify-between items-center transition-colors`}>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-slate-800 text-sm">{est.customer?.shopName}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{est.customer?.route || 'No Route'} {est.notes ? `• ${est.notes}` : ''}</p>
                  
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleStatusChange(est._id, isFulfilled ? 'PENDING' : 'FULFILLED')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all ${
                        isFulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isFulfilled ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {est.status}
                    </button>
                    <button 
                      onClick={() => handleDelete(est._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 bg-slate-50 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end justify-center h-full">
                  <span className={`text-2xl font-black ${isFulfilled ? 'text-emerald-700' : 'text-indigo-600'}`}>{est.requestedWeight}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">KG</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Form Full-screen Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full md:max-w-xl h-[70vh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">Add Pre-Order</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="estimationForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Shop *</label>
                  
                  {/* Custom Dropdown Trigger */}
                  <div 
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className={`text-base font-bold ${formData.customerId ? 'text-slate-800' : 'text-slate-400'}`}>
                      {formData.customerId ? customers.find(c => c._id === formData.customerId)?.shopName || 'Customer Selected' : 'Choose a customer...'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Dropdown Menu */}
                  {showCustomerDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden">
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search shop..." 
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
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
                            className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${formData.customerId === c._id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'}`}
                          >
                            {c.shopName}
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{c.route || 'No route'}</div>
                          </div>
                        ))}
                        {customers.filter(c => c.shopName.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-sm">No customers found</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden input to ensure required validation passes if using native submit logic */}
                  <input type="hidden" required value={formData.customerId} />
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Requested Weight (KG) *</label>
                  <input type="number" required min="1" step="0.5" inputMode="decimal" pattern="[0-9]*" value={formData.requestedWeight} onChange={e => setFormData({...formData, requestedWeight: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-4xl font-black text-indigo-800 placeholder-indigo-300" placeholder="0.0" />
                </div>
                
                <div className="border border-slate-200 p-3 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notes (Optional)</label>
                  <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="E.g. Early morning delivery" />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 pb-safe">
              <button form="estimationForm" type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2">
                Save Request <Calculator className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
