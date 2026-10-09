import { useState, useEffect } from 'react';
import { Search, Filter, Droplet, TestTube, CheckCircle, XCircle, Clock, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsSamples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSample, setSelectedSample] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/samples');
      setSamples(res.data.data.samples);
    } catch (error) {
      toast.error('Failed to load samples');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sampleId, newStatusToSet, reason = '') => {
    try {
      const payload = { status: newStatusToSet };
      if (newStatusToSet === 'Rejected') {
        payload.rejectionReason = reason;
      }
      
      const res = await api.patch(`/diagnostics/samples/${sampleId}/status`, payload);
      toast.success(`Sample marked as ${newStatusToSet}`);
      
      // Update local state for both the list and the selected modal
      const updatedSample = res.data.data.sample;
      setSamples(samples.map(s => s._id === sampleId ? updatedSample : s));
      if (selectedSample && selectedSample._id === sampleId) {
        setSelectedSample(updatedSample);
        setNewStatus(updatedSample.status);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sample');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Collected': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Lab': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tested': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContainerIcon = (type) => {
    if (type?.toLowerCase().includes('blood') || type?.toLowerCase().includes('edta') || type?.toLowerCase().includes('sst')) return <TestTube className="h-5 w-5 text-red-500" />;
    if (type?.toLowerCase().includes('urine')) return <Droplet className="h-5 w-5 text-yellow-500" />;
    return <TestTube className="h-5 w-5 text-blue-500" />;
  };

  const filteredSamples = samples.filter(s => {
    const matchesSearch = 
      s.sampleId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.order?.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample Management</h1>
          <p className="text-gray-500 text-sm mt-1">Collect, track, and process patient samples</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Sample ID, Patient, or Order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Collection</option>
              <option value="Collected">Collected</option>
              <option value="In Lab">In Lab</option>
              <option value="Processing">Processing</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSamples.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <TestTube className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No samples found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'All' 
              ? 'Try adjusting your search or filters.' 
              : 'New orders with required samples will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSamples.map((sample) => (
            <div 
              key={sample._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedSample(sample);
                setNewStatus(sample.status);
                setRejectionReason(sample.rejectionReason || '');
                setIsModalOpen(true);
              }}
            >
              <div className="p-5 border-b border-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getContainerIcon(sample.sampleType)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{sample.sampleId}</h3>
                      <p className="text-xs text-gray-500 font-mono">Order: {sample.order?.orderId}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(sample.status)}`}>
                    {sample.status}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Patient:</span>
                    <span className="font-medium text-gray-900">
                      {sample.patient?.firstName} {sample.patient?.lastName} ({sample.patient?.patientId})
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-900">{sample.sampleType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Container:</span>
                    <span className="font-medium text-gray-900">{sample.containerType}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Required For Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    {sample.tests?.map(test => (
                      <span key={test._id} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                        {test.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-600 w-full text-center flex items-center justify-center gap-2">
                  {sample.status === 'Pending' && <><Clock className="h-4 w-4 text-amber-500" /> Pending Collection</>}
                  {sample.status === 'Collected' && <><CheckSquare className="h-4 w-4 text-blue-500" /> Sample Collected</>}
                  {sample.status === 'In Lab' && <><CheckCircle className="h-4 w-4 text-indigo-500" /> Received in Lab</>}
                  {sample.status === 'Processing' && <><Clock className="h-4 w-4 text-purple-500" /> Processing in Lab</>}
                  {sample.status === 'Tested' && <><CheckSquare className="h-4 w-4 text-green-500" /> Test Completed</>}
                  {sample.status === 'Rejected' && <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-red-600">Rejected: {sample.rejectionReason}</span></>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sample Detail Modal */}
      {isModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {getContainerIcon(selectedSample.sampleType)}
                Sample: {selectedSample.sampleId}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 mb-1">Patient</p>
                  <p className="font-semibold text-gray-900">{selectedSample.patient?.firstName} {selectedSample.patient?.lastName} ({selectedSample.patient?.patientId})</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Order ID</p>
                  <p className="font-semibold text-gray-900">{selectedSample.order?.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Type / Container</p>
                  <p className="font-semibold text-gray-900">{selectedSample.sampleType} / {selectedSample.containerType}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Tests Required</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSample.tests?.map(t => (
                      <span key={t._id} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs">{t.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  Update Status (Backtracking allowed)
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Collected">Collected</option>
                    <option value="In Lab">In Lab</option>
                    <option value="Processing">Processing</option>
                    <option value="Tested">Tested</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  
                  {newStatus === 'Rejected' && (
                    <input 
                      type="text" 
                      placeholder="Reason for rejection"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  
                  <button 
                    onClick={() => handleUpdateStatus(selectedSample._id, newStatus, rejectionReason)}
                    disabled={newStatus === selectedSample.status}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Save Status
                  </button>
                </div>
              </div>

              {/* Timeline Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Sample Lifecycle Timeline</h3>
                <div className="space-y-4 pl-2 relative before:absolute before:inset-0 before:ml-[13px] before:w-0.5 before:bg-gray-200">
                  
                  {/* Created */}
                  <div className="relative flex gap-4">
                    <div className="h-7 w-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-sm text-gray-900">Order Registered / Pending</p>
                      <p className="text-xs text-gray-500">{new Date(selectedSample.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Collected */}
                  {selectedSample.collectedAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-sm text-gray-900">Sample Collected</p>
                        <p className="text-xs text-gray-500">{new Date(selectedSample.collectedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Received in Lab */}
                  {selectedSample.receivedInLabAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-sm text-gray-900">Received In Lab</p>
                        <p className="text-xs text-gray-500">{new Date(selectedSample.receivedInLabAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Processing */}
                  {selectedSample.processingAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-sm text-gray-900">Started Processing</p>
                        <p className="text-xs text-gray-500">{new Date(selectedSample.processingAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Tested */}
                  {selectedSample.testedAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-sm text-gray-900">Test Completed</p>
                        <p className="text-xs text-gray-500">{new Date(selectedSample.testedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {selectedSample.status === 'Rejected' && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-red-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-sm text-red-600">Sample Rejected</p>
                        <p className="text-sm text-gray-700 italic">Reason: {selectedSample.rejectionReason}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(selectedSample.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsSamples;
