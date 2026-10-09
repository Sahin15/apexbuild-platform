import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, AlertTriangle, FileText, CheckCircle, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PlatformBilling() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionReference: ''
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      // Create user endpoints to fetch their own org's subscriptions
      const [subRes, invRes, plansRes] = await Promise.all([
        api.get('/billing/my-subscriptions'),
        api.get('/billing/my-invoices'),
        api.get('/billing/available-plans')
      ]);
      setSubscriptions(subRes.data.data.subscriptions);
      setInvoices(invRes.data.data.invoices);
      setAvailablePlans(plansRes.data.data.plans || []);
    } catch (error) {
      // Graceful degradation if backend endpoints aren't fully ready
      console.warn("Billing endpoints not yet implemented for standard user");
    }
  };

  const submitPaymentProof = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/submit-payment', {
        invoiceId: selectedInvoice._id,
        subscriptionId: selectedInvoice.subscriptionId,
        ...paymentData
      });
      toast.success('Payment proof submitted successfully! Awaiting verification.');
      setIsModalOpen(false);
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to submit payment proof');
    }
  };

  const handleUpgrade = async (planId, billingCycle) => {
    try {
      await api.post('/billing/upgrade-plan', { planId, billingCycle });
      toast.success('Invoice generated for the new plan!');
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to request upgrade');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CreditCard className="text-indigo-600"/> Platform Subscription & Billing</h1>
        <p className="text-slate-500">Manage your ApexBuild OS subscriptions, view invoices, and submit payment proofs.</p>
      </div>

      {subscriptions.some(sub => sub.status === 'RESTRICTED' || sub.status === 'GRACE_PERIOD' || sub.status === 'PAYMENT_DUE') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4">
          <AlertTriangle className="text-amber-500 shrink-0 w-6 h-6" />
          <div>
            <h3 className="font-bold text-amber-800">Action Required: Payment Overdue</h3>
            <p className="text-amber-700 text-sm mt-1">
              One or more of your OS subscriptions are past due. Please submit your payment proof to prevent account restriction or suspension.
            </p>
          </div>
        </div>
      )}

      {subscriptions.some(sub => sub.status === 'RESTRICTED') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4">
          <AlertTriangle className="text-red-500 shrink-0 w-6 h-6" />
          <div>
            <h3 className="font-bold text-red-800">Account Restricted</h3>
            <p className="text-red-700 text-sm mt-1">
              Your access has been restricted due to non-payment. You can only access this billing page until payment is verified.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscriptions.length > 0 ? subscriptions.map(sub => (
          <div key={sub._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{sub.osProductId?.name || 'ApexBuild OS'}</h3>
                <p className="text-sm text-slate-500">{sub.osPlanId?.name || 'Standard Plan'} • {sub.billingCycle}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                sub.status === 'RESTRICTED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {sub.status}
              </span>
            </div>
            
            <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-4">
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-bold text-xl text-slate-800">₹{sub.finalAmount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Next Billing Date</p>
                <p className="font-medium text-slate-800">{new Date(sub.nextBillingDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-2 text-center text-slate-500">
            No active subscriptions found.
          </div>
        )}
      </div>

      {availablePlans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Available Plans for your OS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map(plan => (
              <div key={plan._id} className="border border-indigo-100 rounded-xl p-6 bg-gradient-to-b from-white to-indigo-50/50 hover:shadow-lg transition-all flex flex-col">
                <h3 className="font-bold text-xl text-indigo-900 mb-2">{plan.name}</h3>
                <div className="flex-1 space-y-4 mb-6">
                  <div>
                    <span className="text-3xl font-extrabold text-slate-800">₹{plan.monthlyPrice}</span>
                    <span className="text-slate-500 text-sm">/mo</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-700">₹{plan.yearlyPrice}</span>
                    <span className="text-slate-500 text-sm">/yr (Save 20%)</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleUpgrade(plan._id, 'monthly')} className="flex-1 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-bold py-2 rounded-lg text-sm transition-colors">
                    Monthly
                  </button>
                  <button onClick={() => handleUpgrade(plan._id, 'yearly')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-md shadow-indigo-600/20">
                    Yearly
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5"/> Invoices & Payment Proofs</h2>
        </div>
        <table className="w-full text-left whitespace-nowrap text-sm">
          <thead className="bg-white text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Invoice #</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length > 0 ? invoices.map(inv => (
              <tr key={inv._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 text-slate-600">{new Date(inv.issueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-slate-800">₹{inv.total}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {inv.status !== 'PAID' && (
                    <button 
                      onClick={() => { setSelectedInvoice(inv); setIsModalOpen(true); }}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      Submit Proof
                    </button>
                  )}
                  {inv.status === 'PAID' && <CheckCircle className="w-5 h-5 text-emerald-500 inline-block" />}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No invoices available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Submit Payment Proof</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={submitPaymentProof} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 text-sm">
                <span className="text-slate-500">Paying for Invoice: </span>
                <strong className="text-slate-800">{selectedInvoice.invoiceNumber}</strong>
                <span className="ml-4 text-slate-500">Amount Due: </span>
                <strong className="text-slate-800">₹{selectedInvoice.dueAmount}</strong>
              </div>

              <div>
                <label className="label">Amount Paid (₹) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="input" 
                  required 
                  value={paymentData.amount}
                  onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
                />
              </div>

              <div>
                <label className="label">Payment Method <span className="text-red-500">*</span></label>
                <select 
                  className="input" 
                  value={paymentData.paymentMethod}
                  onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="label">Transaction Reference Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="e.g. UPI Ref No or UTR"
                  value={paymentData.transactionReference}
                  onChange={e => setPaymentData({...paymentData, transactionReference: e.target.value})} 
                />
              </div>

              <div>
                <label className="label">Upload Proof (Screenshot/Receipt)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-indigo-600">Click to upload</span>
                  <span className="text-xs text-slate-500">PNG, JPG or PDF (max. 5MB)</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Verification</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
