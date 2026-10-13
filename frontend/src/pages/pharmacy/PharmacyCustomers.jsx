import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, Plus, Search, Filter, ShieldCheck, AlertCircle, 
  CheckCircle2, ChevronRight, X, Eye, Sparkles, Layers, 
  Package, RefreshCw, Calendar, IndianRupee, Clock, ArrowRight,
  FileText, Check, DollarSign, Stethoscope, RotateCcw, UserCheck,
  Printer, Ban, ShieldAlert, ArrowDownLeft, AlertTriangle, HeartPulse,
  Send, Phone, MessageSquare, CreditCard, Banknote, UserPlus, Activity,
  CalendarClock, Pill, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyCustomers() {
  const { user } = useAuth();
  const location = useLocation();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/khata') ? 'KHATA' :
    location.pathname.includes('/refills') ? 'REFILLS' : 'DIRECTORY'
  );

  useEffect(() => {
    if (location.pathname.includes('/khata')) {
      setActiveTab('KHATA');
    } else if (location.pathname.includes('/refills')) {
      setActiveTab('REFILLS');
    } else if (location.pathname.includes('/customers')) {
      setActiveTab('DIRECTORY');
    }
  }, [location.pathname]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalPatients: 0,
    totalKhataReceivables: 0,
    totalPatientsWithKhata: 0,
    totalChronicPatients: 0,
    dueForRefillCount: 0
  });
  const [refillAlerts, setRefillAlerts] = useState([]);
  const [liveMedicines, setLiveMedicines] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [chronicFilter, setChronicFilter] = useState('ALL');
  const [khataFilter, setKhataFilter] = useState('ALL');
  const [refillFilter, setRefillFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Repayment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Add Patient Form State
  const initialFormState = {
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'MALE',
    address: '',
    bloodGroup: 'B+',
    allergies: '',
    chronicConditions: [],
    doctorName: '',
    doctorRegNo: '',
    doctorClinic: '',
    khataEnabled: false,
    creditLimit: '5000',
    initialBalance: '',
    notes: '',
    // Chronic medications list
    chronicMedications: [
      { brandName: '', dosage: '1 Tablet Daily', dailyFrequency: '1-0-0', daysSupply: 30, notes: '' }
    ]
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch all customers, summary & refill alerts
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [custRes, refillRes, medRes] = await Promise.all([
        api.get('/pharmacy/customers').catch(() => ({ data: { data: { customers: [] }, summary: {} } })),
        api.get('/pharmacy/customers/refill-alerts').catch(() => ({ data: { data: { refillAlerts: [] } } })),
        api.get('/pharmacy/medicines').catch(() => ({ data: { data: { medicines: [] } } }))
      ]);

      if (custRes.data?.data?.customers) {
        setCustomers(custRes.data.data.customers);
      }
      if (custRes.data?.summary) {
        setSummary(custRes.data.summary);
      }
      if (refillRes.data?.data?.refillAlerts) {
        setRefillAlerts(refillRes.data.data.refillAlerts);
      }
      if (medRes.data?.data?.medicines) {
        setLiveMedicines(medRes.data.data.medicines);
      }
    } catch (err) {
      console.error('Failed to load pharmacy customer directory:', err);
      toast.error('Unable to fetch patient directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered patients
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.preferredDoctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (chronicFilter !== 'ALL' && (!c.chronicConditions || !c.chronicConditions.includes(chronicFilter))) {
        return false;
      }

      if (khataFilter === 'HAS_BALANCE' && (!c.khata?.isEnabled || (c.khata.currentBalance || 0) <= 0)) {
        return false;
      }
      if (khataFilter === 'ENABLED' && !c.khata?.isEnabled) {
        return false;
      }

      if (refillFilter !== 'ALL' && c.refillStatus !== refillFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchTerm, chronicFilter, khataFilter, refillFilter]);

  // Handle Add Patient Submission
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Patient Name and Phone number are required');
      return;
    }

    try {
      setIsSubmitting(true);

      const validMeds = formData.chronicMedications
        .filter(m => m.brandName && m.brandName.trim())
        .map(m => ({
          brandName: m.brandName.trim(),
          dosage: m.dosage,
          dailyFrequency: m.dailyFrequency,
          daysSupply: Number(m.daysSupply) || 30,
          notes: m.notes
        }));

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
        address: formData.address?.trim() || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
        chronicConditions: formData.chronicConditions,
        preferredDoctor: {
          name: formData.doctorName?.trim() || undefined,
          registrationNumber: formData.doctorRegNo?.trim() || undefined,
          hospitalClinic: formData.doctorClinic?.trim() || undefined
        },
        chronicMedications: validMeds,
        khata: {
          isEnabled: formData.khataEnabled,
          creditLimit: Number(formData.creditLimit) || 5000,
          status: 'ACTIVE'
        },
        initialBalance: formData.khataEnabled && formData.initialBalance ? Number(formData.initialBalance) : 0,
        notes: formData.notes
      };

      const res = await api.post('/pharmacy/customers', payload);
      if (res.data?.status === 'success') {
        toast.success(`Patient profile for ${formData.name} created!`);
        setShowAddModal(false);
        setFormData(initialFormState);
        fetchData(true);
      }
    } catch (err) {
      console.error('Error creating patient:', err);
      const msg = err.response?.data?.message || 'Failed to register patient';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Khata Repayment Submission
  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/pharmacy/customers/${selectedCustomer._id}/khata-payment`, {
        amount,
        paymentMethod: paymentMode,
        referenceNumber: paymentRef,
        notes: paymentNotes
      });

      if (res.data?.status === 'success') {
        toast.success(`Repayment of ₹${amount.toFixed(2)} recorded for ${selectedCustomer.name}!`);
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentRef('');
        setPaymentNotes('');
        fetchData(true);

        // Update selected customer if profile modal is open
        if (selectedCustomer) {
          const updatedCust = res.data?.data?.customer;
          setSelectedCustomer(updatedCust);
        }
      }
    } catch (err) {
      console.error('Failed to record repayment:', err);
      const msg = err.response?.data?.message || 'Failed to record repayment';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Full Patient Profile & Ledger
  const handleViewProfile = async (customer) => {
    try {
      const res = await api.get(`/pharmacy/customers/${customer._id}`);
      if (res.data?.data?.customer) {
        setSelectedCustomer(res.data.data.customer);
      } else {
        setSelectedCustomer(customer);
      }
      setShowProfileModal(true);
    } catch (err) {
      console.error('Error fetching patient profile:', err);
      setSelectedCustomer(customer);
      setShowProfileModal(true);
    }
  };

  // Helper for adding medication line in modal
  const handleAddMedicationLine = () => {
    setFormData(prev => ({
      ...prev,
      chronicMedications: [
        ...prev.chronicMedications,
        { brandName: '', dosage: '1 Tablet Daily', dailyFrequency: '1-0-0', daysSupply: 30, notes: '' }
      ]
    }));
  };

  const handleRemoveMedicationLine = (idx) => {
    setFormData(prev => ({
      ...prev,
      chronicMedications: prev.chronicMedications.filter((_, i) => i !== idx)
    }));
  };

  const handleMedicationChange = (idx, field, value) => {
    setFormData(prev => {
      const updated = [...prev.chronicMedications];
      updated[idx][field] = value;
      return { ...prev, chronicMedications: updated };
    });
  };

  const toggleChronicCondition = (condition) => {
    setFormData(prev => {
      const exists = prev.chronicConditions.includes(condition);
      return {
        ...prev,
        chronicConditions: exists 
          ? prev.chronicConditions.filter(c => c !== condition)
          : [...prev.chronicConditions, condition]
      };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-teal-600" />
              <span>Patient Directory & Khata Ledger</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Phase 5
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Chronic prescription maintenance, automated refill alerts, and store credit (Khata) accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh patient records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: effectivePrimary }}
            className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {summary.totalPatients}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Active patient profiles registered
          </p>
        </div>

        {/* Chronic Care Book */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Chronic Care Patients
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {summary.totalChronicPatients}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Diabetic / Cardiac ongoing regimens
          </p>
        </div>

        {/* Khata Store Receivables */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Khata Store Credit
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{Number(summary.totalKhataReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.totalPatientsWithKhata} Accounts with active balance
          </p>
        </div>

        {/* Refill Alerts Due */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Refill Reminders Due
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {refillAlerts.length}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Medicines due within 7 days or overdue
          </p>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DIRECTORY'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Directory</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'DIRECTORY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REFILLS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'REFILLS'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Chronic Refill Alerts</span>
          {refillAlerts.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'REFILLS' ? 'bg-white/20 text-white' : 'bg-rose-500 text-white animate-pulse'
            }`}>
              {refillAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('KHATA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'KHATA'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Khata Credit Ledger</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'KHATA' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            ₹{Number(summary.totalKhataReceivables || 0).toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      {/* TAB 1: PATIENT DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Patient Name, Phone, Doctor, or Address..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Chronic Filter */}
              <select
                value={chronicFilter}
                onChange={(e) => setChronicFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">All Medical Conditions</option>
                <option value="HYPERTENSION">Hypertension (BP)</option>
                <option value="DIABETES">Diabetes</option>
                <option value="CARDIAC">Cardiac Care</option>
                <option value="ASTHMA_COPD">Asthma / Respiratory</option>
                <option value="THYROID">Thyroid</option>
              </select>

              {/* Khata Filter */}
              <select
                value={khataFilter}
                onChange={(e) => setKhataFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">All Khata Status</option>
                <option value="HAS_BALANCE">Has Outstanding Balance</option>
                <option value="ENABLED">Khata Enabled</option>
              </select>

              {/* Refill Status Filter */}
              <select
                value={refillFilter}
                onChange={(e) => setRefillFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">All Refill Timelines</option>
                <option value="OVERDUE">Overdue Refills</option>
                <option value="DUE_SOON">Due in 7 Days</option>
                <option value="SCHEDULED">Future Refill</option>
              </select>
            </div>
          </div>

          {/* Patient Directory Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Chronic Conditions</th>
                    <th className="px-4 py-3.5">Chronic Meds</th>
                    <th className="px-4 py-3.5">Refill Status</th>
                    <th className="px-4 py-3.5">Khata Balance</th>
                    <th className="px-4 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        <p className="font-semibold text-xs">Loading patient directory...</p>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-bold text-sm text-slate-600">No patients found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new patient.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => {
                      const balance = customer.khata?.currentBalance || 0;
                      const limit = customer.khata?.creditLimit || 5000;
                      const hasKhata = customer.khata?.isEnabled;

                      return (
                        <tr key={customer._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 text-xs shrink-0">
                                {customer.name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer" onClick={() => handleViewProfile(customer)}>
                                  {customer.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span>{customer.age ? `${customer.age} Y` : ''} {customer.gender !== 'UNKNOWN' ? `• ${customer.gender}` : ''}</span>
                                  <span>• Ph: <strong className="text-slate-700">{customer.phone}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[170px]">
                              {customer.chronicConditions && customer.chronicConditions.length > 0 ? (
                                customer.chronicConditions.map((cond, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {cond}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400">General Care</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5 max-w-[180px]">
                              {customer.chronicMedications && customer.chronicMedications.length > 0 ? (
                                customer.chronicMedications.map((med, idx) => (
                                  <p key={idx} className="text-[11px] font-semibold text-slate-800 truncate">
                                    • {med.brandName}
                                  </p>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400">No chronic meds</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {customer.refillStatus === 'OVERDUE' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-max">
                                <AlertCircle className="w-3 h-3" />
                                Refill Overdue
                              </span>
                            ) : customer.refillStatus === 'DUE_SOON' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
                                <Clock className="w-3 h-3" />
                                Due Soon
                              </span>
                            ) : customer.refillStatus === 'SCHEDULED' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
                                <Check className="w-3 h-3" />
                                On Schedule
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">N/A</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            {hasKhata ? (
                              <div>
                                <span className={`font-extrabold text-xs ${balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                  ₹{balance.toFixed(2)}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Limit: ₹{limit.toLocaleString('en-IN')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                Cash / UPI Only
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            <p className="font-semibold text-slate-900 truncate max-w-[140px]">
                              {customer.preferredDoctor?.name || 'Walk-in / General'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {customer.preferredDoctor?.registrationNumber ? `Reg: ${customer.preferredDoctor.registrationNumber}` : ''}
                            </p>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {hasKhata && balance > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setPaymentAmount(balance.toString());
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-colors flex items-center gap-1"
                                  title="Record Khata Repayment"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Pay Khata</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleViewProfile(customer)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                                title="View Patient Profile & Ledger"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* TAB 2: CHRONIC REFILL ALERTS */}
      {activeTab === 'REFILLS' && (
        <div className="space-y-4">
          
          <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-3xl p-6 shadow-md border border-teal-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 px-2 py-0.5 rounded bg-teal-800/80 border border-teal-700">
                PROACTIVE PHARMACIST OUTREACH
              </span>
              <h3 className="text-xl font-black mt-2 tracking-tight">
                Chronic Patient Refill Book & Direct Reminders
              </h3>
              <p className="text-xs text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
                Patients with maintenance regimens (BP, diabetes, cardiac) scheduled for monthly replenishment within the next 7 days. Send instant WhatsApp alerts with a single click to prepare advance dispensing.
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-teal-200">Refill Action Queue</span>
              <p className="text-2xl font-black text-white">{refillAlerts.length} Patients</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Patient Contact</th>
                    <th className="px-4 py-3.5">Prescribed Medicine</th>
                    <th className="px-4 py-3.5">Dosage Regimen</th>
                    <th className="px-4 py-3.5">Supply Days</th>
                    <th className="px-4 py-3.5">Due Date & Timeline</th>
                    <th className="px-4 py-3.5">Prescribing Doctor</th>
                    <th className="px-5 py-3.5 text-right">Instant Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {refillAlerts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">All Chronic Refills Up to Date!</p>
                        <p className="text-xs text-slate-400 mt-0.5">No patients have prescription refills due within the upcoming 7 days.</p>
                      </td>
                    </tr>
                  ) : (
                    refillAlerts.map((alert, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 text-xs">{alert.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{alert.phone}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-teal-800 text-xs">{alert.medicineBrand}</span>
                          <div className="flex gap-1 mt-0.5">
                            {alert.chronicConditions?.map((c, i) => (
                              <span key={i} className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700">
                          <span className="font-medium">{alert.dosage}</span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {alert.daysSupply} Days Supply
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            alert.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : alert.status === 'DUE_TODAY'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}>
                            {alert.daysLeft < 0 ? `Overdue by ${Math.abs(alert.daysLeft)} days` : alert.daysLeft === 0 ? 'Due Today' : `Due in ${alert.daysLeft} days`}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Refill: {new Date(alert.nextRefillDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          <p className="font-medium text-slate-900 truncate max-w-[140px]">{alert.preferredDoctor || 'General'}</p>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {alert.whatsAppUrl ? (
                            <a
                              href={alert.whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp Reminder</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => toast.success(`Call reminder placed to ${alert.phone}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Patient</span>
                            </button>
                          )}
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

      {/* TAB 3: KHATA CREDIT LEDGER */}
      {activeTab === 'KHATA' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 px-2 py-0.5 rounded bg-amber-100 border border-amber-200">
                STORE CREDIT RISK & ACCOUNTS RECEIVABLE
              </span>
              <h3 className="text-xl font-black mt-2 text-slate-900 tracking-tight">
                Pharmacy Khata Credit Management
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Retail store credit provided to verified local families and chronic patients. Track running debit invoices, repayments, and exposure limits to prevent bad debts.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Outstanding</span>
                <p className="text-2xl font-black text-amber-800">
                  ₹{Number(summary.totalKhataReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Khata Debtors Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Patient / Account Holder</th>
                    <th className="px-4 py-3.5">Credit Limit</th>
                    <th className="px-4 py-3.5">Current Balance Due</th>
                    <th className="px-4 py-3.5">Credit Utilization</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Settle & Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customers.filter(c => c.khata?.isEnabled).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-bold text-sm text-slate-600">No active Khata credit accounts</p>
                        <p className="text-xs text-slate-400 mt-1">Enable Khata for trustworthy customers to offer monthly store billing.</p>
                      </td>
                    </tr>
                  ) : (
                    customers
                      .filter(c => c.khata?.isEnabled)
                      .sort((a, b) => (b.khata?.currentBalance || 0) - (a.khata?.currentBalance || 0))
                      .map(customer => {
                        const balance = customer.khata?.currentBalance || 0;
                        const limit = customer.khata?.creditLimit || 5000;
                        const pct = Math.min(100, Math.round((balance / limit) * 100));

                        return (
                          <tr key={customer._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-slate-900 text-xs">{customer.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ph: {customer.phone}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{customer.address}</p>
                            </td>

                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              ₹{limit.toLocaleString('en-IN')}
                            </td>

                            <td className="px-4 py-3.5">
                              <span className={`text-sm font-black ${balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                ₹{balance.toFixed(2)}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="w-36">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                  <span>{pct}% Used</span>
                                  <span>₹{(limit - balance).toFixed(0)} Left</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                customer.khata?.status === 'ACTIVE' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {customer.khata?.status || 'ACTIVE'}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {balance > 0 && (
                                  <button
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setPaymentAmount(balance.toString());
                                      setShowPaymentModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Receive Repayment</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleViewProfile(customer)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                                >
                                  Ledger Statement
                                </button>
                              </div>
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

      {/* MODAL 1: ADD NEW PATIENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Register New Patient Profile</h3>
                <p className="text-xs text-slate-500">Record chronic disease tags, preferred doctor, and Khata store credit limit</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-5">
              
              {/* Basic Demographic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    placeholder="e.g. Suresh Ganguly"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    placeholder="e.g. 9830012345"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                      placeholder="e.g. 48"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Known Drug Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    placeholder="e.g. Block B, Lake Gardens, Kolkata - 700045"
                  />
                </div>
              </div>

              {/* Chronic Disease Categories Checklist */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Chronic Care Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'HYPERTENSION', label: 'Hypertension (BP)' },
                    { id: 'DIABETES', label: 'Diabetes' },
                    { id: 'CARDIAC', label: 'Cardiac Care' },
                    { id: 'ASTHMA_COPD', label: 'Asthma / COPD' },
                    { id: 'THYROID', label: 'Thyroid' },
                    { id: 'KIDNEY', label: 'Renal / Kidney' },
                    { id: 'ARTHRITIS', label: 'Arthritis' }
                  ].map(c => {
                    const isSelected = formData.chronicConditions.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleChronicCondition(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prescribing Doctor Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Primary Prescribing Doctor (Optional)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    placeholder="Doctor Name (e.g. Dr. A. K. Banerjee)"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.doctorRegNo}
                    onChange={(e) => setFormData({ ...formData, doctorRegNo: e.target.value })}
                    placeholder="Medical Council Reg (WBMC-38291)"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.doctorClinic}
                    onChange={(e) => setFormData({ ...formData, doctorClinic: e.target.value })}
                    placeholder="Clinic / Hospital Name"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Chronic Medications Regimen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Ongoing Chronic Medicines & Refill Timelines
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMedicationLine}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.chronicMedications.map((med, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex-1 min-w-[150px]">
                        <input
                          type="text"
                          value={med.brandName}
                          onChange={(e) => handleMedicationChange(idx, 'brandName', e.target.value)}
                          placeholder="Medicine Brand (e.g. Telma 40)"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                          placeholder="1 Tab Daily"
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium"
                        />
                      </div>
                      <div className="w-24">
                        <select
                          value={med.daysSupply}
                          onChange={(e) => handleMedicationChange(idx, 'daysSupply', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium"
                        >
                          <option value="15">15 Days</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                      {formData.chronicMedications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationLine(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Khata Store Credit Option */}
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-950">Enable Khata (Store Credit) Account</span>
                    <p className="text-[11px] text-teal-800">Allows customer to take counter medicines on credit and settle monthly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.khataEnabled}
                    onChange={(e) => setFormData({ ...formData, khataEnabled: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                </div>

                {formData.khataEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-teal-200 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={formData.creditLimit}
                        onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-bold"
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">Opening Debt Balance (₹)</label>
                      <input
                        type="number"
                        value={formData.initialBalance}
                        onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectivePrimary }}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Patient Record</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: RECORD KHATA REPAYMENT */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Khata Settlement</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Record Credit Repayment</h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordRepayment} className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ph: {selectedCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</span>
                  <p className="text-lg font-black text-amber-800">
                    ₹{Number(selectedCustomer.khata?.currentBalance || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter amount paid"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5 font-bold">
                  {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`p-2 rounded-xl border text-[11px] transition-colors ${
                        paymentMode === m 
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reference / UTR / Receipt No</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  placeholder="e.g. UPI/28491028491 or Cash Receipt"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pharmacist Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  placeholder="e.g. Monthly clearance payment"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Payment...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Record Payment & Update Ledger</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: PATIENT CHRONIC BOOK & KHATA STATEMENT SLIDE-OVER */}
      {showProfileModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Patient Electronic Health Record</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedCustomer.name}</h3>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              
              {/* Patient Demographics & Doctor Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Age / Gender</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.age || 'N/A'} Y • {selectedCustomer.gender}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Known Allergies</span>
                  <p className="font-bold text-rose-600 mt-0.5 truncate">{selectedCustomer.allergies?.join(', ') || 'None Reported'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Preferred Doctor</span>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{selectedCustomer.preferredDoctor?.name || 'Walk-in'}</p>
                </div>
              </div>

              {/* Chronic Care Regimen */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Prescribed Chronic Medications & Refill Cadence</span>
                </h4>
                {selectedCustomer.chronicMedications && selectedCustomer.chronicMedications.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedCustomer.chronicMedications.map((med, i) => (
                      <div key={i} className="p-3 bg-white flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{med.brandName}</p>
                          <p className="text-[11px] text-slate-500">{med.dosage} • Cadence: {med.dailyFrequency}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                            {med.daysSupply} Days Refill Cycle
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Next Refill: {med.nextRefillDate ? new Date(med.nextRefillDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No chronic medications added to this patient profile.</p>
                )}
              </div>

              {/* Khata Credit Statement & Ledger */}
              {selectedCustomer.khata?.isEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>Khata Store Credit Ledger & Audit Trail</span>
                    </h4>
                    <span className="font-black text-amber-800 text-xs">
                      Outstanding: ₹{Number(selectedCustomer.khata.currentBalance || 0).toFixed(2)} / ₹{Number(selectedCustomer.khata.creditLimit || 0).toLocaleString('en-IN')} Limit
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Reference</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-right">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {selectedCustomer.ledger && selectedCustomer.ledger.length > 0 ? (
                          selectedCustomer.ledger.map((entry, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-slate-500 font-sans">
                                {new Date(entry.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </td>
                              <td className="px-3 py-2 font-bold font-sans">
                                {entry.type.startsWith('DEBIT') ? (
                                  <span className="text-amber-700">SALE DEBIT</span>
                                ) : (
                                  <span className="text-emerald-700">REPAYMENT</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-700 font-sans">
                                {entry.billNumber || entry.referenceNumber || entry.notes || 'Khata entry'}
                              </td>
                              <td className={`px-3 py-2 text-right font-bold ${entry.type.startsWith('DEBIT') ? 'text-amber-800' : 'text-emerald-700'}`}>
                                {entry.type.startsWith('DEBIT') ? `+₹${entry.amount.toFixed(2)}` : `-₹${entry.amount.toFixed(2)}`}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                ₹{entry.balanceAfter.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-slate-400 font-sans text-xs">
                              No prior Khata ledger transactions.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                {selectedCustomer.khata?.isEnabled && (selectedCustomer.khata.currentBalance || 0) > 0 && (
                  <button
                    onClick={() => {
                      setPaymentAmount(selectedCustomer.khata.currentBalance.toString());
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Record Repayment</span>
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Health Profile</span>
                </button>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
