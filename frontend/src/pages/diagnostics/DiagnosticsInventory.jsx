import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  AlertCircle, 
  ShoppingCart, 
  Activity, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Thermometer, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  X, 
  Sliders, 
  DollarSign,
  Droplet,
  TestTube
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsInventory = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'logs'

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stockModalItem, setStockModalItem] = useState(null); // Item for Stock In / Out
  const [stockModalAction, setStockModalAction] = useState('add'); // 'add', 'consume', 'discard', 'adjust'
  const [itemHistorySelected, setItemHistorySelected] = useState(null);

  // Add Item Form State
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Reagent',
    unit: 'tests',
    currentStock: '',
    minimumStock: '20',
    reorderQuantity: '100',
    batchNumber: '',
    expiryDate: '',
    supplier: '',
    pricePerUnit: '',
    storageCondition: '2°C - 8°C (Refrigerated)',
    location: '',
    linkedTests: [],
    notes: ''
  });

  // Stock Action Form State
  const [stockFormData, setStockFormData] = useState({
    quantity: '',
    batchNumber: '',
    newExpiryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchTests();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/inventory');
      setItems(res.data?.data?.items || []);
      setStats(res.data?.data?.stats || {});
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/diagnostics/inventory/logs');
      setLogs(res.data?.data?.logs || []);
    } catch (error) {
      console.error('Failed to load inventory logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await api.get('/diagnostics/tests');
      setTests(res.data?.data?.tests || []);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs') {
      fetchLogs();
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        currentStock: Number(newItem.currentStock || 0),
        minimumStock: Number(newItem.minimumStock || 10),
        reorderQuantity: Number(newItem.reorderQuantity || 50),
        pricePerUnit: Number(newItem.pricePerUnit || 0),
        expiryDate: newItem.expiryDate ? new Date(newItem.expiryDate) : undefined
      };

      await api.post('/diagnostics/inventory', payload);
      toast.success('Inventory item created successfully');
      setIsAddModalOpen(false);
      setNewItem({
        name: '', category: 'Reagent', unit: 'tests', currentStock: '',
        minimumStock: '20', reorderQuantity: '100', batchNumber: '',
        expiryDate: '', supplier: '', pricePerUnit: '',
        storageCondition: '2°C - 8°C (Refrigerated)', location: '',
        linkedTests: [], notes: ''
      });
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create inventory item');
    }
  };

  const handleOpenStockAction = (item, action) => {
    setStockModalItem(item);
    setStockModalAction(action);
    setStockFormData({
      quantity: action === 'adjust' ? item.currentStock : '',
      batchNumber: item.batchNumber || '',
      newExpiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      notes: ''
    });
  };

  const handleSubmitStockAction = async (e) => {
    e.preventDefault();
    if (!stockFormData.quantity || Number(stockFormData.quantity) < 0) {
      return toast.error('Please enter a valid quantity');
    }

    try {
      const payload = {
        action: stockModalAction,
        quantity: Number(stockFormData.quantity),
        batchNumber: stockFormData.batchNumber,
        newExpiryDate: stockFormData.newExpiryDate,
        notes: stockFormData.notes
      };

      await api.patch(`/diagnostics/inventory/${stockModalItem._id}/stock`, payload);
      toast.success(`Inventory stock updated successfully!`);
      setStockModalItem(null);
      fetchInventory();
      if (activeTab === 'logs') fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.itemId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'LOW' ? (item.status === 'Low Stock' || item.status === 'Out of Stock') :
      statusFilter === 'EXPIRED' ? (item.status === 'Expired' || (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 0)) :
      statusFilter === 'EXPIRING' ? item.isExpiringSoon :
      statusFilter === 'OK' ? item.status === 'In Stock' : true;

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reagent & Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Clinical reagent depletion, cold-chain tracking, lot expiry monitoring & automated test deduction
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Item / Reagent
        </button>
      </div>

      {/* Top Inventory Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Items</span>
            <div className="text-xl font-extrabold text-gray-900">{stats.totalItems || items.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Valuation</span>
            <div className="text-xl font-extrabold text-emerald-800">₹{(stats.totalValuation || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Low / Out of Stock</span>
            <div className="text-xl font-extrabold text-amber-700">{stats.lowStockCount || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-orange-200 bg-orange-50/30 shadow-xs p-4 flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block">Expiring (&lt;30d)</span>
            <div className="text-xl font-extrabold text-orange-700">{stats.expiringSoonCount || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 bg-red-50/40 shadow-xs p-4 flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">Expired / Quarantine</span>
            <div className="text-xl font-extrabold text-red-700">{stats.expiredCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => handleTabChange('inventory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Active Stock & Reagents ({items.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('logs')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail & Depletion Log</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Inventory List */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Item, SKU, Lot, or Supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Reagent">Reagents</option>
                <option value="Vacuum Tube">Vacuum Tubes</option>
                <option value="Rapid Kit">Rapid Kits</option>
                <option value="Consumable">Consumables</option>
                <option value="Calibrator / Control">Calibrators & Controls</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OK">In Stock Only</option>
                <option value="LOW">Low / Out of Stock</option>
                <option value="EXPIRING">Expiring Within 30 Days</option>
                <option value="EXPIRED">Expired / Quarantined</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">No Inventory Items Found</h3>
              <p className="text-xs text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Try clearing search filters.'
                  : 'Click "Add Item / Reagent" to add clinical reagents and vacuum tubes.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const isExpired = item.status === 'Expired' || (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 0);
                const isLow = item.status === 'Low Stock' || item.status === 'Out of Stock';

                return (
                  <div 
                    key={item._id} 
                    className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                      isExpired ? 'border-red-300 ring-1 ring-red-100' :
                      isLow ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200/80'
                    }`}
                  >
                    <div className="p-5">
                      {/* Header Badge */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {item.itemId}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold ml-2 uppercase">
                            {item.category}
                          </span>
                        </div>

                        {/* Status Badges */}
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                            <ShieldAlert className="w-3 h-3" />
                            <span>EXPIRED</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{item.status}</span>
                          </span>
                        ) : item.isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                            <Clock className="w-3 h-3" />
                            <span>Expiring Soon</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 mb-3 truncate">
                        Supplier: {item.supplier || 'Direct Medical Supply'}
                      </p>

                      {/* Stock Bar Indicator */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 mb-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500 font-medium">Available Stock:</span>
                          <span className={`text-base font-black ${
                            isExpired ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-slate-900'
                          }`}>
                            {item.currentStock} <span className="text-xs font-semibold text-gray-500">{item.unit}</span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isExpired ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (item.currentStock / (item.minimumStock * 2.5 || 100)) * 100)}%` 
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                          <span>Min Threshold: {item.minimumStock} {item.unit}</span>
                          <span>Reorder: {item.reorderQuantity || 50}</span>
                        </div>
                      </div>

                      {/* Lot & Expiry Details */}
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Batch / Lot:</span>
                          <span className="font-mono font-bold text-gray-800">{item.batchNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Expiry Date:</span>
                          <span className={`font-semibold ${
                            isExpired ? 'text-red-600 font-bold' : item.isExpiringSoon ? 'text-orange-600 font-bold' : 'text-gray-800'
                          }`}>
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            {item.daysUntilExpiry !== null && (
                              <span className="text-[10px] ml-1 text-gray-400">
                                ({item.daysUntilExpiry > 0 ? `${item.daysUntilExpiry}d left` : 'Expired'})
                              </span>
                            )}
                          </span>
                        </div>
                        {item.storageCondition && (
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-blue-500" /> Storage:
                            </span>
                            <span className="text-blue-900 font-semibold">{item.storageCondition}</span>
                          </div>
                        )}
                      </div>

                      {/* Linked Tests (Auto Depletion) */}
                      {item.linkedTests && item.linkedTests.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <span className="text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                            ⚡ Auto-Depleted by:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.linkedTests.map((t) => (
                              <span key={t._id} className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Footer */}
                    <div className="bg-slate-50/90 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleOpenStockAction(item, 'add')}
                        className="py-1 px-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Receive Stock</span>
                      </button>

                      <button
                        onClick={() => handleOpenStockAction(item, isExpired ? 'discard' : 'consume')}
                        className="py-1 px-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isExpired ? 'Discard Expired' : 'Consume'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenStockAction(item, 'adjust')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                        title="Audit / Adjust Count"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Inventory Movement & Depletion Log</h2>
              <p className="text-xs text-gray-500">Every stock in, automated test run depletion, and discard audit</p>
            </div>
            <button
              onClick={fetchLogs}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          {loadingLogs ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No stock movement logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-slate-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">Item / SKU</th>
                    <th className="px-4 py-3 text-left">Movement Type</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-center">Stock Change</th>
                    <th className="px-4 py-3 text-left">Batch / Reference</th>
                    <th className="px-4 py-3 text-left">Operator / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {logs.map((log) => {
                    const isIncrease = log.type === 'STOCK_IN';
                    const isAuto = log.type === 'AUTO_CONSUMED';

                    return (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{log.item?.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{log.item?.itemId} ({log.item?.unit})</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' :
                            log.type === 'AUTO_CONSUMED' ? 'bg-indigo-100 text-indigo-800' :
                            log.type === 'EXPIRED_DISCARD' ? 'bg-red-100 text-red-800' :
                            log.type === 'MANUAL_CONSUMED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${isIncrease ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {isIncrease ? `+${log.quantity}` : `-${log.quantity}`}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[11px] text-gray-600">
                          {log.previousStock} &rarr; <strong>{log.newStock}</strong>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-[11px]">
                          {log.batchNumber || (log.order?.orderId ? `Order: ${log.order.orderId}` : '-')}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <div className="truncate max-w-xs">{log.notes || 'Normal lab movement'}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">By: {log.performedBy?.name || 'Automated LIS'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-fade-in my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Add Reagent or Consumable
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Item / Reagent Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sysmex Cellpack Hematology Diluent 20L"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Reagent">Reagent Kit</option>
                    <option value="Vacuum Tube">Vacuum Tube (EDTA, SST, Fluoride)</option>
                    <option value="Rapid Kit">Rapid Diagnostic Kit</option>
                    <option value="Consumable">Consumable (Syringe, Needle, Swab)</option>
                    <option value="Calibrator / Control">Calibrator / IQC Material</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dispensing Unit</label>
                  <input 
                    type="text" 
                    required
                    placeholder="tests, kits, tubes, vials"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Opening Stock</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Min Threshold</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="20"
                    value={newItem.minimumStock}
                    onChange={(e) => setNewItem({ ...newItem, minimumStock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unit Cost (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="25"
                    value={newItem.pricePerUnit}
                    onChange={(e) => setNewItem({ ...newItem, pricePerUnit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Batch / Lot Number</label>
                  <input 
                    type="text" 
                    placeholder="LOT-2026-X4"
                    value={newItem.batchNumber}
                    onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Storage Condition</label>
                  <select
                    value={newItem.storageCondition}
                    onChange={(e) => setNewItem({ ...newItem, storageCondition: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="2°C - 8°C (Refrigerated)">2°C - 8°C (Refrigerated)</option>
                    <option value="-20°C (Frozen)">-20°C (Frozen)</option>
                    <option value="15°C - 25°C (Room Temp)">15°C - 25°C (Room Temp)</option>
                    <option value="Dark / Light Protected">Dark / Light Protected</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Location in Lab</label>
                  <input 
                    type="text" 
                    placeholder="Fridge A - Shelf 2"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              {/* Linked Tests for Automated Depletion */}
              <div>
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <span>⚡ Link to Diagnostic Tests (Auto-Deplete 1 unit per test run):</span>
                </label>
                <div className="border border-indigo-200 rounded-lg p-2.5 max-h-32 overflow-y-auto bg-indigo-50/30 flex flex-wrap gap-1.5">
                  {tests.map(t => {
                    const isLinked = newItem.linkedTests.includes(t._id);
                    return (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => {
                          setNewItem({
                            ...newItem,
                            linkedTests: isLinked 
                              ? newItem.linkedTests.filter(id => id !== t._id)
                              : [...newItem.linkedTests, t._id]
                          });
                        }}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${
                          isLinked 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Out / Adjust Modal */}
      {stockModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base capitalize">
                  {stockModalAction === 'add' ? 'Receive Stock (Purchase In)' :
                   stockModalAction === 'discard' ? 'Discard Expired / Damaged Units' :
                   stockModalAction === 'adjust' ? 'Physical Stock Adjustment' : 'Consume Stock'}
                </h3>
                <p className="text-xs text-gray-500">{stockModalItem.name} ({stockModalItem.itemId})</p>
              </div>
              <button 
                onClick={() => setStockModalItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockAction} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Current Stock Balance:</span>
                <span className="font-black text-slate-900 text-sm">
                  {stockModalItem.currentStock} {stockModalItem.unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {stockModalAction === 'adjust' ? 'Exact Audited Count:' : 'Quantity to ' + (stockModalAction === 'add' ? 'Add' : stockModalAction === 'discard' ? 'Discard' : 'Consume') + ' *'}
                </label>
                <input 
                  type="number"
                  required
                  min={stockModalAction === 'adjust' ? '0' : '1'}
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 50"
                />
              </div>

              {stockModalAction === 'add' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">New Batch / Lot #</label>
                    <input 
                      type="text"
                      value={stockFormData.batchNumber}
                      onChange={(e) => setStockFormData({ ...stockFormData, batchNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">New Expiry Date</label>
                    <input 
                      type="date"
                      value={stockFormData.newExpiryDate}
                      onChange={(e) => setStockFormData({ ...stockFormData, newExpiryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason / Notes / Invoice Ref</label>
                <input 
                  type="text"
                  placeholder="e.g. Purchase order PO-4481 or Internal QC"
                  value={stockFormData.notes}
                  onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockModalItem(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-bold rounded-lg shadow-sm ${
                    stockModalAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    stockModalAction === 'discard' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsInventory;
