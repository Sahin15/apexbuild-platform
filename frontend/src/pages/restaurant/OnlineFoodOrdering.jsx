import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, Check, Clock, 
  MapPin, Phone, Mail, UtensilsCrossed, Sparkles, ChefHat, 
  ArrowRight, ShieldCheck, ChevronRight, Bike, AlertCircle, 
  CreditCard, Banknote, Flame, Heart, RefreshCw, Info, ExternalLink
} from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function OnlineFoodOrdering() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const orgParam = searchParams.get('org') || user?.organizationId?._id || user?.organizationId || '';

  // Data states
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // UI Filter states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart state: { [itemId]: { item, quantity, notes } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryLandmark: '',
    deliveryPincode: '',
    cookingInstructions: '',
    paymentMethod: 'CASH_ON_DELIVERY'
  });

  // Fetch Menu
  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const query = orgParam ? `?org=${orgParam}` : '';
        const res = await api.get(`/restaurant/online-order/menu${query}`);
        if (res.data?.data) {
          setRestaurant(res.data.data.restaurant);
          setCategories(res.data.data.categories || []);
          setMenuItems(res.data.data.menuItems || []);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
        toast.error('Unable to load digital menu. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [orgParam]);

  // Cart actions
  const addToCart = (item) => {
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
    toast.success(`Added ${item.name} to cart`, { duration: 1500, id: `add-${item._id}` });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
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

  const deleteItemFromCart = (itemId) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Cart calculations
  const cartEntries = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartEntries.reduce((sum, e) => sum + e.quantity, 0), [cartEntries]);
  const subTotal = useMemo(() => cartEntries.reduce((sum, e) => sum + (e.item.price * e.quantity), 0), [cartEntries]);
  const gstTax = useMemo(() => Math.round(subTotal * 0.05 * 100) / 100, [subTotal]);
  const packagingFee = useMemo(() => (cartCount > 0 ? 25 : 0), [cartCount]);
  const deliveryFee = useMemo(() => {
    if (cartCount === 0) return 0;
    return subTotal >= 499 ? 0 : 40;
  }, [cartCount, subTotal]);
  const grandTotal = useMemo(() => subTotal + gstTax + packagingFee + deliveryFee, [subTotal, gstTax, packagingFee, deliveryFee]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'ALL') {
        const catId = item.categoryId?._id || item.categoryId;
        if (catId !== selectedCategory) return false;
      }
      if (vegOnly && !item.veg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  // Handle Checkout Submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.customerName.trim() || !checkoutForm.customerPhone.trim() || !checkoutForm.deliveryAddress.trim()) {
      toast.error('Please enter your name, phone number, and delivery address');
      return;
    }

    if (cartEntries.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setSubmittingOrder(true);
      const itemsPayload = cartEntries.map(e => ({
        menuItemId: e.item._id,
        name: e.item.name,
        price: e.item.price,
        quantity: e.quantity,
        veg: e.item.veg,
        notes: e.notes || ''
      }));

      const res = await api.post('/restaurant/online-order/public', {
        organizationId: orgParam || undefined,
        customerName: checkoutForm.customerName.trim(),
        customerPhone: checkoutForm.customerPhone.trim(),
        customerEmail: checkoutForm.customerEmail.trim() || undefined,
        deliveryAddress: checkoutForm.deliveryAddress.trim(),
        deliveryLandmark: checkoutForm.deliveryLandmark.trim(),
        deliveryPincode: checkoutForm.deliveryPincode.trim(),
        cookingInstructions: checkoutForm.cookingInstructions.trim(),
        paymentMethod: checkoutForm.paymentMethod,
        items: itemsPayload
      });

      if (res.data?.data?.order) {
        const placedOrder = res.data.data.order;
        toast.success(`Order ${placedOrder.orderNumber} placed successfully!`);
        setCart({});
        setIsCheckoutModalOpen(false);
        navigate(`/track-order/${placedOrder.orderNumber}`);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to place food order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{restaurant?.name || 'Apex Gourmet Kitchen'}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online Ordering
                </span>
              </h1>
              <p className="text-xs text-stone-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-stone-500" />
                <span>{restaurant?.address || 'Direct Kitchen Delivery'} • {restaurant?.city || 'City Wide'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/reserve"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700/60 transition-colors"
            >
              <span>Book Table</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-orange-900/40 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-orange-600 font-extrabold text-[11px] leading-none animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Strip */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-900/60 to-stone-950 border-b border-stone-800/80 px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>Chef Crafted • Fresh Ingredients • Hot Packaging</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Order Delicious Food Online
              </h2>
              <p className="text-xs sm:text-sm text-stone-400">
                Direct from our kitchen to your doorstep. Free delivery on orders over ₹499!
              </p>
            </div>

            {/* Delivery highlights */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-bold text-white text-[11px] leading-tight">30 - 40 Mins</p>
                  <p className="text-[10px] text-stone-400">Average Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <Bike className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-white text-[11px] leading-tight">Live Tracking</p>
                  <p className="text-[10px] text-stone-400">Direct Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-800/60 border border-stone-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-white text-[11px] leading-tight">100% Tamper Proof</p>
                  <p className="text-[10px] text-stone-400">Sealed Bags</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Veg/Non-Veg Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search food by name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700/80 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Veg toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  vegOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-900/30'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300"></span>
                <span>Pure Veg Only</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-950/40'
                : 'bg-stone-900/90 text-stone-400 border-stone-800 hover:text-white hover:border-stone-700'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>

          {categories.map(cat => {
            const count = menuItems.filter(m => (m.categoryId?._id || m.categoryId) === cat._id).length;
            const isSelected = selectedCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-950/40'
                    : 'bg-stone-900/90 text-stone-400 border-stone-800 hover:text-white hover:border-stone-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-stone-400 font-medium">Loading delicious kitchen menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/40 border border-stone-800/80 rounded-3xl p-8 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No dishes match your selection</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Try switching category or clearing the vegetarian filter to see more tasty choices.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setVegOnly(false);
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Food Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const inCart = cart[item._id];
              const qty = inCart ? inCart.quantity : 0;

              return (
                <div
                  key={item._id}
                  className="rounded-3xl bg-stone-900/80 border border-stone-800/90 hover:border-orange-500/40 transition-all p-4 flex flex-col justify-between shadow-lg group hover:shadow-orange-950/20"
                >
                  <div className="space-y-2.5">
                    {/* Header: Veg Indicator + Station Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                          item.veg 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-rose-500 bg-rose-500/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </span>
                        <span className={`text-[10px] font-bold ${item.veg ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.veg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>

                      {item.station && (
                        <span className="text-[10px] font-medium text-stone-400 px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700/60">
                          {item.station}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </h3>
                      {item.description ? (
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500 italic mt-1">
                          Freshly prepared in our restaurant kitchen.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Add Button */}
                  <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between gap-3 mt-3">
                    <div>
                      <div className="text-lg font-black text-white tracking-tight">
                        ₹{item.price}
                      </div>
                      <span className="text-[10px] text-stone-500">Taxes extra</span>
                    </div>

                    {/* Interactive Counter / Add Button */}
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-stone-800 border border-orange-500/50 rounded-xl overflow-hidden shadow">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="px-2.5 py-1.5 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-black text-orange-400 min-w-[20px] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-2.5 py-1.5 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Sticky Bottom Cart Banner (Mobile & Desktop) */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-3xl p-3.5 px-5 shadow-2xl shadow-orange-950/80 flex items-center justify-between gap-4 border border-orange-400/40 animate-in slide-in-from-bottom duration-300">
            <div>
              <p className="text-[11px] uppercase font-black text-orange-100 tracking-wide">
                {cartCount} {cartCount === 1 ? 'Item' : 'Items'} in Food Cart
              </p>
              <p className="text-base font-black text-white">
                ₹{grandTotal} <span className="text-xs font-medium text-orange-100/90">(Incl. Taxes)</span>
              </p>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-950 text-white hover:bg-stone-900 active:scale-95 font-bold text-xs shadow transition-all cursor-pointer"
            >
              <span>View Order Cart</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer / Flyout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-stone-900 border-l border-stone-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 sticky top-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">Your Delivery Cart ({cartCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {cartEntries.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
                  <p className="text-sm font-semibold text-stone-400">Your cart is empty</p>
                  <p className="text-xs text-stone-500">Pick dishes from the menu to build your order</p>
                </div>
              ) : (
                <>
                  {/* Free delivery bar */}
                  <div className="p-3 rounded-2xl bg-stone-800/60 border border-stone-700/60 text-xs">
                    {subTotal >= 499 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        🎉 You unlocked FREE Delivery!
                      </span>
                    ) : (
                      <span className="text-stone-300">
                        Add <b className="text-orange-400">₹{499 - subTotal}</b> more to get <b>FREE Delivery</b>!
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {cartEntries.map(({ item, quantity, notes }) => (
                      <div key={item._id} className="p-3 rounded-2xl bg-stone-800/40 border border-stone-700/40 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          </div>
                          <p className="text-xs font-semibold text-orange-400">₹{item.price * quantity}</p>
                        </div>

                        <div className="flex items-center bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="px-2 py-1 text-stone-300 hover:text-white hover:bg-stone-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-white">{quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="px-2 py-1 text-stone-300 hover:text-white hover:bg-stone-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bill Breakdown */}
                  <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Item Subtotal</span>
                      <span className="text-stone-200 font-semibold">₹{subTotal}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>GST (5%)</span>
                      <span className="text-stone-200 font-semibold">₹{gstTax}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Restaurant Packaging Fee</span>
                      <span className="text-stone-200 font-semibold">₹{packagingFee}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Delivery Fee</span>
                      <span className="text-stone-200 font-semibold">
                        {deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-black text-white">
                      <span>To Pay</span>
                      <span className="text-orange-400">₹{grandTotal}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            {cartEntries.length > 0 && (
              <div className="p-4 border-t border-stone-800 bg-stone-900/90">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-orange-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Delivery Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bike className="w-5 h-5 text-orange-400" />
                  <span>Delivery Address & Confirmation</span>
                </h3>
                <p className="text-xs text-stone-400">Enter where our rider should bring your meal</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3.5">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Your Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Iyer"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address (Optional, for Live Tracking Link)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={checkoutForm.customerEmail}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Complete Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Delivery Address <span className="text-orange-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Flat / House No, Building / Society name, Street..."
                  value={checkoutForm.deliveryAddress}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Landmark & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Metro Pillar 140"
                    value={checkoutForm.deliveryLandmark}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, deliveryLandmark: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 560034"
                    value={checkoutForm.deliveryPincode}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, deliveryPincode: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Cooking / Delivery Instructions */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Cooking / Delivery Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please send extra spoons, less spicy, call on arrival"
                  value={checkoutForm.cookingInstructions}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, cookingInstructions: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'CASH_ON_DELIVERY' }))}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      checkoutForm.paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'bg-orange-500/10 border-orange-500 text-white'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Cash on Delivery</p>
                      <p className="text-[10px] text-stone-400">Pay when food arrives</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'ONLINE_UPI' }))}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      checkoutForm.paymentMethod === 'ONLINE_UPI'
                        ? 'bg-orange-500/10 border-orange-500 text-white'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">UPI / Card</p>
                      <p className="text-[10px] text-stone-400">Instant digital payment</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Total Bill</p>
                  <p className="text-base font-black text-orange-400">₹{grandTotal}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-stone-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-900/40 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    {submittingOrder ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Place Food Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
