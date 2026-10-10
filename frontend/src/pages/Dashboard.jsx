import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Briefcase, IndianRupee, TrendingDown, AlertCircle, ArrowRight,
  Calendar, Clock, TrendingUp, Wallet,
  HardHat, Truck, FileText, Activity, CloudSun, MapPin,
  Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Reusable Stat Card
const StatCard = ({ title, value, icon: Icon, trend, colorClass, gradient }) => (
  <div className={`rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden bg-white group hover:shadow-md transition-shadow`}>
    <div className={`absolute top-0 right-0 p-8 bg-gradient-to-bl ${gradient} opacity-20 rounded-bl-full transition-transform group-hover:scale-110`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
    {trend && (
      <div className="mt-5 flex items-center text-sm relative z-10 bg-slate-50/50 p-2 rounded-lg w-max border border-slate-100">
        <span className={`font-bold flex items-center ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {trend.value}
        </span>
        <span className="text-slate-500 ml-2 font-medium">{trend.label}</span>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [weatherData, setWeatherData] = useState({
    temp: '--',
    condition: 'Loading weather...',
    Icon: CloudSun,
    color: 'text-amber-500'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Dashboard Data with Date Range
        const [dashRes, projRes] = await Promise.all([
          api.get(`/dashboard/overview?range=${dateRange}`),
          api.get('/projects')
        ]);

        const dbKpis = dashRes.data.data.kpis;
        // const dbReports = dashRes.data.data.recentSiteReports;
        const dbProjects = projRes.data.data.projects;

        const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(2)} L`;

        setDashboardData({
          kpis: {
            totalProjects: dbKpis.totalProjects,
            activeProjects: dbKpis.activeProjects,
            projectValue: formatCurrency(dbKpis.totalContractValue),
            totalExpense: formatCurrency(dbKpis.totalExpenses),
            amountReceivable: formatCurrency(dbKpis.totalOutstanding),
            expectedProfit: formatCurrency(dbKpis.expectedProfit),
          },
          activeProjects: dbProjects.filter(p => p.status === 'ACTIVE').slice(0, 5).map(p => ({
            id: p._id,
            name: p.name,
            location: p.location || 'Site Location',
            value: formatCurrency(p.contractValue),
            progress: Math.floor(Math.random() * 40) + 20, // Mock progress
            status: p.status === 'ACTIVE' ? 'In Progress' : 'Delayed'
          })),
          cashflowData: [
            { name: 'Jan', income: 45, expense: 30 },
            { name: 'Feb', income: 52, expense: 38 },
            { name: 'Mar', income: 61, expense: 42 },
            { name: 'Apr', income: 58, expense: 45 },
            { name: 'May', income: 75, expense: 50 },
            { name: 'Jun', income: 82, expense: 55 },
          ],
          projectStatusData: [
            { name: 'On Track', value: 12, color: '#10b981' },
            { name: 'Delayed', value: 3, color: '#f59e0b' },
            { name: 'Critical', value: 1, color: '#ef4444' },
            { name: 'Planning', value: 4, color: '#3b82f6' },
          ]
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const code = data.current_weather.weathercode;
        const temp = Math.round(data.current_weather.temperature);
        
        let condition = 'Clear';
        let Icon = Sun;
        let color = 'text-amber-500';

        if (code === 0) { condition = 'Clear Sky'; Icon = Sun; }
        else if (code === 1 || code === 2) { condition = 'Partly Cloudy'; Icon = CloudSun; }
        else if (code === 3) { condition = 'Overcast'; Icon = Cloud; color = 'text-slate-400'; }
        else if (code === 45 || code === 48) { condition = 'Foggy'; Icon = CloudFog; color = 'text-slate-400'; }
        else if (code >= 51 && code <= 57) { condition = 'Drizzle'; Icon = CloudDrizzle; color = 'text-blue-400'; }
        else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { condition = 'Rainy'; Icon = CloudRain; color = 'text-blue-500'; }
        else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { condition = 'Snow'; Icon = CloudSnow; color = 'text-sky-300'; }
        else if (code >= 95) { condition = 'Thunderstorm'; Icon = CloudLightning; color = 'text-purple-500'; }

        setWeatherData({
          temp: `${temp}°C`,
          condition,
          Icon,
          color
        });
      } catch (error) {
        console.error('Weather fetch error:', error);
        setWeatherData({ temp: '--', condition: 'Weather unavailable', Icon: CloudSun, color: 'text-slate-400' });
      }
    };

    // Get location and fetch weather
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        (error) => {
          // Fallback to a default location (e.g. Kolkata coordinates) if location is denied
          fetchWeather(22.5726, 88.3639);
        }
      );
    } else {
      fetchWeather(22.5726, 88.3639);
    }

    fetchDashboardData();
  }, [dateRange]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Gathering site intelligence...</p>
        </div>
      </div>
    );
  }

  const { kpis, activeProjects, cashflowData, projectStatusData } = dashboardData;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase shadow-sm">
              Contractor Portal
            </span>
            <span className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-500" /> {today}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Good Morning, Sahin.</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Here's your comprehensive command center for today.</p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 relative z-10 w-full xl:w-auto">
          <div className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-sm flex-1 sm:flex-none">
            <weatherData.Icon className={`w-10 h-10 ${weatherData.color} drop-shadow-sm`} />
            <div>
              <p className="text-base font-extrabold text-slate-800">{weatherData.temp}</p>
              <p className="text-xs font-semibold text-slate-500">{weatherData.condition}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl shadow-inner w-full sm:w-auto overflow-x-auto">
            {['Today', 'This Week', 'This Month'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                  dateRange === range 
                    ? 'bg-white text-primary-700 shadow-md ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Contract Value" 
          value={kpis.projectValue} 
          icon={Briefcase} 
          colorClass="bg-blue-600 text-white shadow-lg shadow-blue-200"
          gradient="from-blue-100 to-transparent"
          trend={{ value: '+12.5%', label: 'vs last quarter', positive: true }}
        />
        <StatCard 
          title="Total Expenses" 
          value={kpis.totalExpense} 
          icon={IndianRupee} 
          colorClass="bg-red-500 text-white shadow-lg shadow-red-200"
          gradient="from-red-100 to-transparent"
          trend={{ value: '+5.2%', label: 'vs last quarter', positive: false }}
        />
        <StatCard 
          title="Pending Receivables" 
          value={kpis.amountReceivable} 
          icon={Wallet} 
          colorClass="bg-amber-500 text-white shadow-lg shadow-amber-200"
          gradient="from-amber-100 to-transparent"
          trend={{ value: '-2.1%', label: 'vs last month', positive: true }}
        />
        <StatCard 
          title="Expected Profit" 
          value={kpis.expectedProfit} 
          icon={Activity} 
          colorClass="bg-emerald-500 text-white shadow-lg shadow-emerald-200"
          gradient="from-emerald-100 to-transparent"
          trend={{ value: '+18.4%', label: 'vs last quarter', positive: true }}
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-primary-200 transition-colors group cursor-pointer">
          <div className="bg-primary-50 p-4 rounded-xl text-primary-600 group-hover:bg-primary-100 transition-colors"><HardHat className="w-7 h-7" /></div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">482</p>
            <p className="text-sm font-semibold text-slate-500">Active Labour Today</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-amber-200 transition-colors group cursor-pointer">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors"><AlertCircle className="w-7 h-7" /></div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">8</p>
            <p className="text-sm font-semibold text-slate-500">Material Alerts</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-purple-200 transition-colors group cursor-pointer">
          <div className="bg-purple-50 p-4 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors"><FileText className="w-7 h-7" /></div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">12</p>
            <p className="text-sm font-semibold text-slate-500">Pending Approvals</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-sky-200 transition-colors group cursor-pointer">
          <div className="bg-sky-50 p-4 rounded-xl text-sky-600 group-hover:bg-sky-100 transition-colors"><Truck className="w-7 h-7" /></div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">5</p>
            <p className="text-sm font-semibold text-slate-500">Deliveries Today</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Cashflow Analytics</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Income vs Expenses (in Lakhs)</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-4 py-2 outline-none">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="p-6 flex-1">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">Project Portfolio</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Overall health & distribution</p>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
              <span className="text-4xl font-black text-slate-800">{kpis.totalProjects}</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Projects</span>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
              {projectStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm font-semibold text-slate-600">{entry.name}</span>
                  <span className="text-sm font-black text-slate-800 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Lists Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Projects Detailed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm xl:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Priority Sites Overview</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">High-value active projects status</p>
            </div>
            <button 
              onClick={() => navigate('/projects')}
              className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center bg-primary-50 px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-colors shadow-sm"
            >
              View All Sites <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-widest font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Project Details</th>
                  <th className="px-6 py-4">Contract Value</th>
                  <th className="px-6 py-4">Progress / Phase</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-extrabold text-slate-800 text-base group-hover:text-primary-600 transition-colors">{project.name}</p>
                      <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {project.location}
                      </p>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-700 text-base">{project.value}</td>
                    <td className="px-6 py-5">
                      <div className="w-full min-w-[200px]">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-600">Substructure</span>
                          <span className="font-black text-primary-600">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <div 
                            className="h-full rounded-full bg-primary-500 relative"
                            style={{ width: `${project.progress}%` }}
                          >
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${
                        project.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        project.status === 'Delayed' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status === 'In Progress' && <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>}
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center / Needs Attention */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-red-100 bg-red-50/50">
            <h2 className="text-xl font-extrabold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" /> Action Center
            </h2>
            <p className="text-sm font-semibold text-red-600/70 mt-1">Immediate Site & Financial Actions</p>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {/* 1. Critical Quality Snag */}
            <div 
              onClick={() => navigate('/snags')}
              className="p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="bg-red-100 p-3 rounded-xl text-red-600 h-fit shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-800">Critical Site Snags (2 Open)</p>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">BLOCKS POUR</span>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">Honeycombing Column C3 & Cover Blocks</p>
                <div className="mt-3 flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/snags'); }}
                    className="text-xs bg-red-600 text-white px-3.5 py-1.5 rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
                  >
                    Open Punch List
                  </button>
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md">Rectification Due Today</span>
                </div>
              </div>
            </div>
            
            {/* 2. Site Petty Cash Vouchers */}
            <div 
              onClick={() => navigate('/expenses')}
              className="p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600 h-fit shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-800">Supervisor Petty Cash Float</p>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">3 PENDING</span>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">Emergency repairs & local diesel vouchers</p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">₹7,000 Total</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/expenses'); }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                  >
                    1-Click Approve
                  </button>
                </div>
              </div>
            </div>

            {/* 3. GFC Drawing Revision Vault */}
            <div 
              onClick={() => navigate('/documents')}
              className="p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 h-fit shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-800">Active GFC Blueprints</p>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">4 APPROVED</span>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">STR-COL-004 (R2) & STR-FDN-001 (R1)</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Cube Pass: 100%</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/documents'); }}
                    className="text-xs bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                  >
                    Open Vault
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50/80 text-center border-t border-slate-100 flex items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/cashflow')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Project Cash Flow & P&L →
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => navigate('/equipment')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Machinery & Fuel Logs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
