import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Tag, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function SupplierExpenses() {
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Rent',
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: ''
  });

  const EXPENSE_CATEGORIES = [
    'Rent', 'Salary & Wages', 'Electricity / Utilities', 
    'Transport & Fuel', 'Marketing', 'Maintenance', 'Office Supplies', 'Miscellaneous'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/supplier/expenses');
      setExpenses(res.data.data.expenses);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/supplier/expenses', formData);
      toast.success('Expense recorded successfully');
      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense record?',
      confirmText: 'Delete'
    });
    
    if (isConfirmed) {
      try {
        await api.delete(`/supplier/expenses/${id}`);
        toast.success('Expense deleted');
        fetchExpenses();
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Rent',
      amount: '',
      paymentMode: 'BANK_TRANSFER',
      date: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      description: ''
    });
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operating Expenses</h1>
          <p className="text-slate-500">Track your business overheads and day-to-day spending.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Filtered Total Expense</p>
            <p className="text-2xl font-bold text-slate-800">₹{totalExpense.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Expense Records</p>
            <p className="text-2xl font-bold text-slate-800">{filteredExpenses.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by category or description..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Category & Details</th>
                <th className="px-6 py-4">Payment Info</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading expenses...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No expenses recorded.</td></tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{expense.category}</div>
                      {expense.description && <div className="text-xs text-slate-500 truncate max-w-xs">{expense.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{expense.paymentMode.replace('_', ' ')}</div>
                      {expense.referenceNumber && <div className="text-xs text-slate-500">Ref: {expense.referenceNumber}</div>}
                      <div className="text-xs font-semibold text-slate-400 mt-1">{new Date(expense.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {expense.recordedBy?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-red-600">₹{expense.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(expense._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Record Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select required className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input required type="number" min="1" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="input" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input required type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Reference Number / UTR</label>
                <input type="text" className="input" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} />
              </div>

              <div>
                <label className="label">Description / Notes</label>
                <textarea className="input min-h-[80px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 flex-1">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
