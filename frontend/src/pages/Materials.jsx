import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2,
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Layers, 
  IndianRupee, 
  ClipboardList, 
  FileText, 
  X, 
  ShieldCheck, 
  Building2,
  Calendar,
  Warehouse,
  History,
  TrendingDown,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function Materials({ isProjectView = false }) {
  const { id: routeProjectId } = useParams();
  const [projectId, setProjectId] = useState(routeProjectId || '');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'grn', 'issues', 'indents', 'ledger'

  // Data collections
  const [materials, setMaterials] = useState([]);
  const [grns, setGrns] = useState([]);
  const [issues, setIssues] = useState([]);
  const [indents, setIndents] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [isPrintGRNModalOpen, setIsPrintGRNModalOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Form States
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    materialCode: '',
    category: 'Cement',
    unit: 'Bags',
    minStock: 50,
    currentStock: 0,
    unitPrice: 0,
    storageLocation: 'Central Store Yard',
    specification: ''
  });

  const [grnForm, setGRNForm] = useState({
    supplierName: '',
    challanNo: '',
    vehicleNo: '',
    poNumber: '',
    inspectionNotes: 'Passed site visual and laboratory quality inspection.',
    items: [
      { materialId: '', materialName: '', unit: 'Bags', receivedQty: 100, acceptedQty: 100, unitPrice: 385, remarks: 'Good quality' }
    ]
  });

  const [issueForm, setIssueForm] = useState({
    issuedTo: '',
    locationGrid: '',
    purpose: '',
    wbsCode: '',
    items: [
      { materialId: '', materialName: '', unit: 'Bags', issuedQty: 50, unitPrice: 0 }
    ]
  });

  const [indentForm, setIndentForm] = useState({
    requiredByDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    wbsActivity: '',
    remarks: '',
    items: [
      { materialId: '', materialName: '', unit: 'Bags', requiredQty: 200, estimatedRate: 385, purpose: 'Ongoing concrete casting' }
    ]
  });

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      const projs = res.data.data.projects || [];
      setProjects(projs);
      if (!projectId && projs.length > 0) {
        setProjectId(projs[0]._id);
      }
    } catch (error) {
      console.error('Failed to load projects', error);
    }
  };

  // Fetch All Store Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const targetProjId = projectId || routeProjectId;
      const query = targetProjId ? `?projectId=${targetProjId}` : '';

      const [matRes, grnRes, issueRes, indRes, ledRes, sumRes] = await Promise.all([
        api.get(`/materials${query}`),
        api.get(`/materials/grn${query}`),
        api.get(`/materials/issues${query}`),
        api.get(`/materials/indents${query}`),
        api.get(`/materials/ledger${query}`),
        api.get(`/materials/summary${query}`)
      ]);

      setMaterials(matRes.data.data.materials || []);
      setGrns(grnRes.data.data.grns || []);
      setIssues(issueRes.data.data.issues || []);
      setIndents(indRes.data.data.indents || []);
      setLedger(ledRes.data.data.ledger || []);
      setSummary(sumRes.data.data.summary || null);
    } catch (error) {
      toast.error('Failed to fetch store inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Handle Material Create/Edit
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      if (editingMaterialId) {
        await api.patch(`/materials/${editingMaterialId}`, materialForm);
        toast.success('Material catalog item updated');
      } else {
        await api.post('/materials', { ...materialForm, projectId: targetProjId });
        toast.success('New material added to inventory');
      }
      setIsMaterialModalOpen(false);
      setEditingMaterialId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save material');
    }
  };

  const handleEditMaterial = (mat) => {
    setEditingMaterialId(mat._id);
    setMaterialForm({
      name: mat.name,
      materialCode: mat.materialCode || '',
      category: mat.category,
      unit: mat.unit,
      minStock: mat.minStock,
      currentStock: mat.currentStock,
      unitPrice: mat.unitPrice,
      storageLocation: mat.storageLocation || 'Central Yard',
      specification: mat.specification || ''
    });
    setIsMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Are you sure you want to delete this material from catalog?')) return;
    try {
      await api.delete(`/materials/${matId}`);
      toast.success('Material removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove material');
    }
  };

  // Handle GRN Create
  const handleSaveGRN = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      if (!targetProjId) return toast.error('Please select an active project');

      await api.post('/materials/grn', {
        ...grnForm,
        projectId: targetProjId
      });
      toast.success('Goods Received Note (GRN) created & Stock incremented!');
      setIsGRNModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record GRN');
    }
  };

  // Handle Store Issue Create
  const handleSaveIssue = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      if (!targetProjId) return toast.error('Please select an active project');

      await api.post('/materials/issues', {
        ...issueForm,
        projectId: targetProjId
      });
      toast.success('Store Issue voucher recorded & Stock consumed!');
      setIsIssueModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue material');
    }
  };

  // Handle Indent Create
  const handleSaveIndent = async (e) => {
    e.preventDefault();
    try {
      const targetProjId = projectId || routeProjectId;
      if (!targetProjId) return toast.error('Please select an active project');

      await api.post('/materials/indents', {
        ...indentForm,
        projectId: targetProjId
      });
      toast.success('Site Material Indent submitted for approval!');
      setIsIndentModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit indent');
    }
  };

  // Approve Indent
  const handleApproveIndent = async (indentId) => {
    try {
      await api.patch(`/materials/indents/${indentId}/approve`);
      toast.success('Material Indent approved for PO generation');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve indent');
    }
  };

  const activeProjectObj = projects.find(p => p._id === projectId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5" /> Site Store & Materials ERP
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> CPWD Form 30 GRN Compliant
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Materials, Procurement & Store Inventory</h1>
          <p className="text-slate-300 text-sm mt-1">
            Gate Inward GRN, Store Issue Slips, Requisition Indents, and Real-Time Bin Cards.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          {projects.length > 0 && !routeProjectId && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-[240px] truncate"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setEditingMaterialId(null);
                setMaterialForm({
                  name: '',
                  materialCode: '',
                  category: 'Cement',
                  unit: 'Bags',
                  minStock: 50,
                  currentStock: 0,
                  unitPrice: 0,
                  storageLocation: 'Central Store Yard',
                  specification: ''
                });
                setIsMaterialModalOpen(true);
              }}
              className="btn bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0" /> <span>New SKU</span>
            </button>

            <button
              onClick={() => {
                const firstMat = materials[0];
                setGRNForm({
                  supplierName: '',
                  challanNo: '',
                  vehicleNo: '',
                  poNumber: '',
                  inspectionNotes: 'Passed site visual and laboratory quality inspection.',
                  items: [
                    {
                      materialId: firstMat?._id || '',
                      materialName: firstMat?.name || '',
                      unit: firstMat?.unit || 'Bags',
                      receivedQty: 100,
                      acceptedQty: 100,
                      unitPrice: firstMat?.unitPrice || 0,
                      remarks: 'Good condition'
                    }
                  ]
                });
                setIsGRNModalOpen(true);
              }}
              className="btn bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
            >
              <Truck className="w-4 h-4 flex-shrink-0" /> <span>Log GRN</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Store Asset Value</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ₹{(summary?.totalValuation || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Across {summary?.totalSKUs || materials.length} Active Material SKUs
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-3 rounded-xl border ${
            (summary?.lowStockCount || 0) > 0 
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Reorders</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.lowStockCount || 0} <span className="text-xs font-medium text-slate-500">Items Under Min Buffer</span>
            </h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">
              Requires Requisition Indent
            </p>
          </div>
        </div>

        {/* Gate Deliveries GRN */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total GRN Inward Notes</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.grnCount || grns.length} <span className="text-xs font-medium text-slate-500">Delivery Notes</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Verified by Site Storekeeper
            </p>
          </div>
        </div>

        {/* Store Issues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Store Issue Slips</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.issueCount || issues.length} <span className="text-xs font-medium text-slate-500">Consumption Slips</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              {summary?.pendingIndents || 0} Indents Pending Approval
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto gap-4">
          <div className="flex items-center gap-1 py-2 flex-shrink-0">
            {[
              { id: 'inventory', label: 'Store Stock & Bin Cards', icon: Warehouse, count: materials.length },
              { id: 'grn', label: 'Goods Received (GRN)', icon: Truck, count: grns.length },
              { id: 'issues', label: 'Store Issue Slips (Consumption)', icon: ArrowUpFromLine, count: issues.length },
              { id: 'indents', label: 'Site Indents (Requisitions)', icon: FileText, count: indents.length },
              { id: 'ledger', label: 'Complete Stock Ledger', icon: History, count: ledger.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 py-2 flex-shrink-0 ml-auto">
            {activeTab === 'issues' && (
              <button
                onClick={() => {
                  const firstMat = materials[0];
                  setIssueForm({
                    issuedTo: '',
                    locationGrid: '',
                    purpose: '',
                    wbsCode: '',
                    items: [
                      {
                        materialId: firstMat?._id || '',
                        materialName: firstMat?.name || '',
                        unit: firstMat?.unit || 'Bags',
                        issuedQty: 25,
                        unitPrice: firstMat?.unitPrice || 0
                      }
                    ]
                  });
                  setIsIssueModalOpen(true);
                }}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
                <span>Issue Voucher</span>
              </button>
            )}

            {activeTab === 'indents' && (
              <button
                onClick={() => {
                  const firstMat = materials[0];
                  setIndentForm({
                    requiredByDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
                    priority: 'MEDIUM',
                    wbsActivity: '',
                    remarks: '',
                    items: [
                      {
                        materialId: firstMat?._id || '',
                        materialName: firstMat?.name || '',
                        unit: firstMat?.unit || 'Bags',
                        requiredQty: 100,
                        estimatedRate: firstMat?.unitPrice || 0,
                        purpose: 'Site work'
                      }
                    ]
                  });
                  setIsIndentModalOpen(true);
                }}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
                <span>Raise Indent</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: STORE INVENTORY & BIN CARDS */}
        {activeTab === 'inventory' && (
          <div className="p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by material code, name, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['ALL', 'Cement', 'Steel', 'Aggregates', 'Chemicals', 'Masonry', 'Formwork'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">SKU Code</th>
                    <th className="p-3">Material Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Yard Storage Location</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Min Buffer</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Valuation</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials
                    .filter(m => {
                      if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        (m.name && m.name.toLowerCase().includes(term)) ||
                        (m.materialCode && m.materialCode.toLowerCase().includes(term)) ||
                        (m.storageLocation && m.storageLocation.toLowerCase().includes(term))
                      );
                    })
                    .map((mat) => {
                      const isLowStock = mat.currentStock <= mat.minStock;
                      const totalVal = (mat.currentStock || 0) * (mat.unitPrice || 0);

                      return (
                        <tr key={mat._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {mat.materialCode || 'MAT'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {mat.name}
                            {mat.specification && (
                              <p className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{mat.specification}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {mat.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">
                            {mat.storageLocation || 'Central Yard'}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 text-sm">
                            {mat.currentStock} <span className="text-xs text-slate-500 font-normal">{mat.unit}</span>
                          </td>
                          <td className="p-3 text-right text-slate-500 font-medium">
                            {mat.minStock} {mat.unit}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            ₹{mat.unitPrice?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold text-indigo-700">
                            ₹{totalVal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200">
                                <AlertTriangle className="w-3 h-3 text-red-600" /> Reorder Now
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditMaterial(mat)}
                                title="Edit Material"
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat._id)}
                                title="Delete SKU"
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
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

        {/* TAB 2: GOODS RECEIVED NOTES (GRN) */}
        {activeTab === 'grn' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">GRN Reference</th>
                    <th className="p-3">Date Received</th>
                    <th className="p-3">Supplier / Mill</th>
                    <th className="p-3">Challan & Truck No</th>
                    <th className="p-3">Items Received</th>
                    <th className="p-3 text-right">Total GRN Value</th>
                    <th className="p-3 text-center">QA/QC Inspection</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No Goods Received Notes recorded yet.
                      </td>
                    </tr>
                  ) : (
                    grns.map(grn => (
                      <tr key={grn._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-800 bg-emerald-50/50">
                          {grn.grnNo}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {new Date(grn.receivedDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {grn.supplierName}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {grn.challanNo}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1">({grn.vehicleNo || 'Direct'})</span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800">
                            {grn.items?.[0]?.materialName}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">
                            ({grn.items?.[0]?.acceptedQty} {grn.items?.[0]?.unit})
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-indigo-700">
                          ₹{grn.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Inspection Certified
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedGRN(grn);
                              setIsPrintGRNModalOpen(true);
                            }}
                            className="btn bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-1 rounded flex items-center gap-1 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" /> CPWD Form 30
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STORE ISSUE SLIPS (CONSUMPTION) */}
        {activeTab === 'issues' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Issue Slip No</th>
                    <th className="p-3">Date Issued</th>
                    <th className="p-3">Issued To (Gang/Contractor)</th>
                    <th className="p-3">Execution Grid & Purpose</th>
                    <th className="p-3">Material Consumed</th>
                    <th className="p-3 text-right">Issued Cost</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No Store Issue Slips recorded yet.
                      </td>
                    </tr>
                  ) : (
                    issues.map(iss => (
                      <tr key={iss._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-800 bg-amber-50/50">
                          {iss.issueSlipNo}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {new Date(iss.issueDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {iss.issuedTo}
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-slate-800">{iss.locationGrid}</p>
                          <p className="text-[10px] text-slate-400">{iss.purpose}</p>
                        </td>
                        <td className="p-3">
                          {iss.items?.map((it, idx) => (
                            <span key={idx} className="block font-medium text-slate-700">
                              {it.materialName}: <strong className="text-slate-900">{it.issuedQty} {it.unit}</strong>
                            </span>
                          ))}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹{iss.totalCost?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200">
                            {iss.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SITE MATERIAL INDENTS (REQUISITIONS) */}
        {activeTab === 'indents' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Indent Ref No</th>
                    <th className="p-3">Requested On</th>
                    <th className="p-3">Required By</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Material & Required Qty</th>
                    <th className="p-3 text-right">Est. Budget</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No Site Indents recorded yet.
                      </td>
                    </tr>
                  ) : (
                    indents.map(ind => (
                      <tr key={ind._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/50">
                          {ind.indentNo}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {new Date(ind.requestDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {new Date(ind.requiredByDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ind.priority === 'URGENT' ? 'bg-red-100 text-red-800 border border-red-200' :
                            ind.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ind.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800">
                            {ind.items?.[0]?.materialName}
                          </span>
                          <span className="text-slate-500 ml-1">
                            ({ind.items?.[0]?.requiredQty} {ind.items?.[0]?.unit})
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-indigo-700">
                          ₹{ind.totalEstimatedCost?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ind.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {ind.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ind.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproveIndent(ind._id)}
                              className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded shadow-sm"
                            >
                              Approve Indent
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STOCK LEDGER & BIN AUDIT TRAIL */}
        {activeTab === 'ledger' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Material SKU</th>
                    <th className="p-3">Movement Type</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">Voucher Reference</th>
                    <th className="p-3">Audit Details / Notes</th>
                    <th className="p-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No ledger movements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.map(entry => {
                      const isReceipt = entry.type === 'RECEIPT';
                      return (
                        <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(entry.createdAt).toLocaleDateString('en-GB')} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {entry.materialId?.name || 'Material Item'}
                            <span className="text-[10px] text-slate-400 block font-mono">{entry.materialId?.materialCode}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isReceipt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isReceipt ? <ArrowDownToLine className="w-3 h-3 text-emerald-600" /> : <ArrowUpFromLine className="w-3 h-3 text-amber-600" />}
                              {entry.type}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-bold text-sm ${isReceipt ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isReceipt ? `+${entry.quantity}` : `${entry.quantity}`} {entry.materialId?.unit}
                          </td>
                          <td className="p-3 font-mono text-indigo-700 font-medium">
                            {entry.referenceId || '-'}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">
                            {entry.notes || '-'}
                          </td>
                          <td className="p-3 text-slate-500">
                            {entry.createdBy?.name || 'Storekeeper'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MATERIAL SKU MODAL */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingMaterialId ? 'Edit Material SKU' : 'Add New Material to Inventory'}
              </h3>
              <button onClick={() => setIsMaterialModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Material Name *</label>
                  <input
                    type="text"
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                    required
                    placeholder="e.g. UltraTech OPC 53 Cement"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option>Cement</option>
                    <option>Steel</option>
                    <option>Aggregates</option>
                    <option>Chemicals</option>
                    <option>Masonry</option>
                    <option>Formwork</option>
                    <option>Plumbing</option>
                    <option>Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure (UOM) *</label>
                  <select
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option>Bags</option>
                    <option>MT</option>
                    <option>Tonnes</option>
                    <option>cum</option>
                    <option>sqm</option>
                    <option>Liters</option>
                    <option>Nos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    value={materialForm.unitPrice}
                    onChange={(e) => setMaterialForm({ ...materialForm, unitPrice: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Buffer Stock *</label>
                  <input
                    type="number"
                    value={materialForm.minStock}
                    onChange={(e) => setMaterialForm({ ...materialForm, minStock: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {!editingMaterialId && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Opening Stock</label>
                    <input
                      type="number"
                      value={materialForm.currentStock}
                      onChange={(e) => setMaterialForm({ ...materialForm, currentStock: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}

                <div className={editingMaterialId ? 'col-span-2' : ''}>
                  <label className="block font-bold text-slate-700 mb-1">Yard Storage Location</label>
                  <input
                    type="text"
                    value={materialForm.storageLocation}
                    onChange={(e) => setMaterialForm({ ...materialForm, storageLocation: e.target.value })}
                    placeholder="e.g. Central Yard Shed A"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Technical Specification (IS / ASTM)</label>
                  <input
                    type="text"
                    value={materialForm.specification}
                    onChange={(e) => setMaterialForm({ ...materialForm, specification: e.target.value })}
                    placeholder="e.g. IS 269:2015 High Strength"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GOODS RECEIVED NOTE (GRN) MODAL */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" /> Log Goods Received Note (GRN)
                </h3>
                <p className="text-xs text-slate-300">Gate delivery receipt & inventory auto-increment</p>
              </div>
              <button onClick={() => setIsGRNModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGRN} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Mill Name *</label>
                  <input
                    type="text"
                    value={grnForm.supplierName}
                    onChange={(e) => setGRNForm({ ...grnForm, supplierName: e.target.value })}
                    required
                    placeholder="e.g. UltraTech Cement Corp"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Challan No *</label>
                  <input
                    type="text"
                    value={grnForm.challanNo}
                    onChange={(e) => setGRNForm({ ...grnForm, challanNo: e.target.value })}
                    required
                    placeholder="CH-88215"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Truck No</label>
                  <input
                    type="text"
                    value={grnForm.vehicleNo}
                    onChange={(e) => setGRNForm({ ...grnForm, vehicleNo: e.target.value })}
                    placeholder="DL-1L-AA-3041"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Order (PO) Ref</label>
                  <input
                    type="text"
                    value={grnForm.poNumber}
                    onChange={(e) => setGRNForm({ ...grnForm, poNumber: e.target.value })}
                    placeholder="PO-2026-0044"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Line Item */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-700">Inward Material Line Item</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Select Material SKU *</label>
                    <select
                      value={grnForm.items[0].materialId}
                      onChange={(e) => {
                        const m = materials.find(x => x._id === e.target.value);
                        setGRNForm({
                          ...grnForm,
                          items: [
                            {
                              ...grnForm.items[0],
                              materialId: m?._id || '',
                              materialName: m?.name || '',
                              unit: m?.unit || 'Bags',
                              unitPrice: m?.unitPrice || 0
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Choose Material --</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.materialCode}) - Current: {m.currentStock} {m.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Quantity Received *</label>
                    <input
                      type="number"
                      step="any"
                      value={grnForm.items[0].acceptedQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGRNForm({
                          ...grnForm,
                          items: [
                            {
                              ...grnForm.items[0],
                              receivedQty: val,
                              acceptedQty: val
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">QA/QC Inspection Remarks</label>
                <input
                  type="text"
                  value={grnForm.inspectionNotes}
                  onChange={(e) => setGRNForm({ ...grnForm, inspectionNotes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" /> Record GRN & Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STORE ISSUE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ArrowUpFromLine className="w-5 h-5 text-amber-400" /> New Store Issue Voucher
                </h3>
                <p className="text-xs text-slate-300">Authorize site consumption & deduct physical inventory</p>
              </div>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIssue} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issued To (Foreman / Gang) *</label>
                  <input
                    type="text"
                    value={issueForm.issuedTo}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedTo: e.target.value })}
                    required
                    placeholder="e.g. Apex Civil Gang A"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Location / Grid *</label>
                  <input
                    type="text"
                    value={issueForm.locationGrid}
                    onChange={(e) => setIssueForm({ ...issueForm, locationGrid: e.target.value })}
                    required
                    placeholder="e.g. Raft Foundation Grid B2-E5"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Purpose / Operation Description *</label>
                  <input
                    type="text"
                    value={issueForm.purpose}
                    onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                    required
                    placeholder="e.g. Concrete blinding layer pour & leveling"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-700">Material to Issue</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Material SKU *</label>
                    <select
                      value={issueForm.items[0].materialId}
                      onChange={(e) => {
                        const m = materials.find(x => x._id === e.target.value);
                        setIssueForm({
                          ...issueForm,
                          items: [
                            {
                              ...issueForm.items[0],
                              materialId: m?._id || '',
                              materialName: m?.name || '',
                              unit: m?.unit || 'Bags',
                              unitPrice: m?.unitPrice || 0
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Choose Stock Item --</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} - Available: {m.currentStock} {m.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Quantity to Issue *</label>
                    <input
                      type="number"
                      step="any"
                      value={issueForm.items[0].issuedQty}
                      onChange={(e) => {
                        setIssueForm({
                          ...issueForm,
                          items: [
                            {
                              ...issueForm.items[0],
                              issuedQty: Number(e.target.value)
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1 shadow"
                >
                  <ArrowUpFromLine className="w-4 h-4" /> Issue from Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MATERIAL INDENT MODAL */}
      {isIndentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" /> Raise Site Material Indent (Requisition)
                </h3>
                <p className="text-xs text-slate-300">Request purchase order generation for project works</p>
              </div>
              <button onClick={() => setIsIndentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required By Date *</label>
                  <input
                    type="date"
                    value={indentForm.requiredByDate}
                    onChange={(e) => setIndentForm({ ...indentForm, requiredByDate: e.target.value })}
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={indentForm.priority}
                    onChange={(e) => setIndentForm({ ...indentForm, priority: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Buffer Breached)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">WBS / Milestone Linked</label>
                  <input
                    type="text"
                    value={indentForm.wbsActivity}
                    onChange={(e) => setIndentForm({ ...indentForm, wbsActivity: e.target.value })}
                    placeholder="e.g. 1.5 Raft Concrete Pour M30"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-700">Requested Material</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Material SKU *</label>
                    <select
                      value={indentForm.items[0].materialId}
                      onChange={(e) => {
                        const m = materials.find(x => x._id === e.target.value);
                        setIndentForm({
                          ...indentForm,
                          items: [
                            {
                              ...indentForm.items[0],
                              materialId: m?._id || '',
                              materialName: m?.name || '',
                              unit: m?.unit || 'Bags',
                              estimatedRate: m?.unitPrice || 0
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Choose Material --</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} (Stock: {m.currentStock} {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Required Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      value={indentForm.items[0].requiredQty}
                      onChange={(e) => {
                        setIndentForm({
                          ...indentForm,
                          items: [
                            {
                              ...indentForm.items[0],
                              requiredQty: Number(e.target.value)
                            }
                          ]
                        });
                      }}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIndentModalOpen(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1 shadow"
                >
                  <FileText className="w-4 h-4" /> Submit Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE GRN MODAL (CPWD FORM 30) */}
      {isPrintGRNModalOpen && selectedGRN && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col border border-slate-300">
            {/* Top Bar (Hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">CPWD Form 30 - Goods Received Note (GRN)</h3>
                  <p className="text-xs text-slate-300">Official Material Inward Gate Pass & Quality Inspection Voucher</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Print GRN Voucher
                </button>
                <button
                  onClick={() => setIsPrintGRNModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 text-xs">
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">CENTRAL PUBLIC WORKS DEPARTMENT / FIDIC</span>
                    <h1 className="text-lg font-extrabold tracking-tight text-slate-900">FORM NO. 30 - GOODS RECEIVED NOTE (GRN)</h1>
                    <p className="text-xs text-slate-600">Material Inward Gate Pass & Quality Acceptance Record</p>
                  </div>
                  <div className="border border-slate-900 px-3 py-1 bg-slate-50 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">GRN Reference:</span>
                    <span className="font-mono text-sm font-extrabold text-slate-900">{selectedGRN.grnNo}</span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-4 border border-slate-900 text-left text-xs mt-3">
                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Project:</div>
                  <div className="p-2 border-r border-b border-slate-900 font-semibold">{selectedGRN.projectId?.name || activeProjectObj?.name}</div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Date Received:</div>
                  <div className="p-2 border-b border-slate-900 font-semibold">{new Date(selectedGRN.receivedDate).toLocaleDateString('en-GB')}</div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Supplier / Vendor:</div>
                  <div className="p-2 border-r border-b border-slate-900 font-semibold">{selectedGRN.supplierName}</div>

                  <div className="p-2 border-r border-b border-slate-900 bg-slate-50 font-bold">Delivery Challan:</div>
                  <div className="p-2 border-b border-slate-900 font-mono font-bold">{selectedGRN.challanNo}</div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Vehicle Truck No:</div>
                  <div className="p-2 border-r border-slate-900 font-mono font-medium">{selectedGRN.vehicleNo || 'Direct Delivery'}</div>

                  <div className="p-2 border-r border-slate-900 bg-slate-50 font-bold">Purchase Order Ref:</div>
                  <div className="p-2 font-mono">{selectedGRN.poNumber || 'PO-SCHEDULED'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-200 px-2 py-1 text-slate-900 border border-slate-900 mb-1">
                  ACCEPTED MATERIALS INVENTORY BREAKDOWN
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead className="bg-slate-100 font-bold text-center">
                    <tr>
                      <th className="border border-slate-900 p-1.5 w-10">Sl.</th>
                      <th className="border border-slate-900 p-1.5 text-left">Material Description</th>
                      <th className="border border-slate-900 p-1.5 w-20">Unit</th>
                      <th className="border border-slate-900 p-1.5 w-24">Recv Qty</th>
                      <th className="border border-slate-900 p-1.5 w-24">Accepted</th>
                      <th className="border border-slate-900 p-1.5 w-24">Unit Rate</th>
                      <th className="border border-slate-900 p-1.5 w-32 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedGRN.items || []).map((it, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-slate-900 p-2">{idx + 1}</td>
                        <td className="border border-slate-900 p-2 text-left font-semibold">{it.materialName}</td>
                        <td className="border border-slate-900 p-2">{it.unit}</td>
                        <td className="border border-slate-900 p-2">{it.receivedQty}</td>
                        <td className="border border-slate-900 p-2 font-bold text-emerald-800">{it.acceptedQty}</td>
                        <td className="border border-slate-900 p-2">₹{it.unitPrice?.toLocaleString('en-IN')}</td>
                        <td className="border border-slate-900 p-2 text-right font-bold">₹{it.totalAmount?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-extrabold">
                      <td colSpan={6} className="border border-slate-900 p-2 text-right uppercase">TOTAL INWARD INVOICE VALUE:</td>
                      <td className="border border-slate-900 p-2 text-right text-indigo-900 text-sm">
                        ₹{selectedGRN.totalAmount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Quality Certification */}
              <div className="border border-slate-900 p-3 mb-6 space-y-1">
                <span className="font-extrabold uppercase block text-slate-800">QA/QC INSPECTION & ACCEPTANCE CERTIFICATION:</span>
                <p className="text-slate-700">
                  {selectedGRN.inspectionNotes || 'Materials inspected at gate. No transit damage or packaging breach observed. Mill test certificates verified.'}
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 border border-slate-900 text-center text-xs">
                <div className="border-r border-slate-900 p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">DELIVERED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {selectedGRN.driverName || 'Truck Driver / Transporter'}
                  </div>
                </div>

                <div className="border-r border-slate-900 p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">RECEIVED AT SITE STORE:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    Site Storekeeper In-Charge
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between h-24">
                  <div className="font-bold text-slate-600">CERTIFIED & VERIFIED BY:</div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    Resident Site Engineer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
