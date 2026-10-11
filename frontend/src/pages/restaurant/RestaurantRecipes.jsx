import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Filter, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  ChefHat, Sparkles, X, Edit3, Trash2, Eye, ShieldAlert,
  Percent, Scale, Flame, ArrowUpRight, ArrowDownRight,
  Info, PieChart, Layers, Clock, Check, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

const COMMON_UOMS = [
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'g', label: 'g (Gram)' },
  { value: 'l', label: 'L (Litre)' },
  { value: 'ml', label: 'ml (Millilitre)' },
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'portion', label: 'portion (Portion)' },
  { value: 'tbsp', label: 'tbsp (Tablespoon)' },
  { value: 'tsp', label: 'tsp (Teaspoon)' },
  { value: 'pinch', label: 'pinch' },
  { value: 'can', label: 'can' },
  { value: 'pack', label: 'pack' },
  { value: 'bottle', label: 'bottle' }
];

const ALLERGEN_OPTIONS = [
  { id: 'DAIRY', label: 'Dairy / Lactose' },
  { id: 'NUTS', label: 'Tree Nuts / Peanuts' },
  { id: 'GLUTEN', label: 'Gluten / Wheat' },
  { id: 'EGGS', label: 'Eggs' },
  { id: 'SOY', label: 'Soy' },
  { id: 'SHELLFISH', label: 'Shellfish' },
  { id: 'FISH', label: 'Fish' },
  { id: 'MUSTARD', label: 'Mustard' },
  { id: 'SESAME', label: 'Sesame' }
];

export default function RestaurantRecipes() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalRecipes: 0,
    averageFoodCostPercentage: 0,
    highAlertCount: 0,
    acceptableCount: 0,
    optimalCount: 0,
    averageGrossMarginPercentage: 0
  });

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPTIMAL, ACCEPTABLE, HIGH_ALERT
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Editor Form State
  const initialFormState = {
    _id: null,
    menuItemId: '',
    recipeName: '',
    yieldPortions: 1,
    targetCostPercentage: 32,
    prepTimeMinutes: 15,
    preparationNotes: '',
    allergens: [],
    ingredients: [
      { name: '', quantity: '', uom: 'g', unitCost: '', yieldFactor: 100 }
    ]
  };
  const [editorForm, setEditorForm] = useState(initialFormState);

  // Fetch initial data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [recipeRes, menuRes] = await Promise.all([
        api.get('/restaurant/recipes'),
        api.get('/restaurant/menu')
      ]);

      if (recipeRes.data?.data) {
        setRecipes(recipeRes.data.data.recipes || []);
        if (recipeRes.data.data.summary) {
          setSummary(recipeRes.data.data.summary);
        }
      }

      if (menuRes.data?.data) {
        setMenuItems(menuRes.data.data.items || []);
        setCategories(menuRes.data.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load recipes data:', err);
      toast.error('Unable to load recipe data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique stations
  const stationsList = useMemo(() => {
    const set = new Set();
    menuItems.forEach(i => {
      if (i.station) set.add(i.station);
    });
    return Array.from(set);
  }, [menuItems]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        r.recipeName?.toLowerCase().includes(q) ||
        r.menuItemId?.name?.toLowerCase().includes(q) ||
        r.menuItemId?.code?.toLowerCase().includes(q) ||
        r.ingredients?.some(ing => ing.name?.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'ALL' || 
        r.menuItemId?.categoryId?._id === selectedCategory ||
        r.menuItemId?.categoryId === selectedCategory;

      const matchesStation = selectedStation === 'ALL' || r.menuItemId?.station === selectedStation;

      const matchesStatus = statusFilter === 'ALL' || r.costStatus === statusFilter;

      return matchesSearch && matchesCat && matchesStation && matchesStatus;
    });
  }, [recipes, searchTerm, selectedCategory, selectedStation, statusFilter]);

  // Menu items that don't have a recipe yet (for creating new recipes)
  const availableMenuItemsForNew = useMemo(() => {
    const existingItemIds = new Set(recipes.map(r => r.menuItemId?._id));
    return menuItems.filter(item => !existingItemIds.has(item._id));
  }, [menuItems, recipes]);

  // Live Calculations in Editor Form
  const liveEditorMetrics = useMemo(() => {
    const selectedItem = menuItems.find(i => i._id === editorForm.menuItemId);
    const sellingPrice = selectedItem ? selectedItem.price : 0;
    const yieldPortions = Number(editorForm.yieldPortions) > 0 ? Number(editorForm.yieldPortions) : 1;

    let totalBatchCost = 0;
    const computedRows = editorForm.ingredients.map(ing => {
      const qty = Number(ing.quantity) || 0;
      const uCost = Number(ing.unitCost) || 0;
      const yFactor = Math.min(100, Math.max(1, Number(ing.yieldFactor) || 100));
      const lineCost = Math.round(((qty * uCost) / (yFactor / 100)) * 100) / 100;
      totalBatchCost += lineCost;
      return { ...ing, lineCost };
    });

    totalBatchCost = Math.round(totalBatchCost * 100) / 100;
    const portionCost = Math.round((totalBatchCost / yieldPortions) * 100) / 100;
    const foodCostPercentage = sellingPrice > 0 ? Math.round(((portionCost / sellingPrice) * 100) * 10) / 10 : 0;
    const grossMarginPercentage = sellingPrice > 0 ? Math.round((100 - foodCostPercentage) * 10) / 10 : 0;
    const contributionMargin = Math.round((sellingPrice - portionCost) * 100) / 100;

    let status = 'OPTIMAL';
    if (foodCostPercentage > 35) status = 'HIGH_ALERT';
    else if (foodCostPercentage > 30) status = 'ACCEPTABLE';

    return {
      sellingPrice,
      totalBatchCost,
      portionCost,
      foodCostPercentage,
      grossMarginPercentage,
      contributionMargin,
      status,
      computedRows
    };
  }, [editorForm, menuItems]);

  // Open Editor for Create
  const handleOpenCreateModal = () => {
    const firstAvailable = availableMenuItemsForNew[0] || menuItems[0];
    setEditorForm({
      ...initialFormState,
      menuItemId: firstAvailable ? firstAvailable._id : '',
      recipeName: firstAvailable ? `${firstAvailable.name} Standard Recipe` : '',
      ingredients: [
        { name: 'Primary Base / Protein', quantity: '', uom: 'kg', unitCost: '', yieldFactor: 90 },
        { name: 'Sauce / Gravy / Seasoning', quantity: '', uom: 'g', unitCost: '', yieldFactor: 100 }
      ]
    });
    setIsEditorOpen(true);
  };

  // Open Editor for Edit
  const handleOpenEditModal = (recipe) => {
    setEditorForm({
      _id: recipe._id,
      menuItemId: recipe.menuItemId?._id || recipe.menuItemId,
      recipeName: recipe.recipeName,
      yieldPortions: recipe.yieldPortions || 1,
      targetCostPercentage: recipe.targetCostPercentage || 32,
      prepTimeMinutes: recipe.prepTimeMinutes || 15,
      preparationNotes: recipe.preparationNotes || '',
      allergens: recipe.allergens || [],
      ingredients: recipe.ingredients && recipe.ingredients.length > 0 
        ? recipe.ingredients.map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            uom: ing.uom || 'g',
            unitCost: ing.unitCost,
            yieldFactor: ing.yieldFactor !== undefined ? ing.yieldFactor : 100
          }))
        : [{ name: '', quantity: '', uom: 'g', unitCost: '', yieldFactor: 100 }]
    });
    setIsEditorOpen(true);
  };

  // Handle MenuItem selection change in editor
  const handleMenuItemChange = (e) => {
    const itemId = e.target.value;
    const item = menuItems.find(i => i._id === itemId);
    setEditorForm(prev => ({
      ...prev,
      menuItemId: itemId,
      recipeName: item ? `${item.name} Standard Recipe` : prev.recipeName,
      prepTimeMinutes: item?.preparationTimeMinutes || prev.prepTimeMinutes
    }));
  };

  // Ingredient row mutations
  const handleAddIngredientRow = () => {
    setEditorForm(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name: '', quantity: '', uom: 'g', unitCost: '', yieldFactor: 100 }
      ]
    }));
  };

  const handleRemoveIngredientRow = (index) => {
    if (editorForm.ingredients.length <= 1) {
      toast.error('Recipe must contain at least one ingredient');
      return;
    }
    setEditorForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    setEditorForm(prev => {
      const updated = [...prev.ingredients];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return { ...prev, ingredients: updated };
    });
  };

  // Toggle Allergen
  const handleToggleAllergen = (allergenId) => {
    setEditorForm(prev => {
      const current = prev.allergens || [];
      if (current.includes(allergenId)) {
        return { ...prev, allergens: current.filter(a => a !== allergenId) };
      } else {
        return { ...prev, allergens: [...current, allergenId] };
      }
    });
  };

  // Save / Update Recipe
  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!editorForm.menuItemId) {
      toast.error('Please select a menu item');
      return;
    }
    if (!editorForm.recipeName.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }
    if (editorForm.ingredients.some(ing => !ing.name.trim())) {
      toast.error('All ingredients must have a valid name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        menuItemId: editorForm.menuItemId,
        recipeName: editorForm.recipeName.trim(),
        yieldPortions: Number(editorForm.yieldPortions) || 1,
        targetCostPercentage: Number(editorForm.targetCostPercentage) || 32,
        prepTimeMinutes: Number(editorForm.prepTimeMinutes) || 15,
        preparationNotes: editorForm.preparationNotes,
        allergens: editorForm.allergens,
        ingredients: editorForm.ingredients.map(ing => ({
          name: ing.name.trim(),
          quantity: Number(ing.quantity) || 0,
          uom: ing.uom,
          unitCost: Number(ing.unitCost) || 0,
          yieldFactor: Number(ing.yieldFactor) || 100
        }))
      };

      if (editorForm._id) {
        // Update
        await api.put(`/restaurant/recipes/${editorForm._id}`, payload);
        toast.success('Recipe updated successfully!');
      } else {
        // Create
        await api.post('/restaurant/recipes', payload);
        toast.success('New recipe BOM standardized successfully!');
      }

      setIsEditorOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Error saving recipe:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Recipe Confirmation
  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/recipes/${recipeToDelete._id}`);
      toast.success(`Recipe "${recipeToDelete.recipeName}" deleted`);
      setIsDeleteModalOpen(false);
      setRecipeToDelete(null);
      fetchData(true);
    } catch (err) {
      console.error('Error deleting recipe:', err);
      toast.error(err.response?.data?.message || 'Failed to delete recipe');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Detail Inspector
  const handleOpenDetailModal = (recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Recipe Engineering & Food Costing
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
                  Culinary BOM
                </span>
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Standardize dish recipes, track ingredient yields, enforce target margins, and protect kitchen profitability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            title="Refresh recipe data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 transition-all"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Standardize New Recipe
          </button>
        </div>
      </div>

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Recipes */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Standardized BOMs
            </span>
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {summary.totalRecipes}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              active recipes
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Covering {recipes.reduce((acc, r) => acc + (r.ingredients?.length || 0), 0)} tracked ingredient lines
          </p>
        </div>

        {/* Card 2: Average Food Cost % */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Avg Food Cost %
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              summary.averageFoodCostPercentage > 35 
                ? 'text-red-600 dark:text-red-400' 
                : summary.averageFoodCostPercentage > 30 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {summary.averageFoodCostPercentage}%
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              Target: 32%
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                summary.averageFoodCostPercentage > 35 ? 'bg-red-500' : summary.averageFoodCostPercentage > 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (summary.averageFoodCostPercentage / 50) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Gross Profit Margin */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Theoretical Margin
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.averageGrossMarginPercentage}%
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              gross margin
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            {summary.optimalCount} dishes yielding optimal contribution
          </p>
        </div>

        {/* Card 4: High Cost Critical Alerts */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'HIGH_ALERT' ? 'ALL' : 'HIGH_ALERT')}
          className={`border rounded-2xl p-5 shadow-xs cursor-pointer transition-all ${
            summary.highAlertCount > 0 
              ? statusFilter === 'HIGH_ALERT'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-400 ring-2 ring-red-500/20'
                : 'bg-white dark:bg-stone-900 border-red-200 dark:border-red-900/60 hover:border-red-300'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              High Cost Alerts
            </span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.highAlertCount}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              dishes exceeding 35% cost
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-2 flex items-center gap-1">
            {statusFilter === 'HIGH_ALERT' ? 'Click to show all recipes' : 'Click to filter margin risk items'}
          </p>
        </div>

      </div>

      {/* 3. Industry Formula & Benchmark Callout */}
      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-stone-600 dark:text-stone-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>Culinary Costing Rule:</strong> Line Cost = (Qty × Unit Cost) ÷ Usable Yield%. Food Cost % = (Portion Cost ÷ Menu Price) × 100.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Optimal: &lt; 30%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Balanced: 30% - 35%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical: &gt; 35%
          </span>
        </div>
      </div>

      {/* 4. Filter & Toolbar Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by dish name, item code, or ingredient (e.g. Paneer, Chicken, Butter)..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            {/* Station Dropdown */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="ALL">All Kitchen Stations</option>
              {stationsList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                Spreadsheet
              </button>
            </div>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            All Recipes ({recipes.length})
          </button>

          <button
            onClick={() => setStatusFilter('OPTIMAL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Optimal &lt;30% ({summary.optimalCount})
          </button>

          <button
            onClick={() => setStatusFilter('ACCEPTABLE')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'ACCEPTABLE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Acceptable 30-35% ({summary.acceptableCount})
          </button>

          <button
            onClick={() => setStatusFilter('HIGH_ALERT')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'HIGH_ALERT'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            High Cost &gt;35% ({summary.highAlertCount})
          </button>
        </div>
      </div>

      {/* 5. Main Content: Recipe Cards or High-Density Table */}
      {loading ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading recipe bills of materials...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center shadow-xs">
          <ChefHat className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">No Recipes Found</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No standardized recipes match the active filters. Try clearing your search.'
              : 'Begin building your culinary inventory by standardizing your first recipe BOM.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Standardize First Recipe
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map(recipe => {
            const menuItem = recipe.menuItemId;
            const isHighAlert = recipe.costStatus === 'HIGH_ALERT';
            const isOptimal = recipe.costStatus === 'OPTIMAL';

            return (
              <div 
                key={recipe._id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-800/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Station, Dietary Tag, Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Dietary Type Indicator */}
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border text-[10px] font-bold ${
                        menuItem?.dietaryType === 'VEG' 
                          ? 'border-emerald-600 text-emerald-600' 
                          : menuItem?.dietaryType === 'EGG'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-red-600 text-red-600'
                      }`}>
                        ●
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                        {menuItem?.station || 'General'}
                      </span>
                      {menuItem?.categoryId?.name && (
                        <span className="text-xs text-stone-400">
                          {menuItem.categoryId.name}
                        </span>
                      )}
                    </div>

                    {/* Cost Status Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      isHighAlert
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60'
                        : isOptimal
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                    }`}>
                      {recipe.foodCostPercentage}% Cost
                    </span>
                  </div>

                  {/* Title & Code */}
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {menuItem?.name || recipe.recipeName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span>Code: {menuItem?.code || '—'}</span>
                      <span>•</span>
                      <span>Yield: {recipe.yieldPortions || 1} portion(s)</span>
                      {recipe.prepTimeMinutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {recipe.prepTimeMinutes}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Grid: Selling Price vs Portion Cost vs Margin */}
                  <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
                        Selling Price
                      </span>
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        ₹{recipe.sellingPrice}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
                        Recipe Cost
                      </span>
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        ₹{recipe.portionCost}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
                        Contrib. Margin
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{recipe.contributionMargin}
                      </span>
                    </div>
                  </div>

                  {/* Food Cost Visual Progress Meter */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-stone-500 dark:text-stone-400">
                        Food Cost Ratio
                      </span>
                      <span className={`font-semibold ${
                        isHighAlert ? 'text-red-600' : isOptimal ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {recipe.foodCostPercentage}%
                        <span className="text-stone-400 font-normal ml-1">
                          (Gross Margin {recipe.grossMarginPercentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHighAlert ? 'bg-red-500' : isOptimal ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (recipe.foodCostPercentage / 50) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                      Ingredients ({recipe.ingredients?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients?.slice(0, 3).map((ing, i) => (
                        <span 
                          key={i} 
                          className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          {ing.name} ({ing.quantity} {ing.uom})
                        </span>
                      ))}
                      {recipe.ingredients?.length > 3 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                          +{recipe.ingredients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allergens if any */}
                  {recipe.allergens && recipe.allergens.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {recipe.allergens.map(a => (
                        <span 
                          key={a}
                          className="text-[10px] px-1.5 py-0.5 rounded-sm bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-medium"
                        >
                          ⚠️ {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 mt-2">
                  <button
                    onClick={() => handleOpenDetailModal(recipe)}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect BOM
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(recipe)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                      title="Edit Recipe BOM"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRecipeToDelete(recipe);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete Recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* SPREADSHEET HIGH-DENSITY TABLE VIEW */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Menu Item & Recipe</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Batch Cost</th>
                  <th className="py-3 px-4 text-right">Portion Cost</th>
                  <th className="py-3 px-4 text-right">Margin (₹)</th>
                  <th className="py-3 px-4 text-center">Food Cost %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {filteredRecipes.map(recipe => {
                  const menuItem = recipe.menuItemId;
                  const isHighAlert = recipe.costStatus === 'HIGH_ALERT';
                  const isOptimal = recipe.costStatus === 'OPTIMAL';

                  return (
                    <tr key={recipe._id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">
                          {menuItem?.name || recipe.recipeName}
                        </div>
                        <div className="text-xs text-stone-400">
                          {menuItem?.code || '—'} • {recipe.ingredients?.length || 0} ingredients
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {menuItem?.station || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium">
                        ₹{recipe.sellingPrice}
                      </td>

                      <td className="py-3.5 px-4 text-right text-stone-500 text-xs">
                        ₹{recipe.totalBatchCost} <span className="text-[10px]">({recipe.yieldPortions}p)</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-stone-900 dark:text-stone-100">
                        ₹{recipe.portionCost}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        +₹{recipe.contributionMargin}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-bold ${
                            isHighAlert ? 'text-red-600' : isOptimal ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {recipe.foodCostPercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          isHighAlert
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                            : isOptimal
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {isHighAlert ? 'Margin Alert' : isOptimal ? 'Optimal' : 'Balanced'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(recipe)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
                            title="Inspect BOM"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(recipe)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
                            title="Edit Recipe"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRecipeToDelete(recipe);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                            title="Delete Recipe"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* 6. CREATE / EDIT RECIPE MODAL */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {editorForm._id ? 'Edit Standard Recipe BOM' : 'Standardize New Recipe BOM'}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Enter raw ingredient costs, portion yields, and trim factors to compute real-time margins.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top Row: Menu Item Selection & Recipe Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Select Menu Item */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Target Menu Item *
                  </label>
                  <select
                    disabled={!!editorForm._id}
                    value={editorForm.menuItemId}
                    onChange={handleMenuItemChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
                  >
                    <option value="">-- Choose Menu Item --</option>
                    {menuItems.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.code || 'No code'}) — ₹{item.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipe Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Recipe Specification Title *
                  </label>
                  <input
                    type="text"
                    value={editorForm.recipeName}
                    onChange={e => setEditorForm({ ...editorForm, recipeName: e.target.value })}
                    placeholder="e.g. Butter Chicken Standard Recipe"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                {/* Yield Portions (Numeric input rule compliant) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Batch Yield (Portions) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editorForm.yieldPortions}
                    onChange={e => setEditorForm({
                      ...editorForm,
                      yieldPortions: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    placeholder="1"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

              </div>

              {/* Dynamic Bill of Materials Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
                      Bill of Materials (BOM) — Ingredients
                    </span>
                    <span className="text-xs text-stone-400">
                      (Line Cost = (Qty × Unit Cost) ÷ Yield%)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredient Line
                  </button>
                </div>

                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3">Ingredient Name *</th>
                          <th className="py-2.5 px-3 w-28">Quantity</th>
                          <th className="py-2.5 px-3 w-28">UOM</th>
                          <th className="py-2.5 px-3 w-28">Unit Cost (₹)</th>
                          <th className="py-2.5 px-3 w-24">Yield %</th>
                          <th className="py-2.5 px-3 text-right w-28">Line Cost (₹)</th>
                          <th className="py-2.5 px-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                        {editorForm.ingredients.map((ing, idx) => {
                          const qty = Number(ing.quantity) || 0;
                          const uCost = Number(ing.unitCost) || 0;
                          const yFactor = Math.min(100, Math.max(1, Number(ing.yieldFactor) || 100));
                          const lineCost = Math.round(((qty * uCost) / (yFactor / 100)) * 100) / 100;

                          return (
                            <tr key={idx} className="hover:bg-stone-50/50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={ing.name}
                                  onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                                  placeholder="e.g. Boneless Chicken"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={ing.quantity}
                                  onChange={e => handleIngredientChange(
                                    idx, 
                                    'quantity', 
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )}
                                  placeholder="0.25"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={ing.uom}
                                  onChange={e => handleIngredientChange(idx, 'uom', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                >
                                  {COMMON_UOMS.map(u => (
                                    <option key={u.value} value={u.value}>{u.value}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={ing.unitCost}
                                  onChange={e => handleIngredientChange(
                                    idx, 
                                    'unitCost', 
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )}
                                  placeholder="280"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={ing.yieldFactor}
                                  onChange={e => handleIngredientChange(
                                    idx, 
                                    'yieldFactor', 
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )}
                                  placeholder="100"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                                />
                              </td>
                              <td className="p-2 text-right font-semibold text-stone-900 dark:text-stone-100">
                                ₹{lineCost}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientRow(idx)}
                                  className="p-1 rounded-md text-stone-400 hover:text-red-600 transition-colors"
                                  title="Remove ingredient line"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATED FINANCIAL IMPACT CARD */}
              <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                      Live Recipe Financial Calculation
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    liveEditorMetrics.status === 'HIGH_ALERT'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : liveEditorMetrics.status === 'OPTIMAL'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {liveEditorMetrics.status === 'HIGH_ALERT' ? 'Critical Margin Alert' : liveEditorMetrics.status === 'OPTIMAL' ? 'Optimal Profitability' : 'Acceptable Range'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-stone-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Batch Cost</span>
                    <span className="text-lg font-bold text-white">₹{liveEditorMetrics.totalBatchCost}</span>
                  </div>
                  <div className="bg-stone-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Portion Cost</span>
                    <span className="text-lg font-bold text-white">₹{liveEditorMetrics.portionCost}</span>
                  </div>
                  <div className="bg-stone-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Menu Selling Price</span>
                    <span className="text-lg font-bold text-white">₹{liveEditorMetrics.sellingPrice}</span>
                  </div>
                  <div className="bg-stone-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Food Cost %</span>
                    <span className={`text-lg font-bold ${
                      liveEditorMetrics.foodCostPercentage > 35 
                        ? 'text-red-400' 
                        : liveEditorMetrics.foodCostPercentage > 30 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}>
                      {liveEditorMetrics.foodCostPercentage}%
                    </span>
                  </div>
                  <div className="bg-stone-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Contrib. Margin</span>
                    <span className="text-lg font-bold text-emerald-400">+₹{liveEditorMetrics.contributionMargin}</span>
                  </div>
                </div>
              </div>

              {/* Allergens & Preparation Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Allergens */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-2">
                    Allergen Declarations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map(a => {
                      const isSelected = editorForm.allergens?.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleToggleAllergen(a.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-600 font-semibold'
                              : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prep Notes */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-2">
                    Chef Standard Operating Procedure (SOP) Notes
                  </label>
                  <textarea
                    rows="3"
                    value={editorForm.preparationNotes}
                    onChange={e => setEditorForm({ ...editorForm, preparationNotes: e.target.value })}
                    placeholder="Standard assembly instructions, cooking temperatures, garnish rules..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

              </div>

            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editorForm._id ? 'Update Recipe BOM' : 'Save & Standardize BOM'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. BOM DETAIL & COST DRIVER INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {selectedRecipe.menuItemId?.name || selectedRecipe.recipeName}
                  </h2>
                  <p className="text-xs text-stone-400">
                    Code: {selectedRecipe.menuItemId?.code || '—'} • Station: {selectedRecipe.menuItemId?.station || 'General'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3 text-center bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Menu Selling Price</span>
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100">₹{selectedRecipe.sellingPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Portion Cost (COGS)</span>
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100">₹{selectedRecipe.portionCost}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Food Cost %</span>
                  <span className={`text-lg font-bold ${
                    selectedRecipe.costStatus === 'HIGH_ALERT' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {selectedRecipe.foodCostPercentage}%
                  </span>
                </div>
              </div>

              {/* Ingredients Table */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-2">
                  Ingredient Cost Breakdown
                </h4>
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Ingredient</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Yield %</th>
                        <th className="py-2.5 px-3 text-right">Line Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {selectedRecipe.ingredients?.map((ing, i) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="py-2 px-3 font-medium text-stone-800 dark:text-stone-200">{ing.name}</td>
                          <td className="py-2 px-3 text-right text-stone-500">{ing.quantity} {ing.uom}</td>
                          <td className="py-2 px-3 text-right text-stone-500">₹{ing.unitCost}</td>
                          <td className="py-2 px-3 text-right text-stone-500">{ing.yieldFactor || 100}%</td>
                          <td className="py-2 px-3 text-right font-semibold text-stone-900 dark:text-stone-100">₹{ing.lineCost}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 dark:bg-stone-800/80 font-bold border-t border-stone-200 dark:border-stone-800">
                      <tr>
                        <td colSpan="4" className="py-2 px-3 text-stone-700 dark:text-stone-300">Total Batch Cost</td>
                        <td className="py-2 px-3 text-right text-stone-900 dark:text-stone-100">₹{selectedRecipe.totalBatchCost}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Chef Notes & Allergens */}
              {selectedRecipe.preparationNotes && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-1.5">
                    Chef Operating Procedure Notes
                  </h4>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl text-xs text-stone-700 dark:text-stone-300 border border-stone-100 dark:border-stone-800 leading-relaxed whitespace-pre-line">
                    {selectedRecipe.preparationNotes}
                  </div>
                </div>
              )}

              {selectedRecipe.allergens && selectedRecipe.allergens.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-1.5">
                    Declared Allergens
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecipe.allergens.map(a => (
                      <span key={a} className="text-xs px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-medium">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEditModal(selectedRecipe);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs"
                style={{ backgroundColor: effectivePrimary }}
              >
                <Edit3 className="w-4 h-4" />
                Edit This Recipe
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && recipeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Delete Recipe BOM?
              </h3>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-400">
              Are you sure you want to remove the standardized BOM specification for{' '}
              <strong>"{recipeToDelete.recipeName}"</strong>? This will remove all ingredient yield formulas and cost calculations for this dish.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecipe}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
