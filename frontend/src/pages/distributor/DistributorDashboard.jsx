import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Package, Users, Receipt, CreditCard, 
  ShoppingCart, Truck, AlertTriangle, ArrowRight, Plus, Calendar, 
  MapPin, Clock, CheckCircle2, ChevronRight, Phone, Fuel, Scale
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient, subtitle, trend }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 p-8 bg-gradient-to-bl ${gradient} opacity-20 rounded-bl-full transition-transform group-hover:scale-110`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs font-semibold text-slate-500 mt-2">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass} shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-xs relative z-10 bg-slate-50 p-1.5 rounded-lg w-max border border-slate-100 font-semibold">
        <span className={`flex items-center ${trend.positive ? 'text-amber-600' : 'text-red-500'}`}>
          {trend.positive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {trend.value}
        </span>
        <span className="text-slate-500 ml-2 font-medium">{trend.label}</span>
      </div>
    )}
  </div>
);

export default function DistributorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/distributor/dashboard');
        setData(res.data.data);
      } catch (error) {
        toast.error('Failed to load chicken distributor dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Loading live poultry distribution metrics...</p>
        </div>
      </div>
    );
  }

  const {
    todaySales = 0,
    todayWeight = 0,
    todayDeliveries = 0,
    todayPurchases = 0,
    todayPurchaseWeight = 0,
    todayCollections = 0,
    customerReceivable = 0,
    supplierPayable = 0,
    stockValue = 2450,
    expenses = 0,
    salesTrend = [],
    routeDistribution = [],
    vehicles = [],
    topDebtors = [],
    recentSales = [],
    recentPurchases = []
  } = data;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = user?.name ? user.name.split(' ')[0] : 'Poultry Partner';

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-amber-600 text-white px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase shadow-sm">
              Distributor OS
            </span>
            <span className="text-slate-500 text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" /> {todayStr}
            </span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Market Rate: ₹135 / KG
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Good Morning, {firstName}.
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium">
            Live wholesale broiler supply, route crates, and daily collections dashboard.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10 w-full xl:w-auto">
          <Link
            to="/distributor/sales"
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-amber-200 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> New Delivery Sale
          </Link>
          <Link
            to="/distributor/purchases"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <Truck className="w-4 h-4" /> Farm Inward
          </Link>
          <Link
            to="/distributor/payments"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-600" /> Collect Dues
          </Link>
        </div>
      </div>

      {/* Primary Commercial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Today's Sales Revenue" 
          value={`₹${(todaySales || 0).toLocaleString()}`} 
          subtitle={`${todayWeight || 0} KG Delivered (${todayDeliveries || 0} Trips)`}
          icon={TrendingUp} 
          colorClass="bg-amber-600 text-white shadow-lg shadow-amber-200"
          gradient="from-amber-200 to-transparent"
          trend={{ value: '+16.8%', label: 'vs yesterday', positive: true }}
        />
        <StatCard 
          title="Cash & UPI Collections" 
          value={`₹${(todayCollections || 0).toLocaleString()}`} 
          subtitle="Realized from meat shops"
          icon={Receipt} 
          colorClass="bg-emerald-600 text-white shadow-lg shadow-emerald-200"
          gradient="from-emerald-200 to-transparent"
          trend={{ value: '100% Verified', label: 'cleared in drawer', positive: true }}
        />
        <StatCard 
          title="Live Broiler Stock" 
          value={`${(stockValue || 0).toLocaleString()} KG`} 
          subtitle="Held in crates / holding bay"
          icon={Package} 
          colorClass="bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          gradient="from-indigo-200 to-transparent"
          trend={{ value: 'Healthy Batch', label: '0.4% shrinkage', positive: true }}
        />
        <StatCard 
          title="Customer Credit Due" 
          value={`₹${(customerReceivable || 0).toLocaleString()}`} 
          subtitle="Total outstanding from shops"
          icon={Users} 
          colorClass="bg-red-500 text-white shadow-lg shadow-red-200"
          gradient="from-red-200 to-transparent"
          trend={{ value: '3 Active Routes', label: 'credit accounts', positive: false }}
        />
      </div>

      {/* Secondary Operational Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/distributor/expenses')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">₹{(expenses || 0).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500">Trip Diesel & Operations</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/distributor/vehicles')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer group"
        >
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{vehicles.length || 1} Vehicle</p>
            <p className="text-xs font-semibold text-slate-500">Tata Ace Crate Carrier</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/distributor/purchases')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors cursor-pointer group"
        >
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">₹{(todayPurchases || 0).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500">Farm Purchases Today</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/distributor/suppliers')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-rose-300 transition-colors cursor-pointer group"
        >
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600 group-hover:bg-rose-100 transition-colors">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">₹{(supplierPayable || 0).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500">Breeder Farm Payable</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Weight Volume Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Poultry Sales & Delivery Volume</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">7-Day Dispatched Revenue (₹) vs Net Delivered Weight (KG)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></span> Revenue (₹)
              </span>
              <span className="flex items-center text-xs font-bold text-slate-600 ml-3">
                <span className="w-3 h-3 rounded-full bg-indigo-500 mr-1.5"></span> Weight (KG)
              </span>
            </div>
          </div>
          <div className="pt-6 flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="distSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="distWeightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={8} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6366f1', fontWeight: 600 }} tickFormatter={(val) => `${val}kg`} />
                <Tooltip 
                  formatter={(val, name) => [name === 'Delivered Weight' ? `${val} KG` : `₹${Number(val).toLocaleString()}`, name]}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#distSalesGrad)" />
                <Area yAxisId="right" type="monotone" dataKey="weight" name="Delivered Weight" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#distWeightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Route Distribution Donut */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col p-6">
          <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Route Distribution</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Delivery revenue by meat shop route</p>
            </div>
            <Link to="/distributor/customers" className="text-xs font-bold text-amber-600 hover:underline">
              Route Map &rarr;
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={routeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {routeDistribution.map((entry, index) => (
                    <Cell key={`route-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full space-y-2 mt-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              {routeDistribution.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                    <span className="text-slate-700">{r.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">₹{(r.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Lower Operational Command Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Live Delivery Invoices & Weight Slips */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Recent Route Deliveries</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Weight scale slips, shop billing & collection tags</p>
            </div>
            <Link 
              to="/distributor/sales" 
              className="text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-2 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              All Deliveries <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Shop Name & Route</th>
                  <th className="px-6 py-4">Net Weight & Rate</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map(sale => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {sale.saleNumber}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{sale.customer?.shopName || 'Retail Customer'}</p>
                      <p className="text-xs text-slate-400">{sale.customer?.route || 'City Central'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-amber-600" /> {sale.weight} KG
                      </p>
                      <p className="text-xs text-slate-500">₹{sale.sellingRate} / KG</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹{sale.netAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                        sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        sale.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center: Customer Debts & Carrier Fleet */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Collection Action Center
              </h2>
              <p className="text-xs font-semibold text-amber-700/80 mt-1">Top outstanding meat shop balances</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            
            {/* Top Debtors */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Shop Credit Balances</span>
                <Link to="/distributor/customers" className="text-xs font-bold text-amber-600 hover:underline">
                  All Shops
                </Link>
              </div>
              <div className="space-y-3">
                {topDebtors.map(debtor => (
                  <div key={debtor._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{debtor.shopName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {debtor.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-600 block">₹{debtor.currentDue?.toLocaleString()}</span>
                      <button 
                        onClick={() => navigate('/distributor/payments')}
                        className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-0.5 rounded shadow-sm transition-colors mt-1"
                      >
                        Receive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrier Fleet Status */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Carrier Logistics Fleet</span>
                <Link to="/distributor/vehicles" className="text-xs font-bold text-amber-600 hover:underline">
                  Vehicle Logs
                </Link>
              </div>
              {vehicles.map(veh => (
                <div key={veh._id} className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{veh.registrationNumber}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{veh.vehicleType}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    {veh.status}
                  </span>
                </div>
              ))}
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link to="/distributor/estimations" className="text-amber-700 hover:text-amber-800">
              Demand Estimations &rarr;
            </Link>
            <Link to="/distributor/reports" className="text-slate-600 hover:text-slate-900">
              Distribution Reports &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
