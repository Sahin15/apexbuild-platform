import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileSpreadsheet, IndianRupee, Search, Filter, Plus, 
  Printer, CheckCircle2, Clock, AlertTriangle, XCircle, 
  Building, ChevronRight, Eye, Trash2, ArrowUpRight, 
  CreditCard, ShieldCheck, FileText, Check, X, Layers,
  MessageCircle, Share2
} from 'lucide-react';
import ShareDocumentModal from '../components/common/ShareDocumentModal';
import { formatContractorBillWhatsApp } from '../utils/whatsappShare';

export default function Billing({ isProjectView = false }) {
  const { id: routeProjectId } = useParams();

  // Data states
  const [bills, setBills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [preparingData, setPreparingData] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View / Print IPC Modal
  const [printBill, setPrintBill] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);

  // Payment Recording Modal
  const [paymentModal, setPaymentModal] = useState({ open: false, bill: null, paidAmount: '', paymentReference: '', paymentDate: new Date().toISOString().split('T')[0] });

  // Generate RA Bill form state
  const [billForm, setBillForm] = useState({
    projectId: routeProjectId || '',
    billNo: '',
    billSequence: 1,
    billDate: new Date().toISOString().split('T')[0],
    period: '',
    retentionPercent: 5,
    mobAdvanceRecovery: 0,
    materialRecovery: 0,
    labourCessPercent: 1,
    tdsPercent: 2,
    otherDeductions: 0,
    gstPercent: 18,
    engineerRemarks: '',
    clientRemarks: ''
  });

  // Fetch Bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      const projId = isProjectView ? routeProjectId : selectedProjectId;
      let endpoint = '/billing/ra-bills';
      const params = [];
      if (projId) params.push(`projectId=${projId}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await api.get(endpoint);
      setBills(res.data.data.bills || []);
    } catch (error) {
      toast.error('Failed to load Running Account (RA) bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!isProjectView) {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data.projects || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  };

  const handleShareBill = (b) => {
    const proj = projects.find(p => p._id === (b.projectId?._id || b.projectId)) || b.projectId;
    const text = formatContractorBillWhatsApp({
      bill: b,
      project: proj,
      clientName: b.clientId?.name || proj?.clientName || ''
    });
    setShareModalData({
      title: 'Share Running Account (RA) Bill',
      documentNumber: b.billNo,
      recipientName: proj?.name || 'Civil Project',
      phone: '',
      whatsappText: text,
      onPrint: () => {
        setPrintBill(b);
        setTimeout(() => window.print(), 350);
      }
    });
  };

  useEffect(() => {
    fetchBills();
    fetchProjects();
  }, [selectedProjectId, statusFilter, routeProjectId, isProjectView]);

  // Open "Generate RA Bill" Modal and auto-fetch prepared data
  const handleOpenGenerateModal = async () => {
    const projId = isProjectView ? routeProjectId : (selectedProjectId || projects[0]?._id);
    if (!projId) {
      toast.error('Please select a project first');
      return;
    }

    try {
      setIsPreparing(true);
      setIsGenerateModalOpen(true);
      const res = await api.get(`/billing/ra-bills/prepare-next?projectId=${projId}`);
      const prep = res.data.data;
      setPreparingData(prep);
      setBillForm({
        projectId: projId,
        billNo: prep.billNo,
        billSequence: prep.billSequence,
        billDate: new Date().toISOString().split('T')[0],
        period: prep.period,
        retentionPercent: prep.retentionPercent,
        mobAdvanceRecovery: prep.mobAdvanceRecovery,
        materialRecovery: prep.materialRecovery,
        labourCessPercent: prep.labourCessPercent,
        tdsPercent: prep.tdsPercent,
        otherDeductions: prep.otherDeductions,
        gstPercent: prep.gstPercent,
        engineerRemarks: '',
        clientRemarks: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to prepare RA Bill data');
      setIsGenerateModalOpen(false);
    } finally {
      setIsPreparing(false);
    }
  };

  // Re-calculate live totals in Generate modal if user adjusts deduction percentages
  const liveCalculations = useMemo(() => {
    if (!preparingData) return null;
    const grossCurrent = preparingData.grossCurrentAmount || 0;
    const grossPrevious = preparingData.grossPreviousAmount || 0;
    const grossUptoDate = grossPrevious + grossCurrent;

    const retAmount = Math.round((grossCurrent * (Number(billForm.retentionPercent) || 0)) / 100);
    const cessAmount = Math.round((grossCurrent * (Number(billForm.labourCessPercent) || 0)) / 100);
    const tdsAmount = Math.round((grossCurrent * (Number(billForm.tdsPercent) || 0)) / 100);
    const mobRecovery = Number(billForm.mobAdvanceRecovery) || 0;
    const matRecovery = Number(billForm.materialRecovery) || 0;
    const otherDed = Number(billForm.otherDeductions) || 0;

    const totalDed = retAmount + cessAmount + tdsAmount + mobRecovery + matRecovery + otherDed;
    const netBeforeTax = Math.max(0, grossCurrent - totalDed);
    const gstAmount = Math.round((netBeforeTax * (Number(billForm.gstPercent) || 0)) / 100);
    const netPayable = netBeforeTax + gstAmount;

    return {
      grossCurrent,
      grossPrevious,
      grossUptoDate,
      retAmount,
      cessAmount,
      tdsAmount,
      totalDed,
      netBeforeTax,
      gstAmount,
      netPayable
    };
  }, [preparingData, billForm]);

  // Submit RA Bill
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!preparingData || !liveCalculations) return;

    if (preparingData.items.length === 0) {
      toast.error('There are no verified unbilled measurements available to generate an RA Bill.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        projectId: billForm.projectId,
        billNo: billForm.billNo,
        billSequence: billForm.billSequence,
        billDate: billForm.billDate,
        period: billForm.period,
        items: preparingData.items,
        grossCurrentAmount: liveCalculations.grossCurrentCurrent || liveCalculations.grossCurrent,
        grossPreviousAmount: liveCalculations.grossPrevious,
        grossUptoDateAmount: liveCalculations.grossUptoDate,
        retentionPercent: Number(billForm.retentionPercent) || 0,
        retentionAmount: liveCalculations.retAmount,
        mobAdvanceRecovery: Number(billForm.mobAdvanceRecovery) || 0,
        materialRecovery: Number(billForm.materialRecovery) || 0,
        labourCessPercent: Number(billForm.labourCessPercent) || 0,
        labourCessAmount: liveCalculations.cessAmount,
        tdsPercent: Number(billForm.tdsPercent) || 0,
        tdsAmount: liveCalculations.tdsAmount,
        otherDeductions: Number(billForm.otherDeductions) || 0,
        totalDeductions: liveCalculations.totalDed,
        netPayableBeforeTax: liveCalculations.netBeforeTax,
        gstPercent: Number(billForm.gstPercent) || 0,
        gstAmount: liveCalculations.gstAmount,
        netPayable: liveCalculations.netPayable,
        engineerRemarks: billForm.engineerRemarks,
        clientRemarks: billForm.clientRemarks
      };

      await api.post('/billing/ra-bills', payload);
      toast.success(`${billForm.billNo} generated successfully!`);
      setIsGenerateModalOpen(false);
      setPreparingData(null);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate RA Bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change / Approve
  const handleStatusUpdate = async (billId, newStatus) => {
    try {
      await api.patch(`/billing/ra-bills/${billId}/status`, { status: newStatus });
      toast.success(`Bill status updated to ${newStatus}`);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Submit Payment Recording
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModal.bill) return;

    try {
      await api.patch(`/billing/ra-bills/${paymentModal.bill._id}/status`, {
        status: 'PAID',
        paidAmount: Number(paymentModal.paidAmount) || paymentModal.bill.netPayable,
        paymentDate: paymentModal.paymentDate,
        paymentReference: paymentModal.paymentReference
      });
      toast.success('Payment recorded successfully!');
      setPaymentModal({ open: false, bill: null, paidAmount: '', paymentReference: '', paymentDate: '' });
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  // Delete Draft/Rejected Bill
  const handleDeleteBill = async (bill) => {
    if (!window.confirm(`Delete ${bill.billNo}? All associated measurements will be restored to VERIFIED.`)) return;
    try {
      await api.delete(`/billing/ra-bills/${bill._id}`);
      toast.success('RA Bill deleted and measurements restored');
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete bill');
    }
  };

  // Financial aggregates
  const financialStats = useMemo(() => {
    let totalGrossDone = 0;
    let totalPaidAmount = 0;
    let totalRetentionHeld = 0;
    let totalPendingDues = 0;

    bills.forEach(b => {
      totalGrossDone += b.grossCurrentAmount || 0;
      totalRetentionHeld += b.retentionAmount || 0;
      if (b.status === 'PAID') {
        totalPaidAmount += b.paidAmount || b.netPayable || 0;
      } else if (['SUBMITTED', 'VERIFIED', 'APPROVED'].includes(b.status)) {
        totalPendingDues += b.balanceDue || b.netPayable || 0;
      }
    });

    return { totalGrossDone, totalPaidAmount, totalRetentionHeld, totalPendingDues };
  }, [bills]);

  // Filtered by text search
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter(b => 
      b.billNo?.toLowerCase().includes(q) ||
      b.period?.toLowerCase().includes(q) ||
      b.projectId?.name?.toLowerCase().includes(q) ||
      b.clientId?.name?.toLowerCase().includes(q) ||
      b.paymentReference?.toLowerCase().includes(q)
    );
  }, [bills, searchQuery]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className={isProjectView ? "space-y-5" : "space-y-6"}>
      {/* Header */}
      {!isProjectView && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Running Account (RA) Billing
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                FIDIC / CPWD IPC Standards
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              Contractor RA Bills & Client IPCs
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Generate sequential Interim Payment Certificates (IPCs) directly from certified site measurements, track 5% retention escrow, and manage client disbursements.
            </p>
          </div>
          <button 
            onClick={handleOpenGenerateModal}
            className="btn btn-primary text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap flex-shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
            <span>Generate Next RA Bill</span>
          </button>
        </div>
      )}

      {/* Financial KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Work Done */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Work Certified</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(financialStats.totalGrossDone)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Cumulative gross contract value</div>
        </div>

        {/* Realized Payments */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Client Payments Received</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">
            {formatCurrency(financialStats.totalPaidAmount)}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Disbursed into contractor bank account</div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Client Dues</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">
            {formatCurrency(financialStats.totalPendingDues)}
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Submitted / Under certification</div>
        </div>

        {/* Retention Escrow */}
        <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Retention Money Withheld</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-2">
            {formatCurrency(financialStats.totalRetentionHeld)}
          </div>
          <div className="text-xs text-indigo-700 mt-1 font-medium">5% security deposit (DLP release)</div>
        </div>
      </div>

      {/* Main Billing Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Bill #, Client, Reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm pl-9 bg-white text-xs w-full rounded-lg"
              />
            </div>

            {/* Project Filter */}
            {!isProjectView && (
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="input input-sm text-xs bg-white rounded-lg py-1 px-2.5 font-medium text-slate-700"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-medium text-slate-600">
              {['ALL', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>

            {isProjectView && (
              <button
                onClick={handleOpenGenerateModal}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Next RA Bill
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Bill No & Seq</th>
                <th className="px-5 py-3.5">Billing Period & Date</th>
                <th className="px-5 py-3.5">Project & Client</th>
                <th className="px-5 py-3.5 text-right">Gross Work Done</th>
                <th className="px-5 py-3.5 text-right">Deductions</th>
                <th className="px-5 py-3.5 text-right">GST (18%)</th>
                <th className="px-5 py-3.5 text-right">Net Certified</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length > 0 ? (
                filteredBills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Bill No */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        {b.billNo}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Seq #{b.billSequence || 1} • {b.items?.length || 0} line items
                      </div>
                    </td>

                    {/* Period & Date */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{b.period}</div>
                      <div className="text-[10px] text-slate-400">
                        Date: {new Date(b.billDate || b.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </td>

                    {/* Project & Client */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <div className="font-semibold text-slate-800 truncate" title={b.projectId?.name}>
                        {b.projectId?.name || 'Project'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={b.clientId?.name}>
                        {b.clientId?.name || 'Client'}
                      </div>
                    </td>

                    {/* Gross Work Done */}
                    <td className="px-5 py-3.5 text-right font-medium">
                      <div className="text-slate-900 font-bold">{formatCurrency(b.grossCurrentAmount)}</div>
                      <div className="text-[10px] text-slate-400">
                        Upto Date: {formatCurrency(b.grossUptoDateAmount)}
                      </div>
                    </td>

                    {/* Deductions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="font-semibold text-rose-600">
                        –{formatCurrency(b.totalDeductions || b.retentionAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Ret: {formatCurrency(b.retentionAmount)} | Cess: {formatCurrency(b.labourCessAmount)}
                      </div>
                    </td>

                    {/* GST */}
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                      +{formatCurrency(b.gstAmount)}
                    </td>

                    {/* Net Certified */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(b.netPayable)}
                      </div>
                      {b.status === 'PAID' && (
                        <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <Check className="w-3 h-3" /> Paid in full
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        b.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        b.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        b.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {b.status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {b.status === 'APPROVED' && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                        {b.status === 'SUBMITTED' && <Clock className="w-3 h-3 text-amber-600" />}
                        {b.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {b.status}
                      </span>
                      {b.paymentReference && (
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px] mx-auto" title={b.paymentReference}>
                          {b.paymentReference}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Share via WhatsApp */}
                        <button
                          onClick={() => handleShareBill(b)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Share RA Bill via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 fill-emerald-600 text-transparent" />
                        </button>

                        {/* View / Print IPC Certificate */}
                        <button
                          onClick={() => setPrintBill(b)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="View Official Interim Payment Certificate (IPC)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Approve Bill (if SUBMITTED) */}
                        {b.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, 'APPROVED')}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Approve & Certify RA Bill"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Record Payment (if APPROVED or SUBMITTED) */}
                        {b.status !== 'PAID' && (
                          <button
                            onClick={() => setPaymentModal({ open: true, bill: b, paidAmount: b.netPayable, paymentReference: '', paymentDate: new Date().toISOString().split('T')[0] })}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Record Client Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Draft/Rejected */}
                        {b.status !== 'PAID' && (
                          <button
                            onClick={() => handleDeleteBill(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete RA Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No Running Account (RA) bills found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {loading ? 'Loading bills...' : 'Verify site measurements first, then click "Generate Next RA Bill".'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GENERATE RA BILL MODAL (AUTO-CALCULATED FROM VERIFIED MEASUREMENTS)        */}
      {/* ========================================================================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    AUTOMATED COMPOSITION
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Interim Payment Certificate (IPC)</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  Generate Running Account Bill ({billForm.billNo || 'Next RA Bill'})
                </h2>
              </div>
              <button 
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {isPreparing ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-800">Aggregating certified site measurements & previous bills...</p>
              </div>
            ) : preparingData ? (
              <form onSubmit={handleGenerateSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Meta details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bill Reference</label>
                    <input
                      type="text"
                      className="input input-sm w-full text-xs font-bold font-mono rounded-lg"
                      required
                      value={billForm.billNo}
                      onChange={e => setBillForm({ ...billForm, billNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bill Date</label>
                    <input
                      type="date"
                      className="input input-sm w-full text-xs rounded-lg"
                      required
                      value={billForm.billDate}
                      onChange={e => setBillForm({ ...billForm, billDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Billing Period Description</label>
                    <input
                      type="text"
                      className="input input-sm w-full text-xs rounded-lg"
                      required
                      value={billForm.period}
                      onChange={e => setBillForm({ ...billForm, period: e.target.value })}
                      placeholder="e.g. 01 Sep 2026 to 30 Sep 2026"
                    />
                  </div>
                </div>

                {/* Items Abstract Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Work Items Abstract (From Verified Measurement Books)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {preparingData.unbilledMeasurementsCount} Verified Records Bundled
                    </span>
                  </div>

                  {preparingData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Item Code</th>
                            <th className="py-2.5 px-3">Work Description</th>
                            <th className="py-2.5 px-3">Unit</th>
                            <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-3 text-right">Prev Qty</th>
                            <th className="py-2.5 px-3 text-right text-emerald-700">This Bill Qty</th>
                            <th className="py-2.5 px-3 text-right">Upto Date Qty</th>
                            <th className="py-2.5 px-3 text-right">This Bill Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {preparingData.items.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-primary-700">{row.itemCode}</td>
                              <td className="py-2.5 px-3 max-w-[200px] truncate" title={row.description}>{row.description}</td>
                              <td className="py-2.5 px-3 uppercase text-slate-400 font-semibold">{row.unit}</td>
                              <td className="py-2.5 px-3 text-right font-mono">₹{row.rate.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-500">{row.previousQty}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">+{row.currentQty}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">{row.uptoDateQty}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{row.currentAmount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan="7" className="py-2.5 px-3 text-right uppercase text-slate-600">
                              Gross Current Work Done (This Bill):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-700">
                              {formatCurrency(liveCalculations.grossCurrent)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No verified unbilled measurements found for this project.
                      Please inspect and verify measurements in the Measurement Book before generating an RA Bill.
                    </div>
                  )}
                </div>

                {/* Deductions & Statutory Recoveries */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Statutory Deductions & Tax Parameters
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Retention Money ({billForm.retentionPercent}%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input input-sm w-16 text-center text-xs rounded-lg font-mono"
                          value={billForm.retentionPercent}
                          onChange={e => setBillForm({ ...billForm, retentionPercent: e.target.value })}
                        />
                        <span className="font-mono font-semibold text-slate-800">
                          = {formatCurrency(liveCalculations.retAmount)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Labour Welfare Cess ({billForm.labourCessPercent}%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input input-sm w-16 text-center text-xs rounded-lg font-mono"
                          value={billForm.labourCessPercent}
                          onChange={e => setBillForm({ ...billForm, labourCessPercent: e.target.value })}
                        />
                        <span className="font-mono font-semibold text-slate-800">
                          = {formatCurrency(liveCalculations.cessAmount)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Income Tax TDS ({billForm.tdsPercent}%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input input-sm w-16 text-center text-xs rounded-lg font-mono"
                          value={billForm.tdsPercent}
                          onChange={e => setBillForm({ ...billForm, tdsPercent: e.target.value })}
                        />
                        <span className="font-mono font-semibold text-slate-800">
                          = {formatCurrency(liveCalculations.tdsAmount)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        GST Rate ({billForm.gstPercent}%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          className="input input-sm w-16 text-center text-xs rounded-lg font-mono"
                          value={billForm.gstPercent}
                          onChange={e => setBillForm({ ...billForm, gstPercent: e.target.value })}
                        />
                        <span className="font-mono font-semibold text-slate-800">
                          = {formatCurrency(liveCalculations.gstAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Calculation Card */}
                <div className="bg-emerald-950 text-white p-5 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>1. Gross Value of Work Done This Bill</span>
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(liveCalculations.grossCurrent)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-300">
                    <span>2. Less: Total Deductions (Retention + Cess + TDS)</span>
                    <span className="font-mono font-bold">–{formatCurrency(liveCalculations.totalDed)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200 border-t border-emerald-800/80 pt-2">
                    <span>3. Net Amount Payable Before Taxes</span>
                    <span className="font-mono font-bold">{formatCurrency(liveCalculations.netBeforeTax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-300">
                    <span>4. Add: Goods & Services Tax (GST {billForm.gstPercent}%)</span>
                    <span className="font-mono font-bold">+{formatCurrency(liveCalculations.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black text-emerald-400 border-t border-emerald-700/80 pt-2.5">
                    <span className="uppercase tracking-wider">NET CERTIFIED PAYABLE TO CONTRACTOR</span>
                    <span className="text-xl font-mono">{formatCurrency(liveCalculations.netPayable)}</span>
                  </div>
                </div>

                {/* Engineer Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Certification Remarks / Consultant Observations
                  </label>
                  <textarea
                    className="input input-sm w-full text-xs rounded-lg"
                    rows={2}
                    placeholder="e.g. Recommended for interim payment in accordance with Contract Clause 14."
                    value={billForm.engineerRemarks}
                    onChange={e => setBillForm({ ...billForm, engineerRemarks: e.target.value })}
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn btn-secondary text-xs rounded-xl px-4 py-2 font-semibold"
                    onClick={() => setIsGenerateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || preparingData.items.length === 0}
                    className="btn btn-primary text-xs rounded-xl px-5 py-2 font-bold shadow-md shadow-primary-600/20 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Generating...' : `Confirm & Issue ${billForm.billNo}`}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD CLIENT PAYMENT MODAL                                              */}
      {/* ========================================================================= */}
      {paymentModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b bg-emerald-50 border-emerald-200 text-emerald-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm">Record Client Payment ({paymentModal.bill?.billNo})</h3>
              </div>
              <button onClick={() => setPaymentModal({ open: false, bill: null, paidAmount: '', paymentReference: '', paymentDate: '' })}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  className="input input-sm w-full text-sm font-bold font-mono rounded-lg"
                  required
                  value={paymentModal.paidAmount}
                  onChange={e => setPaymentModal({ ...paymentModal, paidAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date</label>
                <input
                  type="date"
                  className="input input-sm w-full text-xs rounded-lg"
                  required
                  value={paymentModal.paymentDate}
                  onChange={e => setPaymentModal({ ...paymentModal, paymentDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  UTR / RTGS / Cheque Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-sm w-full text-xs font-mono rounded-lg"
                  required
                  placeholder="e.g. UTR/HDFC00294819"
                  value={paymentModal.paymentReference}
                  onChange={e => setPaymentModal({ ...paymentModal, paymentReference: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs rounded-xl px-4 py-2"
                  onClick={() => setPaymentModal({ open: false, bill: null, paidAmount: '', paymentReference: '', paymentDate: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs rounded-xl px-5 py-2 font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL INTERIM PAYMENT CERTIFICATE (IPC / FORM 26)            */}
      {/* ========================================================================= */}
      {printBill && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in duration-150">
            {/* Top Action Bar (hidden during print) */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  INTERIM PAYMENT CERTIFICATE (IPC) — {printBill.billNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareBill(printBill)}
                  className="btn btn-sm text-xs rounded-lg flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  title="Share RA Bill Certificate via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" /> Share WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm text-xs rounded-lg flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Official Certificate
                </button>
                <button
                  onClick={() => setPrintBill(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 bg-white text-slate-900 font-serif leading-relaxed text-xs">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                <h1 className="text-lg font-bold uppercase tracking-widest text-slate-900">
                  INTERIM PAYMENT CERTIFICATE (IPC)
                </h1>
                <p className="text-[11px] uppercase tracking-wider text-slate-600 mt-0.5">
                  [Standard CPWD Form 26 / FIDIC Sub-Clause 14.6 Compliant]
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px] mb-4 pb-3 border-b border-slate-300">
                <div><strong>Project:</strong> {printBill.projectId?.name}</div>
                <div><strong>Certificate / Bill No:</strong> <span className="font-mono font-bold">{printBill.billNo}</span></div>
                <div><strong>Employer / Client:</strong> {printBill.clientId?.name || 'Prestige Urban Infra Pvt Ltd'}</div>
                <div><strong>Date of Certificate:</strong> {new Date(printBill.billDate || printBill.createdAt).toLocaleDateString('en-GB')}</div>
                <div><strong>Contractor:</strong> Apex Infrastructure & Buildcon Ltd</div>
                <div><strong>Billing Period:</strong> {printBill.period}</div>
                <div className="col-span-2"><strong>Location:</strong> {printBill.projectId?.location || 'Sector 150, Noida'}</div>
              </div>

              {/* Items Breakdown Table */}
              <table className="w-full text-left border-collapse border border-slate-400 text-[10px] mb-4">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-16">Item Code</th>
                    <th className="border border-slate-400 p-1.5">Description of Item</th>
                    <th className="border border-slate-400 p-1.5 w-12">Unit</th>
                    <th className="border border-slate-400 p-1.5 w-14 text-right">Rate (₹)</th>
                    <th className="border border-slate-400 p-1.5 w-16 text-right">Previous Qty</th>
                    <th className="border border-slate-400 p-1.5 w-16 text-right">This Bill Qty</th>
                    <th className="border border-slate-400 p-1.5 w-16 text-right">Upto Date Qty</th>
                    <th className="border border-slate-400 p-1.5 w-20 text-right">This Bill Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printBill.items && printBill.items.length > 0 ? (
                    printBill.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-400 p-1.5 font-mono font-bold text-center">{it.itemCode}</td>
                        <td className="border border-slate-400 p-1.5">{it.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center uppercase">{it.unit}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">₹{it.rate}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">{it.previousQty}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">{it.currentQty}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">{it.uptoDateQty}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">₹{it.currentAmount?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="border border-slate-400 p-2 text-center text-slate-500">
                        Total Gross Certified Value: ₹{printBill.grossCurrentAmount?.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Statutory Deductions Abstract Summary */}
              <div className="border border-slate-400 p-4 mb-6 text-[11px] space-y-1.5">
                <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                  Financial Statement & Certificate Abstract
                </div>
                <div className="flex justify-between">
                  <span>1. Gross Value of Work Certified in this Bill</span>
                  <span className="font-mono font-bold">₹{printBill.grossCurrentAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>2. Deductions:</span>
                  <span></span>
                </div>
                <div className="flex justify-between pl-4 text-slate-700">
                  <span>(a) Retention Money ({printBill.retentionPercent}%)</span>
                  <span className="font-mono">–₹{printBill.retentionAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-700">
                  <span>(b) Building & Other Construction Workers Welfare Cess (1%)</span>
                  <span className="font-mono">–₹{printBill.labourCessAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-700">
                  <span>(c) Income Tax TDS ({printBill.tdsPercent}%)</span>
                  <span className="font-mono">–₹{printBill.tdsAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1">
                  <span>3. Net Certified Payable Before Taxes</span>
                  <span className="font-mono">₹{printBill.netPayableBeforeTax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>4. Add: Goods & Services Tax (GST {printBill.gstPercent}%)</span>
                  <span className="font-mono">+₹{printBill.gstAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t-2 border-slate-900 pt-1.5 mt-1">
                  <span>5. NET AMOUNT CERTIFIED FOR PAYMENT IN THIS IPC</span>
                  <span className="font-mono">₹{printBill.netPayable?.toLocaleString()}</span>
                </div>
              </div>

              {/* 4-Tier Certification Boxes */}
              <div className="grid grid-cols-4 gap-4 pt-6 text-center text-[10px]">
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Prepared By</div>
                  <div className="text-slate-500">Contractor Billing QS</div>
                  <div className="font-mono text-[9px] text-slate-400 mt-1">{printBill.createdBy?.name || 'Lead QS'}</div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Verified & Checked</div>
                  <div className="text-slate-500">Resident Site Engineer</div>
                  <div className="font-mono text-[9px] text-slate-400 mt-1">Inspecting Surveyor</div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Recommended & Certified</div>
                  <div className="text-slate-500">Client Consultant / PMC</div>
                  <div className="font-mono text-[9px] text-emerald-700 font-bold mt-1">
                    {printBill.status === 'APPROVED' || printBill.status === 'PAID' ? '[CERTIFIED]' : '[PENDING]'}
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Sanctioned for Payment</div>
                  <div className="text-slate-500">Client Finance Directorate</div>
                  <div className="font-mono text-[9px] text-slate-400 mt-1">
                    {printBill.status === 'PAID' ? `[PAID: ${printBill.paymentReference || 'OK'}]` : '[UNPAID]'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareModalData && (
        <ShareDocumentModal
          isOpen={!!shareModalData}
          onClose={() => setShareModalData(null)}
          title={shareModalData.title}
          documentNumber={shareModalData.documentNumber}
          recipientName={shareModalData.recipientName}
          initialPhone={shareModalData.phone}
          whatsappText={shareModalData.whatsappText}
          onPrint={shareModalData.onPrint}
          customBadge="RA RUNNING ACCOUNT BILL"
        />
      )}
    </div>
  );
}
