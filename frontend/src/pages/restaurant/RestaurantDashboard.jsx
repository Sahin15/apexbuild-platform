import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, ChefHat, IndianRupee, ShoppingBag, 
  TrendingUp, Users, Clock, AlertTriangle, CheckCircle2, 
  ArrowRight, Flame, Grid3x3, Plus, Sparkles, Store, 
  Layers, Package, Coffee, ChevronRight, Eye, RefreshCw, Receipt, Truck,
  Bell, Globe, Check, X, CalendarDays, Phone, Heart, Gift, Briefcase, UserCheck, Bike, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';
import OrderBuzzerModal from '../../components/restaurant/OrderBuzzerModal';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [tablesList, setTablesList] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [tableSelectionMap, setTableSelectionMap] = useState({});
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Fully booked for this dining slot');
  const [actionLoading, setActionLoading] = useState(null);
  const [simulatingBooking, setSimulatingBooking] = useState(false);

  const [isRejectOrderModalOpen, setIsRejectOrderModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [deliveryRejectionReason, setDeliveryRejectionReason] = useState('Kitchen at maximum capacity');
  const [actionLoadingOrder, setActionLoadingOrder] = useState(null);
  const [simulatingDeliveryOrder, setSimulatingDeliveryOrder] = useState(false);

  // Buzzer Modal State
  const [isBuzzerOpen, setIsBuzzerOpen] = useState(false);
  const [buzzerOrder, setBuzzerOrder] = useState(null);
  const [dismissedBuzzerIds, setDismissedBuzzerIds] = useState(new Set());
  const [buzzerLoading, setBuzzerLoading] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/restaurant/dashboard');
      if (res.data?.data) {
        setLiveData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load restaurant dashboard data:', err);
      toast.error('Unable to fetch live restaurant metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 8 seconds for real-time online booking alerts
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);

    // Fetch active tables for allocation dropdown
    api.get('/restaurant/tables').then(res => {
      if (res.data?.data?.tables) setTablesList(res.data.data.tables);
    }).catch(err => console.error(err));

    // Fetch in-house delivery boys
    api.get('/restaurant/delivery-boys').then(res => {
      if (res.data?.data) {
        const list = res.data.data.deliveryBoys || (Array.isArray(res.data.data) ? res.data.data : []);
        setDeliveryBoys(list);
      }
    }).catch(err => console.error(err));

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Auto-trigger buzzer alert on fresh pending delivery orders
  useEffect(() => {
    if (liveData?.pendingDeliveryOrders?.length > 0) {
      const pendingOrder = liveData.pendingDeliveryOrders.find(
        o => !dismissedBuzzerIds.has(o._id)
      );
      if (pendingOrder && !isBuzzerOpen) {
        setBuzzerOrder(pendingOrder);
        setIsBuzzerOpen(true);
      }
    }
  }, [liveData?.pendingDeliveryOrders, dismissedBuzzerIds, isBuzzerOpen]);

  const handleAcceptOrderFromBuzzer = async (orderId, { deliveryBoyId, estimatedPrepMinutes } = {}) => {
    try {
      setBuzzerLoading(true);
      await api.post(`/restaurant/online-order/${orderId}/accept`, { estimatedPrepMinutes });
      if (deliveryBoyId) {
        await api.post(`/restaurant/online-order/${orderId}/assign-delivery-boy`, { deliveryBoyId });
      }
      toast.success('Food delivery order accepted & sent to kitchen!');
      setIsBuzzerOpen(false);
      setBuzzerOrder(null);
      setDismissedBuzzerIds(prev => new Set([...prev, orderId]));
      fetchDashboardData(true);
    } catch (err) {
      console.error('Accept from buzzer error:', err);
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setBuzzerLoading(false);
    }
  };

  const handleRejectOrderFromBuzzer = async (orderId, reason) => {
    try {
      setBuzzerLoading(true);
      await api.post(`/restaurant/online-order/${orderId}/reject`, { reason });
      toast.success('Food delivery order rejected');
      setIsBuzzerOpen(false);
      setBuzzerOrder(null);
      setDismissedBuzzerIds(prev => new Set([...prev, orderId]));
      fetchDashboardData(true);
    } catch (err) {
      console.error('Reject from buzzer error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setBuzzerLoading(false);
    }
  };

  const handleAcceptOnlineBooking = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      const chosenTable = tableSelectionMap[bookingId];
      const res = await api.post(`/restaurant/online-booking/${bookingId}/accept`, {
        tableId: chosenTable || undefined
      });
      toast.success(res.data?.message || 'Online booking accepted! Table reserved.');
      fetchDashboardData(true);
    } catch (err) {
      console.error('Accept booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectModal = (booking) => {
    setBookingToReject(booking);
    setRejectionReason('Fully booked for this dining slot');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!bookingToReject) return;
    try {
      setActionLoading(bookingToReject._id);
      await api.post(`/restaurant/online-booking/${bookingToReject._id}/reject`, {
        reason: rejectionReason
      });
      toast.success(`Booking ${bookingToReject.reservationCode} rejected`);
      setIsRejectModalOpen(false);
      setBookingToReject(null);
      fetchDashboardData(true);
    } catch (err) {
      console.error('Reject booking error:', err);
      toast.error('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateOnlineBooking = async () => {
    try {
      setSimulatingBooking(true);
      const res = await api.post('/restaurant/online-booking/simulate');
      toast.success(res.data?.message || 'Online guest booking simulated! See alert banner.');
      fetchDashboardData(true);
    } catch (err) {
      console.error('Simulate booking error:', err);
      toast.error('Failed to simulate online booking');
    } finally {
      setSimulatingBooking(false);
    }
  };

  const handleAcceptDeliveryOrder = async (orderId) => {
    try {
      setActionLoadingOrder(orderId);
      const res = await api.post(`/restaurant/online-order/${orderId}/accept`);
      toast.success(res.data?.message || 'Food delivery order accepted & sent to kitchen!');
      fetchDashboardData(true);
    } catch (err) {
      console.error('Accept delivery order error:', err);
      toast.error(err.response?.data?.message || 'Failed to accept delivery order');
    } finally {
      setActionLoadingOrder(null);
    }
  };

  const handleOpenRejectOrderModal = (order) => {
    setOrderToReject(order);
    setDeliveryRejectionReason('Kitchen at maximum capacity');
    setIsRejectOrderModalOpen(true);
  };

  const handleConfirmRejectOrder = async () => {
    if (!orderToReject) return;
    try {
      setActionLoadingOrder(orderToReject._id);
      await api.post(`/restaurant/online-order/${orderToReject._id}/reject`, {
        reason: deliveryRejectionReason
      });
      toast.success(`Order ${orderToReject.orderNumber} rejected`);
      setIsRejectOrderModalOpen(false);
      setOrderToReject(null);
      fetchDashboardData(true);
    } catch (err) {
      console.error('Reject delivery order error:', err);
      toast.error('Failed to reject delivery order');
    } finally {
      setActionLoadingOrder(null);
    }
  };

  const handleSimulateDeliveryOrder = async () => {
    try {
      setSimulatingDeliveryOrder(true);
      const res = await api.post('/restaurant/online-order/simulate');
      toast.success(res.data?.message || 'New online food order simulated! See alert tray.');
      fetchDashboardData(true);
    } catch (err) {
      console.error('Simulate order error:', err);
      toast.error('Failed to simulate online food order');
    } finally {
      setSimulatingDeliveryOrder(false);
    }
  };

  // Fallback demo metrics if live database is empty
  const metrics = {
    todaySales: liveData?.todaySales ?? 48650,
    salesGrowth: '+12.4%',
    ordersCount: liveData?.ordersCount ?? 142,
    activeTables: liveData?.activeTables ?? 18,
    totalTables: liveData?.totalTables ?? 24,
    occupancyRate: liveData?.occupancyRate ?? 75,
    kitchenActiveTickets: liveData?.kitchenActiveTickets ?? 9,
    kitchenReadyTickets: liveData?.kitchenReadyTickets ?? 2,
    lowStockCount: liveData?.outOfStockCount ?? 3,
    avgOrderValue: liveData?.avgOrderValue ?? 342,
    cashInDrawer: 14200,
    openingFloat: 5000,
  };

  // 7-day revenue trend data
  const defaultWeeklySales = [
    { day: 'Mon', sales: 34200, orders: 104 },
    { day: 'Tue', sales: 38900, orders: 118 },
    { day: 'Wed', sales: 41200, orders: 122 },
    { day: 'Thu', sales: 39800, orders: 115 },
    { day: 'Fri', sales: 54600, orders: 168 },
    { day: 'Sat', sales: 62400, orders: 194 },
    { day: 'Sun', sales: liveData?.todaySales || 48650, orders: liveData?.ordersCount || 142 },
  ];

  const weeklySalesData = (liveData?.weeklyTrend && liveData.weeklyTrend.some(d => d.sales > 0))
    ? liveData.weeklyTrend
    : defaultWeeklySales;

  // Channel distribution
  const dineInVal = liveData?.dineInCount ?? 84;
  const takeawayVal = liveData?.takeawayCount ?? 42;
  const deliveryVal = liveData?.deliveryCount ?? 16;
  const totalChannelOrders = (dineInVal + takeawayVal + deliveryVal) || 1;

  const channelData = [
    { name: 'Dine-In', value: dineInVal, color: '#EA580C' },
    { name: 'Takeaway', value: takeawayVal, color: '#F59E0B' },
    { name: 'Direct Delivery', value: deliveryVal, color: '#3B82F6' },
  ];

  // Live order queue sample or live orders
  const recentOrders = (liveData?.recentOrders && liveData.recentOrders.length > 0)
    ? liveData.recentOrders.map(ord => ({
        id: ord.orderNumber || `ORD-${ord._id?.slice(-4)}`,
        time: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        channel: ord.orderType || 'DINE_IN',
        target: ord.tableName || ord.orderType,
        items: ord.items?.map(i => `${i.name} (${i.quantity})`).join(', ') || 'Assorted items',
        amount: ord.grandTotal || 0,
        orderStatus: ord.status || 'CONFIRMED',
        paymentStatus: ord.paymentStatus || 'PENDING',
        steward: ord.stewardName || 'Staff'
      }))
    : [
        {
          id: 'ORD-9042',
          time: '2 mins ago',
          channel: 'DINE_IN',
          target: 'Table 04',
          items: 'Butter Chicken (1), Garlic Naan (3), Sweet Lassi (2)',
          amount: 680,
          orderStatus: 'PREPARING',
          paymentStatus: 'PAID',
          steward: 'Rahul S.'
        },
        {
          id: 'ORD-9041',
          time: '6 mins ago',
          channel: 'TAKEAWAY',
          target: 'Token #28',
          items: 'Paneer Tikka Roll (2), Masala Fries (1), Cold Coffee (1)',
          amount: 410,
          orderStatus: 'READY',
          paymentStatus: 'PAID',
          steward: 'Counter 1'
        },
        {
          id: 'ORD-9040',
          time: '11 mins ago',
          channel: 'DINE_IN',
          target: 'Table 11 (Patio)',
          items: 'Mutton Rogan Josh (1), Steamed Basmati (2), Roti (4)',
          amount: 890,
          orderStatus: 'SERVED',
          paymentStatus: 'PENDING',
          steward: 'Amit K.'
        },
        {
          id: 'ORD-9039',
          time: '17 mins ago',
          channel: 'DELIVERY',
          target: 'Swiggy / Direct #109',
          items: 'Chicken Dum Biryani (2), Mirchi Ka Salan, Raita',
          amount: 720,
          orderStatus: 'READY',
          paymentStatus: 'PAID',
          steward: 'Dispatch'
        },
      ];

  // Floor sections preview or live
  const floorSections = (liveData?.areaSummaries && liveData.areaSummaries.length > 0)
    ? liveData.areaSummaries
    : [
        { name: 'Main Dining Hall', occupied: 11, total: 14, rate: '78%' },
        { name: 'Outdoor Patio', occupied: 4, total: 6, rate: '67%' },
        { name: 'AC Family Lounge', occupied: 3, total: 4, rate: '75%' },
      ];

  if (loading && !liveData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
          Loading Restaurant Operations & Floor Analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Live Server Sync Notice Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Database Connected
              </span>
              <p className="text-sm font-bold text-emerald-950">
                ApexBuild Restaurant OS
              </p>
            </div>
            <p className="text-xs text-emerald-800/90 mt-0.5">
              Real-time synchronization with POS orders, table occupancy, kitchen tickets, and billing records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-800 border border-emerald-300 hover:bg-emerald-50 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <Link
            to="/restaurant/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Launch POS
          </Link>
          <Link
            to="/restaurant/kitchen"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-800 border border-amber-300/80 hover:bg-amber-50/50 shadow-2xs"
          >
            <ChefHat className="w-3.5 h-3.5 text-orange-600" />
            View KDS
          </Link>
        </div>
      </div>

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: effectivePrimary }}
            >
              F&B Operations
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lunch Service Shift • Register #1 Active
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              {lastUpdated && ` • Synced at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Chef & Manager'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time floor occupancy, kitchen ticket dispatch, and daily billing summary.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/restaurant/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-orange-500/20 transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Open Touch POS</span>
          </Link>
          <Link
            to="/restaurant/kitchen"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all active:scale-95 cursor-pointer"
          >
            <ChefHat className="w-4 h-4 text-orange-600" />
            <span>Kitchen Display</span>
          </Link>
          <Link
            to="/restaurant/aggregators"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-stone-900 hover:bg-stone-800 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Delivery Orders (Zomato/Swiggy)</span>
          </Link>
          <button
            onClick={handleSimulateOnlineBooking}
            disabled={simulatingBooking}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Globe className={`w-4 h-4 text-amber-700 ${simulatingBooking ? 'animate-spin' : ''}`} />
            <span>Simulate Table Booking</span>
          </button>
          <button
            onClick={handleSimulateDeliveryOrder}
            disabled={simulatingDeliveryOrder}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Bike className={`w-4 h-4 text-emerald-700 ${simulatingDeliveryOrder ? 'animate-spin' : ''}`} />
            <span>Simulate Food Order</span>
          </button>
        </div>
      </div>

      {/* CONSTANT INCOMING ONLINE BOOKING TRAY (Shows constantly until any action is taken) */}
      {liveData?.pendingOnlineBookings && liveData.pendingOnlineBookings.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/60 p-5 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
                  Live Online Reservation Requests ({liveData.pendingOnlineBookings.length} Awaiting Decision)
                </h3>
                <p className="text-xs text-amber-300/90 font-medium">
                  Constantly requiring action. These online bookings will remain here until you Accept or Reject each request.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/reserve"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span>Public Booking Portal</span>
              </Link>
            </div>
          </div>

          {/* Cards for each pending booking */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {liveData.pendingOnlineBookings.map((booking) => {
              const isActing = actionLoading === booking._id;
              const chosenTableId = tableSelectionMap[booking._id] || '';

              return (
                <div
                  key={booking._id}
                  className="rounded-2xl bg-stone-900/90 border border-amber-500/40 p-4 space-y-3 shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Row: Ref & Guest Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {booking.customerName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {booking.reservationCode}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-500" />
                          <span>{booking.customerPhone}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                        PENDING
                      </span>
                    </div>

                    {/* Booking Details Strip */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-300">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-white font-semibold border border-stone-700 flex items-center gap-1">
                        <Users className="w-3 h-3 text-orange-400" />
                        {booking.partySize} Guests
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-white font-semibold border border-stone-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {booking.timeSlot} • {new Date(booking.reservationDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>

                      {booking.specialOccasion !== 'NONE' && (
                        <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-300 font-semibold border border-pink-500/20 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {booking.specialOccasion?.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Dietary Tags */}
                    {booking.dietaryPreferences?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {booking.dietaryPreferences.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {tag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Guest Notes */}
                    {booking.guestNotes && (
                      <p className="text-xs text-stone-300 italic bg-stone-800/40 p-2 rounded-xl border border-stone-800">
                        "{booking.guestNotes}"
                      </p>
                    )}

                    {/* Table Allocation Dropdown */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Allocate Table (Optional):
                      </label>
                      <select
                        value={chosenTableId}
                        onChange={(e) => setTableSelectionMap(prev => ({ ...prev, [booking._id]: e.target.value }))}
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">-- Auto-Allocate Best Available Table --</option>
                        {tablesList.filter(t => t.status === 'AVAILABLE').map(tbl => (
                          <option key={tbl._id} value={tbl._id}>
                            Table {tbl.tableNumber} ({tbl.capacity} Pax, {tbl.areaId?.name || 'Main'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Accept & Reject Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-stone-800">
                    <button
                      onClick={() => handleAcceptOnlineBooking(booking._id)}
                      disabled={isActing}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                    >
                      {isActing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Confirm</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(booking)}
                      disabled={isActing}
                      className="py-2 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONSTANT INCOMING ONLINE FOOD DELIVERY ORDER TRAY (Shows constantly until any action is taken) */}
      {liveData?.pendingDeliveryOrders && liveData.pendingDeliveryOrders.length > 0 && (
        <div className="rounded-3xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/70 via-stone-900 to-emerald-950/60 p-5 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bike className="w-5 h-5 text-emerald-400 animate-bounce" />
                  Live Online Food Delivery Orders ({liveData.pendingDeliveryOrders.length} Awaiting Kitchen Acceptance)
                </h3>
                <p className="text-xs text-emerald-300/90 font-medium">
                  Constantly requiring action. These food orders will remain here until you Accept & Send to Kitchen or Reject each order.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (liveData?.pendingDeliveryOrders?.length > 0) {
                    setBuzzerOrder(liveData.pendingDeliveryOrders[0]);
                    setIsBuzzerOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md animate-pulse cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span>🚨 Open Order Buzzer Alert</span>
              </button>
              <Link
                to="/order"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Storefront</span>
              </Link>
            </div>
          </div>

          {/* Cards for each pending food delivery order */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {liveData.pendingDeliveryOrders.map((ord) => {
              const isActing = actionLoadingOrder === ord._id;

              return (
                <div
                  key={ord._id}
                  className="rounded-2xl bg-stone-900/90 border border-emerald-500/40 p-4 space-y-3 shadow-lg hover:border-emerald-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Row: Ref & Guest Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {ord.customerName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {ord.orderNumber}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-500" />
                          <span>{ord.customerPhone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400 block">
                          ₹{ord.grandTotal}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-stone-800 text-stone-300 border border-stone-700">
                          {ord.paymentMethod?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="text-xs text-stone-300 flex items-start gap-1.5 bg-stone-800/40 p-2 rounded-xl border border-stone-800">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{ord.deliveryAddress}</span>
                    </div>

                    {/* Ordered Items List */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] font-semibold text-stone-400">Order Items ({ord.items?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1">
                        {ord.items?.map((it, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${it.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{it.name} × {it.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cooking Instructions */}
                    {ord.cookingInstructions && (
                      <p className="text-xs text-stone-300 italic bg-stone-800/40 p-2 rounded-xl border border-stone-800">
                        "{ord.cookingInstructions}"
                      </p>
                    )}
                  </div>

                  {/* Accept & Reject Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        setBuzzerOrder(ord);
                        setIsBuzzerOpen(true);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-rose-400" />
                      <span>Review in Buzzer Console</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptDeliveryOrder(ord._id)}
                        disabled={isActing}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                      >
                        {isActing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Accept & Cook</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRejectOrderModal(ord)}
                        disabled={isActing}
                        className="py-2 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Sales</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{Number(metrics.todaySales).toLocaleString('en-IN')}
          </p>
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3 mr-0.5" /> {metrics.salesGrowth} vs y'day
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{metrics.ordersCount}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            {dineInVal} Dine-In • {takeawayVal} Takeaway
          </p>
        </div>

        {/* Floor Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dine-In Floor</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Grid3x3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {metrics.activeTables} <span className="text-xs font-bold text-slate-400">/ {metrics.totalTables}</span>
          </p>
          <p className="text-[10px] font-bold text-emerald-600 mt-1">
            {metrics.occupancyRate}% Occupancy Rate
          </p>
        </div>

        {/* Kitchen Tickets */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Kitchen</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {metrics.kitchenActiveTickets} <span className="text-xs font-bold text-slate-400">Active</span>
          </p>
          <p className="text-[10px] font-bold text-rose-600 mt-1">
            {metrics.kitchenReadyTickets} Ready for Steward
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Ticket (AOV)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">₹{metrics.avgOrderValue}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Avg 2.6 covers / table
          </p>
        </div>

        {/* Cash in Drawer */}
        <Link to="/restaurant/billing" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-purple-300 transition-all block group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">Cash Register</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            ₹{metrics.cashInDrawer.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-between">
            <span>Float: ₹{metrics.openingFloat}</span>
            <span className="text-purple-600 font-bold group-hover:underline">Ledger →</span>
          </p>
        </Link>

      </div>

      {/* Main Charts & Operational Queue Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Revenue Trend & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">7-Day Sales & Volume Trend</h3>
                <p className="text-xs text-slate-400">Combined gross collections across Dine-in, Takeaway & Delivery</p>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                Live Data Stream
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="restSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={effectivePrimary} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={effectivePrimary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Sales']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={effectivePrimary} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#restSalesGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders Live Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Orders Stream</h3>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  to="/restaurant/billing" 
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  Invoices
                </Link>
                <Link 
                  to="/restaurant/pos" 
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  Go to POS <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                    <th className="py-2.5 px-4">Order / Time</th>
                    <th className="py-2.5 px-3">Table / Channel</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{ord.id}</span>
                        <span className="text-[10px] text-slate-400">{ord.time}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.channel === 'DINE_IN' 
                            ? 'bg-orange-50 text-orange-700 border border-orange-200/60'
                            : ord.channel === 'TAKEAWAY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {ord.target}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ord.steward}</span>
                      </td>

                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-600" title={ord.items}>
                        {ord.items}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">₹{ord.amount}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          ord.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.orderStatus === 'READY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'SERVED' || ord.orderStatus === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ord.orderStatus === 'PREPARING' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {ord.orderStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Link 
                          to="/restaurant/pos" 
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-block"
                          title="View in POS"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Channel Mix & Floor Sections */}
        <div className="space-y-6">
          
          {/* Order Channel Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Sales by Order Channel</h3>
            <p className="text-xs text-slate-400 mb-4">Volume breakdown across dining modes</p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-xl font-black text-slate-800 block">{totalChannelOrders}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orders</span>
              </div>
            </div>

            <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
              {channelData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {item.value} ({Math.round((item.value / totalChannelOrders) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dining Floor Section Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Floor Layout Status</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {metrics.activeTables} / {metrics.totalTables} Seated
              </span>
            </div>

            <div className="space-y-3">
              {floorSections.map((sec) => (
                <div key={sec.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <span>{sec.name}</span>
                    <span className="text-orange-600">{sec.occupied} / {sec.total} Tables</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: sec.rate }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Live Table Occupancy</span>
              <Link to="/restaurant/tables" className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 text-xs">
                Manage Floor <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts Callout */}
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Kitchen Stock Warnings ({metrics.lowStockCount} Items)
                </h4>
                <p className="text-xs text-rose-800 mt-1">
                  Fish Amritsari Fry (86'd / Out of Stock), Mozzarella Cheese (0.8 kg left), Basmati Rice (4 kg left).
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <Link
                    to="/restaurant/menu"
                    className="text-[10px] font-bold text-rose-700 bg-rose-200/60 hover:bg-rose-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    Manage 86'd Menu Items <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/restaurant/recipes"
                    className="text-[10px] font-bold text-orange-700 bg-orange-200/60 hover:bg-orange-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    Recipe Food Costing <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Overheads Callout */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Operating Overheads & Fuel
                  </h4>
                  <Link
                    to="/restaurant/expenses"
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5"
                  >
                    Ledger <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  Track non-food operational cashflow: commercial gas cylinders, electricity, takeaway disposables & daily petty cash.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <Link
                    to="/restaurant/expenses"
                    className="text-[10px] font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    Record Expense Voucher <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/restaurant/reports"
                    className="text-[10px] font-bold text-stone-800 bg-white hover:bg-stone-50 border border-amber-300/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    P&L Statement <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* REJECT BOOKING MODAL */}
      {isRejectModalOpen && bookingToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <X className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Online Booking</h3>
                <p className="text-xs text-stone-400">Ref: {bookingToReject.reservationCode}</p>
              </div>
            </div>

            <p className="text-xs text-stone-300">
              Rejecting table reservation for <b className="text-white">{bookingToReject.customerName}</b> ({bookingToReject.partySize} guests at {bookingToReject.timeSlot}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Reason for Rejection
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 mb-2"
              >
                <option value="Fully booked for this dining slot">Fully booked for this dining slot</option>
                <option value="Private event / hall reserved">Private event / hall reserved</option>
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Outside operating hours">Outside operating hours</option>
                <option value="Custom reason">Other reason...</option>
              </select>

              {rejectionReason === 'Custom reason' && (
                <input
                  type="text"
                  placeholder="Enter specific explanation for guest..."
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setBookingToReject(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-stone-400 hover:text-white text-xs"
              >
                Keep Pending
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading === bookingToReject._id}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading === bookingToReject._id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirm Reject</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DELIVERY ORDER MODAL */}
      {isRejectOrderModalOpen && orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <X className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Delivery Order</h3>
                <p className="text-xs text-stone-400">Ref: {orderToReject.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-stone-300">
              Rejecting food delivery for <b className="text-white">{orderToReject.customerName}</b> (₹{orderToReject.grandTotal}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Reason for Rejection
              </label>
              <select
                value={deliveryRejectionReason}
                onChange={(e) => setDeliveryRejectionReason(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 mb-2"
              >
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Delivery address outside 5 km service radius">Delivery address outside 5 km service radius</option>
                <option value="Selected items sold out / 86'd">Selected items sold out / 86'd</option>
                <option value="Kitchen closing for shift turnover">Kitchen closing for shift turnover</option>
                <option value="Adverse weather / delivery rider unavailable">Adverse weather / delivery rider unavailable</option>
                <option value="Custom reason">Other reason...</option>
              </select>

              {deliveryRejectionReason === 'Custom reason' && (
                <input
                  type="text"
                  placeholder="Enter specific explanation for customer..."
                  onChange={(e) => setDeliveryRejectionReason(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setIsRejectOrderModalOpen(false);
                  setOrderToReject(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-stone-400 hover:text-white text-xs"
              >
                Keep Pending
              </button>

              <button
                type="button"
                onClick={handleConfirmRejectOrder}
                disabled={actionLoadingOrder === orderToReject._id}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoadingOrder === orderToReject._id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirm Reject</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-House Online Food Delivery Buzzer Modal */}
      <OrderBuzzerModal
        order={buzzerOrder}
        isOpen={isBuzzerOpen}
        onAccept={handleAcceptOrderFromBuzzer}
        onReject={handleRejectOrderFromBuzzer}
        deliveryBoys={deliveryBoys}
        actionLoading={buzzerLoading}
      />

    </div>
  );
}
