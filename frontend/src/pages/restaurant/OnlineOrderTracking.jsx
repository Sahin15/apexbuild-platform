import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, Bike, ChefHat, Package, MapPin, 
  Phone, UtensilsCrossed, ArrowLeft, RefreshCw, AlertCircle, 
  XCircle, Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Received', desc: 'Awaiting restaurant acceptance', icon: Clock },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Kitchen is preparing your dishes', icon: ChefHat },
  { key: 'READY', label: 'Packed & Ready', desc: 'Food packed, waiting for delivery partner', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way to your doorstep', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your freshly cooked meal!', icon: CheckCircle2 }
];

export default function OnlineOrderTracking() {
  const { orderId } = useParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchTracking = async (isSilent = false) => {
    if (!orderId) return;
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get(`/restaurant/online-order/track/${orderId}`);
      if (res.data?.data?.order) {
        setOrder(res.data.data.order);
        setError(null);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      if (!isSilent) setError('Order not found or tracking reference is invalid.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    // Auto refresh every 6 seconds for live status updates
    const interval = setInterval(() => {
      fetchTracking(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Determine current step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED':
      case 'PREPARING': return 1;
      case 'READY': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED':
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">
          Connecting to Restaurant Kitchen & Dispatch...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tracking Link Expired or Not Found</h2>
          <p className="text-xs text-stone-400">
            {error || `Could not locate order reference "${orderId}". Please verify your order number.`}
          </p>
          <Link
            to="/order"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Digital Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = order.status === 'REJECTED' || order.status === 'CANCELLED';
  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/order"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Live Order Tracking</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {order.orderNumber}
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                {order.organizationId?.name || 'Apex Restaurant Kitchen'}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Tracking Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Status Highlight Card */}
        {isRejected ? (
          <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-800/80 space-y-3">
            <div className="flex items-center gap-3 text-rose-400">
              <XCircle className="w-8 h-8 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-white">Order Was Cancelled / Rejected</h2>
                <p className="text-xs text-rose-300">
                  Reason: {order.rejectionReason || order.cancellationReason || 'Kitchen currently unable to accept delivery.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-400">
              Any online payments made will be reversed to your original payment method automatically within 24 hours.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Live Kitchen & Delivery Status
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {order.status === 'PENDING' && 'Waiting for Restaurant to Accept'}
                  {order.status === 'CONFIRMED' && 'Accepted! Kitchen is Cooking'}
                  {order.status === 'PREPARING' && 'Food is Sizzling on the Stove'}
                  {order.status === 'READY' && 'Packed & Ready for Rider Pickup'}
                  {order.status === 'OUT_FOR_DELIVERY' && 'Rider Out for Delivery to Your Door!'}
                  {order.status === 'DELIVERED' && 'Delivered! Bon Appétit!'}
                </h2>
                <p className="text-xs text-stone-400">
                  Estimated arrival time: <b className="text-white">{order.estimatedDeliveryMinutes || 35} minutes</b> from placement
                </p>
              </div>

              {/* Rider quick card if assigned */}
              {order.riderDetails?.name && (
                <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-semibold">Delivery Partner</p>
                    <p className="text-xs font-bold text-white">{order.riderDetails.name}</p>
                    {order.riderDetails.phone && (
                      <p className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>{order.riderDetails.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Progress Bar */}
            <div className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {ORDER_STEPS.map((step, idx) => {
                  const isPast = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-orange-500/15 border-orange-500/80 text-white shadow-lg shadow-orange-950/40'
                          : isPast
                          ? 'bg-stone-800/40 border-emerald-500/40 text-stone-300'
                          : 'bg-stone-900/30 border-stone-800/60 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-xl ${
                          isCurrent
                            ? 'bg-orange-500 text-white animate-bounce'
                            : isPast
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-stone-800 text-stone-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[11px] font-bold ${
                          isCurrent ? 'text-orange-400' : isPast ? 'text-emerald-400' : 'text-stone-500'
                        }`}>
                          {idx + 1}. {step.label}
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Details & Delivery Address Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Items Summary (2 cols) */}
          <div className="md:col-span-2 p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <span>Items in this Order ({order.items?.length || 0})</span>
              </h3>
              <span className="text-xs text-stone-400">
                Payment: <b className="text-white">{order.paymentMethod?.replace(/_/g, ' ')}</b> ({order.paymentStatus})
              </span>
            </div>

            <div className="space-y-2.5 divide-y divide-stone-800/60">
              {order.items?.map((it, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className={`w-2 h-2 rounded-full ${it.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{it.name}</span>
                      <span className="text-stone-400 font-normal">× {it.quantity}</span>
                    </div>
                    {it.notes && (
                      <p className="text-[11px] text-stone-400 italic">Note: "{it.notes}"</p>
                    )}
                  </div>
                  <span className="font-bold text-stone-200">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            {order.cookingInstructions && (
              <div className="p-3 rounded-2xl bg-stone-800/40 border border-stone-700/40 text-xs text-stone-300">
                <span className="font-bold text-stone-400">Special Instructions: </span>
                <span>"{order.cookingInstructions}"</span>
              </div>
            )}

            {/* Bill summary */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span>₹{order.subTotal}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>GST (5%)</span>
                <span>₹{order.taxTotal}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Packaging Fee</span>
                <span>₹{order.packagingFee || 25}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? <b className="text-emerald-400">FREE</b> : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-black text-white">
                <span>Total Amount</span>
                <span className="text-orange-400">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Delivery Destination (1 col) */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-2.5">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>Delivery Destination</span>
              </h3>

              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-white">{order.customerName}</p>
                <p className="text-stone-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>{order.customerPhone}</span>
                </p>
                <p className="text-stone-300 pt-1 leading-relaxed">
                  {order.deliveryAddress}
                </p>
                {order.deliveryLandmark && (
                  <p className="text-[11px] text-stone-400">Landmark: {order.deliveryLandmark}</p>
                )}
                {order.deliveryPincode && (
                  <p className="text-[11px] text-stone-400">Pincode: {order.deliveryPincode}</p>
                )}
              </div>
            </div>

            {/* Help & Support Card */}
            <div className="p-4 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-2 text-xs">
              <p className="font-bold text-white">Need help with this order?</p>
              <p className="text-stone-400">
                Call the restaurant directly for updates or address adjustments.
              </p>
              {order.organizationId?.phone && (
                <a
                  href={`tel:${order.organizationId.phone}`}
                  className="inline-flex items-center gap-1.5 text-orange-400 font-bold hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>{order.organizationId.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
