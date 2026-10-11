import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChefHat, Flame, Clock, CheckCircle2, AlertTriangle, 
  Filter, Volume2, VolumeX, Sparkles, RefreshCw, 
  Check, ArrowRight, User, Utensils, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantKDS() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // 'ACTIVE' | 'PREPARING' | 'READY'
  const [tickets, setTickets] = useState([]);
  const previousTicketCountRef = useRef(0);

  // Kitchen audio chime synthesizer via Web Audio API
  const playKitchenChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Ignore autoplay restriction before interaction
    }
  }, [soundEnabled]);

  // Stations catalog
  const stations = [
    { id: 'ALL', name: 'All Stations' },
    { id: 'Curry Range', name: 'Curry Range' },
    { id: 'Tandoor', name: 'Tandoor & Grill' },
    { id: 'Pantry', name: 'Pantry & Salads' },
    { id: 'Beverage Bar', name: 'Beverage Bar' },
    { id: 'Hot Fryer', name: 'Hot Fryer' },
    { id: 'Dessert', name: 'Desserts' },
  ];

  // Fetch KDS tickets from backend
  const fetchKDSTickets = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {};
      if (selectedStation && selectedStation !== 'ALL') {
        params.station = selectedStation;
      }

      const res = await api.get('/restaurant/kds', { params });
      if (res.data?.data) {
        const fetched = res.data.data.tickets || [];
        setTickets(fetched);

        // Chime if new tickets arrived
        if (fetched.length > previousTicketCountRef.current && previousTicketCountRef.current > 0) {
          playKitchenChime();
          toast('New order ticket arrived in kitchen!', { icon: '🔔' });
        }
        previousTicketCountRef.current = fetched.length;
      }
    } catch (err) {
      console.error('Failed to fetch KDS tickets:', err);
      if (!isSilent) toast.error('Unable to fetch live kitchen orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStation, playKitchenChime]);

  // Polling every 12 seconds
  useEffect(() => {
    fetchKDSTickets();
    const interval = setInterval(() => {
      fetchKDSTickets(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchKDSTickets]);

  // Toggle item ready state
  const handleMarkItemReady = async (ticket, item) => {
    try {
      const res = await api.patch(`/restaurant/kds/${ticket.orderId}/items/${item._id}/ready`);
      const updatedOrder = res.data?.data?.order;

      setTickets(prev => prev.map(t => {
        if (t.orderId === ticket.orderId) {
          const updatedItems = t.items.map(i => {
            if (i._id === item._id) {
              return { ...i, ready: !i.ready, status: !i.ready ? 'READY' : 'PREPARING' };
            }
            return i;
          });
          const allReady = updatedItems.every(i => i.ready);
          return {
            ...t,
            items: updatedItems,
            status: allReady ? 'READY' : 'PREPARING'
          };
        }
        return t;
      }));

      playKitchenChime();
    } catch (err) {
      console.error('Failed to toggle item ready status:', err);
      toast.error('Unable to update item readiness');
    }
  };

  // Mark all items ready
  const handleMarkAllReady = async (ticket) => {
    try {
      for (const item of ticket.items) {
        if (!item.ready) {
          await api.patch(`/restaurant/kds/${ticket.orderId}/items/${item._id}/ready`);
        }
      }
      playKitchenChime();
      toast.success(`Ticket ${ticket.id} marked completely ready for pickup!`);
      fetchKDSTickets(true);
    } catch (err) {
      console.error('Failed to mark all items ready:', err);
      toast.error('Error marking items ready');
    }
  };

  // Bump ticket
  const handleBumpTicket = async (ticket) => {
    try {
      await api.post(`/restaurant/kds/${ticket.orderId}/bump`);
      setTickets(prev => prev.filter(t => t.orderId !== ticket.orderId));
      playKitchenChime();
      toast.success(`Ticket ${ticket.id} (${ticket.table}) bumped and marked served!`);
    } catch (err) {
      console.error('Failed to bump ticket:', err);
      toast.error('Error bumping ticket from KDS');
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchStatus = statusFilter === 'ACTIVE' 
      ? true 
      : statusFilter === 'PREPARING' 
        ? t.status === 'PREPARING' || t.status === 'CONFIRMED' || t.status === 'QUEUED'
        : t.status === 'READY';
    return matchStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* Live Server Notice Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold">
            <span className="font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
              Live KDS Active
            </span>
            Kitchen Display Expediting Board — Real-time ticket queue, station breakdown, touch item readiness, and ticket bumping.
          </p>
        </div>
        <button
          onClick={() => fetchKDSTickets(true)}
          disabled={refreshing}
          className="text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Polling...' : 'Refresh Board'}
        </button>
      </div>

      {/* KDS Control Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left: Station Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stations.map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              style={selectedStation === st.id ? { backgroundColor: effectivePrimary } : {}}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedStation === st.id
                  ? 'text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        {/* Right: Controls & Sound Toggle */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Active ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('PREPARING')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PREPARING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cooking ({tickets.filter(t => t.status !== 'READY').length})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'READY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ready ({tickets.filter(t => t.status === 'READY').length})
            </button>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playKitchenChime();
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-orange-50 border-orange-200 text-orange-600' 
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Kitchen Bell Sound ON' : 'Kitchen Bell Sound OFF'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* KDS Ticket Cards Grid */}
      {loading && tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Connecting to Kitchen Order Tickets (KOT)...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
              <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">All Kitchen Orders Clear!</h3>
              <p className="text-xs text-slate-400 mt-1">No pending tickets matching selected station filters.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const elapsedMinutes = ticket.elapsedMinutes ?? Math.max(0, Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000));
              const isDelayed = elapsedMinutes >= 20;
              const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 20;
              const isReady = ticket.status === 'READY';

              return (
                <div
                  key={ticket.id || ticket.orderId}
                  className={`bg-white rounded-2xl border-2 flex flex-col justify-between shadow-xs overflow-hidden transition-all duration-150 ${
                    isReady 
                      ? 'border-emerald-500 bg-emerald-50/20' 
                      : isDelayed
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : isWarning
                          ? 'border-amber-400'
                          : 'border-slate-200/90'
                  }`}
                >
                  
                  {/* Ticket Header */}
                  <div className={`p-3.5 border-b flex items-center justify-between ${
                    isReady 
                      ? 'bg-emerald-50 border-emerald-100' 
                      : isDelayed
                        ? 'bg-rose-50 border-rose-100'
                        : isWarning
                          ? 'bg-amber-50 border-amber-100'
                          : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900">{ticket.id}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          ({ticket.orderNumber})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-orange-600 block mt-0.5">
                        {ticket.table}
                      </span>
                    </div>

                    {/* Timer & Alert Indicator */}
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black ${
                        isReady 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isDelayed
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMinutes}m</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Steward: {ticket.steward}
                      </span>
                    </div>
                  </div>

                  {ticket.cookingInstructions && (
                    <div className="mx-3.5 mt-2.5 bg-amber-50 border border-amber-200/90 p-2 rounded-xl text-[10px] text-amber-900 italic font-medium">
                      🛵 Special Note: "{ticket.cookingInstructions}"
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5 flex-1 divide-y divide-slate-100">
                    {ticket.items.map((item) => (
                      <div 
                        key={item._id || item.id}
                        onClick={() => handleMarkItemReady(ticket, item)}
                        className={`pt-2 first:pt-0 flex items-start gap-2 cursor-pointer group ${
                          item.ready ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        <button 
                          type="button"
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            item.ready 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 hover:border-orange-500'
                          }`}
                        >
                          {item.ready && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 w-5">
                              {item.quantity || item.qty}x
                            </span>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">
                              {item.name}
                            </span>
                          </div>

                          {item.notes && (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded mt-1 inline-block">
                              ⚠️ {item.notes}
                            </span>
                          )}

                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Station: {item.station}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Action Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    {!isReady ? (
                      <button
                        onClick={() => handleMarkAllReady(ticket)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready All</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBumpTicket(ticket)}
                        className="flex-1 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Bump Ticket</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
