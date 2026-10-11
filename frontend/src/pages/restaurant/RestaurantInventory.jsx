import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Scale, ArrowUpRight, ArrowDownRight, Info,
  Layers, Clock, Check, ArrowDownToLine, ArrowUpFromLine,
  Thermometer, Snowflake, Warehouse, FileText, AlertCircle,
  Truck, ArrowRightLeft, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

const CATEGORIES = [
  'Dairy & Cheese', 
  'Poultry & Meat', 
  'Seafood',
  'Produce & Vegetables', 
  'Dry Goods & Grains', 
  'Oils & Ghee', 
  'Spices & Seasoning', 
  'Beverages & Syrups', 
  'Bakery & Bread',
  'Packaging & Disposables',
  'General Supplies'
];

const STORAGE_LOCATIONS = [
  'Walk-in Chiller', 
  'Deep Freezer', 
  'Dry Store Room', 
  'Prep Station Chiller', 
  'Beverage Bar Store', 
  'Bakery Section',
  'General Kitchen'
];

const COMMON_UOMS = [
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'g', label: 'g (Gram)' },
  { value: 'l', label: 'L (Litre)' },
  { value: 'ml', label: 'ml (Millilitre)' },
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'can', label: 'can' },
  { value: 'pack', label: 'pack' },
  { value: 'bottle', label: 'bottle' },
  { value: 'box', label: 'box' },
  { value: 'tray', label: 'tray' }
];

export default function RestaurantInventory() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalSKUs: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    optimalCount: 0,
    overstockedCount: 0,
    criticalParAlerts: 0
  });

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, CRITICAL, LOW_STOCK, OPTIMAL, OUT_OF_STOCK
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [itemHistoryLogs, setItemHistoryLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Item Form State (Add / Edit)
  const initialItemForm = {
    _id: null,
    name: '',
    code: '',
    category: 'Dairy & Cheese',
    storageLocation: 'Walk-in Chiller',
    uom: 'kg',
    currentStock: '',
    minStock: 5,
    maxStock: 50,
    unitCost: '',
    preferredSupplier: '',
    is86Trigger: false,
    notes: ''
  };
  const [itemForm, setItemForm] = useState(initialItemForm);

  // Stock Adjustment Form State
  const initialAdjustForm = {
    itemId: '',
    type: 'KITCHEN_ISSUE', // INWARD, KITCHEN_ISSUE, WASTAGE_SPOILAGE, AUDIT_ADJUSTMENT, RETURN
    quantityChange: '',
    newPhysicalCount: '',
    referenceNo: '',
    reason: ''
  };
  const [adjustForm, setAdjustForm] = useState(initialAdjustForm);

  // Fetch Inventory Data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/restaurant/inventory');
      if (res.data?.data) {
        setItems(res.data.data.items || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      toast.error('Unable to load ingredient stock: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.storageLocation?.toLowerCase().includes(q) ||
        item.preferredSupplier?.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesLoc = selectedLocation === 'ALL' || item.storageLocation === selectedLocation;

      let matchesStatus = true;
      if (statusFilter === 'CRITICAL') {
        matchesStatus = item.stockStatus === 'LOW_STOCK' || item.stockStatus === 'OUT_OF_STOCK';
      } else if (statusFilter !== 'ALL') {
        matchesStatus = item.stockStatus === statusFilter;
      }

      return matchesSearch && matchesCat && matchesLoc && matchesStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedLocation, statusFilter]);

  // Open Create Item Modal
  const handleOpenCreateModal = () => {
    setItemForm({
      ...initialItemForm,
      code: `ING-${Date.now().toString().slice(-4)}`
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setItemForm({
      _id: item._id,
      name: item.name,
      code: item.code || '',
      category: item.category || 'General Supplies',
      storageLocation: item.storageLocation || 'Dry Store Room',
      uom: item.uom || 'kg',
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock || 50,
      unitCost: item.unitCost,
      preferredSupplier: item.preferredSupplier || '',
      is86Trigger: Boolean(item.is86Trigger),
      notes: item.notes || ''
    });
    setIsItemModalOpen(true);
  };

  // Open Adjust Modal
  const handleOpenAdjustModal = (item = null) => {
    const targetItem = item || (items[0] || null);
    setAdjustForm({
      ...initialAdjustForm,
      itemId: targetItem ? targetItem._id : '',
      type: 'KITCHEN_ISSUE',
      reason: ''
    });
    setIsAdjustModalOpen(true);
  };

  // Open Movement History Modal
  const handleOpenHistoryModal = async (item) => {
    setSelectedItemForHistory(item);
    setIsHistoryModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await api.get(`/restaurant/inventory/${item._id}`);
      if (res.data?.data?.logs) {
        setItemHistoryLogs(res.data.data.logs);
      }
    } catch (err) {
      console.error('Failed to load item movement logs:', err);
      toast.error('Could not fetch audit history');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: itemForm.name.trim(),
        code: itemForm.code.trim(),
        category: itemForm.category,
        storageLocation: itemForm.storageLocation,
        uom: itemForm.uom,
        currentStock: Number(itemForm.currentStock) || 0,
        minStock: Number(itemForm.minStock) || 0,
        maxStock: Number(itemForm.maxStock) || 50,
        unitCost: Number(itemForm.unitCost) || 0,
        preferredSupplier: itemForm.preferredSupplier.trim(),
        is86Trigger: itemForm.is86Trigger,
        notes: itemForm.notes
      };

      if (itemForm._id) {
        await api.put(`/restaurant/inventory/${itemForm._id}`, payload);
        toast.success(`Updated ingredient "${payload.name}"`);
      } else {
        await api.post('/restaurant/inventory', payload);
        toast.success(`Added new ingredient "${payload.name}" to inventory`);
      }

      setIsItemModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error saving ingredient item:', err);
      toast.error(err.response?.data?.message || 'Failed to save ingredient');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stock Adjustment
  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustForm.itemId) {
      toast.error('Please select an ingredient');
      return;
    }

    if (adjustForm.type === 'AUDIT_ADJUSTMENT' && adjustForm.newPhysicalCount === '') {
      toast.error('Please enter the physically counted stock');
      return;
    }

    if (adjustForm.type !== 'AUDIT_ADJUSTMENT' && (adjustForm.quantityChange === '' || Number(adjustForm.quantityChange) <= 0)) {
      toast.error('Please enter a valid quantity change greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: adjustForm.type,
        quantityChange: Number(adjustForm.quantityChange) || 0,
        newPhysicalCount: adjustForm.newPhysicalCount === '' ? null : Number(adjustForm.newPhysicalCount),
        referenceNo: adjustForm.referenceNo.trim(),
        reason: adjustForm.reason.trim()
      };

      await api.post(`/restaurant/inventory/${adjustForm.itemId}/adjust`, payload);
      toast.success('Stock adjustment recorded successfully');
      setIsAdjustModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error recording stock adjustment:', err);
      toast.error(err.response?.data?.message || 'Failed to record stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/inventory/${itemToDelete._id}`);
      toast.success(`Archived ingredient "${itemToDelete.name}"`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData(true);
    } catch (err) {
      console.error('Error archiving inventory item:', err);
      toast.error(err.response?.data?.message || 'Failed to archive item');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Selected Item in Adjust Modal
  const currentAdjustItem = useMemo(() => {
    return items.find(i => i._id === adjustForm.itemId) || null;
  }, [items, adjustForm.itemId]);

  // Projected New Stock in Adjust Modal
  const projectedAdjustmentStock = useMemo(() => {
    if (!currentAdjustItem) return 0;
    const current = currentAdjustItem.currentStock || 0;
    const qty = Number(adjustForm.quantityChange) || 0;

    if (adjustForm.type === 'AUDIT_ADJUSTMENT') {
      return adjustForm.newPhysicalCount !== '' ? Number(adjustForm.newPhysicalCount) : current;
    }
    if (adjustForm.type === 'INWARD') {
      return current + qty;
    }
    // Kitchen Issue, Spoilage, Return
    return Math.max(0, current - qty);
  }, [currentAdjustItem, adjustForm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Raw Ingredient Inventory & Par Alerts
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
                  Store Operations
                </span>
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Track raw ingredient balances, manage cold-chain storerooms, enforce reorder thresholds, and log kitchen consumption.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => handleOpenAdjustModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Quick Stock Adjustment
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 transition-all"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add Raw Ingredient SKU
          </button>
        </div>
      </div>

      {/* 2. Executive Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Valuation */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              ₹{summary.totalInventoryValue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              at cost
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Book valuation across chillers and dry storerooms
          </p>
        </div>

        {/* Card 2: Tracked SKUs */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Active Tracked SKUs
            </span>
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {summary.totalSKUs}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              ingredients
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Categorized across {CATEGORIES.length} restaurant supply groups
          </p>
        </div>

        {/* Card 3: Optimal Stock Buffer */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Optimal Stock Buffer
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.optimalCount}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              items above par
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${summary.totalSKUs > 0 ? (summary.optimalCount / summary.totalSKUs) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 4: Critical Par Alerts */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`border rounded-2xl p-5 shadow-xs cursor-pointer transition-all ${
            summary.criticalParAlerts > 0 
              ? statusFilter === 'CRITICAL'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-400 ring-2 ring-red-500/20'
                : 'bg-white dark:bg-stone-900 border-red-200 dark:border-red-900/60 hover:border-red-300'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Par-Level Alerts
            </span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.criticalParAlerts}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              items need reorder ({summary.outOfStockCount} out of stock)
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-2">
            {statusFilter === 'CRITICAL' ? 'Click to show all items' : 'Click to filter par alerts'}
          </p>
        </div>

      </div>

      {/* 3. Storage Location Cold Chain Badges */}
      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 text-xs flex flex-wrap items-center justify-between gap-3 text-stone-600 dark:text-stone-300">
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>Cold-Chain & Storage Zones:</strong> Maintain perishable ingredients below 4°C in walk-in chillers and -18°C in deep freezers.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
            <Snowflake className="w-3 h-3 text-blue-500" /> Deep Freezer (-18°C)
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
            <Thermometer className="w-3 h-3 text-teal-500" /> Walk-in Chiller (2-4°C)
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
            <Warehouse className="w-3 h-3 text-amber-500" /> Dry Store (Ambient)
          </span>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ingredient name, SKU code, storage location, or supplier..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Storage Location Dropdown */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="ALL">All Storage Locations</option>
              {STORAGE_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                Cards
              </button>
            </div>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            All SKUs ({items.length})
          </button>

          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'CRITICAL'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Par-Level Alerts ({summary.criticalParAlerts})
          </button>

          <button
            onClick={() => setStatusFilter('OPTIMAL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Optimal Stock ({summary.optimalCount})
          </button>

          <button
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-stone-900 text-white dark:bg-stone-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
            Out of Stock ({summary.outOfStockCount})
          </button>
        </div>
      </div>

      {/* 5. Main Content: Table or Cards View */}
      {loading ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading ingredient inventory balances...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <Package className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">No Inventory Items Found</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No ingredients match the active filters. Try adjusting your query or filters.'
              : 'Start tracking your kitchen raw ingredients by adding your first SKU.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add First Ingredient SKU
          </button>
        </div>
      ) : viewMode === 'table' ? (

        /* HIGH-DENSITY INVENTORY TABLE */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Ingredient & SKU</th>
                  <th className="py-3 px-4">Category & Location</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-center w-36">Par Stock Level</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {filteredItems.map(item => {
                  const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';
                  const isLowStock = item.stockStatus === 'LOW_STOCK';
                  const isOverstocked = item.stockStatus === 'OVERSTOCKED';
                  const maxTarget = item.maxStock || (item.minStock * 4) || 20;
                  const ratio = Math.min(100, Math.round(((item.currentStock || 0) / maxTarget) * 100));

                  return (
                    <tr key={item._id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                      
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {item.name}
                          {item.is86Trigger && isOutOfStock && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200">
                              86'd
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 flex items-center gap-2">
                          <span>{item.code || '—'}</span>
                          {item.preferredSupplier && (
                            <span>• {item.preferredSupplier}</span>
                          )}
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-stone-700 dark:text-stone-300">
                          {item.category}
                        </div>
                        <div className="text-stone-400 flex items-center gap-1 mt-0.5">
                          {item.storageLocation?.includes('Chiller') || item.storageLocation?.includes('Freezer') ? (
                            <Snowflake className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Warehouse className="w-3 h-3 text-stone-400" />
                          )}
                          <span>{item.storageLocation}</span>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-bold text-base ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'
                        }`}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-stone-400 ml-1">
                          {item.uom}
                        </span>
                      </td>

                      {/* Par Stock Gauge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                          <span>Min: {item.minStock} {item.uom}</span>
                          <span>Max: {item.maxStock} {item.uom}</span>
                        </div>
                        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock ? 'bg-red-500 w-0' : isLowStock ? 'bg-amber-500' : isOverstocked ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right text-xs text-stone-500 dark:text-stone-400">
                        ₹{item.unitCost} / {item.uom}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right font-semibold text-stone-900 dark:text-stone-100">
                        ₹{item.totalValue?.toLocaleString('en-IN') || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          isOutOfStock
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                            : isLowStock
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                              : isOverstocked
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Par Alert' : isOverstocked ? 'Overstocked' : 'Optimal'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 text-stone-500 hover:text-orange-600 transition-colors"
                            title="Adjust Stock"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenHistoryModal(item)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                            title="Movement Audit History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                            title="Edit Item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                            title="Archive Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';
            const isLowStock = item.stockStatus === 'LOW_STOCK';
            const maxTarget = item.maxStock || (item.minStock * 4) || 20;
            const ratio = Math.min(100, Math.round(((item.currentStock || 0) / maxTarget) * 100));

            return (
              <div 
                key={item._id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-800/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                      {item.category}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400'
                        : isLowStock
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}>
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Par Alert' : 'Optimal'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h3>
                  <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5 mb-3">
                    <span>{item.code || '—'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {item.storageLocation?.includes('Chiller') || item.storageLocation?.includes('Freezer') ? (
                        <Snowflake className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Warehouse className="w-3 h-3 text-stone-400" />
                      )}
                      {item.storageLocation}
                    </span>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-center mb-4">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Current Stock</span>
                      <span className={`text-base font-bold ${
                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-stone-900 dark:text-white'
                      }`}>
                        {item.currentStock} <span className="text-xs font-normal text-stone-500">{item.uom}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Valuation</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.totalValue?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>

                  {/* Stock Gauge */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span>Par Reorder: {item.minStock} {item.uom}</span>
                      <span>Target: {item.maxStock} {item.uom}</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isOutOfStock ? 'bg-red-500 w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 mt-2">
                  <button
                    onClick={() => handleOpenAdjustModal(item)}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Adjust Stock
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenHistoryModal(item)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                      title="Audit History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      )}

      {/* ========================================================================= */}
      {/* 6. ADD / EDIT INGREDIENT MODAL */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {itemForm._id ? 'Edit Ingredient SKU' : 'Add New Raw Ingredient SKU'}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Define ingredient storage location, par level reorder thresholds, and unit costs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Fresh Malai Paneer"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={itemForm.code}
                    onChange={e => setItemForm({ ...itemForm, code: e.target.value })}
                    placeholder="ING-PAN-01"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Storage Location *
                  </label>
                  <select
                    value={itemForm.storageLocation}
                    onChange={e => setItemForm({ ...itemForm, storageLocation: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  >
                    {STORAGE_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & UOM */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    UOM *
                  </label>
                  <select
                    value={itemForm.uom}
                    onChange={e => setItemForm({ ...itemForm, uom: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {COMMON_UOMS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemForm.currentStock}
                    onChange={e => setItemForm({
                      ...itemForm,
                      currentStock: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Min Par (Alert) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={itemForm.minStock}
                    onChange={e => setItemForm({
                      ...itemForm,
                      minStock: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="5"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Max Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemForm.maxStock}
                    onChange={e => setItemForm({
                      ...itemForm,
                      maxStock: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="50"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

              </div>

              {/* Unit Cost & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Average Unit Purchase Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemForm.unitCost}
                    onChange={e => setItemForm({
                      ...itemForm,
                      unitCost: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="e.g. 340"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Preferred Supplier / Distributor
                  </label>
                  <input
                    type="text"
                    value={itemForm.preferredSupplier}
                    onChange={e => setItemForm({ ...itemForm, preferredSupplier: e.target.value })}
                    placeholder="e.g. Amul Dairy Dist"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              {/* 86 Warning Trigger */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40">
                <input
                  type="checkbox"
                  id="is86Trigger"
                  checked={itemForm.is86Trigger}
                  onChange={e => setItemForm({ ...itemForm, is86Trigger: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300"
                />
                <label htmlFor="is86Trigger" className="text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                  Auto-flag menu items as 86'd / unavailable when this ingredient hits 0 stock
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Handling & Shelf-Life Notes
                </label>
                <textarea
                  rows="2"
                  value={itemForm.notes}
                  onChange={e => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="e.g. Keep in sealed container; use within 48h after opening..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

            </form>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {itemForm._id ? 'Update Ingredient' : 'Save Ingredient SKU'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. QUICK STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Record Stock Movement / Adjustment
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Log deliveries, kitchen prep issues, wastage, or physical audit counts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-6 space-y-4">
              
              {/* Select Item */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Select Ingredient SKU *
                </label>
                <select
                  value={adjustForm.itemId}
                  onChange={e => setAdjustForm({ ...adjustForm, itemId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                >
                  <option value="">-- Choose Ingredient --</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.currentStock} {item.uom} on hand)
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Movement Type *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'KITCHEN_ISSUE', label: '🍳 Kitchen Prep Issue (-)' },
                    { id: 'INWARD', label: '📦 Vendor Delivery (+)' },
                    { id: 'WASTAGE_SPOILAGE', label: '🗑️ Wastage / Spoilage (-)' },
                    { id: 'AUDIT_ADJUSTMENT', label: '⚖️ Physical Count (Audit)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAdjustForm({ ...adjustForm, type: m.id })}
                      className={`p-2 rounded-xl border text-left font-medium transition-colors ${
                        adjustForm.type === m.id
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-700 dark:text-orange-300 font-semibold'
                          : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity / Count */}
              {adjustForm.type === 'AUDIT_ADJUSTMENT' ? (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Physically Counted Stock ({currentAdjustItem?.uom || 'units'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={adjustForm.newPhysicalCount}
                    onChange={e => setAdjustForm({
                      ...adjustForm,
                      newPhysicalCount: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="Enter physical count"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Quantity to {adjustForm.type === 'INWARD' ? 'Receive (+)' : 'Deduct (-)'} ({currentAdjustItem?.uom || 'units'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={adjustForm.quantityChange}
                    onChange={e => setAdjustForm({
                      ...adjustForm,
                      quantityChange: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="e.g. 2.5"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}

              {/* Reference & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Reference / PO / Slip #
                  </label>
                  <input
                    type="text"
                    value={adjustForm.referenceNo}
                    onChange={e => setAdjustForm({ ...adjustForm, referenceNo: e.target.value })}
                    placeholder="e.g. PREP-01 or PO-482"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Reason / Destination
                  </label>
                  <input
                    type="text"
                    value={adjustForm.reason}
                    onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    placeholder="e.g. Lunch curry station prep"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              {currentAdjustItem && (
                <div className="bg-stone-900 text-stone-100 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Current Balance</span>
                    <span className="font-bold text-white text-sm">
                      {currentAdjustItem.currentStock} {currentAdjustItem.uom}
                    </span>
                  </div>

                  <div className="text-center font-bold text-orange-400">
                    ➔
                  </div>

                  <div className="text-right">
                    <span className="text-stone-400 block text-[10px] uppercase">Projected Balance</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {projectedAdjustmentStock} {currentAdjustItem.uom}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm Stock Movement
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MOVEMENT AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && selectedItemForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Stock Movement Audit Trail
                  </h2>
                  <p className="text-xs text-stone-400">
                    {selectedItemForHistory.name} ({selectedItemForHistory.code || '—'}) • Current: {selectedItemForHistory.currentStock} {selectedItemForHistory.uom}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingLogs ? (
                <div className="text-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                  <p className="text-xs text-stone-500">Loading audit log...</p>
                </div>
              ) : itemHistoryLogs.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  No stock adjustments recorded yet for this item.
                </div>
              ) : (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Movement Type</th>
                        <th className="py-2.5 px-3 text-right">Qty Change</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3">Reason / Ref</th>
                        <th className="py-2.5 px-3">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {itemHistoryLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="py-2 px-3 text-stone-500">
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              log.type === 'INWARD'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : log.type === 'KITCHEN_ISSUE'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  : log.type === 'WASTAGE_SPOILAGE'
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className={`py-2 px-3 text-right font-bold ${
                            log.quantityChange > 0 ? 'text-emerald-600' : 'text-stone-700 dark:text-stone-300'
                          }`}>
                            {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-stone-900 dark:text-stone-100">
                            {log.newStock} {selectedItemForHistory.uom}
                          </td>
                          <td className="py-2 px-3 text-stone-600 dark:text-stone-400">
                            {log.reason || '—'} {log.referenceNo ? `(${log.referenceNo})` : ''}
                          </td>
                          <td className="py-2 px-3 text-stone-400">
                            {log.performedBy?.name || 'Staff'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Archive Ingredient SKU?
              </h3>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-400">
              Are you sure you want to archive <strong>"{itemToDelete.name}"</strong>? It will no longer appear in standard stock takes, but past audit logs will be preserved.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
