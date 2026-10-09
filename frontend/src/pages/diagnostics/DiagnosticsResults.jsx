import { useState, useEffect } from 'react';
import { Search, Filter, Beaker, CheckCircle, Save, X, Edit3, ClipboardCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsResults = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for result entry modal
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/results/pending');
      setOrders(res.data.data.orders);
    } catch (error) {
      toast.error('Failed to load pending results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEntry = (order, test) => {
    setSelectedOrder(order);
    setSelectedTest(test);
    
    // Initialize parameters state
    if (test.parameters && test.parameters.length > 0) {
      const initialParams = test.parameters.map(p => ({
        parameterId: p._id,
        name: p.name,
        value: '',
        unit: p.unit || '',
        referenceRange: p.referenceRange || '',
        isAbnormal: false
      }));
      setParameters(initialParams);
    } else {
      setParameters([]);
    }
    setRemarks('');
  };

  const handleParamChange = (index, field, value) => {
    const newParams = [...parameters];
    newParams[index][field] = value;
    setParameters(newParams);
  };

  const handleSubmitResult = async (status = 'Draft') => {
    // Validate
    if (status === 'Final' || status === 'Verified') {
      const missing = parameters.some(p => !p.value.trim());
      if (missing) {
        return toast.error('Please enter values for all parameters before finalizing');
      }
    }

    try {
      const payload = {
        orderId: selectedOrder._id,
        testId: selectedTest._id,
        parameters,
        status,
        remarks
      };

      await api.post('/diagnostics/results', payload);
      toast.success(`Result saved as ${status}`);
      
      setSelectedTest(null);
      setSelectedOrder(null);
      fetchPendingResults();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save result');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Result Entry</h1>
          <p className="text-gray-500 text-sm mt-1">Enter and verify test results</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <ClipboardCheck className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No pending results</h3>
          <p className="text-gray-500">All samples have been processed and resulted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{order.orderId}</h3>
                  <p className="text-sm text-gray-500">
                    {order.patient?.firstName} {order.patient?.lastName}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {order.orderStatus}
                </span>
              </div>
              
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tests Pending Results</h4>
                <div className="space-y-3">
                  {order.tests?.map(item => (
                    <div key={item.test._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <Beaker className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900 text-sm">{item.test.name}</span>
                      </div>
                      <button
                        onClick={() => handleOpenEntry(order, item.test)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Enter Result"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Entry Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Result Entry: {selectedTest.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Order: {selectedOrder?.orderId} • Patient: {selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}</p>
              </div>
              <button 
                onClick={() => setSelectedTest(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {parameters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="p-3 rounded-tl-lg font-medium">Parameter</th>
                        <th className="p-3 font-medium">Value</th>
                        <th className="p-3 font-medium">Unit</th>
                        <th className="p-3 rounded-tr-lg font-medium">Reference Range</th>
                        <th className="p-3 font-medium text-center">Abnormal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parameters.map((param, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="p-3 font-medium text-gray-900 text-sm">{param.name}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${param.isAbnormal ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`}
                              placeholder="Enter value"
                            />
                          </td>
                          <td className="p-3 text-sm text-gray-500">{param.unit || '-'}</td>
                          <td className="p-3 text-sm text-gray-500">{param.referenceRange || '-'}</td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={param.isAbnormal}
                              onChange={(e) => handleParamChange(index, 'isAbnormal', e.target.checked)}
                              className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  This test has no predefined parameters. You can add remarks below.
                </div>
              )}
              
              <div className="mt-8 border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks / Observations</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  className="w-full border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter any clinical remarks..."
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitResult('Draft')}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button
                onClick={() => handleSubmitResult('Final')}
                className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Submit Final
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsResults;
