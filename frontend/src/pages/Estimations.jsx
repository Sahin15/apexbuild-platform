import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calculator, Save, IndianRupee, PieChart, Clock, Zap } from 'lucide-react';

export default function Estimations() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [estimation, setEstimation] = useState({
    labourCost: 0,
    materialCost: 0,
    extraCost: 0,
    timelineDays: 0,
    materialCategories: {}
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      const proj = res.data.data.project;
      setProject(proj);
      if (proj.estimation) {
        setEstimation(proj.estimation);
      }
    } catch (error) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleSave = async () => {
    try {
      const payload = {
        estimation: {
          labourCost: Number(estimation.labourCost) || 0,
          materialCost: Number(estimation.materialCost) || 0,
          extraCost: Number(estimation.extraCost) || 0,
          timelineDays: Number(estimation.timelineDays) || 0,
          materialCategories: estimation.materialCategories
        }
      };
      await api.put(`/projects/${id}`, payload);
      toast.success('Estimations saved successfully!');
      setIsEditing(false);
      fetchProject();
    } catch (error) {
      toast.error('Failed to save estimations');
    }
  };

  const handleAddMaterialCategory = () => {
    if (!newCategoryName || !newCategoryValue) return;
    setEstimation(prev => ({
      ...prev,
      materialCategories: {
        ...prev.materialCategories,
        [newCategoryName]: Number(newCategoryValue)
      }
    }));
    setNewCategoryName('');
    setNewCategoryValue('');
  };

  const handleRemoveMaterialCategory = (cat) => {
    const updated = { ...estimation.materialCategories };
    delete updated[cat];
    setEstimation(prev => ({ ...prev, materialCategories: updated }));
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading estimations...</div>;
  if (!project) return null;

  const totalEstimatedCost = Number(estimation.labourCost) + Number(estimation.materialCost) + Number(estimation.extraCost);
  const totalMaterialCategoryCost = Object.values(estimation.materialCategories || {}).reduce((sum, val) => sum + Number(val), 0);
  const projectedProfit = project.contractValue - totalEstimatedCost;
  const profitMargin = project.contractValue > 0 ? (projectedProfit / project.contractValue) * 100 : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary-600" />
            Project Estimations & Profitability
          </h2>
          <p className="text-slate-500 text-sm mt-1">Estimate your costs to maximize your profit margin.</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Estimations</button>
        ) : (
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); fetchProject(); }}>Cancel</button>
            <button className="btn btn-primary flex items-center gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profitability Overview Card */}
        <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white md:col-span-3 lg:col-span-1 border-0">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-400"/> Profitability</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Project Value</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(project.contractValue)}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Total Estimated Cost</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalEstimatedCost)}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-700 bg-emerald-900/30 -mx-6 px-6 pb-6 rounded-b-xl">
              <p className="text-emerald-400/80 text-sm mb-1 pt-4">Projected Profit</p>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(projectedProfit)}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${profitMargin > 15 ? 'bg-emerald-500/20 text-emerald-400' : profitMargin > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {profitMargin.toFixed(1)}% Margin
                </span>
                <span className="text-xs text-slate-400">Target &gt; 15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="md:col-span-3 lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-primary-600"/> Core Estimations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">Estimated Labour Cost (₹)</label>
                {isEditing ? (
                  <input type="number" className="input" value={estimation.labourCost} onChange={e => setEstimation({...estimation, labourCost: e.target.value})} />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(estimation.labourCost)}</p>
                )}
              </div>
              
              <div>
                <label className="label">Estimated Material Cost (₹)</label>
                {isEditing ? (
                  <input type="number" className="input" value={estimation.materialCost} onChange={e => setEstimation({...estimation, materialCost: e.target.value})} />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(estimation.materialCost)}</p>
                )}
              </div>
              
              <div>
                <label className="label">Extra / Contingency Cost (₹)</label>
                {isEditing ? (
                  <input type="number" className="input" value={estimation.extraCost} onChange={e => setEstimation({...estimation, extraCost: e.target.value})} />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(estimation.extraCost)}</p>
                )}
              </div>
              
              <div>
                <label className="label flex items-center gap-1"><Clock className="w-4 h-4"/> Timeline Estimation (Days)</label>
                {isEditing ? (
                  <input type="number" className="input" value={estimation.timelineDays} onChange={e => setEstimation({...estimation, timelineDays: e.target.value})} />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{estimation.timelineDays || 0} Days</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Zap className="w-5 h-5 text-primary-600"/> Material Cost by Category</h3>
                <p className="text-sm text-slate-500 mt-1">Breakdown your total material cost into categories (e.g. Cement, Sand, Steel).</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Allocated</p>
                <p className={`font-bold ${totalMaterialCategoryCost > estimation.materialCost ? 'text-red-500' : 'text-emerald-600'}`}>
                  {formatCurrency(totalMaterialCategoryCost)} / {formatCurrency(estimation.materialCost)}
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-end gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="label text-xs">Category Name</label>
                  <input type="text" className="input text-sm" placeholder="e.g. Cement" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="label text-xs">Estimated Cost (₹)</label>
                  <input type="number" className="input text-sm" placeholder="Amount" value={newCategoryValue} onChange={e => setNewCategoryValue(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleAddMaterialCategory}>Add</button>
              </div>
            )}

            {Object.keys(estimation.materialCategories || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(estimation.materialCategories).map(([cat, cost]) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <span className="font-medium text-slate-700">{cat}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900">{formatCurrency(cost)}</span>
                      {isEditing && (
                        <button className="text-red-400 hover:text-red-600 font-bold px-2" onClick={() => handleRemoveMaterialCategory(cat)}>×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500 text-sm">No material categories added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
