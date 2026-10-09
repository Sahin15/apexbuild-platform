import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileSpreadsheet, 
  IndianRupee,
  Search,
  Filter,
  Plus
} from 'lucide-react';

export default function Billing({ isProjectView = false }) {
  const [bills, setBills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    billNo: '',
    period: '',
    grossAmount: '',
    retentionPercentage: 5
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      let endpoint = '/billing/ra-bills';
      if (isProjectView) {
        const projectId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${projectId}/billing/ra-bills`;
      }
      const res = await api.get(endpoint);
      setBills(res.data.data.bills);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data.projects);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBills();
    if (!isProjectView) {
      fetchProjects();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '/billing/ra-bills';
      if (isProjectView) {
        const projectId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${projectId}/billing/ra-bills`;
      }
      await api.post(endpoint, formData);
      toast.success('Bill generated successfully');
      setIsModalOpen(false);
      setFormData({ projectId: '', billNo: '', period: '', grossAmount: '', retentionPercentage: 5 });
      fetchBills();
    } catch (error) {
      toast.error('Failed to generate bill');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/billing/ra-bills/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchBills();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const totalBilled = bills.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netPayable, 0);
  const totalPending = bills.filter(b => ['SUBMITTED', 'APPROVED'].includes(b.status)).reduce((sum, b) => sum + b.netPayable, 0);
  const totalRetention = bills.reduce((sum, b) => sum + b.retentionAmount, 0);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing & RA Bills</h1>
          <p className="text-slate-500">Manage client bills, subcontractor payments, and retentions.</p>
        </div>
        <button className="btn btn-primary text-sm flex items-center" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create RA Bill
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Total Billed</p>
          <p className="font-bold text-slate-800 text-2xl">{formatCurrency(totalBilled)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Total Paid (Net)</p>
          <p className="font-bold text-emerald-600 text-2xl">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Pending/Receivable</p>
          <p className="font-bold text-orange-600 text-2xl">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Retention Held</p>
          <p className="font-bold text-slate-600 text-2xl">{formatCurrency(totalRetention)}</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search bills..." className="input pl-10" />
          </div>
          <button className="btn btn-secondary text-sm flex items-center gap-2"><Filter className="w-4 h-4"/> Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Bill No</th>
                {!isProjectView && <th className="px-6 py-4 font-medium">Project</th>}
                <th className="px-6 py-4 font-medium">Period</th>
                <th className="px-6 py-4 font-medium text-right">Gross Amount (₹)</th>
                <th className="px-6 py-4 font-medium text-right">Net Payable (₹)</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.length > 0 ? bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{bill.billNo}</td>
                  {!isProjectView && <td className="px-6 py-4 font-medium text-slate-800">{bill.projectId?.name}</td>}
                  <td className="px-6 py-4 text-slate-600">{bill.period}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(bill.grossAmount)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(bill.netPayable)}</td>
                  <td className="px-6 py-4 text-center">
                    <select
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 focus:ring-0 cursor-pointer ${
                        bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                        bill.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                      value={bill.status}
                      onChange={(e) => handleStatusChange(bill._id, e.target.value)}
                    >
                      <option value="DRAFT" className="bg-white text-slate-800">DRAFT</option>
                      <option value="SUBMITTED" className="bg-white text-slate-800">SUBMITTED</option>
                      <option value="APPROVED" className="bg-white text-slate-800">APPROVED</option>
                      <option value="PAID" className="bg-white text-slate-800">PAID</option>
                    </select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Loading bills...' : 'No bills found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add RA Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Generate RA Bill</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">RA Bill Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. RA-01"
                    value={formData.billNo}
                    onChange={e => setFormData({...formData, billNo: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="label">Billing Period <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. Oct 2023"
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Gross Amount (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className="input" 
                    required 
                    min="1" 
                    value={formData.grossAmount} 
                    onChange={e => setFormData({...formData, grossAmount: e.target.value === '' ? '' : Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="label">Retention %</label>
                  <input 
                    type="number" 
                    className="input"
                    min="0"
                    max="100" 
                    value={formData.retentionPercentage} 
                    onChange={e => setFormData({...formData, retentionPercentage: e.target.value === '' ? '' : Number(e.target.value)})} 
                  />
                </div>
              </div>

              {formData.grossAmount > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Gross:</span>
                    <span className="font-medium">₹{formData.grossAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500 mb-2 border-b border-slate-200 pb-2">
                    <span>- Retention ({formData.retentionPercentage || 0}%):</span>
                    <span>-₹{((formData.grossAmount * (formData.retentionPercentage || 0)) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Net Payable:</span>
                    <span className="text-emerald-600">
                      ₹{(formData.grossAmount - ((formData.grossAmount * (formData.retentionPercentage || 0)) / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save RA Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
