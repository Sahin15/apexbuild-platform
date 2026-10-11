import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  UtensilsCrossed, Sparkles, ChefHat, Search, Plus, Minus, 
  Trash2, X, Clock, Flame, ShieldCheck, Heart, AlertCircle, 
  CheckCircle2, Bell, Receipt, Coffee, ArrowRight, RefreshCw,
  Phone, User, MessageSquare, ChevronRight, Layers, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function GuestTableOrder() {
  const { tableId: paramTableId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId');
  const tableId = paramTableId || queryTableId;

  // Server data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [table, setTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // UI Filter states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart state: { [itemId]: { item, quantity, notes } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Modals & Drawers
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isStewardModalOpen, setIsStewardModalOpen] = useState(false);
  const [callingSteward, setCallingSteward] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [stewardReason, setStewardReason] = useState('Water Refill');
  const [customStewardNote, setCustomStewardNote] = useState('');

  // Guest input info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Brand primary color (fallback to Restaurant flame orange)
  const primaryColor = restaurant?.primaryColor || '#EA580C';

  // Fetch Table details & Active Order
  const fetchTableDetails = useCallback(async (isSilent = false) => {
    if (!tableId) return;
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [tableRes, menuRes] = await Promise.all([
        api.get(`/restaurant/table-order/table/${tableId}`),
        api.get(`/restaurant/table-order/menu/${tableId}`)
      ]);

      if (tableRes.data?.data) {
        setTable(tableRes.data.data.table);
        setRestaurant(tableRes.data.data.restaurant);
        setActiveOrder(tableRes.data.data.activeOrder || null);
        if (tableRes.data.data.table?.currentGuests) {
          setGuestCount(tableRes.data.data.table.currentGuests);
        }
      }

      if (menuRes.data?.data) {
        setCategories(menuRes.data.data.categories || []);
        setMenuItems(menuRes.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load table session:', err);
      if (!isSilent) {
        toast.error('Unable to load table menu. Please check table QR code.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchTableDetails();
    // Poll table & order status every 12 seconds to keep food preparation status live
    const interval = setInterval(() => {
      fetchTableDetails(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchTableDetails]);

  // Cart operations
  const addToCart = (item) => {
    if (navigator?.vibrate) navigator.vibrate(30);
    setCart(prev => {
      const existing = prev[item._id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item._id]: {
          item,
          quantity: newQty,
          notes: existing?.notes || ''
        }
      };
    });
  };

  const removeFromCart = (itemId) => {
    if (navigator?.vibrate) navigator.vibrate(30);
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1
        }
      };
    });
  };

  const updateItemNotes = (itemId, notes) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes }
      };
    });
  };

  const clearCart = () => setCart({});

  // Totals calculations
  const cartEntries = Object.values(cart);
  const cartItemCount = cartEntries.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cartEntries.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST
  const cartGrandTotal = Math.round(cartSubtotal + cartTax);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category match
      if (selectedCategory !== 'ALL' && item.categoryId?._id !== selectedCategory && item.categoryId !== selectedCategory) {
        return false;
      }
      // Veg toggle
      if (vegOnly && !item.isVeg) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  // Submit Order (Send to Kitchen KDS)
  const handlePlaceOrder = async () => {
    if (cartEntries.length === 0) {
      toast.error('Your cart is empty. Add delicious items first!');
      return;
    }

    try {
      setSubmittingOrder(true);
      const payload = {
        tableId,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        guestCount: Number(guestCount) || 2,
        items: cartEntries.map(e => ({
          menuItemId: e.item._id,
          name: e.item.name,
          price: e.item.price,
          quantity: e.quantity,
          notes: e.notes || undefined
        })),
        specialInstructions: specialInstructions.trim() || undefined
      };

      const res = await api.post('/restaurant/table-order/place-order', payload);
      
      if (navigator?.vibrate) navigator.vibrate([100, 50, 100]);
      toast.success(res.data?.message || 'Order placed and sent to kitchen!');
      
      // Reset cart and modal
      clearCart();
      setIsCartOpen(false);
      
      // Refresh table state
      await fetchTableDetails(false);
      // Open active bill view to reassure guest
      setIsBillModalOpen(true);
    } catch (err) {
      console.error('Failed to submit table order:', err);
      toast.error(err.response?.data?.message || 'Could not place order. Please call steward.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Call Steward
  const handleCallSteward = async () => {
    try {
      setCallingSteward(true);
      const fullReason = customStewardNote.trim() 
        ? `${stewardReason} (${customStewardNote.trim()})`
        : stewardReason;

      const res = await api.post('/restaurant/table-order/call-steward', {
        tableId,
        reason: fullReason
      });

      if (navigator?.vibrate) navigator.vibrate(80);
      toast.success(res.data?.message || 'Steward alerted! Assistance is coming.');
      setIsStewardModalOpen(false);
      setCustomStewardNote('');
    } catch (err) {
      console.error('Failed to call steward:', err);
      toast.error('Unable to alert steward. Please signal nearby staff.');
    } finally {
      setCallingSteward(false);
    }
  };

  // Request Final Bill
  const handleRequestBill = async () => {
    try {
      setRequestingBill(true);
      const res = await api.post('/restaurant/table-order/request-bill', { tableId });
      
      if (navigator?.vibrate) navigator.vibrate(100);
      toast.success(res.data?.message || 'Bill requested! Steward will bring the invoice.');
      await fetchTableDetails(true);
    } catch (err) {
      console.error('Failed to request bill:', err);
      toast.error('Could not request bill. Please call steward.');
    } finally {
      setRequestingBill(false);
    }
  };

  // Render Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center animate-bounce mb-4">
          <UtensilsCrossed className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Connecting to Your Table...</h2>
        <p className="text-xs text-stone-400 mt-2 max-w-xs">
          Loading digital contactless menu and syncing with kitchen KDS.
        </p>
      </div>
    );
  }

  // Render Table Not Found Error
  if (!table) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Table Not Found</h2>
        <p className="text-sm text-stone-400 mt-2 max-w-sm">
          The table QR code seems invalid or expired. Please scan the QR standee on your dining table again or call a steward for assistance.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-orange-600/30"
        >
          Try Scanning Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-28 font-sans selection:bg-orange-600 selection:text-white">
      
      {/* Top Floating / Header Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Restaurant & Table Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              style={{ backgroundColor: primaryColor }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 ring-2 ring-stone-800"
            >
              {table.tableNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-stone-100 truncate">
                  {restaurant?.name || 'Restaurant Dining'}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  table.status === 'BILLED' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : table.status === 'OCCUPIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-stone-800 text-stone-300'
                }`}>
                  {table.status === 'BILLED' ? 'Bill In Prep' : `Table ${table.tableNumber}`}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                <span>{table.area?.name || 'Dining Area'}</span>
                <span>•</span>
                <span>Seats {table.capacity} guests</span>
                {refreshing && (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-orange-400 inline" />
                )}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Call Steward Button */}
            <button
              onClick={() => setIsStewardModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Call Steward</span>
            </button>

            {/* Active Table Bill Button */}
            <button
              onClick={() => setIsBillModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                activeOrder 
                  ? 'bg-orange-600/20 border border-orange-500/40 text-orange-400 hover:bg-orange-600/30' 
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700/80'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bill</span>
              {activeOrder && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">

        {/* Live Active Order Status Banner (if order exists on table) */}
        {activeOrder && (
          <div 
            onClick={() => setIsBillModalOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/60 via-stone-900 to-stone-900 border border-orange-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-orange-500/50 transition-all shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Active Order #{activeOrder.orderNumber}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-white">
                    {activeOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {activeOrder.items?.length || 0} items ordered • Running Total: ₹{activeOrder.grandTotal}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-400 shrink-0">
              <span>View KOT</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Search Bar & Veg Filter Pill */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, starters..."
              className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-stone-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              vegOnly 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-sm' 
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>Veg Only</span>
          </button>
        </div>

        {/* Categories Horizontal Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={selectedCategory === 'ALL' ? { backgroundColor: primaryColor } : {}}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'text-white shadow-md'
                : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800/80'
            }`}
          >
            All Items ({menuItems.length})
          </button>

          {categories.map(cat => {
            const isSelected = selectedCategory === cat._id;
            const count = menuItems.filter(i => (i.categoryId?._id === cat._id || i.categoryId === cat._id)).length;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800/80'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items List */}
        <div className="space-y-3 pt-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-stone-900/50 rounded-3xl border border-stone-800/80 p-8">
              <UtensilsCrossed className="w-10 h-10 text-stone-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-300">No dishes match your filter</h3>
              <p className="text-xs text-stone-500 mt-1">Try clearing search or toggle off veg-only filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setVegOnly(false); setSelectedCategory('ALL'); }}
                className="mt-4 px-4 py-1.5 rounded-xl bg-stone-800 text-xs font-semibold text-stone-300 hover:bg-stone-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredItems.map(item => {
              const inCartQty = cart[item._id]?.quantity || 0;
              return (
                <div
                  key={item._id}
                  className={`bg-stone-900/90 rounded-2xl border p-3.5 transition-all shadow-sm flex items-start justify-between gap-3 ${
                    inCartQty > 0 ? 'border-orange-500/60 ring-1 ring-orange-500/30' : 'border-stone-800/90 hover:border-stone-700'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Veg / Non-Veg Indicator */}
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        item.isVeg ? 'border-emerald-500 bg-emerald-950/40' : 'border-rose-500 bg-rose-950/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </span>

                      {/* Chef Special Tag */}
                      {item.isChefSpecial && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Chef Special
                        </span>
                      )}

                      {/* Spicy Tag */}
                      {item.spicyLevel > 0 && (
                        <span className="text-[10px] font-bold text-rose-400 flex items-center">
                          {'🌶️'.repeat(Math.min(item.spicyLevel, 3))}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-stone-100 leading-snug">
                      {item.name}
                    </h3>
                    
                    {item.description && (
                      <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2.5 text-xs">
                      <span className="font-black text-stone-100 text-sm">
                        ₹{item.price}
                      </span>
                      {item.preparationTime && (
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          {item.preparationTime} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper or Add Button */}
                  <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
                    {inCartQty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        style={{ backgroundColor: primaryColor }}
                        className="px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-stone-800 rounded-xl border border-stone-700 p-0.5 shadow-sm">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="w-7 h-7 rounded-lg bg-stone-700/80 hover:bg-stone-600 text-stone-200 flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-black text-xs text-white">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3.5 px-5 rounded-2xl text-white shadow-2xl flex items-center justify-between gap-3 font-bold transition-all hover:brightness-110 active:scale-98 cursor-pointer ring-4 ring-stone-950/80"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center font-black text-xs">
                  {cartItemCount}
                </span>
                <div className="text-left">
                  <span className="text-xs uppercase tracking-wider block text-white/80">Table {table.tableNumber} Cart</span>
                  <span className="text-sm font-black">₹{cartGrandTotal} (incl. 5% GST)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-black/20 px-3 py-1.5 rounded-xl">
                <span>Review & Order</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart & Kitchen Dispatch Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-white">Your Order Details</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Ordering for Table <span className="text-orange-400 font-bold">{table.tableNumber}</span> ({table.area?.name || 'Main Hall'})
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Items in Cart */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 block">
                  Selected Items ({cartItemCount})
                </span>

                {cartEntries.map(({ item, quantity, notes }) => (
                  <div key={item._id} className="bg-stone-950/70 p-3 rounded-2xl border border-stone-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                        <span className="text-xs text-stone-400">₹{item.price} each</span>
                      </div>
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-stone-800 rounded-xl border border-stone-700 p-0.5">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="w-6 h-6 rounded-lg bg-stone-700 text-stone-200 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-black text-xs text-white">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Custom Item Cooking Note */}
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => updateItemNotes(item._id, e.target.value)}
                      placeholder="Add cooking note (e.g. less spicy, crisp)..."
                      className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Guest Information */}
              <div className="bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800/80 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 block">
                  Table & Guest Info
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="For loyalty points"
                      className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">
                    Kitchen Special Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Serve appetizers together, bring glasses of warm water..."
                    className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                  />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-200">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Goods & Services Tax (GST 5%)</span>
                  <span className="font-bold text-stone-200">₹{cartTax}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-stone-800">
                  <span>Grand Total</span>
                  <span className="text-orange-400">₹{cartGrandTotal}</span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Button */}
            <div className="p-4 border-t border-stone-800 bg-stone-900">
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Kitchen KDS...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>Send Order to Kitchen KDS (₹{cartGrandTotal})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Table Bill & Order Tracker Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-extrabold text-base text-white">Table {table.tableNumber} Session</h3>
                  <p className="text-[11px] text-stone-400">
                    {activeOrder ? `Order #${activeOrder.orderNumber}` : 'No active order placed yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {!activeOrder ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <UtensilsCrossed className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                  <p className="font-bold text-sm text-stone-300">No items on your table bill yet</p>
                  <p className="text-xs text-stone-500">Pick appetizers, mains, or beverages from the menu.</p>
                  <button
                    onClick={() => setIsBillModalOpen(false)}
                    className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Session Status</span>
                      <span className="text-xs font-bold text-white">
                        {table.status === 'BILLED' ? 'Bill Requested (Steward preparing invoice)' : 'Dining in progress'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                      activeOrder.status === 'READY' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {activeOrder.status}
                    </span>
                  </div>

                  {/* Items Ordered List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 block">
                      Kitchen Items ({activeOrder.items?.length || 0})
                    </span>

                    {activeOrder.items?.map((item, idx) => (
                      <div key={item._id || idx} className="bg-stone-950 p-3 rounded-xl border border-stone-800/80 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-stone-100">{item.name}</span>
                            <span className="text-stone-400">×{item.quantity}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-stone-500 mt-0.5 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-stone-200">₹{item.price * item.quantity}</span>
                          <span className={`block text-[9px] font-black uppercase mt-0.5 ${
                            item.status === 'READY' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {item.status || 'PREPARING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal</span>
                      <span className="font-bold text-stone-200">₹{activeOrder.subTotal}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Taxes (GST 5%)</span>
                      <span className="font-bold text-stone-200">₹{activeOrder.taxTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-stone-800">
                      <span>Running Grand Total</span>
                      <span className="text-orange-400">₹{activeOrder.grandTotal}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Bottom Actions */}
            {activeOrder && (
              <div className="p-4 border-t border-stone-800 bg-stone-900 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsBillModalOpen(false)}
                  className="py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  + Add More Items
                </button>
                <button
                  onClick={handleRequestBill}
                  disabled={requestingBill || table.status === 'BILLED'}
                  className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {requestingBill ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Receipt className="w-3.5 h-3.5" />
                  )}
                  <span>{table.status === 'BILLED' ? 'Bill In Progress' : 'Request Final Bill'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Steward Modal */}
      {isStewardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Call Table Steward</h3>
              </div>
              <button
                onClick={() => setIsStewardModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Need assistance at Table <span className="text-white font-bold">{table.tableNumber}</span>? Select what you need:
            </p>

            {/* Quick Reason Chips */}
            <div className="grid grid-cols-2 gap-2">
              {[
                'Water Refill',
                'Extra Cutlery',
                'Napkins & Tissue',
                'Clean Table',
                'Call Server',
                'Sauces & Condiments'
              ].map(reason => (
                <button
                  key={reason}
                  onClick={() => setStewardReason(reason)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                    stewardReason === reason 
                      ? 'bg-orange-600 text-white border border-orange-500' 
                      : 'bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Custom Notes */}
            <input
              type="text"
              value={customStewardNote}
              onChange={(e) => setCustomStewardNote(e.target.value)}
              placeholder="Any specific note for steward..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />

            <button
              onClick={handleCallSteward}
              disabled={callingSteward}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {callingSteward ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Alerting Steward...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Call Steward Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
