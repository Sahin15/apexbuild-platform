import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Calendar, Activity, FileText, 
  Droplet, CreditCard, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsPatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [id]);

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
    </div>
  );
};

export default DiagnosticsPatientDetails;
