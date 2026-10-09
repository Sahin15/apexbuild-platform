import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, Wallet, Banknote, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/supplier/reports/financials');
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading comprehensive reports...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Financial Reports & Analytics</h1>
        <p className="text-slate-500">Real-time overview of your business health.</p>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Revenue */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-700">Total Revenue</h3>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">₹{data.totalRevenue.toLocaleString()}</div>
                <div className="mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                  ₹{data.totalPaidRevenue.toLocaleString()} Collected
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-700">Operating Expenses</h3>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">₹{data.totalExpense.toLocaleString()}</div>
                <p className="mt-2 text-sm text-slate-500">Overhead costs (Rent, Salaries)</p>
              </div>
            </div>

            {/* Profit */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><Wallet className="w-5 h-5" /></div>
                  <h3 className="font-bold text-indigo-100">Simplified Gross Profit</h3>
                </div>
                <div className="text-3xl font-extrabold text-white">₹{data.grossProfit.toLocaleString()}</div>
                <p className="mt-2 text-sm text-indigo-300">Revenue - Expenses</p>
              </div>
            </div>

            {/* Inventory Valuation */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-700">Inventory Valuation</h3>
              </div>
              <div className="text-2xl font-bold text-slate-900">₹{data.inventoryValue.toLocaleString()}</div>
              <p className="text-sm text-slate-500">Total worth of current warehouse stock at Cost Price</p>
            </div>

            {/* Receivables */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-700">Total Receivables</h3>
              </div>
              <div className="text-2xl font-bold text-emerald-600">₹{data.totalReceivables.toLocaleString()}</div>
              <p className="text-sm text-slate-500">Money owed to you by Customers</p>
            </div>

            {/* Payables */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-700">Total Payables</h3>
              </div>
              <div className="text-2xl font-bold text-red-600">₹{data.totalPayables.toLocaleString()}</div>
              <p className="text-sm text-slate-500">Money you owe to Vendors</p>
            </div>

          </div>
          
          {/* Visual Insights Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-6">
            <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Detailed Analytics coming soon</h3>
            <p className="text-slate-500 max-w-lg mx-auto">
              In a future update, this section will include interactive Line charts for Revenue over time, Pie charts for Expense categories, and Aging reports for Receivables.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
