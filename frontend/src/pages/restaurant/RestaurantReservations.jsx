import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Clock, Users, Plus, Search, Filter, CheckCircle2, 
  XCircle, AlertCircle, Phone, Mail, Sparkles, MessageSquare, 
  Send, RefreshCw, Check, X, ChevronRight, UserCheck, Utensils, 
  ShieldCheck, AlertTriangle, ArrowRight, DollarSign, Gift, 
  Heart, Briefcase, Coffee, Edit3, Trash2, Layers, CalendarDays,
  CreditCard, Info, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const OCCASIONS = [
  { value: 'NONE', label: 'Standard Dining', icon: Coffee, color: 'text-slate-500 bg-stone-500/10' },
  { value: 'BIRTHDAY', label: 'Birthday Celebration', icon: Gift, color: 'text-pink-500 bg-pink-500/10' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
  { value: 'BUSINESS_DINNER', label: 'Business Meeting', icon: Briefcase, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'DATE_NIGHT', label: 'Date Night', icon: Heart, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'FAMILY_GATHERING', label: 'Family Gathering', icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
  { value: 'OTHER', label: 'Special Event', icon: Sparkles, color: 'text-amber-500 bg-amber-500/10' },
];

const DIETARY_TAGS = [
  { id: 'VEG', label: 'Pure Veg' },
  { id: 'NON_VEG', label: 'Non-Veg' },
  { id: 'JAIN', label: 'Jain / No Onion Garlic' },
  { id: 'VEGAN', label: 'Vegan' },
  { id: 'GLUTEN_FREE', label: 'Gluten Free' },
  { id: 'NUT_ALLERGY', label: 'Nut Allergy' },
  { id: 'SPICY_LOVER', label: 'Extra Spicy' },
  { id: 'LESS_OIL', label: 'Low Oil / Healthy' },
];

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

export default function RestaurantReservations() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';
  const navigate = useNavigate();

  // Date selection (default today YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'list'

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tablesList, setTablesList] = useState([]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [reservationToSeat, setReservationToSeat] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Smart table allocation states
  const [evaluatingTables, setEvaluatingTables] = useState(false);
  const [availableTablesData, setAvailableTablesData] = useState([]);
  const [recommendedTableId, setRecommendedTableId] = useState(null);

  // Form State (preserving empty strings for number inputs)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: '2',
    reservationDate: todayStr,
    timeSlot: '19:30',
    durationMinutes: '90',
    tableId: '',
    specialOccasion: 'NONE',
    dietaryPreferences: [],
    depositAmount: '0',
    depositStatus: 'NOT_REQUIRED',
    depositPaymentMethod: 'UPI',
    guestNotes: '',
    internalNotes: ''
  });

  // Seat Modal State
  const [seatForm, setSeatForm] = useState({
    tableId: '',
    createOrder: true
  });

  // Load Data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [resRes, analyticsRes, tablesRes] = await Promise.all([
        api.get(`/restaurant/reservations?date=${selectedDate}`),
        api.get(`/restaurant/reservations/analytics?date=${selectedDate}`),
        api.get('/restaurant/tables')
      ]);

      if (resRes.data?.data) {
        setReservations(resRes.data.data.reservations || []);
      }
      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }
      if (tablesRes.data?.data) {
        setTablesList(tablesRes.data.data.tables || []);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Evaluate Available Tables for Form Date & TimeSlot
  const checkAvailableTables = useCallback(async (date, slot, party, duration) => {
    if (!date || !slot) return;
    try {
      setEvaluatingTables(true);
      const res = await api.get(
        `/restaurant/reservations/available-tables?date=${date}&timeSlot=${slot}&partySize=${party || 2}&durationMinutes=${duration || 90}`
      );
      if (res.data?.data) {
        setAvailableTablesData(res.data.data.tables || []);
        setRecommendedTableId(res.data.data.recommendedTableId || null);
      }
    } catch (err) {
      console.error('Failed to evaluate tables:', err);
    } finally {
      setEvaluatingTables(false);
    }
  }, []);

  // When opening Form Modal or changing date/slot in form
  const handleOpenNewModal = () => {
    setEditingReservation(null);
    const initial = {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: '2',
      reservationDate: selectedDate,
      timeSlot: '19:30',
      durationMinutes: '90',
      tableId: '',
      specialOccasion: 'NONE',
      dietaryPreferences: [],
      depositAmount: '0',
      depositStatus: 'NOT_REQUIRED',
      depositPaymentMethod: 'UPI',
      guestNotes: '',
      internalNotes: ''
    };
    setForm(initial);
    setIsFormModalOpen(true);
    checkAvailableTables(initial.reservationDate, initial.timeSlot, initial.partySize, initial.durationMinutes);
  };

  const handleOpenEditModal = (resItem) => {
    setEditingReservation(resItem);
    const initial = {
      customerName: resItem.customerName || '',
      customerPhone: resItem.customerPhone || '',
      customerEmail: resItem.customerEmail || '',
      partySize: String(resItem.partySize || 2),
      reservationDate: resItem.reservationDate ? resItem.reservationDate.split('T')[0] : selectedDate,
      timeSlot: resItem.timeSlot || '19:30',
      durationMinutes: String(resItem.durationMinutes || 90),
      tableId: resItem.tableId?._id || resItem.tableId || '',
      specialOccasion: resItem.specialOccasion || 'NONE',
      dietaryPreferences: resItem.dietaryPreferences || [],
      depositAmount: String(resItem.depositAmount || 0),
      depositStatus: resItem.depositStatus || 'NOT_REQUIRED',
      depositPaymentMethod: resItem.depositPaymentMethod || 'UPI',
      guestNotes: resItem.guestNotes || '',
      internalNotes: resItem.internalNotes || ''
    };
    setForm(initial);
    setIsFormModalOpen(true);
    checkAvailableTables(initial.reservationDate, initial.timeSlot, initial.partySize, initial.durationMinutes);
  };

  // Form Submission
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.timeSlot) {
      toast.error('Please enter customer name, phone number, and time slot');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),
        partySize: Number(form.partySize) || 2,
        reservationDate: form.reservationDate,
        timeSlot: form.timeSlot,
        durationMinutes: Number(form.durationMinutes) || 90,
        tableId: form.tableId || null,
        specialOccasion: form.specialOccasion,
        dietaryPreferences: form.dietaryPreferences,
        depositAmount: Number(form.depositAmount) || 0,
        depositStatus: Number(form.depositAmount) > 0 ? form.depositStatus : 'NOT_REQUIRED',
        depositPaymentMethod: Number(form.depositAmount) > 0 ? form.depositPaymentMethod : 'NONE',
        guestNotes: form.guestNotes,
        internalNotes: form.internalNotes
      };

      if (editingReservation) {
        await api.put(`/restaurant/reservations/${editingReservation._id}`, payload);
        toast.success('Reservation updated successfully');
      } else {
        const res = await api.post('/restaurant/reservations', payload);
        toast.success(`Booking ${res.data?.data?.reservation?.reservationCode} created!`);
      }

      setIsFormModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Save reservation error:', err);
      toast.error(err.response?.data?.message || 'Failed to save reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Guest Check-In & Seating
  const handleOpenSeatModal = (resItem) => {
    setReservationToSeat(resItem);
    setSeatForm({
      tableId: resItem.tableId?._id || resItem.tableId || '',
      createOrder: true
    });
    setIsSeatModalOpen(true);
  };

  const handleConfirmSeat = async () => {
    if (!reservationToSeat) return;
    if (!seatForm.tableId) {
      toast.error('Please select a table to seat the guest');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/restaurant/reservations/${reservationToSeat._id}/seat`, {
        tableId: seatForm.tableId,
        createOrder: seatForm.createOrder
      });

      toast.success(`${reservationToSeat.customerName} seated at table!`);
      setIsSeatModalOpen(false);
      fetchData(true);

      // Offer to navigate to POS
      if (res.data?.data?.table) {
        toast((t) => (
          <div className="flex items-center gap-3">
            <span>Table occupied! Open in Touch POS?</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/restaurant/pos');
              }}
              className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold shadow hover:bg-amber-700"
            >
              Go to POS
            </button>
          </div>
        ), { duration: 6000 });
      }
    } catch (err) {
      console.error('Seating error:', err);
      toast.error(err.response?.data?.message || 'Failed to seat guest');
    } finally {
      setSubmitting(false);
    }
  };

  // Send WhatsApp/SMS Confirmation
  const handleSendConfirmation = async (resItem, method = 'WHATSAPP') => {
    try {
      setSubmitting(true);
      const res = await api.post(`/restaurant/reservations/${resItem._id}/send-confirmation`, { method });
      if (res.data?.data) {
        setConfirmationData(res.data.data);
        setIsConfirmModalOpen(true);
        toast.success(`Confirmation sent via ${method}!`);
        fetchData(true);
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      toast.error('Failed to send confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Reservation
  const handleOpenCancelModal = (resItem) => {
    setReservationToCancel(resItem);
    setCancelReason('Guest requested cancellation');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!reservationToCancel) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/reservations/${reservationToCancel._id}`, {
        data: { reason: cancelReason }
      });
      toast.success('Reservation cancelled');
      setIsCancelModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('Failed to cancel reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = r.customerName?.toLowerCase().includes(q);
        const phoneMatch = r.customerPhone?.toLowerCase().includes(q);
        const codeMatch = r.reservationCode?.toLowerCase().includes(q);
        const tableMatch = r.tableId?.tableNumber?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !codeMatch && !tableMatch) return false;
      }
      return true;
    });
  }, [reservations, statusFilter, searchQuery]);

  // Group by Time Slots for Timeline View
  const timelineSlots = useMemo(() => {
    const map = {};
    TIME_SLOTS.forEach(slot => {
      map[slot] = [];
    });

    filteredReservations.forEach(r => {
      const slot = r.timeSlot || '19:00';
      if (!map[slot]) map[slot] = [];
      map[slot].push(r);
    });

    return map;
  }, [filteredReservations]);

  const summary = analytics?.summary || {
    totalBookings: 0,
    confirmedCount: 0,
    seatedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    expectedCovers: 0,
    depositsCollected: 0,
    totalTablesCount: 0,
    reservedTablesCount: 0,
    tableOccupancyRate: 0
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Table Reservations & Advance Bookings
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Front-of-house guest bookings, timeline occupancy, VIP table allocation, and deposit tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === todayStr 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-700 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === tomorrowStr 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-700 hover:text-white hover:bg-stone-700/50'
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

          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          {/* New Reservation Button */}
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Bookings</span>
            <CalendarDays className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.totalBookings}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{summary.confirmedCount} Confirmed</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{summary.seatedCount} Seated</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Expected Covers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.expectedCovers} <span className="text-xs font-normal text-slate-500">guests</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Active dining covers scheduled
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Table Occupancy</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.tableOccupancyRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {summary.reservedTablesCount} of {summary.totalTablesCount} tables reserved
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Advance Deposits</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            ₹{summary.depositsCollected.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Held guarantee covers
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Completed / Turned</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {summary.completedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Turnover finished today
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending Online' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'SEATED', label: 'Seated' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s.id
                  ? 'bg-stone-700 text-white font-semibold shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search guest, phone, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton or Empty State */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">Fetching reservation roster & floor tables...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-2xs">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Reservations Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No bookings match your current search or filter criteria.'
              : `There are no reservations scheduled for ${selectedDate}. Create an advance booking to get started.`}
          </p>
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-xl text-white font-medium text-sm shadow hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Reservation</span>
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE SLOT VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TIME_SLOTS.map(slot => {
              const slotBookings = timelineSlots[slot] || [];
              if (slotBookings.length === 0 && (statusFilter !== 'ALL' || searchQuery)) return null;

              const isLunch = slot < '16:00';
              const totalCoversInSlot = slotBookings.reduce((sum, b) => sum + (b.partySize || 0), 0);

              return (
                <div
                  key={slot}
                  className={`rounded-2xl border transition-all ${
                    slotBookings.length > 0 
                      ? 'bg-white border-slate-200/90 shadow-2xs' 
                      : 'bg-slate-50/70 border-slate-200/60 opacity-70'
                  } p-4 flex flex-col justify-between`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="font-bold text-slate-900 text-base">{slot}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {isLunch ? 'Lunch' : 'Dinner'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {slotBookings.length} {slotBookings.length === 1 ? 'booking' : 'bookings'} ({totalCoversInSlot}p)
                    </span>
                  </div>

                  {/* Bookings in Slot */}
                  {slotBookings.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      No bookings for this slot
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {slotBookings.map(resItem => {
                        const occasionObj = OCCASIONS.find(o => o.value === resItem.specialOccasion) || OCCASIONS[0];
                        const OccasionIcon = occasionObj.icon;

                        return (
                          <div
                            key={resItem._id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-400 transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {resItem.customerName}
                                  </span>
                                  {resItem.customerId?.vipTier && resItem.customerId.vipTier !== 'STANDARD' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      {resItem.customerId.vipTier}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                  <Phone className="w-3 h-3 text-stone-500" />
                                  <span>{resItem.customerPhone}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                resItem.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : resItem.status === 'SEATED'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : resItem.status === 'COMPLETED'
                                  ? 'bg-stone-500/10 text-slate-500 border border-stone-600'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {resItem.status}
                              </span>
                            </div>

                            {/* Table & Party Details */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-semibold border border-slate-200 flex items-center gap-1">
                                <Users className="w-3 h-3 text-orange-400" />
                                {resItem.partySize} Guests
                              </span>

                              <span className={`px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${
                                resItem.tableId 
                                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                <Utensils className="w-3 h-3" />
                                {resItem.tableId ? `Table ${resItem.tableId.tableNumber}` : 'Unassigned'}
                              </span>

                              {resItem.specialOccasion !== 'NONE' && (
                                <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1 ${occasionObj.color}`}>
                                  <OccasionIcon className="w-3 h-3" />
                                  {occasionObj.label}
                                </span>
                              )}
                            </div>

                            {/* Dietary Chips */}
                            {resItem.dietaryPreferences?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {resItem.dietaryPreferences.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-semibold border border-slate-200 font-medium"
                                  >
                                    {tag.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Guest Notes */}
                            {resItem.guestNotes && (
                              <p className="text-xs text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                "{resItem.guestNotes}"
                              </p>
                            )}

                            {/* Deposit Indicator */}
                            {resItem.depositAmount > 0 && (
                              <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-slate-200">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-emerald-400" />
                                  Deposit:
                                </span>
                                <span className="font-semibold text-emerald-400">
                                  ₹{resItem.depositAmount} ({resItem.depositPaymentMethod})
                                </span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-1.5">
                              {resItem.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleOpenSeatModal(resItem)}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Seat Guest</span>
                                </button>
                              )}

                              {resItem.status === 'SEATED' && (
                                <button
                                  onClick={() => navigate('/restaurant/pos')}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                                >
                                  <Utensils className="w-3.5 h-3.5" />
                                  <span>Open POS</span>
                                </button>
                              )}

                              {/* WhatsApp Reminder Simulator */}
                              <button
                                onClick={() => handleSendConfirmation(resItem, 'WHATSAPP')}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-emerald-600 border border-slate-200 transition-colors"
                                title="Send WhatsApp Confirmation"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(resItem)}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                                title="Edit Reservation"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel */}
                              {['CONFIRMED', 'SEATED'].includes(resItem.status) && (
                                <button
                                  onClick={() => handleOpenCancelModal(resItem)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 transition-colors"
                                  title="Cancel Booking"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code / Time</th>
                  <th className="py-3.5 px-4">Guest Details</th>
                  <th className="py-3.5 px-4">Party & Table</th>
                  <th className="py-3.5 px-4">Occasion & Preferences</th>
                  <th className="py-3.5 px-4">Deposit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map(resItem => {
                  const occasionObj = OCCASIONS.find(o => o.value === resItem.specialOccasion) || OCCASIONS[0];
                  const OccasionIcon = occasionObj.icon;

                  return (
                    <tr key={resItem._id} className="hover:bg-slate-50 transition-colors">
                      {/* Code / Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-orange-400">
                          {resItem.reservationCode}
                        </div>
                        <div className="text-slate-700 flex items-center gap-1 font-semibold mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {resItem.timeSlot} ({resItem.durationMinutes || 90}m)
                        </div>
                      </td>

                      {/* Guest Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {resItem.customerName}
                        </div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {resItem.customerPhone}
                        </div>
                        {resItem.customerEmail && (
                          <div className="text-stone-500 text-[11px]">
                            {resItem.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Party & Table */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-900 font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {resItem.partySize} Guests
                        </div>
                        <div className="mt-1">
                          {resItem.tableId ? (
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold text-[11px]">
                              Table {resItem.tableId.tableNumber} ({resItem.tableId.areaId?.name || 'Main'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[11px]">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Occasion & Preferences */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {resItem.specialOccasion !== 'NONE' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[11px] mb-1 ${occasionObj.color}`}>
                            <OccasionIcon className="w-3 h-3" />
                            {occasionObj.label}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {resItem.dietaryPreferences?.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 font-semibold border border-slate-200">
                              {tag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                        {resItem.guestNotes && (
                          <p className="text-[11px] text-slate-500 italic truncate mt-1">
                            "{resItem.guestNotes}"
                          </p>
                        )}
                      </td>

                      {/* Deposit */}
                      <td className="py-3.5 px-4">
                        {resItem.depositAmount > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-400">₹{resItem.depositAmount}</span>
                            <div className="text-[10px] text-slate-500">{resItem.depositPaymentMethod}</div>
                          </div>
                        ) : (
                          <span className="text-stone-500">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          resItem.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : resItem.status === 'SEATED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : resItem.status === 'COMPLETED'
                            ? 'bg-stone-500/10 text-slate-500 border border-stone-600'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {resItem.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {resItem.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleOpenSeatModal(resItem)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-all"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Seat</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleSendConfirmation(resItem, 'WHATSAPP')}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-emerald-600 border border-slate-200 transition-colors"
                            title="Send WhatsApp Confirmation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(resItem)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {['CONFIRMED', 'SEATED'].includes(resItem.status) && (
                            <button
                              onClick={() => handleOpenCancelModal(resItem)}
                              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT RESERVATION MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingReservation ? 'Edit Reservation' : 'New Table Reservation'}
                  {editingReservation && (
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {editingReservation.reservationCode}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter guest details, party size, time slot, and allocate best table.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-4">
              {/* Row 1: Guest Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditi Sharma"
                    value={form.customerName}
                    onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.customerPhone}
                    onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Optional for receipts"
                    value={form.customerEmail}
                    onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Row 2: Date, Slot & Party Size */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reservation Date <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.reservationDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setForm(prev => ({ ...prev, reservationDate: newDate }));
                      checkAvailableTables(newDate, form.timeSlot, form.partySize, form.durationMinutes);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Slot <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={form.timeSlot}
                    onChange={(e) => {
                      const newSlot = e.target.value;
                      setForm(prev => ({ ...prev, timeSlot: newSlot }));
                      checkAvailableTables(form.reservationDate, newSlot, form.partySize, form.durationMinutes);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Size (Pax) <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={form.partySize}
                    onChange={(e) => {
                      const newParty = e.target.value;
                      setForm(prev => ({ ...prev, partySize: newParty }));
                      checkAvailableTables(form.reservationDate, form.timeSlot, newParty, form.durationMinutes);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={form.durationMinutes}
                    onChange={(e) => {
                      const newDur = e.target.value;
                      setForm(prev => ({ ...prev, durationMinutes: newDur }));
                      checkAvailableTables(form.reservationDate, form.timeSlot, form.partySize, newDur);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="60">60 mins (1 hr)</option>
                    <option value="90">90 mins (1.5 hrs)</option>
                    <option value="120">120 mins (2 hrs)</option>
                    <option value="180">180 mins (3 hrs)</option>
                  </select>
                </div>
              </div>

              {/* Table Allocation & Smart Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Floor Table Allocation
                  </label>
                  {recommendedTableId && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tableId: recommendedTableId }))}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Select Best Match</span>
                    </button>
                  )}
                </div>

                <select
                  value={form.tableId}
                  onChange={(e) => setForm(prev => ({ ...prev, tableId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Leave Unassigned (Allocate at Arrival) --</option>
                  {availableTablesData.map(tbl => (
                    <option 
                      key={tbl._id} 
                      value={tbl._id}
                      disabled={!tbl.isAvailable}
                    >
                      Table {tbl.tableNumber} ({tbl.capacity} Pax, {tbl.areaName}) 
                      {!tbl.isAvailable ? ' - [ALREADY BOOKED]' : tbl._id === recommendedTableId ? ' - ⭐ RECOMMENDED' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion & Dietary Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Occasion
                  </label>
                  <select
                    value={form.specialOccasion}
                    onChange={(e) => setForm(prev => ({ ...prev, specialOccasion: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {OCCASIONS.map(occ => (
                      <option key={occ.value} value={occ.value}>{occ.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dietary Tags
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-300/60">
                    {DIETARY_TAGS.map(tag => {
                      const isSelected = form.dietaryPreferences.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              dietaryPreferences: isSelected
                                ? prev.dietaryPreferences.filter(t => t !== tag.id)
                                : [...prev.dietaryPreferences, tag.id]
                            }));
                          }}
                          className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition-all ${
                            isSelected
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Advance Booking Deposit */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Advance Booking Guarantee Deposit
                  </span>
                  <span className="text-[11px] text-slate-500">Optional for large parties</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Deposit Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={form.depositAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Status</label>
                    <select
                      value={form.depositStatus}
                      onChange={(e) => setForm(prev => ({ ...prev, depositStatus: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="NOT_REQUIRED">Not Required</option>
                      <option value="PAID">Paid / Received</option>
                      <option value="PENDING">Pending Arrival</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Method</label>
                    <select
                      value={form.depositPaymentMethod}
                      onChange={(e) => setForm(prev => ({ ...prev, depositPaymentMethod: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Credit/Debit Card</option>
                      <option value="ONLINE_GATEWAY">Online Link</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Guest & Internal Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Requests / Guest Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Window booth, quiet corner, bring baby chair"
                    value={form.guestNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, guestNotes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Staff Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Regular weekend VIP guest, complimentary welcome drink"
                    value={form.internalNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-white font-semibold text-sm shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingReservation ? 'Save Changes' : 'Confirm Reservation'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUEST CHECK-IN & SEATING MODAL */}
      {isSeatModalOpen && reservationToSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Seat Guest at Floor Table
              </h3>
              <button
                onClick={() => setIsSeatModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-white text-base">
                {reservationToSeat.customerName}
              </div>
              <div className="text-xs text-slate-700 flex items-center justify-between">
                <span>Party Size: <b className="text-white">{reservationToSeat.partySize} Guests</b></span>
                <span className="font-mono text-orange-400">{reservationToSeat.reservationCode}</span>
              </div>
              {reservationToSeat.guestNotes && (
                <p className="text-xs text-slate-500 italic pt-1">
                  Note: "{reservationToSeat.guestNotes}"
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Table to Occupy <span className="text-orange-500">*</span>
                </label>
                <select
                  value={seatForm.tableId}
                  onChange={(e) => setSeatForm(prev => ({ ...prev, tableId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Floor Table --</option>
                  {tablesList.map(t => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} ({t.capacity} Pax, {t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createOrder"
                  checked={seatForm.createOrder}
                  onChange={(e) => setSeatForm(prev => ({ ...prev, createOrder: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="createOrder" className="text-xs text-slate-700 cursor-pointer">
                  Auto-open active dine-in ticket in POS for table
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSeatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSeat}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Check-In & Seat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CONFIRMATION PREVIEW SIMULATOR MODAL */}
      {isConfirmModalOpen && confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">WhatsApp Confirmation</h3>
                  <p className="text-xs text-slate-500">Dispatched to {confirmationData.recipient}</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp Chat Preview Bubble */}
            <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-200 text-stone-100 space-y-2 relative overflow-hidden font-sans">
              <div className="text-[10px] text-slate-500 text-center pb-1">
                TODAY • ENCRYPTED WHATSAPP BUSINESS GATEWAY
              </div>
              <div className="bg-[#005c4b] p-3.5 rounded-2xl rounded-tr-none text-xs text-emerald-50 leading-relaxed shadow space-y-1 whitespace-pre-wrap">
                {confirmationData.messageBody}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <Check className="w-3 h-3" />
                <span>Delivered</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                onClick={() => {
                  navigator.clipboard.writeText(confirmationData.messageBody);
                  toast.success('Message copied to clipboard');
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL RESERVATION MODAL */}
      {isCancelModalOpen && reservationToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cancel Reservation</h3>
                <p className="text-xs text-slate-500">Booking {reservationToCancel.reservationCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Are you sure you want to cancel the reservation for <b className="text-white">{reservationToCancel.customerName}</b>? Any assigned table will be released back to AVAILABLE.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest called to cancel, flight delayed"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
              >
                Keep Booking
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
