import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Stethoscope, 
  X, 
  Phone, 
  Building, 
  IndianRupee, 
  Users, 
  Receipt, 
  TrendingUp, 
  CreditCard, 
  Calendar,
  CheckCircle, 
  FileText, 
  ChevronRight,
  Edit,
  ArrowUpRight,
  Percent,
  Download
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DoctorPayoutVoucher from '../../components/diagnostics/DoctorPayoutVoucher';

const DiagnosticsDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'payouts'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDoctorForPayout, setSelectedDoctorForPayout] = useState(null);
  const [ledgerDoctor, setLedgerDoctor] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [allPayouts, setAllPayouts] = useState([]);

  // Form State for Add / Edit Doctor
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    clinicName: '',
    address: '',
    commissionRate: 15,
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      upiId: ''
    }
  });

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    taxDeduction: 0,
    paymentMethod: 'UPI',
    transactionReference: '',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchPayouts();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/doctors');
      setDoctors(res.data?.data?.doctors || []);
      setStats(res.data?.data?.stats || {});
    } catch (error) {
      toast.error('Failed to fetch referring doctors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await api.get('/diagnostics/doctors/payouts');
      setAllPayouts(res.data?.data?.payouts || []);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    }
  };

  const handleOpenLedger = async (doctor) => {
    setLedgerDoctor(doctor);
    setLoadingLedger(true);
    try {
      const res = await api.get(`/diagnostics/doctors/${doctor._id}/ledger`);
      setLedgerData(res.data?.data);
    } catch (error) {
      toast.error('Failed to load doctor referral ledger');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/diagnostics/doctors', formData);
      toast.success('Doctor added to referral network');
      setIsAddModalOpen(false);
      setFormData({
        name: '', specialization: '', phone: '', email: '', clinicName: '',
        address: '', commissionRate: 15, panNumber: '',
        bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '' }
      });
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding doctor');
    }
  };

  const handleOpenPayout = (doctor) => {
    setSelectedDoctorForPayout(doctor);
    setPayoutForm({
      amount: doctor.pendingBalance || '',
      taxDeduction: 0,
      paymentMethod: 'UPI',
      transactionReference: '',
      notes: `Referral incentive settlement for ${doctor.name}`
    });
  };

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    if (!payoutForm.amount || Number(payoutForm.amount) <= 0) {
      return toast.error('Please enter a valid payout amount');
    }

    try {
      const payload = {
        doctorId: selectedDoctorForPayout._id,
        commissionAmount: Number(payoutForm.amount),
        taxDeduction: Number(payoutForm.taxDeduction || 0),
        paymentMethod: payoutForm.paymentMethod,
        transactionReference: payoutForm.transactionReference,
        notes: payoutForm.notes
      };

      const res = await api.post('/diagnostics/doctors/payouts', payload);
      toast.success('Doctor commission payout recorded!');
      setSelectedDoctorForPayout(null);
      
      // Auto open voucher for printing / download
      if (res.data?.data?.payout) {
        setActiveVoucher(res.data.data.payout);
      }
      
      fetchDoctors();
      fetchPayouts();
      if (ledgerDoctor && ledgerDoctor._id === selectedDoctorForPayout._id) {
        handleOpenLedger(ledgerDoctor);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payout');
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.clinicName && d.clinicName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.phone && d.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Physician Referral & Incentives</h1>
          <p className="text-gray-500 text-sm mt-1">
            Doctor commission tiers, patient referral ledger, revenue tracking & payout disbursements
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Referring Physician
        </button>
      </div>

      {/* Top Financial KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Network Doctors</span>
          <div className="text-xl font-extrabold text-gray-900">{stats.totalDoctors || doctors.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Referred Patients</span>
          <div className="text-xl font-extrabold text-blue-600">{stats.totalReferredPatients || 0}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Referred Revenue</span>
          <div className="text-xl font-extrabold text-slate-900">₹{(stats.totalGrossRevenue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Incentives Accrued</span>
          <div className="text-xl font-extrabold text-indigo-700">₹{(stats.totalIncentiveAccrued || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Settled Payouts</span>
          <div className="text-xl font-extrabold text-emerald-700">₹{(stats.totalPaidOut || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">Pending Balance</span>
          <div className="text-xl font-extrabold text-amber-700">₹{(stats.totalPendingBalance || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Directory & Commission Tiers ({doctors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payout History & Vouchers ({allPayouts.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Doctor Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by physician name, clinic, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">No Referring Physicians Found</h3>
              <p className="text-xs text-gray-500">
                Click "Add Referring Physician" to configure doctors and commission percentages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doc) => (
                <div 
                  key={doc._id} 
                  className="bg-white rounded-xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    {/* Header: Name and Commission Tier Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{doc.name}</h3>
                          <p className="text-xs text-gray-500">{doc.specialization || 'General Physician'}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {doc.commissionRate || 15}% Cut
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-4">
                      {doc.clinicName && (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          <span>{doc.clinicName}</span>
                        </div>
                      )}
                      {doc.phone && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{doc.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary Box */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Referrals</span>
                        <span className="font-extrabold text-sm text-gray-900">{doc.totalReferrals || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Earned</span>
                        <span className="font-extrabold text-sm text-indigo-700">₹{(doc.totalCommission || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold uppercase block">Balance Due</span>
                        <span className="font-black text-sm text-amber-700">₹{(doc.pendingBalance || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenLedger(doc)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                    >
                      <span>View Referral Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenPayout(doc)}
                      disabled={!doc.pendingBalance || doc.pendingBalance <= 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Disburse Payout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payout History */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
          {allPayouts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No payout settlements recorded yet.</p>
              <p className="text-xs text-gray-400 mt-0.5">Disbursed commission vouchers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-slate-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-5 py-3 text-left">Voucher #</th>
                    <th className="px-5 py-3 text-left">Referring Physician</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Payment Mode & Ref</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">TDS Tax</th>
                    <th className="px-5 py-3 text-right">Net Paid</th>
                    <th className="px-5 py-3 text-center">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {allPayouts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-900">
                        {p.voucherNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900">{p.doctor?.name}</div>
                        <div className="text-[11px] text-gray-400">{p.doctor?.clinicName || 'Clinic'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800">{p.paymentMethod}</span>
                        {p.transactionReference && (
                          <div className="text-[10px] text-gray-400 font-mono">Ref: {p.transactionReference}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                        ₹{p.commissionAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right text-red-600 font-medium">
                        {p.taxDeduction > 0 ? `- ₹${p.taxDeduction}` : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-800 text-sm">
                        ₹{p.netPaidAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setActiveVoucher(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Voucher</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Doctor Referral Ledger Modal / Drawer */}
      {ledgerDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Referral Ledger: {ledgerDoctor.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Agreed Commission Rate: <strong>{ledgerDoctor.commissionRate || 15}%</strong> • {ledgerDoctor.clinicName || 'Clinic'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPayout(ledgerDoctor)}
                  disabled={!ledgerDoctor.pendingBalance || ledgerDoctor.pendingBalance <= 0}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  Record Settlement
                </button>
                <button 
                  onClick={() => setLedgerDoctor(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {loadingLedger ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !ledgerData ? (
                <div className="p-8 text-center text-gray-400">Failed to load ledger data</div>
              ) : (
                <>
                  {/* Summary Strip */}
                  <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200 text-center shadow-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Referred</span>
                      <span className="font-extrabold text-base text-gray-900">{ledgerData.summary?.totalReferrals || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Bill Revenue</span>
                      <span className="font-extrabold text-base text-slate-900">₹{(ledgerData.summary?.totalRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-600 font-bold uppercase block">Earned Incentive</span>
                      <span className="font-extrabold text-base text-indigo-700">₹{(ledgerData.summary?.totalCommission || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 font-bold uppercase block">Payable Balance</span>
                      <span className="font-black text-base text-amber-700">₹{(ledgerData.summary?.pendingBalance || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Referred Patients Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/70 font-bold text-xs text-gray-700 uppercase">
                      Referred Patient Order Breakdown
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 text-xs">
                        <thead className="bg-slate-50 text-gray-400 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Order ID</th>
                            <th className="px-4 py-2.5 text-left">Patient Name</th>
                            <th className="px-4 py-2.5 text-left">Date</th>
                            <th className="px-4 py-2.5 text-left">Tests</th>
                            <th className="px-4 py-2.5 text-right">Bill (₹)</th>
                            <th className="px-4 py-2.5 text-right font-bold text-indigo-700">Incentive ({ledgerDoctor.commissionRate || 15}%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {ledgerData.orders?.map(order => (
                            <tr key={order._id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-2.5 font-mono font-bold text-blue-900">{order.orderId}</td>
                              <td className="px-4 py-2.5 font-bold text-gray-900">
                                {order.patient?.firstName} {order.patient?.lastName}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">
                                {order.tests?.map(t => t.test?.name).join(', ')}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                ₹{order.totalAmount}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                ₹{order.calculatedIncentive}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payout Settlement Modal */}
      {selectedDoctorForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Record Commission Settlement</h3>
                <p className="text-xs text-gray-500">Doctor: {selectedDoctorForPayout.name}</p>
              </div>
              <button 
                onClick={() => setSelectedDoctorForPayout(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="font-medium text-amber-900">Calculated Unsettled Balance:</span>
                <span className="font-black text-amber-800 text-sm">₹{selectedDoctorForPayout.pendingBalance?.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Disbursement Amount (₹) *</label>
                <input 
                  type="number"
                  required
                  min="1"
                  max={selectedDoctorForPayout.pendingBalance}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">TDS Tax Deduction (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={payoutForm.taxDeduction}
                    onChange={(e) => setPayoutForm({ ...payoutForm, taxDeduction: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Transaction Ref / UTR / Cheque No.</label>
                <input 
                  type="text"
                  placeholder="e.g. UTR-4910291992"
                  value={payoutForm.transactionReference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, transactionReference: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Remarks / Settlement Notes</label>
                <textarea 
                  rows="2"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Optional settlement notes..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForPayout(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Authorize & Disburse Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-fade-in my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
              <h2 className="text-base font-bold text-gray-900">Add Referring Physician</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDoctor} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Doctor Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Dr. Full Name (MD, MBBS)"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Specialization</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Internal Medicine"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Default Commission (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Clinic / Hospital Name</label>
                  <input 
                    type="text" 
                    placeholder="Apollo / Care Clinic"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">PAN Number (for Tax / TDS)</label>
                <input 
                  type="text" 
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">UPI ID (Direct Payouts)</label>
                <input 
                  type="text" 
                  placeholder="doctor@okhdfcbank"
                  value={formData.bankDetails.upiId}
                  onChange={(e) => setFormData({
                    ...formData, 
                    bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Voucher Preview / Print Modal */}
      {activeVoucher && (
        <DoctorPayoutVoucher
          payout={activeVoucher}
          onClose={() => setActiveVoucher(null)}
        />
      )}
    </div>
  );
};

export default DiagnosticsDoctors;
