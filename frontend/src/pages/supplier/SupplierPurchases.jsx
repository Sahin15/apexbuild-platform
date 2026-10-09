import { useState, useEffect } from 'react';
import { Search, Plus, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const [formData, setFormData] = useState({
    vendor: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [],
    transportCost: 0,
    otherCost: 0,
    paidAmount: 0,
    stockReceived: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, vendorsRes, productsRes] = await Promise.all([
        api.get('/supplier/purchases'),
        api.get('/supplier/vendors'),
        api.get('/supplier/products')
      ]);
      setPurchases(purchasesRes.data.data.purchases);
      setVendors(vendorsRes.data.data.vendors);
      setProducts(productsRes.data.data.products);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, rate: 0, total: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-calculate total and fetch product rate if product changes
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) newItems[index].rate = prod.purchasePrice;
    }
    
    newItems[index].total = newItems[index].quantity * newItems[index].rate;
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
      subTotal,
      grandTotal,
      dueAmount,
      paymentStatus: dueAmount === 0 ? 'PAID' : (formData.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')
    };

    try {
      await api.post('/supplier/purchases', payload);
      toast.success('Purchase order created successfully');
      setShowModal(false);
      fetchData();
      setFormData({ vendor: '', purchaseDate: new Date().toISOString().split('T')[0], items: [], transportCost: 0, otherCost: 0, paidAmount: 0, stockReceived: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase');
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.vendor?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-slate-500">Manage vendor purchases and incoming stock.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO number or vendor..."
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
                <th className="px-6 py-4">PO Number & Date</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4 text-center">Payment Status</th>
                <th className="px-6 py-4 text-center">Stock Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading purchases...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No purchases found.</td></tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{purchase.purchaseNumber}</p>
                      <p className="text-xs text-slate-500">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{purchase.vendor?.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{purchase.grandTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        purchase.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        purchase.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {purchase.stockReceived ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">
                          <CheckCircle2 className="w-4 h-4" /> Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-xs bg-amber-50 px-2 py-1 rounded">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedPurchase(purchase)} className="text-slate-400 hover:text-emerald-600 mr-3"><FileText className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="purchaseForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vendor *</label>
                    <select required className="input" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})}>
                      <option value="">Select Vendor...</option>
                      {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Purchase Date *</label>
                    <input required type="date" className="input" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 w-24">Qty</th>
                        <th className="p-3 w-32">Rate (₹)</th>
                        <th className="p-3 w-32">Total</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <select required className="input py-1.5" value={item.product} onChange={e => updateItem(index, 'product', e.target.value)}>
                              <option value="">Select...</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="p-2"><input required type="number" min="1" className="input py-1.5" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                          <td className="p-2"><input required type="number" min="0" step="0.01" className="input py-1.5" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                          <td className="p-2 font-semibold">₹{item.total}</td>
                          <td className="p-2 text-center"><button type="button" onClick={() => removeItem(index)} className="text-red-500 font-bold text-xl">&times;</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button type="button" onClick={addItem} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.stockReceived} onChange={e => setFormData({...formData, stockReceived: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                        <span className="text-sm font-medium text-slate-700">Stock Received Immediately (Updates Inventory Ledger)</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold">₹{formData.items.reduce((a, b) => a + b.total, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Transport Cost</span>
                      <input type="number" className="input w-24 py-1" value={formData.transportCost} onChange={e => setFormData({...formData, transportCost: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                      <span className="text-slate-500">Amount Paid Now</span>
                      <input type="number" className="input w-24 py-1 border-emerald-300 focus:ring-emerald-500" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span className="text-slate-800">Grand Total</span>
                      <span className="text-emerald-600">₹{(formData.items.reduce((a, b) => a + b.total, 0) + formData.transportCost + formData.otherCost).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="purchaseForm" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">Save Purchase & Update Stock</button>
            </div>
          </div>
        </div>
      )}

      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Purchase Order</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn btn-primary bg-slate-800 hover:bg-slate-900">Print / PDF</button>
                <button onClick={() => setSelectedPurchase(null)} className="btn btn-secondary"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>
            </div>
            
            <div className="p-8 bg-white overflow-y-auto print:overflow-visible print:p-0 flex-1" id="purchase-print-area">
              <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">PURCHASE ORDER</h1>
                  <p className="text-slate-500 mt-1">PO No: <span className="font-bold text-slate-800">{selectedPurchase.purchaseNumber}</span></p>
                  <p className="text-slate-500">Date: <span className="font-bold text-slate-800">{new Date(selectedPurchase.purchaseDate).toLocaleDateString()}</span></p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-emerald-600">ApexSupply</h2>
                  <p className="text-sm text-slate-500 mt-1">123 Logistics Avenue, Industrial Estate</p>
                  <p className="text-sm text-slate-500">GSTIN: 27AADCB2230M1Z2</p>
                  <p className="text-sm text-slate-500">contact@apexsupply.com</p>
                </div>
              </div>

              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 w-1/2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor Details</h3>
                <p className="font-bold text-slate-800 text-lg">{selectedPurchase.vendor?.name}</p>
                {selectedPurchase.vendor?.companyName && <p className="text-slate-600">{selectedPurchase.vendor.companyName}</p>}
                <p className="text-slate-600">{selectedPurchase.vendor?.phone}</p>
              </div>

              <div className="mb-8">
                <table className="w-full text-left text-sm border-collapse border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 border border-slate-200">Description</th>
                      <th className="p-3 border border-slate-200 text-right">Qty</th>
                      <th className="p-3 border border-slate-200 text-right">Rate (₹)</th>
                      <th className="p-3 border border-slate-200 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items.map((item, idx) => {
                      const prod = products.find(p => p._id === item.product);
                      return (
                        <tr key={idx}>
                          <td className="p-3 border border-slate-200 font-medium text-slate-800">{prod ? prod.name : 'Unknown Product'}</td>
                          <td className="p-3 border border-slate-200 text-right">{item.quantity} {prod?.unit || ''}</td>
                          <td className="p-3 border border-slate-200 text-right">{item.rate?.toLocaleString()}</td>
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
                    <span className="font-semibold text-slate-800">₹{selectedPurchase.subTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Transport / Freight</span>
                    <span className="font-semibold text-slate-800">₹{selectedPurchase.transportCost?.toLocaleString() || 0}</span>
                  </div>
                  {selectedPurchase.otherCost > 0 && (
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Other Adjustments</span>
                      <span className="font-semibold text-slate-800">₹{selectedPurchase.otherCost?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                    <span className="font-bold text-slate-800 text-base">Grand Total</span>
                    <span className="font-black text-emerald-600 text-xl">₹{selectedPurchase.grandTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-bold px-3 py-1">
                    <span>Payment Status:</span>
                    <span className={
                      selectedPurchase.paymentStatus === 'PAID' ? 'text-emerald-600' : 
                      selectedPurchase.paymentStatus === 'PARTIAL' ? 'text-blue-600' : 'text-red-600'
                    }>{selectedPurchase.paymentStatus}</span>
                  </div>
                  {selectedPurchase.dueAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600 font-bold px-3 py-1">
                      <span>Amount Due:</span>
                      <span>₹{selectedPurchase.dueAmount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-800 text-sm mb-1">Notes</p>
                  <p className="text-xs text-slate-500">Stock Status: {selectedPurchase.stockReceived ? 'Received' : 'Pending'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm mb-1">Authorized Signatory</p>
                  <div className="h-12"></div>
                  <p className="text-xs text-slate-500">ApexSupply</p>
                </div>
              </div>
            </div>
            
            <style jsx global>{`
              @media print {
                body * { visibility: hidden; }
                #purchase-print-area, #purchase-print-area * { visibility: visible; }
                #purchase-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
