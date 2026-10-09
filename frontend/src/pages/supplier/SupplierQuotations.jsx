import { useState, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet, Check, X, FileText, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    items: [{ product: '', quantity: 1, rate: 0 }],
    transportCost: 0,
    otherCost: 0,
    validUntil: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotRes, custRes, prodRes] = await Promise.all([
        api.get('/supplier/quotations'),
        api.get('/supplier/customers'),
        api.get('/supplier/products')
      ]);
      setQuotations(quotRes.data.data.quotations);
      setCustomers(custRes.data.data.customers);
      setProducts(prodRes.data.data.products);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, rate: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].rate = selectedProduct.sellingPrice || 0;
      }
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const grandTotal = subTotal + Number(formData.transportCost) + Number(formData.otherCost);
    return { subTotal, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { subTotal, grandTotal } = calculateTotals();
      
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          amount: item.quantity * item.rate
        })),
        subTotal,
        grandTotal
      };

      await api.post('/supplier/quotations', payload);
      toast.success('Quotation generated successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quotation');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/supplier/quotations/${id}/status`, { status });
      toast.success(`Quotation marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      items: [{ product: '', quantity: 1, rate: 0 }],
      transportCost: 0,
      otherCost: 0,
      validUntil: ''
    });
  };

  const { subTotal, grandTotal } = calculateTotals();

  const filteredQuotations = quotations.filter(q => 
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (q.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Quotations</h1>
          <p className="text-slate-500">Create estimates and proposals for your customers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" /> New Quotation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Quote No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading quotations...</td></tr>
              ) : filteredQuotations.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No quotations found.</td></tr>
              ) : (
                filteredQuotations.map(quote => (
                  <tr key={quote._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><FileSpreadsheet className="w-4 h-4" /></div>
                        <span className="font-bold text-slate-800">{quote.quotationNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{quote.customer?.name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(quote.quotationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">₹{quote.grandTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        quote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                        quote.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        quote.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        quote.status === 'CONVERTED' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {quote.status === 'DRAFT' && (
                          <button onClick={() => updateStatus(quote._id, 'SENT')} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100" title="Mark Sent"><Send className="w-4 h-4" /></button>
                        )}
                        {(quote.status === 'DRAFT' || quote.status === 'SENT') && (
                          <>
                            <button onClick={() => updateStatus(quote._id, 'ACCEPTED')} className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100" title="Mark Accepted"><Check className="w-4 h-4" /></button>
                            <button onClick={() => updateStatus(quote._id, 'REJECTED')} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Mark Rejected"><X className="w-4 h-4" /></button>
                          </>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="View PDF">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">New Quotation</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Customer *</label>
                  <select required className="input" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Valid Until</label>
                  <input type="date" className="input" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Items</h3>
                  <button type="button" onClick={handleAddItem} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 w-32">Qty</th>
                        <th className="px-4 py-3 w-40">Rate (₹)</th>
                        <th className="px-4 py-3 w-40 text-right">Amount (₹)</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <select required className="input py-1.5" value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)}>
                              <option value="">Select Product</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td className="p-2">
                            <input required type="number" min="0.1" step="0.1" className="input py-1.5" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))} />
                          </td>
                          <td className="p-2">
                            <input required type="number" min="0" className="input py-1.5" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value === '' ? '' : Number(e.target.value))} />
                          </td>
                          <td className="p-2 text-right font-medium text-slate-800">
                            {(item.quantity * item.rate).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            {formData.items.length > 1 && (
                              <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end border-t border-slate-100 pt-6">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-32">Transport (₹)</span>
                    <input type="number" min="0" className="input py-1" value={formData.transportCost} onChange={e => setFormData({...formData, transportCost: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-32">Other Cost (₹)</span>
                    <input type="number" min="0" className="input py-1" value={formData.otherCost} onChange={e => setFormData({...formData, otherCost: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                    <span className="font-bold text-slate-800">Grand Total</span>
                    <span className="text-xl font-bold text-emerald-600">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4 justify-end sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary px-8">Cancel</button>
                <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 px-8">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
