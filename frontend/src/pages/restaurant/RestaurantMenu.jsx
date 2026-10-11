import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Edit2, Trash2, 
  CheckCircle2, AlertTriangle, Sparkles, Flame, Coffee, 
  Layers, ChevronRight, X, RefreshCw, LayoutGrid, List,
  Tag, Clock, AlertCircle, Eye, ArrowUpDown, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantMenu() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'
  const [stationFilter, setStationFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | '86ED'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for item
  const [itemForm, setItemForm] = useState({
    name: '',
    code: '',
    categoryId: '',
    price: '',
    veg: true,
    dietaryType: 'VEG',
    station: 'Curry Range',
    description: '',
    preparationTimeMinutes: 15,
    is86ed: false,
    displayOrder: 0
  });

  // Form state for category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    defaultStation: 'General',
    displayOrder: 0
  });

  const stations = [
    'Curry Range',
    'Tandoor',
    'Pantry',
    'Beverage Bar',
    'Hot Fryer',
    'Dessert',
    'General'
  ];

  // Load menu & categories
  const loadMenuData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/restaurant/menu');
      if (res.data?.data) {
        setCategories(res.data.data.categories || []);
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
      toast.error('Unable to fetch menu & categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => !i.is86ed).length;
    const outOfStock = items.filter(i => i.is86ed).length;
    const catCount = categories.length;
    const avgPrice = total > 0 ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total) : 0;
    return { total, active, outOfStock, catCount, avgPrice };
  }, [items, categories]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const catId = typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId;
      const matchCat = selectedCategory === 'ALL' || catId === selectedCategory;
      const matchQuery = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchDietary = dietaryFilter === 'ALL' 
        ? true 
        : dietaryFilter === 'VEG' ? item.veg === true : item.veg === false;
      const matchStation = stationFilter === 'ALL' || item.station === stationFilter;
      const matchStock = stockFilter === 'ALL' 
        ? true 
        : stockFilter === 'IN_STOCK' ? !item.is86ed : item.is86ed;

      return matchCat && matchQuery && matchDietary && matchStation && matchStock;
    });
  }, [items, selectedCategory, searchQuery, dietaryFilter, stationFilter, stockFilter]);

  // Quick 86'd Toggle
  const handleToggle86 = async (item, e) => {
    e?.stopPropagation();
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, is86ed: !i.is86ed } : i));
      const res = await api.patch(`/restaurant/menu/${item._id}/toggle-86`);
      toast.success(res.data?.message || 'Item availability updated');
    } catch (err) {
      console.error('Failed to toggle 86 status:', err);
      toast.error('Failed to update availability status');
      loadMenuData(true);
    }
  };

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      code: '',
      categoryId: categories[0]?._id || '',
      price: '',
      veg: true,
      dietaryType: 'VEG',
      station: categories[0]?.defaultStation || 'Curry Range',
      description: '',
      preparationTimeMinutes: 15,
      is86ed: false,
      displayOrder: items.length
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    const catId = typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId;
    setItemForm({
      name: item.name || '',
      code: item.code || '',
      categoryId: catId || '',
      price: item.price ?? '',
      veg: item.veg !== false,
      dietaryType: item.dietaryType || (item.veg ? 'VEG' : 'NON_VEG'),
      station: item.station || 'Curry Range',
      description: item.description || '',
      preparationTimeMinutes: item.preparationTimeMinutes || 15,
      is86ed: Boolean(item.is86ed),
      displayOrder: item.displayOrder || 0
    });
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!itemForm.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (itemForm.price === '' || isNaN(Number(itemForm.price)) || Number(itemForm.price) < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...itemForm,
        price: Number(itemForm.price),
        preparationTimeMinutes: Number(itemForm.preparationTimeMinutes) || 15,
        displayOrder: Number(itemForm.displayOrder) || 0
      };

      if (editingItem) {
        const res = await api.put(`/restaurant/menu/${editingItem._id}`, payload);
        const updated = res.data?.data?.item;
        setItems(prev => prev.map(i => i._id === editingItem._id ? updated : i));
        toast.success(`Updated ${updated.name}`);
      } else {
        const res = await api.post('/restaurant/menu', payload);
        const created = res.data?.data?.item;
        setItems(prev => [...prev, created]);
        toast.success(`Added ${created.name} to menu!`);
      }

      setIsItemModalOpen(false);
    } catch (err) {
      console.error('Failed to save menu item:', err);
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/menu/${itemToDelete._id}`);
      setItems(prev => prev.filter(i => i._id !== itemToDelete._id));
      toast.success(`${itemToDelete.name} archived from menu`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to archive menu item:', err);
      toast.error('Failed to archive menu item');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        const res = await api.put(`/restaurant/categories/${editingCategory._id}`, categoryForm);
        const updated = res.data?.data?.category;
        setCategories(prev => prev.map(c => c._id === editingCategory._id ? updated : c));
        toast.success(`Category ${updated.name} updated`);
      } else {
        const res = await api.post('/restaurant/categories', categoryForm);
        const created = res.data?.data?.category;
        setCategories(prev => [...prev, created]);
        toast.success(`Category ${created.name} created!`);
      }
      setCategoryForm({ name: '', description: '', defaultStation: 'General', displayOrder: 0 });
      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    try {
      await api.delete(`/restaurant/categories/${catId}`);
      setCategories(prev => prev.filter(c => c._id !== catId));
      toast.success('Category removed');
    } catch (err) {
      console.error('Failed to remove category:', err);
      toast.error(err.response?.data?.message || 'Cannot delete category with items');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Notice Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: effectivePrimary }}
            >
              Menu & Catalog
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              POS Synced & Live
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Catalog & Pricing Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Configure dishes, dietary tags, kitchen prep stations, and manage instant 86'd out-of-stock items.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '', defaultStation: 'General', displayOrder: categories.length });
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Manage Categories
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Items</span>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Across all categories</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active in POS</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{stats.active}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Ready for orders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">86'd / Out of Stock</span>
          <p className="text-xl font-black text-rose-600 mt-1">{stats.outOfStock}</p>
          <span className="text-[10px] text-rose-600 font-bold">Unavailable in POS</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categories</span>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.catCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Sections defined</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Price</span>
          <p className="text-xl font-black text-slate-900 mt-1">₹{stats.avgPrice}</p>
          <span className="text-[10px] text-slate-500 font-medium">Per dish ticket</span>
        </div>

      </div>

      {/* Control Bar: Category Pills + Search + Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        
        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={selectedCategory === 'ALL' ? { backgroundColor: effectivePrimary } : {}}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({items.length})
          </button>

          {categories.map((cat) => {
            const count = items.filter(i => {
              const cId = typeof i.categoryId === 'object' ? i.categoryId?._id : i.categoryId;
              return cId === cat._id;
            }).length;

            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                style={selectedCategory === cat._id ? { backgroundColor: effectivePrimary } : {}}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat._id
                    ? 'text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === cat._id ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Filter Dropdowns & View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, description..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-medium"
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

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Dietary */}
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Dietary</option>
              <option value="VEG">🟢 Veg Only</option>
              <option value="NON_VEG">🔴 Non-Veg Only</option>
            </select>

            {/* Station */}
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Stations</option>
              {stations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Stock status */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="86ED">86'd Out of Stock</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-orange-600' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-orange-600' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => loadMenuData(true)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

          </div>

        </div>

      </div>

      {/* Main Content: Grid vs Table */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Loading Menu Catalog & Items...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Menu Items Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || dietaryFilter !== 'ALL' || stationFilter !== 'ALL'
              ? 'No items match your active filters. Try resetting the search or filters.'
              : 'Start by adding your first dish or beverage to this category.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add First Item
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const catName = typeof item.categoryId === 'object' ? item.categoryId?.name : 'General';

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md ${
                  item.is86ed 
                    ? 'border-rose-200 bg-rose-50/20' 
                    : 'border-slate-200/90 hover:border-orange-300'
                }`}
              >
                <div>
                  
                  {/* Top Bar: Dietary + Code + Category Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        item.veg ? 'border-emerald-600' : 'border-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`} />
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.code}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                      {catName}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h3>
                  
                  {item.description ? (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-1">No description added</p>
                  )}

                  {/* Station & Prep Time */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
                      {item.station || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.preparationTimeMinutes || 15}m
                    </span>
                  </div>

                </div>

                {/* Bottom Bar: Price + 86 Toggle + Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900">
                      ₹{item.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    
                    {/* 86 Toggle Button */}
                    <button
                      onClick={(e) => handleToggle86(item, e)}
                      className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        item.is86ed
                          ? 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={item.is86ed ? 'Currently 86d (Out of Stock). Click to mark In Stock' : 'Currently In Stock. Click to mark 86d'}
                    >
                      {item.is86ed ? '86\'d' : 'In Stock'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setItemToDelete(item);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Archive Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Kitchen Station</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const catName = typeof item.categoryId === 'object' ? item.categoryId?.name : 'General';

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full flex items-center justify-center border shrink-0 ${
                            item.veg ? 'border-emerald-600' : 'border-rose-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.veg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`} />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.code} • {item.preparationTimeMinutes || 15}m prep</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {catName}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded">
                          {item.station || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-black text-slate-900 text-sm">
                        ₹{item.price}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => handleToggle86(item, e)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            item.is86ed
                              ? 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {item.is86ed ? '86\'d Out of Stock' : 'In Stock'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Archive Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* MODAL 1: ADD / EDIT MENU ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? `Edit ${editingItem.name}` : 'Add New Menu Item'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify dish pricing, prep station, and dietary classification.
                </p>
              </div>
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 mt-4">
              
              {/* Name & Short Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Murgh Makhani"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Code / SKU
                  </label>
                  <input
                    type="text"
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    placeholder="APP-01"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              {/* Category & Kitchen Station */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-medium cursor-pointer"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Kitchen Station
                  </label>
                  <select
                    value={itemForm.station}
                    onChange={(e) => setItemForm({ ...itemForm, station: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-medium cursor-pointer"
                  >
                    {stations.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="350"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={itemForm.preparationTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTimeMinutes: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="15"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              {/* Dietary Classification */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Dietary Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, veg: true, dietaryType: 'VEG' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      itemForm.veg
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Vegetarian (Veg)
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, veg: false, dietaryType: 'NON_VEG' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      !itemForm.veg
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Description & Ingredients
                </label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="e.g. Tender chicken simmered in rich satin butter-tomato gravy"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              {/* 86'd Out of Stock Switch */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Kitchen Stock Availability</span>
                  <span className="text-[10px] text-slate-400">
                    {itemForm.is86ed ? "Item marked as 86'd (Unavailable in POS)" : "Item is in stock and available for ordering"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, is86ed: !itemForm.is86ed })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    itemForm.is86ed 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {itemForm.is86ed ? "86'd" : "In Stock"}
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE CATEGORIES */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Manage Menu Categories
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organize your menu into courses and default routing stations.
                </p>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add / Edit Category Form */}
            <form onSubmit={handleSaveCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : '+ Create New Category'}
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Starters)"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />

                <select
                  value={categoryForm.defaultStation}
                  onChange={(e) => setCategoryForm({ ...categoryForm, defaultStation: e.target.value })}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  {stations.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Optional description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '', defaultStation: 'General', displayOrder: 0 });
                    }}
                    className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {editingCategory ? 'Update' : 'Add Category'}
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Categories ({categories.length})
              </h4>

              {categories.map((cat) => {
                const count = items.filter(i => {
                  const cId = typeof i.categoryId === 'object' ? i.categoryId?._id : i.categoryId;
                  return cId === cat._id;
                }).length;

                return (
                  <div key={cat._id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Station: {cat.defaultStation} • {count} active items
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            name: cat.name,
                            description: cat.description || '',
                            defaultStation: cat.defaultStation || 'General',
                            displayOrder: cat.displayOrder || 0
                          });
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(cat._id)}
                        disabled={count > 0}
                        className={`p-1 rounded-lg cursor-pointer ${
                          count > 0 
                            ? 'text-slate-200 cursor-not-allowed' 
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={count > 0 ? 'Cannot delete category with items' : 'Delete Category'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Archive {itemToDelete.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This item will be hidden from the Touch POS terminal and KDS board. Past billing records will remain intact.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Archiving...' : 'Yes, Archive Item'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
