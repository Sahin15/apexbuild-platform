import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, Users, Receipt, CreditCard, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function SupplierDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: '₹0',
    todayPurchases: '₹0',
    todayCollections: '₹0',
    customerReceivable: '₹0',
    supplierPayable: '₹0',
    stockValue: '₹0'
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            setWeather(data.current_weather);
          } catch (error) {
            console.error("Failed to fetch weather", error);
          }
        });
      }
    };
    fetchWeather();
    const fetchStats = async () => {
      try {
        const res = await api.get('/supplier/dashboard');
        const data = res.data.data.stats;
        setStats({
          todaySales: `₹${data.todaySales.toLocaleString()}`,
          todayPurchases: `₹${data.todayPurchases.toLocaleString()}`,
          todayCollections: `₹${data.todayCollections.toLocaleString()}`,
          customerReceivable: `₹${data.customerReceivable.toLocaleString()}`,
          supplierPayable: `₹${data.supplierPayable.toLocaleString()}`,
          stockValue: `₹${data.stockValue.toLocaleString()}`
        });
        setLowStockItems(res.data.data.lowStockItems || []);
        setOutstandingDues(res.data.data.outstandingDues || []);
        setRecentOrders(res.data.data.recentOrders || []);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supplier Dashboard</h1>
          <p className="text-slate-500">Welcome to your trading control center.</p>
        </div>
        {weather && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-slate-800">{weather.temperature}°C</div>
            <div className="text-sm text-slate-500">
              Wind: {weather.windspeed} km/h
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Today's Sales" value={stats.todaySales} icon={TrendingUp} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Today's Purchases" value={stats.todayPurchases} icon={ShoppingCart} colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Today's Collections" value={stats.todayCollections} icon={Receipt} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Customer Receivable" value={stats.customerReceivable} icon={Users} colorClass="bg-red-50 text-red-600" />
        <StatCard title="Supplier Payable" value={stats.supplierPayable} icon={CreditCard} colorClass="bg-purple-50 text-purple-600" />
        <StatCard title="Current Stock Value" value={stats.stockValue} icon={Package} colorClass="bg-slate-100 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Sales Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No recent orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">Order #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="py-3 text-slate-600">{order.customer?.name}</td>
                      <td className="py-3 font-bold text-slate-700">₹{order.grandTotal.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 
                          order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Low Stock Alerts</h2>
            {lowStockItems.length === 0 ? (
              <div className="text-center text-slate-500 py-4">Stock levels are healthy.</div>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map(item => (
                  <li key={item._id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="font-medium text-red-800 text-sm truncate pr-2">{item.name}</span>
                    <span className="font-bold text-red-600 text-sm shrink-0">{item.currentStock} {item.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Top Outstanding Dues</h2>
            {outstandingDues.length === 0 ? (
              <div className="text-center text-slate-500 py-4">All clear.</div>
            ) : (
              <ul className="space-y-3">
                {outstandingDues.map(due => (
                  <li key={due._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 text-sm truncate">{due.name}</p>
                      <p className="text-xs text-slate-500">{due.phone}</p>
                    </div>
                    <span className="font-bold text-amber-600 text-sm shrink-0">₹{due.currentDue.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
