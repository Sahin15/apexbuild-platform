import { useState, useEffect } from 'react';
import { Plus, Search, Receipt, ArrowUpRight, ArrowDownRight, X, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorPayments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'CUSTOMER_COLLECTION',
    amount: '',
    customerId: '',
    supplierId: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, customersRes, suppliersRes] = await Promise.all([
        api.get('/distributor/payments'),
        api.get('/distributor/customers'),
        api.get('/distributor/suppliers')
      ]);
      setPayments(paymentsRes.data.data.payments);
      setCustomers(customersRes.data.data.customers);
      setSuppliers(suppliersRes.data.data.suppliers);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.type === 'CUSTOMER_COLLECTION' && !formData.customerId) return toast.error('Select a customer');
    if (formData.type === 'SUPPLIER_PAYMENT' && !formData.supplierId) return toast.error('Select a supplier');

    try {
      await api.post('/distributor/payments', formData);
      toast.success('Payment recorded successfully');
      setShowModal(false);
      setFormData({ type: 'CUSTOMER_COLLECTION', amount: '', customerId: '', supplierId: '', paymentMethod: 'CASH', reference: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.customer?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(p.date).toISOString().split('T')[0] === filterDate : true;
    return matchesSearch && matchesDate;
  });

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Payments</h1>
            <p className="text-xs font-bold text-slate-500">Settle Ledgers</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full shadow-lg shadow-amber-200 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search party or ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
          />
        </div>
        <input 
          type="date" 
          value={filterDate} 
          onChange={e => setFilterDate(e.target.value)} 
          className="h-full py-3 px-2 rounded-xl border border-slate-200 text-slate-700 focus:border-amber-500 bg-white font-bold text-xs" 
          title="Filter by Date"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="bg-red-50 text-red-500 px-3 rounded-xl font-bold text-xs">Clear</button>
        )}
      </div>

      {/* Mobile Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No payments found.</p>
          </div>
        ) : (
          filteredPayments.map(payment => {
            const isCollection = payment.type === 'CUSTOMER_COLLECTION';
            return (
              <div key={payment._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCollection ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {isCollection ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight max-w-[150px] truncate">
                      {isCollection ? payment.customer?.shopName : payment.supplier?.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(payment.date).toLocaleDateString()} • {payment.paymentMethod}
                    </p>
                    {payment.reference && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {payment.reference}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black text-lg ${isCollection ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isCollection ? '+' : '-'}₹{payment.amount.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                    {isCollection ? 'Received' : 'Paid Out'}
                  </p>
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
          <div className="bg-white w-full md:max-w-xl h-[90vh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="paymentForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selection */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'CUSTOMER_COLLECTION'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${formData.type === 'CUSTOMER_COLLECTION' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Receive Money
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'SUPPLIER_PAYMENT'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${formData.type === 'SUPPLIER_PAYMENT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Pay Supplier
                  </button>
                </div>

                {/* Party Selection */}
                {formData.type === 'CUSTOMER_COLLECTION' ? (
                  <div className="relative z-50">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">Select Shop</label>
                    <CustomSelect 
                      value={formData.customerId}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      options={customers.map(c => ({ value: c._id, label: c.shopName, subtext: `Due: ₹${c.currentDue}` }))}
                      placeholder="Choose customer..."
                      searchable={true}
                      required={true}
                      className="p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-base font-bold bg-slate-50"
                    />
                  </div>
                ) : (
                  <div className="relative z-50">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">Select Supplier</label>
                    <CustomSelect 
                      value={formData.supplierId}
                      onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                      options={suppliers.map(s => ({ value: s._id, label: s.name, subtext: `Payable: ₹${s.currentPayable}` }))}
                      placeholder="Choose supplier..."
                      searchable={true}
                      required={true}
                      className="p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 text-base font-bold bg-slate-50"
                    />
                  </div>
                )}

                {/* Amount Input */}
                <div className={`p-4 rounded-2xl border ${formData.type === 'CUSTOMER_COLLECTION' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${formData.type === 'CUSTOMER_COLLECTION' ? 'text-emerald-700' : 'text-red-700'}`}>Amount (₹)</label>
                  <input type="number" required min="1" inputMode="numeric" pattern="[0-9]*" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value === '' ? '' : Number(e.target.value)})} className={`w-full bg-transparent focus:outline-none text-4xl font-black ${formData.type === 'CUSTOMER_COLLECTION' ? 'text-emerald-800 placeholder-emerald-300' : 'text-red-800 placeholder-red-300'}`} placeholder="0" />
                </div>

                {/* Additional details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3 rounded-2xl relative z-40">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Method</label>
                    <CustomSelect 
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      options={[
                        { value: 'CASH', label: '💵 Cash' },
                        { value: 'UPI', label: '📱 UPI' },
                        { value: 'BANK_TRANSFER', label: '🏦 Bank' },
                        { value: 'CHEQUE', label: '📝 Cheque' }
                      ]}
                      className="bg-transparent focus:outline-none text-base font-bold text-slate-800"
                    />
                  </div>
                  <div className="border border-slate-200 p-3 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Reference No</label>
                    <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-300 mt-1" placeholder="Optional" />
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notes</label>
                  <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-800 placeholder-slate-300" placeholder="Optional details" />
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button form="paymentForm" type="submit" className={`w-full py-4 text-white rounded-2xl text-lg font-black shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 ${formData.type === 'CUSTOMER_COLLECTION' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                {formData.type === 'CUSTOMER_COLLECTION' ? 'Confirm Collection' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
