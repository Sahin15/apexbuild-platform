import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Droplet, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CheckSquare, 
  Printer, 
  Barcode, 
  Square,
  Sparkles,
  Layers,
  ChevronRight,
  Camera,
  Share2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BarcodePrintModal from '../../components/diagnostics/BarcodePrintModal';
import { getTubeConfig } from '../../components/diagnostics/BarcodeSticker';
import BarcodeScannerModal from '../../components/common/BarcodeScannerModal';
import PullToRefreshContainer from '../../components/common/PullToRefreshContainer';
import haptics from '../../utils/haptics';
import { shareSampleDetails } from '../../utils/share';

const DiagnosticsSamples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSample, setSelectedSample] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Barcode Printing & Scanning State
  const [barcodeModalSamples, setBarcodeModalSamples] = useState(null);
  const [selectedSampleIds, setSelectedSampleIds] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/samples');
      setSamples(res.data?.data?.samples || []);
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
      if (newStatusToSet === 'Rejected') {
        haptics.warning();
      } else {
        haptics.success();
      }
      toast.success(`Sample marked as ${newStatusToSet}`);
      
      const updatedSample = res.data.data.sample;
      setSamples(samples.map(s => s._id === sampleId ? updatedSample : s));
      if (selectedSample && selectedSample._id === sampleId) {
        setSelectedSample(updatedSample);
        setNewStatus(updatedSample.status);
      }
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to update sample');
    }
  };

  // 1-Click Collect & Print Flow
  const handleCollectAndPrint = async (e, sample) => {
    e.stopPropagation();
    try {
      if (sample.status === 'Pending') {
        const res = await api.patch(`/diagnostics/samples/${sample._id}/status`, { status: 'Collected' });
        const updated = res.data.data.sample;
        setSamples(samples.map(s => s._id === sample._id ? updated : s));
        haptics.success();
        toast.success(`Sample collected! Opening barcode label...`);
        setBarcodeModalSamples([updated]);
      } else {
        haptics.medium();
        setBarcodeModalSamples([sample]);
      }
    } catch (error) {
      haptics.error();
      toast.error('Failed to mark sample as collected');
    }
  };

  // Checkbox Selection
  const toggleSelectSample = (sampleId, e) => {
    e.stopPropagation();
    setSelectedSampleIds(prev => 
      prev.includes(sampleId) 
        ? prev.filter(id => id !== sampleId) 
        : [...prev, sampleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSampleIds.length === filteredSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(filteredSamples.map(s => s._id));
    }
  };

  const handlePrintBatch = () => {
    const selected = samples.filter(s => selectedSampleIds.includes(s._id));
    if (selected.length === 0) {
      toast.error('Please select at least one sample to print labels');
      return;
    }
    setBarcodeModalSamples(selected);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Collected': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Lab': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tested': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContainerIcon = (type) => {
    if (type?.toLowerCase().includes('blood') || type?.toLowerCase().includes('edta') || type?.toLowerCase().includes('sst')) return <TestTube className="h-5 w-5 text-red-500" />;
    if (type?.toLowerCase().includes('urine')) return <Droplet className="h-5 w-5 text-amber-500" />;
    return <TestTube className="h-5 w-5 text-blue-500" />;
  };

  const filteredSamples = samples.filter(s => {
    const matchesSearch = 
      s.sampleId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.order?.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <PullToRefreshContainer onRefresh={fetchSamples}>
      <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Phlebotomy & Sample Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">
            Accession, thermal barcode tube labeling (2"x1"), and specimen lifecycle tracking
          </p>
        </div>

        {/* Global Batch Print Trigger */}
        {selectedSampleIds.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 animate-fade-in shadow-xs">
            <span className="text-xs font-bold text-blue-900">
              {selectedSampleIds.length} sample(s) selected
            </span>
            <button
              onClick={handlePrintBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Barcode Labels ({selectedSampleIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedSampleIds([])}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Sample ID, Barcode, Patient, or Order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50/50 outline-none"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                title="Scan Tube Barcode"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Tube</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {filteredSamples.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shrink-0"
              >
                {selectedSampleIds.length === filteredSamples.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>Select All</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none w-full md:w-auto"
              >
                <option value="All">All Statuses ({samples.length})</option>
                <option value="Pending">Pending Collection</option>
                <option value="Collected">Collected</option>
                <option value="In Lab">In Lab</option>
                <option value="Processing">Processing</option>
                <option value="Tested">Tested</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Samples Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSamples.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <TestTube className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No Specimen Samples Found</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {searchTerm || statusFilter !== 'All' 
              ? 'Try adjusting your search query or status filter.' 
              : 'New orders will automatically generate specimen collection tubes here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSamples.map((sample) => {
            const isSelected = selectedSampleIds.includes(sample._id);
            const tube = getTubeConfig(sample.containerType, sample.sampleType);

            return (
              <div 
                key={sample._id} 
                className={`bg-white rounded-xl shadow-xs border transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-200/80 hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedSample(sample);
                  setNewStatus(sample.status);
                  setRejectionReason(sample.rejectionReason || '');
                  setIsModalOpen(true);
                }}
              >
                <div className="p-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectSample(sample._id, e)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Select for batch barcode printing"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Tube indicator dot */}
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: tube.dot }}
                          title={tube.name}
                        />
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-1.5">
                            <span>{sample.sampleId}</span>
                          </h3>
                          <p className="text-[11px] text-gray-400 font-mono">
                            Order: {sample.order?.orderId}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(sample.status)}`}>
                      {sample.status}
                    </span>
                  </div>
                  
                  {/* Demographics details */}
                  <div className="space-y-1.5 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 my-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Patient:</span>
                      <span className="font-bold text-gray-900">
                        {sample.patient?.firstName} {sample.patient?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Specimen / Tube:</span>
                      <span className="font-semibold text-slate-800">
                        {sample.sampleType} ({sample.containerType})
                      </span>
                    </div>
                    {sample.collectedAt && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Collected At:</span>
                        <span className="text-gray-600">
                          {new Date(sample.collectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Test Tags */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Required Tests:</p>
                    <div className="flex flex-wrap gap-1">
                      {sample.tests?.map((test, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[11px] font-semibold text-blue-800">
                          {test.name || 'Test'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Card Action Footer */}
                <div className="bg-slate-50/90 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                    {sample.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {sample.status === 'Collected' && <CheckSquare className="w-3.5 h-3.5 text-blue-500" />}
                    {sample.status === 'In Lab' && <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />}
                    {sample.status === 'Processing' && <Clock className="w-3.5 h-3.5 text-purple-500" />}
                    {sample.status === 'Tested' && <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />}
                    {sample.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    <span>{sample.status}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareSampleDetails(sample);
                      }}
                      className="inline-flex items-center gap-1 p-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition-colors active:scale-95"
                      title="Share Specimen Details"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    </button>

                    {sample.status === 'Pending' ? (
                      <button
                        type="button"
                        onClick={(e) => handleCollectAndPrint(e, sample)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-2xs transition-colors"
                        title="Collect sample and print tube barcode label"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Collect & Print</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBarcodeModalSamples([sample]);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold shadow-2xs transition-colors"
                        title="Print 2x1 Barcode Label"
                      >
                        <Barcode className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print Barcode</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barcode Print Modal */}
      {barcodeModalSamples && (
        <BarcodePrintModal
          samples={barcodeModalSamples}
          onClose={() => setBarcodeModalSamples(null)}
        />
      )}

      {/* Sample Detail & Status Modal */}
      {isModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 md:p-0 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ backgroundColor: getTubeConfig(selectedSample.containerType, selectedSample.sampleType).dot }}
                />
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Specimen Accession: {selectedSample.sampleId}
                  </h2>
                  <p className="text-xs text-gray-500 font-mono">Barcode: {selectedSample.barcode || selectedSample.sampleId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeModalSamples([selectedSample]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Print Sticker</span>
                </button>

                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-100">
                <div>
                  <p className="text-gray-400 mb-0.5 uppercase font-bold text-[10px]">Patient</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {selectedSample.patient?.firstName} {selectedSample.patient?.lastName}
                  </p>
                  <p className="text-gray-500 font-mono text-[11px]">{selectedSample.patient?.patientId}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 uppercase font-bold text-[10px]">Order ID</p>
                  <p className="font-bold text-blue-900 text-sm">{selectedSample.order?.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 uppercase font-bold text-[10px]">Specimen / Container</p>
                  <p className="font-semibold text-gray-900">{selectedSample.sampleType} / {selectedSample.containerType}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 uppercase font-bold text-[10px]">Tests to Perform</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedSample.tests?.map((t, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[11px] font-semibold text-gray-700">
                        {t.name || 'Test'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Update Sample Status:
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Pending">Pending Collection</option>
                    <option value="Collected">Collected</option>
                    <option value="In Lab">In Lab</option>
                    <option value="Processing">Processing</option>
                    <option value="Tested">Tested</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  
                  {newStatus === 'Rejected' && (
                    <input 
                      type="text" 
                      placeholder="Reason for sample rejection"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  
                  <button 
                    onClick={() => handleUpdateStatus(selectedSample._id, newStatus, rejectionReason)}
                    disabled={newStatus === selectedSample.status}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-xs transition-colors"
                  >
                    Save Status
                  </button>
                </div>
              </div>

              {/* Timeline Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Specimen Lifecycle History
                </h3>
                <div className="space-y-4 pl-2 relative before:absolute before:inset-0 before:ml-[13px] before:w-0.5 before:bg-gray-200">
                  {/* Created */}
                  <div className="relative flex gap-4">
                    <div className="h-7 w-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="pb-3">
                      <p className="font-bold text-xs text-gray-900">Order Registered & Accessioned</p>
                      <p className="text-[11px] text-gray-500">{new Date(selectedSample.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Collected */}
                  {selectedSample.collectedAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="pb-3">
                        <p className="font-bold text-xs text-gray-900">Phlebotomy Sample Collected</p>
                        <p className="text-[11px] text-gray-500">{new Date(selectedSample.collectedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Tested */}
                  {selectedSample.testedAt && (
                    <div className="relative flex gap-4">
                      <div className="h-7 w-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="pb-3">
                        <p className="font-bold text-xs text-gray-900">Laboratory Analysis Completed</p>
                        <p className="text-[11px] text-gray-500">{new Date(selectedSample.testedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setSearchTerm(code);
          toast.success(`Scanned: ${code}`);
        }}
        title="Scan Specimen Tube"
        subtitle="Align the thermal barcode label inside the targeting reticle"
      />
      </div>
    </PullToRefreshContainer>
  );
};

export default DiagnosticsSamples;
