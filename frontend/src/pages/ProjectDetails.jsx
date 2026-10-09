import { useState, useEffect } from 'react';
import { useParams, NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Calendar, 
  User, 
  IndianRupee,
  ChevronRight,
  Pencil
} from 'lucide-react';
import BOQ from './BOQ';
import SiteReports from './SiteReports';
import Materials from './Materials';
import Labour from './Labour';
import Expenses from './Expenses';
import Measurements from './Measurements';
import Billing from './Billing';
import Documents from './Documents';
import Team from './Team';
import Tasks from './Tasks';
import Estimations from './Estimations';

export default function ProjectDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data.project);
      setFinancials(res.data.data.financials);
      setFormData(res.data.data.project);
    } catch (error) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    if (isEditModalOpen) {
      api.get('/clients').then(res => setClients(res.data.data.clients)).catch(console.error);
      api.get('/users').then(res => setUsers(res.data.data.users)).catch(console.error);
    }
  }, [isEditModalOpen]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}`, formData);
      toast.success('Project details updated');
      setIsEditModalOpen(false);
      fetchProjectDetails();
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const tabs = [
    { name: 'Overview', path: '' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'BOQ', path: 'boq' },
    { name: 'Site Reports', path: 'site-reports' },
    { name: 'Materials', path: 'materials' },
    { name: 'Labour', path: 'labour' },
    { name: 'Expenses', path: 'expenses' },
    { name: 'Measurements', path: 'measurements' },
    { name: 'Billing', path: 'billing' },
    { name: 'Documents', path: 'documents' },
    { name: 'Team', path: 'team' },
    { name: 'Estimations', path: 'estimations' },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 font-medium">
        <NavLink to="/projects" className="hover:text-primary-600 transition-colors">Projects</NavLink>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-800">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-slate-300 mt-1 flex items-center gap-4">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {project.location || 'Location Not Set'}</span>
              <span className="flex items-center"><User className="w-4 h-4 mr-1" /> Client: {project.clientId?.companyName || project.clientId?.name || 'Not Assigned'}</span>
            </p>
          </div>
          <span className="absolute top-6 right-6 px-3 py-1 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-sm font-medium">
            {project.status}
          </span>
        </div>
        
        <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-white">
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Project Manager</p>
              <p className="font-semibold text-slate-800">{project.projectManagerId?.name || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Project Value</p>
              <p className="font-semibold text-slate-800 flex items-center">
                {formatCurrency(project.contractValue)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Timeline</p>
              <p className="font-semibold text-slate-800">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} to {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="w-4 h-4" /> Edit Project
          </button>
        </div>

        {/* Tabs */}
        <div className="border-t border-slate-200 px-6 overflow-x-auto">
          <nav className="flex space-x-6">
            {tabs.map((tab) => {
              const isActive = tab.path === '' 
                ? location.pathname === `/projects/${id}` 
                : location.pathname.includes(`/projects/${id}/${tab.path}`);
              
              return (
                <NavLink
                  key={tab.name}
                  to={`/projects/${id}/${tab.path}`}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  {tab.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[400px]">
        <Routes>
          <Route path="" element={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Financial Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Project Value</p>
                    <p className="font-bold text-slate-800 text-lg">{formatCurrency(project.contractValue)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 mb-1">Amount Spent</p>
                    <p className="font-bold text-orange-700 text-lg">{formatCurrency(financials?.actualCost || 0)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-sm text-emerald-600 mb-1">Billed (RA)</p>
                    <p className="font-bold text-emerald-700 text-lg">{formatCurrency(financials?.billedAmount || 0)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Remaining Budget</p>
                    <p className="font-bold text-blue-700 text-lg">{formatCurrency(financials?.remainingEstimatedCost || 0)}</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-4">Construction Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">Overall BOQ Completion</span>
                    <span className="text-slate-500">{financials?.progressPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${financials?.progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min(Math.max(financials?.progressPercentage || 0, 0), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Project Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Start Date</span>
                      <span className="font-medium text-slate-800">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected End</span>
                      <span className="font-medium text-slate-800">{new Date(project.expectedEndDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contract Type</span>
                      <span className="font-medium text-slate-800">{project.contractType || 'ITEM_RATE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Built-up Area</span>
                      <span className="font-medium text-slate-800">{project.totalBuiltUpArea || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot Size</span>
                      <span className="font-medium text-slate-800">{project.plotSize || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Number of Floors</span>
                      <span className="font-medium text-slate-800">{project.numberOfFloors || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Compliance & Commercials</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Building Permit No</span>
                      <span className="font-medium text-slate-800">{project.buildingPermitNo || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RERA Reg. No</span>
                      <span className="font-medium text-slate-800">{project.reraRegistrationNo || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Defect Liability Period</span>
                      <span className="font-medium text-slate-800">{project.defectLiabilityPeriod || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Terms</span>
                      <span className="font-medium text-slate-800">{project.paymentTerms || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Daily Report Submitted</p>
                        <p className="text-xs text-slate-500">By Rahul Sharma • 2 hrs ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Material Inward: Steel</p>
                        <p className="text-xs text-slate-500">10 MT TMT Bars • Yesterday</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">RA Bill #4 Generated</p>
                        <p className="text-xs text-slate-500">By Accountant • Oct 20</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />
          
          <Route path="boq" element={<BOQ isProjectView={true} />} />
          <Route path="site-reports" element={<SiteReports isProjectView={true} />} />
          <Route path="tasks" element={<Tasks isProjectView={true} />} />
          <Route path="materials" element={<Materials isProjectView={true} />} />
          <Route path="labour" element={<Labour isProjectView={true} />} />
          <Route path="expenses" element={<Expenses isProjectView={true} />} />
          <Route path="measurements" element={<Measurements isProjectView={true} />} />
          <Route path="billing" element={<Billing isProjectView={true} />} />
          <Route path="documents" element={<Documents isProjectView={true} />} />
          <Route path="team" element={<Team isProjectView={true} />} />
          <Route path="estimations" element={<Estimations />} />
          
          {/* Catch all for unimplemented tabs */}
          <Route path="*" element={
            <div className="card p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚧</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Module Under Construction</h3>
              <p className="text-slate-500 max-w-md mx-auto">This section is part of the future development phase.</p>
            </div>
          } />
        </Routes>
      </div>

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Edit Project Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-8">
                
                {/* Basic Info */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Project Name</label>
                      <input type="text" className="input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="PLANNING">PLANNING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ON_HOLD">ON_HOLD</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Location</label>
                      <input type="text" className="input" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Client</label>
                      <select className="input" value={formData.clientId?._id || formData.clientId || ''} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                        <option value="">Select a Client</option>
                        {clients.map(c => (
                          <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Project Manager</label>
                      <select className="input" value={formData.projectManagerId?._id || formData.projectManagerId || ''} onChange={e => setFormData({...formData, projectManagerId: e.target.value})}>
                        <option value="">Select a Manager</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Start Date</label>
                      <input type="date" className="input" value={formData.startDate ? formData.startDate.split('T')[0] : ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Expected End Date</label>
                      <input type="date" className="input" value={formData.expectedEndDate ? formData.expectedEndDate.split('T')[0] : ''} onChange={e => setFormData({...formData, expectedEndDate: e.target.value})} />
                    </div>
                  </div>
                </section>

                {/* Advanced Construction Info */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Site & Structural Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Total Built-up Area</label>
                      <input type="text" className="input" placeholder="e.g. 45,000 sq ft" value={formData.totalBuiltUpArea || ''} onChange={e => setFormData({...formData, totalBuiltUpArea: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Plot Size</label>
                      <input type="text" className="input" placeholder="e.g. 2 Acres" value={formData.plotSize || ''} onChange={e => setFormData({...formData, plotSize: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Number of Floors</label>
                      <input type="number" className="input" placeholder="e.g. 5" value={formData.numberOfFloors || ''} onChange={e => setFormData({...formData, numberOfFloors: e.target.value})} />
                    </div>
                  </div>
                </section>

                {/* Commercial & Compliance Info */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Commercials & Compliance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Contract Type</label>
                      <select className="input" value={formData.contractType || ''} onChange={e => setFormData({...formData, contractType: e.target.value})}>
                        <option value="ITEM_RATE">Item Rate (BOQ)</option>
                        <option value="LUMPSUM">Lumpsum</option>
                        <option value="TURNKEY">Turnkey</option>
                        <option value="EPC">EPC</option>
                        <option value="COST_PLUS">Cost Plus</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Contract Value (₹)</label>
                      <input type="number" className="input" value={formData.contractValue || ''} onChange={e => setFormData({...formData, contractValue: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Payment Terms</label>
                      <input type="text" className="input" placeholder="e.g. Net 30, RA Billing" value={formData.paymentTerms || ''} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Defect Liability Period</label>
                      <input type="text" className="input" placeholder="e.g. 12 Months" value={formData.defectLiabilityPeriod || ''} onChange={e => setFormData({...formData, defectLiabilityPeriod: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Building Permit No.</label>
                      <input type="text" className="input" value={formData.buildingPermitNo || ''} onChange={e => setFormData({...formData, buildingPermitNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">RERA Reg. No.</label>
                      <input type="text" className="input" value={formData.reraRegistrationNo || ''} onChange={e => setFormData({...formData, reraRegistrationNo: e.target.value})} />
                    </div>
                  </div>
                </section>

              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl sticky bottom-0">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
