import { useState, useEffect } from 'react';
import { Search, Plus, FileText, CheckCircle2, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [],
    transportCost: 0,
    otherCost: 0,
    paidAmount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, custRes, prodRes] = await Promise.all([
        api.get('/supplier/invoices'),
        api.get('/supplier/customers'),
        api.get('/supplier/products')
      ]);
      setInvoices(invRes.data.data.invoices);
      setCustomers(custRes.data.data.customers);
      setProducts(prodRes.data.data.products);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, mrp: 0, discountType: 'none', discountValue: 0, rate: 0, total: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    item[field] = value;
    
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        item.mrp = prod.sellingPrice || 0;
        item.discountType = 'none';
        item.discountValue = 0;
        item.rate = item.mrp;
      }
    }
    
    if (['product', 'mrp', 'discountType', 'discountValue'].includes(field)) {
      const currentMrp = Number(item.mrp) || 0;
      const currentDiscount = Number(item.discountValue) || 0;
      
      if (item.discountType === 'percentage') {
        item.rate = currentMrp - (currentMrp * (currentDiscount / 100));
      } else if (item.discountType === 'flat') {
        item.rate = currentMrp - currentDiscount;
      } else {
        item.rate = currentMrp;
      }
      if (item.rate < 0) item.rate = 0;
    }
    
    item.total = (Number(item.quantity) || 0) * (item.rate || 0);
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) return toast.error('Add at least one item');
    if (formData.items.some(i => !i.product)) return toast.error('Select product for all items');

    const subTotal = formData.items.reduce((acc, item) => acc + item.total, 0);
    const grandTotal = subTotal + Number(formData.transportCost) + Number(formData.otherCost);
    const dueAmount = grandTotal - Number(formData.paidAmount);

    const payload = {
      ...formData,
      items: formData.items.map(item => {
        let discountAmount = 0;
        if (item.discountType === 'percentage') {
          discountAmount = item.mrp * (item.discountValue / 100) * item.quantity;
        } else if (item.discountType === 'flat') {
          discountAmount = item.discountValue * item.quantity;
        }
        
        return {
          product: item.product,
          quantity: item.quantity,
          rate: item.mrp, 
          discountAmount: discountAmount,
          total: item.total
        };
      }),
      subTotal,
      grandTotal,
      dueAmount
    };

    try {
      await api.post('/supplier/invoices', payload);
      toast.success('Invoice created successfully');
      setShowModal(false);
      fetchData();
      setFormData({ customer: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', items: [], transportCost: 0, otherCost: 0, paidAmount: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Invoices</h1>
          <p className="text-slate-500">Manage and track customer billing.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Create Direct Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice # or Customer..."
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
                <th className="px-6 py-4">Invoice Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No invoices found. Generate one from an Order.</td></tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr key={invoice._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                        <div>
                          <p className="font-bold text-slate-800">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{invoice.customer?.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">₹{invoice.grandTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedInvoice(invoice)} className="text-slate-400 hover:text-emerald-600 mr-3"><Download className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Create Direct Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="invoiceForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Customer *</label>
                    <select required className="input" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                      <option value="">Select Customer...</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Invoice Date *</label>
                    <input required type="date" className="input" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Due Date</label>
                    <input type="date" className="input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 w-32">Avail Stock</th>
                        <th className="p-3 w-20">Qty</th>
                        <th className="p-3 w-28">MRP (₹)</th>
                        <th className="p-3 w-36">Discount</th>
                        <th className="p-3 w-28">Rate (₹)</th>
                        <th className="p-3 w-28">Total</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, index) => {
                        const product = products.find(p => p._id === item.product);
                        const isStockLow = product && product.currentStock < item.quantity;
                        
                        return (
                          <tr key={index} className={isStockLow ? "bg-red-50/50" : ""}>
                            <td className="p-2">
                              <select required className="input py-1.5" value={item.product} onChange={e => updateItem(index, 'product', e.target.value)}>
                                <option value="">Select...</option>
                                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                              </select>
                            </td>
                            <td className="p-2">
                              {product ? (
                                <span className={`font-semibold ${isStockLow ? 'text-red-600' : 'text-slate-600'}`}>
                                  {product.currentStock} {product.unit}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-2"><input required type="number" min="1" className="input py-1.5 px-2" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="p-2"><input required type="number" min="0" step="0.01" className="input py-1.5 px-2" value={item.mrp} onChange={e => updateItem(index, 'mrp', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <select className="input py-1.5 px-1 text-xs w-16" value={item.discountType} onChange={e => updateItem(index, 'discountType', e.target.value)}>
                                  <option value="none">None</option>
                                  <option value="percentage">%</option>
                                  <option value="flat">₹</option>
                                </select>
                                <input type="number" min="0" step="0.01" className="input py-1.5 px-2 w-full" disabled={item.discountType === 'none'} value={item.discountValue} onChange={e => updateItem(index, 'discountValue', e.target.value === '' ? '' : Number(e.target.value))} />
                              </div>
                            </td>
                            <td className="p-2"><input type="number" className="input py-1.5 px-2 bg-slate-50 font-medium text-emerald-700" readOnly value={item.rate.toFixed(2)} /></td>
                            <td className="p-2 font-semibold text-slate-800">₹{item.total.toFixed(2)}</td>
                            <td className="p-2 text-center"><button type="button" onClick={() => removeItem(index)} className="text-red-500 font-bold text-xl hover:text-red-700"><Trash2 className="w-4 h-4 mx-auto" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button type="button" onClick={addItem} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                  </div>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold">₹{formData.items.reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Transport/Delivery</span>
                      <input type="number" className="input w-24 py-1" value={formData.transportCost} onChange={e => setFormData({...formData, transportCost: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                      <span className="text-slate-500">Advance Received</span>
                      <input type="number" className="input w-24 py-1 border-emerald-300 focus:ring-emerald-500" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span className="text-slate-800">Grand Total</span>
                      <span className="text-emerald-600">₹{(formData.items.reduce((a, b) => a + (Number(b.total) || 0), 0) + (Number(formData.transportCost) || 0) + (Number(formData.otherCost) || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="invoiceForm" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">Generate Invoice</button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Tax Invoice</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn btn-primary bg-slate-800 hover:bg-slate-900">Print / PDF</button>
                <button onClick={() => setSelectedInvoice(null)} className="btn btn-secondary"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>
            </div>
            
            <div className="p-8 bg-white overflow-y-auto print:overflow-visible print:p-0 flex-1" id="invoice-print-area">
              <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">TAX INVOICE</h1>
                  <p className="text-slate-500 mt-1">Invoice No: <span className="font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span></p>
                  <p className="text-slate-500">Date: <span className="font-bold text-slate-800">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span></p>
                  {selectedInvoice.dueDate && <p className="text-slate-500">Due Date: <span className="font-bold text-red-600">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></p>}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-emerald-600">ApexSupply</h2>
                  <p className="text-sm text-slate-500 mt-1">123 Logistics Avenue, Industrial Estate</p>
                  <p className="text-sm text-slate-500">GSTIN: 27AADCB2230M1Z2</p>
                  <p className="text-sm text-slate-500">contact@apexsupply.com</p>
                </div>
              </div>

              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 w-1/2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                <p className="font-bold text-slate-800 text-lg">{selectedInvoice.customer?.name}</p>
                {selectedInvoice.customer?.businessName && <p className="text-slate-600">{selectedInvoice.customer.businessName}</p>}
                <p className="text-slate-600">{selectedInvoice.customer?.phone}</p>
              </div>

              <div className="mb-8">
                <table className="w-full text-left text-sm border-collapse border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 border border-slate-200">Description</th>
                      <th className="p-3 border border-slate-200 text-right">Qty</th>
                      <th className="p-3 border border-slate-200 text-right">Rate (₹)</th>
                      <th className="p-3 border border-slate-200 text-right">Discount</th>
                      <th className="p-3 border border-slate-200 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => {
                      const prod = products.find(p => p._id === item.product);
                      return (
                        <tr key={idx}>
                          <td className="p-3 border border-slate-200 font-medium text-slate-800">{prod ? prod.name : 'Unknown Product'}</td>
                          <td className="p-3 border border-slate-200 text-right">{item.quantity} {prod?.unit || ''}</td>
                          <td className="p-3 border border-slate-200 text-right">{item.rate?.toLocaleString()}</td>
                          <td className="p-3 border border-slate-200 text-right text-red-500">{item.discountAmount ? `-₹${item.discountAmount.toLocaleString()}` : '-'}</td>
                          <td className="p-3 border border-slate-200 text-right font-bold text-slate-800">{item.total?.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-16">
                <div className="w-80 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoice.subTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Transport & Handling</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoice.transportCost?.toLocaleString() || 0}</span>
                  </div>
                  {selectedInvoice.otherCost > 0 && (
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Other Adjustments</span>
                      <span className="font-semibold text-slate-800">₹{selectedInvoice.otherCost?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                    <span className="font-bold text-slate-800 text-base">Grand Total</span>
                    <span className="font-black text-emerald-600 text-xl">₹{selectedInvoice.grandTotal?.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.dueAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600 font-bold px-3 py-1">
                      <span>Amount Due:</span>
                      <span>₹{selectedInvoice.dueAmount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-800 text-sm mb-1">Payment Instructions</p>
                  <p className="text-xs text-slate-500">Bank: HDFC Bank Ltd</p>
                  <p className="text-xs text-slate-500">A/C No: 50200012345678</p>
                  <p className="text-xs text-slate-500">IFSC: HDFC0001234</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm mb-1">For ApexSupply</p>
                  <div className="h-12"></div>
                  <p className="text-xs text-slate-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
            
            <style jsx global>{`
              @media print {
                body * { visibility: hidden; }
                #invoice-print-area, #invoice-print-area * { visibility: visible; }
                #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
