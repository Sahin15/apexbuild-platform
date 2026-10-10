import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, AlertCircle, Printer, Banknote, QrCode, CreditCard, Building2, Coins, UserCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { printReceiptDirectly } from './reportUtils';

const DENOMINATIONS = [
  { value: 500, label: '₹500 Note', key: 'note500' },
  { value: 200, label: '₹200 Note', key: 'note200' },
  { value: 100, label: '₹100 Note', key: 'note100' },
  { value: 50, label: '₹50 Note', key: 'note50' },
  { value: 20, label: '₹20 Note', key: 'note20' },
  { value: 10, label: '₹10 Note', key: 'note10' }
];

const ShiftReconciliationModal = ({ isOpen, onClose, onShiftClosed, organization }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  
  // Denominations state
  const [counts, setCounts] = useState({
    note500: '',
    note200: '',
    note100: '',
    note50: '',
    note20: '',
    note10: '',
    coins: ''
  });

  const [handoverTo, setHandoverTo] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closedShiftResult, setClosedShiftResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchShiftSummary();
      setClosedShiftResult(null);
    }
  }, [isOpen]);

  const fetchShiftSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/payments/shift-summary');
      setShiftData(res.data.data);
    } catch (err) {
      toast.error('Failed to load shift summary');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeShift = shiftData?.activeShift;
  const summary = shiftData?.summary || {
    systemCash: 0,
    systemUPI: 0,
    systemCard: 0,
    systemBankTransfer: 0,
    systemTotal: 0,
    totalTransactions: 0
  };

  const openingFloat = activeShift?.openingCashFloat || 0;
  const expectedCashInDrawer = openingFloat + summary.systemCash;

  // Compute counted physical cash
  const countedNotesTotal = DENOMINATIONS.reduce((sum, d) => {
    const qty = parseInt(counts[d.key], 10) || 0;
    return sum + (qty * d.value);
  }, 0);
  const coinsTotal = parseFloat(counts.coins) || 0;
  const totalPhysicalCash = countedNotesTotal + coinsTotal;

  const variance = totalPhysicalCash - expectedCashInDrawer;

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!activeShift) {
      return toast.error('No active open shift found to close');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/diagnostics/payments/shift/close', {
        shiftId: activeShift._id,
        denominations: counts,
        physicalCashCounted: totalPhysicalCash,
        handoverTo,
        closingNotes
      });

      toast.success('Cashier shift closed and reconciled successfully!');
      setClosedShiftResult(res.data.data.shift);
      if (onShiftClosed) {
        onShiftClosed(res.data.data.shift);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintHandover = () => {
    printReceiptDirectly('shift-handover-slip', '80mm');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">End-of-Day (EOD) Shift Close & Drawer Reconciliation</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {activeShift?.shiftNumber || 'ACTIVE SHIFT'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cashier: {activeShift?.cashierName || 'Cash Desk Cashier'} • Started: {activeShift ? new Date(activeShift.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Now'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Computing real-time drawer ledger...</p>
            </div>
          ) : closedShiftResult ? (
            /* Shift Closed Confirmation & Print View */
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">Shift Successfully Closed & Handed Over!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Shift #{closedShiftResult.shiftNumber} has been officially locked and archived with variance of ₹{closedShiftResult.variance}.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handlePrintHandover}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>Print Shift Handover Report (80mm)</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Close Window
                  </button>
                </div>
              </div>

              {/* Printable Handover Slip (Hidden off-screen or rendered for print) */}
              <div className="flex justify-center pt-2">
                <div 
                  id="shift-handover-slip" 
                  className="bg-white border border-slate-300 p-4 font-mono text-xs text-black w-[80mm] shadow-md rounded"
                  style={{ boxSizing: 'border-box' }}
                >
                  <div className="text-center pb-2 border-b border-dashed border-gray-400">
                    <h3 className="font-bold text-sm uppercase">{organization?.name || 'APEX DIAGNOSTICS'}</h3>
                    <p className="text-[10px]">CASHIER SHIFT HANDOVER REPORT</p>
                    <p className="text-[11px] font-bold mt-1">Shift #: {closedShiftResult.shiftNumber}</p>
                    <p className="text-[10px] text-gray-600">{new Date().toLocaleString('en-IN')}</p>
                  </div>

                  <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-gray-400">
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span className="font-bold">{closedShiftResult.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Handover To:</span>
                      <span className="font-bold">{closedShiftResult.handoverTo || 'Next Shift'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Txn Count:</span>
                      <span>{closedShiftResult.totalTransactions}</span>
                    </div>
                  </div>

                  <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-gray-400">
                    <div className="flex justify-between">
                      <span>Opening Float:</span>
                      <span>₹{closedShiftResult.openingCashFloat}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>System Cash:</span>
                      <span>₹{closedShiftResult.systemCash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System UPI:</span>
                      <span>₹{closedShiftResult.systemUPI}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Card:</span>
                      <span>₹{closedShiftResult.systemCard}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                      <span>Total Revenue:</span>
                      <span>₹{closedShiftResult.systemTotal}</span>
                    </div>
                  </div>

                  <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-gray-400">
                    <div className="flex justify-between">
                      <span>Expected Drawer:</span>
                      <span>₹{(closedShiftResult.openingCashFloat || 0) + (closedShiftResult.systemCash || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Physical Cash:</span>
                      <span>₹{closedShiftResult.physicalCashCounted}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[12px] pt-1">
                      <span>Variance / Diff:</span>
                      <span>₹{closedShiftResult.variance}</span>
                    </div>
                  </div>

                  <div className="pt-4 text-center text-[10px] space-y-4">
                    <div className="flex justify-between pt-6 border-t border-gray-300 text-[10px]">
                      <span>Relieving Cashier</span>
                      <span>Verified Supervisor</span>
                    </div>
                    <p className="text-[9px] text-gray-500">ApexBuild Clinical OS • Shift Close Slip</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Reconciliation Form View */
            <form onSubmit={handleCloseShift} className="space-y-5">
              
              {/* Top System Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
                    <Banknote className="w-3.5 h-3.5 text-blue-600" />
                    Opening Float
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">₹{openingFloat.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">Starting change</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    Cash Collected
                  </div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">₹{summary.systemCash.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">Physical receipts</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                    UPI / QR
                  </div>
                  <div className="text-lg font-bold text-purple-600 mt-1">₹{summary.systemUPI.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">Direct bank credit</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Card Swipes
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-1">₹{summary.systemCard.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">EDC Terminal</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Total Shift Revenue
                  </div>
                  <div className="text-lg font-bold text-indigo-900 mt-1">₹{summary.systemTotal.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">{summary.totalTransactions} transactions</span>
                </div>
              </div>

              {/* Physical Cash Counting Calculator */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Physical Cash Denomination Count (In Drawer)
                    </h3>
                    <p className="text-xs text-slate-500">Count the physical currency notes and coins currently in your cash drawer.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Expected in Drawer:</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{expectedCashInDrawer.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Denomination Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DENOMINATIONS.map((d) => {
                    const countVal = counts[d.key];
                    const subtotal = (parseInt(countVal, 10) || 0) * d.value;
                    return (
                      <div key={d.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 shrink-0 w-20">{d.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">×</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={counts[d.key]}
                            onChange={(e) => setCounts({ ...counts, [d.key]: e.target.value })}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 font-mono shrink-0 w-16 text-right">
                          = ₹{subtotal}
                        </span>
                      </div>
                    );
                  })}

                  {/* Coins Input */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 shrink-0 w-20 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      Coins Total
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={counts.coins}
                        onChange={(e) => setCounts({ ...counts, coins: e.target.value })}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-right focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 font-mono shrink-0 w-16 text-right">
                      = ₹{coinsTotal}
                    </span>
                  </div>
                </div>

                {/* Reconciliation Comparison Bar */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3 ${
                  variance === 0 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : variance > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center gap-3">
                    {variance === 0 ? (
                      <div className="p-2 bg-emerald-600 text-white rounded-full">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : variance > 0 ? (
                      <div className="p-2 bg-amber-600 text-white rounded-full">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-rose-600 text-white rounded-full">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {variance === 0 && 'Drawer Perfectly Balanced (₹0.00 Mismatch)'}
                        {variance > 0 && `Cash Surplus Detected (+₹${variance.toLocaleString('en-IN')})`}
                        {variance < 0 && `Cash Shortage Detected (-₹${Math.abs(variance).toLocaleString('en-IN')})`}
                      </div>
                      <p className="text-xs opacity-80">
                        Total Physical Cash Counted: <strong>₹{totalPhysicalCash.toLocaleString('en-IN')}</strong> vs Expected: <strong>₹{expectedCashInDrawer.toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider block font-semibold">Net Discrepancy</span>
                    <span className="text-xl font-black font-mono">
                      {variance >= 0 ? `+₹${variance}` : `-₹${Math.abs(variance)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Handing Over Drawer Cash To (Staff / Reliever Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    placeholder="e.g. Rahul Sen (Evening Cashier) / Dr. Sen"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shift Closing Remarks / Discrepancy Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="e.g. Shift balanced, all receipts matched with drawer float"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>{submitting ? 'Reconciling...' : 'Confirm Reconciliation & Close Shift'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftReconciliationModal;
