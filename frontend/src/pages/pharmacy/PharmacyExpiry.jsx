import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, Ban, ShieldAlert, CheckCircle2, RotateCcw, 
  Trash2, FileText, IndianRupee, Clock, ChevronRight, X, 
  Printer, ArrowUpRight, Search, Sparkles, RefreshCw, Plus,
  Building2, Eye, ShieldCheck, Flame, Download, Check,
  AlertCircle, Calendar, Hash, Truck, ArrowLeft, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyExpiry() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  // Navigation Sub-tabs: 'TRIAGE', 'CLAIMS', 'NEW_CLAIM', 'DISPOSALS'
  const [activeTab, setActiveTab] = useState('TRIAGE');
  const [triageFilter, setTriageFilter] = useState('ALL'); // ALL, QUARANTINED, EXPIRED, CRITICAL_30, NEAR_60, WATCHLIST_90
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [analytics, setAnalytics] = useState({
    expiredLoss: 0,
    expiredUnits: 0,
    criticalValue: 0,
    criticalUnits: 0,
    nearExpiryValue: 0,
    nearExpiryUnits: 0,
    watchlistValue: 0,
    watchlistUnits: 0,
    quarantinedUnits: 0,
    quarantinedValue: 0,
    claims: { totalClaimsCount: 0, totalClaimAmount: 0, pendingClaimsAmount: 0, settledClaimsAmount: 0 },
    disposals: { totalDisposals: 0, totalUnitsDisposed: 0, totalLoss: 0 }
  });
  const [batches, setBatches] = useState([]);
  const [debitNotes, setDebitNotes] = useState([]);
  const [debitSummary, setDebitSummary] = useState({});
  const [disposalLogs, setDisposalLogs] = useState([]);
  const [disposalSummary, setDisposalSummary] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [selectedDebitNoteForView, setSelectedDebitNoteForView] = useState(null);
  const [selectedDebitNoteForSettle, setSelectedDebitNoteForSettle] = useState(null);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [selectedBatchForDisposal, setSelectedBatchForDisposal] = useState(null);

  // New Debit Note Builder State
  const [claimSupplierId, setClaimSupplierId] = useState('');
  const [claimReturnType, setClaimReturnType] = useState('EXPIRY_RETURN');
  const [claimPharmacistNotes, setClaimPharmacistNotes] = useState('');
  const [selectedBatchesForClaim, setSelectedBatchesForClaim] = useState({}); // { batchId: { selected: true, returnQty: 10, reason: 'EXPIRED_STOCK' } }
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Settlement Form State
  const [settlementType, setSettlementType] = useState('ADJUSTED_AGAINST_GRN');
  const [settlementCnNumber, setSettlementCnNumber] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  // Disposal Form State
  const [disposalBatchId, setDisposalBatchId] = useState('');
  const [disposalQty, setDisposalQty] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('INCINERATION_BIOMEDICAL_AGENCY');
  const [disposalAgency, setDisposalAgency] = useState('Medicare Bio-Waste Solutions Pvt Ltd');
  const [disposalCertNo, setDisposalCertNo] = useState('');
  const [disposalRemarks, setDisposalRemarks] = useState('');
  const [submittingDisposal, setSubmittingDisposal] = useState(false);

  // Fetch all live expiry surveillance data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [anaRes, dnRes, dispRes, suppRes] = await Promise.all([
        api.get('/pharmacy/inventory/expiry-analytics').catch(() => null),
        api.get('/pharmacy/debit-notes').catch(() => null),
        api.get('/pharmacy/disposals').catch(() => null),
        api.get('/pharmacy/suppliers').catch(() => null)
      ]);

      if (anaRes?.data?.data) {
        setAnalytics(anaRes.data.data.summary || {});
        setBatches(anaRes.data.data.batches || []);
      }
      if (dnRes?.data?.data?.debitNotes) {
        setDebitNotes(dnRes.data.data.debitNotes);
        setDebitSummary(dnRes.data.summary || {});
      }
      if (dispRes?.data?.data?.disposals) {
        setDisposalLogs(dispRes.data.data.disposals);
        setDisposalSummary(dispRes.data.summary || {});
      }
      if (suppRes?.data?.data?.suppliers) {
        setSuppliers(suppRes.data.data.suppliers);
      }
    } catch (err) {
      console.error('Failed to load expiry and returns data:', err);
      toast.error('Unable to fetch live expiry records from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quarantine toggle handler
  const handleToggleQuarantine = async (id, currentStatus) => {
    try {
      const res = await api.post(`/pharmacy/inventory/batches/${id}/quarantine`);
      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        fetchData(true);
      }
    } catch (err) {
      console.error('Toggle quarantine error:', err);
      toast.error('Failed to update quarantine status');
    }
  };

  // Filtered Batches in Triage Tab
  const filteredBatches = useMemo(() => {
    return batches.filter(item => {
      const matchSearch = 
        item.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (triageFilter === 'QUARANTINED') return item.tier === 'QUARANTINED';
      if (triageFilter === 'EXPIRED') return item.tier === 'EXPIRED';
      if (triageFilter === 'CRITICAL_30') return item.tier === 'CRITICAL_30';
      if (triageFilter === 'NEAR_60') return item.tier === 'NEAR_60';
      if (triageFilter === 'WATCHLIST_90') return item.tier === 'WATCHLIST_90';

      // ALL: return anything that is quarantined, expired, or <= 90 days
      return item.tier !== 'HEALTHY';
    });
  }, [batches, searchTerm, triageFilter]);

  // Batches available for Claim Builder (filtered by selected supplier)
  const supplierEligibleBatches = useMemo(() => {
    if (!claimSupplierId) return [];
    return batches.filter(b => {
      const suppId = b.supplierId?._id || b.supplierId;
      const isMatch = suppId === claimSupplierId || String(suppId) === String(claimSupplierId);
      const isReturnable = b.tier === 'EXPIRED' || b.tier === 'QUARANTINED' || b.tier === 'CRITICAL_30' || b.tier === 'NEAR_60';
      const hasStock = (b.quantityOnHand > 0) || (b.quarantineQuantity > 0);
      return isMatch && isReturnable && hasStock;
    });
  }, [batches, claimSupplierId]);

  // Calculated totals for Claim Builder
  const claimTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;
    let count = 0;

    Object.entries(selectedBatchesForClaim).forEach(([batchId, item]) => {
      if (item.selected) {
        const batch = batches.find(b => (b._id || b.id) === batchId);
        if (batch) {
          const qty = Number(item.returnQty) || 0;
          const price = Number(batch.purchasePrice || 0);
          const taxable = Math.round(qty * price * 100) / 100;
          const tax = Math.round((taxable * 0.12) * 100) / 100;
          subtotal += taxable;
          taxTotal += tax;
          grandTotal += (taxable + tax);
          count += 1;
        }
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      itemCount: count
    };
  }, [selectedBatchesForClaim, batches]);

  // Quick initiate claim for a specific batch from Triage table
  const handleQuickInitiateClaim = (batch) => {
    const suppId = batch.supplierId?._id || batch.supplierId;
    if (!suppId) {
      toast.error('No registered distributor associated with this batch');
      return;
    }
    setClaimSupplierId(String(suppId));
    const available = batch.status === 'QUARANTINED' ? (batch.quarantineQuantity || 0) : batch.quantityOnHand;
    setSelectedBatchesForClaim({
      [batch._id || batch.id]: {
        selected: true,
        returnQty: available,
        reason: batch.daysUntilExpiry <= 0 ? 'EXPIRED_STOCK' : 'NEAR_EXPIRY_THRESHOLD'
      }
    });
    setActiveTab('NEW_CLAIM');
    toast.success(`Selected ${batch.brandName} for Return Claim Builder`);
  };

  // Submit New Debit Note Claim
  const handleGenerateDebitNote = async (e) => {
    e.preventDefault();
    if (!claimSupplierId) {
      toast.error('Please select an authorized distributor');
      return;
    }

    const itemsToSubmit = [];
    Object.entries(selectedBatchesForClaim).forEach(([batchId, item]) => {
      if (item.selected) {
        const batch = batches.find(b => (b._id || b.id) === batchId);
        if (batch && Number(item.returnQty) > 0) {
          itemsToSubmit.push({
            batchId: batch._id,
            brandName: batch.brandName,
            genericName: batch.genericName,
            batchNumber: batch.batchNumber,
            quantityReturned: Number(item.returnQty),
            unitPurchasePrice: batch.purchasePrice,
            gstRate: 12,
            reason: item.reason || 'EXPIRED_STOCK'
          });
        }
      }
    });

    if (itemsToSubmit.length === 0) {
      toast.error('Please select at least one batch with valid quantity to return');
      return;
    }

    try {
      setSubmittingClaim(true);
      const res = await api.post('/pharmacy/debit-notes', {
        supplierId: claimSupplierId,
        returnType: claimReturnType,
        items: itemsToSubmit,
        pharmacistNotes: claimPharmacistNotes,
        status: 'SENT_TO_SUPPLIER'
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Debit Note generated successfully');
        // Reset builder state
        setClaimSupplierId('');
        setSelectedBatchesForClaim({});
        setClaimPharmacistNotes('');
        await fetchData(true);
        // Open the generated debit note modal
        if (res.data.data?.debitNote) {
          setSelectedDebitNoteForView(res.data.data.debitNote);
        }
        setActiveTab('CLAIMS');
      }
    } catch (err) {
      console.error('Failed to create debit note:', err);
      toast.error(err.response?.data?.message || 'Error generating debit note');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit Settlement
  const handleSettleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDebitNoteForSettle) return;

    try {
      setSubmittingSettlement(true);
      const res = await api.put(`/pharmacy/debit-notes/${selectedDebitNoteForSettle._id}/settle`, {
        settlementType,
        creditNoteNumber: settlementCnNumber,
        settledAmount: settlementAmount ? Number(settlementAmount) : selectedDebitNoteForSettle.grandTotal,
        settlementNotes,
        status: 'SETTLED'
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Debit Note settled successfully');
        setSelectedDebitNoteForSettle(null);
        setSettlementCnNumber('');
        setSettlementAmount('');
        setSettlementNotes('');
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to settle claim:', err);
      toast.error(err.response?.data?.message || 'Failed to settle claim');
    } finally {
      setSubmittingSettlement(false);
    }
  };

  // Submit Disposal Log
  const handleCreateDisposalSubmit = async (e) => {
    e.preventDefault();
    if (!disposalBatchId || !disposalQty || Number(disposalQty) <= 0) {
      toast.error('Please select batch and valid disposal quantity');
      return;
    }

    try {
      setSubmittingDisposal(true);
      const res = await api.post('/pharmacy/disposals', {
        batchId: disposalBatchId,
        quantityDisposed: Number(disposalQty),
        method: disposalMethod,
        agencyName: disposalAgency,
        agencyCertificateNumber: disposalCertNo,
        remarks: disposalRemarks
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Certified disposal recorded');
        setShowDisposalModal(false);
        setDisposalBatchId('');
        setDisposalQty('');
        setDisposalCertNo('');
        setDisposalRemarks('');
        fetchData(true);
      }
    } catch (err) {
      console.error('Disposal error:', err);
      toast.error(err.response?.data?.message || 'Failed to log disposal');
    } finally {
      setSubmittingDisposal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Live Sync Banner */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-teal-900 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] tracking-wider uppercase">
            Phase 6 Live
          </span>
          <span className="font-medium">
            <strong>Expiry Surveillance, Supplier Return Claims & Statutory Destruction Hub</strong> — Real-time tracking of shelf-life risk tiers, automated distributor debit notes, and Schedule M certified disposals.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchData(true);
              toast.success('Live inventory and debit note metrics synced');
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-white font-bold text-teal-800 hover:bg-teal-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Header & High-Level Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Expiry & Supplier Returns (Debit Notes)
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              Zero-Sale Protocol
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Indian Pharmacy Council & GST statutory compliance: automatic POS sale blocking, distributor claims, and certified biomedical destruction logs.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('NEW_CLAIM');
              if (suppliers.length > 0 && !claimSupplierId) {
                setClaimSupplierId(suppliers[0]._id || suppliers[0].id);
              }
            }}
            style={{ backgroundColor: effectivePrimary }}
            className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 hover:brightness-105 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Return Claim (Debit Note)</span>
          </button>
          <button
            onClick={() => setShowDisposalModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Log Certified Disposal</span>
          </button>
        </div>
      </div>

      {/* KPI Financial & Exposure Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* Quarantined Stock */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Quarantined Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <Ban className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-rose-700 tracking-tight leading-none mb-1">
              {analytics.quarantinedUnits || 0} Units
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Cost: ₹{Number(analytics.quarantinedValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-rose-600">
            <span>Hard-blocked from POS</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Protected</span>
          </div>
        </div>

        {/* Urgent Return Window (<60d) */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Near-Expiry (&lt;60 Days)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-amber-700 tracking-tight leading-none mb-1">
              ₹{Number(analytics.nearExpiryValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {analytics.nearExpiryUnits || 0} Units At Risk
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-700">
            <span>Action: Return / FEFO</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Actionable</span>
          </div>
        </div>

        {/* Supplier Debit Claims */}
        <div className="bg-white rounded-2xl p-4 border border-teal-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Supplier Debit Claims
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-teal-800 tracking-tight leading-none mb-1">
              ₹{Number(analytics.claims?.totalClaimAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              ₹{Number(analytics.claims?.pendingClaimsAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Pending Recovery
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-teal-700">
            <span>{analytics.claims?.totalClaimsCount || 0} Debit Notes Logged</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">GST Active</span>
          </div>
        </div>

        {/* Certified Disposals */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Statutory Disposals
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
              {analytics.disposals?.totalUnitsDisposed || 0} Units
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Loss: ₹{Number(analytics.disposals?.totalLoss || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>Schedule M Compliant</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Certified</span>
          </div>
        </div>

      </div>

      {/* 4 Primary Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('TRIAGE')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
            activeTab === 'TRIAGE'
              ? 'border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Expiry Surveillance & Triage</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {batches.filter(b => b.tier !== 'HEALTHY').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CLAIMS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
            activeTab === 'CLAIMS'
              ? 'border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Supplier Debit Notes & Claims</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
            {debitNotes.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('NEW_CLAIM');
            if (suppliers.length > 0 && !claimSupplierId) {
              setClaimSupplierId(suppliers[0]._id || suppliers[0].id);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
            activeTab === 'NEW_CLAIM'
              ? 'border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Return Claim Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('DISPOSALS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
            activeTab === 'DISPOSALS'
              ? 'border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Statutory Destruction Register</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {disposalLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXPIRY SURVEILLANCE & TRIAGE */}
      {/* ========================================================================= */}
      {activeTab === 'TRIAGE' && (
        <div className="space-y-4">
          
          {/* Search & Sub-Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Brand Name, Salt Composition, Batch Number, Distributor..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Watchlist' },
                { id: 'QUARANTINED', label: 'Quarantined' },
                { id: 'EXPIRED', label: 'Expired (0d)' },
                { id: 'CRITICAL_30', label: 'Critical (≤30d)' },
                { id: 'NEAR_60', label: 'Near-Expiry (31-60d)' },
                { id: 'WATCHLIST_90', label: 'Watchlist (61-90d)' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTriageFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    triageFilter === f.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Triage Batch Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Medicine Formulation</th>
                    <th className="px-4 py-3.5">Batch & Location</th>
                    <th className="px-4 py-3.5">Expiry & Status</th>
                    <th className="px-4 py-3.5 text-right">Available Stock</th>
                    <th className="px-4 py-3.5 text-right">Valuation (Cost)</th>
                    <th className="px-4 py-3.5">Distributor</th>
                    <th className="px-5 py-3.5 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="font-bold text-slate-700">No batches match the current filter tier</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">All monitored batches are healthy or in accordance with FEFO parameters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map(b => {
                      const isQuar = b.status === 'QUARANTINED' || b.tier === 'QUARANTINED';
                      const isExp = b.tier === 'EXPIRED';
                      const isCrit = b.tier === 'CRITICAL_30';
                      const isNear = b.tier === 'NEAR_60';

                      return (
                        <tr key={b._id || b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{b.brandName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{b.genericName}</div>
                            <span className="text-[9px] font-bold text-slate-500">{b.dosageForm}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {b.batchNumber}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{b.rackLocation || 'Shelf A-01'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800">{b.expiryDate}</div>
                            {isExp ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mt-0.5">
                                <Ban className="w-3 h-3" /> Expired ({Math.abs(b.daysUntilExpiry)}d ago)
                              </span>
                            ) : isCrit ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Critical ({b.daysUntilExpiry}d left)
                              </span>
                            ) : isNear ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 mt-0.5">
                                <Clock className="w-3 h-3" /> Near Expiry ({b.daysUntilExpiry}d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 mt-0.5">
                                Watchlist ({b.daysUntilExpiry}d)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                            {b.activeUnits} Units
                            {isQuar && (
                              <div className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">
                                Quarantined
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="font-bold text-slate-900">₹{b.totalCost.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">@ ₹{Number(b.purchasePrice || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-slate-800 font-medium truncate max-w-[140px]">
                              {b.supplierId?.name || 'Authorized Distributor'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {b.supplierId?.phone || b.supplierId?.dlNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleQuarantine(b._id || b.id, b.status)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                                isQuar
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isQuar ? 'Restore' : 'Quarantine'}
                            </button>
                            <button
                              onClick={() => handleQuickInitiateClaim(b)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-[11px] cursor-pointer"
                            >
                              Return Claim
                            </button>
                            <button
                              onClick={() => {
                                setDisposalBatchId(b._id || b.id);
                                setDisposalQty(b.activeUnits);
                                setShowDisposalModal(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer inline-flex items-center"
                              title="Certified Destruction"
                            >
                              <Flame className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUPPLIER DEBIT NOTES & CLAIMS */}
      {/* ========================================================================= */}
      {activeTab === 'CLAIMS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distributor Claims & Debit Notes Ledger</h3>
                <p className="text-[11px] text-slate-500">
                  Total Claims: ₹{Number(debitSummary.totalClaimAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} • 
                  Pending Recovery: ₹{Number(debitSummary.pendingClaimsAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('NEW_CLAIM');
                if (suppliers.length > 0 && !claimSupplierId) {
                  setClaimSupplierId(suppliers[0]._id || suppliers[0].id);
                }
              }}
              style={{ backgroundColor: effectivePrimary }}
              className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:brightness-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create Return Claim</span>
            </button>
          </div>

          {/* Debit Notes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Debit Note #</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Supplier / Distributor</th>
                    <th className="px-4 py-3.5">Return Nature</th>
                    <th className="px-4 py-3.5 text-center">Items / Units</th>
                    <th className="px-4 py-3.5 text-right">Claim Amount</th>
                    <th className="px-4 py-3.5 text-center">Claim Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {debitNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Supplier Debit Notes Created Yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Use the "Return Claim Builder" tab to generate claims for expired or damaged items.</p>
                      </td>
                    </tr>
                  ) : (
                    debitNotes.map(dn => {
                      const isSettled = dn.status === 'SETTLED';
                      return (
                        <tr key={dn._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-200">
                              {dn.debitNoteNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-medium">
                            {new Date(dn.debitNoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{dn.supplierName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              GST: {dn.supplierGstin || 'Unregistered'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {dn.returnType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                            {dn.items?.length || 1} Item(s) • <strong>{dn.totalQuantity} Units</strong>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-sm">
                            ₹{Number(dn.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isSettled ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Settled
                                </span>
                                {dn.settlement?.creditNoteNumber && (
                                  <span className="text-[9px] font-mono text-emerald-700 mt-0.5">
                                    CN: {dn.settlement.creditNoteNumber}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                {dn.status}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedDebitNoteForView(dn)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>Print Chit</span>
                            </button>
                            {!isSettled && (
                              <button
                                onClick={() => {
                                  setSelectedDebitNoteForSettle(dn);
                                  setSettlementAmount(dn.grandTotal);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                                <span>Settle</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NEW RETURN CLAIM BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'NEW_CLAIM' && (
        <form onSubmit={handleGenerateDebitNote} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Distributor Return Claim Builder</h3>
                <p className="text-xs text-slate-500">
                  Select a distributor to automatically scan for their expired, critical, or quarantined batches.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                GST Section 34 Debit Note
              </span>
            </div>

            {/* Step 1: Select Supplier & Return Nature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Wholesale Distributor *
                </label>
                <select
                  value={claimSupplierId}
                  onChange={(e) => {
                    setClaimSupplierId(e.target.value);
                    setSelectedBatchesForClaim({});
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">-- Select Distributor --</option>
                  {suppliers.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} (DL: {s.dlNumber || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return Nature / Category
                </label>
                <select
                  value={claimReturnType}
                  onChange={(e) => setClaimReturnType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="EXPIRY_RETURN">Expired Stock Return (Credit Note Claim)</option>
                  <option value="NEAR_EXPIRY_RETURN">Near-Expiry Threshold Pre-Return</option>
                  <option value="DAMAGED_BREAKAGE">Damaged / Broken Foil / Leakage</option>
                  <option value="BATCH_RECALL">Manufacturer Regulatory Batch Recall</option>
                  <option value="WRONG_ITEM_SUPPLIED">Wrong Item / Mis-shipment</option>
                </select>
              </div>
            </div>

            {/* Step 2: Eligible Batches from This Supplier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Select Batches to Return ({supplierEligibleBatches.length} Eligible Batches Detected)
                </label>
                <span className="text-[11px] text-slate-400">
                  Stock will be automatically deducted upon debit note generation
                </span>
              </div>

              {supplierEligibleBatches.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">No eligible expired or near-expiry batches found for this distributor</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Please choose a different distributor or verify your batch inventory.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase">
                        <th className="p-3 w-10 text-center">Select</th>
                        <th className="p-3">Medicine Brand & Salt</th>
                        <th className="p-3">Batch #</th>
                        <th className="p-3">Expiry</th>
                        <th className="p-3 text-right">Available</th>
                        <th className="p-3 text-right">Purchase Price</th>
                        <th className="p-3 w-32">Return Qty</th>
                        <th className="p-3 w-40">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierEligibleBatches.map(b => {
                        const batchId = b._id || b.id;
                        const available = b.status === 'QUARANTINED' ? (b.quarantineQuantity || 0) : b.quantityOnHand;
                        const itemState = selectedBatchesForClaim[batchId] || { selected: false, returnQty: available, reason: 'EXPIRED_STOCK' };

                        return (
                          <tr key={batchId} className={itemState.selected ? "bg-teal-50/40" : "hover:bg-slate-50"}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={!!itemState.selected}
                                onChange={(e) => {
                                  setSelectedBatchesForClaim(prev => ({
                                    ...prev,
                                    [batchId]: {
                                      ...itemState,
                                      selected: e.target.checked,
                                      returnQty: itemState.returnQty || available
                                    }
                                  }));
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{b.brandName}</div>
                              <div className="text-[10px] text-slate-400">{b.genericName}</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.daysUntilExpiry <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.expiryDate} ({b.daysUntilExpiry <= 0 ? 'Expired' : `${b.daysUntilExpiry}d left`})
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">{available} Units</td>
                            <td className="p-3 text-right font-semibold text-slate-700">₹{Number(b.purchasePrice || 0).toFixed(2)}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                max={available}
                                value={itemState.returnQty}
                                disabled={!itemState.selected}
                                onChange={(e) => {
                                  const val = Math.min(available, Math.max(1, Number(e.target.value)));
                                  setSelectedBatchesForClaim(prev => ({
                                    ...prev,
                                    [batchId]: {
                                      ...itemState,
                                      returnQty: val
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 disabled:bg-slate-100 text-center"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={itemState.reason}
                                disabled={!itemState.selected}
                                onChange={(e) => {
                                  setSelectedBatchesForClaim(prev => ({
                                    ...prev,
                                    [batchId]: {
                                      ...itemState,
                                      reason: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-900 disabled:bg-slate-100"
                              >
                                <option value="EXPIRED_STOCK">Expired Stock</option>
                                <option value="NEAR_EXPIRY_THRESHOLD">Near Expiry</option>
                                <option value="DAMAGED_FOIL_PACK">Damaged Packaging</option>
                                <option value="MANUFACTURER_RECALL">Batch Recall</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Step 3: Pharmacist Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pharmacist Verification Notes
              </label>
              <textarea
                value={claimPharmacistNotes}
                onChange={(e) => setClaimPharmacistNotes(e.target.value)}
                rows={2}
                placeholder="Remarks for distributor (e.g. Return chit per annual distributor return policy, verified seal integrity)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            {/* Financial Summary & Submit Button */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Selected Items:</span>
                  <div className="text-base font-black text-slate-900">{claimTotals.itemCount} Batch(es)</div>
                </div>
                <div className="h-8 w-px bg-teal-200" />
                <div>
                  <span className="text-slate-500 font-medium">Taxable Subtotal:</span>
                  <div className="text-base font-black text-slate-900">₹{claimTotals.subtotal.toFixed(2)}</div>
                </div>
                <div className="h-8 w-px bg-teal-200" />
                <div>
                  <span className="text-slate-500 font-medium">GST (12%):</span>
                  <div className="text-base font-black text-slate-900">₹{claimTotals.taxTotal.toFixed(2)}</div>
                </div>
                <div className="h-8 w-px bg-teal-200" />
                <div>
                  <span className="text-teal-900 font-extrabold uppercase text-[10px]">Total Claim Amount:</span>
                  <div className="text-xl font-black text-teal-800">₹{claimTotals.grandTotal.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatchesForClaim({});
                    setActiveTab('TRIAGE');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim || claimTotals.itemCount === 0}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex-1 sm:flex-none"
                >
                  <Printer className="w-4 h-4" />
                  <span>{submittingClaim ? 'Generating...' : 'Generate & Dispatch Debit Note'}</span>
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STATUTORY DESTRUCTION REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'DISPOSALS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bio-Medical Expired Drug Destruction Register</h3>
                <p className="text-[11px] text-slate-500">
                  Schedule M & Pollution Control Board compliance log for safe disposal of non-returnable medicines.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDisposalModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Destruction</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Disposal #</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Medicine & Batch</th>
                    <th className="px-4 py-3.5 text-center">Quantity Disposed</th>
                    <th className="px-4 py-3.5 text-right">Written-Off Loss</th>
                    <th className="px-4 py-3.5">Disposal Method & Agency</th>
                    <th className="px-4 py-3.5">Witnessing Pharmacist</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {disposalLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <Flame className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Disposals Recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Use "Record New Destruction" to document certified bio-medical disposal.</p>
                      </td>
                    </tr>
                  ) : (
                    disposalLogs.map(log => (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {log.disposalNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {new Date(log.disposalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{log.brandName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Batch: {log.batchNumber} • Exp: {log.expiryDate}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-rose-700">
                          {log.quantityDisposed} Units
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ₹{Number(log.totalLoss || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{log.method?.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-slate-400">{log.agencyName} ({log.agencyCertificateNumber || 'Cert: BMW-WB'})</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {log.witnessedBy}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Destroyed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMAL PRINTABLE GST DEBIT NOTE (CHIT) */}
      {/* ========================================================================= */}
      {selectedDebitNoteForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedDebitNoteForView.debitNoteNumber}
                </span>
                <span className="text-xs font-bold text-slate-500">Supplier Debit Note (Claim Chit)</span>
              </div>
              <button 
                onClick={() => setSelectedDebitNoteForView(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Box */}
            <div id="printable-debit-note" className="my-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs space-y-4">
              
              {/* Document Header */}
              <div className="text-center pb-3 border-b border-slate-300">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">ApexCare Retail Pharmacy & Chemists</h2>
                <p className="text-[11px] text-slate-500 font-medium">124 Bepin Behari Ganguly Street, Bowbazar, Kolkata - 700012</p>
                <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-600 mt-1">
                  <span>DL No: <strong>Form 20B/21B-WB-19284</strong></span>
                  <span>GSTIN: <strong>19AABCU9603R1ZM</strong></span>
                  <span>State: <strong>West Bengal (19)</strong></span>
                </div>
                <div className="mt-2 text-xs font-extrabold uppercase tracking-wider text-teal-900 bg-teal-100/60 inline-block px-3 py-0.5 rounded">
                  DEBIT NOTE / SUPPLIER RETURN VOUCHER (SEC 34 CGST ACT)
                </div>
              </div>

              {/* Meta Columns */}
              <div className="grid grid-cols-2 gap-4 text-[11px] pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Distributor / Consignee:</span>
                  <div className="font-bold text-slate-900 text-xs">{selectedDebitNoteForView.supplierName}</div>
                  <div>DL No: {selectedDebitNoteForView.supplierDlNumber || 'Form 20B/21B Wholesale'}</div>
                  <div>GSTIN: {selectedDebitNoteForView.supplierGstin || 'Unregistered'}</div>
                </div>
                <div className="text-right">
                  <div>Debit Note #: <strong>{selectedDebitNoteForView.debitNoteNumber}</strong></div>
                  <div>Date: <strong>{new Date(selectedDebitNoteForView.debitNoteDate).toLocaleDateString('en-IN')}</strong></div>
                  <div>Return Nature: <strong>{selectedDebitNoteForView.returnType?.replace(/_/g, ' ')}</strong></div>
                  <div>Status: <strong className="text-teal-800 uppercase">{selectedDebitNoteForView.status}</strong></div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 font-extrabold text-slate-700">
                    <th className="py-1.5">SL</th>
                    <th className="py-1.5">Medicine Description</th>
                    <th className="py-1.5">Batch</th>
                    <th className="py-1.5">Exp</th>
                    <th className="py-1.5 text-right">Qty</th>
                    <th className="py-1.5 text-right">Rate</th>
                    <th className="py-1.5 text-right">Taxable</th>
                    <th className="py-1.5 text-right">GST (12%)</th>
                    <th className="py-1.5 text-right">Total Claim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDebitNoteForView.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 text-slate-400">{idx + 1}</td>
                      <td className="py-1.5">
                        <div className="font-bold text-slate-900">{it.brandName}</div>
                        <div className="text-[10px] text-slate-400">{it.reason}</div>
                      </td>
                      <td className="py-1.5 font-mono">{it.batchNumber}</td>
                      <td className="py-1.5">{it.expiryDate}</td>
                      <td className="py-1.5 text-right font-bold">{it.quantityReturned}</td>
                      <td className="py-1.5 text-right">₹{Number(it.unitPurchasePrice || 0).toFixed(2)}</td>
                      <td className="py-1.5 text-right">₹{Number(it.taxableAmount || 0).toFixed(2)}</td>
                      <td className="py-1.5 text-right">₹{Number(it.gstAmount || 0).toFixed(2)}</td>
                      <td className="py-1.5 text-right font-bold text-slate-900">₹{Number(it.totalClaimAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 font-normal">
                    {selectedDebitNoteForView.pharmacistNotes || 'Goods returned for credit note adjustment against ongoing procurement.'}
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <div>Subtotal (Taxable): ₹{Number(selectedDebitNoteForView.subtotal || 0).toFixed(2)}</div>
                  <div>Tax (GST 12%): ₹{Number(selectedDebitNoteForView.taxTotal || 0).toFixed(2)}</div>
                  <div className="text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    Grand Total Claim: ₹{Number(selectedDebitNoteForView.grandTotal || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-dashed border-slate-300 pt-1">
                  <strong>For ApexCare Retail Pharmacy</strong>
                  <p>Authorized Pharmacist Signature (WB-48291)</p>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1">
                  <strong>Distributor Receiving Acknowledgment</strong>
                  <p>Receiver Signature & Stamp</p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDebitNoteForView(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  toast.success('Printing Debit Note Claim Chit...');
                }}
                style={{ backgroundColor: effectivePrimary }}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:brightness-105"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEBIT NOTE SETTLEMENT MODAL */}
      {/* ========================================================================= */}
      {selectedDebitNoteForSettle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Settle Supplier Debit Note</h3>
                <p className="text-[11px] text-slate-400">Claim #{selectedDebitNoteForSettle.debitNoteNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedDebitNoteForSettle(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleClaimSubmit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Nature / Mode *
                </label>
                <select
                  value={settlementType}
                  onChange={(e) => setSettlementType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                >
                  <option value="ADJUSTED_AGAINST_GRN">Offset Against Unpaid GRN Purchase Invoice</option>
                  <option value="REFUND_RECEIVED">Direct Refund (Bank Transfer / Cheque)</option>
                  <option value="REPLACED_WITH_FRESH_STOCK">Fresh Replacement Stock Inwarded</option>
                  <option value="WRITTEN_OFF">Approved Write-Off / Bad Debt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Distributor Credit Note (CN) Reference *
                </label>
                <input
                  type="text"
                  required
                  value={settlementCnNumber}
                  onChange={(e) => setSettlementCnNumber(e.target.value)}
                  placeholder="e.g. BDH-CN-2026-9901"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settled Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder={selectedDebitNoteForSettle.grandTotal.toString()}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Remarks
                </label>
                <textarea
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Acknowledged and credited by distributor accounts ledger..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebitNoteForSettle(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSettlement}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:brightness-105"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingSettlement ? 'Settling...' : 'Confirm Settlement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CERTIFIED DISPOSAL / DESTRUCTION MODAL */}
      {/* ========================================================================= */}
      {showDisposalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Certified Bio-Medical Disposal</h3>
                  <p className="text-[11px] text-slate-400">Schedule M Statutory Destruction Register</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDisposalModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDisposalSubmit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Batch to Destroy *
                </label>
                <select
                  value={disposalBatchId}
                  onChange={(e) => {
                    setDisposalBatchId(e.target.value);
                    const b = batches.find(item => (item._id || item.id) === e.target.value);
                    if (b) setDisposalQty(b.activeUnits);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map(b => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.brandName} (Batch: {b.batchNumber} • Exp: {b.expiryDate} • Stock: {b.activeUnits} Units)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity Disposed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={disposalQty}
                    onChange={(e) => setDisposalQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disposal Method *
                  </label>
                  <select
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    <option value="INCINERATION_BIOMEDICAL_AGENCY">High-Temp Incineration</option>
                    <option value="CHEMICAL_DENATURATION">Chemical Denaturation</option>
                    <option value="CRUSHING_AND_LANDFILL_SECURE">Encapsulation & Secure Landfill</option>
                    <option value="DRAIN_NEUTRALIZATION_AUTHORIZED">Authorized Sewer Neutralization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Bio-Waste Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={disposalAgency}
                  onChange={(e) => setDisposalAgency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agency Certificate / Manifest Ref #
                </label>
                <input
                  type="text"
                  value={disposalCertNo}
                  onChange={(e) => setDisposalCertNo(e.target.value)}
                  placeholder="e.g. BMW-WB-2026-9018"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destruction Reason & Remarks
                </label>
                <textarea
                  value={disposalRemarks}
                  onChange={(e) => setDisposalRemarks(e.target.value)}
                  rows={2}
                  placeholder="e.g. Broken glass vials and degraded crystallization. Safely packed in bio-hazard container."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisposalModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDisposal}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  <span>{submittingDisposal ? 'Logging...' : 'Sign & Record Disposal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
