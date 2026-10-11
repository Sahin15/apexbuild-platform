import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Percent, Scale, Flame, ArrowUpRight, ArrowDownRight,
  Info, PieChart, Layers, Clock, Check, Utensils,
  FileText, Package, ArrowRightLeft, CreditCard,
  Building, Phone, Mail, MapPin, Receipt, ShieldCheck,
  ChevronRight, Printer, AlertCircle, ShoppingCart, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

const VENDOR_CATEGORIES = [
  'Dairy & Cheese', 
  'Poultry & Meat', 
  'Seafood', 
  'Produce & Vegetables', 
  'Dry Goods & Grains', 
  'Oils & Ghee', 
  'Spices & Seasoning', 
  'Beverages & Syrups', 
  'Packaging & Disposables',
  'General Supplies'
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'COD', label: 'Cash On Delivery (COD)' },
  { value: 'NET_7', label: 'Net 7 Days' },
  { value: 'NET_15', label: 'Net 15 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'ADVANCE', label: 'Advance Payment' }
];

export default function RestaurantPurchases() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'vendors', 'grn'

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [summary, setSummary] = useState({
    monthlySpend: 0,
    pendingPOCount: 0,
    totalGRNCount: 0,
    totalPayables: 0,
    totalVendors: 0,
    totalPOs: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPoDetailOpen, setIsPoDetailOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New PO Form State
  const initialPoForm = {
    vendorId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    notes: '',
    items: [
      { inventoryItemId: '', itemName: '', quantity: '', uom: 'kg', unitPrice: '', taxPercent: 5 }
    ]
  };
  const [poForm, setPoForm] = useState(initialPoForm);

  // GRN Form State
  const initialGrnForm = {
    invoiceNo: '',
    invoiceAmount: '',
    notes: '',
    itemsReceived: []
  };
  const [grnForm, setGrnForm] = useState(initialGrnForm);

  // Payment Form State
  const initialPaymentForm = {
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: ''
  };
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  // Vendor Form State
  const initialVendorForm = {
    _id: null,
    name: '',
    code: '',
    category: 'Dairy & Cheese',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    paymentTerms: 'NET_7'
  };
  const [vendorForm, setVendorForm] = useState(initialVendorForm);

  // Fetch all procurement data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [posRes, vendorsRes, summaryRes, invRes] = await Promise.all([
        api.get('/restaurant/purchases'),
        api.get('/restaurant/vendors'),
        api.get('/restaurant/purchases/summary'),
        api.get('/restaurant/inventory')
      ]);

      if (posRes.data?.data) {
        setPurchaseOrders(posRes.data.data.purchaseOrders || []);
      }
      if (vendorsRes.data?.data) {
        setVendors(vendorsRes.data.data.vendors || []);
      }
      if (summaryRes.data?.data?.summary) {
        setSummary(summaryRes.data.data.summary);
      }
      if (invRes.data?.data?.items) {
        setInventoryItems(invRes.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load procurement data:', err);
      toast.error('Unable to fetch procurement records: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        po.poNumber?.toLowerCase().includes(q) ||
        po.vendorId?.name?.toLowerCase().includes(q) ||
        po.notes?.toLowerCase().includes(q) ||
        po.items?.some(i => i.itemName.toLowerCase().includes(q));

      const matchesVendor = selectedVendorFilter === 'ALL' || po.vendorId?._id === selectedVendorFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || po.status === selectedStatusFilter;

      return matchesSearch && matchesVendor && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, selectedVendorFilter, selectedStatusFilter]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = searchTerm.toLowerCase().trim();
      return !q || 
        v.name?.toLowerCase().includes(q) ||
        v.code?.toLowerCase().includes(q) ||
        v.contactPerson?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.category?.toLowerCase().includes(q);
    });
  }, [vendors, searchTerm]);

  // All GRN receipts flattened for the audit ledger
  const allGrnReceipts = useMemo(() => {
    const list = [];
    purchaseOrders.forEach(po => {
      if (po.grnReceipts && po.grnReceipts.length > 0) {
        po.grnReceipts.forEach(grn => {
          list.push({
            ...grn,
            poId: po._id,
            poNumber: po.poNumber,
            vendorName: po.vendorId?.name || 'Supplier'
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  }, [purchaseOrders]);

  // Live PO Totals in Create Form
  const livePoFormTotals = useMemo(() => {
    let sub = 0;
    let tax = 0;
    poForm.items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxPercent) || 0;
      const lineSub = Math.round(qty * price * 100) / 100;
      const lineTax = Math.round(lineSub * (taxRate / 100) * 100) / 100;
      sub += lineSub;
      tax += lineTax;
    });
    sub = Math.round(sub * 100) / 100;
    tax = Math.round(tax * 100) / 100;
    const grand = Math.round((sub + tax) * 100) / 100;
    return { subTotal: sub, taxTotal: tax, grandTotal: grand };
  }, [poForm.items]);

  // Open Create PO Modal
  const handleOpenCreatePo = () => {
    setPoForm({
      ...initialPoForm,
      vendorId: vendors[0]?._id || ''
    });
    setIsCreatePoOpen(true);
  };

  // Add Item Line to PO Form
  const handleAddPoItemLine = () => {
    setPoForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { inventoryItemId: '', itemName: '', quantity: '', uom: 'kg', unitPrice: '', taxPercent: 5 }
      ]
    }));
  };

  // Remove Item Line
  const handleRemovePoItemLine = (idx) => {
    if (poForm.items.length <= 1) {
      toast.error('PO must contain at least one line item');
      return;
    }
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // Handle PO Item Selection
  const handlePoItemChange = (idx, field, value) => {
    setPoForm(prev => {
      const updated = [...prev.items];
      if (field === 'inventoryItemId') {
        const inv = inventoryItems.find(i => i._id === value);
        if (inv) {
          updated[idx] = {
            ...updated[idx],
            inventoryItemId: inv._id,
            itemName: inv.name,
            uom: inv.uom,
            unitPrice: inv.unitCost
          };
          return { ...prev, items: updated };
        }
      }
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  // Save Purchase Order
  const handleSavePo = async (e) => {
    e.preventDefault();
    if (!poForm.vendorId) {
      toast.error('Please select a supplier');
      return;
    }
    if (poForm.items.some(i => !i.itemName.trim() || Number(i.quantity) <= 0)) {
      toast.error('All line items must have a valid name and quantity greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vendorId: poForm.vendorId,
        orderDate: poForm.orderDate,
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        notes: poForm.notes,
        items: poForm.items.map(i => ({
          inventoryItemId: i.inventoryItemId || null,
          itemName: i.itemName.trim(),
          quantity: Number(i.quantity) || 0,
          uom: i.uom,
          unitPrice: Number(i.unitPrice) || 0,
          taxPercent: Number(i.taxPercent) || 0
        }))
      };

      const res = await api.post('/restaurant/purchases', payload);
      toast.success(`Purchase order ${res.data?.data?.purchaseOrder?.poNumber} generated!`);
      setIsCreatePoOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error creating purchase order:', err);
      toast.error(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // Open GRN Modal
  const handleOpenGrnModal = (po) => {
    setSelectedPo(po);
    setGrnForm({
      invoiceNo: '',
      invoiceAmount: '',
      notes: '',
      itemsReceived: po.items.map(item => {
        const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
        return {
          inventoryItemId: item.inventoryItemId?._id || item.inventoryItemId,
          itemName: item.itemName,
          quantityOrdered: item.quantity,
          previouslyReceived: item.receivedQuantity || 0,
          receivedQuantity: remaining, // default to remaining
          uom: item.uom,
          unitPrice: item.unitPrice
        };
      })
    });
    setIsGrnModalOpen(true);
  };

  // Submit GRN Receipt
  const handleSubmitGrn = async (e) => {
    e.preventDefault();
    if (!selectedPo) return;

    const totalToReceive = grnForm.itemsReceived.reduce((sum, i) => sum + (Number(i.receivedQuantity) || 0), 0);
    if (totalToReceive <= 0) {
      toast.error('Please enter at least one item received quantity greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        invoiceNo: grnForm.invoiceNo.trim(),
        invoiceAmount: Number(grnForm.invoiceAmount) || 0,
        notes: grnForm.notes.trim(),
        itemsReceived: grnForm.itemsReceived.map(item => ({
          inventoryItemId: item.inventoryItemId || null,
          itemName: item.itemName,
          receivedQuantity: Number(item.receivedQuantity) || 0,
          uom: item.uom,
          unitPrice: Number(item.unitPrice) || 0
        }))
      };

      const res = await api.post(`/restaurant/purchases/${selectedPo._id}/grn`, payload);
      toast.success(`GRN ${res.data?.data?.grnNumber} processed! Raw inventory stock updated.`);
      setIsGrnModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error processing GRN receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to process GRN receipt');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (po) => {
    setSelectedPo(po);
    const balance = Math.max(0, po.grandTotal - (po.paidAmount || 0));
    setPaymentForm({
      amount: balance,
      paymentMethod: 'BANK_TRANSFER',
      reference: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedPo) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/restaurant/purchases/${selectedPo._id}/pay`, {
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod
      });
      toast.success(`Recorded ₹${paymentForm.amount} payment to ${selectedPo.vendorId?.name || 'vendor'}`);
      setIsPaymentModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Save / Update Vendor
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: vendorForm.name.trim(),
        code: vendorForm.code.trim(),
        category: vendorForm.category,
        contactPerson: vendorForm.contactPerson.trim(),
        phone: vendorForm.phone.trim(),
        email: vendorForm.email.trim(),
        address: vendorForm.address.trim(),
        gstin: vendorForm.gstin.trim(),
        paymentTerms: vendorForm.paymentTerms
      };

      if (vendorForm._id) {
        await api.put(`/restaurant/vendors/${vendorForm._id}`, payload);
        toast.success(`Updated vendor "${payload.name}"`);
      } else {
        await api.post('/restaurant/vendors', payload);
        toast.success(`Registered new vendor "${payload.name}"`);
      }

      setIsVendorModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error saving vendor:', err);
      toast.error(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Suppliers, Purchase Orders & Inward GRN
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
                  Procurement
                </span>
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Issue purchase orders, track food vendor commitments, and receive Goods Received Notes (GRN) directly into kitchen inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            title="Refresh procurement data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setVendorForm(initialVendorForm);
              setIsVendorModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition-colors"
          >
            <Building className="w-4 h-4" />
            Register Vendor
          </button>

          <button
            onClick={handleOpenCreatePo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 transition-all"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Generate Purchase Order
          </button>
        </div>
      </div>

      {/* 2. Executive Procurement Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Monthly Spend */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Procurement Spend (MTD)
            </span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              ₹{summary.monthlySpend.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-400">
              this month
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Committed across {summary.totalPOs} generated purchase orders
          </p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Pending Deliveries
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.pendingPOCount}
            </span>
            <span className="text-xs text-stone-400">
              active POs in transit
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Awaiting inward store check and GRN inspection
          </p>
        </div>

        {/* Vendor Payables */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Accounts Payable
            </span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              ₹{summary.totalPayables.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-400">
              outstanding
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Due across {summary.totalVendors} contracted suppliers
          </p>
        </div>

        {/* Inward Deliveries GRN */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Inward GRN Shipments
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.totalGRNCount}
            </span>
            <span className="text-xs text-stone-400">
              received shipments
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Directly synced into raw ingredient inventory
          </p>
        </div>

      </div>

      {/* 3. Operational Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders ({purchaseOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vendors'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Building className="w-4 h-4" />
            Vendor Directory ({vendors.length})
          </button>

          <button
            onClick={() => setActiveTab('grn')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'grn'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <History className="w-4 h-4" />
            GRN Inward Ledger ({allGrnReceipts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search POs or vendors..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: PURCHASE ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          
          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatusFilter === st
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
              <p className="text-sm text-stone-500">Loading purchase orders...</p>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
              <ShoppingCart className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">No Purchase Orders Found</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
                Generate your first supplier purchase order to replenish raw ingredients and maintain par stock.
              </p>
              <button
                onClick={handleOpenCreatePo}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
                style={{ backgroundColor: effectivePrimary }}
              >
                <Plus className="w-4 h-4" />
                Generate Purchase Order
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 text-xs font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="py-3 px-4">PO Number & Date</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Expected Delivery</th>
                      <th className="py-3 px-4 text-center">Items</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Order Status</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                    {filteredPOs.map(po => {
                      const isReceived = po.status === 'RECEIVED';
                      const isPartiallyReceived = po.status === 'PARTIALLY_RECEIVED';
                      const isOrdered = po.status === 'ORDERED';
                      const isPaid = po.paymentStatus === 'PAID';

                      return (
                        <tr key={po._id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-stone-900 dark:text-stone-100">
                              {po.poNumber}
                            </div>
                            <div className="text-xs text-stone-400">
                              {new Date(po.orderDate || po.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-stone-900 dark:text-stone-100">
                              {po.vendorId?.name || 'Unknown Vendor'}
                            </div>
                            <div className="text-xs text-stone-400">
                              {po.vendorId?.phone || po.vendorId?.code || '—'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-stone-500">
                            {po.expectedDeliveryDate ? (
                              new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short'
                              })
                            ) : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-center text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                              {po.items?.length || 0} line(s)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-stone-100">
                            ₹{po.grandTotal?.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : isPartiallyReceived
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                  : isOrdered
                                    ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400'
                                    : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {po.status?.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : po.paymentStatus === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                            }`}>
                              {po.paymentStatus?.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Receive GRN button if not fully received */}
                              {!isReceived && po.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleOpenGrnModal(po)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400 transition-colors flex items-center gap-1"
                                  title="Receive delivery via GRN"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  Receive GRN
                                </button>
                              )}

                              {/* Pay button */}
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenPaymentModal(po)}
                                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                                  title="Settle Payment"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}

                              {/* View / Print button */}
                              <button
                                onClick={() => {
                                  setSelectedPo(po);
                                  setIsPoDetailOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                                title="View Purchase Order Voucher"
                              >
                                <Eye className="w-4 h-4" />
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
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: VENDOR DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map(vendor => (
            <div 
              key={vendor._id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                    {vendor.category}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200">
                    {vendor.paymentTerms?.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {vendor.name}
                </h3>
                <div className="text-xs text-stone-400 mt-0.5 mb-3">
                  Code: {vendor.code || '—'} {vendor.contactPerson ? `• Contact: ${vendor.contactPerson}` : ''}
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300 mb-4">
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{vendor.email}</span>
                    </div>
                  )}
                  {vendor.gstin && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Receipt className="w-3.5 h-3.5 text-stone-400" />
                      <span>GST: {vendor.gstin}</span>
                    </div>
                  )}
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Payable Balance</span>
                    <span className={`font-bold text-sm ${vendor.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{vendor.outstandingBalance?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Billed</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                      ₹{vendor.totalPurchasedAmount?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800 mt-4">
                <button
                  onClick={() => {
                    setVendorForm(vendor);
                    setIsVendorModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                  title="Edit Vendor"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: GRN INWARD LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'grn' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          {allGrnReceipts.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              No Goods Received Notes (GRN) logged yet. Deliveries received on active POs will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 text-xs font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="py-3 px-4">GRN # & Time</th>
                    <th className="py-3 px-4">Purchase Order</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Invoice / Challan</th>
                    <th className="py-3 px-4 text-right">Invoice Amount</th>
                    <th className="py-3 px-4">Items Received</th>
                    <th className="py-3 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                  {allGrnReceipts.map((grn, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 text-xs">
                        {grn.grnNumber}
                        <div className="text-[11px] font-normal text-stone-400">
                          {new Date(grn.receivedAt).toLocaleString('en-IN', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-xs text-stone-900 dark:text-stone-100">
                        {grn.poNumber}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium">
                        {grn.vendorName}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono">
                        {grn.invoiceNo || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-stone-100 text-xs">
                        ₹{grn.invoiceAmount?.toLocaleString('en-IN') || 0}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {grn.itemsReceived?.map((it, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded-sm bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                              {it.itemName}: {it.receivedQuantity} {it.uom}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-stone-500">
                        {grn.receivedBy?.name || 'Receiving Staff'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CREATE PURCHASE ORDER MODAL */}
      {/* ========================================================================= */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Generate Supplier Purchase Order (PO)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Select contracted supplier, order items, specify expected delivery, and lock procurement rates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatePoOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Supplier & Delivery Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Target Vendor *
                  </label>
                  <select
                    value={poForm.vendorId}
                    onChange={e => setPoForm({ ...poForm, vendorId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.category} • {v.paymentTerms})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={poForm.orderDate}
                    onChange={e => setPoForm({ ...poForm, orderDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={e => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
                    Purchase Order Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPoItemLine}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item Line
                  </button>
                </div>

                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Item / Inventory Link</th>
                          <th className="py-2.5 px-3 w-28">Quantity</th>
                          <th className="py-2.5 px-3 w-24">UOM</th>
                          <th className="py-2.5 px-3 w-28">Rate (₹)</th>
                          <th className="py-2.5 px-3 w-24">GST %</th>
                          <th className="py-2.5 px-3 text-right w-28">Line Total</th>
                          <th className="py-2.5 px-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                        {poForm.items.map((it, idx) => {
                          const qty = Number(it.quantity) || 0;
                          const rate = Number(it.unitPrice) || 0;
                          const tax = Number(it.taxPercent) || 0;
                          const sub = qty * rate;
                          const lineTot = Math.round((sub + (sub * tax / 100)) * 100) / 100;

                          return (
                            <tr key={idx}>
                              <td className="p-2 space-y-1">
                                <select
                                  value={it.inventoryItemId || ''}
                                  onChange={e => handlePoItemChange(idx, 'inventoryItemId', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                >
                                  <option value="">-- Choose From Raw Inventory --</option>
                                  {inventoryItems.map(inv => (
                                    <option key={inv._id} value={inv._id}>
                                      {inv.name} (Stock: {inv.currentStock} {inv.uom})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Or enter custom item name"
                                  value={it.itemName}
                                  onChange={e => handlePoItemChange(idx, 'itemName', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={it.quantity}
                                  onChange={e => handlePoItemChange(
                                    idx, 
                                    'quantity', 
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )}
                                  placeholder="10"
                                  className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={it.uom}
                                  onChange={e => handlePoItemChange(idx, 'uom', e.target.value)}
                                  placeholder="kg"
                                  className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={it.unitPrice}
                                  onChange={e => handlePoItemChange(
                                    idx, 
                                    'unitPrice', 
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )}
                                  placeholder="340"
                                  className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={it.taxPercent}
                                  onChange={e => handlePoItemChange(idx, 'taxPercent', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                </select>
                              </td>
                              <td className="p-2 text-right font-bold text-stone-900 dark:text-stone-100">
                                ₹{lineTot}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePoItemLine(idx)}
                                  className="p-1 rounded text-stone-400 hover:text-red-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Procurement Notes / Instructions
                  </label>
                  <textarea
                    rows="2"
                    value={poForm.notes}
                    onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
                    placeholder="e.g. Deliver before 11:00 AM; cold-chain van required..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">₹{livePoFormTotals.subTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Tax:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">₹{livePoFormTotals.taxTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-700">
                    <span>Grand Total:</span>
                    <span className="text-orange-600">₹{livePoFormTotals.grandTotal}</span>
                  </div>
                </div>
              </div>

            </form>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <button
                type="button"
                onClick={() => setIsCreatePoOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePo}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm & Issue Purchase Order
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. GOODS RECEIVED NOTE (GRN) INWARD MODAL */}
      {/* ========================================================================= */}
      {isGrnModalOpen && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Receive Delivery — {selectedPo.poNumber}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Supplier: {selectedPo.vendorId?.name || 'Vendor'} • Log GRN receipt to auto-increment inventory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGrnModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrn} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Vendor Invoice / Challan #
                  </label>
                  <input
                    type="text"
                    value={grnForm.invoiceNo}
                    onChange={e => setGrnForm({ ...grnForm, invoiceNo: e.target.value })}
                    placeholder="e.g. INV-AMUL-9821"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Invoice Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={grnForm.invoiceAmount}
                    onChange={e => setGrnForm({
                      ...grnForm,
                      invoiceAmount: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="e.g. 4672.50"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Items Reception Table */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Items Verification & Stock Receipt
                </label>
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3 text-right">Ordered</th>
                        <th className="py-2.5 px-3 text-right">Prev Recd</th>
                        <th className="py-2.5 px-3 text-right w-28">Receive Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {grnForm.itemsReceived.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-stone-800 dark:text-stone-200">
                            {it.itemName}
                          </td>
                          <td className="py-2 px-3 text-right text-stone-500">
                            {it.quantityOrdered} {it.uom}
                          </td>
                          <td className="py-2 px-3 text-right text-stone-500">
                            {it.previouslyReceived} {it.uom}
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.receivedQuantity}
                              onChange={e => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setGrnForm(prev => {
                                  const updated = [...prev.itemsReceived];
                                  updated[idx] = { ...updated[idx], receivedQuantity: val };
                                  return { ...prev, itemsReceived: updated };
                                });
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-stone-200 text-right font-bold text-orange-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receiving Notes / Cold Chain Check */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Receiving & Cold-Chain QC Notes
                </label>
                <textarea
                  rows="2"
                  value={grnForm.notes}
                  onChange={e => setGrnForm({ ...grnForm, notes: e.target.value })}
                  placeholder="e.g. Temperature checked at 3.4°C in refrigerated van, packaging intact, expiry verified."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Confirming this GRN will automatically increment available balances in Raw Ingredient Inventory and log an inward audit entry.
                </span>
              </div>

            </form>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <button
                type="button"
                onClick={() => setIsGrnModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitGrn}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Inward & Increment Stock
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. VENDOR PAYMENT MODAL */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span>Record Vendor Payment</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Supplier:</span>
                <span className="font-semibold">{selectedPo.vendorId?.name || 'Vendor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">PO Grand Total:</span>
                <span className="font-semibold">₹{selectedPo.grandTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Previously Paid:</span>
                <span className="font-semibold text-emerald-600">₹{selectedPo.paidAmount || 0}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                <span>Remaining Balance:</span>
                <span className="text-red-600">₹{Math.max(0, selectedPo.grandTotal - (selectedPo.paidAmount || 0))}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({
                    ...paymentForm,
                    amount: e.target.value === '' ? '' : Number(e.target.value)
                  })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white dark:bg-stone-800"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. ADD / EDIT VENDOR MODAL */}
      {/* ========================================================================= */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 my-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                <Building className="w-5 h-5 text-orange-600" />
                <span>{vendorForm._id ? 'Edit Supplier' : 'Register New Food Supplier'}</span>
              </div>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.name}
                  onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Amul Dairy Distributors"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={vendorForm.category}
                    onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  >
                    {VENDOR_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={e => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  >
                    {PAYMENT_TERMS_OPTIONS.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={vendorForm.contactPerson}
                    onChange={e => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    placeholder="9820192831"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    GSTIN #
                  </label>
                  <input
                    type="text"
                    value={vendorForm.gstin}
                    onChange={e => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCA1234F1Z5"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="sales@amuldairy.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Warehouse / Supply Address
                </label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })}
                  placeholder="Plot 42, APMC Market, Vashi"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {vendorForm._id ? 'Update Supplier' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. PRINTABLE PURCHASE ORDER VOUCHER MODAL */}
      {/* ========================================================================= */}
      {isPoDetailOpen && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-stone-900 dark:text-stone-100">Purchase Order Voucher: {selectedPo.poNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setIsPoDetailOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Header Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Vendor Details</span>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">{selectedPo.vendorId?.name}</span>
                  <span className="text-stone-500 block">{selectedPo.vendorId?.address || '—'}</span>
                  <span className="text-stone-500 block">Phone: {selectedPo.vendorId?.phone || '—'}</span>
                  {selectedPo.vendorId?.gstin && <span className="text-stone-500 block">GSTIN: {selectedPo.vendorId.gstin}</span>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Order Info</span>
                  <span className="font-mono font-bold text-orange-600 block">{selectedPo.poNumber}</span>
                  <span className="text-stone-500 block">Date: {new Date(selectedPo.orderDate || selectedPo.createdAt).toLocaleDateString('en-IN')}</span>
                  <span className="text-stone-500 block">Terms: {selectedPo.vendorId?.paymentTerms?.replace('_', ' ')}</span>
                  <span className="font-bold mt-1 inline-block px-2 py-0.5 rounded-full bg-stone-100">
                    Status: {selectedPo.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">GST</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedPo.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium">{it.itemName}</td>
                        <td className="py-2 px-3 text-right">{it.quantity} {it.uom}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">{it.receivedQuantity || 0} {it.uom}</td>
                        <td className="py-2 px-3 text-right">₹{it.unitPrice}</td>
                        <td className="py-2 px-3 text-right">{it.taxPercent || 0}%</td>
                        <td className="py-2 px-3 text-right font-bold">₹{it.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                    <tr>
                      <td colSpan="5" className="py-2 px-3 text-right">Grand Total:</td>
                      <td className="py-2 px-3 text-right text-orange-600">₹{selectedPo.grandTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* GRN Receipts history for this PO */}
              {selectedPo.grnReceipts && selectedPo.grnReceipts.length > 0 && (
                <div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2">
                    Inward Delivery GRN Receipts ({selectedPo.grnReceipts.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedPo.grnReceipts.map((grn, i) => (
                      <div key={i} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-orange-600">{grn.grnNumber}</span>
                          <span className="text-stone-400 ml-2">
                            {new Date(grn.receivedAt).toLocaleDateString('en-IN')} (Invoice: {grn.invoiceNo || 'N/A'})
                          </span>
                        </div>
                        <span className="font-bold text-stone-900">₹{grn.invoiceAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPo.notes && (
                <div className="p-3 rounded-xl bg-stone-50 text-stone-600">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  {selectedPo.notes}
                </div>
              )}

            </div>

            <div className="flex items-center justify-end p-4 border-t border-stone-200 bg-stone-50">
              <button
                onClick={() => setIsPoDetailOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
