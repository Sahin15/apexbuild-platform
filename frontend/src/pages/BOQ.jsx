import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Download,
  Upload,
  MoreHorizontal
} from 'lucide-react';

export default function BOQ({ isProjectView }) {
  const { id: projectId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [boqItems, setBoqItems] = useState([]);
  const [boqMetadata, setBoqMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    projectId: '',
    section: 'Earthwork',
    item: '',
    unit: '',
    quantity: '',
    rate: ''
  });

  const fetchBOQ = async (pId) => {
    if (!pId) {
      setBoqItems([]);
      setBoqMetadata(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/projects/${pId}/boq`);
      setBoqItems(res.data.data.items || []);
      setBoqMetadata(res.data.data.boq);
    } catch (error) {
      toast.error('Failed to load BOQ data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isProjectView) {
      api.get('/projects').then(res => setProjects(res.data.data.projects)).catch(console.error);
    }
  }, [isProjectView]);

  useEffect(() => {
    fetchBOQ(selectedProjectId);
  }, [selectedProjectId]);

  const handleCreateBOQItem = async (e) => {
    e.preventDefault();
    try {
      const targetProjectId = isProjectView ? projectId : formData.projectId;
      if (!targetProjectId) {
        toast.error('Please select a project in the form');
        return;
      }
      const payload = {
        projectId: targetProjectId,
        name: boqMetadata?.name || 'Master BOQ',
        version: boqMetadata?.version || '1.0',
        items: [{
          sectionId: formData.section,
          description: formData.item,
          unit: formData.unit,
          quantity: Number(formData.quantity) || 0,
          rate: Number(formData.rate) || 0
        }]
      };

      await api.post(`/projects/${targetProjectId}/boq`, payload);
      
      toast.success('BOQ Item added successfully');
      setIsAddModalOpen(false);
      setFormData({ projectId: '', section: 'Earthwork', item: '', unit: '', quantity: '', rate: '' });
      if (selectedProjectId === targetProjectId) {
        fetchBOQ(selectedProjectId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const groupedBoq = boqItems.reduce((acc, item) => {
    const sec = item.sectionId || 'General';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const totalAmount = boqItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const actualCost = boqItems.reduce((sum, item) => sum + ((item.completedQuantity || 0) * (item.rate || 0)), 0);

  if (loading && isProjectView) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading BOQ data...</div>;
  }

  return (
    <div className={isProjectView ? "" : "space-y-6"}>
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bill of Quantities</h1>
            <p className="text-slate-500">Manage master BOQ and estimates.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-sm">
              <Upload className="w-4 h-4 mr-2" /> Import Excel
            </button>
          </div>
        </div>
      )}

      {!isProjectView && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
          <label className="font-medium text-slate-700 whitespace-nowrap">Select Project:</label>
          <select 
            className="input max-w-sm"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- Choose a Project --</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Toolbar */}
      <div className={`bg-white p-4 rounded-t-lg border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center ${isProjectView ? 'rounded-lg border shadow-sm mb-4' : 'shadow-sm border'}`}>
        <div className="flex-1 w-full max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="btn btn-secondary flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="btn btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          {!isProjectView && (
            <button 
              className="btn btn-primary text-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </button>
          )}
          {isProjectView && (
            <button 
              className="btn btn-primary text-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </button>
          )}
        </div>
      </div>

      {selectedProjectId ? (
        <>
          {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Estimated Cost</p>
          <p className="font-bold text-slate-800 text-lg">₹{(totalAmount).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Revised Cost</p>
          <p className="font-bold text-slate-800 text-lg">₹{(totalAmount).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Actual Cost</p>
          <p className="font-bold text-emerald-600 text-lg">₹{(actualCost).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Variance</p>
          <p className="font-bold text-primary-600 text-lg">On Track</p>
        </div>
      </div>

      {/* BOQ Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center">#</th>
                <th className="px-4 py-3 font-medium">Item Description</th>
                <th className="px-4 py-3 font-medium text-center">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium text-right">Rate (₹)</th>
                <th className="px-4 py-3 font-medium text-right">Amount (₹)</th>
                <th className="px-4 py-3 font-medium text-right">Completed</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedBoq).map(([section, items], sectionIndex) => (
                <React.Fragment key={section}>
                  {/* Section Header */}
                  <tr className="bg-slate-50/50">
                    <td colSpan={8} className="px-4 py-2 font-bold text-slate-700">
                      {sectionIndex + 1}.0 {section}
                    </td>
                  </tr>
                  {/* Items */}
                  {items.map((item, index) => {
                    if (searchTerm && !item.description?.toLowerCase().includes(searchTerm.toLowerCase())) return null;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-500">{sectionIndex + 1}.{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-normal min-w-[200px]">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.unit}</td>
                        <td className="px-4 py-3 text-right font-medium">{(item.quantity || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(item.rate || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700">{(item.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-emerald-600">{(item.completedQuantity || 0).toLocaleString('en-IN')}</span>
                            <span className="text-xs text-slate-400">
                              {item.quantity ? Math.round(((item.completedQuantity || 0) / item.quantity) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={5} className="px-4 py-4 text-right text-slate-700">Total Estimated Cost</td>
                <td className="px-4 py-4 text-right text-lg text-slate-800">₹{(totalAmount).toLocaleString('en-IN')}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Select a Project to View BOQ</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Bill of Quantities are project-specific. Please select a project from the dropdown above to view or edit its BOQ.
          </p>
        </div>
      )}

      {/* Add BOQ Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Add BOQ Item</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateBOQItem} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {!isProjectView && (
                    <div>
                      <label className="label">Select Project <span className="text-red-500">*</span></label>
                      <select 
                        className="input" 
                        required
                        value={formData.projectId} 
                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                      >
                        <option value="">-- Choose Project --</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="label">Section</label>
                    <select className="input" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                      <option value="Earthwork">Earthwork</option>
                      <option value="Concrete Work">Concrete Work</option>
                      <option value="Brickwork">Brickwork</option>
                      <option value="Finishing">Finishing</option>
                      <option value="Steel Work">Steel Work</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Item Description <span className="text-red-500">*</span></label>
                    <textarea required className="input min-h-[100px]" placeholder="e.g. Earthwork in excavation..." value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Unit <span className="text-red-500">*</span></label>
                      <input required type="text" className="input" placeholder="e.g. Cum, Sqm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Quantity <span className="text-red-500">*</span></label>
                      <input required type="number" className="input" placeholder="0.00" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Rate (₹) <span className="text-red-500">*</span></label>
                      <input required type="number" className="input" placeholder="0.00" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Total Amount</label>
                      <input type="number" className="input bg-slate-50" readOnly value={(Number(formData.quantity) * Number(formData.rate)) || 0} />
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
