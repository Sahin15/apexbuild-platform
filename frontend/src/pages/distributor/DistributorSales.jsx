import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText, MessageCircle, Truck, X, User, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ReceiptModal from '../../components/distributor/ReceiptModal';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorSales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentStock, setCurrentStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
  const [showModal, setShowModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    weight: '',
    sellingRate: '',
    discount: '',
    otherCharges: '',
    paidAmount: '',
    paymentMethod: 'CASH'
  });

  const fetchData = async () => {
    try {
      const [salesRes, customersRes, stockRes] = await Promise.all([
        api.get('/distributor/sales'),
        api.get('/distributor/customers'),
        api.get('/distributor/stock')
      ]);
      setSales(salesRes.data.data.sales);
      setCustomers(customersRes.data.data.customers.filter(c => c.status === 'ACTIVE'));
      setCurrentStock(stockRes.data.data.stock?.currentStock || 0);
    } catch (error) {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-fill selling rate when customer changes
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c._id === formData.customerId);
      if (customer && customer.defaultSellingRate) {
        setFormData(prev => ({ ...prev, sellingRate: customer.defaultSellingRate }));
      }
    }
  }, [formData.customerId, customers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.weight) > currentStock) {
      toast.error(`Cannot deliver ${formData.weight} kg. Only ${currentStock} kg in stock.`);
      return;
    }

    try {
      await api.post('/distributor/sales', formData);
      toast.success('Delivery recorded successfully');
      setShowModal(false);
      setFormData({ customerId: '', weight: '', sellingRate: '', discount: '', otherCharges: '', paidAmount: '', paymentMethod: 'CASH' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record delivery');
    }
  };

  const handleWhatsApp = (sale) => {
    if (!sale.customer?.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const text = `Hello *${sale.customer.shopName}*,\n\nHere is your delivery update for ${new Date(sale.saleDate).toLocaleDateString()}:\n📦 Delivered: ${sale.weight} KG\n💰 Rate: ₹${sale.sellingRate}/KG\n💵 Total Bill: ₹${sale.netAmount?.toLocaleString()}\n✅ Paid Now: ₹${sale.paidAmount?.toLocaleString()}\n\n*Current Balance Due: ₹${sale.dueAmount?.toLocaleString()}*\n\nThank you,\nApexSupply.`;
    const encodedText = encodeURIComponent(text);
    let phone = sale.customer.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  const totals = useMemo(() => {
    const gross = (Number(formData.weight) || 0) * (Number(formData.sellingRate) || 0);
    const net = gross - (Number(formData.discount) || 0) + (Number(formData.otherCharges) || 0);
    const due = net - (Number(formData.paidAmount) || 0);
    return { gross, net, due };
  }, [formData]);

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.customer?.shopName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(s.saleDate).toISOString().split('T')[0] === filterDate : true;
    return matchesSearch && matchesDate;
  });

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Deliveries</h1>
            <p className="text-xs font-bold text-slate-500">Stock: <span className={currentStock > 0 ? "text-emerald-600" : "text-red-600"}>{currentStock} KG</span></p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
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
            placeholder="Search shop..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
          />
        </div>
        <input 
          type="date" 
          value={filterDate} 
          onChange={e => setFilterDate(e.target.value)} 
          className="h-full py-3 px-2 rounded-xl border border-slate-200 text-slate-700 focus:border-emerald-500 bg-white font-bold text-xs" 
          title="Filter by Date"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="bg-red-50 text-red-500 px-3 rounded-xl font-bold text-xs">Clear</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-24">
        {filteredSales.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No deliveries found.</p>
          </div>
        ) : (
          filteredSales.map(sale => (
            <div key={sale._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col active:bg-slate-50 transition-colors">
              <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-sm">
                    {sale.customer?.shopName?.substring(0, 2) || 'CS'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{sale.customer?.shopName}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sale.saleNumber} • {new Date(sale.saleDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">₹{sale.netAmount.toLocaleString()}</p>
                  <p className={`text-[10px] font-bold mt-1 ${sale.paymentStatus === 'PAID' ? 'text-emerald-600' : sale.paymentStatus === 'PARTIAL' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {sale.paymentStatus}
                  </p>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Weight & Rate</span>
                  <span className="text-sm font-bold text-slate-700">{sale.weight} KG @ ₹{sale.sellingRate}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balance Due</span>
                  <span className="text-sm font-bold text-red-600">₹{sale.dueAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="px-2 py-2 flex justify-end gap-2 bg-white">
                <button 
                  onClick={() => handleWhatsApp(sale)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button 
                  onClick={() => setActiveReceipt(sale)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  <FileText className="w-4 h-4" /> Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Form Full-screen Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full md:max-w-xl h-[92dvh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
            <div className="pt-2 pb-1 flex justify-center md:hidden bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">New Delivery</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="deliveryForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="relative z-50">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><User className="w-4 h-4"/> Select Shop</label>
                  <CustomSelect 
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                    options={customers.map(c => ({ value: c._id, label: c.shopName, subtext: c.route }))}
                    placeholder="Choose customer..."
                    searchable={true}
                    required={true}
                    className="p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-base font-bold bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Weight (KG)</label>
                    <input type="number" required min="0.1" step="0.1" inputMode="decimal" pattern="[0-9]*" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-3xl font-black text-slate-800 placeholder-slate-300" placeholder="0.0" />
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                    <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Rate</label>
                    <input type="number" required min="1" step="0.1" inputMode="decimal" pattern="[0-9]*" value={formData.sellingRate} onChange={e => setFormData({...formData, sellingRate: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-3xl font-black text-emerald-700 placeholder-emerald-300" placeholder="0" />
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl shadow-inner flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">Net Bill</span>
                  <span className="text-3xl font-black text-white">₹{totals.net.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Collected (₹)</label>
                    <input type="number" min="0" max={totals.net} inputMode="numeric" pattern="[0-9]*" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-2xl font-bold text-slate-800 placeholder-slate-300" placeholder="0" />
                  </div>
                  <div className="border border-slate-200 p-3 rounded-2xl relative z-40">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Method</label>
                    <CustomSelect 
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      options={[
                        { value: 'CASH', label: '💵 Cash' },
                        { value: 'UPI', label: '📱 UPI' },
                        { value: 'BANK_TRANSFER', label: '🏦 Bank' }
                      ]}
                      className="bg-transparent focus:outline-none text-lg font-bold text-slate-800"
                    />
                  </div>
                </div>

                {totals.due > 0 && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center text-red-700">
                    <span className="text-xs font-bold uppercase tracking-wide">Adding Due</span>
                    <span className="text-lg font-black">₹{totals.due.toLocaleString()}</span>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 sticky bottom-0">
              <button form="deliveryForm" type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2 touch-manipulation">
                Save Delivery <Truck className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeReceipt && (
        <ReceiptModal 
          sale={activeReceipt} 
          onClose={() => setActiveReceipt(null)} 
        />
      )}
    </div>
  );
}
