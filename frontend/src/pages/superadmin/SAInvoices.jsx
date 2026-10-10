import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Receipt, FileText, Plus, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, XCircle, Search, Filter, Eye, Printer, Download, Building2
} from 'lucide-react';

export default function SAInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Generate Invoice Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    organizationId: '', 
    type: 'IMPLEMENTATION', 
    subscriptionFee: '', 
    implementationFee: '',
    discount: '',
    tax: '',
    notes: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // View / Print Invoice Modal
  const [viewInvoice, setViewInvoice] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, accRes] = await Promise.all([
        api.get('/platform/invoices'),
        api.get('/platform/business-accounts')
      ]);
      setInvoices(invRes.data.data || []);
      setAccounts(accRes.data.data?.accounts || []);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.organizationId) {
      return toast.error("Please select a tenant business account");
    }
    try {
      const subFee = Number(formData.subscriptionFee) || 0;
      const implFee = Number(formData.implementationFee) || 0;
      const disc = Number(formData.discount) || 0;
      const subtotal = subFee + implFee;
      const tax = formData.tax !== '' ? Number(formData.tax) : (subtotal * 0.18);

      const payload = {
        organizationId: formData.organizationId,
        type: formData.type,
        subscriptionFee: subFee,
        implementationFee: implFee,
        discount: disc,
        tax,
        notes: formData.notes,
        dueDate: formData.dueDate
      };

      await api.post('/platform/invoices', payload);
      toast.success('Invoice generated successfully!');
      setIsModalOpen(false);
      setFormData({ 
        organizationId: '', 
        type: 'IMPLEMENTATION', 
        subscriptionFee: '', 
        implementationFee: '',
        discount: '',
        tax: '',
        notes: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/platform/invoices/${id}/status`, { status: newStatus });
      toast.success(`Invoice status updated to ${newStatus}`);
      fetchData();
      if (viewInvoice && viewInvoice._id === id) {
        setViewInvoice(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.organizationId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.organizationId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const map = {
      'PAID': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid', icon: CheckCircle2 },
      'PARTIALLY_PAID': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Partial', icon: Clock },
      'ISSUED': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Issued (Pending)', icon: Clock },
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending', icon: Clock },
      'OVERDUE': { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Overdue', icon: AlertTriangle },
      'CANCELLED': { bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Cancelled', icon: XCircle },
    };
    const s = map[status] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status, icon: Receipt };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  // Live calculation for create invoice modal
  const modalSubFee = Number(formData.subscriptionFee) || 0;
  const modalImplFee = Number(formData.implementationFee) || 0;
  const modalDiscount = Number(formData.discount) || 0;
  const modalSubtotal = modalSubFee + modalImplFee;
  const modalTax = formData.tax !== '' ? Number(formData.tax) : (modalSubtotal * 0.18);
  const modalTotal = Math.max(0, modalSubtotal + modalTax - modalDiscount);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Invoices & Billing</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Generate, audit, and collect recurring subscriptions and implementation fees</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or tenant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Invoice Types</option>
            <option value="SUBSCRIPTION">Recurring Subscriptions</option>
            <option value="IMPLEMENTATION">Implementation & Setup</option>
            <option value="CUSTOM">Custom Development</option>
            <option value="ADDON">Add-on Modules</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="ISSUED">Issued / Pending</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading enterprise invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Invoices Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">No invoices match your current search or filter criteria.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold hover:underline">
            Generate First Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tenant Account</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Billing Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Breakdown</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{inv.organizationId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {inv.organizationId?.businessType?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        inv.type === 'IMPLEMENTATION'
                          ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {inv.implementationFee > 0 && (
                        <div>Setup: ₹{inv.implementationFee.toFixed(2)}</div>
                      )}
                      {inv.subscriptionFee > 0 && (
                        <div>Sub: ₹{inv.subscriptionFee.toFixed(2)}</div>
                      )}
                      {inv.discount > 0 && (
                        <div className="text-emerald-600">Disc: -₹{inv.discount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        ₹{inv.total?.toFixed(2)}
                      </div>
                      {inv.dueAmount > 0 && inv.dueAmount < inv.total && (
                        <div className="text-xs text-amber-600 font-medium">Due: ₹{inv.dueAmount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="View & Print Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleStatusUpdate(inv._id, 'PAID')}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                            title="Mark as Paid"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW & PRINT INVOICE MODAL                                      */}
      {/* ========================================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Invoice Details - {viewInvoice.invoiceNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-8 overflow-y-auto space-y-6 text-sm" id="printable-invoice">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="text-2xl font-black text-indigo-600 tracking-tight">ApexBuild Software</div>
                  <div className="text-xs text-slate-500">Enterprise Cloud Operating Systems</div>
                  <div className="text-xs text-slate-500 mt-1">Tax ID / GSTIN: 27AABCA1234F1Z5</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-slate-900">{viewInvoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">Issue Date: {new Date(viewInvoice.issueDate || viewInvoice.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500">Due Date: {new Date(viewInvoice.dueDate).toLocaleDateString()}</div>
                  <div className="mt-2"><StatusBadge status={viewInvoice.status} /></div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
                  <div className="font-bold text-slate-900 text-base">{viewInvoice.organizationId?.name}</div>
                  <div className="text-xs text-slate-600">{viewInvoice.organizationId?.businessType?.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500">{viewInvoice.organizationId?.email}</div>
                  {viewInvoice.organizationId?.city && (
                    <div className="text-xs text-slate-500">{viewInvoice.organizationId?.city}, {viewInvoice.organizationId?.state}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Service Allocated</span>
                  <div className="font-bold text-slate-900">{viewInvoice.osProductId?.name || viewInvoice.type}</div>
                  <div className="text-xs text-slate-500">Classification: {viewInvoice.type}</div>
                  {viewInvoice.notes && (
                    <div className="text-xs text-slate-500 italic mt-1">Notes: {viewInvoice.notes}</div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {viewInvoice.subscriptionFee > 0 && (
                    <tr>
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">OS Cloud Subscription Rate</div>
                        <div className="text-xs text-slate-500">Monthly recurring platform fee</div>
                      </td>
                      <td className="py-3 text-right font-medium">₹{viewInvoice.subscriptionFee?.toFixed(2)}</td>
                    </tr>
                  )}
                  {viewInvoice.implementationFee > 0 && (
                    <tr>
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">One-Time Onboarding & Implementation Fee</div>
                        <div className="text-xs text-slate-500">Setup, tenant workspace provisioning & data architecture</div>
                      </td>
                      <td className="py-3 text-right font-medium">₹{viewInvoice.implementationFee?.toFixed(2)}</td>
                    </tr>
                  )}
                  {viewInvoice.discount > 0 && (
                    <tr>
                      <td className="py-3 text-emerald-600 font-medium">Negotiated Contract Discount</td>
                      <td className="py-3 text-right text-emerald-600 font-medium">-₹{viewInvoice.discount?.toFixed(2)}</td>
                    </tr>
                  )}
                  {viewInvoice.tax > 0 && (
                    <tr>
                      <td className="py-3 text-slate-500">Goods and Services Tax (GST 18%)</td>
                      <td className="py-3 text-right text-slate-600 font-medium">₹{viewInvoice.tax?.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-900 font-bold">
                  <tr>
                    <td className="py-3 text-base text-slate-900">Total Due:</td>
                    <td className="py-3 text-right text-base text-indigo-600 font-mono">₹{viewInvoice.total?.toFixed(2)}</td>
                  </tr>
                  {viewInvoice.paidAmount > 0 && (
                    <tr>
                      <td className="py-1 text-xs text-emerald-600">Amount Paid:</td>
                      <td className="py-1 text-right text-xs text-emerald-600 font-mono">-₹{viewInvoice.paidAmount?.toFixed(2)}</td>
                    </tr>
                  )}
                  {viewInvoice.dueAmount > 0 && (
                    <tr>
                      <td className="py-1 text-xs text-rose-600">Balance Remaining:</td>
                      <td className="py-1 text-right text-xs text-rose-600 font-mono">₹{viewInvoice.dueAmount?.toFixed(2)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {viewInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => handleStatusUpdate(viewInvoice._id, 'PAID')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    Confirm Paid & Activate
                  </button>
                )}
                {viewInvoice.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusUpdate(viewInvoice._id, 'CANCELLED')}
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GENERATE MANUAL INVOICE MODAL                                   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl relative my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600"/> 
                Generate Custom Tenant Invoice
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tenant Business Account <span className="text-rose-500">*</span>
                </label>
                <select 
                  required 
                  value={formData.organizationId} 
                  onChange={e => setFormData({ ...formData, organizationId: e.target.value })} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Tenant Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.businessType?.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="IMPLEMENTATION">Implementation Setup Fee</option>
                    <option value="SUBSCRIPTION">Recurring Subscription</option>
                    <option value="CUSTOM">Custom Development</option>
                    <option value="ADDON">Add-on Module</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.subscriptionFee}
                    onChange={e => setFormData({ ...formData, subscriptionFee: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Implementation Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.implementationFee}
                    onChange={e => setFormData({ ...formData, implementationFee: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Special Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tax Amount (₹ / 18% GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Auto: ₹${(modalSubtotal * 0.18).toFixed(2)}`}
                    value={formData.tax}
                    onChange={e => setFormData({ ...formData, tax: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Onboarding setup for 3 warehouse facilities & initial data migration"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Total Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Calculated Total:</span>
                <span className="font-extrabold text-indigo-600 text-lg">₹{modalTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
