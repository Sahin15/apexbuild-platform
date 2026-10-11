import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Grid3x3, Plus, Search, Filter, Edit2, Trash2, 
  CheckCircle2, AlertTriangle, Sparkles, Clock, Users, 
  ChevronRight, X, RefreshCw, ArrowRightLeft, UtensilsCrossed, 
  Layers, Check, Eye, Coffee, Store, QrCode, Printer, 
  Download, Copy, ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function RestaurantTables() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#EA580C';
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);

  // Filter states
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Table Modal / Drawer
  const [selectedTable, setSelectedTable] = useState(null);

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // QR Standee Generator states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [qrDataUrls, setQrDataUrls] = useState({});
  const [bulkMode, setBulkMode] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  // Open QR Standee Modal
  const handleOpenQRModal = async (tbl = null) => {
    setQrTable(tbl);
    setBulkMode(!tbl);
    setIsQRModalOpen(true);
    setGeneratingQR(true);
    const targetTables = tbl ? [tbl] : tables;
    const urls = {};
    for (const t of targetTables) {
      const tableUrl = `${window.location.origin}/table-order/${t._id}`;
      try {
        urls[t._id] = await QRCode.toDataURL(tableUrl, {
          width: 320,
          margin: 1,
          color: {
            dark: '#1c1917',
            light: '#ffffff'
          }
        });
      } catch (e) {
        console.error('Failed to generate QR for table:', t._id, e);
      }
    }
    setQrDataUrls(urls);
    setGeneratingQR(false);
  };

  const handleDownloadQR = (t) => {
    const dataUrl = qrDataUrls[t._id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Table-${t.tableNumber}-QR.png`;
    a.click();
    toast.success(`Downloaded QR code for Table ${t.tableNumber}`);
  };

  const handleCopyLink = (t) => {
    const link = `${window.location.origin}/table-order/${t._id}`;
    navigator.clipboard?.writeText(link);
    toast.success(`Copied table link: ${link}`);
  };

  // Form states
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    areaId: '',
    capacity: 4,
    displayOrder: 0
  });

  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    displayOrder: 0
  });

  // Fetch tables and areas
  const loadFloorData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/restaurant/tables');
      if (res.data?.data) {
        setTables(res.data.data.tables || []);
        setAreas(res.data.data.areas || []);
      }
    } catch (err) {
      console.error('Failed to load floor tables:', err);
      toast.error('Unable to fetch floor tables & layout');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFloorData();
    // Auto polling every 15s to keep table states in sync with POS & KDS
    const interval = setInterval(() => {
      loadFloorData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadFloorData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter(t => t.status === 'OCCUPIED').length;
    const available = tables.filter(t => t.status === 'AVAILABLE').length;
    const billed = tables.filter(t => t.status === 'BILLED').length;
    const cleaning = tables.filter(t => t.status === 'CLEANING').length;
    const reserved = tables.filter(t => t.status === 'RESERVED').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, billed, cleaning, reserved, occupancyRate };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const areaId = typeof table.areaId === 'object' ? table.areaId?._id : table.areaId;
      const matchArea = selectedArea === 'ALL' || areaId === selectedArea;
      const matchStatus = statusFilter === 'ALL' || table.status === statusFilter;
      const matchQuery = (table.tableNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (table.assignedSteward || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchArea && matchStatus && matchQuery;
    });
  }, [tables, selectedArea, statusFilter, searchQuery]);

  // Available tables for transfer (excluding source table)
  const availableTargetTables = useMemo(() => {
    if (!selectedTable) return [];
    return tables.filter(t => t._id !== selectedTable._id && t.status !== 'OCCUPIED');
  }, [tables, selectedTable]);

  // Quick Table Status Toggle (e.g. Busboy marks cleaning -> available)
  const handleQuickStatusChange = async (table, newStatus, e) => {
    e?.stopPropagation();
    try {
      // Optimistic update
      setTables(prev => prev.map(t => t._id === table._id ? { ...t, status: newStatus } : t));
      if (selectedTable?._id === table._id) {
        setSelectedTable(prev => ({ ...prev, status: newStatus }));
      }

      await api.patch(`/restaurant/tables/${table._id}/status`, { status: newStatus });
      toast.success(`Table ${table.tableNumber} is now ${newStatus}`);
    } catch (err) {
      console.error('Failed to update table status:', err);
      toast.error('Failed to change table status');
      loadFloorData(true);
    }
  };

  // Open Add Table Modal
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableForm({
      tableNumber: `T-${(tables.length + 1).toString().padStart(2, '0')}`,
      areaId: areas[0]?._id || '',
      capacity: 4,
      displayOrder: tables.length
    });
    setIsTableModalOpen(true);
  };

  // Open Edit Table Modal
  const handleOpenEditTable = (table, e) => {
    e?.stopPropagation();
    setEditingTable(table);
    const aId = typeof table.areaId === 'object' ? table.areaId?._id : table.areaId;
    setTableForm({
      tableNumber: table.tableNumber || '',
      areaId: aId || '',
      capacity: table.capacity || 4,
      displayOrder: table.displayOrder || 0
    });
    setIsTableModalOpen(true);
  };

  // Save Table
  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableForm.tableNumber.trim()) {
      toast.error('Table number is required');
      return;
    }
    if (tableForm.capacity === '' || Number(tableForm.capacity) < 1) {
      toast.error('Valid seating capacity is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...tableForm,
        capacity: Number(tableForm.capacity) || 4,
        displayOrder: Number(tableForm.displayOrder) || 0
      };

      if (editingTable) {
        const res = await api.put(`/restaurant/tables/${editingTable._id}`, payload);
        const updated = res.data?.data?.table;
        setTables(prev => prev.map(t => t._id === editingTable._id ? updated : t));
        toast.success(`Table ${updated.tableNumber} updated`);
      } else {
        const res = await api.post('/restaurant/tables', payload);
        const created = res.data?.data?.table;
        setTables(prev => [...prev, created]);
        toast.success(`Table ${created.tableNumber} added to floor!`);
      }

      setIsTableModalOpen(false);
    } catch (err) {
      console.error('Failed to save table:', err);
      toast.error(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Table Transfer
  const handleTransferTable = async () => {
    if (!selectedTable || !targetTableId) {
      toast.error('Select target table for transfer');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/restaurant/tables/transfer', {
        sourceTableId: selectedTable._id,
        targetTableId
      });

      toast.success(res.data?.message || 'Order transferred successfully!');
      setIsTransferModalOpen(false);
      setSelectedTable(null);
      loadFloorData(true);
    } catch (err) {
      console.error('Failed to transfer table:', err);
      toast.error(err.response?.data?.message || 'Error transferring order');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Table
  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/restaurant/tables/${tableToDelete._id}`);
      setTables(prev => prev.filter(t => t._id !== tableToDelete._id));
      toast.success(`Table ${tableToDelete.tableNumber} removed`);
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
      if (selectedTable?._id === tableToDelete._id) setSelectedTable(null);
    } catch (err) {
      console.error('Failed to remove table:', err);
      toast.error(err.response?.data?.message || 'Failed to remove table');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Floor Area
  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name.trim()) {
      toast.error('Area name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingArea) {
        const res = await api.put(`/restaurant/areas/${editingArea._id}`, areaForm);
        const updated = res.data?.data?.area;
        setAreas(prev => prev.map(a => a._id === editingArea._id ? updated : a));
        toast.success(`Area ${updated.name} updated`);
      } else {
        const res = await api.post('/restaurant/areas', areaForm);
        const created = res.data?.data?.area;
        setAreas(prev => [...prev, created]);
        toast.success(`Dining area ${created.name} created!`);
      }
      setAreaForm({ name: '', description: '', displayOrder: 0 });
      setEditingArea(null);
    } catch (err) {
      console.error('Failed to save area:', err);
      toast.error(err.response?.data?.message || 'Failed to save area');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Floor Area
  const handleDeleteArea = async (areaId) => {
    try {
      await api.delete(`/restaurant/areas/${areaId}`);
      setAreas(prev => prev.filter(a => a._id !== areaId));
      toast.success('Dining area removed');
    } catch (err) {
      console.error('Failed to remove area:', err);
      toast.error(err.response?.data?.message || 'Cannot delete area with tables');
    }
  };

  // Helper for status styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
          label: 'Available'
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          dot: 'bg-orange-600 animate-pulse',
          label: 'Occupied'
        };
      case 'BILLED':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-600',
          label: 'Billed'
        };
      case 'CLEANING':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-600',
          label: 'Cleaning'
        };
      case 'RESERVED':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-600',
          label: 'Reserved'
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-500',
          label: status
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: effectivePrimary }}
            >
              Floor & Table Plan
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Occupancy Tracking
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Floor Plan & Table Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Monitor real-time guest seating, dining areas, table transfer, and clean turnarounds.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            onClick={() => handleOpenQRModal(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-all cursor-pointer shadow-2xs"
            title="Generate and print QR standees for dining tables"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-600" />
            QR Standees ({tables.length})
          </button>

          <button
            onClick={() => {
              setEditingArea(null);
              setAreaForm({ name: '', description: '', displayOrder: areas.length });
              setIsAreaModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Manage Areas ({areas.length})
          </button>

          <button
            onClick={handleOpenAddTable}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Operational KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tables</span>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Across {areas.length} areas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupied</span>
          <p className="text-xl font-black text-orange-600 mt-1">{stats.occupied}</p>
          <span className="text-[10px] text-orange-600 font-bold">{stats.occupancyRate}% Floor Occupancy</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{stats.available}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Ready for walk-ins</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed</span>
          <p className="text-xl font-black text-rose-600 mt-1">{stats.billed}</p>
          <span className="text-[10px] text-rose-600 font-medium">Awaiting settlement</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cleaning</span>
          <p className="text-xl font-black text-purple-600 mt-1">{stats.cleaning}</p>
          <span className="text-[10px] text-purple-600 font-medium">Turnaround</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reserved</span>
          <p className="text-xl font-black text-amber-600 mt-1">{stats.reserved}</p>
          <span className="text-[10px] text-amber-600 font-medium">Pre-booked</span>
        </div>

      </div>

      {/* Control Bar: Area Tabs + Search + Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        
        {/* Dining Area Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedArea('ALL')}
            style={selectedArea === 'ALL' ? { backgroundColor: effectivePrimary } : {}}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedArea === 'ALL'
                ? 'text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Dining Areas ({tables.length})
          </button>

          {areas.map((area) => {
            const count = tables.filter(t => {
              const aId = typeof t.areaId === 'object' ? t.areaId?._id : t.areaId;
              return aId === area._id;
            }).length;

            return (
              <button
                key={area._id}
                onClick={() => setSelectedArea(area._id)}
                style={selectedArea === area._id ? { backgroundColor: effectivePrimary } : {}}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedArea === area._id
                    ? 'text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{area.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedArea === area._id ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table number (e.g. T-04) or steward..."
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

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Status Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
              {['ALL', 'AVAILABLE', 'OCCUPIED', 'BILLED', 'CLEANING', 'RESERVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadFloorData(true)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
              title="Refresh Floor Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

          </div>

        </div>

      </div>

      {/* Main Floor Visual Grid */}
      {loading && tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Loading Floor Layout & Tables...
          </p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
          <Grid3x3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Tables Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No tables match the selected area or status filter.
          </p>
          <button
            onClick={handleOpenAddTable}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: effectivePrimary }}
          >
            <Plus className="w-4 h-4" />
            Add Table to Floor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredTables.map((table) => {
            const badge = getStatusBadge(table.status);
            const areaName = typeof table.areaId === 'object' ? table.areaId?.name : 'Main Hall';
            const isOccupied = table.status === 'OCCUPIED';

            return (
              <div
                key={table._id}
                onClick={() => setSelectedTable(table)}
                className={`bg-white rounded-2xl p-3.5 border-2 transition-all relative flex flex-col justify-between group shadow-2xs hover:shadow-md cursor-pointer ${
                  isOccupied
                    ? 'border-orange-400 bg-orange-50/10'
                    : table.status === 'AVAILABLE'
                      ? 'border-slate-200 hover:border-emerald-400'
                      : table.status === 'BILLED'
                        ? 'border-rose-400 bg-rose-50/10'
                        : table.status === 'CLEANING'
                          ? 'border-purple-300 bg-purple-50/10'
                          : 'border-amber-300 bg-amber-50/10'
                }`}
              >
                <div>
                  
                  {/* Top Bar: Table Number + Status Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {table.tableNumber}
                    </span>

                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1 ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Area & Capacity */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                    <span className="truncate max-w-[80px]">{areaName}</span>
                    <span className="flex items-center gap-0.5 font-bold text-slate-600">
                      <Users className="w-3 h-3 text-slate-400" /> {table.capacity}p
                    </span>
                  </div>

                  {/* Operational Details if Occupied / Billed */}
                  {isOccupied && table.activeOrderId ? (
                    <div className="p-2 rounded-xl bg-orange-50/80 border border-orange-100 text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-orange-950">
                        <span>{table.activeOrderId.orderNumber || 'Order'}</span>
                        <span>₹{table.activeOrderId.grandTotal || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{table.currentGuests || 2} guests</span>
                        <span className="truncate max-w-[60px]">{table.assignedSteward || 'Staff'}</span>
                      </div>
                    </div>
                  ) : table.status === 'CLEANING' ? (
                    <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-100 text-[10px] text-purple-900 font-medium text-center">
                      Needs busboy cleanup
                    </div>
                  ) : table.status === 'AVAILABLE' ? (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-400 text-center font-medium">
                      Ready for guests
                    </div>
                  ) : null}

                </div>

                {/* Table Card Bottom Actions */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  {table.status === 'CLEANING' ? (
                    <button
                      onClick={(e) => handleQuickStatusChange(table, 'AVAILABLE', e)}
                      className="w-full py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark Ready
                    </button>
                  ) : isOccupied ? (
                    <div className="w-full flex items-center justify-between gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQRModal(table);
                        }}
                        className="text-[10px] text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1 p-1 hover:bg-orange-50 rounded cursor-pointer"
                        title="View Table QR Standee"
                      >
                        <QrCode className="w-3 h-3" /> QR
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table);
                          setIsTransferModalOpen(true);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 p-1 hover:bg-slate-100 rounded cursor-pointer"
                        title="Transfer to another table"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Transfer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/restaurant/pos');
                        }}
                        className="text-[10px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 p-1 hover:bg-orange-50 rounded cursor-pointer"
                        title="Open in POS"
                      >
                        POS <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQRModal(table);
                          }}
                          className="text-slate-400 hover:text-orange-600 p-1 rounded hover:bg-orange-50 cursor-pointer"
                          title="Generate Table QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEditTable(table, e)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
                          title="Edit Table"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/restaurant/pos');
                        }}
                        className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Seat <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL / DRAWER: TABLE DETAILS & ACTIONS */}
      {selectedTable && !isTransferModalOpen && !isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">
                  {selectedTable.tableNumber}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(selectedTable.status).bg}`}>
                  {getStatusBadge(selectedTable.status).label}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTable(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              
              {/* Floor metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor Section</span>
                  <span className="font-bold text-slate-800">
                    {typeof selectedTable.areaId === 'object' ? selectedTable.areaId?.name : 'Main Dining'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                  <span className="font-bold text-slate-800">{selectedTable.capacity} Guests Max</span>
                </div>
              </div>

              {/* Active Order Details if occupied */}
              {selectedTable.activeOrderId ? (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>Order: {selectedTable.activeOrderId.orderNumber}</span>
                    <span className="text-orange-600 text-sm">₹{selectedTable.activeOrderId.grandTotal}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex justify-between">
                    <span>Status: {selectedTable.activeOrderId.status}</span>
                    <span>Steward: {selectedTable.assignedSteward || 'Staff'}</span>
                  </div>
                  {selectedTable.activeOrderId.items && selectedTable.activeOrderId.items.length > 0 && (
                    <div className="pt-2 border-t border-orange-200/60 text-[11px] text-slate-700">
                      <span className="font-bold block mb-1">Ordered Items:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {selectedTable.activeOrderId.items.map((it, idx) => (
                          <li key={idx}>{it.name} ({it.quantity}x)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-400">
                  No active orders attached to this table.
                </div>
              )}

              {/* Change Status Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Update Table State
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['AVAILABLE', 'OCCUPIED', 'BILLED', 'CLEANING', 'RESERVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleQuickStatusChange(selectedTable, st)}
                      className={`py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                        selectedTable.status === st
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setItemToDelete(null);
                  setTableToDelete(selectedTable);
                  setIsDeleteModalOpen(true);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Archive Table"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenQRModal(selectedTable)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 cursor-pointer flex items-center gap-1.5"
                  title="View / Print Table QR Standee"
                >
                  <QrCode className="w-3.5 h-3.5" /> Standee
                </button>
                {selectedTable.status === 'OCCUPIED' && (
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Table
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate('/restaurant/pos');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Open in POS
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TABLE */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingTable ? `Edit Table ${editingTable.tableNumber}` : 'Add Table to Floor'}
              </h3>
              <button 
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3.5 mt-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-14, Patio-02"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Dining Area *
                </label>
                <select
                  required
                  value={tableForm.areaId}
                  onChange={(e) => setTableForm({ ...tableForm, areaId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
                >
                  <option value="" disabled>Select Dining Area</option>
                  {areas.map(a => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
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
                  {submitting ? 'Saving...' : editingTable ? 'Update Table' : 'Add to Floor'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER TABLE */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">
                  Transfer Table {selectedTable.tableNumber}
                </h3>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Move active order <span className="font-bold text-slate-800">{selectedTable.activeOrderId?.orderNumber}</span> to a new vacant table.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Target Vacant Table *
                </label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-orange-600 cursor-pointer"
                >
                  <option value="">Select vacant target table...</option>
                  {availableTargetTables.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.tableNumber} ({typeof t.areaId === 'object' ? t.areaId?.name : 'Floor'}) — {t.capacity} Seats
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetTableId || submitting}
                onClick={handleTransferTable}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: effectivePrimary }}
              >
                {submitting ? 'Transferring...' : 'Transfer Order'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE AREAS */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Manage Dining Areas & Floor Sections
              </h3>
              <button 
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                {editingArea ? `Edit Section: ${editingArea.name}` : '+ Add Floor Section'}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Area Name (e.g. Garden Terrace)"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Optional description"
                  value={areaForm.description}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingArea && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingArea(null);
                      setAreaForm({ name: '', description: '', displayOrder: 0 });
                    }}
                    className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {editingArea ? 'Update Area' : 'Add Area'}
                </button>
              </div>
            </form>

            {/* Areas List */}
            <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
              {areas.map((a) => {
                const count = tables.filter(t => {
                  const aId = typeof t.areaId === 'object' ? t.areaId?._id : t.areaId;
                  return aId === a._id;
                }).length;

                return (
                  <div key={a._id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{a.name}</span>
                      <span className="text-[10px] text-slate-400">{count} tables assigned • {a.description || 'No notes'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingArea(a);
                          setAreaForm({ name: a.name, description: a.description || '', displayOrder: a.displayOrder || 0 });
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArea(a._id)}
                        disabled={count > 0}
                        className={`p-1 rounded-lg cursor-pointer ${
                          count > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title={count > 0 ? 'Cannot delete area with active tables' : 'Delete'}
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
                onClick={() => setIsAreaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {isDeleteModalOpen && tableToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Archive Table {tableToDelete.tableNumber}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This table will be removed from active floor seatings and POS terminal selection.
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
                {submitting ? 'Archiving...' : 'Yes, Archive Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: QR STANDEE GENERATOR & PRINT MODAL */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/10 text-orange-600 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Table QR Code & Standee Generator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Print acrylic standees or tent cards for contactless table ordering
                    </p>
                  </div>
                </div>
              </div>

              {/* Header Mode Switcher & Close */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => {
                      setBulkMode(false);
                      if (!qrTable && tables.length > 0) setQrTable(tables[0]);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      !bulkMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Preview
                  </button>
                  <button
                    onClick={() => {
                      setBulkMode(true);
                      handleOpenQRModal(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      bulkMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bulk Print ({tables.length})
                  </button>
                </div>

                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-slate-100/60">
              {generatingQR ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Generating high-res QR vectors...</p>
                </div>
              ) : !bulkMode && qrTable ? (
                <div className="max-w-md mx-auto space-y-4">
                  
                  {/* Table Switcher Selector */}
                  <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold text-slate-600 pl-2">Select Table:</span>
                    <select
                      value={qrTable._id}
                      onChange={(e) => {
                        const tbl = tables.find(t => t._id === e.target.value);
                        if (tbl) handleOpenQRModal(tbl);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                    >
                      {tables.map(t => (
                        <option key={t._id} value={t._id}>
                          Table {t.tableNumber} ({typeof t.areaId === 'object' ? t.areaId?.name : 'Main'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Acrylic Tent Standee Mockup Card */}
                  <div 
                    id="standee-print-single"
                    className="standee-print-card bg-stone-900 text-white rounded-3xl p-6 border-2 border-stone-800 shadow-2xl text-center space-y-4 relative overflow-hidden"
                  >
                    {/* Top Brand Tag */}
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-sm tracking-wider uppercase">
                        Dining Experience
                      </span>
                    </div>

                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        Scan to Order • Table Self-Service
                      </span>
                      <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight">
                        TABLE {qrTable.tableNumber}
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {typeof qrTable.areaId === 'object' ? qrTable.areaId?.name : 'Main Hall'} • Capacity {qrTable.capacity} Guests
                      </p>
                    </div>

                    {/* QR Code Graphic Frame */}
                    <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto border-4 border-stone-800">
                      {qrDataUrls[qrTable._id] ? (
                        <img
                          src={qrDataUrls[qrTable._id]}
                          alt={`QR for Table ${qrTable.tableNumber}`}
                          className="w-48 h-48 mx-auto"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                      )}
                      <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase mt-2">
                        Point Camera to Scan
                      </p>
                    </div>

                    {/* Step-by-step guest cues */}
                    <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-400 space-y-1">
                      <p className="font-semibold text-stone-300">
                        1. Scan QR • 2. Pick Dishes • 3. Kitchen Prepares
                      </p>
                      <p className="text-[10px] text-stone-500">
                        Call steward & digital bill available directly on your phone
                      </p>
                    </div>
                  </div>

                  {/* Actions for Single Standee */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleDownloadQR(qrTable)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(qrTable)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </button>

                    <a
                      href={`/table-order/${qrTable._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </a>
                  </div>

                </div>
              ) : (
                /* Bulk Standees Grid */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
                    <span>Showing standees for all {tables.length} tables on floor</span>
                    <span>Ready for print sheet</span>
                  </div>

                  <div id="standee-print-bulk" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map(t => (
                      <div 
                        key={t._id}
                        className="standee-print-card bg-stone-900 text-white rounded-2xl p-4 border border-stone-800 shadow-sm text-center space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                            Table {t.tableNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {typeof t.areaId === 'object' ? t.areaId?.name : 'Main'}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl inline-block mx-auto">
                          {qrDataUrls[t._id] ? (
                            <img
                              src={qrDataUrls[t._id]}
                              alt={`QR Table ${t.tableNumber}`}
                              className="w-32 h-32 mx-auto"
                            />
                          ) : (
                            <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1 border-t border-stone-800">
                          <span>Scan with Camera</span>
                          <span className="font-bold text-orange-400">Seats {t.capacity}p</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Standard Standee Dimensions: 4" × 6" Tent Card or Acrylic Block
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Standees</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
