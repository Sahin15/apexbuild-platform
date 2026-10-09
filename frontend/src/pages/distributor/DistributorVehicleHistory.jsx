import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, IndianRupee, History, Truck, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DistributorVehicleHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState(null);
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [id]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/distributor/expenses?vehicleId=${id}`);
      const fetchedExpenses = res.data.data.expenses;
      setExpenses(fetchedExpenses);
      if (fetchedExpenses.length > 0 && fetchedExpenses[0].vehicleId) {
        setVehicleData(fetchedExpenses[0].vehicleId);
      } else {
        // If no expenses, we might not have vehicle details. Let's just fetch it from vehicles API.
        const vRes = await api.get('/distributor/vehicles');
        const v = vRes.data.data.vehicles.find(v => v._id === id);
        if (v) setVehicleData(v);
      }
    } catch (error) {
      toast.error('Failed to load vehicle history');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (!startDate && !endDate) return true;
    const expDate = new Date(exp.date);
    const sDate = startDate ? new Date(startDate) : new Date(0);
    const eDate = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
    eDate.setHours(23, 59, 59, 999); // Include the whole end day
    return expDate >= sDate && expDate <= eDate;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/distributor/vehicles')} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Vehicles
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase">
                {vehicleData ? vehicleData.registrationNumber : 'Loading...'}
              </h1>
              <p className="text-sm font-bold text-slate-500">
                {vehicleData ? `${vehicleData.vehicleType} • ${vehicleData.capacity} KG` : 'Vehicle Expense History'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none px-2" />
          </div>
          <div className="w-px bg-slate-200 my-1"></div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">To Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none px-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter className="w-5 h-5 text-emerald-500" />
            Showing {filteredExpenses.length} entries
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Total in Period</p>
            <p className="text-2xl font-black text-red-500">₹{totalExpense.toLocaleString()}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-16 text-center">
            <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No expenses found</h3>
            <p className="text-slate-500">Try adjusting your date filters or log a new expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-bold uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Category</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Description</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Payment Method</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(exp.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {exp.description || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${exp.paymentMethod === 'CASH' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-black text-slate-800 text-lg">
                        <IndianRupee className="w-4 h-4 text-slate-400" />
                        {exp.amount.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
