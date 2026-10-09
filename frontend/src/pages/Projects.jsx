import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Grid, 
  List,
  MapPin,
  Calendar,
  IndianRupee,
  MoreVertical
} from 'lucide-react';

export default function Projects() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', projectCode: '', location: '', contractValue: '', status: 'PLANNING', startDate: '', expectedEndDate: ''
  });

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data.data.projects);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    api.get('/clients').then(res => setClients(res.data.data.clients)).catch(console.error);
    api.get('/users').then(res => setUsers(res.data.data.users)).catch(console.error);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        ...formData,
        contractValue: Number(formData.contractValue) || 0
      });
      toast.success('Project created successfully!');
      setIsAddModalOpen(false);
      fetchProjects();
      setFormData({ name: '', projectCode: '', location: '', contractValue: '', status: 'PLANNING', startDate: '', expectedEndDate: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(2)} L`;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'TBD';
  const formatStatusForUI = (status) => {
    if (status === 'ACTIVE') return 'Active';
    if (status === 'COMPLETED') return 'Completed';
    return 'Planning';
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formattedProjects = filteredProjects.map(p => ({
    id: p._id,
    name: p.name,
    client: p.clientId?.name || 'Internal / Direct',
    location: p.location || 'Location Not Set',
    value: formatCurrency(p.contractValue),
    status: formatStatusForUI(p.status),
    progress: p.progress || 0,
    startDate: formatDate(p.startDate),
    expectedCompletion: formatDate(p.expectedEndDate)
  }));

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500">Manage and monitor all your construction projects.</p>
        </div>
        <button 
          className="btn btn-primary shadow-sm flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex-1 w-full max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="btn btn-secondary flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
            <button 
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {formattedProjects.map(project => (
            <div 
              key={project.id} 
              className="card hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="h-32 bg-slate-200 relative">
                {/* Placeholder for project image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  project.status === 'Planning' ? 'bg-slate-100 text-slate-700' :
                  'bg-primary-100 text-primary-700'
                }`}>
                  {project.status}
                </span>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-bold text-lg leading-tight truncate">{project.name}</h3>
                  <p className="text-sm opacity-90 truncate">{project.client}</p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <IndianRupee className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{project.value}</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <span>{project.startDate} to {project.expectedCompletion}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">Progress</span>
                    <span className="font-bold text-primary-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Value</th>
                  <th className="px-6 py-4 font-medium">Progress</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                      {formattedProjects.map(project => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.client}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{project.location}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{project.value}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        project.status === 'Planning' ? 'bg-slate-100 text-slate-700' :
                        'bg-primary-100 text-primary-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Add New Project</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Project Name <span className="text-red-500">*</span></label>
                    <input type="text" required className="input" placeholder="e.g. New Town Residential" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Project Code <span className="text-red-500">*</span></label>
                    <input type="text" required className="input" placeholder="e.g. PRJ-001" value={formData.projectCode} onChange={e => setFormData({...formData, projectCode: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Location</label>
                    <input type="text" className="input" placeholder="e.g. Rajarhat, Kolkata" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Client</label>
                    <select className="input" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">Select a Client</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Project Manager</label>
                    <select className="input" value={formData.projectManagerId} onChange={e => setFormData({...formData, projectManagerId: e.target.value})}>
                      <option value="">Select a Manager</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Project Value (₹)</label>
                    <input type="number" className="input" placeholder="0.00" value={formData.contractValue} onChange={e => setFormData({...formData, contractValue: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input type="date" className="input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Expected End Date</label>
                    <input type="date" className="input" value={formData.expectedEndDate} onChange={e => setFormData({...formData, expectedEndDate: e.target.value})} />
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
                Save Project
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
