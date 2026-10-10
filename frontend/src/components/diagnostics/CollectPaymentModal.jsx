import React, { useState, useEffect } from 'react';
import { X, IndianRupee, CreditCard, QrCode, Banknote, Building2, CheckCircle2, AlertCircle, Percent } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PAYMENT_MODES = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode, color: 'text-purple-700 bg-purple-50 border-purple-300' },
  { id: 'Card', label: 'Card / POS', icon: CreditCard, color: 'text-blue-700 bg-blue-50 border-blue-300' },
  { id: 'Bank Transfer', label: 'Bank / NEFT', icon: Building2, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { id: 'Cheque', label: 'Cheque', icon: IndianRupee, color: 'text-slate-700 bg-slate-50 border-slate-300' }
];

const CollectPaymentModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [spotDiscount, setSpotDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const dueAmount = order ? (order.dueAmount ?? (order.totalAmount - order.paidAmount)) : 0;
  const totalAmount = order?.totalAmount ?? 0;
  const paidAmount = order?.paidAmount ?? 0;
  const patient = order?.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';

  useEffect(() => {
    if (order && dueAmount > 0) {
      setAmount(String(dueAmount));
      setPaymentMethod('Cash');
      setTransactionRef('');
      setSpotDiscount('');
      setNotes('');
    }
  }, [order, dueAmount]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payNum = Number(amount);
    if (isNaN(payNum) || payNum <= 0) {
      return toast.error('Please enter a valid payment amount greater than zero');
    }

    const discountNum = Number(spotDiscount) || 0;
    const netDue = Math.max(0, dueAmount - discountNum);

    if (payNum > netDue) {
      return toast.error(`Payment cannot exceed remaining due amount of ₹${netDue}`);
    }

    try {
      setLoading(true);
      const res = await api.post('/diagnostics/payments', {
        orderId: order._id,
        amount: payNum,
        paymentMethod,
        transactionReference: transactionRef,
        spotDiscount: discountNum,
        notes
      });

      toast.success(`Payment of ₹${payNum.toLocaleString('en-IN')} recorded successfully!`);
      const { receipt, order: updatedOrder } = res.data.data;
      if (onSuccess) {
        onSuccess(receipt, updatedOrder);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Collect Payment / Settle Due</h2>
              <p className="text-xs text-emerald-100">{order.orderId} • {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Order Financial Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Bill</span>
              <span className="text-base font-bold text-slate-800">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Already Paid</span>
              <span className="text-base font-bold text-emerald-600">₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Balance Due</span>
              <span className="text-base font-bold text-rose-600">₹{dueAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Quick Pay Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmount(String(dueAmount))}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                Number(amount) === dueAmount 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Full Due (₹{dueAmount})
            </button>
            {dueAmount > 200 && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(dueAmount / 2)))}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  Number(amount) === Math.round(dueAmount / 2) 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                50% (₹{Math.round(dueAmount / 2)})
              </button>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Payment Amount to Collect (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                min="1"
                max={dueAmount}
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-lg text-slate-900"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Payment Mode *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMethod === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMethod(mode.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected 
                        ? mode.color + ' ring-2 ring-emerald-500 font-bold shadow-2xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Transaction Reference */}
          {paymentMethod !== 'Cash' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {paymentMethod === 'UPI' && 'UPI UTR / Reference ID *'}
                {paymentMethod === 'Card' && 'Card Last 4 Digits / POS Auth Slip # *'}
                {paymentMethod === 'Bank Transfer' && 'IMPS / NEFT Ref Number *'}
                {paymentMethod === 'Cheque' && 'Cheque No & Bank Name *'}
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={
                  paymentMethod === 'UPI' ? 'e.g. 2026/89234109' :
                  paymentMethod === 'Card' ? 'e.g. VISA 4091 / AUTH-8902' :
                  paymentMethod === 'Cheque' ? 'e.g. CHQ-889102 (SBI)' :
                  'e.g. NEFT/HDFC/20269012'
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Spot Discount (Optional) */}
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Additional Spot Discount (Optional)
              </label>
              {Number(spotDiscount) > 0 && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  New Due: ₹{Math.max(0, dueAmount - Number(spotDiscount))}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max={dueAmount}
              value={spotDiscount}
              onChange={(e) => setSpotDiscount(e.target.value)}
              placeholder="₹ Discount given by cashier"
              className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cashier Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Counter dues cleared for report collection"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Number(amount) <= 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Collect & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectPaymentModal;
