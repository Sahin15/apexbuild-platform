import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Network, Plus, Edit2, Trash2, GripVertical, Settings2, Save, X, Activity, Globe, Layout, ArrowUpRight
} from 'lucide-react';

export default function SAMenus() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: 'CUSTOM',
    links: []
  });

  const [newLink, setNewLink] = useState({ label: '', url: '', target: '_self' });

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/menus');
      setMenus(res.data.data.menus);
    } catch (error) {
      toast.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        name: menu.name,
        location: menu.location,
        links: [...menu.links]
      });
    } else {
      setEditingMenu(null);
      setFormData({
        name: '',
        location: 'CUSTOM',
        links: []
      });
    }
    setNewLink({ label: '', url: '', target: '_self' });
    setIsModalOpen(true);
  };

  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) return;
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { ...newLink, order: prev.links.length }]
    }));
    setNewLink({ label: '', url: '', target: '_self' });
  };

  const handleRemoveLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      if (editingMenu) {
        await api.patch(`/platform/cms/menus/${editingMenu._id}`, formData);
        toast.success('Menu updated successfully');
      } else {
        await api.post('/platform/cms/menus', formData);
        toast.success('Menu created successfully');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving menu');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu?')) {
      try {
        await api.delete(`/platform/cms/menus/${id}`);
        toast.success('Menu deleted');
        fetchMenus();
      } catch (error) {
        toast.error('Error deleting menu');
      }
    }
  };

  const moveLink = (index, direction) => {
    const newLinks = [...formData.links];
    if (direction === 'up' && index > 0) {
      [newLinks[index], newLinks[index - 1]] = [newLinks[index - 1], newLinks[index]];
    } else if (direction === 'down' && index < newLinks.length - 1) {
      [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
    }
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Network className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Menus & Navigation</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage global navigation structures across the platform.</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Create Menu
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading menus...</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <Layout className="w-16 h-16 mb-4 text-slate-300" />
          <p className="text-xl font-bold text-slate-800 mb-1">No menus created yet</p>
          <p className="text-sm">Build your first global navigation menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {menus.map((menu) => (
            <div key={menu._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:border-indigo-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    {menu.name}
                  </h3>
                  <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100">
                    Location: {menu.location.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenModal(menu)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu._id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Menu Links ({menu.links.length})
                </h4>
                {menu.links.length === 0 ? (
                  <div className="text-sm text-slate-500 italic py-4">No links configured</div>
                ) : (
                  <div className="space-y-2">
                    {menu.links.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                          <span className="font-semibold text-slate-700">{link.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono text-xs truncate max-w-[150px]">{link.url}</span>
                          {link.target === '_blank' && <ArrowUpRight className="w-3 h-3 text-slate-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">{editingMenu ? 'Edit Menu' : 'Create Menu'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Menu Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    placeholder="e.g., Main Header"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location Target</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="HEADER_PRIMARY">Primary Header</option>
                    <option value="HEADER_SECONDARY">Secondary Header</option>
                    <option value="FOOTER_COMPANY">Footer (Company)</option>
                    <option value="FOOTER_LEGAL">Footer (Legal)</option>
                    <option value="SIDEBAR">Sidebar</option>
                    <option value="CUSTOM">Custom Placement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                  <span>Navigation Links</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{formData.links.length} links</span>
                </label>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  {/* Link Builder */}
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" placeholder="Link Label (e.g., Pricing)" 
                        value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" placeholder="URL (e.g., /pricing)" 
                          value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                        />
                        <select 
                          value={newLink.target} onChange={e => setNewLink({...newLink, target: e.target.value})}
                          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg w-32"
                        >
                          <option value="_self">Same Tab</option>
                          <option value="_blank">New Tab</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleAddLink} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 self-stretch flex items-center justify-center w-12">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Links List */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    {formData.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-30"><GripVertical className="w-3 h-3 rotate-90" /></button>
                          <button onClick={() => moveLink(index, 'down')} disabled={index === formData.links.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-30"><GripVertical className="w-3 h-3 rotate-90" /></button>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-800">{link.label}</div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                            {link.url} {link.target === '_blank' && <span className="bg-slate-100 text-[9px] px-1 rounded uppercase">External</span>}
                          </div>
                        </div>
                        <button onClick={() => handleRemoveLink(index)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.links.length === 0 && (
                      <div className="text-center py-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        Add links using the form above
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editingMenu ? 'Update Menu' : 'Create Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
