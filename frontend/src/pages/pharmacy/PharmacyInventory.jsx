import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Boxes, Search, Filter, AlertTriangle, ShieldCheck, 
  Ban, CheckCircle2, ChevronRight, Eye, Edit, SlidersHorizontal,
  Calendar, MapPin, IndianRupee, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyInventory() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SALEABLE, NEAR_EXPIRY, QUARANTINED
  const [selectedBatchForAdjustment, setSelectedBatchForAdjustment] = useState(null);
  const [adjustmentReason, setAdjustmentReason] = useState('PHYSICAL_COUNT_DISCREPANCY');
  const [adjustedQty, setAdjustedQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/pharmacy/inventory/batches');
      if (res.data?.data?.batches) {
        setBatches(res.data.data.batches);
      }
    } catch (err) {
      console.error('Failed to load batch inventory:', err);
      toast.error('Unable to fetch live batches from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchSearch = 
        b.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.rackLocation?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const currentStatus = b.computedStatus || b.status;
      if (statusFilter === 'SALEABLE') return currentStatus === 'SALEABLE';
      if (statusFilter === 'NEAR_EXPIRY') return currentStatus === 'NEAR_EXPIRY';
      if (statusFilter === 'QUARANTINED') return currentStatus === 'QUARANTINED';

      return true;
    });
  }, [batches, searchTerm, statusFilter]);

  const inventorySummary = useMemo(() => {
    let totalCost = 0;
    let totalMrp = 0;
    let totalUnits = 0;
    let quarantinedCount = 0;

    batches.forEach(b => {
      const activeUnits = (b.status === 'QUARANTINED' || b.computedStatus === 'QUARANTINED') 
        ? (b.quarantineQuantity || 0) 
        : (b.quantityOnHand || 0);
      
      totalUnits += activeUnits;
      totalCost += activeUnits * (b.purchasePrice || 0);
      totalMrp += activeUnits * (b.mrp || 0);
      if (b.status === 'QUARANTINED' || b.computedStatus === 'QUARANTINED') {
        quarantinedCount += activeUnits;
      }
    });

    return {
      totalCost,
      totalMrp,
      totalUnits,
      quarantinedCount,
      batchesCount: batches.length
    };
  }, [batches]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (adjustedQty === '' || isNaN(adjustedQty)) return;

    try {
      setIsSubmitting(true);
      const res = await api.post(`/pharmacy/inventory/batches/${selectedBatchForAdjustment._id || selectedBatchForAdjustment.id}/adjust`, {
        newQuantity: Number(adjustedQty),
        reason: adjustmentReason,
        notes: `Physical audit reconciliation`
      });

      if (res.data?.status === 'success') {
        toast.success(`Batch ${selectedBatchForAdjustment.batchNumber} stock count updated to ${adjustedQty}!`);
        setSelectedBatchForAdjustment(null);
        setAdjustedQty('');
        fetchBatches(true);
      }
    } catch (err) {
      console.error('Adjust stock error:', err);
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Live Sync Bar */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-2.5 flex items-center justify-between text-teal-900 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold px-1.5 py-0.5 rounded bg-teal-600 text-white text-[10px]">LIVE SYNC</span>
          <span>MongoDB Batch Ledger Active — Every batch is individually tracked with FEFO expiration sequencing and rack location.</span>
        </div>
        <button
          onClick={() => fetchBatches(true)}
          disabled={refreshing}
          className="flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Header & Total Valuation Summary Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batch Inventory Ledger</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                FEFO Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Every pharmaceutical unit is linked to an immutable manufacturer batch, manufacturing date, and expiry date.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Total Units:</span>{' '}
              <strong className="text-slate-900 font-extrabold">{inventorySummary.totalUnits}</strong>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-slate-400 font-medium">Quarantined:</span>{' '}
              <strong className="text-rose-700 font-extrabold">{inventorySummary.quarantinedCount} Units</strong>
            </div>
          </div>
        </div>

        {/* Valuation at Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Value (Purchase Cost)
          </span>
          <div className="my-2">
            <h3 className="text-2xl font-extrabold text-teal-950">
              ₹{inventorySummary.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Excludes input GST credit</p>
          </div>
          <span className="text-[10px] font-bold text-teal-700">Specific Identification Method</span>
        </div>

        {/* Valuation at MRP */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Value (MRP Retail)
          </span>
          <div className="my-2">
            <h3 className="text-2xl font-extrabold text-slate-900">
              ₹{inventorySummary.totalMrp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
              Est. Gross Margin ~{inventorySummary.totalMrp > 0 ? (((inventorySummary.totalMrp - inventorySummary.totalCost) / inventorySummary.totalMrp) * 100).toFixed(1) : '24.0'}%
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500">Retail Sales Potential</span>
        </div>

      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Medicine Name, Batch Number (AUG24018), or Rack Location (Rack A-02)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Batches' },
            { id: 'SALEABLE', label: 'Active Saleable' },
            { id: 'NEAR_EXPIRY', label: 'Near Expiry (Triage)' },
            { id: 'QUARANTINED', label: 'Quarantined / Expired' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Medicine & Mfr</th>
                <th className="px-4 py-3">Batch & Rack</th>
                <th className="px-4 py-3">Mfg / Expiry Date</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent mb-2"></div>
                    <p className="font-bold text-slate-600">Loading batch ledger from MongoDB...</p>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No batches match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(b => (
                  <tr key={b._id || b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{b.brandName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{b.genericName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 font-mono">{b.batchNumber}</span>
                      <p className="text-[10px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        {b.rackLocation}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{b.expiryDate}</span>
                      <p className={`text-[10px] font-semibold mt-0.5 ${b.daysUntilExpiry < 0 ? 'text-rose-600' : b.daysUntilExpiry <= 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {b.daysUntilExpiry < 0 ? 'EXPIRED' : `${b.daysUntilExpiry} days remaining`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {(b.computedStatus === 'QUARANTINED' || b.status === 'QUARANTINED') ? (
                        <span className="font-extrabold text-rose-700">
                          {b.quarantineQuantity || 0} Quarantined
                        </span>
                      ) : (
                        <span className="font-extrabold text-slate-900">
                          {b.quantityOnHand} Strips
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">
                      ₹{Number(b.purchasePrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      ₹{Number(b.mrp).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {(b.computedStatus === 'QUARANTINED' || b.status === 'QUARANTINED') ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          Quarantined
                        </span>
                      ) : (b.computedStatus === 'NEAR_EXPIRY' || b.status === 'NEAR_EXPIRY') ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          Near Expiry
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Saleable
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedBatchForAdjustment(b);
                          setAdjustedQty((b.quantityOnHand || 0).toString());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] shadow-2xs cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedBatchForAdjustment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Stock Count Adjustment</h3>
              <button 
                onClick={() => setSelectedBatchForAdjustment(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedBatchForAdjustment.brandName}</p>
              <p className="text-slate-500">Batch: <strong className="text-slate-800">{selectedBatchForAdjustment.batchNumber}</strong> • Exp: {selectedBatchForAdjustment.expiryDate}</p>
              <p className="text-slate-500">Current Ledger Stock: <strong className="text-teal-700 font-bold">{selectedBatchForAdjustment.quantityOnHand} Strips</strong></p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">New Verified Physical Count</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustedQty}
                  onChange={(e) => setAdjustedQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Audit Reason</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                >
                  <option value="PHYSICAL_COUNT_DISCREPANCY">Physical Count Discrepancy</option>
                  <option value="DAMAGED_AMPOULE_BREAKAGE">Physical Breakage / Damaged Strip</option>
                  <option value="EXPIRY_REMOVAL">Removed for Disposal</option>
                  <option value="SUPPLIER_SAMPLE">Authorized Sample / Staff Use</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBatchForAdjustment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-4 py-2 rounded-xl text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Post Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
