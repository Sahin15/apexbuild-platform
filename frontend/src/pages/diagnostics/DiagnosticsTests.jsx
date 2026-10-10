import { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Activity, X, Info, Package, 
  Clock, Droplet, CheckCircle2, ChevronRight, AlertCircle, Sparkles, Tag
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DiagnosticsTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'packages'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [selectedTestForParams, setSelectedTestForParams] = useState(null);
  const [parameters, setParameters] = useState([]);

  // Form: Single Test
  const [testForm, setTestForm] = useState({
    name: '',
    category: 'Pathology',
    department: 'Pathology',
    sampleType: 'Blood',
    containerType: 'SST',
    price: '',
    turnaroundTime: '24 Hours',
    preparationInstructions: '',
    notes: ''
  });

  // Form: Master Package
  const [packageForm, setPackageForm] = useState({
    name: '',
    category: 'Health Packages',
    department: 'Pathology',
    sampleType: 'Blood & Urine',
    containerType: 'EDTA + SST + Urine Cup',
    price: '',
    turnaroundTime: '12 Hours',
    tatHours: 12,
    preparationInstructions: 'Strict 10-12 hours overnight fasting required. Water is permitted.',
    notes: '',
    isPackage: true,
    includedTests: []
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/tests');
      setTests(res.data.data.tests || []);
    } catch (error) {
      toast.error('Failed to fetch tests catalogue');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/diagnostics/tests', testForm);
      setTests([res.data.data.test, ...tests]);
      toast.success('Investigation added to catalogue');
      setIsTestModalOpen(false);
      setTestForm({
        name: '', category: 'Pathology', department: 'Pathology', sampleType: 'Blood', containerType: 'SST', price: '', turnaroundTime: '24 Hours', preparationInstructions: '', notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating test');
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!packageForm.name || !packageForm.price) {
      return toast.error('Package name and price are required');
    }

    try {
      const res = await api.post('/diagnostics/tests', packageForm);
      setTests([res.data.data.test, ...tests]);
      toast.success('Master Health Package created successfully!');
      setIsPackageModalOpen(false);
      setPackageForm({
        name: '',
        category: 'Health Packages',
        department: 'Pathology',
        sampleType: 'Blood & Urine',
        containerType: 'EDTA + SST + Urine Cup',
        price: '',
        turnaroundTime: '12 Hours',
        tatHours: 12,
        preparationInstructions: 'Strict 10-12 hours overnight fasting required. Water is permitted.',
        notes: '',
        isPackage: true,
        includedTests: []
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create package');
    }
  };

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
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSaveParams = async () => {
    if (parameters.some(p => !p.name.trim())) {
      return toast.error('Parameter names cannot be empty');
    }
    
    try {
      const res = await api.patch(`/diagnostics/tests/${selectedTestForParams._id}`, { parameters });
      setTests(tests.map(t => t._id === selectedTestForParams._id ? res.data.data.test : t));
      toast.success('Parameters updated successfully');
      setIsParamsModalOpen(false);
    } catch (error) {
      toast.error('Failed to update parameters');
    }
  };

  const individualTests = tests.filter(t => !t.isPackage);
  const packageTests = tests.filter(t => t.isPackage);

  const displayedList = activeTab === 'individual' ? individualTests : packageTests;
  const filteredList = displayedList.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Investigation & Package Master</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
              {tests.length} Active Items
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage laboratory test parameters, sample containers, turnaround time SLAs & bundled master health checkup panels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Single Test
          </button>
          <button
            onClick={() => setIsPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            + Create Health Package
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Strip */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'individual'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Individual Tests ({individualTests.length})
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'packages'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Master Health Packages ({packageTests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={activeTab === 'individual' ? "Search investigations..." : "Search health packages..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Package View */}
      {activeTab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((pkg) => (
            <div 
              key={pkg._id} 
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {pkg.category || 'Health Package'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                    {pkg.testId}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  {pkg.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {pkg.notes || 'Comprehensive diagnostic profile bundling multi-parameter clinical screens.'}
                </p>

                {pkg.preparationInstructions && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><b>Fasting Advice:</b> {pkg.preparationInstructions}</span>
                  </div>
                )}

                {/* Parameters count preview */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Droplet className="w-3.5 h-3.5 text-blue-500" /> {pkg.sampleType || 'Blood'}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> TAT: {pkg.turnaroundTime || '12 Hours'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {pkg.parameters?.length || 0} Biomarkers
                  </span>
                </div>
              </div>

              {/* Package Price & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Package Price</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    ₹{(pkg.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenParams(pkg)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Configure ({pkg.parameters?.length || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Individual Tests Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Investigation Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sample / Tube</th>
                  <th className="py-3 px-4">TAT SLA</th>
                  <th className="py-3 px-4">Standard Price</th>
                  <th className="py-3 px-4 text-right">Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{test.testId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{test.name}</td>
                    <td className="py-3 px-4 text-slate-600">{test.category || 'Pathology'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {test.sampleType} ({test.containerType || 'Plain'})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{test.turnaroundTime || '4 Hours'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{test.price}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenParams(test)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        {test.parameters?.length > 0 ? `${test.parameters.length} Parameters` : '+ Add Params'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Single Test Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Add New Diagnostic Investigation</h3>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTest} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Investigation Name *</label>
                <input
                  type="text"
                  required
                  value={testForm.name}
                  onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                  placeholder="e.g. Serum Lipase, Thyroid Profile (Total T3/T4/TSH)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Serology">Serology</option>
                    <option value="Radiology">Radiology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Standard Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={testForm.price}
                    onChange={(e) => setTestForm({ ...testForm, price: e.target.value })}
                    placeholder="e.g. 450"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sample Type</label>
                  <select
                    value={testForm.sampleType}
                    onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Blood">Blood (Venous)</option>
                    <option value="Serum">Serum</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Urine">Urine (Mid-stream)</option>
                    <option value="Swab">Swab / Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Container / Vacutainer</label>
                  <select
                    value={testForm.containerType}
                    onChange={(e) => setTestForm({ ...testForm, containerType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EDTA (Lavender)">EDTA (Lavender Tube)</option>
                    <option value="SST (Gel Yellow)">SST Gel (Yellow Tube)</option>
                    <option value="Plain (Red)">Plain Clot (Red Tube)</option>
                    <option value="Fluoride (Grey)">Fluoride (Grey Tube)</option>
                    <option value="Sodium Citrate (Blue)">Sodium Citrate (Blue Tube)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Patient Preparation Instructions</label>
                <input
                  type="text"
                  value={testForm.preparationInstructions}
                  onChange={(e) => setTestForm({ ...testForm, preparationInstructions: e.target.value })}
                  placeholder="e.g. 10 hours overnight fasting required"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Master Package Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create Master Health Package</h3>
                <p className="text-[11px] text-slate-400">Bundle multiple clinical tests with package pricing</p>
              </div>
              <button onClick={() => setIsPackageModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePackage} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. Senior Citizen Complete Wellness Profile"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Package Special Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    placeholder="e.g. 1499"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Turnaround Time SLA</label>
                  <input
                    type="text"
                    value={packageForm.turnaroundTime}
                    onChange={(e) => setPackageForm({ ...packageForm, turnaroundTime: e.target.value })}
                    placeholder="e.g. 12 Hours"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fasting / Preparation Advice</label>
                <input
                  type="text"
                  value={packageForm.preparationInstructions}
                  onChange={(e) => setPackageForm({ ...packageForm, preparationInstructions: e.target.value })}
                  placeholder="e.g. Strict 10-12 hours fasting. Avoid morning tea or coffee."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Included Tests to Bundle</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {individualTests.map((t) => {
                    const isSelected = packageForm.includedTests.includes(t._id);
                    return (
                      <label key={t._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...packageForm.includedTests, t._id]
                              : packageForm.includedTests.filter(id => id !== t._id);
                            setPackageForm({ ...packageForm, includedTests: updated });
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-bold text-slate-800">{t.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">₹{t.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Create Master Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Parameters Modal */}
      {isParamsModalOpen && selectedTestForParams && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Configure Parameters: {selectedTestForParams.name}</h3>
                <p className="text-[11px] text-slate-400">{selectedTestForParams.testId} • {selectedTestForParams.category}</p>
              </div>
              <button onClick={() => setIsParamsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {parameters.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Parameter Name"
                      value={param.name}
                      onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. g/dL)"
                      value={param.unit || ''}
                      onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Ref Range (e.g. 13 - 17)"
                      value={param.referenceRange || ''}
                      onChange={(e) => handleParamChange(index, 'referenceRange', e.target.value)}
                      className="w-40 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(index)}
                      className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAddParam}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  + Add Another Parameter
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsParamsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParams}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                  >
                    Save Parameters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
