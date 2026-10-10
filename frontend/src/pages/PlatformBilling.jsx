import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CreditCard, AlertTriangle, FileText, CheckCircle, Upload, 
  Clock, ShieldCheck, Sparkles, Building2, CheckCircle2, 
  ArrowRight, RefreshCw, Eye, Printer, Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PlatformBilling() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionReference: ''
  });

  // View Receipt Modal
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [subRes, invRes, plansRes] = await Promise.all([
        api.get('/billing/my-subscriptions'),
        api.get('/billing/my-invoices'),
        api.get('/billing/available-plans')
      ]);
      setSubscriptions(subRes.data.data?.subscriptions || []);
      setInvoices(invRes.data.data?.invoices || []);
      setAvailablePlans(plansRes.data.data?.plans || []);
    } catch (error) {
      console.warn("Billing endpoints loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitPaymentProof = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post('/billing/submit-payment', {
        invoiceId: selectedInvoice._id,
        subscriptionId: selectedInvoice.subscriptionId,
        amount: Number(paymentData.amount) || selectedInvoice.dueAmount,
        paymentMethod: paymentData.paymentMethod,
        transactionReference: paymentData.transactionReference
      });
      toast.success('Payment proof submitted successfully! Superadmin will verify shortly.');
      setIsPayModalOpen(false);
      setPaymentData({ amount: '', paymentMethod: 'UPI', transactionReference: '' });
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to submit payment proof');
    }
  };

  const handleUpgrade = async (planId, billingCycle) => {
    try {
      await api.post('/billing/upgrade-plan', { planId, billingCycle });
      toast.success('Upgrade requested! An invoice has been generated for your new plan.');
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to request plan upgrade');
    }
  };

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentData({
      amount: String(inv.dueAmount || inv.total),
      paymentMethod: 'UPI',
      transactionReference: ''
    });
    setIsPayModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'PAID': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid', icon: CheckCircle2 },
      'ISSUED': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Payment', icon: Clock },
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Payment', icon: Clock },
      'PARTIALLY_PAID': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Partially Paid', icon: Clock },
      'OVERDUE': { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Overdue', icon: AlertTriangle },
    };
    const s = map[status] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status, icon: Clock };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Subscription & Billing</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Manage your ApexBuild OS license, custom negotiated terms, setup fees, and invoices
            </p>
          </div>
        </div>

        <button 
          onClick={fetchBillingData} 
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Warnings & Alerts */}
      {subscriptions.some(sub => sub.status === 'RESTRICTED' || sub.status === 'PAYMENT_DUE') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
          <AlertTriangle className="text-amber-600 shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Action Required: Payment Pending</h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              Your OS subscription invoice is pending settlement. Please submit your transaction proof below to keep uninterrupted workspace access.
            </p>
          </div>
        </div>
      )}

      {/* Subscriptions Card Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Active Operating System Licenses
        </h2>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map(sub => {
              const isCustomAgreed = sub.discount > 0 || (sub.customPrice && sub.customPrice !== sub.basePrice);
              return (
                <div 
                  key={sub._id} 
                  className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-lg text-slate-900">
                          {sub.osProductId?.name || user?.organizationId?.businessType?.replace('_', ' ') || 'ApexBuild OS'}
                        </h3>
                        {isCustomAgreed && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Custom Contract
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">
                        Plan: {sub.osPlanId?.name || 'Standard'} • <span className="capitalize">{sub.billingCycle} billing</span>
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      sub.status === 'RESTRICTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {/* Pricing Details */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mb-4 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Standard Base Rate:</span>
                      <span className="line-through">₹{sub.basePrice?.toFixed(2)}</span>
                    </div>

                    {sub.customPrice && sub.customPrice !== sub.basePrice && (
                      <div className="flex justify-between items-center text-indigo-700 font-bold">
                        <span>Agreed Custom Price:</span>
                        <span>₹{sub.customPrice?.toFixed(2)}</span>
                      </div>
                    )}

                    {sub.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-bold">
                        <span>Superadmin Special Discount:</span>
                        <span>-₹{sub.discount?.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Net Recurring Rate:</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{sub.finalAmount?.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500">/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-[11px] text-slate-400">Next Renewal Date</span>
                      <span className="font-bold text-slate-800">
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] text-slate-400">Workspace Tenant</span>
                      <span className="font-semibold text-slate-700">{user?.organizationId?.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-slate-700">Workspace Under Provisioning</p>
            <p className="text-xs text-slate-400 mt-1">Superadmin assigns your customized OS tier upon verification.</p>
          </div>
        )}
      </div>

      {/* Available Upgrades Section */}
      {availablePlans.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600"/> Available OS Plans for your Business
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Scale your features, user seats, and cloud storage anytime</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map(plan => (
              <div 
                key={plan._id} 
                className="border border-slate-200 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50/50 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{plan.description || 'Full feature vertical suite'}</p>

                  <div className="space-y-1 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">₹{plan.monthlyPrice}</span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600">
                      or ₹{plan.yearlyPrice}/yr (Save ~20%)
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpgrade(plan._id, 'monthly')} 
                    className="flex-1 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Switch Monthly
                  </button>
                  <button 
                    onClick={() => handleUpgrade(plan._id, 'yearly')} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    Switch Yearly
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices & Fee Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600"/> Invoices & Implementation Setup Fees
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">View itemized receipts, setup charges, and submit offline payment proofs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Billing Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      inv.type === 'IMPLEMENTATION'
                        ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {inv.type === 'IMPLEMENTATION' ? 'One-Time Setup Fee' : 'OS Subscription'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900">₹{inv.total?.toFixed(2)}</div>
                    {inv.dueAmount > 0 && inv.dueAmount < inv.total && (
                      <div className="text-xs text-amber-600 font-medium">Due: ₹{inv.dueAmount.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewInvoice(inv)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" /> Receipt
                      </button>

                      {inv.status !== 'PAID' ? (
                        <button 
                          onClick={() => openPayModal(inv)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Submit Proof
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Settled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No invoices issued for your account yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW RECEIPT MODAL                                              */}
      {/* ========================================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Invoice {viewInvoice.invoiceNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="font-bold text-indigo-600 text-sm">ApexBuild Software Ltd</div>
                  <div className="text-slate-400">GSTIN: 27AABCA1234F1Z5</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{viewInvoice.invoiceNumber}</div>
                  <div className="text-slate-400">Due: {new Date(viewInvoice.dueDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="space-y-2">
                {viewInvoice.subscriptionFee > 0 && (
                  <div className="flex justify-between">
                    <span>OS Platform Subscription Fee</span>
                    <span className="font-bold">₹{viewInvoice.subscriptionFee?.toFixed(2)}</span>
                  </div>
                )}
                {viewInvoice.implementationFee > 0 && (
                  <div className="flex justify-between">
                    <span>One-Time Onboarding & Implementation</span>
                    <span className="font-bold">₹{viewInvoice.implementationFee?.toFixed(2)}</span>
                  </div>
                )}
                {viewInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Contract Discount</span>
                    <span>-₹{viewInvoice.discount?.toFixed(2)}</span>
                  </div>
                )}
                {viewInvoice.tax > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18%)</span>
                    <span>₹{viewInvoice.tax?.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span className="font-mono text-indigo-600">₹{viewInvoice.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setViewInvoice(null)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUBMIT PAYMENT PROOF MODAL                                      */}
      {/* ========================================================================= */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Submit Payment Confirmation
              </h2>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={submitPaymentProof} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <strong className="text-indigo-600 font-mono">{selectedInvoice.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Due:</span>
                  <strong className="text-slate-900 text-sm">₹{selectedInvoice.dueAmount || selectedInvoice.total}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Amount Paid (₹) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={paymentData.amount}
                  onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={paymentData.paymentMethod}
                  onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS / Wire)</option>
                  <option value="CARD">Corporate Credit / Debit Card</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. UPI Ref # 321876451299 or Bank UTR"
                  value={paymentData.transactionReference}
                  onChange={e => setPaymentData({...paymentData, transactionReference: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm">
                  Submit Verification Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
