import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Ruler, Search, Filter, Plus, Edit2, Trash2, CheckCircle2, 
  XCircle, AlertTriangle, Printer, Eye, Building, BookOpen, 
  Layers, ArrowUpRight, FileText, Check, ChevronRight, X
} from 'lucide-react';

export default function Measurements({ isProjectView }) {
  const { id: routeProjectId } = useParams();
  
  // Data state
  const [measurements, setMeasurements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMeasurementId, setEditMeasurementId] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [selectedBoqItem, setSelectedBoqItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Preview Modal
  const [printMeasurement, setPrintMeasurement] = useState(null);

  // Verify / Reject Modal
  const [verifyModal, setVerifyModal] = useState({ open: false, item: null, action: 'VERIFY', reason: '' });

  // Form Data state for detailed MB
  const [formData, setFormData] = useState({
    projectId: routeProjectId || '',
    boqItemId: '',
    bookNo: 'MB-01',
    pageNo: '01',
    mbRef: 'MB-01/P-01',
    location: '',
    date: new Date().toISOString().split('T')[0],
    isDirectQty: false,
    directQty: '',
    items: [
      { description: 'Main structural section', nos: 1, length: '', breadth: '', depth: '', isDeduction: false, subTotal: 0 }
    ],
    remarks: ''
  });

  // Calculate live total quantity from sub-measurements
  const calculatedLiveQty = useMemo(() => {
    if (formData.isDirectQty) {
      return Number(formData.directQty) || 0;
    }
    const sum = formData.items.reduce((acc, row) => {
      const nos = Number(row.nos) || 1;
      const l = row.length !== '' && row.length !== undefined ? Number(row.length) : 1;
      const b = row.breadth !== '' && row.breadth !== undefined ? Number(row.breadth) : 1;
      const d = row.depth !== '' && row.depth !== undefined ? Number(row.depth) : 1;
      const sub = (row.isDeduction ? -1 : 1) * Math.abs(nos * l * b * d);
      return acc + sub;
    }, 0);
    return Number(sum.toFixed(3));
  }, [formData.items, formData.isDirectQty, formData.directQty]);

  // Fetch Measurements & Summary
  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const projId = isProjectView ? routeProjectId : selectedProjectId;
      let endpoint = '/billing/measurements';
      const params = [];
      if (projId) params.push(`projectId=${projId}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await api.get(endpoint);
      setMeasurements(res.data.data.measurements || []);

      // Fetch summary
      const sumEndpoint = projId ? `/billing/measurements/summary?projectId=${projId}` : '/billing/measurements/summary';
      const sumRes = await api.get(sumEndpoint);
      setSummary(sumRes.data.data || null);
    } catch (error) {
      toast.error('Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!isProjectView) {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data.projects || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  };

  useEffect(() => {
    fetchMeasurements();
    fetchProjects();
  }, [selectedProjectId, statusFilter, routeProjectId, isProjectView]);

  // Load BOQ items when project changes in modal
  const handleProjectSelect = async (projectId) => {
    setFormData(prev => ({ ...prev, projectId, boqItemId: '' }));
    setSelectedBoqItem(null);
    if (!projectId) {
      setBoqItems([]);
      return;
    }
    try {
      const res = await api.get(`/projects/${projectId}/boq`);
      setBoqItems(res.data.data.items || []);
    } catch (error) {
      toast.error('Failed to load BOQ items for this project');
    }
  };

  // When BOQ item is picked in modal
  const handleBoqItemSelect = (itemId) => {
    const item = boqItems.find(b => b._id === itemId);
    setSelectedBoqItem(item || null);
    setFormData(prev => ({ ...prev, boqItemId: itemId }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultProjId = isProjectView ? routeProjectId : (selectedProjectId || (projects[0]?._id || ''));
    setEditMeasurementId(null);
    setSelectedBoqItem(null);
    setFormData({
      projectId: defaultProjId,
      boqItemId: '',
      bookNo: 'MB-01',
      pageNo: String(measurements.length + 1).padStart(2, '0'),
      mbRef: `MB-01/P-${String(measurements.length + 1).padStart(2, '0')}`,
      location: '',
      date: new Date().toISOString().split('T')[0],
      isDirectQty: false,
      directQty: '',
      items: [
        { description: 'Work item execution segment #1', nos: 1, length: '', breadth: '', depth: '', isDeduction: false, subTotal: 0 }
      ],
      remarks: ''
    });
    if (defaultProjId) {
      handleProjectSelect(defaultProjId);
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEditClick = async (m) => {
    setEditMeasurementId(m._id);
    const pId = m.projectId?._id || m.projectId;
    
    // Fetch BOQ items first
    let currentItem = m.boqItemId;
    if (pId) {
      try {
        const res = await api.get(`/projects/${pId}/boq`);
        setBoqItems(res.data.data.items || []);
        if (m.boqItemId?._id) {
          currentItem = res.data.data.items.find(b => b._id === m.boqItemId._id) || m.boqItemId;
        }
      } catch (err) {
        console.error(err);
      }
    }
    setSelectedBoqItem(currentItem);

    const hasItems = Array.isArray(m.items) && m.items.length > 0;
    setFormData({
      projectId: pId,
      boqItemId: m.boqItemId?._id || m.boqItemId || '',
      bookNo: m.bookNo || 'MB-01',
      pageNo: m.pageNo || '01',
      mbRef: m.mbRef || '',
      location: m.location || '',
      date: new Date(m.date).toISOString().split('T')[0],
      isDirectQty: !hasItems,
      directQty: m.quantity || '',
      items: hasItems ? m.items.map(it => ({
        description: it.description || '',
        nos: it.nos || 1,
        length: it.length || '',
        breadth: it.breadth || '',
        depth: it.depth || '',
        isDeduction: Boolean(it.isDeduction),
        subTotal: it.subTotal || 0
      })) : [
        { description: 'Work segment', nos: 1, length: '', breadth: '', depth: '', isDeduction: false, subTotal: 0 }
      ],
      remarks: m.remarks || ''
    });

    setIsModalOpen(true);
  };

  // Sub-measurement row updates
  const handleItemRowChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate row subtotal
      const nos = Number(updated[index].nos) || 1;
      const l = updated[index].length !== '' && updated[index].length !== undefined ? Number(updated[index].length) : 1;
      const b = updated[index].breadth !== '' && updated[index].breadth !== undefined ? Number(updated[index].breadth) : 1;
      const d = updated[index].depth !== '' && updated[index].depth !== undefined ? Number(updated[index].depth) : 1;
      const sub = (updated[index].isDeduction ? -1 : 1) * Math.abs(Number((nos * l * b * d).toFixed(3)));
      updated[index].subTotal = sub;

      return { ...prev, items: updated };
    });
  };

  const addDimensionRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: `Dimension line #${prev.items.length + 1}`, nos: 1, length: '', breadth: '', depth: '', isDeduction: false, subTotal: 0 }
      ]
    }));
  };

  const removeDimensionRow = (index) => {
    if (formData.items.length <= 1) {
      toast.error('At least one dimension line is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Save / Update Measurement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!formData.boqItemId) {
      toast.error('Please select a BOQ item');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        projectId: formData.projectId,
        boqItemId: formData.boqItemId,
        bookNo: formData.bookNo,
        pageNo: formData.pageNo,
        mbRef: formData.mbRef || `${formData.bookNo}/P-${formData.pageNo}`,
        location: formData.location || 'General Site',
        date: formData.date,
        remarks: formData.remarks,
        quantity: calculatedLiveQty,
        items: formData.isDirectQty ? [] : formData.items
      };

      if (editMeasurementId) {
        await api.put(`/billing/measurements/${editMeasurementId}`, payload);
        toast.success('Measurement Book entry updated successfully!');
      } else {
        await api.post('/billing/measurements', payload);
        toast.success('Measurement Book entry recorded successfully!');
      }

      setIsModalOpen(false);
      setEditMeasurementId(null);
      fetchMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save measurement record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Measurement
  const handleDelete = async (id, mbRef) => {
    if (!window.confirm(`Are you sure you want to delete Measurement Book entry "${mbRef}"?`)) return;
    try {
      await api.delete(`/billing/measurements/${id}`);
      toast.success('Measurement entry deleted');
      fetchMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete measurement');
    }
  };

  // Perform Status Change / Verify / Reject
  const handleVerifySubmit = async () => {
    if (!verifyModal.item) return;
    try {
      await api.patch(`/billing/measurements/${verifyModal.item._id}/status`, {
        status: verifyModal.action,
        rejectionReason: verifyModal.reason
      });
      toast.success(verifyModal.action === 'VERIFIED' ? 'Measurement approved & verified!' : 'Measurement marked as rejected');
      setVerifyModal({ open: false, item: null, action: 'VERIFY', reason: '' });
      fetchMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update measurement status');
    }
  };

  // Filtered list by text search
  const filteredMeasurements = useMemo(() => {
    if (!searchQuery.trim()) return measurements;
    const q = searchQuery.toLowerCase();
    return measurements.filter(m => 
      m.mbRef?.toLowerCase().includes(q) ||
      m.boqItemId?.itemCode?.toLowerCase().includes(q) ||
      m.boqItemId?.description?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.projectId?.name?.toLowerCase().includes(q)
    );
  }, [measurements, searchQuery]);

  return (
    <div className={isProjectView ? "space-y-5" : "space-y-6"}>
      {/* Header */}
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                Digital Measurement Book (MB)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CPWD / FIDIC Compliant
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary-600" />
              Site Measurements & MB Abstract
            </h1>
            <p className="text-slate-500 text-sm">
              Record precision L×B×D field measurements, compute progressive cumulative quantities, and certify work for Running Account (RA) Billing.
            </p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="btn btn-primary text-sm flex items-center gap-2 shadow-lg shadow-primary-600/20 px-4 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            New MB Entry
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Total MB Records</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalEntries}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Recorded measurements</div>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-sm">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Awaiting Verification
            </span>
            <div className="text-2xl font-bold text-amber-900 mt-1">{summary.pendingCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Needs site engineer sign-off</div>
          </div>
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 shadow-sm">
            <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Verified & Approved
            </span>
            <div className="text-2xl font-bold text-blue-900 mt-1">{summary.verifiedCount}</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Ready for RA Billing</div>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Certified Value
            </span>
            <div className="text-2xl font-bold text-emerald-900 mt-1">₹{summary.totalVerifiedVal.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Verified work done</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Billed in Invoices</span>
            <div className="text-2xl font-bold text-slate-700 mt-1">{summary.billedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Linked to RA Bills</div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search MB Ref, Item Code, Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm pl-9 bg-white text-xs w-full rounded-lg"
              />
            </div>

            {/* Project Filter (if not project view) */}
            {!isProjectView && (
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="input input-sm text-xs bg-white rounded-lg py-1 px-2.5 font-medium text-slate-700"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Tabs */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-medium text-slate-600">
              {['ALL', 'PENDING', 'VERIFIED', 'BILLED', 'DRAFT'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>

            {isProjectView && (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New MB
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">MB Ref & Page</th>
                <th className="px-5 py-3.5">Date & Project</th>
                <th className="px-5 py-3.5">Work Item Description</th>
                <th className="px-5 py-3.5">Location / Grid</th>
                <th className="px-5 py-3.5 text-right">Measured Qty</th>
                <th className="px-5 py-3.5">Tender vs Cumulative</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeasurements.length > 0 ? (
                filteredMeasurements.map((m) => {
                  const boq = m.boqItemId;
                  const tenderQty = boq?.quantity || 0;
                  const completedQty = boq?.completedQuantity || 0;
                  const pct = tenderQty > 0 ? Math.min(100, Math.round((completedQty / tenderQty) * 100)) : 0;
                  const isOver = completedQty > tenderQty;

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* MB Ref */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                          {m.mbRef}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Book: {m.bookNo || 'MB-01'} | Page: {m.pageNo || '01'}
                        </div>
                      </td>

                      {/* Date & Project */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">
                          {new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[160px] truncate" title={m.projectId?.name}>
                          {m.projectId?.name || 'Project'}
                        </div>
                      </td>

                      {/* Work Item */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-mono font-bold text-slate-700">
                            {boq?.itemCode || 'BOQ-ITEM'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{boq?.unit}</span>
                        </div>
                        <div className="text-slate-800 font-medium truncate" title={boq?.description}>
                          {boq?.description || '-'}
                        </div>
                        {m.items && m.items.length > 0 && (
                          <div className="text-[10px] text-primary-600 font-medium mt-0.5">
                            {m.items.length} dimensional lines ({m.items[0].description || 'Segment'})
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-700 max-w-[180px] truncate" title={m.location}>
                          {m.location || 'General Site'}
                        </div>
                        {m.remarks && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={m.remarks}>
                            {m.remarks}
                          </div>
                        )}
                      </td>

                      {/* Measured Qty */}
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        <div className="text-sm">
                          {m.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">{boq?.unit || m.unit}</span>
                      </td>

                      {/* Cumulative Progress */}
                      <td className="px-5 py-3.5 min-w-[170px]">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mb-1">
                          <span>Progress: {pct}%</span>
                          <span className={isOver ? "text-rose-600 font-bold" : "text-slate-600"}>
                            {completedQty} / {tenderQty} {boq?.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary-600'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          m.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          m.status === 'BILLED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          m.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          m.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {m.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {m.status === 'PENDING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {m.status === 'BILLED' && <Check className="w-3 h-3 text-blue-600" />}
                          {m.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {m.status}
                        </span>
                        {m.verifiedBy && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            By {m.verifiedBy.name?.split(' ')[0]}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Sheet */}
                          <button
                            onClick={() => setPrintMeasurement(m)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                            title="View / Print CPWD Standard MB Sheet"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Quick Verify / Reject for Site Engineers */}
                          {m.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setVerifyModal({ open: true, item: m, action: 'VERIFIED', reason: '' })}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Approve & Verify MB Entry"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setVerifyModal({ open: true, item: m, action: 'REJECTED', reason: '' })}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Reject Entry"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Edit (if not billed) */}
                          {m.status !== 'BILLED' && (
                            <button
                              onClick={() => handleEditClick(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit MB Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete (if not billed) */}
                          {m.status !== 'BILLED' && (
                            <button
                              onClick={() => handleDelete(m._id, m.mbRef)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <Ruler className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No measurement book records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {loading ? 'Fetching measurements from field books...' : 'Click "New MB Entry" to record detailed dimensions.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT MEASUREMENT MODAL WITH DYNAMIC SUB-MEASUREMENTS (L x B x D)   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800">
                    {editMeasurementId ? 'EDIT MODE' : 'NEW ENTRY'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Standard Measurement Book Format</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  {editMeasurementId ? 'Edit Measurement Book Entry' : 'Record Site Measurement (MB Entry)'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Project & BOQ Item Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isProjectView && (
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Select Project <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="input input-sm w-full min-w-0 max-w-full text-xs font-medium rounded-lg truncate bg-white cursor-pointer"
                      required
                      value={formData.projectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                    >
                      <option value="">-- Choose Project --</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`min-w-0 ${isProjectView ? "md:col-span-2" : ""}`}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select BOQ Item <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="input input-sm w-full min-w-0 max-w-full text-xs font-medium rounded-lg truncate bg-white cursor-pointer"
                    required
                    value={formData.boqItemId}
                    onChange={(e) => handleBoqItemSelect(e.target.value)}
                    disabled={boqItems.length === 0}
                  >
                    <option value="">{boqItems.length === 0 ? "Select a project first" : "-- Select Work Item --"}</option>
                    {boqItems.map(b => {
                      const truncatedDesc = b.description?.length > 48 ? `${b.description.slice(0, 48)}...` : b.description;
                      return (
                        <option key={b._id} value={b._id} title={`[${b.itemCode}] ${b.description} (${b.unit})`}>
                          [{b.itemCode}] {truncatedDesc} ({b.unit})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* BOQ Progress Snapshot Badge */}
              {selectedBoqItem && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 mr-2">
                      {selectedBoqItem.itemCode}
                    </span>
                    <span className="font-semibold text-slate-800">{selectedBoqItem.description}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 font-medium">
                    <div>Tender Qty: <strong className="text-slate-900">{selectedBoqItem.quantity} {selectedBoqItem.unit}</strong></div>
                    <div>Already Certified: <strong className="text-emerald-700">{selectedBoqItem.completedQuantity || 0} {selectedBoqItem.unit}</strong></div>
                    <div>Balance: <strong className="text-blue-700">{selectedBoqItem.remainingQuantity !== undefined ? selectedBoqItem.remainingQuantity : (selectedBoqItem.quantity - (selectedBoqItem.completedQuantity || 0))} {selectedBoqItem.unit}</strong></div>
                  </div>
                </div>
              )}

              {/* Reference & Location Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Book No.</label>
                  <input
                    type="text"
                    className="input input-sm w-full text-xs rounded-lg"
                    required
                    value={formData.bookNo}
                    onChange={e => {
                      const book = e.target.value;
                      setFormData(prev => ({ ...prev, bookNo: book, mbRef: `${book}/P-${prev.pageNo}` }));
                    }}
                    placeholder="MB-01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Page No.</label>
                  <input
                    type="text"
                    className="input input-sm w-full text-xs rounded-lg"
                    required
                    value={formData.pageNo}
                    onChange={e => {
                      const page = e.target.value;
                      setFormData(prev => ({ ...prev, pageNo: page, mbRef: `${prev.bookNo}/P-${page}` }));
                    }}
                    placeholder="14"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date of Measurement</label>
                  <input
                    type="date"
                    className="input input-sm w-full text-xs rounded-lg"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Site Location / Grid</label>
                  <input
                    type="text"
                    className="input input-sm w-full text-xs rounded-lg"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Basement 2, Grid A1-A6"
                  />
                </div>
              </div>

              {/* Dimensional Items vs Direct Total Toggle */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Sub-Measurement Dimensional Sheet (L × B × D)
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                      Standard CPWD 7-Column Form
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary-600 focus:ring-0"
                      checked={formData.isDirectQty}
                      onChange={e => setFormData({ ...formData, isDirectQty: e.target.checked })}
                    />
                    Direct Quantity Override
                  </label>
                </div>

                {formData.isDirectQty ? (
                  <div className="p-4 bg-white">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Direct Net Quantity ({selectedBoqItem?.unit || 'Units'}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      placeholder="e.g. 150.50"
                      className="input input-sm w-full max-w-xs text-sm font-bold rounded-lg"
                      value={formData.directQty}
                      onChange={e => setFormData({ ...formData, directQty: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-white space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-2 w-8">#</th>
                            <th className="py-2 px-2">Description of Work / Section</th>
                            <th className="py-2 px-2 w-16">Nos</th>
                            <th className="py-2 px-2 w-20">Length (m)</th>
                            <th className="py-2 px-2 w-20">Breadth (m)</th>
                            <th className="py-2 px-2 w-20">Depth/Ht (m)</th>
                            <th className="py-2 px-2 w-20 text-center">Deduction (–)</th>
                            <th className="py-2 px-2 w-24 text-right">Subtotal</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.items.map((row, idx) => (
                            <tr key={idx} className={row.isDeduction ? "bg-rose-50/50" : ""}>
                              <td className="py-2 px-2 font-mono text-slate-400 text-xs">{idx + 1}</td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  className="input input-xs w-full text-xs rounded"
                                  placeholder="e.g. Footing F1-F4 or Beam B1"
                                  value={row.description}
                                  onChange={e => handleItemRowChange(idx, 'description', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  className="input input-xs w-16 text-xs text-center font-mono rounded"
                                  value={row.nos}
                                  onChange={e => handleItemRowChange(idx, 'nos', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input input-xs w-20 text-xs text-right font-mono rounded"
                                  placeholder="0.00"
                                  value={row.length}
                                  onChange={e => handleItemRowChange(idx, 'length', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input input-xs w-20 text-xs text-right font-mono rounded"
                                  placeholder="0.00"
                                  value={row.breadth}
                                  onChange={e => handleItemRowChange(idx, 'breadth', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input input-xs w-20 text-xs text-right font-mono rounded"
                                  placeholder="0.00"
                                  value={row.depth}
                                  onChange={e => handleItemRowChange(idx, 'depth', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                                  checked={row.isDeduction}
                                  onChange={e => handleItemRowChange(idx, 'isDeduction', e.target.checked)}
                                  title="Check if this row is a deduction (e.g. voids, openings)"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold">
                                <span className={row.isDeduction ? "text-rose-600" : "text-slate-800"}>
                                  {row.subTotal > 0 ? `+${row.subTotal}` : row.subTotal}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDimensionRow(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete dimension line"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={addDimensionRow}
                        className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 rounded-lg py-1 px-3 text-primary-700 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Dimension Line
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Computed Quantity:</span>
                        <span className="text-base font-black text-slate-900 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                          {calculatedLiveQty} {selectedBoqItem?.unit || 'units'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Over-Execution Warning Banner */}
              {selectedBoqItem && (() => {
                const prev = selectedBoqItem.completedQuantity || 0;
                const progressive = prev + calculatedLiveQty;
                const tender = selectedBoqItem.quantity || 0;
                const over = progressive - tender;
                if (over > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Notice of Over-Execution: </strong>
                        The progressive total ({progressive.toFixed(2)} {selectedBoqItem.unit}) will exceed the approved BOQ Tender Quantity ({tender} {selectedBoqItem.unit}) by <strong>{over.toFixed(2)} {selectedBoqItem.unit} ({(over / tender * 100).toFixed(1)}%)</strong>.
                        A formal Site Variation / Deviation Order (VO) will be required during RA Bill certification.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Site Observations / Surveyor Remarks
                </label>
                <textarea
                  className="input input-sm w-full text-xs rounded-lg"
                  rows={2}
                  placeholder="e.g. Dimensions verified with total station. Concrete cubes casted."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary text-xs rounded-xl px-4 py-2 font-semibold"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || calculatedLiveQty <= 0}
                  className="btn btn-primary text-xs rounded-xl px-5 py-2 font-bold shadow-md shadow-primary-600/20 flex items-center gap-2"
                >
                  {isSubmitting ? 'Recording...' : editMeasurementId ? 'Update Measurement' : 'Record Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VERIFY / REJECT MODAL FOR SENIOR SITE ENGINEERS                           */}
      {/* ========================================================================= */}
      {verifyModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className={`p-4 border-b flex justify-between items-center ${
              verifyModal.action === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {verifyModal.action === 'VERIFIED' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                <h3 className="font-bold text-sm">
                  {verifyModal.action === 'VERIFIED' ? 'Verify & Certify Measurement' : 'Reject Measurement Record'}
                </h3>
              </div>
              <button onClick={() => setVerifyModal({ open: false, item: null, action: 'VERIFY', reason: '' })}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {verifyModal.action === 'VERIFIED'
                  ? `You are certifying that the work described in ${verifyModal.item?.mbRef} (${verifyModal.item?.quantity} ${verifyModal.item?.boqItemId?.unit}) has been physically verified at the site and is accurate for inclusion in the next Running Account (RA) Bill.`
                  : `Please state the engineering reason for rejecting measurement ${verifyModal.item?.mbRef} so the field team can re-measure or revise dimensions.`}
              </p>

              {verifyModal.action === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    className="input input-sm w-full text-xs rounded-lg"
                    rows={3}
                    required
                    placeholder="e.g. Concrete thickness found to be 120mm instead of 150mm recorded on line #2."
                    value={verifyModal.reason}
                    onChange={e => setVerifyModal(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs rounded-xl px-4 py-2"
                  onClick={() => setVerifyModal({ open: false, item: null, action: 'VERIFY', reason: '' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  className={`btn text-xs rounded-xl px-5 py-2 font-bold text-white ${
                    verifyModal.action === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {verifyModal.action === 'VERIFIED' ? 'Certify & Approve' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE CPWD / FIDIC STANDARD MEASUREMENT BOOK RECORD SHEET MODAL        */}
      {/* ========================================================================= */}
      {printMeasurement && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in duration-150">
            {/* Action Bar (Not printed) */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary-400" />
                <span className="font-bold text-xs uppercase tracking-wider">CPWD Standard Measurement Sheet (Form CPWA 23)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm text-xs rounded-lg flex items-center gap-1.5 px-3 py-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Sheet
                </button>
                <button
                  onClick={() => setPrintMeasurement(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Layout */}
            <div className="p-8 bg-white text-slate-900 font-serif leading-relaxed text-xs">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                <h2 className="text-base font-bold uppercase tracking-widest text-slate-900">
                  STANDARD MEASUREMENT BOOK RECORD SHEET
                </h2>
                <p className="text-[11px] uppercase tracking-wider text-slate-600 mt-0.5">
                  [Compliant with CPWD / MES / FIDIC Civil Measurement Standards]
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px] mb-4 pb-3 border-b border-slate-300">
                <div><strong>Project:</strong> {printMeasurement.projectId?.name}</div>
                <div><strong>Book & Page:</strong> Book {printMeasurement.bookNo || 'MB-01'} / Page {printMeasurement.pageNo || '01'}</div>
                <div><strong>MB Reference:</strong> <span className="font-mono font-bold">{printMeasurement.mbRef}</span></div>
                <div><strong>Date of Measurement:</strong> {new Date(printMeasurement.date).toLocaleDateString('en-GB')}</div>
                <div className="col-span-2"><strong>Location / Chainage / Grid:</strong> {printMeasurement.location || 'General Site'}</div>
                <div className="col-span-2">
                  <strong>Item of Work:</strong> [{printMeasurement.boqItemId?.itemCode}] {printMeasurement.boqItemId?.description}
                </div>
              </div>

              {/* Standard 7-Column MB Table */}
              <table className="w-full text-left border-collapse border border-slate-400 text-[10px] mb-4">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-8">Col 1<br/>No.</th>
                    <th className="border border-slate-400 p-1.5">Col 2<br/>Description of Work</th>
                    <th className="border border-slate-400 p-1.5 w-12">Col 3<br/>Nos</th>
                    <th className="border border-slate-400 p-1.5 w-14">Col 4<br/>L (m)</th>
                    <th className="border border-slate-400 p-1.5 w-14">Col 5<br/>B (m)</th>
                    <th className="border border-slate-400 p-1.5 w-14">Col 6<br/>D/H (m)</th>
                    <th className="border border-slate-400 p-1.5 w-20 text-right">Col 7<br/>Contents / Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {printMeasurement.items && printMeasurement.items.length > 0 ? (
                    printMeasurement.items.map((it, idx) => (
                      <tr key={idx} className={it.isDeduction ? "text-red-700 bg-red-50/20" : ""}>
                        <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 p-1.5">
                          {it.description} {it.isDeduction && <strong className="text-red-600">[Deduction]</strong>}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono">{it.nos}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">{it.length || '-'}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">{it.breadth || '-'}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">{it.depth || '-'}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">
                          {it.subTotal > 0 ? `+${it.subTotal}` : it.subTotal}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">1</td>
                      <td className="border border-slate-400 p-1.5" colSpan="5">Direct measured quantity execution</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">{printMeasurement.quantity}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan="6" className="border border-slate-400 p-2 text-right uppercase">
                      Total Measured Quantity ({printMeasurement.boqItemId?.unit || printMeasurement.unit}):
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono text-xs">
                      {printMeasurement.quantity}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Certification Statement */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[10px] text-slate-700 italic mb-8">
                "Certified that the works measured above have been executed in accordance with approved drawings and CPWD specifications, and that the measurements were recorded at the site in my presence."
              </div>

              {/* 3-Tier Sign-off Boxes */}
              <div className="grid grid-cols-3 gap-6 pt-4 text-center text-[10px]">
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Recorded By</div>
                  <div className="text-slate-500">Junior Engineer / Site Surveyor</div>
                  <div className="mt-1 font-mono text-[9px] text-slate-400">{printMeasurement.measuredBy?.name || 'Site Surveyor'}</div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Test-Checked & Certified</div>
                  <div className="text-slate-500">Assistant Executive Engineer</div>
                  <div className="mt-1 font-mono text-[9px] text-emerald-700 font-bold">
                    {printMeasurement.status === 'VERIFIED' ? `[CERTIFIED: ${printMeasurement.verifiedBy?.name || 'Engineer'}]` : '[AWAITING SIGN-OFF]'}
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-900">Accepted By</div>
                  <div className="text-slate-500">Contractor / Project Manager</div>
                  <div className="mt-1 font-mono text-[9px] text-slate-400">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
