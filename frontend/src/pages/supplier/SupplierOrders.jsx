import { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Truck, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useOfflineDraft from '../../hooks/useOfflineDraft';
import OfflineDraftIndicator from '../../components/common/OfflineDraftIndicator';
import haptics from '../../utils/haptics';
import { notifyOrderCreated } from '../../utils/notifications';

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [formData, setFormData] = useState({
    customer: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [],
    transportCost: 0,
    otherCost: 0,
    paidAmount: 0,
    deliverImmediately: false,
    vehicle: '',
    driver: ''
  });

  const { hasDraft, draftData, lastSaved, clearDraft } = useOfflineDraft('supplier_order', formData, showModal);

  useEffect(() => {
    fetchData();
    const handleReconnect = () => fetchData();
    window.addEventListener('apex-network-reconnect', handleReconnect);
    window.addEventListener('online', handleReconnect);
    return () => {
      window.removeEventListener('apex-network-reconnect', handleReconnect);
      window.removeEventListener('online', handleReconnect);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, productsRes, logRes] = await Promise.all([
        api.get('/supplier/orders'),
        api.get('/supplier/customers'),
        api.get('/supplier/products'),
        api.get('/supplier/logistics')
      ]);
      setOrders(ordersRes.data.data.orders);
      setCustomers(customersRes.data.data.customers);
      setProducts(productsRes.data.data.products);
      setVehicles(logRes.data.data.vehicles || []);
      setDrivers(logRes.data.data.drivers || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    haptics.medium();
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
    haptics.heavy();
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      haptics.warning();
      return toast.error('Add at least one item');
    }
    if (formData.items.some(i => !i.product)) {
      haptics.warning();
      return toast.error('Select product for all items');
    }
    
    if (formData.deliverImmediately) {
      if (!formData.vehicle) {
        haptics.warning();
        return toast.error('Select a vehicle for immediate delivery');
      }
      if (!formData.driver) {
        haptics.warning();
        return toast.error('Select a driver for immediate delivery');
      }
    }

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
      const res = await api.post('/supplier/orders', payload);
      haptics.success();
      toast.success('Sales order created successfully');
      const custObj = customers.find(c => c._id === formData.customer);
      notifyOrderCreated({
        orderNo: res.data.data?.order?.orderNumber || 'ORD',
        customerName: custObj?.name || 'Customer',
        totalAmount: grandTotal
      });
      clearDraft();
      setShowModal(false);
      fetchData();
      setFormData({ customer: '', orderDate: new Date().toISOString().split('T')[0], items: [], transportCost: 0, otherCost: 0, paidAmount: 0, deliverImmediately: false, vehicle: '', driver: '' });
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to create order');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/supplier/orders/${id}/status`, { status });
      haptics.success();
      toast.success(`Order status updated to ${status}`);
      fetchData();
    } catch (error) {
      haptics.error();
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Orders</h1>
          <p className="text-slate-500">Manage customer orders and dispatch.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> New Sales Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">No orders found.</div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="p-4 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-base">₹{order.grandTotal.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Value</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 text-xs truncate">{order.customer?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{order.customer?.phone || 'Commercial Site'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className={`py-1 px-2 text-[11px] rounded-lg border font-bold touch-manipulation ${
                        order.status === 'DELIVERED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        order.status === 'PROCESSING' ? 'text-amber-700 bg-amber-50 border-amber-200' : 
                        'text-slate-700 bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button 
                      onClick={() => setSelectedOrder(order)} 
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 bg-white hover:bg-slate-50 touch-manipulation"
                      aria-label="View Order"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Order Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No orders found.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShoppingCart className="w-4 h-4" /></div>
                        <div>
                          <p className="font-bold text-slate-800">{order.orderNumber}</p>
                          <p className="text-xs text-slate-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{order.customer?.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">₹{order.grandTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`input py-1 px-2 text-xs w-32 border-slate-200 font-bold ${
                          order.status === 'DELIVERED' ? 'text-emerald-700 bg-emerald-50' :
                          order.status === 'PROCESSING' ? 'text-amber-700 bg-amber-50' : 'text-slate-700 bg-slate-50'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="text-slate-400 hover:text-emerald-600 font-medium text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 ml-auto">
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-4xl overflow-hidden h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Create Sales Order</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">
                <OfflineDraftIndicator
                  hasDraft={hasDraft}
                  lastSaved={lastSaved}
                  onRestore={() => {
                    if (draftData) {
                      setFormData(draftData);
                      toast.success('Order draft restored!');
                    }
                  }}
                  onDiscard={() => {
                    clearDraft();
                    toast.info('Draft discarded.');
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Customer *</label>
                    <select required className="input" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                      <option value="">Select Customer...</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Order Date *</label>
                    <input required type="date" className="input" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[620px]">
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
                            <td className="p-2 text-center"><button type="button" onClick={() => removeItem(index)} className="text-red-500 font-bold text-xl hover:text-red-700">&times;</button></td>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <input type="checkbox" checked={formData.deliverImmediately} onChange={e => setFormData({...formData, deliverImmediately: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded" />
                        <div>
                          <span className="block text-sm font-bold text-emerald-800">Fulfill & Deliver Immediately</span>
                          <span className="block text-xs text-emerald-600 mt-0.5">Deducts stock from inventory instantly</span>
                        </div>
                      </label>
                    </div>
                    {formData.deliverImmediately && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="label">Vehicle *</label>
                          <select className="input" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})}>
                            <option value="">Select...</option>
                            {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber?.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Driver *</label>
                          <select className="input" value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})}>
                            <option value="">Select...</option>
                            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold">₹{formData.items.reduce((a, b) => a + b.total, 0)}</span>
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
            
            <div className="p-3 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0 sticky bottom-0">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 sm:flex-initial btn btn-secondary py-2.5">Cancel</button>
              <button type="submit" form="orderForm" className="flex-1 sm:flex-initial btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-2.5">Confirm Order</button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-3xl overflow-hidden h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Order Details</h2>
                <p className="text-sm text-slate-500">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-1"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-semibold text-slate-800">{selectedOrder.customer?.name || 'Unknown'}</p>
                  {selectedOrder.customer?.businessName && <p className="text-sm text-slate-500">{selectedOrder.customer.businessName}</p>}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</p>
                  <p className="font-semibold text-slate-800">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold">{selectedOrder.status}</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3">Items</h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[420px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, i) => {
                        const product = products.find(p => p._id === item.product);
                        return (
                          <tr key={i}>
                            <td className="p-3 font-medium text-slate-700">{product ? product.name : 'Unknown Product'}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">₹{item.rate?.toLocaleString()}</td>
                            <td className="p-3 text-right text-red-500">{item.discountAmount ? `-₹${item.discountAmount.toLocaleString()}` : '-'}</td>
                            <td className="p-3 text-right font-bold text-slate-800">₹{item.total?.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold">₹{selectedOrder.subTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transport Cost</span>
                    <span className="font-semibold">₹{selectedOrder.transportCost?.toLocaleString() || 0}</span>
                  </div>
                  {selectedOrder.otherCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Other Cost</span>
                      <span className="font-semibold">₹{selectedOrder.otherCost?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
                    <span className="font-bold text-slate-800">Grand Total</span>
                    <span className="font-bold text-lg text-emerald-600">₹{selectedOrder.grandTotal?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 border-t border-slate-100 flex justify-end bg-white shrink-0 sticky bottom-0">
              <button onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto btn btn-secondary py-2.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
