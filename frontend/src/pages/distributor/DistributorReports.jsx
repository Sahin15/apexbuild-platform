import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, Users, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DistributorReports() {
  const [activePreset, setActivePreset] = useState(30);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/distributor/reports/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setReportData(res.data.data);
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const handleDatePreset = (days) => {
    setActivePreset(days);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  if (loading && !reportData) {
    return <div className="flex justify-center p-12"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  const summary = reportData?.summary || {};
  const shopPerformance = reportData?.shopPerformance || [];

  return (
    <div className="space-y-4 md:space-y-6 w-full pb-24 md:pb-6 px-4 md:px-0">
      <div className="flex flex-col bg-slate-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black">Reports</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Financial & Shop Performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 relative z-10">
          <button onClick={() => handleDatePreset(0)} className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors ${activePreset === 0 ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>Today</button>
          <button onClick={() => handleDatePreset(7)} className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors ${activePreset === 7 ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>7 Days</button>
          <button onClick={() => handleDatePreset(30)} className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors ${activePreset === 30 ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>30 Days</button>
        </div>
        
        <div className="flex items-center gap-2 mt-4 bg-slate-800/80 border border-slate-700 rounded-xl p-2 relative z-10 w-full">
          <input type="date" value={dateRange.startDate} onChange={e => { setActivePreset(null); setDateRange({...dateRange, startDate: e.target.value})}} style={{ colorScheme: 'dark' }} className="bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 px-3 py-2 rounded-lg w-full" />
          <span className="text-slate-400 font-bold px-1 text-sm">TO</span>
          <input type="date" value={dateRange.endDate} onChange={e => { setActivePreset(null); setDateRange({...dateRange, endDate: e.target.value})}} style={{ colorScheme: 'dark' }} className="bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 px-3 py-2 rounded-lg w-full" />
        </div>
        
        <TrendingUp className="absolute right-[-20px] top-[-20px] w-40 h-40 text-slate-800 opacity-50 z-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sales</p>
          <h3 className="text-xl md:text-3xl font-black text-emerald-600">₹{summary.sales?.totalNet?.toLocaleString() || 0}</h3>
          <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">{summary.sales?.totalWeight || 0} KG</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Collections</p>
          <h3 className="text-xl md:text-3xl font-black text-blue-600">₹{summary.collections?.toLocaleString() || 0}</h3>
          <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Cash In</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchases</p>
          <h3 className="text-xl md:text-3xl font-black text-amber-600">₹{summary.purchases?.totalNet?.toLocaleString() || 0}</h3>
          <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">{summary.purchases?.totalWeight || 0} KG</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
          <h3 className="text-xl md:text-3xl font-black text-red-600">₹{summary.expenses?.toLocaleString() || 0}</h3>
          <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Cash Out</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart className="w-4 h-4 text-emerald-500" /> Top Shops by Sales
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shopPerformance.slice(0, 5)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="shopName" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="totalSales" name="Sales (₹)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mobile Card List for Shop Performance */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Shop Ledger & Dues
          </h3>
          <button onClick={() => window.print()} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm">
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {shopPerformance.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No shop data in this range.</div>
          ) : (
            shopPerformance.map((shop, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{shop.shopName}</h4>
                    <p className="text-xs text-slate-400 font-medium">{shop.route || 'No Route'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Live Due</p>
                    <p className="font-black text-red-500 text-lg leading-tight">₹{shop.currentDue?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-100/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Weight</p>
                    <p className="font-bold text-slate-700">{shop.totalWeight} <span className="text-[10px] font-normal">KG</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Sales</p>
                    <p className="font-bold text-slate-700">₹{shop.totalSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Paid</p>
                    <p className="font-bold text-emerald-600">₹{shop.totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
