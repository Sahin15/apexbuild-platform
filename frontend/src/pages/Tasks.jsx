import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, Plus, Search, 
  Filter, Building, Layers, Eye, Edit2, Trash2, ChevronRight, 
  Flag, ArrowRight, ShieldAlert, Check, X, BarChart3, ListFilter,
  Kanban, Compass, User, AlertCircle
} from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Tasks({ isProjectView = false }) {
  const confirm = useConfirm();
  const { id: routeProjectId } = useParams();

  // State
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '');
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' | 'wbs' | 'kanban'
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState('weekly'); // 'weekly' | 'monthly'

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Progress Modal
  const [progressModal, setProgressModal] = useState({ open: false, task: null, progress: 0, note: '' });

  // Task Form State
  const [formData, setFormData] = useState({
    projectId: routeProjectId || '',
    wbsCode: '1.1',
    phase: 'SUBSTRUCTURE',
    title: '',
    description: '',
    status: 'todo',
    priority: 'Medium',
    isMilestone: false,
    isCriticalPath: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baselineEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    dependencies: [],
    boqItemIds: [],
    assigneeName: '',
    assigneeRole: 'Contractor'
  });

  // Fetch Tasks & Analytics
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const projId = isProjectView ? routeProjectId : selectedProjectId;
      let endpoint = '/tasks';
      const params = [];
      if (projId) params.push(`projectId=${projId}`);
      if (phaseFilter !== 'ALL') params.push(`phase=${phaseFilter}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await api.get(endpoint);
      setTasks(res.data.data.tasks || []);
      setStats(res.data.data.stats || null);
    } catch (error) {
      toast.error('Failed to load project schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!isProjectView) {
      try {
        const res = await api.get('/projects');
        const projs = res.data.data.projects || [];
        setProjects(projs);
        if (!selectedProjectId && projs.length > 0) {
          setSelectedProjectId(projs[0]._id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }
  };

  const fetchBoqItems = async (projId) => {
    if (!projId) {
      setBoqItems([]);
      return;
    }
    try {
      const res = await api.get(`/projects/${projId}/boq`);
      setBoqItems(res.data.data.items || []);
    } catch (error) {
      console.error('Error fetching BOQ items:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [selectedProjectId, phaseFilter, statusFilter, routeProjectId, isProjectView]);

  useEffect(() => {
    const curProjId = isProjectView ? routeProjectId : selectedProjectId;
    if (curProjId) {
      fetchBoqItems(curProjId);
    }
  }, [selectedProjectId, routeProjectId, isProjectView]);

  // Handle open create task modal
  const handleOpenCreateModal = () => {
    const curProj = isProjectView ? routeProjectId : (selectedProjectId || projects[0]?._id);
    setEditTaskId(null);
    setFormData({
      projectId: curProj || '',
      wbsCode: `${tasks.length + 1}.0`,
      phase: 'SUPERSTRUCTURE',
      title: '',
      description: '',
      status: 'todo',
      priority: 'Medium',
      isMilestone: false,
      isCriticalPath: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      baselineEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      dependencies: [],
      boqItemIds: [],
      assigneeName: '',
      assigneeRole: 'Subcontractor'
    });
    setIsTaskModalOpen(true);
  };

  // Handle edit task click
  const handleEditClick = (task) => {
    setEditTaskId(task._id);
    setFormData({
      projectId: task.projectId?._id || task.projectId,
      wbsCode: task.wbsCode || '1.0',
      phase: task.phase || 'SUPERSTRUCTURE',
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'Medium',
      isMilestone: Boolean(task.isMilestone),
      isCriticalPath: Boolean(task.isCriticalPath),
      startDate: new Date(task.startDate).toISOString().split('T')[0],
      endDate: new Date(task.endDate).toISOString().split('T')[0],
      baselineEndDate: task.baselineEndDate ? new Date(task.baselineEndDate).toISOString().split('T')[0] : '',
      progress: task.progress || 0,
      dependencies: task.dependencies?.map(d => d._id || d) || [],
      boqItemIds: task.boqItemIds?.map(b => b._id || b) || [],
      assigneeName: task.assigneeName || '',
      assigneeRole: task.assigneeRole || 'Contractor'
    });
    setIsTaskModalOpen(true);
  };

  // Submit Task (Create or Update)
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editTaskId) {
        await api.patch(`/tasks/${editTaskId}`, formData);
        toast.success('Task schedule updated successfully');
      } else {
        await api.post('/tasks', formData);
        toast.success('New WBS activity added to schedule');
      }
      setIsTaskModalOpen(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (task) => {
    const isConfirmed = await confirm({
      title: 'Delete Schedule Task',
      message: `Are you sure you want to remove "${task.title}" (WBS ${task.wbsCode}) from the project timeline?`,
      confirmText: 'Delete Activity'
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task removed from schedule');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  // Submit Quick Progress Log
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModal.task) return;
    try {
      await api.patch(`/tasks/${progressModal.task._id}/progress`, {
        progress: Number(progressModal.progress),
        note: progressModal.note
      });
      toast.success(`Progress updated to ${progressModal.progress}%`);
      setProgressModal({ open: false, task: null, progress: 0, note: '' });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to log progress');
    }
  };

  // Filter tasks by text search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(q) ||
      t.wbsCode?.toLowerCase().includes(q) ||
      t.assigneeName?.toLowerCase().includes(q) ||
      t.phase?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  // Calculate Gantt Timeline Coordinate Bounds
  const ganttBounds = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        minDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
        maxDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
        totalDays: 60
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach(t => {
      const s = new Date(t.startDate).getTime();
      const e = new Date(t.endDate).getTime();
      if (s < minTime) minTime = s;
      if (e > maxTime) maxTime = e;
    });

    // Add 5-day padding on left and 10-day on right
    minTime -= 5 * 24 * 60 * 60 * 1000;
    maxTime += 10 * 24 * 60 * 60 * 1000;

    const totalDays = Math.max(30, Math.ceil((maxTime - minTime) / (24 * 60 * 60 * 1000)));

    return {
      minDate: new Date(minTime),
      maxDate: new Date(maxTime),
      totalDays
    };
  }, [tasks]);

  // Generate calendar day/week column ticks
  const timelineTicks = useMemo(() => {
    const ticks = [];
    const curr = new Date(ganttBounds.minDate);
    const end = new Date(ganttBounds.maxDate);

    while (curr <= end) {
      ticks.push(new Date(curr));
      curr.setDate(curr.getDate() + (zoomLevel === 'monthly' ? 14 : 7));
    }
    return ticks;
  }, [ganttBounds, zoomLevel]);

  // Today marker offset percentage
  const todayOffsetPct = useMemo(() => {
    const today = new Date().getTime();
    const min = ganttBounds.minDate.getTime();
    const max = ganttBounds.maxDate.getTime();
    if (today < min || today > max) return null;
    return Math.round(((today - min) / (max - min)) * 1000) / 10;
  }, [ganttBounds]);

  // Helper to compute task bar position & width percentage
  const getTaskBarStyle = (task) => {
    const s = new Date(task.startDate).getTime();
    const e = new Date(task.endDate).getTime();
    const min = ganttBounds.minDate.getTime();
    const max = ganttBounds.maxDate.getTime();

    const left = Math.max(0, Math.min(100, ((s - min) / (max - min)) * 100));
    const width = Math.max(1.5, Math.min(100 - left, ((e - s) / (max - min)) * 100));

    return { left: `${left}%`, width: `${width}%` };
  };

  const PHASES = [
    'PRE-CONSTRUCTION', 'SUBSTRUCTURE', 'SUPERSTRUCTURE', 
    'MASONRY', 'MEP_HVAC', 'FINISHES', 'HANDOVER'
  ];

  return (
    <div className={isProjectView ? "space-y-5" : "space-y-6"}>
      {/* Header */}
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Primavera / MS Project Standards
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Critical Path Method (CPM)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Project Gantt Timeline & WBS Schedule
            </h1>
            <p className="text-slate-500 text-sm">
              Work Breakdown Structure (WBS), milestone baselines, finish-to-start dependencies, and real-time site slippage tracking.
            </p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="btn btn-primary text-sm flex items-center gap-2 shadow-lg shadow-primary-600/20 px-4 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Schedule Activity
          </button>
        </div>
      )}

      {/* Schedule KPI Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</span>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
              {stats.overallProgress}%
              <span className="text-[10px] text-slate-400 font-normal">weighted</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.overallProgress}%` }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Activities</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalTasks}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">WBS work packages</div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{stats.completedCount}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Executed 100%</div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 shadow-sm">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> In Progress
            </span>
            <div className="text-2xl font-black text-blue-950 mt-1">{stats.inProgressCount}</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Active site works</div>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 shadow-sm">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Critical Path
            </span>
            <div className="text-2xl font-black text-rose-950 mt-1">{stats.criticalPathCount}</div>
            <div className="text-[11px] text-rose-700 mt-0.5">Zero float activities</div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-sm">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Delayed / Slippage
            </span>
            <div className="text-2xl font-black text-amber-950 mt-1">{stats.delayedCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Behind baseline</div>
          </div>
        </div>
      )}

      {/* Toolbar & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search WBS, activity, contractor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm pl-9 bg-slate-50 text-xs w-full rounded-lg"
            />
          </div>

          {/* Project Picker (if not project view) */}
          {!isProjectView && (
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input input-sm text-xs bg-slate-50 rounded-lg py-1 px-2.5 font-medium text-slate-700 max-w-[200px] truncate"
              >
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Phase Filter */}
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="input input-sm text-xs bg-slate-50 rounded-lg py-1 px-2.5 font-medium text-slate-700"
          >
            <option value="ALL">All Phases</option>
            {PHASES.map(ph => (
              <option key={ph} value={ph}>{ph.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          {viewMode === 'gantt' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-[11px] font-semibold text-slate-600 mr-2">
              <button
                onClick={() => setZoomLevel('weekly')}
                className={`px-2 py-0.5 rounded ${zoomLevel === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                Weeks
              </button>
              <button
                onClick={() => setZoomLevel('monthly')}
                className={`px-2 py-0.5 rounded ${zoomLevel === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                Months
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'gantt' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Gantt
            </button>
            <button
              onClick={() => setViewMode('wbs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'wbs' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> WBS Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          {isProjectView && (
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Activity
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE GANTT TIMELINE VIEW                                       */}
      {/* ========================================================================= */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Gantt Header Timeline Calendar */}
          <div className="border-b border-slate-200 bg-slate-50/90 flex text-xs font-semibold text-slate-600 select-none">
            {/* Left side label column */}
            <div className="w-72 shrink-0 p-3.5 border-r border-slate-200 font-bold uppercase tracking-wider text-[11px] text-slate-700 bg-slate-100/70">
              WBS Activity & Phase
            </div>

            {/* Right side horizontal calendar timeline axis */}
            <div className="flex-1 relative overflow-hidden flex items-center h-12">
              {timelineTicks.map((tick, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-slate-200/80 px-2 text-[10px] text-slate-500 font-mono text-center truncate"
                >
                  {tick.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
              ))}

              {/* Today Vertical Line Indicator */}
              {todayOffsetPct !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 flex flex-col items-center"
                  style={{ left: `${todayOffsetPct}%` }}
                >
                  <span className="bg-rose-600 text-white text-[9px] font-bold px-1 rounded-b shadow-sm -mt-0.5">
                    Today
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Gantt Activity Rows */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const barStyle = getTaskBarStyle(task);
                const isDelayed = task.slippageDays > 0 && task.progress < 100;

                return (
                  <div key={task._id} className="flex hover:bg-slate-50/70 transition-colors group">
                    {/* Left Column: Task Name, WBS Code, and Progress Button */}
                    <div className="w-72 shrink-0 p-3 border-r border-slate-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {task.wbsCode}
                          </span>
                          {task.isCriticalPath && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 uppercase" title="Critical Path (Zero Float)">
                              CP
                            </span>
                          )}
                          {task.isMilestone && (
                            <Flag className="w-3 h-3 text-amber-500 shrink-0" title="Key Project Milestone" />
                          )}
                        </div>
                        <div className="font-semibold text-slate-800 text-xs truncate mt-0.5" title={task.title}>
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {task.phase?.replace('_', ' ')} • {task.durationDays}d
                        </div>
                      </div>

                      <button
                        onClick={() => setProgressModal({ open: true, task, progress: task.progress || 0, note: '' })}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                        title="Quick Log Progress %"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Right Column: Timeline Bar */}
                    <div className="flex-1 relative h-14 flex items-center p-2 overflow-hidden">
                      {/* Grid background vertical lines */}
                      <div className="absolute inset-0 flex pointer-events-none opacity-40">
                        {timelineTicks.map((_, i) => (
                          <div key={i} className="flex-1 border-r border-slate-100 h-full" />
                        ))}
                      </div>

                      {/* Today Vertical Line Indicator across rows */}
                      {todayOffsetPct !== null && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-400/40 pointer-events-none z-10"
                          style={{ left: `${todayOffsetPct}%` }}
                        />
                      )}

                      {/* Task Timeline Bar */}
                      <div
                        className={`absolute h-7 rounded-lg shadow-sm border transition-all cursor-pointer flex items-center px-2 select-none overflow-hidden ${
                          task.isCriticalPath 
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 border-rose-700 text-white' 
                            : task.progress === 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700 text-white'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600 border-indigo-700 text-white'
                        }`}
                        style={barStyle}
                        onClick={() => handleEditClick(task)}
                        title={`${task.title} (${task.progress}%) | ${new Date(task.startDate).toLocaleDateString('en-GB')} to ${new Date(task.endDate).toLocaleDateString('en-GB')}`}
                      >
                        {/* Inner Progress Shading */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-white/25 pointer-events-none rounded-l-lg transition-all"
                          style={{ width: `${task.progress}%` }}
                        />

                        {/* Text Inside Bar */}
                        <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-bold leading-none truncate">
                          <span className="truncate">{task.title}</span>
                          <span className="font-mono ml-2 shrink-0">{task.progress}%</span>
                        </div>
                      </div>

                      {/* Slippage Indicator tag if delayed */}
                      {isDelayed && (
                        <div 
                          className="absolute text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 z-10"
                          style={{ left: `calc(${barStyle.left} + ${barStyle.width} + 8px)` }}
                        >
                          +{task.slippageDays}d slip
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-500">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No project tasks scheduled yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add Schedule Activity" to define project phases and activities.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WORK BREAKDOWN STRUCTURE (WBS) TABLE VIEW                             */}
      {/* ========================================================================= */}
      {viewMode === 'wbs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">WBS Code</th>
                  <th className="px-5 py-3.5">Phase</th>
                  <th className="px-5 py-3.5">Activity Description</th>
                  <th className="px-5 py-3.5">Assigned Subcontractor</th>
                  <th className="px-5 py-3.5">Start Date</th>
                  <th className="px-5 py-3.5">End Date</th>
                  <th className="px-5 py-3.5 text-center">Duration</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5 text-center">Slippage</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">
                        {t.wbsCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {t.phase?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <div className="font-semibold text-slate-900 truncate" title={t.title}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.isCriticalPath && (
                            <span className="text-[10px] font-bold text-rose-600">Critical Path</span>
                          )}
                          {t.isMilestone && (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                              <Flag className="w-2.5 h-2.5" /> Milestone
                            </span>
                          )}
                          {t.dependencies && t.dependencies.length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              Dep: {t.dependencies.map(d => d.wbsCode || d).join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{t.assigneeName || 'Site Team'}</div>
                        <div className="text-[10px] text-slate-400">{t.assigneeRole}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                        {new Date(t.startDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                        {new Date(t.endDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                        {t.durationDays}d
                      </td>
                      <td className="px-5 py-3.5 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span>{t.progress}%</span>
                          <span className={t.progress === 100 ? "text-emerald-600" : "text-slate-400"}>
                            {t.status}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              t.progress === 100 ? 'bg-emerald-500' : t.isCriticalPath ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {t.slippageDays > 0 ? (
                          <span className="text-rose-600 font-bold font-mono text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            +{t.slippageDays}d
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold font-mono text-[11px]">On Track</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setProgressModal({ open: true, task: t, progress: t.progress || 0, note: '' })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                            title="Update Progress %"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit Activity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-slate-500">
                      No schedule tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. KANBAN BOARD VIEW                                                     */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'todo', label: 'To Do (Pending Start)', color: 'border-slate-300 bg-slate-50' },
            { id: 'in-progress', label: 'In Progress (On Site)', color: 'border-blue-300 bg-blue-50/40' },
            { id: 'delayed', label: 'Delayed / Slippage', color: 'border-rose-300 bg-rose-50/40' },
            { id: 'completed', label: 'Executed (100%)', color: 'border-emerald-300 bg-emerald-50/40' }
          ].map(col => {
            const colTasks = filteredTasks.filter(t => {
              if (col.id === 'delayed') return t.status === 'delayed' || (t.slippageDays > 0 && t.progress < 100);
              return t.status === col.id;
            });

            return (
              <div key={col.id} className={`rounded-2xl border ${col.color} p-4 flex flex-col`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 shadow-xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map(task => (
                    <div 
                      key={task._id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-2"
                      onClick={() => handleEditClick(task)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {task.wbsCode}
                        </span>
                        {task.isCriticalPath && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">CP</span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-2">{task.title}</h4>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{new Date(task.endDate).toLocaleDateString('en-GB')}</span>
                        <strong className="text-slate-700">{task.progress}%</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT TASK MODAL                                                    */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {editTaskId ? 'EDIT WBS ACTIVITY' : 'NEW SCHEDULE ACTIVITY'}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {editTaskId ? 'Update Activity & Dependencies' : 'Add Activity to Gantt Schedule'}
                </h2>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">WBS Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.2"
                    className="input input-sm w-full font-mono text-xs rounded-lg"
                    value={formData.wbsCode}
                    onChange={e => setFormData({ ...formData, wbsCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Construction Phase</label>
                  <select
                    className="input input-sm w-full text-xs font-medium rounded-lg"
                    value={formData.phase}
                    onChange={e => setFormData({ ...formData, phase: e.target.value })}
                  >
                    {PHASES.map(ph => (
                      <option key={ph} value={ph}>{ph.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Activity Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raft Concrete Pour M30 Design Mix"
                  className="input input-sm w-full text-xs font-semibold rounded-lg"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description / Scope of Work</label>
                <textarea
                  rows={2}
                  className="input input-sm w-full text-xs rounded-lg"
                  placeholder="Provide scope, specs, concrete grade, or equipment details."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="input input-sm w-full text-xs rounded-lg"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="input input-sm w-full text-xs rounded-lg"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input input-sm w-full font-mono text-xs rounded-lg"
                    value={formData.progress}
                    onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Subcontractor / Lead</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Earthmovers Squad"
                    className="input input-sm w-full text-xs rounded-lg"
                    value={formData.assigneeName}
                    onChange={e => setFormData({ ...formData, assigneeName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    className="input input-sm w-full text-xs rounded-lg"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Flags */}
              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded text-rose-600 focus:ring-0"
                    checked={formData.isCriticalPath}
                    onChange={e => setFormData({ ...formData, isCriticalPath: e.target.checked })}
                  />
                  Critical Path Activity (Zero Float)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded text-amber-500 focus:ring-0"
                    checked={formData.isMilestone}
                    onChange={e => setFormData({ ...formData, isMilestone: e.target.checked })}
                  />
                  Milestone Deliverable
                </label>
              </div>

              {/* Predecessors / Dependencies */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Predecessor Activity (Finish-to-Start Dependency)
                </label>
                <select
                  className="input input-sm w-full text-xs rounded-lg truncate bg-white"
                  value={formData.dependencies[0] || ''}
                  onChange={e => setFormData({ ...formData, dependencies: e.target.value ? [e.target.value] : [] })}
                >
                  <option value="">-- No Predecessor (Starts directly) --</option>
                  {tasks
                    .filter(t => t._id !== editTaskId)
                    .map(t => (
                      <option key={t._id} value={t._id}>
                        [{t.wbsCode}] {t.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="btn btn-secondary text-xs rounded-xl px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary text-xs rounded-xl px-5 py-2 font-bold"
                >
                  {isSubmitting ? 'Saving...' : editTaskId ? 'Update Activity' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK LOG PROGRESS MODAL                                                 */}
      {/* ========================================================================= */}
      {progressModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b bg-indigo-50 border-indigo-200 text-indigo-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">Update Progress — {progressModal.task?.wbsCode}</h3>
              </div>
              <button onClick={() => setProgressModal({ open: false, task: null, progress: 0, note: '' })}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <div className="font-semibold text-slate-800 text-sm mb-1">{progressModal.task?.title}</div>
                <div className="text-[11px] text-slate-500">
                  Target Finish: {new Date(progressModal.task?.endDate).toLocaleDateString('en-GB')}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center font-bold text-slate-700 uppercase mb-1">
                  <span>Completion Percentage</span>
                  <span className="text-base text-indigo-700 font-mono">{progressModal.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-indigo-600 cursor-pointer"
                  value={progressModal.progress}
                  onChange={e => setProgressModal({ ...progressModal, progress: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Site Progress Log / Note</label>
                <textarea
                  rows={2}
                  className="input input-sm w-full text-xs rounded-lg"
                  placeholder="e.g. Shuttering dismantled. 28-day break tests passed."
                  value={progressModal.note}
                  onChange={e => setProgressModal({ ...progressModal, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs rounded-xl px-4 py-2"
                  onClick={() => setProgressModal({ open: false, task: null, progress: 0, note: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs rounded-xl px-5 py-2 font-bold"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
