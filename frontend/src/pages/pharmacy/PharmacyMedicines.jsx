import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Pill, Plus, Search, Filter, ShieldCheck, AlertCircle, 
  Thermometer, CheckCircle2, ChevronRight, X, Edit, Eye,
  Sparkles, Layers, Package, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyMedicines() {
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OTC, SCHEDULE_H, SCHEDULE_H1, COLD_CHAIN, CHRONIC
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Medicine
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    packSize: '10 Tablets / Strip',
    unitConversionFactor: 1,
    manufacturer: '',
    scheduleCategory: 'SCHEDULE_H',
    storageCondition: 'ROOM_TEMPERATURE',
    isColdChain: false,
    isChronic: false,
    hsnCode: '30049099',
    gstRate: 12,
    reorderLevel: 20,
    rackLocation: 'Rack A-01',
    initialBatch: {
      batchNumber: '',
      mfgDate: '',
      expiryDate: '',
      purchasePrice: '',
      mrp: '',
      quantityOnHand: ''
    }
  });

  const fetchMedicines = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/pharmacy/medicines');
      if (res.data?.data?.medicines) {
        setMedicines(res.data.data.medicines);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
      // Fallback to local demo medicines if unauthenticated or offline
      toast.error('Unable to fetch live medicines catalogue from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchSearch = 
        med.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.hsnCode?.includes(searchTerm);

      if (!matchSearch) return false;

      if (activeTab === 'OTC') return med.scheduleCategory === 'OTC';
      if (activeTab === 'SCHEDULE_H') return med.scheduleCategory === 'SCHEDULE_H';
      if (activeTab === 'SCHEDULE_H1') return med.scheduleCategory === 'SCHEDULE_H1';
      if (activeTab === 'COLD_CHAIN') return med.isColdChain === true;
      if (activeTab === 'CHRONIC') return med.isChronic === true;

      return true;
    });
  }, [medicines, searchTerm, activeTab]);

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brandName.trim() || !formData.genericName.trim()) {
      toast.error('Brand Name and Generic Name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        initialBatch: formData.initialBatch.batchNumber ? formData.initialBatch : undefined
      };

      const res = await api.post('/pharmacy/medicines', payload);
      if (res.data?.data?.medicine) {
        toast.success(`Medicine ${formData.brandName} added to catalogue master!`);
        setShowAddModal(false);
        setFormData({
          brandName: '',
          genericName: '',
          dosageForm: 'Tablet',
          strength: '',
          packSize: '10 Tablets / Strip',
          unitConversionFactor: 1,
          manufacturer: '',
          scheduleCategory: 'SCHEDULE_H',
          storageCondition: 'ROOM_TEMPERATURE',
          isColdChain: false,
          isChronic: false,
          hsnCode: '30049099',
          gstRate: 12,
          reorderLevel: 20,
          rackLocation: 'Rack A-01',
          initialBatch: {
            batchNumber: '',
            mfgDate: '',
            expiryDate: '',
            purchasePrice: '',
            mrp: '',
            quantityOnHand: ''
          }
        });
        fetchMedicines(true);
      }
    } catch (err) {
      console.error('Add medicine error:', err);
      toast.error(err.response?.data?.message || 'Failed to save medicine master');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Live Sync Bar */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-2.5 flex items-center justify-between text-teal-900 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold px-1.5 py-0.5 rounded bg-teal-600 text-white text-[10px]">LIVE SYNC</span>
          <span>MongoDB Master Formulary Connected — Every medicine is strictly isolated to your pharmacy organization.</span>
        </div>
        <button
          onClick={() => fetchMedicines(true)}
          disabled={refreshing}
          className="flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Header & Master Data Stats */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine Catalogue Master</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              Formulary
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage pharmaceutical brands, generic active salts, schedule classifications, and storage requirements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: effectivePrimary }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:brightness-105 active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine Master</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Brand Name (Augmentin), Generic Salt (Amoxicillin), Manufacturer, or HSN Code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Medicines' },
            { id: 'SCHEDULE_H', label: 'Schedule H (Rx)' },
            { id: 'SCHEDULE_H1', label: 'Schedule H1 (Antibiotics)' },
            { id: 'OTC', label: 'Over-The-Counter (OTC)' },
            { id: 'COLD_CHAIN', label: 'Cold Chain (2°C - 8°C)' },
            { id: 'CHRONIC', label: 'Chronic Care (Khata)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Brand & Manufacturer</th>
                <th className="px-4 py-3">Generic Salt & Strength</th>
                <th className="px-4 py-3">Dosage & Pack</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3 text-center">HSN / GST</th>
                <th className="px-4 py-3 text-center">Batches</th>
                <th className="px-5 py-3 text-right">Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent mb-2"></div>
                    <p className="font-bold text-slate-600">Loading medicines from MongoDB...</p>
                  </td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No medicines found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map(med => (
                  <tr key={med._id || med.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{med.brandName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{med.manufacturer}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 max-w-[220px]">{med.genericName}</p>
                      <span className="text-[10px] text-teal-700 font-bold">{med.strength}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800">{med.dosageForm}</span>
                      <p className="text-[10px] text-slate-500">{med.packSize}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {med.scheduleCategory === 'SCHEDULE_H1' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          Sched H1
                        </span>
                      ) : med.scheduleCategory === 'SCHEDULE_H' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          Sched H (Rx)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {med.isColdChain ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Thermometer className="w-3 h-3 text-blue-600" />
                          2°C - 8°C
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600">Room Temp</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono text-[10px] text-slate-500">{med.hsnCode}</span>
                      <p className="text-[10px] font-bold text-slate-700">{med.gstRate}% GST</p>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                      {med.batchesCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-extrabold ${med.totalStock <= med.reorderLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                        {med.totalStock || 0} Units
                      </span>
                      {med.totalStock <= med.reorderLevel && (
                        <p className="text-[9px] font-bold text-amber-700">Reorder Level ({med.reorderLevel})</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Master Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Medicine to Catalogue</h3>
                <p className="text-xs text-slate-500">Master formulary record saved directly to your MongoDB database</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Augmentin 625 Duo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Generic Salt / Active API <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Cipla / GlaxoSmithKline"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment / Gel</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler / Respule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Strength</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10mg/5ml"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pack Size Architecture</label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. 10 Tablets / Strip"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Schedule Category</label>
                  <select
                    value={formData.scheduleCategory}
                    onChange={(e) => setFormData({ ...formData, scheduleCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  >
                    <option value="OTC">OTC (Over The Counter)</option>
                    <option value="SCHEDULE_H">Schedule H (Prescription)</option>
                    <option value="SCHEDULE_H1">Schedule H1 (Antibiotics/Habit)</option>
                    <option value="SCHEDULE_X">Schedule X (Narcotic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GST Slab Rate</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  >
                    <option value={0}>0% (Life saving / Contraceptive)</option>
                    <option value={5}>5% (Vaccines / Critical)</option>
                    <option value={12}>12% (Standard Formulations)</option>
                    <option value={18}>18% (Nutraceuticals / Derma)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="e.g. 30049099"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reorder Safety Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isColdChain}
                    onChange={(e) => setFormData({ ...formData, isColdChain: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-bold text-slate-700">Cold Chain Storage (2°C - 8°C Refrigerator)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isChronic}
                    onChange={(e) => setFormData({ ...formData, isChronic: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-bold text-slate-700">Chronic Care Medication</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectivePrimary }}
                  className="px-5 py-2 rounded-xl text-white font-bold shadow-sm hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to Database...' : 'Save to Master'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
