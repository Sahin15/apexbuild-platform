import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, Eye, Printer, Edit2, ShoppingCart, IndianRupee, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function DistributorPurchases() {
  const confirm = useConfirm();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    birdType: 'BROILER',
    weight: '',
    purchaseRate: '',
    transportCost: '',
    otherCharges: '',
    vehicleId: '',
    paidAmount: '',
    paymentMethod: 'CASH'
  });

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, vehiclesRes] = await Promise.all([
        api.get('/distributor/purchases'),
        api.get('/distributor/suppliers'),
        api.get('/distributor/vehicles')
      ]);
      setPurchases(purchasesRes.data.data.purchases);
      setSuppliers(suppliersRes.data.data.suppliers.filter(s => s.status === 'ACTIVE'));
      setVehicles(vehiclesRes.data.data.vehicles);
    } catch (error) {
      toast.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/distributor/purchases/${editingId}`, formData);
        toast.success('Purchase updated successfully');
      } else {
        await api.post('/distributor/purchases', formData);
        toast.success('Purchase recorded successfully');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save purchase');
    }
  };

  const handleEdit = (purchase) => {
    setEditingId(purchase._id);
    setFormData({
      supplierId: purchase.supplier?._id || purchase.supplier,
      birdType: purchase.birdType || 'BROILER',
      weight: purchase.weight,
      purchaseRate: purchase.purchaseRate,
      transportCost: purchase.transportCost || 0,
      otherCharges: purchase.otherCharges || 0,
      vehicleId: purchase.vehicleId || '',
      paidAmount: purchase.paidAmount || 0,
      paymentMethod: purchase.paymentStatus === 'UNPAID' ? 'CASH' : 'CASH' 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ supplierId: '', birdType: 'BROILER', weight: '', purchaseRate: '', transportCost: '', otherCharges: '', vehicleId: '', paidAmount: '', paymentMethod: 'CASH' });
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Purchase',
      message: 'Are you sure you want to delete this purchase? This will reverse the stock and supplier ledger.',
      confirmText: 'Delete Purchase'
    });
    if (!isConfirmed) return;
    
    try {
      await api.delete(`/distributor/purchases/${id}`);
      toast.success('Purchase deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete purchase');
    }
  };

  const calculateTotals = () => {
    const gross = (Number(formData.weight) || 0) * (Number(formData.purchaseRate) || 0);
    const total = gross + (Number(formData.transportCost) || 0) + (Number(formData.otherCharges) || 0);
    const due = total - (Number(formData.paidAmount) || 0);
    return { gross, total, due };
  };

  const totals = calculateTotals();

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(p.purchaseDate).toISOString().split('T')[0] === filterDate : true;
    return matchesSearch && matchesDate;
  });

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Purchases</h1>
            <p className="text-xs font-bold text-slate-500">Record inbound stock</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
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
            placeholder="Search PO or supplier..." 
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

      {/* Mobile Purchase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No purchases found.</p>
          </div>
        ) : (
          filteredPurchases.map(purchase => (
            <div key={purchase._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:bg-slate-50 transition-colors">
              <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-sm">
                    {purchase.supplier?.name?.substring(0, 2) || 'SP'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{purchase.supplier?.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{purchase.purchaseNumber} • {new Date(purchase.purchaseDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">₹{purchase.totalAmount.toLocaleString()}</p>
                  <p className={`text-[10px] font-bold mt-1 ${purchase.paymentStatus === 'PAID' ? 'text-emerald-600' : purchase.paymentStatus === 'PARTIAL' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {purchase.paymentStatus}
                  </p>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Weight & Rate</span>
                  <span className="text-sm font-bold text-slate-700">{purchase.weight} KG @ ₹{purchase.purchaseRate}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balance Due</span>
                  <span className="text-sm font-bold text-red-600">₹{purchase.dueAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="px-2 py-2 flex justify-end gap-2 bg-white">
                <button 
                  onClick={() => { setSelectedPurchase(purchase); setShowViewModal(true); }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(purchase)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(purchase._id)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Form Full-screen Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full md:max-w-xl h-[90vh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">{editingId ? 'Edit Purchase' : 'New Purchase'}</h2>
              <button onClick={closeModal} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-safe">
              <form id="purchaseForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">Supplier</label>
                  
                  {/* Custom Dropdown Trigger */}
                  <div 
                    onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className={`text-base font-bold ${formData.supplierId ? 'text-slate-800' : 'text-slate-400'}`}>
                      {formData.supplierId ? suppliers.find(s => s._id === formData.supplierId)?.name || 'Supplier Selected' : 'Select Supplier...'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Dropdown Menu */}
                  {showSupplierDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden">
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search supplier..." 
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1 p-2">
                        {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                          <div 
                            key={s._id} 
                            onClick={() => {
                              setFormData({...formData, supplierId: s._id});
                              setShowSupplierDropdown(false);
                              setSupplierSearch('');
                            }}
                            className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${formData.supplierId === s._id ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-700 font-medium'}`}
                          >
                            {s.name}
                          </div>
                        ))}
                        {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-sm">No suppliers found</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden input to ensure required validation passes if using native submit logic */}
                  <input type="hidden" required value={formData.supplierId} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Weight (KG)</label>
                    <input type="number" required min="1" step="0.1" inputMode="decimal" pattern="[0-9]*" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-3xl font-black text-slate-800 placeholder-slate-300" placeholder="0.0" />
                  </div>
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                    <label className="block text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Rate</label>
                    <input type="number" required min="1" step="0.1" inputMode="decimal" pattern="[0-9]*" value={formData.purchaseRate} onChange={e => setFormData({...formData, purchaseRate: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-3xl font-black text-amber-700 placeholder-amber-300" placeholder="0" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transport (₹)</label>
                    <input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={formData.transportCost} onChange={e => setFormData({...formData, transportCost: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-slate-800 placeholder-slate-300" placeholder="0" />
                  </div>
                  <div className="border border-slate-200 p-3 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Other (₹)</label>
                    <input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={formData.otherCharges} onChange={e => setFormData({...formData, otherCharges: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-lg font-bold text-slate-800 placeholder-slate-300" placeholder="0" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Linked Vehicle (Optional)</label>
                  
                  {/* Custom Dropdown Trigger */}
                  <div 
                    onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className={`text-base font-bold ${formData.vehicleId ? 'text-slate-800' : 'text-slate-400'}`}>
                      {formData.vehicleId ? vehicles.find(v => v._id === formData.vehicleId)?.registrationNumber || 'Vehicle Selected' : 'No Vehicle Selected'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Dropdown Menu */}
                  {showVehicleDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden">
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search vehicle..." 
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1 p-2">
                        <div 
                          onClick={() => {
                            setFormData({...formData, vehicleId: ''});
                            setShowVehicleDropdown(false);
                            setVehicleSearch('');
                          }}
                          className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${!formData.vehicleId ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-700 font-medium'}`}
                        >
                          No Vehicle Selected
                        </div>
                        {vehicles.filter(v => v.registrationNumber.toLowerCase().includes(vehicleSearch.toLowerCase())).map(v => (
                          <div 
                            key={v._id} 
                            onClick={() => {
                              setFormData({...formData, vehicleId: v._id});
                              setShowVehicleDropdown(false);
                              setVehicleSearch('');
                            }}
                            className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${formData.vehicleId === v._id ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-700 font-medium'}`}
                          >
                            {v.registrationNumber} <span className="text-[10px] text-slate-400 ml-2 uppercase">({v.vehicleType})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl shadow-inner flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">Total Cost</span>
                  <span className="text-3xl font-black text-white">₹{totals.total.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Paid Now (₹)</label>
                    <input type="number" min="0" max={totals.total} inputMode="numeric" pattern="[0-9]*" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-transparent focus:outline-none text-2xl font-bold text-slate-800 placeholder-slate-300" placeholder="0" />
                  </div>
                  <div className="border border-slate-200 p-3 rounded-2xl relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Method</label>
                    <div 
                      onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                      className="w-full bg-transparent focus:outline-none text-lg font-bold text-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <span>
                        {formData.paymentMethod === 'CASH' && '💵 Cash'}
                        {formData.paymentMethod === 'UPI' && '📱 UPI'}
                        {formData.paymentMethod === 'BANK_TRANSFER' && '🏦 Bank'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {showPaymentDropdown && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        {['CASH', 'UPI', 'BANK_TRANSFER'].map((method) => (
                          <div 
                            key={method}
                            onClick={() => {
                              setFormData({...formData, paymentMethod: method});
                              setShowPaymentDropdown(false);
                            }}
                            className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors text-base font-bold ${formData.paymentMethod === method ? 'bg-amber-50 text-amber-700' : 'text-slate-700'}`}
                          >
                            {method === 'CASH' && '💵 Cash'}
                            {method === 'UPI' && '📱 UPI'}
                            {method === 'BANK_TRANSFER' && '🏦 Bank'}
                          </div>
                        ))}
                      </div>
                    )}
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
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 pb-safe">
              <button form="purchaseForm" type="submit" className="w-full py-4 bg-amber-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-amber-200 hover:bg-amber-700 active:scale-95 transition-all flex justify-center items-center gap-2">
                {editingId ? 'Save Changes' : 'Confirm Purchase'} <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View PO Modal - Native Sheet */}
      {showViewModal && selectedPurchase && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="bg-white w-full md:max-w-xl h-[85vh] md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl md:rounded-t-none shrink-0">
              <h2 className="text-lg font-black text-slate-800">PO: {selectedPurchase.purchaseNumber}</h2>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-5 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
                <p className="font-bold text-lg text-slate-800">{selectedPurchase.supplier?.name}</p>
                <p className="text-sm text-slate-500">{new Date(selectedPurchase.purchaseDate).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Item</span>
                <span className="font-bold text-slate-800">{selectedPurchase.birdType || 'BROILER'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Weight</span>
                <span className="font-bold text-slate-800">{selectedPurchase.weight} KG</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Rate/KG</span>
                <span className="font-bold text-slate-800">₹{selectedPurchase.purchaseRate}</span>
              </div>
              {selectedPurchase.vehicleId && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Pickup Vehicle</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
                    {vehicles.find(v => v._id === selectedPurchase.vehicleId)?.registrationNumber || 'Unknown'}
                  </span>
                </div>
              )}
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-amber-700">Gross</span>
                  <span className="font-bold text-amber-800">₹{selectedPurchase.grossAmount?.toLocaleString()}</span>
                </div>
                {(selectedPurchase.transportCost > 0 || selectedPurchase.otherCharges > 0) && (
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-amber-600">Extra Charges</span>
                    <span className="font-bold text-amber-700">₹{((selectedPurchase.transportCost || 0) + (selectedPurchase.otherCharges || 0)).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-amber-200 mt-2">
                  <span className="font-bold text-amber-900">Total</span>
                  <span className="text-xl font-black text-amber-700">₹{selectedPurchase.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Paid</p>
                  <p className="font-bold text-emerald-600">₹{selectedPurchase.paidAmount?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Due</p>
                  <p className="font-bold text-red-600">₹{selectedPurchase.dueAmount?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 pb-safe">
              <button onClick={() => window.print()} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-lg font-black shadow-lg hover:bg-slate-900 active:scale-95 transition-all flex justify-center items-center gap-2">
                <Printer className="w-5 h-5" /> Print PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
