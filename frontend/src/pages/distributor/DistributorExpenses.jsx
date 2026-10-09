import { useState, useEffect } from 'react';
import { Plus, Search, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'PETROL',
    amount: '',
    description: '',
    paymentMethod: 'CASH',
    vehicleId: ''
  });

  const categories = ['PETROL', 'FOOD', 'TOLL', 'LABOUR', 'MAINTENANCE', 'OTHER'];

  const fetchExpenses = async () => {
    try {
      const [res, vRes] = await Promise.all([
        api.get('/distributor/expenses'),
        api.get('/distributor/vehicles')
      ]);
      setExpenses(res.data.data.expenses);
      setVehicles(vRes.data.data.vehicles);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.vehicleId) delete payload.vehicleId;
      await api.post('/distributor/expenses', payload);
      toast.success('Expense recorded successfully');
      setShowModal(false);
      setFormData({ category: 'PETROL', amount: '', description: '', paymentMethod: 'CASH', vehicleId: '' });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expense');
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Expenses</h1>
          <p className="text-slate-500">Track petrol, food, and other distribution costs.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-lg font-medium">
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex items-center gap-6 shadow-sm">
        <div className="bg-orange-600 p-4 rounded-xl text-white">
          <TrendingDown className="w-8 h-8" />
        </div>
        <div>
          <p className="text-orange-800 font-medium text-lg mb-1">Total (Filtered)</p>
          <h2 className="text-4xl font-black text-orange-600">₹{totalExpenses.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search category or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No expenses found</td></tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(expense.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {expense.category}
                      {expense.vehicleId && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] tracking-wide">
                          VEHICLE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-orange-600">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        {expense.paymentMethod}
                      </span>
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
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Record Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <CustomSelect 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  options={categories.map(c => ({ value: c, label: c }))}
                  required={true}
                  className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                />
              </div>

              {(formData.category === 'PETROL' || formData.category === 'MAINTENANCE' || formData.category === 'TOLL') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link to Vehicle</label>
                  <CustomSelect 
                    value={formData.vehicleId}
                    onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                    options={vehicles.map(v => ({ value: v._id, label: v.registrationNumber }))}
                    placeholder="-- No Vehicle --"
                    className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-xl font-bold text-slate-800" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="e.g. Fuel for truck" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paid Via</label>
                <CustomSelect 
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
                  ]}
                  className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white font-medium"
                />
              </div>
              
              <button type="submit" className="w-full py-3 mt-4 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-bold shadow-sm">
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
