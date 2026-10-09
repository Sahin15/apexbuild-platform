import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, Users, Receipt, CreditCard, ShoppingCart, Truck, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MiniStatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between mb-2">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right max-w-[80px] leading-tight">{title}</p>
    </div>
    <div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{value}</h3>
      {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{subtitle}</p>}
    </div>
  </div>
);

const LedgerCard = ({ title, amount, type }) => (
  <div className={`p-4 rounded-2xl flex items-center justify-between ${type === 'receivable' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'receivable' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'}`}>
        {type === 'receivable' ? <Users className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <p className={`text-xl font-black ${type === 'receivable' ? 'text-emerald-700' : 'text-amber-700'}`}>₹{amount?.toLocaleString() || 0}</p>
      </div>
    </div>
    <ArrowRight className={`w-5 h-5 ${type === 'receivable' ? 'text-emerald-400' : 'text-amber-400'}`} />
  </div>
);

export default function DistributorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayPurchases: 0,
    todayCollections: 0,
    customerReceivable: 0,
    supplierPayable: 0,
    stockValue: 0,
    expenses: 0,
    profit: 0,
    recentSales: [],
    recentPurchases: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/distributor/dashboard');
        setStats(res.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto">
      
      {/* Date & Quick Welcome */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-sm font-bold text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1 className="text-2xl font-black text-slate-800">Overview</h1>
        </div>
      </div>

      {/* Stock Alert */}
      {stats.stockValue < 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/distributor/purchases')}>
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Negative Stock Warning</h3>
            <p className="text-red-700 text-xs mt-1">Stock is {stats.stockValue} KG. You recorded more deliveries than purchases. Tap here to add missing purchases.</p>
          </div>
        </div>
      )}

      {/* Ledger Dues (High Priority) */}
      <div className="flex flex-col md:flex-row gap-3">
        <div onClick={() => navigate('/distributor/customers')} className="cursor-pointer active:scale-95 transition-transform flex-1">
          <LedgerCard title="Customer Due" amount={stats.customerReceivable} type="receivable" />
        </div>
        <div onClick={() => navigate('/distributor/suppliers')} className="cursor-pointer active:scale-95 transition-transform flex-1">
          <LedgerCard title="Supplier Due" amount={stats.supplierPayable} type="payable" />
        </div>
      </div>

      {/* 2x2 Grid for Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <MiniStatCard 
          title="Today Sales" 
          value={`₹${stats.todaySales?.toLocaleString() || 0}`} 
          icon={TrendingUp} 
          colorClass="bg-emerald-100 text-emerald-700" 
          subtitle="Total delivered" 
        />
        <MiniStatCard 
          title="Collection" 
          value={`₹${stats.todayCollections?.toLocaleString() || 0}`} 
          icon={Receipt} 
          colorClass="bg-blue-100 text-blue-700" 
          subtitle="Money received" 
        />
        <MiniStatCard 
          title="Current Stock" 
          value={`${stats.stockValue || 0} KG`} 
          icon={Package} 
          colorClass={stats.stockValue > 0 ? "bg-indigo-100 text-indigo-700" : "bg-red-100 text-red-700"} 
          subtitle="In inventory" 
        />
        <MiniStatCard 
          title="Today Expense" 
          value={`₹${stats.expenses?.toLocaleString() || 0}`} 
          icon={TrendingDown} 
          colorClass="bg-red-100 text-red-700" 
          subtitle="Daily costs" 
        />
      </div>

      {/* Recent Deliveries List */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <Truck className="w-4 h-4 mr-2 text-emerald-600" /> Recent Deliveries
          </h3>
          <Link to="/distributor/sales" className="text-xs font-bold text-emerald-600">See All</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.recentSales?.length > 0 ? (
            stats.recentSales.slice(0, 5).map(sale => (
              <div key={sale._id} className="p-4 flex justify-between items-center active:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{sale.customer?.shopName}</span>
                  <span className="text-[10px] font-bold text-slate-400">{sale.weight} KG • {sale.rate}/KG</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-black text-slate-800 text-sm">₹{sale.netAmount?.toLocaleString()}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold mt-1 ${sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">No deliveries today.</div>
          )}
        </div>
      </div>

      {/* Bottom Spacer for Mobile Nav */}
      <div className="h-4"></div>
    </div>
  );
}
