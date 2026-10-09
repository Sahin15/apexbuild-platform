import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Receipt,
  Search,
  Filter,
  Plus
} from 'lucide-react';

export default function Expenses({ isProjectView = false }) {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Material',
    materialType: 'Sand',
    quantity: '',
    unit: 'Truck',
    amount: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let endpoint = '/expenses';
      if (isProjectView) {
        const projectId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${projectId}/expenses`;
      }
      const res = await api.get(endpoint);
      setExpenses(res.data.data.expenses);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    if (!isProjectView) {
      api.get('/projects').then(res => setProjects(res.data.data.projects)).catch(console.error);
    }
  }, [isProjectView]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '/expenses';
      const payload = { ...formData };
      
      if (isProjectView) {
        const projectId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${projectId}/expenses`;
        delete payload.projectId; // backend will use params
      } else if (!payload.projectId) {
        delete payload.projectId; // Global expense
      }

      await api.post(endpoint, payload);
      toast.success('Expense recorded successfully');
      setIsModalOpen(false);
      setFormData({ projectId: '', date: new Date().toISOString().split('T')[0], description: '', category: 'Material', amount: '' });
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  const handleStatusChange = async (expenseId, newStatus) => {
    try {
      await api.patch(`/expenses/${expenseId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
          <p className="text-slate-500">Track petty cash, reimbursements, and site expenses.</p>
        </div>
        <button 
          className="btn btn-primary text-sm flex items-center"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search expenses..." className="input pl-10" />
          </div>
          <button className="btn btn-secondary text-sm flex items-center gap-2"><Filter className="w-4 h-4"/> Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Amount (₹)</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length > 0 ? expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{exp.projectId?.name || 'Office / General'}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-medium">{exp.description}</p>
                    {exp.category === 'Material' && exp.materialType && (
                      <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                        {exp.quantity} {exp.unit} of {exp.materialType}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(exp.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 focus:ring-0 cursor-pointer ${
                        exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' 
                        : exp.status === 'Rejected' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}
                      value={exp.status}
                      onChange={(e) => handleStatusChange(exp._id, e.target.value)}
                    >
                      <option value="Pending" className="bg-white text-slate-800">Pending</option>
                      <option value="Approved" className="bg-white text-slate-800">Approved</option>
                      <option value="Rejected" className="bg-white text-slate-800">Rejected</option>
                    </select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Loading expenses...' : 'No expenses found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Record Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {!isProjectView && (
                <div>
                  <label className="label">Project</label>
                  <select 
                    className="input" 
                    value={formData.projectId} 
                    onChange={e => setFormData({...formData, projectId: e.target.value})}
                  >
                    <option value="">-- Global Expense (No Project) --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
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

              <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="e.g. Diesel for generator"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select 
                    className="input" 
                    value={formData.category} 
                    onChange={e => {
                      const cat = e.target.value;
                      setFormData(prev => ({
                        ...prev, 
                        category: cat,
                        description: cat === 'Material' && prev.description === '' ? 'Material Purchase' : prev.description
                      }));
                    }}
                  >
                    <option>Material</option>
                    <option>Equipment</option>
                    <option>Transport</option>
                    <option>Labour</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className="input" 
                    required 
                    min="1" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value === '' ? '' : Number(e.target.value)})} 
                  />
                </div>
              </div>

              {formData.category === 'Material' && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-3 gap-3">
                  <div className="col-span-3 pb-1 border-b border-slate-200 mb-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Material Details</h4>
                  </div>
                  <div>
                    <label className="label text-xs">Type</label>
                    <select className="input text-sm" value={formData.materialType} onChange={e => setFormData({...formData, materialType: e.target.value})}>
                      <option>Sand</option>
                      <option>Brick</option>
                      <option>Reinforcement</option>
                      <option>Cement</option>
                      <option>Gravel</option>
                      <option>Soil</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Quantity</label>
                    <input type="number" className="input text-sm" required min="0.01" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="label text-xs">Unit</label>
                    <select className="input text-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      <option>Truck</option>
                      <option>Trolley</option>
                      <option>Bags</option>
                      <option>Kg</option>
                      <option>Ton</option>
                      <option>Ltr</option>
                      <option>Pcs</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
