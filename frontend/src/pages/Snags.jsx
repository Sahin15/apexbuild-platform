import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  IndianRupee, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  X, 
  ArrowRight,
  ClipboardCheck,
  FileCheck
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Snags() {
  const [loading, setLoading] = useState(true);
  const [snags, setSnags] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('ALL');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedSnag, setSelectedSnag] = useState(null);

  // Forms
  const [snagForm, setSnagForm] = useState({
    projectId: '',
    title: '',
    description: '',
    category: 'CONCRETE',
    severity: 'MAJOR',
    location: '',
    tradeOrGang: 'Precision Formworks',
    assignedTo: '',
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    costImpact: 0
  });

  const [resolveForm, setResolveForm] = useState({
    status: 'RESOLVED',
    rectificationNotes: '',
    costImpact: 0
  });

  const fetchData = async (pId = projectId) => {
    try {
      setLoading(true);
      const query = pId && pId !== 'ALL' ? `?projectId=${pId}` : '';
      
      const [sRes, sumRes] = await Promise.all([
        api.get(`/snags${query}`),
        api.get(`/snags/summary${query}`)
      ]);

      setSnags(sRes.data?.data?.snags || []);
      setSummary(sumRes.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load site snags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then(res => {
      const pList = res.data?.data?.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setSnagForm(prev => ({ ...prev, projectId: pList[0]._id }));
      }
    }).catch(console.error);

    fetchData('ALL');
  }, []);

  const handleProjectFilterChange = (e) => {
    const val = e.target.value;
    setProjectId(val);
    fetchData(val);
  };

  const handleCreateSnag = async (e) => {
    e.preventDefault();
    try {
      await api.post('/snags', snagForm);
      toast.success('Site snag logged successfully!');
      setIsCreateModalOpen(false);
      setSnagForm({
        projectId: projectId !== 'ALL' ? projectId : (projects[0]?._id || ''),
        title: '',
        description: '',
        category: 'CONCRETE',
        severity: 'MAJOR',
        location: '',
        tradeOrGang: 'Precision Formworks',
        assignedTo: '',
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        costImpact: 0
      });
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log snag');
    }
  };

  const handleOpenResolveModal = (snag) => {
    setSelectedSnag(snag);
    setResolveForm({
      status: snag.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED',
      rectificationNotes: snag.rectificationNotes || '',
      costImpact: snag.costImpact || 0
    });
    setIsResolveModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedSnag) return;
    try {
      await api.patch(`/snags/${selectedSnag._id}`, resolveForm);
      toast.success('Snag rectification status updated!');
      setIsResolveModalOpen(false);
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update snag');
    }
  };

  const handleDeleteSnag = async (id) => {
    if (!window.confirm('Delete this quality snag item?')) return;
    try {
      await api.delete(`/snags/${id}`);
      toast.success('Snag item removed');
      fetchData(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete snag');
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Filter snags in UI
  const filteredSnags = snags.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && s.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = 
        (s.title || '').toLowerCase().includes(term) ||
        (s.snagNumber || '').toLowerCase().includes(term) ||
        (s.location || '').toLowerCase().includes(term) ||
        (s.tradeOrGang || '').toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-500/20 text-rose-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Site QA/QC & Punch List
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> CPWD Section 5 Inspection Clearance
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Site Snags & Quality Punch List</h1>
          <p className="text-slate-300 text-sm mt-1">
            Defect detection, repair rectification tracking, trade gang accountability & joint inspection sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
          <select
            value={projectId}
            onChange={handleProjectFilterChange}
            className="bg-slate-800/90 text-white text-sm border border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none max-w-[240px] truncate"
          >
            <option value="ALL">All Projects (Punch List)</option>
            {projects.map(p => (
              <option key={p._id} value={p._id} className="bg-slate-800 text-white">
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSnagForm({
                projectId: projectId !== 'ALL' ? projectId : (projects[0]?._id || ''),
                title: '',
                description: '',
                category: 'CONCRETE',
                severity: 'MAJOR',
                location: '',
                tradeOrGang: 'Precision Formworks',
                assignedTo: '',
                dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
                costImpact: 0
              });
              setIsCreateModalOpen(true);
            }}
            className="btn bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5 text-xs whitespace-nowrap flex-shrink-0 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
            <span>Log New Snag</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Snags */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Logged Snags</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.totalSnags || snags.length || 0} <span className="text-sm font-normal text-slate-400">Items</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Across All Registered Work Fronts</p>
          </div>
        </div>

        {/* Critical & Major Open */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical / Major Open</p>
            <h3 className="text-2xl font-bold text-rose-600">
              {(summary?.criticalOpenCount || 0) + (summary?.majorOpenCount || 0)} <span className="text-sm font-normal text-slate-400">Active</span>
            </h3>
            <p className="text-xs text-rose-600 font-semibold mt-0.5">
              {summary?.criticalOpenCount || 0} Critical (Blocks RA Bill)
            </p>
          </div>
        </div>

        {/* In Progress & Resolved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Under Rectification</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {summary?.inProgressCount || 0} <span className="text-sm font-normal text-slate-400">In Progress</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.resolvedCount || 0} Ready for Client QC
            </p>
          </div>
        </div>

        {/* Clearance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quality Clearance Rate</p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {summary?.clearanceRate || 0}%
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {summary?.verifiedCount || 0} Verified & Closed
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search snags by defect code, location, or trade gang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Status: Open</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="RESOLVED">Status: Resolved</option>
            <option value="VERIFIED_CLOSED">Status: Verified & Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="MAJOR">Major Only</option>
            <option value="MINOR">Minor Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Category: All</option>
            <option value="CONCRETE">Concrete</option>
            <option value="REBAR_FORMWORK">Rebar & Formwork</option>
            <option value="MASONRY_PLASTER">Masonry & Plaster</option>
            <option value="WATERPROOFING">Waterproofing</option>
            <option value="ELECTRICAL_MEP">Electrical & MEP</option>
            <option value="FINISHES_PAINT">Finishes & Paint</option>
          </select>
        </div>
      </div>

      {/* Snag Items List / Cards */}
      <div className="space-y-4">
        {filteredSnags.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No Defects Matching Filters</h4>
            <p className="text-xs text-slate-400 mt-1">All site operations on this work front are cleared or meet inspection standards.</p>
          </div>
        ) : (
          filteredSnags.map(snag => {
            const isCritical = snag.severity === 'CRITICAL';
            const isMajor = snag.severity === 'MAJOR';
            const isClosed = snag.status === 'VERIFIED_CLOSED';
            const isResolved = snag.status === 'RESOLVED';
            const isInProgress = snag.status === 'IN_PROGRESS';

            return (
              <div 
                key={snag._id} 
                className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
                  isClosed ? 'border-slate-200 bg-slate-50/40' :
                  isCritical ? 'border-rose-300' :
                  isMajor ? 'border-amber-200' :
                  'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded">
                      {snag.snagNumber}
                    </span>

                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      isCritical ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      isMajor ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {snag.severity}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {snag.category.replace('_', ' ')}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{snag.location}</strong>
                    </span>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      isClosed ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      isResolved ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      isInProgress ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      {isClosed ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                       isResolved ? <FileCheck className="w-3.5 h-3.5" /> :
                       isInProgress ? <Clock className="w-3.5 h-3.5" /> :
                       <AlertCircle className="w-3.5 h-3.5" />}
                      {snag.status.replace('_', ' ')}
                    </span>

                    {!isClosed && (
                      <button
                        onClick={() => handleOpenResolveModal(snag)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSnag(snag._id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                      title="Delete Snag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{snag.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{snag.description}</p>

                {/* Rectification Notes Box */}
                {snag.rectificationNotes && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 mb-3">
                    <strong className="font-bold flex items-center gap-1 text-emerald-800">
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> Rectification Action Taken:
                    </strong>
                    <p className="mt-0.5">{snag.rectificationNotes}</p>
                    {snag.resolvedDate && (
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        Resolved on: {new Date(snag.resolvedDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Meta details footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Assigned Gang: <strong className="text-slate-700 ml-1">{snag.tradeOrGang}</strong>
                    </span>
                    {snag.costImpact > 0 && (
                      <span className="flex items-center gap-1 text-rose-600 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Repair Cost: {formatINR(snag.costImpact)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span>Logged: {new Date(snag.identifiedDate).toLocaleDateString('en-IN')}</span>
                    {snag.dueDate && (
                      <span className={`font-semibold ${new Date(snag.dueDate) < new Date() && !isClosed ? 'text-rose-600' : 'text-slate-600'}`}>
                        Due: {new Date(snag.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: LOG NEW SNAG */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> QA/QC Inspection Defect
                </span>
                <h3 className="text-lg font-bold">Log New Site Snag & Punch Item</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnag} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Defect Title / Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Honeycomb on Column C3 after formwork stripping"
                  value={snagForm.title}
                  onChange={(e) => setSnagForm({ ...snagForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Technical Observation *</label>
                <textarea
                  rows="3"
                  placeholder="Describe the defect, root cause, and required structural or architectural remedy..."
                  value={snagForm.description}
                  onChange={(e) => setSnagForm({ ...snagForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exact Location / Grid *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower A - 3rd Floor Slab Grid C2-C4"
                    value={snagForm.location}
                    onChange={(e) => setSnagForm({ ...snagForm, location: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Trade Gang / Thekedaar</label>
                  <input
                    type="text"
                    placeholder="e.g. Precision Formworks / Jagdish"
                    value={snagForm.tradeOrGang}
                    onChange={(e) => setSnagForm({ ...snagForm, tradeOrGang: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={snagForm.category}
                    onChange={(e) => setSnagForm({ ...snagForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="CONCRETE">Concrete</option>
                    <option value="REBAR_FORMWORK">Rebar & Formwork</option>
                    <option value="MASONRY_PLASTER">Masonry & Plaster</option>
                    <option value="WATERPROOFING">Waterproofing</option>
                    <option value="ELECTRICAL_MEP">Electrical & MEP</option>
                    <option value="FINISHES_PAINT">Finishes & Paint</option>
                    <option value="SAFETY_HOUSEKEEPING">Safety / Housekeeping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={snagForm.severity}
                    onChange={(e) => setSnagForm({ ...snagForm, severity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-rose-700"
                  >
                    <option value="CRITICAL">CRITICAL (Blocks Pour/Bill)</option>
                    <option value="MAJOR">MAJOR (Rework Required)</option>
                    <option value="MINOR">MINOR (Cosmetic Touchup)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rectification Due Date</label>
                  <input
                    type="date"
                    value={snagForm.dueDate}
                    onChange={(e) => setSnagForm({ ...snagForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Repair / Deduction Cost (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={snagForm.costImpact}
                  onChange={(e) => setSnagForm({ ...snagForm, costImpact: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Log Snag Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STATUS & RECTIFICATION NOTES */}
      {isResolveModalOpen && selectedSnag && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  {selectedSnag.snagNumber} • {selectedSnag.location}
                </span>
                <h3 className="text-lg font-bold">Update Rectification Status</h3>
              </div>
              <button onClick={() => setIsResolveModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm mb-1">{selectedSnag.title}</h4>
                <p className="text-slate-500 leading-relaxed">{selectedSnag.description}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Resolution Status *</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 text-sm"
                >
                  <option value="OPEN">OPEN (Still Pending Action)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Work Underway on Site)</option>
                  <option value="RESOLVED">RESOLVED (Ready for QC Inspection)</option>
                  <option value="VERIFIED_CLOSED">VERIFIED & CLOSED (QC Passed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rectification Action / Repair Notes</label>
                <textarea
                  rows="3"
                  placeholder="Detail the repair method, materials used (e.g. SikaGrout 214, SBR bonding agent), and technician notes..."
                  value={resolveForm.rectificationNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, rectificationNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Incurred Repair Cost (₹)</label>
                <input
                  type="number"
                  value={resolveForm.costImpact}
                  onChange={(e) => setResolveForm({ ...resolveForm, costImpact: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
