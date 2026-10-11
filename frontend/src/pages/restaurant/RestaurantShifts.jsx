import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Coins, Plus, Search, Filter, Printer, Clock, 
  CheckCircle2, AlertTriangle, Sparkles, Store, 
  ArrowDownToLine, Banknote, QrCode, CreditCard, 
  ChevronRight, X, RefreshCw, Lock, Unlock, ArrowDownRight, 
  ShieldCheck, AlertCircle, FileText, Check, Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantShifts() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [liveSales, setLiveSales] = useState(null);
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState({
    closedCount: 0,
    totalCashHandled: 0,
    totalDrops: 0,
    totalVariance: 0
  });

  // Modals state
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [selectedShiftForSlip, setSelectedShiftForSlip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Open Shift Form
  const [openShiftForm, setOpenShiftForm] = useState({
    registerNumber: 'Register #1',
    openingFloat: 5000,
    notes: ''
  });

  // Cash Drop Form
  const [dropForm, setDropForm] = useState({
    amount: '',
    reason: 'Mid-shift safe drop'
  });

  // Close Shift Form
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [denominations, setDenominations] = useState({
    d500: '',
    d200: '',
    d100: '',
    d50: '',
    d20: '',
    d10: '',
    coins: ''
  });

  // Load shift data
  const loadShiftData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [curRes, histRes] = await Promise.all([
        api.get('/restaurant/shifts/current'),
        api.get('/restaurant/shifts')
      ]);

      if (curRes.data?.data) {
        setCurrentShift(curRes.data.data.currentShift);
        setLiveSales(curRes.data.data.liveSalesSummary);
      }

      if (histRes.data?.data) {
        setShiftsHistory(histRes.data.data.shifts || []);
        if (histRes.data.data.summary) {
          setHistorySummary(histRes.data.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load shift records:', err);
      toast.error('Unable to fetch shift & cash drawer data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShiftData();
    // Poll every 20s to sync live cash collections with Touch POS settlements
    const interval = setInterval(() => {
      loadShiftData(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [loadShiftData]);

  // Handle denomination changes for quick counting
  const handleDenominationChange = (denom, val) => {
    const nextVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    const updated = { ...denominations, [denom]: nextVal };
    setDenominations(updated);

    // Sum total
    const total = 
      ((Number(updated.d500) || 0) * 500) +
      ((Number(updated.d200) || 0) * 200) +
      ((Number(updated.d100) || 0) * 100) +
      ((Number(updated.d50) || 0) * 50) +
      ((Number(updated.d20) || 0) * 20) +
      ((Number(updated.d10) || 0) * 10) +
      (Number(updated.coins) || 0);

    setCountedCash(total > 0 ? total : '');
  };

  // Open Shift Action
  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (openShiftForm.openingFloat === '' || Number(openShiftForm.openingFloat) < 0) {
      toast.error('Valid opening float is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/restaurant/shifts/open', {
        ...openShiftForm,
        openingFloat: Number(openShiftForm.openingFloat)
      });

      toast.success(res.data?.message || 'Shift opened successfully!');
      setIsOpenShiftModalOpen(false);
      loadShiftData(true);
    } catch (err) {
      console.error('Failed to open shift:', err);
      toast.error(err.response?.data?.message || 'Error opening shift');
    } finally {
      setSubmitting(false);
    }
  };

  // Record Cash Drop Action
  const handleRecordDrop = async (e) => {
    e.preventDefault();
    if (!dropForm.amount || Number(dropForm.amount) <= 0) {
      toast.error('Enter a valid cash drop amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/restaurant/shifts/${currentShift._id}/drop`, {
        amount: Number(dropForm.amount),
        reason: dropForm.reason.trim() || 'Safe drop'
      });

      toast.success(res.data?.message || 'Cash drop recorded!');
      setIsDropModalOpen(false);
      setDropForm({ amount: '', reason: 'Mid-shift safe drop' });
      loadShiftData(true);
    } catch (err) {
      console.error('Failed to record cash drop:', err);
      toast.error(err.response?.data?.message || 'Error recording cash drop');
    } finally {
      setSubmitting(false);
    }
  };

  // Close Shift Action
  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (countedCash === '' || isNaN(Number(countedCash)) || Number(countedCash) < 0) {
      toast.error('Please enter physical cash counted in drawer');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/restaurant/shifts/${currentShift._id}/close`, {
        countedCash: Number(countedCash),
        notes: closeNotes.trim()
      });

      toast.success(res.data?.message || 'Shift closed and balanced!');
      setIsCloseShiftModalOpen(false);
      setCountedCash('');
      setCloseNotes('');
      setDenominations({ d500: '', d200: '', d100: '', d50: '', d20: '', d10: '', coins: '' });
      loadShiftData(true);
    } catch (err) {
      console.error('Failed to close shift:', err);
      toast.error(err.response?.data?.message || 'Error closing shift');
    } finally {
      setSubmitting(false);
    }
  };

  // Current expected in drawer
  const expectedInDrawer = currentShift?.expectedCash ?? 0;
  const countedNum = Number(countedCash) || 0;
  const liveVariance = countedCash !== '' ? countedNum - expectedInDrawer : 0;

  // Print slip
  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: effectivePrimary }}
            >
              Cash Control
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Blind Drops & Variance Auditing
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cashier Shift & Drawer Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Register opening floats, mid-shift safe drops, and end-of-shift cash drawer variance balancing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          {currentShift ? (
            <>
              <button
                onClick={() => setIsDropModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-amber-700" />
                Drop to Safe
              </button>

              <button
                onClick={() => setIsCloseShiftModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Close Shift
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: effectivePrimary }}
            >
              <Unlock className="w-3.5 h-3.5" />
              Open New Shift
            </button>
          )}

          <button
            onClick={() => loadShiftData(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
            title="Refresh Shift Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ACTIVE SHIFT HERO CARD (OR EMPTY PROMPT) */}
      {currentShift ? (
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 text-white border border-stone-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Shift Open
                </span>
                <span className="text-stone-400 text-xs font-medium">
                  {currentShift.registerNumber} • Cashier: {currentShift.cashierName}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Current Register Drawer Status
              </h2>
              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Opened at {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(currentShift.openedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Expected in Drawer Highlight */}
            <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700/80 text-right min-w-[220px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Calculated Drawer Balance
              </span>
              <p className="text-3xl font-black text-white mt-1">
                ₹{currentShift.expectedCash.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] font-semibold text-orange-400 mt-0.5 block">
                Float (₹{currentShift.openingFloat}) + Cash (₹{currentShift.cashSales}) - Drops (₹{currentShift.cashDrops})
              </span>
            </div>
          </div>

          {/* Breakdown Mini Cards */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            
            <div className="bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Opening Float</span>
              <p className="text-lg font-black text-white mt-1">₹{currentShift.openingFloat}</p>
              <span className="text-[10px] text-stone-500">Starting cash balance</span>
            </div>

            <div className="bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Cash Sales</span>
              <p className="text-lg font-black text-emerald-400 mt-1">₹{currentShift.cashSales}</p>
              <span className="text-[10px] text-stone-500">Settled cash tickets</span>
            </div>

            <div className="bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Safe Cash Drops</span>
              <p className="text-lg font-black text-amber-400 mt-1">₹{currentShift.cashDrops || 0}</p>
              <span className="text-[10px] text-stone-500">{currentShift.drops?.length || 0} transfer logs</span>
            </div>

            <div className="bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Digital Volume</span>
              <p className="text-lg font-black text-blue-400 mt-1">₹{(currentShift.upiSales || 0) + (currentShift.cardSales || 0)}</p>
              <span className="text-[10px] text-stone-500">UPI + Card settlements</span>
            </div>

          </div>

          {/* Active Shift Mid-Drops Log */}
          {currentShift.drops && currentShift.drops.length > 0 && (
            <div className="relative z-10 mt-6 pt-4 border-t border-stone-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Shift Safe Drop Log ({currentShift.drops.length} Drops)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentShift.drops.map((drop, idx) => (
                  <div key={idx} className="bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">₹{drop.amount}</span>
                      <span className="text-[10px] text-stone-400">{drop.reason}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {new Date(drop.droppedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Empty State Prompt: Open Shift */
        <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-3xl p-8 text-center shadow-xs">
          <Store className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-black text-amber-950">No Cashier Shift Currently Active</h2>
          <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
            Open a register shift with a starting float to begin taking orders, logging drawer cash, and tracking blind drop variances.
          </p>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Unlock className="w-4 h-4" />
            Open Shift (₹5,000 Float)
          </button>
        </div>
      )}

      {/* HISTORICAL SHIFTS LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historical Shift Audit Ledger</h3>
            <p className="text-[10px] text-slate-400">Reconciled shift drawer sessions and cash drop variances</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            {shiftsHistory.length} Recorded Shifts
          </span>
        </div>

        {/* Shifts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                <th className="py-3 px-4">Register / Cashier</th>
                <th className="py-3 px-3">Opened & Closed</th>
                <th className="py-3 px-3">Opening Float</th>
                <th className="py-3 px-3">Cash Sales</th>
                <th className="py-3 px-3">Safe Drops</th>
                <th className="py-3 px-3">Expected Cash</th>
                <th className="py-3 px-3">Counted Cash</th>
                <th className="py-3 px-3">Variance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shiftsHistory.map((s) => {
                const isClosed = s.status === 'CLOSED';
                const hasVariance = s.variance !== undefined && s.variance !== 0;
                const isShortage = s.variance < 0;

                return (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Register & Cashier */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.registerNumber}</span>
                      <span className="text-[10px] text-slate-400">{s.cashierName}</span>
                    </td>

                    {/* Opened & Closed */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {new Date(s.openedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isClosed 
                          ? `Closed: ${new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                          : '🔴 Active currently'}
                      </span>
                    </td>

                    {/* Float */}
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      ₹{s.openingFloat}
                    </td>

                    {/* Cash Sales */}
                    <td className="py-3 px-3 font-semibold text-emerald-600">
                      ₹{s.cashSales}
                    </td>

                    {/* Drops */}
                    <td className="py-3 px-3 font-semibold text-amber-700">
                      ₹{s.cashDrops || 0}
                    </td>

                    {/* Expected */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{s.expectedCash}
                    </td>

                    {/* Counted */}
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {isClosed ? `₹${s.countedCash}` : '--'}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-3">
                      {isClosed ? (
                        hasVariance ? (
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black ${
                            isShortage
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.variance > 0 ? `+₹${s.variance}` : `-₹${Math.abs(s.variance)}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            Balanced (₹0)
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Active Shift
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {isClosed && (
                        <button
                          onClick={() => setSelectedShiftForSlip(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="View Reconciliation Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: OPEN SHIFT MODAL */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">
                  Open Register Shift
                </h3>
              </div>
              <button 
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-3.5 mt-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Register Terminal
                </label>
                <input
                  type="text"
                  required
                  value={openShiftForm.registerNumber}
                  onChange={(e) => setOpenShiftForm({ ...openShiftForm, registerNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Opening Float Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={openShiftForm.openingFloat}
                  onChange={(e) => setOpenShiftForm({ ...openShiftForm, openingFloat: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-400">Cash placed into drawer for customer change</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Notes / Shift Handover
                </label>
                <input
                  type="text"
                  value={openShiftForm.notes}
                  onChange={(e) => setOpenShiftForm({ ...openShiftForm, notes: e.target.value })}
                  placeholder="e.g. Morning service opening"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? 'Opening...' : 'Open Shift'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CASH DROP TO SAFE */}
      {isDropModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Record Safe Cash Drop
                </h3>
              </div>
              <button 
                onClick={() => setIsDropModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordDrop} className="space-y-3.5 mt-4">
              <p className="text-xs text-slate-500">
                Transfer surplus cash from register drawer to back-office safe.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Drop Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dropForm.amount}
                  onChange={(e) => setDropForm({ ...dropForm, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Reason / Safe Reference
                </label>
                <input
                  type="text"
                  value={dropForm.reason}
                  onChange={(e) => setDropForm({ ...dropForm, reason: e.target.value })}
                  placeholder="Mid-shift safe transfer #1"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDropModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-md shadow-amber-500/20 hover:bg-amber-700 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Cash Drop'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: CLOSE SHIFT & RECONCILIATION */}
      {isCloseShiftModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">
                  Close Shift & Reconcile Drawer
                </h3>
              </div>
              <button 
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4 mt-4">
              
              {/* Expected vs Counted summary */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected in Drawer</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">₹{expectedInDrawer}</p>
                  <span className="text-[10px] text-slate-400">Float + Sales - Drops</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Variance</span>
                  {countedCash !== '' ? (
                    <p className={`text-xl font-black mt-0.5 ${
                      liveVariance === 0 
                        ? 'text-emerald-600' 
                        : liveVariance > 0 
                          ? 'text-emerald-600' 
                          : 'text-rose-600'
                    }`}>
                      {liveVariance > 0 ? `+₹${liveVariance}` : liveVariance < 0 ? `-₹${Math.abs(liveVariance)}` : '₹0 (Balanced)'}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-400 mt-1">Enter physical cash</p>
                  )}
                  <span className="text-[10px] text-slate-400">Counted - Expected</span>
                </div>
              </div>

              {/* Physical Cash Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Physical Cash Counted (₹) *</span>
                  <span className="text-[10px] text-orange-600 font-semibold cursor-pointer" onClick={() => setCountedCash(expectedInDrawer)}>
                    Auto-Fill Expected
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Total counted cash in drawer"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-black text-slate-900"
                />
              </div>

              {/* Quick Denomination Counter (Collapsible/Accordion) */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                    Currency Denominations Counter
                  </span>
                  <span className="text-[10px] text-slate-400">Optional breakdown</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">₹500 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.d500}
                      onChange={(e) => handleDenominationChange('d500', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">₹200 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.d200}
                      onChange={(e) => handleDenominationChange('d200', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">₹100 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.d100}
                      onChange={(e) => handleDenominationChange('d100', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Coins</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.coins}
                      onChange={(e) => handleDenominationChange('coins', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded-lg bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Close Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Reconciliation Notes / Variance Explanation
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. Balanced drawer or reason for shortage"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Reconciling...' : 'Confirm & Close Shift'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE RECONCILIATION SLIP */}
      {selectedShiftForSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                Shift Reconciliation Slip
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintSlip}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedShiftForSlip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thermal Slip Content */}
            <div className="font-mono text-xs text-slate-900 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-3 mt-4">
              
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="font-black text-sm uppercase">{user?.organizationId?.name || 'Restaurant Demo'}</h3>
                <p className="text-[10px] text-slate-500">SHIFT AUDIT REPORT</p>
                <p className="text-[9px] text-slate-500">{selectedShiftForSlip.registerNumber}</p>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-bold">{selectedShiftForSlip.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{new Date(selectedShiftForSlip.openedAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span>{new Date(selectedShiftForSlip.closedAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₹{selectedShiftForSlip.openingFloat}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Collections:</span>
                  <span>₹{selectedShiftForSlip.cashSales}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safe Cash Drops:</span>
                  <span>-₹{selectedShiftForSlip.cashDrops || 0}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                  <span>Expected in Drawer:</span>
                  <span>₹{selectedShiftForSlip.expectedCash}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900">
                  <span>Counted Cash:</span>
                  <span>₹{selectedShiftForSlip.countedCash}</span>
                </div>
                <div className="flex justify-between font-black pt-1 border-t border-dashed border-slate-300">
                  <span>Variance:</span>
                  <span className={selectedShiftForSlip.variance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {selectedShiftForSlip.variance >= 0 ? `+₹${selectedShiftForSlip.variance}` : `-₹${Math.abs(selectedShiftForSlip.variance)}`}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-slate-300 flex justify-between text-[9px] text-slate-500">
                <div className="text-center">
                  <div className="h-6" />
                  <p className="border-t border-slate-300 pt-0.5">Cashier Sign</p>
                </div>
                <div className="text-center">
                  <div className="h-6" />
                  <p className="border-t border-slate-300 pt-0.5">Manager Sign</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
