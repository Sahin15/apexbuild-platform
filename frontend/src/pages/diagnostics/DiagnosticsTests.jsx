import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Activity, X, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DiagnosticsTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Params Modal State
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [selectedTestForParams, setSelectedTestForParams] = useState(null);
  const [parameters, setParameters] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Pathology',
    sampleType: 'Blood',
    containerType: 'SST',
    price: '',
    turnaroundTime: '24 Hours',
    notes: ''
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await api.get('/diagnostics/tests');
      setTests(res.data.data.tests);
    } catch (error) {
      toast.error('Failed to fetch tests catalogue');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/diagnostics/tests', formData);
      setTests([res.data.data.test, ...tests]);
      toast.success('Test added to catalogue');
      setIsModalOpen(false);
      setFormData({
        name: '', category: 'Pathology', sampleType: 'Blood', containerType: 'SST', price: '', turnaroundTime: '24 Hours', notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating test');
    }
  };

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenParams = (test) => {
    setSelectedTestForParams(test);
    setParameters(test.parameters?.length > 0 ? [...test.parameters] : [{ name: '', unit: '', referenceRange: '' }]);
    setIsParamsModalOpen(true);
  };

  const handleParamChange = (index, field, value) => {
    const newParams = [...parameters];
    newParams[index][field] = value;
    setParameters(newParams);
  };

  const handleAddParam = () => {
    setParameters([...parameters, { name: '', unit: '', referenceRange: '' }]);
  };

  const handleRemoveParam = (index) => {
    const newParams = parameters.filter((_, i) => i !== index);
    setParameters(newParams);
  };

  const handleSaveParams = async () => {
    // Validate empty names
    if (parameters.some(p => !p.name.trim())) {
      return toast.error('Parameter names cannot be empty');
    }
    
    try {
      const res = await api.patch(`/diagnostics/tests/${selectedTestForParams._id}`, { parameters });
      setTests(tests.map(t => t._id === selectedTestForParams._id ? res.data.data.test : t));
      toast.success('Parameters updated successfully');
      setIsParamsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update parameters');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tests, pricing, and parameters.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Test
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Activity className="h-12 w-12 text-gray-300 mb-3" />
            <p>No tests found in the catalogue.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTests.map((test) => (
              <div key={test._id} className="p-4 hover:bg-gray-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{test.name}</h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{test.testId}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center"><Info className="h-4 w-4 mr-1 text-gray-400" /> {test.category}</span>
                    <span>Sample: {test.sampleType} ({test.containerType})</span>
                    <span>TAT: {test.turnaroundTime}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2">
                  <span className="text-lg font-bold text-gray-900">₹{test.price}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenParams(test); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                  >
                    Manage Params ({test.parameters?.length || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTest}>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option>Pathology</option>
                      <option>Hematology</option>
                      <option>Biochemistry</option>
                      <option>Microbiology</option>
                      <option>Radiology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
                    <input 
                      type="text" 
                      value={formData.sampleType}
                      onChange={(e) => setFormData({...formData, sampleType: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Container</label>
                    <input 
                      type="text" 
                      value={formData.containerType}
                      onChange={(e) => setFormData({...formData, containerType: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turnaround Time</label>
                  <input 
                    type="text" 
                    value={formData.turnaroundTime}
                    onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})}
                    placeholder="e.g. 24 Hours"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Manage Parameters Modal */}
      {isParamsModalOpen && selectedTestForParams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0 bg-blue-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Parameters</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedTestForParams.name}</p>
              </div>
              <button onClick={() => setIsParamsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-4 rounded-xl mb-6">
                <strong>Professional Setup:</strong> Add all individual parameters (e.g., Hemoglobin, WBC) that make up this test. These will automatically appear as input fields for the technician during Result Entry.
              </div>

              <div className="space-y-4">
                {parameters.map((param, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Parameter Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Hemoglobin"
                        value={param.name}
                        onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div className="w-full sm:w-32 shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                      <input 
                        type="text" 
                        placeholder="e.g. g/dL"
                        value={param.unit}
                        onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div className="w-full sm:w-48 shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reference Range</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 13.0 - 17.0"
                        value={param.referenceRange}
                        onChange={(e) => handleParamChange(index, 'referenceRange', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveParam(index)}
                      className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                      title="Remove Parameter"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}

                <button 
                  type="button"
                  onClick={handleAddParam}
                  className="w-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl py-3 flex items-center justify-center gap-2 font-medium transition-all"
                >
                  <Plus className="h-5 w-5" /> Add Another Parameter
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsParamsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveParams}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Save Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsTests;
