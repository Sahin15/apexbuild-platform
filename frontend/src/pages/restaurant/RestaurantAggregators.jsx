import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Flame, Zap, Package, Wrench, Utensils, UtensilsCrossed,
  Clock, Check, Building, Phone, Calendar,
  Printer, ArrowUpRight, ChevronRight, FileText,
  CreditCard, Coins, ShoppingBag, Store, AlertCircle,
  Radio, Play, Power, Navigation, User, MapPin, Tag,
  ExternalLink, CloudRain, Bell, Bike, UserPlus, Users,
  CheckCircle, ShieldCheck, Wallet, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';
import OrderBuzzerModal from '../../components/restaurant/OrderBuzzerModal';

export const AGGREGATOR_INFO = {
  ZOMATO: {
    name: 'Zomato Delivery',
    code: 'ZOMATO',
    color: '#E23744',
    bgLight: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
    brandBadge: 'bg-rose-600 text-white',
    iconText: '🔴'
  },
  SWIGGY: {
    name: 'Swiggy Instadeliver',
    code: 'SWIGGY',
    color: '#FC8019',
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
    brandBadge: 'bg-amber-600 text-white',
    iconText: '🟠'
  },
  DIRECT_WEB: {
    name: 'Direct Web / WhatsApp',
    code: 'DIRECT_WEB',
    color: '#10B981',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    brandBadge: 'bg-emerald-600 text-white',
    iconText: '🟢'
  }
};

export default function RestaurantAggregators() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'FLEET'

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  // Buzzer Modal State
  const [isBuzzerOpen, setIsBuzzerOpen] = useState(false);
  const [buzzerOrder, setBuzzerOrder] = useState(null);
  const [dismissedBuzzerIds, setDismissedBuzzerIds] = useState(new Set());
  const [buzzerActionLoading, setBuzzerActionLoading] = useState(false);

  // Assign Delivery Boy Modal State
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [orderForDriverAssignment, setOrderForDriverAssignment] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);

  // Add Delivery Boy Modal State
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [newDriverForm, setNewDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    salaryMonthly: '18000'
  });

  // Filters
  const [platformFilter, setPlatformFilter] = useState('ALL'); // 'ALL' | 'ZOMATO' | 'SWIGGY' | 'DIRECT_WEB'
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED' | 'ALL'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBagStickerModalOpen, setIsBagStickerModalOpen] = useState(false);
  const [selectedOrderForSticker, setSelectedOrderForSticker] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Simulator Form State
  const initialSimulatorForm = {
    aggregator: 'ZOMATO',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98450-XXXXX (Masked)',
    deliveryAddress: 'Flat 402, Prestige Palms, Whitefield (3.2 km)',
    cookingInstructions: 'Please make extra spicy and send extra mint chutney & cutlery.',
    riderName: 'Sunil Kumar',
    riderPhone: '+91 91234-56789',
    riderVehicle: 'KA-03-ER-4891 (TVS Ntorq)',
    estimatedMinutes: 15,
    selectedItems: []
  };
  const [simulatorForm, setSimulatorForm] = useState(initialSimulatorForm);

  // Config Form State
  const [configForm, setConfigForm] = useState({
    zomatoCommissionRate: 20,
    swiggyCommissionRate: 22,
    directWebCommissionRate: 0,
    zomatoStoreId: 'ZOM-BLR-8921',
    swiggyStoreId: 'SWIG-BLR-4309',
    defaultPrepTimeMinutes: 20
  });

  // Fetch Live Data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [aggRes, menuRes, boysRes] = await Promise.all([
        api.get('/restaurant/aggregators'),
        api.get('/restaurant/menu'),
        api.get('/restaurant/delivery-boys')
      ]);

      if (aggRes.data?.data) {
        setData(aggRes.data.data);
        if (aggRes.data.data.config) {
          const cfg = aggRes.data.data.config;
          setConfigForm({
            zomatoCommissionRate: cfg.zomato?.commissionRate ?? 20,
            swiggyCommissionRate: cfg.swiggy?.commissionRate ?? 22,
            directWebCommissionRate: cfg.directWeb?.commissionRate ?? 0,
            zomatoStoreId: cfg.zomato?.storeId ?? 'ZOM-BLR-8921',
            swiggyStoreId: cfg.swiggy?.storeId ?? 'SWIG-BLR-4309',
            defaultPrepTimeMinutes: cfg.defaultPrepTimeMinutes ?? 20
          });
        }
      }

      if (menuRes.data?.data?.categories) {
        const allItems = [];
        menuRes.data.data.categories.forEach(cat => {
          if (cat.items) allItems.push(...cat.items);
        });
        setMenuItems(allItems);
      }

      if (boysRes.data?.data) {
        const boysList = boysRes.data.data.deliveryBoys || (Array.isArray(boysRes.data.data) ? boysRes.data.data : []);
        setDeliveryBoys(boysList);
      }
    } catch (err) {
      console.error('Failed to load delivery aggregators overview:', err);
      toast.error('Unable to fetch delivery orders: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 15 seconds for live delivery queue
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-detect incoming pending orders to pop open buzzer alert
  useEffect(() => {
    if (data?.activeQueue) {
      const pendingOrder = data.activeQueue.find(
        o => o.status === 'PENDING' && !dismissedBuzzerIds.has(o._id)
      );
      if (pendingOrder && !isBuzzerOpen) {
        setBuzzerOrder(pendingOrder);
        setIsBuzzerOpen(true);
      }
    }
  }, [data?.activeQueue, dismissedBuzzerIds, isBuzzerOpen]);

  // Toggle Store Online / Offline
  const handleToggleStore = async (platform) => {
    try {
      const res = await api.post('/restaurant/aggregators/toggle', { platform });
      toast.success(
        platform === 'surgeRainMode'
          ? `Rain surge buffer ${res.data.data.config.surgeRainMode ? 'ACTIVATED' : 'DEACTIVATED'}`
          : `${platform.toUpperCase()} store is now ${res.data.data.config[platform].status}`
      );
      fetchData(true);
    } catch (err) {
      toast.error('Failed to toggle aggregator status');
    }
  };

  // Advance Rider Dispatch Status & Reconcile In-House Delivery Staff
  const handleAdvanceRiderStatus = async (order) => {
    const cur = order.riderDetails?.status || 'ASSIGNED';
    let nextStatus = 'ASSIGNED';

    if (cur === 'ASSIGNED') nextStatus = 'ARRIVED_AT_STORE';
    else if (cur === 'ARRIVED_AT_STORE') nextStatus = 'OUT_FOR_DELIVERY';
    else if (cur === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    else return;

    try {
      if (nextStatus === 'DELIVERED') {
        // Call delivered endpoint which automatically reconciles delivery boy status, deliveries count & COD cash
        await api.post(`/restaurant/online-order/${order._id}/delivered`);
        toast.success(`Order ${order.aggregatorOrderId || order.orderNumber}: Marked DELIVERED! Rider released to Available.`);
      } else {
        await api.patch(`/restaurant/aggregators/rider/${order._id}`, { status: nextStatus });
        toast.success(`Order ${order.aggregatorOrderId || order.orderNumber}: Rider is now ${nextStatus.replace(/_/g, ' ')}`);
      }
      fetchData(true);
    } catch (err) {
      toast.error('Failed to update rider status');
    }
  };

  // Buzzer Modal Accept Order Action
  const handleAcceptOrderFromBuzzer = async (orderId, { deliveryBoyId, estimatedPrepMinutes } = {}) => {
    try {
      setBuzzerActionLoading(true);
      await api.post(`/restaurant/online-order/${orderId}/accept`, { estimatedPrepMinutes });
      if (deliveryBoyId) {
        await api.post(`/restaurant/online-order/${orderId}/assign-delivery-boy`, { deliveryBoyId });
      }
      toast.success('Food order accepted & dispatched to kitchen!');
      setIsBuzzerOpen(false);
      setBuzzerOrder(null);
      setDismissedBuzzerIds(prev => new Set([...prev, orderId]));
      fetchData(true);
    } catch (err) {
      console.error('Accept from buzzer error:', err);
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setBuzzerActionLoading(false);
    }
  };

  // Buzzer Modal Reject Order Action
  const handleRejectOrderFromBuzzer = async (orderId, reason) => {
    try {
      setBuzzerActionLoading(true);
      await api.post(`/restaurant/online-order/${orderId}/reject`, { reason });
      toast.success('Food order rejected');
      setIsBuzzerOpen(false);
      setBuzzerOrder(null);
      setDismissedBuzzerIds(prev => new Set([...prev, orderId]));
      fetchData(true);
    } catch (err) {
      console.error('Reject from buzzer error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setBuzzerActionLoading(false);
    }
  };

  const handleAcceptDirectOrder = async (orderId) => {
    try {
      const res = await api.post(`/restaurant/online-order/${orderId}/accept`);
      toast.success(res.data?.message || 'Order accepted & sent to kitchen!');
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleRejectDirectOrder = async (order) => {
    const reason = window.prompt(`Reject order ${order.orderNumber}? Enter reason:`, 'Kitchen at maximum capacity');
    if (!reason) return;
    try {
      await api.post(`/restaurant/online-order/${order._id}/reject`, { reason });
      toast.success(`Order ${order.orderNumber} rejected`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to reject order');
    }
  };

  // Open Assign Delivery Boy Modal for an order card
  const handleOpenAssignDriverModal = (order) => {
    setOrderForDriverAssignment(order);
    setSelectedDriverId(order.riderDetails?.deliveryBoyId || '');
    setIsAssignDriverModalOpen(true);
  };

  // Confirm Assign Delivery Boy to Order
  const handleConfirmAssignDriver = async () => {
    if (!orderForDriverAssignment || !selectedDriverId) {
      toast.error('Please select an in-house delivery boy');
      return;
    }
    try {
      setIsAssigningDriver(true);
      const res = await api.post(`/restaurant/online-order/${orderForDriverAssignment._id}/assign-delivery-boy`, {
        deliveryBoyId: selectedDriverId
      });
      toast.success(res.data?.message || 'Delivery boy assigned successfully!');
      setIsAssignDriverModalOpen(false);
      setOrderForDriverAssignment(null);
      fetchData(true);
    } catch (err) {
      console.error('Assign driver error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign delivery boy');
    } finally {
      setIsAssigningDriver(false);
    }
  };

  // Toggle In-House Delivery Boy Shift Status
  const handleToggleDriverStatus = async (driverId, newStatus) => {
    try {
      await api.patch(`/restaurant/delivery-boys/${driverId}/status`, {
        deliveryBoyStatus: newStatus
      });
      toast.success(`Driver status updated to ${newStatus}`);
      fetchData(true);
    } catch (err) {
      console.error('Failed to update driver status:', err);
      toast.error('Failed to update driver status');
    }
  };

  // Create New In-House Delivery Boy
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!newDriverForm.name || !newDriverForm.phone || !newDriverForm.vehicleNumber) {
      toast.error('Please fill required fields (Name, Phone, Vehicle Number)');
      return;
    }
    try {
      setIsSubmittingDriver(true);
      await api.post('/restaurant/delivery-boys', {
        ...newDriverForm,
        salaryMonthly: Number(newDriverForm.salaryMonthly) || 18000
      });
      toast.success(`In-house delivery boy ${newDriverForm.name} onboarded!`);
      setIsAddDriverModalOpen(false);
      setNewDriverForm({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'BIKE',
        vehicleNumber: '',
        drivingLicenseNumber: '',
        salaryMonthly: '18000'
      });
      fetchData(true);
    } catch (err) {
      console.error('Failed to create delivery boy:', err);
      toast.error(err.response?.data?.message || 'Failed to register delivery boy');
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Submit Simulator Order
  const handleDispatchSimulation = async (e) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await api.post('/restaurant/aggregators/simulate', simulatorForm);
      toast.success(`Webhook Dispatched! ${simulatorForm.aggregator} order ${res.data.data.order.aggregatorOrderId} sent to KDS & Kitchen queue!`);
      setIsSimulatorModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Failed to dispatch simulated order:', err);
      toast.error('Simulation error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSimulating(false);
    }
  };

  // Preset quick fill for simulator
  const applyPreset = (presetType) => {
    if (menuItems.length === 0) return;

    if (presetType === 'BIRYANIS') {
      const biryaniItems = menuItems.filter(m => m.name.toLowerCase().includes('biryani') || m.name.toLowerCase().includes('rice')).slice(0, 2);
      const chosen = (biryaniItems.length > 0 ? biryaniItems : menuItems.slice(0, 2)).map(m => ({
        menuItemId: m._id,
        name: m.name,
        price: m.price || 320,
        quantity: 1,
        station: m.category || 'Kitchen',
        veg: Boolean(m.isVeg)
      }));

      setSimulatorForm({
        aggregator: 'ZOMATO',
        customerName: 'Sanjay Nair',
        customerPhone: '+91 98860-XXXXX (Masked)',
        deliveryAddress: 'Flat 502, Brigade Gateway, Malleshwaram (2.4 km)',
        cookingInstructions: 'Extra spicy, send 2x salan & onion raita packs.',
        riderName: 'Ramesh Gowda',
        riderPhone: '+91 98451-22334',
        riderVehicle: 'KA-02-JH-9090 (Hero Splendor)',
        estimatedMinutes: 12,
        selectedItems: chosen
      });
    } else if (presetType === 'ROLLS') {
      const rollItems = menuItems.filter(m => m.name.toLowerCase().includes('roll') || m.name.toLowerCase().includes('tikka') || m.name.toLowerCase().includes('paneer')).slice(0, 2);
      const chosen = (rollItems.length > 0 ? rollItems : menuItems.slice(0, 2)).map(m => ({
        menuItemId: m._id,
        name: m.name,
        price: m.price || 220,
        quantity: 2,
        station: m.category || 'Kitchen',
        veg: Boolean(m.isVeg)
      }));

      setSimulatorForm({
        aggregator: 'SWIGGY',
        customerName: 'Divya Sen',
        customerPhone: '+91 99001-XXXXX (Masked)',
        deliveryAddress: 'Tower 3, RMZ Ecoworld, Bellandur (3.8 km)',
        cookingInstructions: 'Office reception delivery. Do not call, please WhatsApp when at gate.',
        riderName: 'Vikram Jadhav',
        riderPhone: '+91 97412-99881',
        riderVehicle: 'KA-03-EQ-4411 (Honda Activa)',
        estimatedMinutes: 18,
        selectedItems: chosen
      });
    } else {
      const chosen = menuItems.slice(0, 3).map(m => ({
        menuItemId: m._id,
        name: m.name,
        price: m.price || 260,
        quantity: 1,
        station: m.category || 'Kitchen',
        veg: Boolean(m.isVeg)
      }));

      setSimulatorForm({
        aggregator: 'DIRECT_WEB',
        customerName: 'Meera Krishnan',
        customerPhone: '+91 98765-43210 (Direct Customer)',
        deliveryAddress: 'House 14, 2nd Main, Indiranagar (1.1 km)',
        cookingInstructions: 'Direct customer discount applied. Freshly prepared please.',
        riderName: 'Restaurant Steward (Direct)',
        riderPhone: '+91 90000-11111',
        riderVehicle: 'In-House Bike',
        estimatedMinutes: 10,
        selectedItems: chosen
      });
    }
  };

  // Open Bag Sticker Modal
  const handleOpenSticker = (order) => {
    setSelectedOrderForSticker(order);
    setIsBagStickerModalOpen(true);
  };

  // Safe destructuring
  const config = data?.config || {
    zomato: { status: 'ONLINE', storeId: 'ZOM-BLR-8921', commissionRate: 20, autoAccept: true, outletRating: 4.4 },
    swiggy: { status: 'ONLINE', storeId: 'SWIG-BLR-4309', commissionRate: 22, autoAccept: true, outletRating: 4.5 },
    directWeb: { status: 'ONLINE', storeId: 'APEX-DIRECT-01', commissionRate: 0, autoAccept: true, outletRating: 4.8 },
    surgeRainMode: false
  };

  const stats = data?.stats || {
    todayOrdersCount: 0,
    activeQueueCount: 0,
    grossGmvToday: 0,
    totalCommissionToday: 0,
    netPayoutToday: 0,
    effectiveTakeRate: 0
  };

  const activeQueue = data?.activeQueue || [];
  const recentDeliveries = data?.recentDeliveries || [];

  // Filtered Queue
  const displayedOrders = useMemo(() => {
    let list = statusFilter === 'ACTIVE' ? activeQueue : statusFilter === 'COMPLETED' ? recentDeliveries : [...activeQueue, ...recentDeliveries];

    if (platformFilter !== 'ALL') {
      list = list.filter(o => o.aggregator === platformFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(o => 
        o.orderNumber?.toLowerCase().includes(q) ||
        o.aggregatorOrderId?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q) ||
        o.riderDetails?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeQueue, recentDeliveries, statusFilter, platformFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl text-white shadow-sm flex items-center justify-center bg-orange-600">
              <Truck className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Online Delivery Aggregators & Webhooks
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Webhook Stream Live
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium max-w-2xl">
            Simulate, capture, and expediting delivery orders from Zomato, Swiggy, and Direct Web. Dispatches directly into your Kitchen Display System (KDS), tracks rider arrival, and reconciles commission payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-all cursor-pointer"
            title="Refresh stream"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleToggleStore('surgeRainMode')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              config.surgeRainMode 
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm animate-pulse' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{config.surgeRainMode ? 'Rain Surge ON (+10m)' : 'Rain Surge Mode'}</span>
          </button>

          <button
            onClick={() => {
              const pending = activeQueue.find(o => o.status === 'PENDING') || activeQueue[0];
              if (pending) {
                setBuzzerOrder(pending);
                setIsBuzzerOpen(true);
              } else {
                toast('No pending online orders right now. Click "Simulate Incoming Order" to trigger the buzzer audio alert!', { icon: '🔔' });
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              activeQueue.filter(o => o.status === 'PENDING').length > 0
                ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${activeQueue.filter(o => o.status === 'PENDING').length > 0 ? 'animate-bounce' : ''}`} />
            <span>
              {activeQueue.filter(o => o.status === 'PENDING').length > 0
                ? `🚨 Order Buzzer (${activeQueue.filter(o => o.status === 'PENDING').length})`
                : 'Order Buzzer'}
            </span>
          </button>

          <button
            onClick={() => {
              applyPreset('BIRYANIS');
              setIsSimulatorModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer bg-orange-600"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Simulate Incoming Order</span>
          </button>
        </div>
      </div>

      {/* Aggregator Store Platform Status Bar (Zomato / Swiggy / Direct) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Zomato Store Card */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                Z
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">Zomato Food Delivery</h3>
                <span className="text-[10px] font-mono text-stone-400">ID: {config.zomato?.storeId}</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleStore('zomato')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                config.zomato?.status === 'ONLINE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{config.zomato?.status}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-stone-400 block">Commission</span>
              <span className="font-extrabold text-stone-800 dark:text-stone-200">{config.zomato?.commissionRate}%</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Rating</span>
              <span className="font-extrabold text-amber-500">★ {config.zomato?.outletRating}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Auto Accept</span>
              <span className="font-extrabold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        {/* Swiggy Store Card */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                S
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">Swiggy Instadeliver</h3>
                <span className="text-[10px] font-mono text-stone-400">ID: {config.swiggy?.storeId}</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleStore('swiggy')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                config.swiggy?.status === 'ONLINE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{config.swiggy?.status}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-stone-400 block">Commission</span>
              <span className="font-extrabold text-stone-800 dark:text-stone-200">{config.swiggy?.commissionRate}%</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Rating</span>
              <span className="font-extrabold text-amber-500">★ {config.swiggy?.outletRating}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Auto Accept</span>
              <span className="font-extrabold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        {/* Direct Web Card */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                W
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">Direct Web & WhatsApp</h3>
                <span className="text-[10px] font-mono text-stone-400">ID: {config.directWeb?.storeId}</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleStore('directWeb')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                config.directWeb?.status === 'ONLINE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{config.directWeb?.status}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-stone-400 block">Commission</span>
              <span className="font-extrabold text-emerald-600">0% (Direct)</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Rating</span>
              <span className="font-extrabold text-amber-500">★ {config.directWeb?.outletRating}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">Own Delivery</span>
              <span className="font-extrabold text-stone-800 dark:text-stone-200">Active</span>
            </div>
          </div>

          <div className="mt-3">
            <Link
              to="/order"
              target="_blank"
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Customer Storefront</span>
            </Link>
          </div>
        </div>

      </div>

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Today's Delivery GMV</span>
          <p className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
            ₹{Number(stats.grossGmvToday).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            {stats.todayOrdersCount} online orders today
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Active In Kitchen</span>
          <p className="text-xl font-black text-orange-600 mt-1">
            {stats.activeQueueCount} <span className="text-xs font-bold text-stone-400">tickets</span>
          </p>
          <span className="text-[11px] text-orange-600 font-bold mt-1 block">
            Live KDS expediting
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Platform Commission</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            ₹{Number(stats.totalCommissionToday).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            Avg take-rate: {stats.effectiveTakeRate}%
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Net Payout Receivable</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            ₹{Number(stats.netPayoutToday).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            After aggregator cuts
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Avg Target Prep Time</span>
          <p className="text-xl font-black text-stone-800 dark:text-stone-200 mt-1">
            {config.defaultPrepTimeMinutes} <span className="text-xs font-bold text-stone-400">mins</span>
          </p>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            {config.surgeRainMode ? '⚡ Rain Surge Buffer Active' : 'Optimal kitchen pace'}
          </span>
        </div>

      </div>

      {/* Tab Switcher: Orders Queue vs In-House Delivery Fleet */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'ORDERS'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Live Delivery Orders Queue ({activeQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FLEET')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'FLEET'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'
          }`}
        >
          <Bike className="w-4 h-4 text-emerald-500" />
          <span>In-House Delivery Fleet ({deliveryBoys.length} Drivers)</span>
          {deliveryBoys.filter(b => b.deliveryBoyStatus === 'AVAILABLE').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {deliveryBoys.filter(b => b.deliveryBoyStatus === 'AVAILABLE').length} Available
            </span>
          )}
        </button>
      </div>

      {activeTab === 'FLEET' ? (
        <div className="space-y-6">
          {/* Fleet Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
                  Restaurant In-House Delivery Fleet
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active Dispatch Console
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Manage your internal delivery boys, monitor live trip availability, vehicles, and reconcile cash on delivery (COD).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddDriverModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Delivery Boy</span>
            </button>
          </div>

          {/* Fleet Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Delivery Staff</span>
              <p className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
                {deliveryBoys.length} <span className="text-xs font-bold text-stone-400">drivers</span>
              </p>
              <span className="text-[11px] text-stone-400 font-medium mt-1 block">In-house restaurant fleet</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Available on Standby</span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {deliveryBoys.filter(b => b.deliveryBoyStatus === 'AVAILABLE').length} <span className="text-xs font-bold text-stone-400">ready</span>
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Ready for immediate dispatch</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">Out on Delivery</span>
              <p className="text-xl font-black text-orange-600 mt-1">
                {deliveryBoys.filter(b => b.deliveryBoyStatus === 'ON_DELIVERY').length} <span className="text-xs font-bold text-stone-400">trips</span>
              </p>
              <span className="text-[11px] text-orange-600 font-medium mt-1 block">Active food delivery trips</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Total COD Cash in Hand</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                ₹{deliveryBoys.reduce((acc, b) => acc + (b.cashInHand || 0), 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-stone-400 font-medium mt-1 block">Awaiting cashier settlement</span>
            </div>
          </div>

          {/* Delivery Boys Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryBoys.map(boy => {
              const status = boy.deliveryBoyStatus || 'AVAILABLE';
              const isAvailable = status === 'AVAILABLE';
              const isOnDelivery = status === 'ON_DELIVERY';

              return (
                <div
                  key={boy._id}
                  className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Driver Top Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 font-black text-sm">
                          {boy.vehicleType === 'EV_SCOOTER' ? '⚡' : boy.vehicleType === 'CYCLE' ? '🚲' : '🛵'}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">{boy.name}</h3>
                          <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <a href={`tel:${boy.phone}`} className="hover:underline hover:text-emerald-600">{boy.phone}</a>
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        isAvailable 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isOnDelivery
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 animate-pulse'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[10px] font-bold uppercase">Vehicle</span>
                        <span className="font-extrabold text-stone-800 dark:text-stone-200">
                          {boy.vehicleType?.replace('_', ' ')} • {boy.vehicleNumber}
                        </span>
                      </div>
                      {boy.drivingLicenseNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400 text-[10px] font-bold uppercase">License</span>
                          <span className="font-mono text-stone-600 dark:text-stone-300 text-[11px]">
                            {boy.drivingLicenseNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deliveries & Cash Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold uppercase">Trips Completed</span>
                        <span className="text-base font-black text-stone-900 dark:text-stone-100">
                          {boy.totalDeliveriesCompleted || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold uppercase">Cash In Hand</span>
                        <span className="text-base font-black text-amber-700 dark:text-amber-300">
                          ₹{boy.cashInHand || 0}
                        </span>
                      </div>
                    </div>

                    {/* Active Order Trip details if out */}
                    {isOnDelivery && boy.currentOrderId && (
                      <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-xs space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-300 block flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>Active Delivery Trip</span>
                        </span>
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          Order #{boy.currentOrderId.orderNumber || boy.currentOrderId}
                        </p>
                        {boy.currentOrderId.customerName && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px]">
                            Customer: {boy.currentOrderId.customerName}
                          </p>
                        )}
                        {boy.currentOrderId.deliveryAddress && (
                          <p className="text-stone-500 dark:text-stone-400 text-[11px] line-clamp-1">
                            Dest: {boy.currentOrderId.deliveryAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Duty Status:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(boy._id, 'AVAILABLE')}
                        disabled={isAvailable}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(boy._id, 'OFF_DUTY')}
                        disabled={status === 'OFF_DUTY'}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          status === 'OFF_DUTY'
                            ? 'bg-stone-800 text-white shadow-2xs dark:bg-stone-200 dark:text-stone-900'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        Off Duty
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Filter Toolbar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Platform Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPlatformFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              platformFilter === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'
            }`}
          >
            All Platforms
          </button>
          {['ZOMATO', 'SWIGGY', 'DIRECT_WEB'].map(key => {
            const pInfo = AGGREGATOR_INFO[key];
            const isSelected = platformFilter === key;
            return (
              <button
                key={key}
                onClick={() => setPlatformFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? `${pInfo.brandBadge} shadow-xs`
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                }`}
              >
                <span>{pInfo.iconText}</span>
                <span>{key === 'DIRECT_WEB' ? 'Direct Web' : key}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Search and Status toggle */}
        <div className="flex items-center gap-2">
          
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search order ID, rider, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-500'
              }`}
            >
              Active ({activeQueue.length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-500'
              }`}
            >
              Past ({recentDeliveries.length})
            </button>
          </div>

        </div>

      </div>

      {/* Live Online Delivery Order Cards Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Connecting to Aggregator Webhooks...
          </p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          <Truck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No Online Delivery Orders Found</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            {searchTerm || platformFilter !== 'ALL'
              ? 'No delivery tickets matched your active filter. Try resetting search or platform pills.'
              : 'Dispatch an incoming Zomato or Swiggy test order using the simulator above!'}
          </p>
          <button
            onClick={() => {
              applyPreset('BIRYANIS');
              setIsSimulatorModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch Webhook Simulator</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedOrders.map(order => {
            const platform = order.aggregator || 'DIRECT_WEB';
            const pInfo = AGGREGATOR_INFO[platform] || AGGREGATOR_INFO.DIRECT_WEB;
            const riderStatus = order.riderDetails?.status || 'ASSIGNED';
            const isCompleted = order.status === 'COMPLETED' || riderStatus === 'DELIVERED';

            return (
              <div
                key={order._id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${pInfo.brandBadge}`}>
                        {platform}
                      </span>
                      <span className="font-mono font-extrabold text-xs text-stone-900 dark:text-stone-100">
                        {order.aggregatorOrderId || order.orderNumber}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isCompleted 
                        ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        : order.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                          {order.customerName}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-400">
                          {order.customerPhone}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.deliveryAddress}</span>
                      </p>
                    </div>

                    {/* Cooking Instructions Alert Box */}
                    {order.cookingInstructions && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-2.5 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 space-y-0.5">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Special Food Request:</span>
                        </div>
                        <p className="italic">"{order.cookingInstructions}"</p>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Food Items ({order.items?.length || 0})
                      </span>
                      <div className="space-y-1 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-stone-900 dark:text-stone-100">{it.quantity}x</span>
                              <span className="text-stone-700 dark:text-stone-300 font-medium truncate max-w-[170px]">{it.name}</span>
                            </div>
                            <span className="font-bold text-stone-800 dark:text-stone-200">
                              ₹{(Number(it.price) * Number(it.quantity))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rider Dispatch & In-House Delivery Boy Tracker */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-stone-800 dark:text-stone-200">
                          <Bike className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{order.riderDetails?.name || 'In-House Delivery Boy'}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          riderStatus === 'DELIVERED' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : riderStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-orange-100 text-orange-800'
                              : riderStatus === 'ARRIVED_AT_STORE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}>
                          {riderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {order.riderDetails?.vehicleNumber ? (
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                          <span>Vehicle: {order.riderDetails.vehicleNumber}</span>
                          {order.riderDetails?.phone && (
                            <a href={`tel:${order.riderDetails.phone}`} className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {order.riderDetails.phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                          <span className="font-semibold">⚠️ No driver assigned</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignDriverModal(order)}
                            className="font-bold text-xs underline cursor-pointer hover:text-amber-800"
                          >
                            Assign Driver
                          </button>
                        </div>
                      )}

                      {/* Advance Rider Status Button or Accept/Reject */}
                      {order.status === 'PENDING' ? (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setBuzzerOrder(order);
                              setIsBuzzerOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>🚨 Review with Buzzer Alert</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptDirectOrder(order._id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>Accept & Cook</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectDirectOrder(order)}
                              className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ) : !isCompleted ? (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdvanceRiderStatus(order)}
                            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>Next:</span>
                            <span className="text-orange-600 font-black">
                              {riderStatus === 'ASSIGNED' ? 'Mark Rider At Kitchen Door 🚪'
                                : riderStatus === 'ARRIVED_AT_STORE' ? 'Handover Food & Dispatch 🛵'
                                : 'Mark Food Delivered to Customer ✅'}
                            </span>
                          </button>

                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignDriverModal(order)}
                              className="text-[10px] font-bold text-stone-400 hover:text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Bike className="w-3 h-3" />
                              <span>{order.riderDetails?.name ? 'Change Driver' : 'Assign Driver'}</span>
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                  </div>
                </div>

                {/* Footer Financials & Sticker Print */}
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Gross GMV</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block">
                        Net Payout ({100 - (order.aggregatorCommission?.rate || 20)}%)
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{Number(order.aggregatorCommission?.netPayout || (order.totalAmount * 0.8)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-400 font-mono">
                      Ref: {order.orderNumber}
                    </span>

                    <button
                      onClick={() => handleOpenSticker(order)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:text-orange-600 hover:underline cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Delivery Bag Sticker</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* SIMULATE AGGREGATOR ORDER MODAL */}
      {isSimulatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-600 fill-orange-600" />
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    Aggregator Webhook Order Simulator
                  </h3>
                  <p className="text-xs text-stone-400">Inject live delivery payloads into POS & KDS pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulatorModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSimulation} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Presets */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Quick Scenario Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('BIRYANIS')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                      simulatorForm.aggregator === 'ZOMATO'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span className="block text-sm">🔴 Zomato</span>
                    <span className="text-[10px] text-stone-500">Biryani Combo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('ROLLS')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                      simulatorForm.aggregator === 'SWIGGY'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span className="block text-sm">🟠 Swiggy</span>
                    <span className="text-[10px] text-stone-500">Rolls & Snacks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('DIRECT')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                      simulatorForm.aggregator === 'DIRECT_WEB'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span className="block text-sm">🟢 Direct Web</span>
                    <span className="text-[10px] text-stone-500">Family Feast</span>
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={simulatorForm.customerName}
                    onChange={(e) => setSimulatorForm(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Masked Phone *
                  </label>
                  <input
                    type="text"
                    value={simulatorForm.customerPhone}
                    onChange={(e) => setSimulatorForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Delivery Destination Address *
                </label>
                <input
                  type="text"
                  value={simulatorForm.deliveryAddress}
                  onChange={(e) => setSimulatorForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Cooking Instructions */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Special Cooking Instructions
                </label>
                <input
                  type="text"
                  value={simulatorForm.cookingInstructions}
                  onChange={(e) => setSimulatorForm(prev => ({ ...prev, cookingInstructions: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Rider Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Simulated Rider Name
                  </label>
                  <input
                    type="text"
                    value={simulatorForm.riderName}
                    onChange={(e) => setSimulatorForm(prev => ({ ...prev, riderName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={simulatorForm.riderVehicle}
                    onChange={(e) => setSimulatorForm(prev => ({ ...prev, riderVehicle: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSimulatorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{simulating ? 'Injecting Webhook...' : 'Fire Delivery Webhook'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PRINTABLE DELIVERY BAG STICKER / FOOD SEAL MODAL */}
      {isBagStickerModalOpen && selectedOrderForSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-stone-900 w-full max-w-sm rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            
            <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Kitchen Packaging Food Seal</span>
              </div>
              <button
                onClick={() => setIsBagStickerModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Body */}
            <div id="printable-bag-sticker" className="p-6 space-y-4 bg-white text-xs border border-dashed border-stone-300 m-4 rounded-2xl">
              
              <div className="text-center border-b pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
                  {selectedOrderForSticker.aggregator} DISPATCH
                </span>
                <h3 className="text-xl font-black text-stone-900 tracking-tight mt-0.5">
                  {selectedOrderForSticker.aggregatorOrderId || selectedOrderForSticker.orderNumber}
                </h3>
                <p className="text-[10px] text-stone-500">{new Date(selectedOrderForSticker.createdAt).toLocaleTimeString('en-IN')}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Customer Destination</span>
                <p className="font-extrabold text-stone-900 text-sm">{selectedOrderForSticker.customerName}</p>
                <p className="text-[11px] text-stone-600 line-clamp-2">{selectedOrderForSticker.deliveryAddress}</p>
              </div>

              {selectedOrderForSticker.cookingInstructions && (
                <div className="bg-stone-50 p-2 rounded-xl text-[10px] text-stone-700 italic border border-stone-200">
                  Note: "{selectedOrderForSticker.cookingInstructions}"
                </div>
              )}

              {/* Items checklist */}
              <div className="space-y-1 border-t border-b py-2.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Package Contents:</span>
                {selectedOrderForSticker.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-stone-800">
                    <span>[ ] {it.quantity}x {it.name}</span>
                    <span>₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs font-black">
                <span>Total Paid by Customer:</span>
                <span>₹{selectedOrderForSticker.totalAmount}</span>
              </div>

              {/* Tamper Seal Guarantee */}
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-center text-[10px] text-amber-900 font-bold">
                🔒 TAMPER PROOF SEALED
                <span className="block font-normal text-amber-800 text-[9px]">Do not accept package if sticker seal is broken</span>
              </div>

            </div>

            <div className="p-4 bg-stone-50 border-t flex items-center justify-between">
              <span className="text-xs text-stone-500">Thermal sticker layout</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ORDER BUZZER POPUP MODAL (Audible & Visual Alert) */}
      <OrderBuzzerModal
        order={buzzerOrder}
        isOpen={isBuzzerOpen}
        onAccept={handleAcceptOrderFromBuzzer}
        onReject={handleRejectOrderFromBuzzer}
        deliveryBoys={deliveryBoys}
        actionLoading={buzzerActionLoading}
      />

      {/* ASSIGN IN-HOUSE DELIVERY BOY MODAL */}
      {isAssignDriverModalOpen && orderForDriverAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                  Assign In-House Delivery Boy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignDriverModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Order Ref: {orderForDriverAssignment.aggregatorOrderId || orderForDriverAssignment.orderNumber}</span>
                  <span className="text-emerald-600">₹{orderForDriverAssignment.totalAmount}</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300">Customer: {orderForDriverAssignment.customerName}</p>
                <p className="text-stone-400 text-[11px] line-clamp-1">{orderForDriverAssignment.deliveryAddress}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Select Available Rider:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {deliveryBoys.map(boy => {
                    const isAvailable = boy.deliveryBoyStatus === 'AVAILABLE';
                    const isSelected = selectedDriverId === boy._id;

                    return (
                      <div
                        key={boy._id}
                        onClick={() => setSelectedDriverId(boy._id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-200'
                            : 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 hover:border-emerald-300 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">
                            {boy.vehicleType === 'EV_SCOOTER' ? '⚡' : boy.vehicleType === 'CYCLE' ? '🚲' : '🛵'}
                          </span>
                          <div>
                            <p className="font-extrabold">{boy.name}</p>
                            <p className="text-[11px] text-stone-400">
                              {boy.vehicleType?.replace('_', ' ')} • {boy.vehicleNumber}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
                          }`}>
                            {boy.deliveryBoyStatus}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            {boy.totalDeliveriesCompleted || 0} trips done
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignDriver}
                  disabled={isAssigningDriver || !selectedDriverId}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAssigningDriver ? 'Assigning...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD IN-HOUSE DELIVERY BOY MODAL */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    Register In-House Delivery Boy
                  </h3>
                  <p className="text-xs text-stone-400">Onboard restaurant driver for direct food deliveries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDriverModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    value={newDriverForm.name}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765-43210"
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={newDriverForm.vehicleType}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, vehicleType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="BIKE">Motorcycle / Bike 🏍️</option>
                    <option value="SCOOTER">Scooter 🛵</option>
                    <option value="EV_SCOOTER">Electric Scooter (EV) ⚡</option>
                    <option value="CYCLE">Bicycle 🚲</option>
                    <option value="NONE">Walking / None 🚶</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    value={newDriverForm.vehicleNumber}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, vehicleNumber: e.target.value }))}
                    placeholder="e.g. KA-03-HA-8821"
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    value={newDriverForm.drivingLicenseNumber}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, drivingLicenseNumber: e.target.value }))}
                    placeholder="e.g. DL-04-2023-99881"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={newDriverForm.salaryMonthly}
                    onChange={(e) => setNewDriverForm(p => ({ ...p, salaryMonthly: e.target.value }))}
                    placeholder="18000"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDriver}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmittingDriver ? 'Registering...' : 'Register Delivery Boy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
