import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Calendar, Clock, DollarSign, Plus, Search, Filter, 
  CheckCircle2, XCircle, AlertCircle, Phone, Mail, Award, 
  ChefHat, Coffee, Utensils, Shield, Sparkles, RefreshCw, 
  Check, X, ChevronRight, Edit3, Trash2, UserPlus, LogIn, 
  LogOut, Wallet, ArrowRight, Layers, FileSpreadsheet, Send,
  CreditCard, TrendingUp, Building2, UserCheck, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

const DEPARTMENTS = [
  { id: 'ALL', label: 'All Departments' },
  { id: 'KITCHEN_BOH', label: 'Kitchen (BOH)', icon: ChefHat, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'SERVICE_FOH', label: 'Service & Dining (FOH)', icon: Utensils, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { id: 'BAR_BEVERAGE', label: 'Bar & Beverage', icon: Coffee, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'MANAGEMENT', label: 'Management', icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping', icon: Building2, color: 'text-slate-600 bg-slate-100 border-slate-200' },
];

const ROLES = [
  { id: 'HEAD_CHEF', label: 'Head Chef', dept: 'KITCHEN_BOH', defaultWeight: 1.2 },
  { id: 'SOUS_CHEF', label: 'Sous Chef', dept: 'KITCHEN_BOH', defaultWeight: 1.1 },
  { id: 'LINE_COOK', label: 'Line Cook', dept: 'KITCHEN_BOH', defaultWeight: 1.0 },
  { id: 'COMMIS_CHEF', label: 'Commis Chef', dept: 'KITCHEN_BOH', defaultWeight: 0.9 },
  { id: 'HEAD_STEWARD', label: 'Head Steward / Captain', dept: 'SERVICE_FOH', defaultWeight: 1.3 },
  { id: 'STEWARD', label: 'Steward / Waiter', dept: 'SERVICE_FOH', defaultWeight: 1.0 },
  { id: 'BUSSER', label: 'Busser / Runner', dept: 'SERVICE_FOH', defaultWeight: 0.8 },
  { id: 'BARISTA', label: 'Barista / Bartender', dept: 'BAR_BEVERAGE', defaultWeight: 1.1 },
  { id: 'CASHIER', label: 'POS Cashier', dept: 'SERVICE_FOH', defaultWeight: 1.0 },
  { id: 'RESTAURANT_MANAGER', label: 'Restaurant Manager', dept: 'MANAGEMENT', defaultWeight: 1.4 },
  { id: 'CLEANER', label: 'Kitchen Steward / Dishwasher', dept: 'HOUSEKEEPING', defaultWeight: 0.8 },
];

const SHIFT_TYPES = [
  { id: 'MORNING_OPENING', label: 'Morning Opening (08:00 - 15:00)', defaultStart: '08:00', defaultEnd: '15:00' },
  { id: 'LUNCH_PEAK', label: 'Lunch Peak Shift (11:00 - 17:00)', defaultStart: '11:00', defaultEnd: '17:00' },
  { id: 'EVENING_DINNER', label: 'Dinner Shift (17:00 - 23:30)', defaultStart: '17:00', defaultEnd: '23:30' },
  { id: 'DOUBLE_SHIFT', label: 'All-Day Double Shift (11:00 - 22:30)', defaultStart: '11:00', defaultEnd: '22:30' },
  { id: 'NIGHT_CLOSING', label: 'Night Closing (19:00 - 02:00)', defaultStart: '19:00', defaultEnd: '02:00' },
  { id: 'OFF_DUTY', label: 'Scheduled Weekly Off', defaultStart: '00:00', defaultEnd: '00:00' }
];

export default function RestaurantStaff() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Date selection
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster', 'tips', 'directory'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [tipsAnalytics, setTipsAnalytics] = useState(null);
  const [tipPools, setTipPools] = useState([]);

  // Filter states
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [editingRosterShift, setEditingRosterShift] = useState(null);
  const [isTipCalcModalOpen, setIsTipCalcModalOpen] = useState(false);
  const [activeTipPoolView, setActiveTipPoolView] = useState(null);

  // Staff Form State (adheres to React Number Inputs rule: preserves empty string "")
  const [staffForm, setStaffForm] = useState({
    employeeCode: '',
    name: '',
    phone: '',
    email: '',
    role: 'STEWARD',
    department: 'SERVICE_FOH',
    hourlyWage: '120',
    monthlySalary: '22000',
    tipShareWeight: '1.0',
    status: 'ACTIVE',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    notes: ''
  });

  // Roster Shift Form State
  const [rosterForm, setRosterForm] = useState({
    staffId: '',
    date: todayStr,
    shiftType: 'LUNCH_PEAK',
    scheduledStartTime: '11:00',
    scheduledEndTime: '17:00',
    station: 'Main Dining Floor',
    notes: ''
  });

  // Tip Pool Form State (preserves empty string for number inputs)
  const [tipForm, setTipForm] = useState({
    poolDate: todayStr,
    shiftPeriod: 'FULL_DAY',
    cashTips: '0',
    digitalTips: '0',
    serviceChargeCollected: '0',
    distributionFormula: 'ROLE_WEIGHTED',
    notes: ''
  });

  // Fetch all staff and roster data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [staffRes, rosterRes, analyticsRes, tipsAnalyticsRes, poolsRes] = await Promise.all([
        api.get('/restaurant/staff'),
        api.get(`/restaurant/staff-roster?date=${selectedDate}`),
        api.get('/restaurant/staff/analytics'),
        api.get(`/restaurant/staff-tips/analytics?date=${selectedDate}`),
        api.get('/restaurant/staff-tips')
      ]);

      if (staffRes.data?.data) setStaffList(staffRes.data.data.staff || []);
      if (rosterRes.data?.data) setRosterList(rosterRes.data.data.roster || []);
      if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
      if (tipsAnalyticsRes.data?.data) {
        setTipsAnalytics(tipsAnalyticsRes.data.data);
        // Pre-fill tip form service charge from bills
        if (tipsAnalyticsRes.data.data.autoServiceChargeToday > 0) {
          setTipForm(prev => ({
            ...prev,
            serviceChargeCollected: String(tipsAnalyticsRes.data.data.autoServiceChargeToday)
          }));
        }
      }
      if (poolsRes.data?.data) setTipPools(poolsRes.data.data.pools || []);
    } catch (err) {
      console.error('Failed to load restaurant staff data:', err);
      toast.error('Unable to fetch staff and roster data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Add/Edit Staff Modal
  const handleOpenStaffModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffForm({
        employeeCode: staff.employeeCode || '',
        name: staff.name || '',
        phone: staff.phone || '',
        email: staff.email || '',
        role: staff.role || 'STEWARD',
        department: staff.department || 'SERVICE_FOH',
        hourlyWage: String(staff.hourlyWage || 0),
        monthlySalary: String(staff.monthlySalary || 0),
        tipShareWeight: String(staff.tipShareWeight || 1.0),
        status: staff.status || 'ACTIVE',
        accountName: staff.bankDetails?.accountName || '',
        accountNumber: staff.bankDetails?.accountNumber || '',
        ifscCode: staff.bankDetails?.ifscCode || '',
        upiId: staff.bankDetails?.upiId || '',
        emergencyName: staff.emergencyContact?.name || '',
        emergencyPhone: staff.emergencyContact?.phone || '',
        emergencyRelation: staff.emergencyContact?.relation || '',
        notes: staff.notes || ''
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        employeeCode: '',
        name: '',
        phone: '',
        email: '',
        role: 'STEWARD',
        department: 'SERVICE_FOH',
        hourlyWage: '120',
        monthlySalary: '22000',
        tipShareWeight: '1.0',
        status: 'ACTIVE',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelation: '',
        notes: ''
      });
    }
    setIsStaffModalOpen(true);
  };

  // Save Staff
  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.phone.trim()) {
      toast.error('Staff name and phone number are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employeeCode: staffForm.employeeCode.trim() || undefined,
        name: staffForm.name.trim(),
        phone: staffForm.phone.trim(),
        email: staffForm.email.trim() || undefined,
        role: staffForm.role,
        department: staffForm.department,
        hourlyWage: Number(staffForm.hourlyWage) || 0,
        monthlySalary: Number(staffForm.monthlySalary) || 0,
        tipShareWeight: Number(staffForm.tipShareWeight) >= 0 ? Number(staffForm.tipShareWeight) : 1.0,
        status: staffForm.status,
        emergencyContact: {
          name: staffForm.emergencyName,
          phone: staffForm.emergencyPhone,
          relation: staffForm.emergencyRelation
        },
        bankDetails: {
          accountName: staffForm.accountName,
          accountNumber: staffForm.accountNumber,
          ifscCode: staffForm.ifscCode,
          upiId: staffForm.upiId
        },
        notes: staffForm.notes
      };

      if (editingStaff) {
        await api.put(`/restaurant/staff/${editingStaff._id}`, payload);
        toast.success('Staff profile updated');
      } else {
        await api.post('/restaurant/staff', payload);
        toast.success('Staff member registered');
      }

      setIsStaffModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Staff submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Roster Shift Modal
  const handleOpenRosterModal = (shift = null) => {
    if (shift) {
      setEditingRosterShift(shift);
      setRosterForm({
        staffId: shift.staffId?._id || shift.staffId || '',
        date: shift.date ? shift.date.split('T')[0] : selectedDate,
        shiftType: shift.shiftType || 'LUNCH_PEAK',
        scheduledStartTime: shift.scheduledStartTime || '11:00',
        scheduledEndTime: shift.scheduledEndTime || '17:00',
        station: shift.station || 'Main Dining Floor',
        notes: shift.notes || ''
      });
    } else {
      setEditingRosterShift(null);
      setRosterForm({
        staffId: staffList[0]?._id || '',
        date: selectedDate,
        shiftType: 'LUNCH_PEAK',
        scheduledStartTime: '11:00',
        scheduledEndTime: '17:00',
        station: 'Main Dining Floor',
        notes: ''
      });
    }
    setIsRosterModalOpen(true);
  };

  // Save Roster Shift
  const handleSubmitRosterShift = async (e) => {
    e.preventDefault();
    if (!rosterForm.staffId || !rosterForm.scheduledStartTime || !rosterForm.scheduledEndTime) {
      toast.error('Please fill staff member and scheduled shift times');
      return;
    }

    try {
      setSubmitting(true);
      if (editingRosterShift) {
        await api.put(`/restaurant/staff-roster/${editingRosterShift._id}`, rosterForm);
        toast.success('Shift schedule updated');
      } else {
        await api.post('/restaurant/staff-roster', rosterForm);
        toast.success('Shift assigned successfully');
      }

      setIsRosterModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Roster error:', err);
      toast.error(err.response?.data?.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  // Clock In / Clock Out
  const handleClockIn = async (shiftId) => {
    try {
      await api.post(`/restaurant/staff-roster/${shiftId}/clock-in`);
      toast.success('Clock-in recorded! Shift active.');
      fetchData(true);
    } catch (err) {
      toast.error('Clock-in failed');
    }
  };

  const handleClockOut = async (shiftId) => {
    try {
      const res = await api.post(`/restaurant/staff-roster/${shiftId}/clock-out`);
      toast.success(`Clock-out recorded! Logged ${res.data?.data?.shift?.actualHoursWorked} hrs.`);
      fetchData(true);
    } catch (err) {
      toast.error('Clock-out failed');
    }
  };

  // Delete Shift
  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Remove this scheduled shift?')) return;
    try {
      await api.delete(`/restaurant/staff-roster/${shiftId}`);
      toast.success('Shift removed from roster');
      fetchData(true);
    } catch (err) {
      toast.error('Failed to remove shift');
    }
  };

  // Calculate Tip Pool
  const handleCalculateTipPool = async (e) => {
    e.preventDefault();
    const total = (Number(tipForm.cashTips) || 0) + (Number(tipForm.digitalTips) || 0) + (Number(tipForm.serviceChargeCollected) || 0);
    if (total <= 0) {
      toast.error('Total gratuity & tip amount must be greater than ₹0');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/restaurant/staff-tips/calculate', {
        poolDate: tipForm.poolDate,
        shiftPeriod: tipForm.shiftPeriod,
        cashTips: Number(tipForm.cashTips) || 0,
        digitalTips: Number(tipForm.digitalTips) || 0,
        serviceChargeCollected: Number(tipForm.serviceChargeCollected) || 0,
        distributionFormula: tipForm.distributionFormula,
        notes: tipForm.notes
      });

      toast.success(`Tip pool of ₹${total.toLocaleString()} calculated!`);
      setIsTipCalcModalOpen(false);
      fetchData(true);
      if (res.data?.data?.pool) {
        setActiveTipPoolView(res.data.data.pool);
      }
    } catch (err) {
      console.error('Calculate tips error:', err);
      toast.error(err.response?.data?.message || 'Failed to calculate tip pool');
    } finally {
      setSubmitting(false);
    }
  };

  // Disburse Tip Pool
  const handleDisburseTipPool = async (poolId) => {
    if (!window.confirm('Disburse this gratuity pool to all staff members? Payout statuses will be set to PAID.')) return;
    try {
      setSubmitting(true);
      await api.post(`/restaurant/staff-tips/${poolId}/disburse`);
      toast.success('Gratuity pool disbursed and marked as PAID!');
      fetchData(true);
      if (activeTipPoolView?._id === poolId) {
        setActiveTipPoolView(prev => ({ ...prev, status: 'DISBURSED' }));
      }
    } catch (err) {
      toast.error('Failed to disburse tip pool');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered staff directory
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchCode = s.employeeCode?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q);
        const matchRole = s.role?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchRole) return false;
      }
      return true;
    });
  }, [staffList, selectedDept, searchQuery]);

  const summary = analytics?.summary || {
    totalStaff: 0,
    activeStaff: 0,
    scheduledToday: 0,
    clockedInToday: 0,
    monthlyPayroll: 0
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Staff Rostering, Attendance & Tips Pool
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  Live Attendance
                </span>
              </h1>
              <p className="text-sm text-slate-500">
                Shift scheduling, steward clock-in/out, live station allocation, and daily gratuity pool sharing.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === todayStr 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === tomorrowStr 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              Tomorrow
            </button>
            <div className="relative flex items-center pl-1 border-l border-slate-300">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 px-2 py-1 focus:outline-none cursor-pointer font-medium"
              />
            </div>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh staff data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {activeTab === 'roster' && (
            <button
              onClick={() => handleOpenRosterModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md shadow-orange-900/30 hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: effectivePrimary }}
            >
              <Plus className="w-4 h-4" />
              <span>Assign Shift</span>
            </button>
          )}

          {activeTab === 'tips' && (
            <button
              onClick={() => setIsTipCalcModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md shadow-orange-900/30 hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: effectivePrimary }}
            >
              <Wallet className="w-4 h-4" />
              <span>Calculate Tip Pool</span>
            </button>
          )}

          {activeTab === 'directory' && (
            <button
              onClick={() => handleOpenStaffModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md shadow-orange-900/30 hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: effectivePrimary }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Staff Headcount</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.totalStaff}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            <span className="text-emerald-400 font-semibold">{summary.activeStaff} Active</span> • BOH & FOH
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>On Duty (Clocked In)</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {summary.clockedInToday}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Working right now
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Today's Roster</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.scheduledToday}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Shifts rostered for {selectedDate === todayStr ? 'today' : selectedDate}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Service Charge & Tips</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">
            ₹{(tipsAnalytics?.todayTipsCollected || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Collected today from bills
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Monthly Payroll Liability</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            ₹{(summary.monthlyPayroll || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Estimated base monthly wages
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { id: 'roster', label: 'Shift Rostering & Attendance', icon: Clock },
          { id: 'tips', label: 'Gratuity & Tips Pool Sharing', icon: Wallet },
          { id: 'directory', label: 'Staff Directory & Roles', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                isSelected
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SHIFT ROSTERING & ATTENDANCE */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daily Shift Roster & Punch Clock</h2>
              <p className="text-xs text-slate-500">
                Track steward and kitchen line clock-in, overtime hours, and station coverage.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Showing <b className="text-slate-900">{rosterList.length}</b> scheduled shifts for {selectedDate}
            </div>
          </div>

          {rosterList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center bg-white">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">No Shifts Scheduled for {selectedDate}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Assign shifts to your kitchen and service staff to enable clock-in attendance tracking.
              </p>
              <button
                onClick={() => handleOpenRosterModal()}
                className="px-4 py-2 rounded-xl text-slate-900 font-semibold text-xs shadow hover:brightness-110 transition-all inline-flex items-center gap-1.5"
                style={{ backgroundColor: effectivePrimary }}
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Shift</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rosterList.map(shift => {
                const staff = shift.staffId || {};
                const isClockedIn = shift.status === 'CLOCKED_IN';
                const isClockedOut = shift.status === 'CLOCKED_OUT';

                return (
                  <div
                    key={shift._id}
                    className={`rounded-2xl border transition-all p-4 space-y-3 ${
                      isClockedIn
                        ? 'bg-slate-100/60 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : isClockedOut
                        ? 'bg-slate-50/50 border-slate-200 opacity-80'
                        : 'bg-slate-50 border-slate-300/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">
                            {staff.name || 'Staff Member'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                            {staff.employeeCode || 'EMP'}
                          </span>
                        </div>
                        <div className="text-xs text-orange-500 font-semibold mt-0.5">
                          {staff.role?.replace('_', ' ') || 'STEWARD'}
                        </div>
                      </div>

                      {/* Status Pill */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isClockedIn
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-pulse'
                          : isClockedOut
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        {shift.status}
                      </span>
                    </div>

                    {/* Shift & Station Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Shift Type:</span>
                        <span className="font-semibold text-slate-900">{shift.shiftType?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Scheduled Time:</span>
                        <span className="font-semibold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {shift.scheduledStartTime} - {shift.scheduledEndTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Station / Section:</span>
                        <span className="font-semibold text-amber-400">{shift.station || 'Floor'}</span>
                      </div>

                      {/* Actual hours logged */}
                      {shift.actualHoursWorked > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-emerald-400 font-bold">
                          <span>Hours Worked:</span>
                          <span>{shift.actualHoursWorked} hrs {shift.overtimeMinutes > 0 ? `(${shift.overtimeMinutes}m OT)` : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Clock-in / Clock-out Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 gap-2">
                      {!isClockedIn && !isClockedOut && (
                        <button
                          onClick={() => handleClockIn(shift._id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Clock In</span>
                        </button>
                      )}

                      {isClockedIn && (
                        <button
                          onClick={() => handleClockOut(shift._id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Clock Out</span>
                        </button>
                      )}

                      {isClockedOut && (
                        <div className="text-xs text-slate-500 italic flex items-center gap-1 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Shift completed</span>
                        </div>
                      )}

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenRosterModal(shift)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                          title="Edit Shift"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift._id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-500 border border-slate-300 hover:border-rose-300 transition-colors"
                          title="Remove Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRATUITY & TIPS POOL DISTRIBUTION */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daily Gratuity & Service Charge Pool</h2>
              <p className="text-xs text-slate-500">
                Transparent tip pooling, formula weighting (role vs hours), and automated UPI/cash disbursement.
              </p>
            </div>
            <button
              onClick={() => setIsTipCalcModalOpen(true)}
              className="px-4 py-2 rounded-xl text-slate-900 font-semibold text-xs shadow hover:brightness-110 transition-all flex items-center gap-1.5"
              style={{ backgroundColor: effectivePrimary }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Tip Pool</span>
            </button>
          </div>

          {/* Today's Pool Status Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50/50 border border-purple-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Auto-Detected Bill Service Charge Today</div>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{(tipsAnalytics?.autoServiceChargeToday || 0).toLocaleString()}
                </div>
                <div className="text-xs text-purple-700 font-medium mt-0.5">
                  Available to distribute among {staffList.filter(s => s.status === 'ACTIVE').length} eligible staff members
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setTipForm(prev => ({
                  ...prev,
                  serviceChargeCollected: String(tipsAnalytics?.autoServiceChargeToday || 0),
                  cashTips: '0',
                  digitalTips: '0'
                }));
                setIsTipCalcModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Split Today's Tips</span>
            </button>
          </div>

          {/* Active Tip Pool Breakdown View (if open or latest) */}
          {activeTipPoolView && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs">
                    Pool #{activeTipPoolView._id?.slice(-4).toUpperCase()}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Gratuity Distribution for {new Date(activeTipPoolView.poolDate).toLocaleDateString()}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    activeTipPoolView.status === 'DISBURSED' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {activeTipPoolView.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeTipPoolView.status !== 'DISBURSED' && (
                    <button
                      onClick={() => handleDisburseTipPool(activeTipPoolView._id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold text-xs flex items-center gap-1 shadow transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disburse Payouts</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTipPoolView(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pool Metrics */}
              <div className="grid grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Total Gratuity Pool:</span>
                  <div className="text-base font-bold text-emerald-400">₹{activeTipPoolView.totalTipsCollected?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-500">Distribution Formula:</span>
                  <div className="font-semibold text-slate-900">{activeTipPoolView.distributionFormula?.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-slate-500">Total Weighted Points:</span>
                  <div className="font-semibold text-slate-900">{activeTipPoolView.totalShares} pts</div>
                </div>
                <div>
                  <span className="text-slate-500">Rate per Point:</span>
                  <div className="font-semibold text-purple-400">₹{activeTipPoolView.tipPerShare}/pt</div>
                </div>
              </div>

              {/* Payouts Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100/80 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Staff Member</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Weight / Points</th>
                      <th className="py-2.5 px-3">Tip Share (₹)</th>
                      <th className="py-2.5 px-3">Payout Method / UPI</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTipPoolView.payouts?.map(p => (
                      <tr key={p._id || p.staffId} className="hover:bg-white">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.staffName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.role?.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{p.points}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600 text-sm">₹{p.calculatedTipAmount?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {p.upiId ? (
                            <span className="font-mono text-purple-700 flex items-center gap-1 font-semibold">
                              <Smartphone className="w-3 h-3 text-purple-600" />
                              {p.upiId}
                            </span>
                          ) : (
                            <span className="text-slate-500">Cash Payout</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.payoutStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {p.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historical Tip Pools List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Past Tip Pool Runs</h3>
            {tipPools.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
                No tip pool distributions recorded yet. Click "Create New Tip Pool" above.
              </div>
            ) : (
              <div className="space-y-2">
                {tipPools.map(pool => (
                  <div
                    key={pool._id}
                    onClick={() => setActiveTipPoolView(pool)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 cursor-pointer transition-all flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                        <Wallet className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          Gratuity Pool for {new Date(pool.poolDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {pool.distributionFormula?.replace('_', ' ')} • {pool.eligibleStaffCount || pool.payouts?.length} Staff Members
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-base font-bold text-emerald-600">
                          ₹{pool.totalTipsCollected?.toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          pool.status === 'DISBURSED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {pool.status}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF DIRECTORY & ROLES */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {DEPARTMENTS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDept === d.id
                      ? 'bg-orange-600 text-white font-semibold shadow'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaff.map(staff => {
              const deptObj = DEPARTMENTS.find(d => d.id === staff.department) || DEPARTMENTS[1];

              return (
                <div
                  key={staff._id}
                  className="rounded-2xl border border-slate-200 bg-white hover:border-orange-400 p-4 space-y-3 transition-all flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    {/* Top line: Code & Status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                        {staff.employeeCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        staff.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {staff.status}
                      </span>
                    </div>

                    {/* Name & Role */}
                    <div className="mt-2.5">
                      <h4 className="font-bold text-slate-900 text-base">{staff.name}</h4>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        {staff.role?.replace('_', ' ')}
                      </div>
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md border mt-1.5 ${deptObj.color}`}>
                        {deptObj.label}
                      </span>
                    </div>

                    {/* Contact & Compensation Details */}
                    <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mt-3">
                      <div className="flex items-center justify-between">
                        <span>Phone:</span>
                        <span className="text-slate-900 font-mono">{staff.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Monthly Wage:</span>
                        <span className="text-amber-600 font-semibold">₹{staff.monthlySalary?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tip Pool Weight:</span>
                        <span className="text-purple-600 font-bold">{staff.tipShareWeight || 1.0}x Points</span>
                      </div>
                      {staff.bankDetails?.upiId && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                          <span>UPI ID:</span>
                          <span className="text-purple-700 font-mono font-medium truncate max-w-[120px]">{staff.bankDetails.upiId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenStaffModal(staff)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setRosterForm(prev => ({
                          ...prev,
                          staffId: staff._id
                        }));
                        setIsRosterModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Assign Shift</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REGISTER / EDIT STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-400" />
                  {editingStaff ? 'Edit Staff Profile' : 'Register New Staff Member'}
                </h3>
                <p className="text-xs text-slate-500">Employee role, salary, tip share multiplier, and UPI details.</p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Roy"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9811001122"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Role & Title
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => {
                      const selectedRole = ROLES.find(r => r.id === e.target.value);
                      setStaffForm(prev => ({
                        ...prev,
                        role: e.target.value,
                        department: selectedRole?.dept || prev.department,
                        tipShareWeight: String(selectedRole?.defaultWeight || 1.0)
                      }));
                    }}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {ROLES.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {DEPARTMENTS.filter(d => d.id !== 'ALL').map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compensation & Tip Sharing Weight (Adheres to React Number Inputs rule) */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={staffForm.monthlySalary}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, monthlySalary: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Hourly Wage (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={staffForm.hourlyWage}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, hourlyWage: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tip Pool Weight (pts)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={staffForm.tipShareWeight}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, tipShareWeight: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* UPI & Bank Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    UPI ID (For Tip Payouts)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rahul@paytm"
                    value={staffForm.upiId}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, upiId: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional for salary transfer"
                    value={staffForm.accountNumber}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-slate-900 font-semibold text-xs shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingStaff ? 'Save Changes' : 'Register Staff'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ROSTER SHIFT MODAL */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                {editingRosterShift ? 'Edit Roster Shift' : 'Schedule Staff Shift'}
              </h3>
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRosterShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Staff Member <span className="text-orange-500">*</span>
                </label>
                <select
                  value={rosterForm.staffId}
                  onChange={(e) => setRosterForm(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {staffList.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Shift Type
                </label>
                <select
                  value={rosterForm.shiftType}
                  onChange={(e) => {
                    const selected = SHIFT_TYPES.find(st => st.id === e.target.value);
                    setRosterForm(prev => ({
                      ...prev,
                      shiftType: e.target.value,
                      scheduledStartTime: selected?.defaultStart || prev.scheduledStartTime,
                      scheduledEndTime: selected?.defaultEnd || prev.scheduledEndTime
                    }));
                  }}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {SHIFT_TYPES.map(st => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rosterForm.scheduledStartTime}
                    onChange={(e) => setRosterForm(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rosterForm.scheduledEndTime}
                    onChange={(e) => setRosterForm(prev => ({ ...prev, scheduledEndTime: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assigned Station / Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section A Tables, Main Bar, Kitchen Pass"
                  value={rosterForm.station}
                  onChange={(e) => setRosterForm(prev => ({ ...prev, station: e.target.value }))}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-slate-900 font-semibold text-xs shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Save Shift</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALCULATE TIP POOL MODAL */}
      {isTipCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Calculate Gratuity Pool
                </h3>
                <p className="text-xs text-slate-500">Distribute service charges and tips among active staff.</p>
              </div>
              <button
                onClick={() => setIsTipCalcModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalculateTipPool} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pool Date
                  </label>
                  <input
                    type="date"
                    required
                    value={tipForm.poolDate}
                    onChange={(e) => setTipForm(prev => ({ ...prev, poolDate: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Shift Period
                  </label>
                  <select
                    value={tipForm.shiftPeriod}
                    onChange={(e) => setTipForm(prev => ({ ...prev, shiftPeriod: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="FULL_DAY">Full Day (All Shifts)</option>
                    <option value="LUNCH">Lunch Shift Only</option>
                    <option value="DINNER">Dinner Shift Only</option>
                  </select>
                </div>
              </div>

              {/* Tips Sources (Preserving empty strings for number inputs) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-semibold text-slate-600 block">
                  Gratuity Sources Collected
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Service Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={tipForm.serviceChargeCollected}
                      onChange={(e) => setTipForm(prev => ({ ...prev, serviceChargeCollected: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Cash Tips (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={tipForm.cashTips}
                      onChange={(e) => setTipForm(prev => ({ ...prev, cashTips: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Card / UPI Tips (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={tipForm.digitalTips}
                      onChange={(e) => setTipForm(prev => ({ ...prev, digitalTips: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-300/60">
                  <span className="text-slate-500">Total Pool to Split:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ₹{((Number(tipForm.cashTips) || 0) + (Number(tipForm.digitalTips) || 0) + (Number(tipForm.serviceChargeCollected) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Distribution Formula
                </label>
                <select
                  value={tipForm.distributionFormula}
                  onChange={(e) => setTipForm(prev => ({ ...prev, distributionFormula: e.target.value }))}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="ROLE_WEIGHTED">Role Weighted (Head Chef 1.2x, Steward 1.0x, Busser 0.8x)</option>
                  <option value="EQUAL_SPLIT">Equal Split (1 Point per Staff Member)</option>
                  <option value="HOURS_WORKED_WEIGHTED">Hours Worked Weighted (Points * Hours on Shift)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTipCalcModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-900 font-semibold text-xs shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Calculate Payouts</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
