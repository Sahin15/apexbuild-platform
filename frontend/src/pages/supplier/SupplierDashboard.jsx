import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Package, Users, Receipt, CreditCard, 
  ShoppingCart, Truck, AlertTriangle, ArrowRight, Plus, Calendar, 
  MapPin, Clock, CheckCircle2, ChevronRight, ShieldCheck, Phone
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
        <span className={`flex items-center ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.positive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {trend.value}
        </span>
        <span className="text-slate-500 ml-2 font-medium">{trend.label}</span>
      </div>
    )}
  </div>
);

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading weather...' });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=22.5726&longitude=88.3639&current_weather=true');
        const d = await res.json();
        setWeather({
          temp: `${Math.round(d.current_weather.temperature)}°C`,
          condition: 'Favorable Dispatch Conditions'
        });
      } catch (err) {
        setWeather({ temp: '28°C', condition: 'Clear Conditions' });
      }
    };
    fetchWeather();

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/supplier/dashboard');
        setData(res.data.data);
      } catch (error) {
        toast.error('Failed to load supplier dashboard statistics');
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
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Aggregating trading and fleet analytics...</p>
        </div>
      </div>
    );
  }

  const { 
    stats, 
    categoryDistribution = [], 
    salesTrend = [], 
    recentDeliveries = [], 
    lowStockItems = [], 
    outstandingDues = [], 
    recentOrders = [] 
  } = data;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = user?.name ? user.name.split(' ')[0] : 'Supplier Partner';

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase shadow-sm">
              Material Supplier OS
            </span>
            <span className="text-slate-500 text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> {todayStr}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Good Morning, {firstName}.
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium">
            Here is your live trading, warehousing, and dispatch command center.
          </p>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 shadow-inner">
            <div className="text-2xl font-black text-slate-800">{weather.temp}</div>
            <div className="text-xs font-semibold text-slate-500 leading-tight">
              {weather.condition}
            </div>
          </div>
          <Link
            to="/supplier/orders"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> New Order
          </Link>
          <Link
            to="/supplier/deliveries"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <Truck className="w-4 h-4" /> Issue Challan
          </Link>
        </div>
      </div>

      {/* Primary Commercial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Today's Billed Sales" 
          value={`₹${(stats.todaySales || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          colorClass="bg-emerald-600 text-white shadow-lg shadow-emerald-200"
          gradient="from-emerald-200 to-transparent"
          trend={{ value: '+14.2%', label: 'vs last week', positive: true }}
        />
        <StatCard 
          title="Today's Collections" 
          value={`₹${(stats.todayCollections || 0).toLocaleString()}`} 
          icon={Receipt} 
          colorClass="bg-blue-600 text-white shadow-lg shadow-blue-200"
          gradient="from-blue-200 to-transparent"
          trend={{ value: '+8.5%', label: 'realized today', positive: true }}
        />
        <StatCard 
          title="Customer Receivables" 
          value={`₹${(stats.customerReceivable || 0).toLocaleString()}`} 
          icon={Users} 
          colorClass="bg-amber-500 text-white shadow-lg shadow-amber-200"
          gradient="from-amber-200 to-transparent"
          trend={{ value: '₹8.6L Overdue', label: 'requires follow-up', positive: false }}
        />
        <StatCard 
          title="Total Stock Valuation" 
          value={`₹${(stats.stockValue || 0).toLocaleString()}`} 
          icon={Package} 
          colorClass="bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          gradient="from-indigo-200 to-transparent"
          trend={{ value: '3 Active Yards', label: 'warehouse bays', positive: true }}
        />
      </div>

      {/* Secondary Operational Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/supplier/deliveries')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-colors cursor-pointer group"
        >
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{stats.activeDeliveriesCount || 1}</p>
            <p className="text-xs font-semibold text-slate-500">Active Dispatches</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/supplier/deliveries')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer group"
        >
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{stats.totalVehicles || 2} Trucks</p>
            <p className="text-xs font-semibold text-slate-500">Fleet Transport Fleet</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/supplier/inventory')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{lowStockItems.length}</p>
            <p className="text-xs font-semibold text-slate-500">Low Stock Reorders</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/supplier/suppliers')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors cursor-pointer group"
        >
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">₹{(stats.supplierPayable || 0).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500">Mill / Vendor Payables</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Collections Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Sales & Collection Velocity</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">7-Day Dispatched Revenue vs Inward Cash Flow</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span> Sales
              </span>
              <span className="flex items-center text-xs font-bold text-slate-600 ml-3">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></span> Collections
              </span>
            </div>
          </div>
          <div className="pt-6 flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="supplierSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="supplierCollectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#supplierSalesGrad)" />
                <Area type="monotone" dataKey="collections" name="Collections" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#supplierCollectGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Valuation by Category Donut */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col p-6">
          <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Inventory Distribution</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Valuation by material class</p>
            </div>
            <Link to="/supplier/inventory" className="text-xs font-bold text-emerald-600 hover:underline">
              Full Ledger &rarr;
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Stock Value']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full space-y-2 mt-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              {categoryDistribution.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                    <span className="text-slate-700">{c.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">₹{(c.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Lower Operational Command Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Live Orders & Dispatches Queue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Recent Commercial Orders</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Dispatched shipments, tax invoices & site delivery status</p>
            </div>
            <Link 
              to="/supplier/orders" 
              className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Card List for Small Screens */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {recentOrders.map(order => (
              <div key={order._id} className="p-4 hover:bg-slate-50 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                    <span className="text-[11px] text-slate-400 font-medium ml-2">
                      {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                    order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{order.customer?.name}</p>
                    <p className="text-[11px] text-slate-400">{order.customer?.phone || 'Site Incharge'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">₹{order.grandTotal?.toLocaleString()}</p>
                    {order.dueAmount > 0 ? (
                      <p className="text-[11px] text-amber-600 font-bold">Due: ₹{order.dueAmount.toLocaleString()}</p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-bold">Paid</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order / Challan</th>
                  <th className="px-6 py-4">Customer & Site</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Due Balance</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{order.customer?.name}</p>
                      <p className="text-xs text-slate-400">{order.customer?.phone || 'Site Incharge'}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹{order.grandTotal?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      ₹{(order.dueAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'PROCESSING' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></div>}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center: Receivables & Low Stock */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Commercial Action Center
              </h2>
              <p className="text-xs font-semibold text-amber-700/80 mt-1">Pending collections & reorder thresholds</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            
            {/* Top Debtors */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">High Outstanding Dues</span>
                <Link to="/supplier/customers" className="text-xs font-bold text-emerald-600 hover:underline">
                  Manage Ledger
                </Link>
              </div>
              <div className="space-y-3">
                {outstandingDues.slice(0, 3).map(due => (
                  <div key={due._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{due.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {due.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-600 block">₹{due.currentDue.toLocaleString()}</span>
                      <button 
                        onClick={() => navigate('/supplier/payments')}
                        className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded shadow-sm transition-colors mt-1"
                      >
                        Record Pay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Warehouse Reorder Alerts</span>
                <Link to="/supplier/inventory" className="text-xs font-bold text-emerald-600 hover:underline">
                  View Stock
                </Link>
              </div>
              {lowStockItems.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All SKU inventory above critical safety thresholds.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowStockItems.slice(0, 3).map(item => (
                    <div key={item._id} className="p-3 bg-red-50/70 rounded-2xl border border-red-100 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <p className="font-extrabold text-slate-800 text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-red-600 font-bold mt-0.5">Threshold: {item.minStockLevel} {item.unit}</p>
                      </div>
                      <span className="font-black text-red-600 text-xs shrink-0 bg-red-100/80 px-2.5 py-1 rounded-lg">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link to="/supplier/quotations" className="text-emerald-700 hover:text-emerald-800">
              Draft Quotations &rarr;
            </Link>
            <Link to="/supplier/reports" className="text-slate-600 hover:text-slate-900">
              GST Tax Reports &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
