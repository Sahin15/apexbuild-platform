import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Ruler, Search, Filter, Plus, Edit2 } from 'lucide-react';

export default function Measurements({ isProjectView }) {
  const { id: routeProjectId } = useParams();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMeasurementId, setEditMeasurementId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [boqItems, setBoqItems] = useState([]);
  const [formData, setFormData] = useState({
    projectId: routeProjectId || '',
    boqItemId: '',
    mbRef: '',
    date: new Date().toISOString().split('T')[0],
    quantity: ''
  });

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const endpoint = (isProjectView && routeProjectId) ? `/billing/measurements?projectId=${routeProjectId}` : '/billing/measurements';
      const res = await api.get(endpoint);
      setMeasurements(res.data.data.measurements);
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
        setProjects(res.data.data.projects);
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    fetchMeasurements();
    fetchProjects();
    
    // Auto-fetch BOQ if we are in project view
    if (isProjectView && routeProjectId) {
      handleProjectChange(routeProjectId);
    }
  }, [routeProjectId, isProjectView]);

  const handleEditClick = (m) => {
    setEditMeasurementId(m._id);
    setFormData({
      projectId: m.projectId?._id || '',
      boqItemId: m.boqItemId?._id || '',
      mbRef: m.mbRef,
      date: new Date(m.date).toISOString().split('T')[0],
      quantity: m.quantity
    });
    // Need to load the BOQ items for this project so the dropdown populates
    if (m.projectId?._id) {
      handleProjectChange(m.projectId._id, true);
    }
    setIsModalOpen(true);
  };

  const handleProjectChange = async (projectId, skipReset = false) => {
    if (!skipReset) {
      setFormData({ ...formData, projectId, boqItemId: '' });
    }
    if (!projectId) {
      setBoqItems([]);
      return;
    }
    try {
      const res = await api.get(`/projects/${projectId}/boq`);
      setBoqItems(res.data.data.items || []);
    } catch (error) {
      toast.error('Failed to load BOQ items');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        projectId: isProjectView ? routeProjectId : formData.projectId
      };
      
      if (editMeasurementId) {
        await api.put(`/billing/measurements/${editMeasurementId}`, payload);
        toast.success('Measurement updated successfully');
      } else {
        await api.post('/billing/measurements', payload);
        toast.success('Measurement recorded successfully');
      }
      
      setIsModalOpen(false);
      setEditMeasurementId(null);
      setFormData({ 
        projectId: routeProjectId || '', 
        boqItemId: '', 
        mbRef: '', 
        date: new Date().toISOString().split('T')[0], 
        quantity: '' 
      });
      fetchMeasurements();
    } catch (error) {
      toast.error('Failed to record measurement');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/billing/measurements/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchMeasurements();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className={isProjectView ? "" : "space-y-6"}>
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Measurements (MB)</h1>
            <p className="text-slate-500">Record site measurements and link to BOQ items.</p>
          </div>
          <button className="btn btn-primary text-sm flex items-center" onClick={() => {
            setEditMeasurementId(null);
            setFormData({ projectId: '', boqItemId: '', mbRef: '', date: new Date().toISOString().split('T')[0], quantity: '' });
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Add Measurement
          </button>
        </div>
      )}

      <div className={`bg-white rounded-lg overflow-hidden ${isProjectView ? 'shadow-sm border border-slate-200 mt-4' : 'shadow-sm border border-slate-200'}`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search measurements..." className="input pl-10" />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary text-sm flex items-center gap-2"><Filter className="w-4 h-4"/> Filter</button>
            {isProjectView && (
              <button className="btn btn-primary text-sm flex items-center" onClick={() => {
                setEditMeasurementId(null);
                setFormData({ projectId: routeProjectId || '', boqItemId: '', mbRef: '', date: new Date().toISOString().split('T')[0], quantity: '' });
                setIsModalOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Measurement
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">MB Ref</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Work Item</th>
                <th className="px-6 py-4 font-medium">BOQ Ref</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements.length > 0 ? measurements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-primary-600">{m.mbRef}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(m.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{m.projectId?.name}</td>
                  <td className="px-6 py-4 text-slate-600">{m.boqItemId?.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 text-center">{m.boqItemId?.itemCode || m.boqItemId?.sectionId || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-medium">{m.quantity} <span className="text-slate-400 font-normal">{m.boqItemId?.unit}</span></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 focus:ring-0 cursor-pointer ${
                          m.status === 'BILLED' ? 'bg-emerald-100 text-emerald-700' : 
                          m.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}
                        value={m.status}
                        onChange={(e) => handleStatusChange(m._id, e.target.value)}
                      >
                        <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
                        <option value="VERIFIED" className="bg-white text-slate-800">VERIFIED</option>
                        <option value="BILLED" className="bg-white text-slate-800">BILLED</option>
                      </select>
                      <button 
                        onClick={() => handleEditClick(m)}
                        className="text-slate-400 hover:text-primary-600 transition-colors p-1"
                        title="Edit Measurement"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Loading measurements...' : 'No measurements found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">{editMeasurementId ? 'Edit MB Entry' : 'Add MB Entry'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">MB Reference <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. MB-1042"
                    value={formData.mbRef}
                    onChange={e => setFormData({...formData, mbRef: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="label">Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    className="input" 
                    required 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              {!isProjectView && (
                <div>
                  <label className="label">Select Project <span className="text-red-500">*</span></label>
                  <select 
                    className="input" 
                    required 
                    value={formData.projectId}
                    onChange={e => handleProjectChange(e.target.value)}
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              
              <div>
                <label className="label">Select BOQ Item <span className="text-red-500">*</span></label>
                <select 
                  className="input" 
                  required 
                  value={formData.boqItemId}
                  onChange={e => setFormData({...formData, boqItemId: e.target.value})}
                  disabled={(!isProjectView && !formData.projectId) || boqItems.length === 0}
                >
                  <option value="">{(!isProjectView && !formData.projectId) ? "Select a project first" : (boqItems.length === 0 ? "No BOQ Items Found" : "-- Choose BOQ Item --")}</option>
                  {boqItems.map(b => (
                    <option key={b._id} value={b._id}>{b.itemCode} - {b.description} ({b.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Measured Quantity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="input" 
                  required 
                  min="0.01" 
                  step="0.01"
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value === '' ? '' : Number(e.target.value)})} 
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMeasurementId ? 'Update Measurement' : 'Save Measurement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
