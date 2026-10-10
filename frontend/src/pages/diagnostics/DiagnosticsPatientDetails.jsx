import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Calendar, Activity, FileText, 
  Droplet, CreditCard, Clock, CheckCircle, AlertCircle,
  TrendingUp, Printer, QrCode, Shield, Check, X
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine 
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsPatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Cumulative Trends State
  const [trendsData, setTrendsData] = useState([]);
  const [selectedParam, setSelectedParam] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [uhidCardOpen, setUhidCardOpen] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'trends') {
      fetchTrends();
    }
  }, [activeTab, id]);

  const fetchTrends = async () => {
    try {
      setLoadingTrends(true);
      const res = await api.get(`/diagnostics/patients/${id}/cumulative-trends`);
      const params = res.data.data.parameters || [];
      setTrendsData(params);
      if (params.length > 0 && !selectedParam) {
        setSelectedParam(params[0]);
      }
    } catch (error) {
      console.error("Failed to fetch cumulative trends", error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      const res = await api.get(`/diagnostics/patients/${id}/full`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Patient not found</h3>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const { patient, orders, samples, results } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'trends', label: 'Cumulative Trends', icon: TrendingUp },
    { id: 'orders', label: 'Orders & Tests', icon: FileText, count: orders?.length || 0 },
    { id: 'samples', label: 'Samples', icon: Droplet, count: samples?.length || 0 },
    { id: 'results', label: 'Reports', icon: CheckCircle, count: results?.length || 0 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const renderStatus = (status) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Sample Collected': 'bg-indigo-100 text-indigo-800'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Profile</h1>
            <p className="text-sm text-gray-500">View comprehensive patient records and history</p>
          </div>
        </div>

        <button
          onClick={() => setUhidCardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          Print UHID Smart Card
        </button>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 shrink-0">
            {patient.firstName.charAt(0)}{patient.lastName?.charAt(0)}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100">
                {patient.patientId}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                <span>{patient.age} {patient.ageUnit} • {patient.gender}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" /> Personal Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div><dt className="text-gray-500">First Name</dt><dd className="font-medium text-gray-900">{patient.firstName}</dd></div>
                  <div><dt className="text-gray-500">Last Name</dt><dd className="font-medium text-gray-900">{patient.lastName || '-'}</dd></div>
                  <div><dt className="text-gray-500">Age</dt><dd className="font-medium text-gray-900">{patient.age} {patient.ageUnit}</dd></div>
                  <div><dt className="text-gray-500">Gender</dt><dd className="font-medium text-gray-900">{patient.gender}</dd></div>
                  <div><dt className="text-gray-500">Blood Group</dt><dd className="font-medium text-gray-900">{patient.bloodGroup || 'Not specified'}</dd></div>
                </dl>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" /> Contact Info
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div><dt className="text-gray-500">Mobile</dt><dd className="font-medium text-gray-900">{patient.phone}</dd></div>
                  <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{patient.email || '-'}</dd></div>
                  <div className="col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium text-gray-900">{patient.address || 'No address provided'}</dd></div>
                </dl>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Summary</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total Orders</p>
                      <p className="text-xs text-gray-500">Diagnostic requests</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{orders?.length || 0}</span>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Droplet className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Samples Collected</p>
                      <p className="text-xs text-gray-500">Bio samples logged</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{samples?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cumulative Health Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Longitudinal Biomarker Progression
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Analyze clinical parameter changes across successive patient visits and therapeutic intervals.
                </p>
              </div>

              {trendsData.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Select Biomarker:</label>
                  <select
                    value={selectedParam?.parameterName || ''}
                    onChange={(e) => {
                      const found = trendsData.find(p => p.parameterName === e.target.value);
                      if (found) setSelectedParam(found);
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    {trendsData.map(p => (
                      <option key={p.parameterName} value={p.parameterName}>
                        {p.parameterName} ({p.unit || 'unit'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loadingTrends ? (
              <div className="py-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : trendsData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-medium text-sm">No multi-visit quantitative parameters available for this patient yet.</p>
                <p className="text-xs text-gray-400 mt-1">Once verified results are recorded across orders, longitudinal trends appear here.</p>
              </div>
            ) : selectedParam ? (
              <div className="space-y-6">
                
                {/* Trend Stats Cards */}
                {(() => {
                  const history = selectedParam.history || [];
                  const first = history[0];
                  const last = history[history.length - 1];
                  const firstVal = first?.numericValue || 0;
                  const lastVal = last?.numericValue || 0;
                  const diff = lastVal - firstVal;
                  const pct = firstVal > 0 ? ((diff / firstVal) * 100).toFixed(1) : 0;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Baseline Value</span>
                        <p className="text-xl font-black text-slate-800 mt-0.5">
                          {first?.rawValue} {selectedParam.unit}
                        </p>
                        <span className="text-[10px] text-slate-500">{first?.dateFormatted}</span>
                      </div>

                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Latest Observed</span>
                        <p className="text-xl font-black text-blue-900 mt-0.5">
                          {last?.rawValue} {selectedParam.unit}
                        </p>
                        <span className="text-[10px] text-blue-600">{last?.dateFormatted}</span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Net Trajectory</span>
                        <p className={`text-xl font-black mt-0.5 flex items-center gap-1 ${
                          diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-indigo-600' : 'text-slate-700'
                        }`}>
                          {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} {selectedParam.unit}
                        </p>
                        <span className="text-[10px] text-slate-500">{pct > 0 ? `+${pct}%` : `${pct}%`} relative change</span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Reference Interval</span>
                        <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                          {selectedParam.referenceRange || 'Clinical Reference'}
                        </p>
                        <span className="text-[10px] text-slate-500">Biological Normal Range</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Longitudinal Chart */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">
                      {selectedParam.parameterName} Progression Timeline
                    </span>
                    <span className="text-slate-400">Total Visits: {selectedParam.history?.length}</span>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={selectedParam.history.map(h => ({
                          date: h.dateFormatted,
                          value: h.numericValue,
                          raw: h.rawValue,
                          flag: h.flag,
                          order: h.orderNumber,
                          isAbnormal: h.isAbnormal
                        }))}
                        margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                                  <p className="font-bold text-slate-300">{d.date} • {d.order}</p>
                                  <p className="text-white text-sm font-black font-mono">
                                    {d.raw} {selectedParam.unit}
                                  </p>
                                  <p className={d.isAbnormal ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                    Status: {d.flag || (d.isAbnormal ? 'ABNORMAL' : 'NORMAL')}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#2563eb" 
                          strokeWidth={2.5}
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle 
                                key={props.index} 
                                cx={cx} 
                                cy={cy} 
                                r={payload.isAbnormal ? 5.5 : 4} 
                                fill={payload.isAbnormal ? '#e11d48' : '#2563eb'} 
                                stroke="#ffffff" 
                                strokeWidth={2} 
                              />
                            );
                          }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Historical Audit Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Visit Date</th>
                        <th className="py-2.5 px-4">Order ID</th>
                        <th className="py-2.5 px-4">Observed Value</th>
                        <th className="py-2.5 px-4">Biological Reference</th>
                        <th className="py-2.5 px-4">Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedParam.history.map((h, i) => (
                        <tr key={i} className={h.isAbnormal ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}>
                          <td className="py-2.5 px-4 font-medium text-slate-700">{h.dateFormatted}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{h.orderNumber}</td>
                          <td className="py-2.5 px-4 font-mono font-black text-slate-900">
                            {h.rawValue} {selectedParam.unit}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{selectedParam.referenceRange || '-'}</td>
                          <td className="py-2.5 px-4">
                            {h.isAbnormal ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                {h.flag || '▲ ABNORMAL'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders found for this patient.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Order ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Tests</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.orderId || order._id.toString().substring(0,8)}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                          {order.tests?.map(t => t.test?.name).join(', ') || 'No tests'}
                        </td>
                        <td className="px-4 py-3">{renderStatus(order.orderStatus)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">₹{order.totalAmount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-4">
            {samples?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No samples collected yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {samples.map(sample => (
                  <div key={sample._id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Droplet className="w-5 h-5" />
                      </div>
                      {renderStatus(sample.status)}
                    </div>
                    <h4 className="font-bold text-gray-900">{sample.sampleType}</h4>
                    <p className="text-sm text-gray-500 mb-2">Container: {sample.containerType}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sample.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {results?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reports generated yet.</p>
            ) : (
              <div className="space-y-3">
                {results.map(result => (
                  <div key={result._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{result.test?.name || 'Unknown Test'}</h4>
                        <p className="text-sm text-gray-500">Date: {new Date(result.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            {orders?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payment records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Order ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.orderId || order._id.toString().substring(0,8)}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">₹{order.totalAmount || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Patient UHID Smart Identity Card Modal */}
      {uhidCardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">Print Patient UHID Smart Identity Card</h3>
              </div>
              <button onClick={() => setUhidCardOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50 flex flex-col items-center">
              
              {/* The Physical Smart Card Container (CR-80 standard card proportions) */}
              <div 
                id="patient-uhid-smartcard"
                className="w-full max-w-[420px] aspect-[1.586] rounded-2xl p-5 shadow-xl relative overflow-hidden text-white flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, #091e3a 0%, #173b6c 50%, #1e4976 100%)'
                }}
              >
                {/* Decorative background watermarks */}
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-cyan-400/10 blur-xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>

                {/* Card Top Header */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center font-black text-slate-900 text-sm shadow-md">
                      +
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black tracking-wider uppercase text-cyan-300">
                        ApexHealth Diagnostics
                      </h4>
                      <p className="text-[9px] text-slate-300 font-medium">NABL ACCREDITED CLINICAL LAB</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/10 text-cyan-300 border border-white/10">
                      SMART UHID
                    </span>
                  </div>
                </div>

                {/* Card Middle: Photo + Demographics */}
                <div className="flex items-center gap-4 my-auto relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg border-2 border-white/20 shrink-0">
                    {patient.firstName.charAt(0)}{patient.lastName?.charAt(0)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-xs font-mono font-bold text-cyan-300">
                      {patient.patientId}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-300 pt-0.5">
                      <span>Age: <b>{patient.age} {patient.ageUnit}</b></span>
                      <span>Sex: <b>{patient.gender}</b></span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/80 text-white font-bold">
                        {patient.bloodGroup || 'Blood: O+'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Barcode + Contacts */}
                <div className="pt-2 border-t border-white/10 flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                      <span>Phone: <b>{patient.phone}</b></span>
                      <span>•</span>
                      <span>Reg: {new Date(patient.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Visual Barcode generation */}
                    <div className="flex items-center gap-[2px] h-6 px-1.5 py-0.5 bg-white rounded">
                      {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3].map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 h-full"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    <QrCode className="w-8 h-8 text-slate-900" />
                  </div>
                </div>

              </div>

              <p className="text-[11px] text-slate-500 text-center max-w-xs">
                Standard CR-80 Patient Identity Card (85.6mm &times; 53.98mm). Printable on thermal PVC card printers or standard paper.
              </p>

            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center print:hidden">
              <span className="text-xs text-slate-500 font-medium">Ready to print</span>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUhidCardOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Smart Card
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DiagnosticsPatientDetails;
