import React, { useEffect, useRef, useState } from 'react';
import { 
  Bell, Volume2, VolumeX, Check, X, Bike, ChefHat, 
  MapPin, Phone, AlertCircle, ShoppingBag, Sparkles, Clock, User
} from 'lucide-react';

// Web Audio API Synthesizer for Restaurant Order Buzzer
class OrderBuzzerAudio {
  constructor() {
    this.ctx = null;
    this.interval = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playBeep(freq = 880, duration = 0.15) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  startBuzzer() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Pattern: Two high beeps, short pause, repeat like a commercial POS buzzer
    let toggle = true;
    this.playBeep(920, 0.12);

    this.interval = setInterval(() => {
      if (!this.isPlaying) return;
      this.playBeep(toggle ? 920 : 780, 0.14);
      toggle = !toggle;
    }, 450);
  }

  stopBuzzer() {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  playSuccessChime() {
    this.stopBuzzer();
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 0.25);
        }, idx * 100);
      });
    } catch (e) {}
  }
}

const buzzerAudio = new OrderBuzzerAudio();

export default function OrderBuzzerModal({
  order,
  isOpen,
  onAccept,
  onReject,
  deliveryBoys = [],
  actionLoading = false
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState('');
  const [prepMinutes, setPrepMinutes] = useState('25');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('Kitchen at maximum capacity');

  // Start buzzer when opened
  useEffect(() => {
    if (isOpen && order) {
      setShowRejectInput(false);
      if (!isMuted) {
        buzzerAudio.startBuzzer();
      }
    } else {
      buzzerAudio.stopBuzzer();
    }

    return () => {
      buzzerAudio.stopBuzzer();
    };
  }, [isOpen, order, isMuted]);

  if (!isOpen || !order) return null;

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      buzzerAudio.startBuzzer();
    } else {
      setIsMuted(true);
      buzzerAudio.stopBuzzer();
    }
  };

  const handleAcceptClick = async () => {
    buzzerAudio.playSuccessChime();
    await onAccept(order._id, {
      deliveryBoyId: selectedDeliveryBoyId || undefined,
      estimatedPrepMinutes: Number(prepMinutes) || 25
    });
  };

  const handleConfirmRejectClick = async () => {
    buzzerAudio.stopBuzzer();
    await onReject(order._id, rejectReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Flashing warning outer pulse container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-stone-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Animated Radar Flashing Header Strip */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-emerald-700 items-center justify-center">
                <Bell className="w-3 h-3 fill-emerald-700" />
              </span>
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight uppercase">
                  🚨 Incoming Online Food Order!
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/30 border border-white/20">
                  BUZZER ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Customer is waiting on screen • Review and decide now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isMuted ? 'bg-black/40 text-stone-300' : 'bg-white text-emerald-900 shadow'
              }`}
              title={isMuted ? 'Unmute Buzzer Alarm' : 'Mute Buzzer Alarm'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
              <span className="text-[11px] hidden sm:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
            </button>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Info Banner: Order ID, Amount, Customer */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Order Number</span>
              <p className="text-xl font-mono font-black text-white">{order.orderNumber}</p>
              <div className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-white">{order.customerName}</span>
                <span>•</span>
                <span className="text-stone-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-500" />
                  {order.customerPhone}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Bill (Incl. Tax)</span>
              <p className="text-2xl font-black text-emerald-400">₹{order.grandTotal}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-stone-800 text-stone-300 border border-stone-700">
                {order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}
              </span>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/60 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-white">Delivery Address:</p>
              <p className="text-stone-300 leading-relaxed mt-0.5">{order.deliveryAddress}</p>
              {(order.deliveryLandmark || order.deliveryPincode) && (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {order.deliveryLandmark && `Landmark: ${order.deliveryLandmark}`}
                  {order.deliveryLandmark && order.deliveryPincode ? ' • ' : ''}
                  {order.deliveryPincode && `Pincode: ${order.deliveryPincode}`}
                </p>
              )}
            </div>
          </div>

          {/* Ordered Food Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-bold border-b border-stone-800 pb-1">
              <span>Items to Cook ({order.items?.length || 0})</span>
              <span>Qty × Price</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {order.items?.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-800/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${it.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-bold text-white">{it.name}</span>
                    <span className="text-stone-400">× {it.quantity}</span>
                  </div>
                  <span className="font-bold text-stone-200">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            {order.cookingInstructions && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cooking Notes: </span>
                  <span>"{order.cookingInstructions}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Pre-Assign Restaurant Delivery Boy & Kitchen Prep Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-800">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assign In-House Delivery Boy:</span>
              </label>
              <select
                value={selectedDeliveryBoyId}
                onChange={(e) => setSelectedDeliveryBoyId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Assign Later from Delivery Console --</option>
                {deliveryBoys.map(boy => (
                  <option key={boy._id} value={boy._id}>
                    {boy.name} ({boy.vehicleType} • {boy.deliveryBoyStatus})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                <span>Target Kitchen Prep Time:</span>
              </label>
              <select
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="15">15 Minutes (Express)</option>
                <option value="20">20 Minutes (Standard)</option>
                <option value="25">25 Minutes (Recommended)</option>
                <option value="35">35 Minutes (Peak Hour / Rush)</option>
                <option value="45">45 Minutes (Large Feast)</option>
              </select>
            </div>
          </div>

          {/* Rejection Sub-Panel (if toggled) */}
          {showRejectInput && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-rose-300">
                Reason for Rejecting This Online Order:
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 mb-1.5"
              >
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Delivery address outside 5 km service radius">Delivery address outside 5 km service radius</option>
                <option value="Selected items sold out / 86'd">Selected items sold out / 86'd</option>
                <option value="Kitchen closing for shift turnover">Kitchen closing for shift turnover</option>
                <option value="Delivery boy currently unavailable">Delivery boy currently unavailable</option>
                <option value="Adverse weather conditions">Adverse weather conditions</option>
              </select>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1 rounded-xl text-stone-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectClick}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-colors"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer Buttons */}
        {!showRejectInput && (
          <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={actionLoading}
              className="py-3 px-5 rounded-2xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-700/60 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Reject Order</span>
            </button>

            <button
              onClick={handleAcceptClick}
              disabled={actionLoading}
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>ACCEPT & DISPATCH TO KITCHEN</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
