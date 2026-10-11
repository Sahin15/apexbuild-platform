import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Crown, Star, Award, Heart, Gift, Phone, Mail, 
  Calendar, Clock, Check, Utensils, History,
  Cake, Coffee, ThumbsUp, ChevronRight, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

const DIETARY_OPTIONS = [
  { id: 'VEG', label: 'Vegetarian', icon: '🌿' },
  { id: 'NON_VEG', label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'JAIN', label: 'Strict Jain (No Root Veg)', icon: '🌱' },
  { id: 'VEGAN', label: 'Vegan', icon: '🥗' },
  { id: 'GLUTEN_FREE', label: 'Gluten Free', icon: '🌾' },
  { id: 'NUT_ALLERGY', label: 'Nut Allergy Warning', icon: '⚠️' },
  { id: 'SPICY_LOVER', label: 'Prefers Spicy', icon: '🌶️' },
  { id: 'LESS_OIL', label: 'Less Oil / Healthy', icon: '💧' }
];

const VIP_TIERS = [
  { id: 'STANDARD', label: 'Standard Guest', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  { id: 'SILVER', label: 'Silver Diner', color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300' },
  { id: 'GOLD', label: 'Gold VIP', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300' },
  { id: 'PLATINUM', label: 'Platinum Club Elite', color: 'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300' }
];

export default function RestaurantCustomers() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    repeatGuestsCount: 0,
    repeatRate: 0,
    vipCount: 0,
    totalLoyaltyPoints: 0,
    averageLifetimeValue: 0,
    totalCumulativeRevenue: 0
  });

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedDietary, setSelectedDietary] = useState('ALL');
  const [sortBy, setSortBy] = useState('spend'); // 'spend', 'visits', 'lastVisit', 'points', 'name'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [diningHistory, setDiningHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Customer Form State
  const initialCustomerForm = {
    _id: null,
    name: '',
    phone: '',
    email: '',
    birthday: '',
    anniversary: '',
    vipTier: 'STANDARD',
    loyaltyPoints: '',
    totalVisits: 1,
    totalSpend: '',
    dietaryPreferences: [],
    notes: ''
  };
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);

  // Points Adjustment Form
  const [pointsForm, setPointsForm] = useState({
    type: 'ADD', // 'ADD' or 'REDEEM'
    points: '',
    reason: ''
  });

  // Fetch Customers & Analytics
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [custRes, analyticsRes] = await Promise.all([
        api.get('/restaurant/customers', { params: { sortBy } }),
        api.get('/restaurant/customers/analytics')
      ]);

      if (custRes.data?.data?.customers) {
        setCustomers(custRes.data.data.customers);
      }
      if (analyticsRes.data?.data?.summary) {
        setSummary(analyticsRes.data.data.summary);
      }
    } catch (err) {
      console.error('Failed to load guest directory:', err);
      toast.error('Unable to fetch guest records: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q);

      const matchesTier = selectedTier === 'ALL' || c.vipTier === selectedTier;
      const matchesDietary = selectedDietary === 'ALL' || c.dietaryPreferences?.includes(selectedDietary);

      return matchesSearch && matchesTier && matchesDietary;
    });
  }, [customers, searchTerm, selectedTier, selectedDietary]);

  // Open Create Customer Modal
  const handleOpenCreateModal = () => {
    setCustomerForm(initialCustomerForm);
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditModal = (c) => {
    setCustomerForm({
      _id: c._id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      birthday: c.birthday ? c.birthday.split('T')[0] : '',
      anniversary: c.anniversary ? c.anniversary.split('T')[0] : '',
      vipTier: c.vipTier || 'STANDARD',
      loyaltyPoints: c.loyaltyPoints || '',
      totalVisits: c.totalVisits || 1,
      totalSpend: c.totalSpend || '',
      dietaryPreferences: c.dietaryPreferences || [],
      notes: c.notes || ''
    });
    setIsCustomerModalOpen(true);
  };

  // Open Dining History
  const handleOpenHistoryDrawer = async (c) => {
    setSelectedCustomer(c);
    setIsHistoryDrawerOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/restaurant/customers/${c._id}`);
      if (res.data?.data) {
        setDiningHistory(res.data.data.diningHistory || []);
      }
    } catch (err) {
      console.error('Failed to load guest dining history:', err);
      toast.error('Could not load dining history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Points Adjustment Modal
  const handleOpenPointsModal = (c) => {
    setSelectedCustomer(c);
    setPointsForm({
      type: 'ADD',
      points: '',
      reason: ''
    });
    setIsPointsModalOpen(true);
  };

  // Toggle Dietary
  const handleToggleDietary = (id) => {
    setCustomerForm(prev => {
      const current = prev.dietaryPreferences || [];
      if (current.includes(id)) {
        return { ...prev, dietaryPreferences: current.filter(d => d !== id) };
      } else {
        return { ...prev, dietaryPreferences: [...current, id] };
      }
    });
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toast.error('Guest name is required');
      return;
    }
    if (!customerForm.phone.trim()) {
      toast.error('Guest phone number is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim(),
        birthday: customerForm.birthday || null,
        anniversary: customerForm.anniversary || null,
        vipTier: customerForm.vipTier,
        loyaltyPoints: Number(customerForm.loyaltyPoints) || 0,
        totalVisits: Number(customerForm.totalVisits) || 1,
        totalSpend: Number(customerForm.totalSpend) || 0,
        dietaryPreferences: customerForm.dietaryPreferences,
        notes: customerForm.notes
      };

      if (customerForm._id) {
        await api.put(`/restaurant/customers/${customerForm._id}`, payload);
        toast.success(`Updated guest profile for "${payload.name}"`);
      } else {
        await api.post('/restaurant/customers', payload);
        toast.success(`Registered new guest "${payload.name}" to directory!`);
      }

      setIsCustomerModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error saving guest:', err);
      toast.error(err.response?.data?.message || 'Failed to save guest profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Points Adjustment
  const handleSubmitPoints = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const pts = Number(pointsForm.points);
    if (!pts || pts <= 0) {
      toast.error('Please enter a valid points amount greater than 0');
      return;
    }

    const currentPts = selectedCustomer.loyaltyPoints || 0;
    let newPts = currentPts;
    if (pointsForm.type === 'ADD') {
      newPts += pts;
    } else {
      if (pts > currentPts) {
        toast.error(`Cannot redeem more than available balance of ${currentPts} points`);
        return;
      }
      newPts -= pts;
    }

    try {
      setSubmitting(true);
      await api.put(`/restaurant/customers/${selectedCustomer._id}`, {
        loyaltyPoints: newPts
      });
      toast.success(`${pointsForm.type === 'ADD' ? 'Awarded' : 'Redeemed'} ${pts} points for ${selectedCustomer.name}`);
      setIsPointsModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error adjusting points:', err);
      toast.error(err.response?.data?.message || 'Failed to update points');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/customers/${customerToDelete._id}`);
      toast.success(`Archived guest profile "${customerToDelete.name}"`);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchData(true);
    } catch (err) {
      console.error('Error archiving guest:', err);
      toast.error(err.response?.data?.message || 'Failed to archive guest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Guest Directory, CRM & Loyalty Program
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
                  Guest Experience
                </span>
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Maintain guest profiles, recognize VIP diners, automate loyalty reward points, and track dietary preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            title="Refresh guest records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 transition-all"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Register New Guest
          </button>
        </div>
      </div>

      {/* 2. Executive Guest Intelligence KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Guests */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Total Registered Guests
            </span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {summary.totalCustomers}
            </span>
            <span className="text-xs text-stone-400">
              diners on file
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            ₹{summary.totalCumulativeRevenue.toLocaleString('en-IN')} cumulative revenue generated
          </p>
        </div>

        {/* Repeat Guest Rate */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Repeat Guest Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.repeatRate}%
            </span>
            <span className="text-xs text-stone-400">
              ({summary.repeatGuestsCount} guests &gt; 1 visit)
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${summary.repeatRate}%` }}
            />
          </div>
        </div>

        {/* VIP Club Diners */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              VIP Club Elite
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary.vipCount}
            </span>
            <span className="text-xs text-stone-400">
              Gold & Platinum members
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Avg spend: ₹{summary.averageLifetimeValue.toLocaleString('en-IN')} / guest
          </p>
        </div>

        {/* Loyalty Points */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Active Loyalty Points
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.totalLoyaltyPoints.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-400">
              points in circulation
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            1 point earned per ₹100 spent on settled bills
          </p>
        </div>

      </div>

      {/* 3. Filter & Sort Toolbar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by diner name, mobile number, email, or seating notes..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* VIP Tier Filter */}
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="ALL">All VIP Tiers</option>
              <option value="PLATINUM">Platinum VIP</option>
              <option value="GOLD">Gold VIP</option>
              <option value="SILVER">Silver</option>
              <option value="STANDARD">Standard</option>
            </select>

            {/* Dietary Preference Filter */}
            <select
              value={selectedDietary}
              onChange={e => setSelectedDietary(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="ALL">All Dietary Tags</option>
              {DIETARY_OPTIONS.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.label}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="spend">Sort: Highest Spend</option>
              <option value="visits">Sort: Most Visits</option>
              <option value="points">Sort: Loyalty Points</option>
              <option value="lastVisit">Sort: Recently Visited</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Table
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Main Guest Content: Cards vs Table View */}
      {loading ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
          <p className="text-sm text-stone-500">Loading guest profiles and dining history...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <Users className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">No Guests Found</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            {searchTerm || selectedTier !== 'ALL' || selectedDietary !== 'ALL'
              ? 'No guests match the active search or filters. Try adjusting your query.'
              : 'Register your first dining guest to build your restaurant CRM and loyalty club.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Register First Guest
          </button>
        </div>
      ) : viewMode === 'cards' ? (

        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map(customer => {
            const isPlatinum = customer.vipTier === 'PLATINUM';
            const isGold = customer.vipTier === 'GOLD';
            const isSilver = customer.vipTier === 'SILVER';

            return (
              <div 
                key={customer._id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-800/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: VIP Tier & Loyalty Points */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                      isPlatinum 
                        ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                        : isGold
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                          : isSilver
                            ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {isPlatinum && <Crown className="w-3.5 h-3.5 text-purple-600" />}
                      {isGold && <Award className="w-3.5 h-3.5 text-amber-600" />}
                      {isSilver && <Star className="w-3.5 h-3.5 text-slate-600" />}
                      {customer.vipTier}
                    </span>

                    <button
                      onClick={() => handleOpenPointsModal(customer)}
                      className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 font-semibold hover:bg-amber-100 transition-colors"
                      title="Adjust or redeem loyalty points"
                    >
                      ★ {customer.loyaltyPoints || 0} pts
                    </button>
                  </div>

                  {/* Diner Name & Phone */}
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      {customer.phone}
                    </span>
                    {customer.email && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {customer.email}
                      </span>
                    )}
                  </div>

                  {/* Financial & Visit Snapshot */}
                  <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Spend</span>
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        ₹{customer.totalSpend?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Visits</span>
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {customer.totalVisits || 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Avg Ticket</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{customer.averageSpendPerVisit || 0}
                      </span>
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  {customer.dietaryPreferences && customer.dietaryPreferences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {customer.dietaryPreferences.map(tag => {
                        const opt = DIETARY_OPTIONS.find(d => d.id === tag);
                        return (
                          <span 
                            key={tag} 
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium"
                          >
                            {opt ? `${opt.icon} ${opt.label}` : tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Dining Notes */}
                  {customer.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic line-clamp-2 bg-stone-50/50 dark:bg-stone-800/20 p-2 rounded-lg border border-stone-100 dark:border-stone-800 mb-2">
                      "{customer.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 mt-2">
                  <button
                    onClick={() => handleOpenHistoryDrawer(customer)}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    Dining History
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                      title="Edit Guest Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCustomerToDelete(customer);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                      title="Archive Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* HIGH-DENSITY CRM TABLE */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 text-xs font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Mobile Phone</th>
                  <th className="py-3 px-4 text-center">VIP Tier</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-center">Visits</th>
                  <th className="py-3 px-4 text-right">Loyalty Points</th>
                  <th className="py-3 px-4">Dietary Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {filteredCustomers.map(c => (
                  <tr key={c._id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{c.name}</div>
                      <div className="text-xs text-stone-400">{c.email || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {c.phone}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        c.vipTier === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
                        c.vipTier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                        c.vipTier === 'SILVER' ? 'bg-slate-200 text-slate-800' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {c.vipTier}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-stone-100">
                      ₹{c.totalSpend?.toLocaleString('en-IN') || 0}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-semibold">
                      {c.totalVisits || 1}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenPointsModal(c)}
                        className="text-xs font-bold text-amber-600 hover:underline"
                      >
                        ★ {c.loyaltyPoints || 0}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="line-clamp-1 text-stone-500">
                        {c.dietaryPreferences?.join(', ') || c.notes || '—'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistoryDrawer(c)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800"
                          title="View Dining History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(c);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600"
                          title="Archive Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {/* 5. ADD / EDIT GUEST MODAL */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {customerForm._id ? 'Edit Guest Profile' : 'Register New Dining Guest'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Store contact, VIP tier, dietary preferences, and birthday milestones.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="e.g. Rohit Sharma"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="9820112233"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="rohit@gmail.com"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    VIP Club Tier
                  </label>
                  <select
                    value={customerForm.vipTier}
                    onChange={e => setCustomerForm({ ...customerForm, vipTier: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  >
                    {VIP_TIERS.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Milestones: Birthday & Anniversary */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-orange-500" /> Birthday
                  </label>
                  <input
                    type="date"
                    value={customerForm.birthday}
                    onChange={e => setCustomerForm({ ...customerForm, birthday: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Anniversary
                  </label>
                  <input
                    type="date"
                    value={customerForm.anniversary}
                    onChange={e => setCustomerForm({ ...customerForm, anniversary: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Dietary Preferences & Allergies
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(d => {
                    const isSelected = customerForm.dietaryPreferences?.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleDietary(d.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-600 font-semibold'
                            : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <span>{d.icon}</span>
                        <span>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seating / Service Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Hostess & Seating Preferences Notes
                </label>
                <textarea
                  rows="2"
                  value={customerForm.notes}
                  onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="e.g. Table 4 booth preferred, likes cold water without ice, strictly Jain..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

            </form>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {customerForm._id ? 'Update Profile' : 'Save Guest Profile'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DINING HISTORY & ORDERS MODAL */}
      {/* ========================================================================= */}
      {isHistoryDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Dining History — {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {selectedCustomer.phone} • {selectedCustomer.vipTier} • {selectedCustomer.totalVisits} Total Visits
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)} className="p-2 rounded-xl text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Quick Summary Pill */}
              <div className="grid grid-cols-3 gap-3 text-center bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase">Lifetime Spend</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block">₹{selectedCustomer.totalSpend}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase">Loyalty Balance</span>
                  <span className="font-bold text-amber-600 text-sm block">★ {selectedCustomer.loyaltyPoints}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase">Avg Spend / Visit</span>
                  <span className="font-bold text-emerald-600 text-sm block">₹{selectedCustomer.averageSpendPerVisit}</span>
                </div>
              </div>

              {loadingHistory ? (
                <div className="text-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                  <p className="text-xs text-stone-500">Loading dining orders...</p>
                </div>
              ) : diningHistory.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  No orders linked directly to this guest's phone number yet. Past orders punched via Touch POS with this mobile will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {diningHistory.map(ord => (
                    <div key={ord._id} className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100">{ord.orderNumber}</span>
                        <span className="text-stone-400">
                          {new Date(ord.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          {ord.orderType?.replace('_', ' ')} • Table {ord.tableNumber || 'Takeaway'} ({ord.guestCount || 1} guests)
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          ₹{ord.grandTotal}
                        </span>
                      </div>
                      {ord.items && ord.items.length > 0 && (
                        <div className="text-[11px] text-stone-500 flex flex-wrap gap-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                          {ord.items.map((it, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                              {it.quantity}x {it.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="flex items-center justify-end p-4 border-t border-stone-200 bg-stone-50">
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LOYALTY POINTS ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {isPointsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Adjust Loyalty Points</span>
              </div>
              <button onClick={() => setIsPointsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-amber-800 dark:text-amber-300 font-semibold block">{selectedCustomer.name}</span>
                <span className="text-amber-600 dark:text-amber-400">Current Balance:</span>
              </div>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                ★ {selectedCustomer.loyaltyPoints || 0} pts
              </span>
            </div>

            <form onSubmit={handleSubmitPoints} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPointsForm({ ...pointsForm, type: 'ADD' })}
                  className={`p-2 rounded-xl border font-semibold transition-colors ${
                    pointsForm.type === 'ADD'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  + Award Points (Promo/Visit)
                </button>
                <button
                  type="button"
                  onClick={() => setPointsForm({ ...pointsForm, type: 'REDEEM' })}
                  className={`p-2 rounded-xl border font-semibold transition-colors ${
                    pointsForm.type === 'REDEEM'
                      ? 'bg-red-50 text-red-800 border-red-400 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  - Redeem Points (Bill Discount)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Points Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={pointsForm.points}
                  onChange={e => setPointsForm({
                    ...pointsForm,
                    points: e.target.value === '' ? '' : Number(e.target.value)
                  })}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Reason / Promotional Campaign
                </label>
                <input
                  type="text"
                  value={pointsForm.reason}
                  onChange={e => setPointsForm({ ...pointsForm, reason: e.target.value })}
                  placeholder="e.g. Birthday anniversary reward"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPointsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  Confirm Points Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Archive Guest Profile?
              </h3>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-400">
              Are you sure you want to archive <strong>"{customerToDelete.name}"</strong>? Past billing history will remain preserved, but this diner will no longer appear in standard active guest lookups.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomer}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
