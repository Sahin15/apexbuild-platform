import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, Plus, Search, Filter, ShieldCheck, AlertCircle, 
  CheckCircle2, ChevronRight, X, Eye, Sparkles, Layers, 
  Package, RefreshCw, Calendar, IndianRupee, Clock, ArrowRight,
  FileText, Check, DollarSign, Building2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyPurchases() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [activeTab, setActiveTab] = useState('GRN'); // 'GRN', 'POS', 'SUPPLIERS'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');

  // Modals
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedGRNForDetail, setSelectedGRNForDetail] = useState(null);
  const [selectedGRNForPayment, setSelectedGRNForPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [paymentAmount, setPaymentAmount] = useState('');

  // Initial New GRN Form State
  const initialGRNForm = {
    poId: '',
    supplierId: '',
    supplierInvoiceNumber: '',
    supplierInvoiceDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'NET_21',
    dueDate: '',
    pharmacistNotes: '',
    items: [
      {
        medicineId: '',
        batchNumber: '',
        mfgDate: '',
        expiryDate: '',
        quantityReceived: 10,
        freeQuantity: 0,
        purchasePrice: 100,
        tradeDiscountPercent: 0,
        gstRate: 12,
        mrp: 140,
        sellingPrice: 140,
        rackLocation: 'Rack A-01'
      }
    ]
  };
  const [grnFormData, setGrnFormData] = useState(initialGRNForm);

  // Initial New PO Form State
  const initialPOForm = {
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [
      {
        medicineId: '',
        packSize: '10 Tablets / Strip',
        orderQuantity: 50,
        estimatedPurchasePrice: 100
      }
    ]
  };
  const [poFormData, setPoFormData] = useState(initialPOForm);

  // Initial New Supplier Form State
  const initialSupplierForm = {
    name: '',
    dlNumber: 'Form 20B/21B-WB-',
    gstin: '',
    contactPerson: '',
    phone: '',
    email: '',
    paymentTerms: 'NET_21',
    address: 'Kolkata, West Bengal'
  };
  const [supplierFormData, setSupplierFormData] = useState(initialSupplierForm);

  // Fetch all procurement data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [grnRes, poRes, suppRes, medRes] = await Promise.all([
        api.get('/pharmacy/purchases/grn').catch(() => ({ data: { data: { goodsReceivedNotes: [] } } })),
        api.get('/pharmacy/purchases/pos').catch(() => ({ data: { data: { purchaseOrders: [] } } })),
        api.get('/pharmacy/suppliers').catch(() => ({ data: { data: { suppliers: [] } } })),
        api.get('/pharmacy/medicines').catch(() => ({ data: { data: { medicines: [] } } }))
      ]);

      if (grnRes.data?.data?.goodsReceivedNotes) {
        setGrns(grnRes.data.data.goodsReceivedNotes);
      }
      if (poRes.data?.data?.purchaseOrders) {
        setPurchaseOrders(poRes.data.data.purchaseOrders);
      }
      if (suppRes.data?.data?.suppliers) {
        setSuppliers(suppRes.data.data.suppliers);
      }
      if (medRes.data?.data?.medicines) {
        setMedicines(medRes.data.data.medicines);
      }
    } catch (err) {
      console.error('Failed to load procurement data:', err);
      toast.error('Unable to fetch live procurement data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate KPIs
  const payablesTotal = useMemo(() => {
    return grns
      .filter(g => g.paymentStatus !== 'PAID')
      .reduce((sum, g) => sum + (g.grandTotal - (g.paidAmount || 0)), 0);
  }, [grns]);

  const pendingPOsCount = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED').length;
  }, [purchaseOrders]);

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grns.filter(g => {
      const matchSearch = 
        g.grnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.supplierInvoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.supplierId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (paymentStatusFilter !== 'ALL' && g.paymentStatus !== paymentStatusFilter) return false;
      return true;
    });
  }, [grns, searchTerm, paymentStatusFilter]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchSearch = 
        po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (poStatusFilter !== 'ALL' && po.status !== poStatusFilter) return false;
      return true;
    });
  }, [purchaseOrders, searchTerm, poStatusFilter]);

  // Handle adding line item to GRN Form
  const addGRNLineItem = () => {
    setGrnFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          medicineId: medicines[0]?._id || '',
          batchNumber: '',
          mfgDate: '',
          expiryDate: '',
          quantityReceived: 10,
          freeQuantity: 0,
          purchasePrice: 100,
          tradeDiscountPercent: 0,
          gstRate: 12,
          mrp: 140,
          sellingPrice: 140,
          rackLocation: 'Rack A-01'
        }
      ]
    }));
  };

  const removeGRNLineItem = (index) => {
    if (grnFormData.items.length <= 1) {
      toast.error('GRN must contain at least one medicine item');
      return;
    }
    setGrnFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const updateGRNLineItem = (index, field, value) => {
    setGrnFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };

      // If medicine changed, auto-suggest rack and gst
      if (field === 'medicineId') {
        const med = medicines.find(m => m._id === value);
        if (med) {
          updated[index].rackLocation = med.rackLocation || 'Rack A-01';
          updated[index].gstRate = med.gstRate || 12;
        }
      }

      return { ...prev, items: updated };
    });
  };

  // Calculate live totals for the GRN form
  const grnCalculations = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    grnFormData.items.forEach(item => {
      const qty = Number(item.quantityReceived) || 0;
      const rate = Number(item.purchasePrice) || 0;
      const disc = Number(item.tradeDiscountPercent) || 0;
      const gst = Number(item.gstRate) || 12;

      const gross = qty * rate;
      const lineDisc = gross * (disc / 100);
      const taxable = gross - lineDisc;
      const lineTax = taxable * (gst / 100);

      subtotal += gross;
      discountTotal += lineDisc;
      taxTotal += lineTax;
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round((subtotal - discountTotal + taxTotal) * 100) / 100
    };
  }, [grnFormData.items]);

  // Submit New GRN (Inward shipment)
  const handleSubmitGRN = async (e) => {
    e.preventDefault();
    if (!grnFormData.supplierId) {
      toast.error('Please select an authorized distributor');
      return;
    }
    if (!grnFormData.supplierInvoiceNumber.trim()) {
      toast.error('Please enter the distributor invoice number');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/pharmacy/purchases/grn', grnFormData);
      toast.success(res.data?.message || 'Stock successfully inwarded into live inventory!');
      setShowGRNModal(false);
      setGrnFormData(initialGRNForm);
      fetchData(true);
    } catch (err) {
      console.error('Failed to inward GRN:', err);
      toast.error(err.response?.data?.message || 'Failed to inward shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New PO
  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!poFormData.supplierId) {
      toast.error('Please select a distributor');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/pharmacy/purchases/pos', poFormData);
      toast.success('Purchase Order created successfully!');
      setShowPOModal(false);
      setPoFormData(initialPOForm);
      fetchData(true);
    } catch (err) {
      console.error('Failed to create PO:', err);
      toast.error(err.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Distributor
  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) {
      toast.error('Distributor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/pharmacy/suppliers', supplierFormData);
      toast.success('Authorized Distributor added!');
      setShowSupplierModal(false);
      setSupplierFormData(initialSupplierForm);
      fetchData(true);
    } catch (err) {
      console.error('Failed to create supplier:', err);
      toast.error(err.response?.data?.message || 'Failed to save distributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Payment against GRN
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/pharmacy/purchases/grn/${selectedGRNForPayment._id}/payment`, {
        amount
      });
      toast.success(res.data?.message || 'Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedGRNForPayment(null);
      setPaymentAmount('');
      fetchData(true);
    } catch (err) {
      console.error('Payment record failed:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick helper to start GRN from a specific PO
  const handleInwardFromPO = (po) => {
    const prefilledItems = po.items.map(item => ({
      medicineId: item.medicineId?._id || item.medicineId,
      batchNumber: '',
      mfgDate: '',
      expiryDate: '',
      quantityReceived: Math.max(1, item.orderQuantity - (item.receivedQuantity || 0)),
      freeQuantity: 0,
      purchasePrice: item.estimatedPurchasePrice || 100,
      tradeDiscountPercent: 0,
      gstRate: 12,
      mrp: (item.estimatedPurchasePrice || 100) * 1.3,
      sellingPrice: (item.estimatedPurchasePrice || 100) * 1.3,
      rackLocation: 'Rack A-01'
    }));

    setGrnFormData({
      ...initialGRNForm,
      poId: po._id,
      supplierId: po.supplierId?._id || po.supplierId,
      items: prefilledItems.length > 0 ? prefilledItems : initialGRNForm.items
    });
    setShowGRNModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Statutory Header & Procurement Hub Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement & GRN Inwarding</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              Procure-to-Stock
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Supplier purchase orders, consignment inspection, and statutory batch ledger inwarding.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              fetchData(true);
              toast.success('Procurement data refreshed');
            }}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Create PO</span>
          </button>
          <button
            onClick={() => {
              setGrnFormData(initialGRNForm);
              setShowGRNModal(true);
            }}
            style={{ backgroundColor: effectivePrimary }}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:brightness-105 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Stock (GRN)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier Payables Due</span>
            <h3 className="text-xl font-extrabold text-rose-700 mt-0.5">
              ₹{payablesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] font-medium text-slate-500">Unsettled Inward Invoices</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Purchase Orders</span>
            <h3 className="text-xl font-extrabold text-blue-700 mt-0.5">{pendingPOsCount} POs</h3>
            <span className="text-[10px] font-medium text-slate-500">Awaiting Supplier Delivery</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inwarded Consignments</span>
            <h3 className="text-xl font-extrabold text-teal-800 mt-0.5">{grns.length} GRNs</h3>
            <span className="text-[10px] font-medium text-slate-500">Traceable Batch Inwards</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Distributors</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{suppliers.length} Accounts</h3>
            <span className="text-[10px] font-medium text-slate-500">DL 20B/21B Compliant</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('GRN')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'GRN' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Goods Received Notes (GRN)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {grns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('POS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'POS' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Purchase Orders (PO)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {purchaseOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'SUPPLIERS' 
              ? 'border-teal-600 text-teal-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Authorized Distributors</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GOODS RECEIVED NOTES */}
      {activeTab === 'GRN' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by GRN #, Supplier Invoice #, or Distributor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map(status => (
                <button
                  key={status}
                  onClick={() => setPaymentStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    paymentStatusFilter === status
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {status === 'ALL' ? 'All Invoices' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* GRN Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <span>Loading goods receipt notes...</span>
              </div>
            ) : filteredGRNs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">No Goods Received Notes found</p>
                <p className="mt-1">Inward a shipment or change filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">GRN & Invoice #</th>
                      <th className="px-4 py-3">Distributor</th>
                      <th className="px-4 py-3">Received / Due Date</th>
                      <th className="px-4 py-3 text-center">Batch Lines</th>
                      <th className="px-4 py-3 text-right">Invoice Total</th>
                      <th className="px-4 py-3 text-right">Balance Due</th>
                      <th className="px-4 py-3 text-center">Payment</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredGRNs.map((g) => {
                      const balance = Math.max(0, g.grandTotal - (g.paidAmount || 0));
                      return (
                        <tr key={g._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-extrabold text-slate-900">{g.grnNumber}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">Inv:</span>
                              <span className="text-[10px] font-bold text-slate-700">{g.supplierInvoiceNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900 truncate max-w-[200px]">
                              {g.supplierId?.name || 'Authorized Distributor'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              DL: {g.supplierId?.dlNumber || 'Form 20B/21B'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800">
                              {new Date(g.receivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Due: {g.dueDate ? new Date(g.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Net 21'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                              {g.items?.length || 0} Batches
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                            ₹{Number(g.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold">
                            <span className={balance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {g.paymentStatus === 'PAID' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Paid
                              </span>
                            ) : g.paymentStatus === 'PARTIALLY_PAID' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Partial
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {balance > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedGRNForPayment(g);
                                    setPaymentAmount(balance.toFixed(2));
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-colors"
                                >
                                  Pay
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedGRNForDetail(g)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                title="View Details"
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
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'POS' && (
        <div className="space-y-4">
          
          {/* PO Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO # or distributor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setPoStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    poStatusFilter === status
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {status === 'ALL' ? 'All Orders' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* PO Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <span>Loading purchase orders...</span>
              </div>
            ) : filteredPOs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">No Purchase Orders found</p>
                <p className="mt-1">Create a purchase order to initiate restocking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">PO Number</th>
                      <th className="px-4 py-3">Distributor</th>
                      <th className="px-4 py-3">Order Date</th>
                      <th className="px-4 py-3">Fulfillment Progress</th>
                      <th className="px-4 py-3 text-right">Est. Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPOs.map((po) => {
                      const totalOrderQty = po.items?.reduce((sum, i) => sum + (i.orderQuantity || 0), 0) || 0;
                      const totalReceivedQty = po.items?.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0) || 0;
                      const percent = totalOrderQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalOrderQty) * 100)) : 0;

                      return (
                        <tr key={po._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {po.poNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900">{po.supplierId?.name || 'Distributor'}</p>
                            <p className="text-[10px] text-slate-400">DL: {po.supplierId?.dlNumber || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {new Date(po.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="w-40">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>{totalReceivedQty} of {totalOrderQty} units</span>
                                <span className="font-bold">{percent}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-teal-600 rounded-full transition-all"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                            ₹{Number(po.totalEstimatedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {po.status === 'RECEIVED' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Received
                              </span>
                            ) : po.status === 'PARTIALLY_RECEIVED' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Partial
                              </span>
                            ) : po.status === 'ORDERED' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                Ordered
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                {po.status}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleInwardFromPO(po)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                              >
                                <span>Receive</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTHORIZED DISTRIBUTORS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-600">Registered Wholesale Drug License Form 20B/21B Distributors</p>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Distributor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                      {s.paymentTerms || 'NET_21'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3">
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">DL: <strong className="text-slate-900">{s.dlNumber}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">GSTIN: <strong className="text-slate-900">{s.gstin || 'N/A'}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Contact: <strong>{s.contactPerson || 'Sales Team'}</strong> ({s.phone})</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Authorized Wholesale Chemist</span>
                  <button 
                    onClick={() => {
                      setPoFormData({ ...initialPOForm, supplierId: s._id });
                      setShowPOModal(true);
                    }}
                    className="font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Order Stock</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: NEW INWARD STOCK (GRN) */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Inward Consignment (Goods Received Note)</h3>
                <p className="text-xs text-slate-500">Record supplier invoice and verify batches to increment live inventory.</p>
              </div>
              <button 
                onClick={() => setShowGRNModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="space-y-5 overflow-y-auto pt-4 pr-1">
              
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Distributor *</label>
                  <select
                    value={grnFormData.supplierId}
                    onChange={(e) => setGrnFormData({ ...grnFormData, supplierId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                  >
                    <option value="">Select Distributor</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.dlNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier Invoice # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-BDH-99210"
                    value={grnFormData.supplierInvoiceNumber}
                    onChange={(e) => setGrnFormData({ ...grnFormData, supplierInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={grnFormData.supplierInvoiceDate}
                    onChange={(e) => setGrnFormData({ ...grnFormData, supplierInvoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Items Line Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Verified Batch Lines ({grnFormData.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addGRNLineItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {grnFormData.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="text-xs font-extrabold text-teal-800">Line #{idx + 1}</span>
                        {grnFormData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGRNLineItem(idx)}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                          >
                            Remove Line
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Medicine Formulation *</label>
                          <select
                            required
                            value={item.medicineId}
                            onChange={(e) => updateGRNLineItem(idx, 'medicineId', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium"
                          >
                            <option value="">Select Medicine</option>
                            {medicines.map(m => (
                              <option key={m._id} value={m._id}>{m.brandName} - {m.genericName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Batch Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. AUG24099"
                            value={item.batchNumber}
                            onChange={(e) => updateGRNLineItem(idx, 'batchNumber', e.target.value.toUpperCase())}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Expiry (MM/YYYY) *</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YYYY"
                            value={item.expiryDate}
                            onChange={(e) => updateGRNLineItem(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Inward Qty *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantityReceived}
                            onChange={(e) => updateGRNLineItem(idx, 'quantityReceived', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Free Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={item.freeQuantity}
                            onChange={(e) => updateGRNLineItem(idx, 'freeQuantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cost Rate (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.purchasePrice}
                            onChange={(e) => updateGRNLineItem(idx, 'purchasePrice', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pack MRP (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.mrp}
                            onChange={(e) => updateGRNLineItem(idx, 'mrp', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">GST %</label>
                          <select
                            value={item.gstRate}
                            onChange={(e) => updateGRNLineItem(idx, 'gstRate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Rack Location</label>
                          <input
                            type="text"
                            value={item.rackLocation}
                            onChange={(e) => updateGRNLineItem(idx, 'rackLocation', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>Taxable Subtotal: <strong>₹{grnCalculations.subtotal.toFixed(2)}</strong></p>
                  <p>GST Total: <strong>₹{grnCalculations.taxTotal.toFixed(2)}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Grand Total</span>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-0.5">
                    ₹{grnCalculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              {/* Pharmacist Verification Note */}
              <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3 flex items-start gap-2 text-xs text-teal-900">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p>
                  By clicking <strong>Verify & Inward Stock</strong>, you certify that the physical strip seals, packaging barcodes, and cold-chain integrity match Drugs & Cosmetics statutory requirements. Stock will immediately become dispensable at the POS.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGRNModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-6 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm hover:brightness-105 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Inwarding Batches...' : 'Verify & Inward Stock'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW PURCHASE ORDER (PO) */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Supplier Purchase Order</h3>
                <p className="text-xs text-slate-500">Initiate procurement order with an authorized distributor.</p>
              </div>
              <button 
                onClick={() => setShowPOModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Distributor *</label>
                  <select
                    required
                    value={poFormData.supplierId}
                    onChange={(e) => setPoFormData({ ...poFormData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="">Select Distributor</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.dlNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poFormData.expectedDeliveryDate}
                    onChange={(e) => setPoFormData({ ...poFormData, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              {/* PO Items */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">Order Lines</label>
                {poFormData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="sm:col-span-2">
                      <select
                        required
                        value={item.medicineId}
                        onChange={(e) => {
                          const updated = [...poFormData.items];
                          updated[idx].medicineId = e.target.value;
                          setPoFormData({ ...poFormData, items: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map(m => (
                          <option key={m._id} value={m._id}>{m.brandName} - {m.genericName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Order Quantity"
                        value={item.orderQuantity}
                        onChange={(e) => {
                          const updated = [...poFormData.items];
                          updated[idx].orderQuantity = Number(e.target.value);
                          setPoFormData({ ...poFormData, items: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={poFormData.notes}
                  onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                  placeholder="e.g. Please send minimum 18-month shelf-life batches only."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-6 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm hover:brightness-105"
                >
                  {isSubmitting ? 'Creating PO...' : 'Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD PAYMENT */}
      {showPaymentModal && selectedGRNForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Distributor Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p>GRN Number: <strong className="text-slate-900">{selectedGRNForPayment.grnNumber}</strong></p>
                <p>Distributor: <strong className="text-slate-900">{selectedGRNForPayment.supplierId?.name}</strong></p>
                <p>Invoice Total: <strong className="text-slate-900">₹{selectedGRNForPayment.grandTotal.toFixed(2)}</strong></p>
                <p>Already Paid: <strong className="text-emerald-700">₹{(selectedGRNForPayment.paidAmount || 0).toFixed(2)}</strong></p>
                <p>Remaining Due: <strong className="text-rose-700">₹{(selectedGRNForPayment.grandTotal - (selectedGRNForPayment.paidAmount || 0)).toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD DISTRIBUTOR */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Authorized Distributor</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-3 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Distributor Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengal Drug House"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Drug License (20B/21B) *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.dlNumber}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, dlNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={supplierFormData.gstin}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supplierFormData.contactPerson}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Distributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: GRN DETAILS MODAL */}
      {selectedGRNForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Goods Received Note: {selectedGRNForDetail.grnNumber}</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedGRNForDetail.supplierInvoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedGRNForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500">Distributor</span>
                  <p className="font-bold text-slate-900">{selectedGRNForDetail.supplierId?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Drug Licence</span>
                  <p className="font-bold text-slate-900">{selectedGRNForDetail.supplierId?.dlNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Received Date</span>
                  <p className="font-bold text-slate-900">{new Date(selectedGRNForDetail.receivedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Payment Status</span>
                  <p className="font-bold text-slate-900 uppercase">{selectedGRNForDetail.paymentStatus}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Inwarded Batches</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Brand / Generic</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2">Expiry</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Cost Rate</th>
                        <th className="p-2 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedGRNForDetail.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-900">
                            {item.medicineId?.brandName || 'Medicine'}
                          </td>
                          <td className="p-2 font-mono font-bold text-teal-800">{item.batchNumber}</td>
                          <td className="p-2">{item.expiryDate}</td>
                          <td className="p-2 text-center font-bold">{item.quantityReceived}</td>
                          <td className="p-2 text-right">₹{item.purchasePrice}</td>
                          <td className="p-2 text-right font-bold">₹{item.netAmount?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <span>Verified by Pharmacist: <strong>{selectedGRNForDetail.verifiedByPharmacistId?.name || 'Rahul Roy'}</strong></span>
                <span className="text-base font-extrabold text-slate-900">
                  Total: ₹{selectedGRNForDetail.grandTotal?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
