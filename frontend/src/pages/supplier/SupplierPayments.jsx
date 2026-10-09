import { useState, useEffect } from 'react';
import { Search, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierPayments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('IN'); // IN or OUT
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'IN',
    customer: '',
    vendor: '',
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payRes, custRes, vendRes] = await Promise.all([
        api.get('/supplier/payments'),
        api.get('/supplier/customers'),
        api.get('/supplier/vendors')
      ]);
      setPayments(payRes.data.data.payments);
      setCustomers(custRes.data.data.customers);
      setVendors(vendRes.data.data.vendors);
    } catch (error) {
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      if (payload.type === 'IN') delete payload.vendor;
      if (payload.type === 'OUT') delete payload.customer;

      await api.post('/supplier/payments', payload);
      toast.success('Payment recorded successfully');
      setShowModal(false);
      resetForm();
      fetchData(); // Refresh to get updated balances and payments
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      customer: '',
      vendor: '',
      amount: '',
      paymentMode: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: ''
    });
  };

  const filteredPayments = payments.filter(p => p.type === activeTab && (
    p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.vendor?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments & Receipts</h1>
          <p className="text-slate-500">Track money moving in and out of your business.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('IN')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'IN' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ArrowDownLeft className="w-5 h-5" /> Money In (Customer Receipts)
          </button>
          <button 
            onClick={() => setActiveTab('OUT')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'OUT' ? 'text-red-600 border-b-2 border-red-600 bg-red-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ArrowUpRight className="w-5 h-5" /> Money Out (Vendor Payments)
          </button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'IN' ? 'receipts' : 'payments'}...`}
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">{activeTab === 'IN' ? 'From Customer' : 'To Vendor'}</th>
                <th className="px-6 py-4">Mode & Ref</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No transactions found.</td></tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeTab === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {activeTab === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{payment.paymentNumber}</p>
                          <p className="text-xs text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {activeTab === 'IN' ? payment.customer?.name : payment.vendor?.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">{payment.paymentMode.replace('_', ' ')}</p>
                      {payment.referenceNumber && <p className="text-xs text-slate-500">{payment.referenceNumber}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`font-bold text-lg ${activeTab === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {activeTab === 'IN' ? '+' : '-'} ₹{payment.amount.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Record Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Transaction Type</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'IN', vendor: ''})}
                    className={`flex-1 py-2 text-sm font-bold ${formData.type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Money In (Receipt)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'OUT', customer: ''})}
                    className={`flex-1 py-2 text-sm font-bold ${formData.type === 'OUT' ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Money Out (Payment)
                  </button>
                </div>
              </div>

              {formData.type === 'IN' ? (
                <div>
                  <label className="label">Select Customer *</label>
                  <select required className="input" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} (Due: ₹{c.currentDue.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label">Select Vendor *</label>
                  <select required className="input" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})}>
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name} (Payable: ₹{v.currentPayable.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input required type="number" min="1" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="input" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Reference Number / UTR</label>
                <input type="text" className="input" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input min-h-[80px]" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className={`btn flex-1 text-white ${formData.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Record {formData.type === 'IN' ? 'Receipt' : 'Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
