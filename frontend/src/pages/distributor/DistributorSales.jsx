import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText, MessageCircle, Truck, X, User, IndianRupee, Camera, Barcode, Share2, PenTool, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ReceiptModal from '../../components/distributor/ReceiptModal';
import CustomSelect from '../../components/common/CustomSelect';
import useOfflineDraft from '../../hooks/useOfflineDraft';
import OfflineDraftIndicator from '../../components/common/OfflineDraftIndicator';
import BarcodeScannerModal from '../../components/common/BarcodeScannerModal';
import SignaturePadModal from '../../components/common/SignaturePadModal';
import CameraPhotoCaptureModal from '../../components/common/CameraPhotoCaptureModal';
import PullToRefreshContainer from '../../components/common/PullToRefreshContainer';
import haptics from '../../utils/haptics';
import { notifyDeliveryRecorded, notifyLowStock } from '../../utils/notifications';
import { enqueueSyncOperation } from '../../services/syncQueue';
import { shareDistributorDelivery } from '../../utils/share';
import { formatBytes } from '../../utils/imageCompressor';
import { getCurrentCoordinates, formatCoordinates, getGoogleMapsUrl } from '../../utils/geolocation';

export default function DistributorSales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentStock, setCurrentStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
  const [showModal, setShowModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    weight: '',
    sellingRate: '',
    discount: '',
    otherCharges: '',
    paidAmount: '',
    paymentMethod: 'CASH',
    customerSignature: null,
    signedBy: '',
    proofPhoto: null,
    proofPhotoSize: null,
    gpsLocation: null
  });

  const { hasDraft, draftData, lastSaved, clearDraft } = useOfflineDraft('distributor_delivery', formData, showModal);

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

  // Auto-fill selling rate when customer changes
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c._id === formData.customerId);
      if (customer && customer.defaultSellingRate) {
        setFormData(prev => ({ ...prev, sellingRate: customer.defaultSellingRate }));
      }
    }
  }, [formData.customerId, customers]);

  const handleStampGps = async () => {
    setIsFetchingGps(true);
    try {
      const pos = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 8000 });
      setFormData(prev => ({
        ...prev,
        gpsLocation: {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy
        }
      }));
      haptics.success();
      toast.success(`Delivery GPS tagged: ${formatCoordinates(pos.latitude, pos.longitude)}`);
    } catch (err) {
      toast.error(err.message || 'Could not retrieve GPS location');
    } finally {
      setIsFetchingGps(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.weight) > currentStock) {
      haptics.warning();
      toast.error(`Cannot deliver ${formData.weight} kg. Only ${currentStock} kg in stock.`);
      return;
    }

    if (!navigator.onLine) {
      const custObj = customers.find(c => c._id === formData.customerId);
      enqueueSyncOperation({
        endpoint: '/distributor/sales',
        method: 'POST',
        payload: formData,
        title: `Delivery to ${custObj?.shopName || 'Shop'} (${formData.weight} KG)`,
        platform: 'CHICKEN_DISTRIBUTOR'
      });
      haptics.success();
      toast.success('Offline mode: Delivery saved to sync queue! Will upload automatically once online.');
      clearDraft();
      setShowModal(false);
      setFormData({ customerId: '', weight: '', sellingRate: '', discount: '', otherCharges: '', paidAmount: '', paymentMethod: 'CASH', customerSignature: null, signedBy: '', proofPhoto: null, proofPhotoSize: null, gpsLocation: null });
      return;
    }

    try {
      const res = await api.post('/distributor/sales', formData);
      haptics.success();
      toast.success('Delivery recorded successfully');
      const custObj = customers.find(c => c._id === formData.customerId);
      notifyDeliveryRecorded({
        saleNumber: res.data.data?.sale?.saleNumber || 'SALE',
        shopName: custObj?.shopName || 'Customer Shop',
        weight: formData.weight
      });
      const remainingStock = currentStock - Number(formData.weight);
      if (remainingStock <= 50) {
        notifyLowStock({ productName: 'Live Broiler Birds', currentStock: remainingStock, minStock: 50, unit: 'KG' });
      }
      clearDraft();
      setShowModal(false);
      setFormData({ customerId: '', weight: '', sellingRate: '', discount: '', otherCharges: '', paidAmount: '', paymentMethod: 'CASH', customerSignature: null, signedBy: '', proofPhoto: null, proofPhotoSize: null, gpsLocation: null });
      fetchData();
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to record delivery');
    }
  };

  const handleWhatsApp = (sale) => {
    haptics.medium();
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
    <PullToRefreshContainer onRefresh={fetchData}>
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
            placeholder="Search shop or receipt..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            title="Scan Receipt / Barcode"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
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
                  onClick={() => shareDistributorDelivery(sale, sale.customer)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
                  title="Share Delivery Slip"
                >
                  <Share2 className="w-4 h-4 text-slate-600" /> Share
                </button>
                <button 
                  onClick={() => handleWhatsApp(sale)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all"
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
                <OfflineDraftIndicator
                  hasDraft={hasDraft}
                  lastSaved={lastSaved}
                  onRestore={() => {
                    if (draftData) {
                      setFormData(draftData);
                      toast.success('Delivery draft restored!');
                    }
                  }}
                  onDiscard={() => {
                    clearDraft();
                    toast.info('Draft discarded.');
                  }}
                />

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

                {/* Proof of Delivery Touch Signature */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">Receiver's Signature</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formData.customerSignature ? `Signed by: ${formData.signedBy || 'Shopkeeper'}` : 'Capture on-screen digital signature'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 ${
                      formData.customerSignature 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {formData.customerSignature ? 'Re-sign' : 'Get Signature'}
                  </button>
                </div>

                {/* Weighing Scale & Proof Photo Capture */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">Weighing Scale Photo</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formData.proofPhoto 
                          ? `Captured (${formatBytes(formData.proofPhotoSize || 0)})` 
                          : 'Snap scale display or delivery crates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {formData.proofPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, proofPhoto: null, proofPhotoSize: null }))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        formData.proofPhoto 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      {formData.proofPhoto ? 'Retake' : 'Take Photo'}
                    </button>
                  </div>
                </div>

                {/* Delivery Drop-off GPS Geotag */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.gpsLocation ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">Shop GPS Geotag</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formData.gpsLocation 
                          ? `${formatCoordinates(formData.gpsLocation.latitude, formData.gpsLocation.longitude)} (±${formData.gpsLocation.accuracy}m)` 
                          : 'Stamp delivery drop-off coordinates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {formData.gpsLocation && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gpsLocation: null }))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove GPS tag"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStampGps}
                      disabled={isFetchingGps}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                        formData.gpsLocation 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      {isFetchingGps ? (
                        <span>Locating...</span>
                      ) : formData.gpsLocation ? (
                        <span>Re-tag</span>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Tag GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
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

      {/* Mobile Camera Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setSearchTerm(code);
          toast.success(`Scanned: ${code}`);
        }}
        title="Scan Delivery Receipt"
        subtitle="Align the receipt barcode or delivery slip under the camera"
      />

      {/* Touch Signature Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        initialSignerName={customers.find(c => c._id === formData.customerId)?.ownerName || ''}
        title="Delivery Proof of Receipt"
        subtitle="Shopkeeper verifies weight and acceptance"
        onSave={({ signatureDataUrl, signerName }) => {
          setFormData(prev => ({
            ...prev,
            customerSignature: signatureDataUrl,
            signedBy: signerName
          }));
        }}
      />

      {/* Mobile Camera Photo Capture & Client Compression */}
      <CameraPhotoCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        title="Weighing Scale / Crate Photo"
        subtitle="Align weighing scale display or loaded crates"
        instructionGuide="Ensure scale digital numbers are sharp and legible"
        onCapture={(result) => {
          setFormData(prev => ({
            ...prev,
            proofPhoto: result.dataUrl,
            proofPhotoSize: result.compressedBytes
          }));
          toast.success(`Scale photo compressed (${formatBytes(result.compressedBytes)})`);
        }}
      />
      </div>
    </PullToRefreshContainer>
  );
}
