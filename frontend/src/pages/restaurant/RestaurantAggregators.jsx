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
  ExternalLink, CloudRain
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

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

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

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

      const [aggRes, menuRes] = await Promise.all([
        api.get('/restaurant/aggregators'),
        api.get('/restaurant/menu')
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

  // Advance Rider Dispatch Status
  const handleAdvanceRiderStatus = async (order) => {
    const cur = order.riderDetails?.status || 'ASSIGNED';
    let nextStatus = 'ASSIGNED';

    if (cur === 'ASSIGNED') nextStatus = 'ARRIVED_AT_STORE';
    else if (cur === 'ARRIVED_AT_STORE') nextStatus = 'OUT_FOR_DELIVERY';
    else if (cur === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    else return;

    try {
      await api.patch(`/restaurant/aggregators/rider/${order._id}`, { status: nextStatus });
      toast.success(`Order ${order.aggregatorOrderId || order.orderNumber}: Rider is now ${nextStatus.replace(/_/g, ' ')}`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to update rider status');
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
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm animate-pulse' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{config.surgeRainMode ? 'Rain Surge ON (+10m)' : 'Rain Surge Mode'}</span>
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

                    {/* Rider Dispatch Tracker */}
                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-stone-800 dark:text-stone-200">
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          <span>{order.riderDetails?.name || 'Rider Assigned'}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          riderStatus === 'DELIVERED' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : riderStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 text-blue-800'
                              : riderStatus === 'ARRIVED_AT_STORE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}>
                          {riderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {order.riderDetails?.vehicleNumber && (
                        <p className="text-[11px] text-stone-500 font-mono">
                          Vehicle: {order.riderDetails.vehicleNumber}
                        </p>
                      )}

                      {/* Advance Rider Status Button or Accept/Reject */}
                      {order.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptDirectOrder(order._id)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>Accept & Cook</span>
                          </button>
                          <button
                            onClick={() => handleRejectDirectOrder(order)}
                            className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : !isCompleted ? (
                        <button
                          onClick={() => handleAdvanceRiderStatus(order)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Next:</span>
                          <span className="text-orange-600 font-black">
                            {riderStatus === 'ASSIGNED' ? 'Mark At Store Door 🚪'
                              : riderStatus === 'ARRIVED_AT_STORE' ? 'Handover & Dispatch 🛵'
                              : 'Mark Delivered ✅'}
                          </span>
                        </button>
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

    </div>
  );
}
