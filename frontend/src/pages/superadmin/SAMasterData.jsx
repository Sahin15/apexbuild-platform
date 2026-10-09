import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Database, Plus, Send, Trash2, Code2, HeartPulse, HardDrive, Calculator, FileJson } from 'lucide-react';

export default function SAMasterData() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'BOQ_ITEM', targetOS: 'CONTRACTOR', description: '', data: '{}'
  });

  const fetchTemplates = () => {
    api.get('/platform/mdm/templates')
       .then(res => setTemplates(res.data.data.templates))
       .catch(() => toast.error("Failed to load master templates"));
  };

  useEffect(() => fetchTemplates(), []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(formData.data);
      } catch (e) {
        return toast.error("Invalid JSON format in Data Payload");
      }
      
      await api.post('/platform/mdm/templates', { ...formData, data: parsedData });
      toast.success('Global Template created');
      setShowModal(false);
      setFormData({ name: '', type: 'BOQ_ITEM', targetOS: 'CONTRACTOR', description: '', data: '{}' });
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handlePush = async (id) => {
    if (!window.confirm("Are you sure you want to push this configuration to all target OS tenants? This cannot be undone.")) return;
    try {
      const res = await api.post(`/platform/mdm/templates/${id}/push`);
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to push template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this master template? Existing tenants will not lose their copied data.")) return;
    try {
      await api.delete(`/platform/mdm/templates/${id}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'BOQ_ITEM': return <Calculator className="w-5 h-5 text-emerald-400" />;
      case 'MEDICAL_TEST': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'INVENTORY_CATEGORY': return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'TAX_RULE': return <FileJson className="w-5 h-5 text-sky-400" />;
      case 'SETTINGS': return <Database className="w-5 h-5 text-indigo-400" />;
      default: return <Code2 className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Master Data Engine</h1>
            <p className="text-indigo-200 text-sm font-medium mt-1">Deploy global configuration payloads to OS tenants.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setShowModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
            <Plus className="w-5 h-5" /> New Configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div>
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">{getTypeIcon(template.type)}</div>
                  <h3 className="font-bold text-slate-900 text-lg truncate pr-2">{template.name}</h3>
                </div>
                <span className="text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 shadow-sm">v{template.version}</span>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-5 h-10 line-clamp-2">{template.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payload Type</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{template.type.replace('_', ' ')}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target OS</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{template.targetOS.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-5 border-t border-slate-100">
              <button onClick={() => handlePush(template._id)} className="flex-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-100 hover:border-indigo-600 shadow-sm">
                <Send className="w-4 h-4" /> Push Deploy
              </button>
              <button onClick={() => handleDelete(template._id)} className="p-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors shadow-sm" title="Delete Template">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-24 text-center text-slate-500 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold text-slate-700">No Master Configurations</p>
            <p className="text-sm">Create standard data templates to inject into tenant OS systems.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><Code2 className="w-6 h-6 text-indigo-600"/> Create Configuration Payload</h2>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Template Name <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Default GST Rules" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payload Type <span className="text-rose-500">*</span></label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option value="BOQ_ITEM">BOQ Item (Contractor)</option>
                    <option value="MEDICAL_TEST">Medical Test (Diagnostics)</option>
                    <option value="INVENTORY_CATEGORY">Inventory Category</option>
                    <option value="TAX_RULE">Tax/Compliance Rule</option>
                    <option value="SETTINGS">OS Settings Flag</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target OS Application <span className="text-rose-500">*</span></label>
                  <select value={formData.targetOS} onChange={e => setFormData({...formData, targetOS: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option value="CONTRACTOR">Contractor OS</option>
                    <option value="DIAGNOSTICS">Diagnostics OS</option>
                    <option value="CHICKEN_DISTRIBUTOR">Distributor OS</option>
                    <option value="MATERIAL_SUPPLIER">Supply OS</option>
                    <option value="ALL">All OS Applications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Short Description <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="What does this payload configure?" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  JSON Payload Data <span className="text-rose-500">*</span>
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">Must be valid JSON</span>
                </label>
                <textarea required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-emerald-400 font-mono text-sm h-48 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" placeholder='{"key": "value"}'></textarea>
                <p className="text-xs text-slate-500 mt-2 font-medium">This exact JSON structure will be cloned into the target tenant's database when deployed.</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  <Database className="w-5 h-5" /> Compile Payload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
