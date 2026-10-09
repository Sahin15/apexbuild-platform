import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  MoreVertical,
  User
} from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Tasks({ isProjectView = false }) {
  const confirm = useConfirm();
  const { id: projectId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeName: 'Sanjay Roy', // default mock
    dueDate: '',
    priority: 'Medium',
    status: 'todo'
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/tasks` : '/tasks';
      const res = await api.get(endpoint);
      setTasks(res.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, isProjectView]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/tasks` : '/tasks';
      await api.post(endpoint, formData);
      toast.success('Task created successfully');
      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', assigneeName: 'Sanjay Roy', dueDate: '', priority: 'Medium', status: 'todo' });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/tasks/${task._id}` : `/tasks/${task._id}`;
      await api.patch(endpoint, { status: newStatus });
      setOpenDropdownId(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    
    try {
      const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/tasks/${id}` : `/tasks/${id}`;
      await api.delete(endpoint);
      toast.success('Task deleted');
      setOpenDropdownId(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.assigneeName && t.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTaskIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t._id)));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTaskIds.size === 0) return;
    try {
      const promises = Array.from(selectedTaskIds).map(id => {
        const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/tasks/${id}` : `/tasks/${id}`;
        return api.patch(endpoint, { status: newStatus });
      });
      await Promise.all(promises);
      toast.success(`${selectedTaskIds.size} tasks updated`);
      setSelectedTaskIds(new Set());
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update some tasks');
    }
  };

  if (loading && isProjectView) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading tasks...</div>;
  }

  return (
    <div className={`space-y-6 ${!isProjectView && 'p-6'}`}>
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
            <p className="text-slate-500">Manage project schedule and daily to-dos.</p>
          </div>
          <button 
            className="btn btn-primary shadow-sm flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {selectedTaskIds.size > 0 ? (
          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-md">
              {selectedTaskIds.size} selected
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary text-xs"
                onClick={() => handleBulkStatusChange('todo')}
              >
                Mark To Do
              </button>
              <button 
                className="btn btn-secondary text-xs"
                onClick={() => handleBulkStatusChange('in-progress')}
              >
                Mark In Progress
              </button>
              <button 
                className="btn btn-secondary text-xs"
                onClick={() => handleBulkStatusChange('completed')}
              >
                Mark Completed
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="btn btn-secondary flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          {isProjectView && (
            <button 
              className="btn btn-primary flex items-center gap-2 text-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {filteredTasks.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <input 
              type="checkbox" 
              className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
              checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
              onChange={handleSelectAll}
            />
            <span className="text-sm text-slate-500 font-medium">Select All</span>
          </div>
        )}
        <ul className="divide-y divide-slate-200">
          {filteredTasks.length > 0 ? filteredTasks.map(task => (
            <li key={task._id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row gap-4 sm:items-center justify-between" onClick={(e) => handleToggleSelect(task._id, e)}>
              <div className="flex gap-4 items-start flex-1">
                <input 
                  type="checkbox" 
                  className="mt-1 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  checked={selectedTaskIds.has(task._id)}
                  onChange={(e) => handleToggleSelect(task._id, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {task.title}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </h4>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {task.assigneeName || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      Priority: <span className={task.priority === 'High' ? 'text-red-500' : 'text-slate-700'}>{task.priority}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-center relative">
                <button 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === task._id ? null : task._id);
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {openDropdownId === task._id && (
                  <div className="absolute right-0 top-10 w-44 bg-white rounded-md shadow-lg border border-slate-200 z-[100] py-1">
                    {task.status !== 'todo' && (
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task, 'todo'); }}
                      >
                        Mark as To Do
                      </button>
                    )}
                    {task.status !== 'in-progress' && (
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task, 'in-progress'); }}
                      >
                        Mark In Progress
                      </button>
                    )}
                    {task.status !== 'completed' && (
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task, 'completed'); }}
                      >
                        Mark as Completed
                      </button>
                    )}
                    <div className="h-px bg-slate-200 my-1"></div>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                    >
                      Delete Task
                    </button>
                  </div>
                )}
              </div>
            </li>
          )) : (
            <li className="p-8 text-center text-slate-500">
              No tasks found.
            </li>
          )}
        </ul>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">New Task</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div>
                    <label className="label">Task Title <span className="text-red-500">*</span></label>
                    <input type="text" required className="input" placeholder="e.g. Schedule cement delivery" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input min-h-[100px]" placeholder="Add detailed instructions..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Assignee</label>
                      <select className="input" value={formData.assigneeName} onChange={e => setFormData({...formData, assigneeName: e.target.value})}>
                        <option value="Sanjay Roy">Sanjay Roy</option>
                        <option value="Rahul Sharma">Rahul Sharma</option>
                        <option value="Amit Kumar">Amit Kumar</option>
                        <option value="Store Manager">Store Manager</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input type="date" className="input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Priority</label>
                      <select className="input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
