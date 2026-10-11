import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, UtensilsCrossed, Plus, Minus, Trash2, 
  Printer, ArrowRight, CheckCircle2, AlertCircle, Sparkles, 
  Coffee, Wine, Flame, Clock, Users, X, Info, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantPOS() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Server data states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);

  // Active terminal states
  const [selectedChannel, setSelectedChannel] = useState('DINE_IN'); // 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedTableName, setSelectedTableName] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('CASH');

  // Active cart
  const [cart, setCart] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  // Fetch live menu, categories, and tables
  const loadPOSData = useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, tablesRes] = await Promise.all([
        api.get('/restaurant/menu'),
        api.get('/restaurant/tables')
      ]);

      if (menuRes.data?.data) {
        const fetchedCats = menuRes.data.data.categories || [];
        const fetchedItems = menuRes.data.data.items || [];
        setCategories([
          { _id: 'ALL', name: 'All Categories' },
          ...fetchedCats
        ]);
        setMenuItems(fetchedItems);
      }

      if (tablesRes.data?.data) {
        const fetchedTables = tablesRes.data.data.tables || [];
        const fetchedAreas = tablesRes.data.data.areas || [];
        setTables(fetchedTables);
        setAreas(fetchedAreas);

        // Pre-select first available table or first table if none selected
        if (!selectedTableId && fetchedTables.length > 0) {
          const firstAvail = fetchedTables.find(t => t.status === 'AVAILABLE') || fetchedTables[0];
          setSelectedTableId(firstAvail._id);
          setSelectedTableName(firstAvail.tableNumber);
        }
      }
    } catch (err) {
      console.error('Failed to load POS data from server:', err);
      toast.error('Unable to fetch live menu & tables from server');
    } finally {
      setLoading(false);
    }
  }, [selectedTableId]);

  useEffect(() => {
    loadPOSData();
  }, [loadPOSData]);

  // Fallback demo menu if server has no items
  const displayItems = useMemo(() => {
    if (menuItems.length > 0) {
      return menuItems.map(item => ({
        id: item._id,
        name: item.name,
        code: item.code || `ITM-${item._id.slice(-3)}`,
        categoryId: typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId,
        categoryName: typeof item.categoryId === 'object' ? item.categoryId?.name : 'General',
        price: item.price,
        veg: item.veg !== false,
        station: item.station || 'Curry Range',
        outOfStock: Boolean(item.is86ed || !item.isAvailable)
      }));
    }

    // Default seeded fallback
    return [
      { id: 'M1', name: 'Paneer Tikka Angara', code: 'APP-01', categoryId: 'STARTERS', price: 280, veg: true, station: 'Tandoor' },
      { id: 'M2', name: 'Chicken Malai Tikka', code: 'APP-02', categoryId: 'STARTERS', price: 340, veg: false, station: 'Tandoor' },
      { id: 'M3', name: 'Crispy Corn Salt & Pepper', code: 'APP-03', categoryId: 'STARTERS', price: 220, veg: true, station: 'Pantry' },
      { id: 'M4', name: 'Butter Chicken Masala', code: 'MAIN-01', categoryId: 'MAINS', price: 380, veg: false, station: 'Curry Range' },
      { id: 'M5', name: 'Dal Makhani Royal', code: 'MAIN-02', categoryId: 'MAINS', price: 290, veg: true, station: 'Curry Range' },
      { id: 'M6', name: 'Paneer Butter Masala', code: 'MAIN-03', categoryId: 'MAINS', price: 320, veg: true, station: 'Curry Range' },
      { id: 'M7', name: 'Mutton Rogan Josh', code: 'MAIN-04', categoryId: 'MAINS', price: 460, veg: false, station: 'Curry Range' },
      { id: 'M8', name: 'Butter Garlic Naan', code: 'BRD-01', categoryId: 'BREADS', price: 65, veg: true, station: 'Tandoor' },
      { id: 'M9', name: 'Tandoori Roti Butter', code: 'BRD-02', categoryId: 'BREADS', price: 35, veg: true, station: 'Tandoor' },
      { id: 'M10', name: 'Chicken Dum Biryani (Pot)', code: 'BRD-03', categoryId: 'BREADS', price: 360, veg: false, station: 'Curry Range' },
      { id: 'M11', name: 'Steamed Basmati Rice', code: 'BRD-04', categoryId: 'BREADS', price: 160, veg: true, station: 'Curry Range' },
      { id: 'M12', name: 'Virgin Mint Mojito', code: 'BEV-01', categoryId: 'BEVERAGES', price: 140, veg: true, station: 'Beverage Bar' },
      { id: 'M13', name: 'Cold Coffee with Ice Cream', code: 'BEV-02', categoryId: 'BEVERAGES', price: 160, veg: true, station: 'Beverage Bar' },
      { id: 'M14', name: 'Sweet Punjabi Lassi', code: 'BEV-03', categoryId: 'BEVERAGES', price: 110, veg: true, station: 'Beverage Bar' },
      { id: 'M15', name: 'Gulab Jamun with Rabri', code: 'DES-01', categoryId: 'DESSERTS', price: 130, veg: true, station: 'Dessert' },
      { id: 'M16', name: 'Sizzling Brownie with Ice Cream', code: 'DES-02', categoryId: 'DESSERTS', price: 190, veg: true, station: 'Dessert' },
      { id: 'M17', name: 'Fish Amritsari Fry', code: 'APP-04', categoryId: 'STARTERS', price: 390, veg: false, station: 'Hot Fryer', outOfStock: true },
    ];
  }, [menuItems]);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return displayItems.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [displayItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item) => {
    if (item.outOfStock) {
      toast.error(`${item.name} is currently 86'd / Out of stock in kitchen`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1, 
        station: item.station,
        veg: item.veg,
        notes: '' 
      }];
    });
    toast.success(`Added ${item.name}`, { duration: 1200 });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from this order cart?')) {
      setCart([]);
    }
  };

  const saveItemNote = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes: noteInput } : i));
    setEditingNoteId(null);
    setNoteInput('');
    toast.success('Kitchen note saved');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = Math.round(subtotal * 0.05); // 5% discretionary
  const cgst = Math.round(subtotal * 0.025); // 2.5%
  const sgst = Math.round(subtotal * 0.025); // 2.5%
  const grandTotal = subtotal + serviceCharge + cgst + sgst;

  // Dispatch live order to backend
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items first.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        orderType: selectedChannel,
        tableId: selectedChannel === 'DINE_IN' ? selectedTableId : null,
        tableName: selectedChannel === 'DINE_IN' ? selectedTableName : selectedChannel,
        guestCount: guestCount || 1,
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          station: i.station || 'Curry Range',
          notes: i.notes || '',
          veg: i.veg !== false
        }))
      };

      const res = await api.post('/restaurant/orders', payload);
      const createdOrder = res.data?.data?.order;
      const orderNum = createdOrder?.orderNumber || 'ORD-NEW';

      toast.success(
        `KOT ${orderNum} dispatched to Kitchen for ${selectedChannel === 'DINE_IN' ? selectedTableName : selectedChannel}!`, 
        { duration: 4000 }
      );

      // Clear cart & refresh floor status
      setCart([]);
      loadPOSData();
    } catch (err) {
      console.error('Failed to submit order:', err);
      toast.error(err.response?.data?.message || 'Failed to dispatch KOT to kitchen');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Settle Bill directly
  const handleSettleOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items first.');
      return;
    }

    try {
      setSubmitting(true);
      // 1. Create order
      const payload = {
        orderType: selectedChannel,
        tableId: selectedChannel === 'DINE_IN' ? selectedTableId : null,
        tableName: selectedChannel === 'DINE_IN' ? selectedTableName : selectedChannel,
        guestCount: guestCount || 1,
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          station: i.station || 'Curry Range',
          notes: i.notes || '',
          veg: i.veg !== false
        }))
      };

      const res = await api.post('/restaurant/orders', payload);
      const order = res.data?.data?.order;

      // 2. Settle bill immediately
      if (order?._id) {
        await api.post(`/restaurant/orders/${order._id}/settle`, {
          paymentMethod: selectedPayment,
          paymentReference: `POS-${Date.now().toString().slice(-4)}`
        });

        toast.success(`Bill settled (₹${grandTotal}) via ${selectedPayment}. Table released!`, {
          duration: 4000
        });
        setCart([]);
        loadPOSData();
      }
    } catch (err) {
      console.error('Failed to settle order bill:', err);
      toast.error(err.response?.data?.message || 'Failed to settle bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBill = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items first.');
      return;
    }
    toast.success(`Printing tax bill: ₹${grandTotal} for ${selectedTableName || selectedChannel}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* Live Server Notice Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold">
            <span className="font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
              Live POS Connected
            </span>
            Touch POS Terminal — Dispatches real orders to Kitchen Display (KDS), updates floor occupancy, and logs tax bills.
          </p>
        </div>
        <button
          onClick={loadPOSData}
          disabled={loading}
          className="text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Sync Menu & Tables'}
        </button>
      </div>

      {/* POS Top Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Channel Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setSelectedChannel('DINE_IN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedChannel === 'DINE_IN'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dine-In
          </button>
          <button
            onClick={() => setSelectedChannel('TAKEAWAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedChannel === 'TAKEAWAY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Takeaway
          </button>
          <button
            onClick={() => setSelectedChannel('DELIVERY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedChannel === 'DELIVERY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Delivery
          </button>
        </div>

        {/* Table & Covers Selector (Only for Dine-in) */}
        {selectedChannel === 'DINE_IN' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Table:</span>
              <select
                value={selectedTableId}
                onChange={(e) => {
                  const t = tables.find(tbl => tbl._id === e.target.value);
                  setSelectedTableId(e.target.value);
                  setSelectedTableName(t ? t.tableNumber : e.target.value);
                }}
                className="bg-transparent font-bold text-xs text-orange-600 outline-none cursor-pointer"
              >
                {tables.length > 0 ? (
                  tables.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.tableNumber} {t.areaId?.name ? `(${t.areaId.name})` : ''} — {t.status}
                    </option>
                  ))
                ) : (
                  ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Guests:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-8 text-xs font-bold text-slate-800 bg-transparent text-center outline-none"
              />
            </div>
          </div>
        )}

        {/* Item Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or codes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Main Grid: Menu Browser (Left) vs Order Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Category Navigation & Menu Grid (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
          
          {/* Category Horizontal Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat._id || cat.id}
                onClick={() => setSelectedCategory(cat._id || cat.id)}
                style={selectedCategory === (cat._id || cat.id) ? { backgroundColor: effectivePrimary } : {}}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === (cat._id || cat.id)
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className={`bg-white rounded-2xl p-3.5 border transition-all relative flex flex-col justify-between group cursor-pointer ${
                  item.outOfStock
                    ? 'opacity-60 border-slate-200 bg-slate-50/50 cursor-not-allowed'
                    : 'border-slate-200/80 hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Dietary & Code Row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        item.veg ? 'border-emerald-600' : 'border-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`} />
                      </span>
                    </div>
                  </div>

                  {/* Title & Station */}
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {item.station}
                  </span>
                </div>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-900">
                    ₹{item.price}
                  </span>
                  
                  {item.outOfStock ? (
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      86'd
                    </span>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-2xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Right: Order Cart & Bill Breakdown (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm sticky top-20 flex flex-col overflow-hidden">
            
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedChannel === 'DINE_IN' ? selectedTableName || 'Select Table' : selectedChannel}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {selectedChannel}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {cart.length} item kinds in current ticket
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[340px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <UtensilsCrossed className="w-8 h-8 stroke-1 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">Your order cart is empty</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tap menu items on the left to add</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">₹{item.price} each</p>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[50px]">
                        <span className="text-xs font-black text-slate-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Special Instruction Note */}
                    <div className="mt-1">
                      {editingNoteId === item.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="e.g. less spicy, no onion"
                            className="text-[10px] border border-slate-300 rounded px-2 py-0.5 flex-1 outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveItemNote(item.id)}
                            className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="text-[10px] text-slate-400 px-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          {item.notes ? (
                            <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                              Note: {item.notes}
                            </p>
                          ) : <span />}
                          <button
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setNoteInput(item.notes || '');
                            }}
                            className="text-[9px] text-slate-400 hover:text-orange-600 font-semibold cursor-pointer"
                          >
                            {item.notes ? 'Edit note' : '+ Add note'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary Breakdown */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Service Charge (5%)</span>
                <span>₹{serviceCharge}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>GST (CGST 2.5% + SGST 2.5%)</span>
                <span>₹{cgst + sgst}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-orange-600">₹{grandTotal}</span>
              </div>
            </div>

            {/* Quick Payment Mode Selector */}
            <div className="px-4 py-2 bg-white border-t border-slate-100">
              <div className="grid grid-cols-3 gap-1.5">
                {['CASH', 'UPI', 'CARD'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedPayment(mode)}
                    className={`py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                      selectedPayment === mode
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="p-3 bg-white border-t border-slate-100 space-y-2 rounded-b-2xl">
              <button
                onClick={handleSendKOT}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-orange-500/20 transition-all hover:brightness-105 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                <Flame className="w-4 h-4" />
                <span>{submitting ? 'Dispatching...' : 'Send KOT to Kitchen'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBill}
                  className="flex-1 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={handleSettleOrder}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settle Bill</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
