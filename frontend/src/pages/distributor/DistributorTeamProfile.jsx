import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Mail, Phone, MapPin, Activity, Shield, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DistributorTeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bloodGroup: '',
    licenseNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users');
      // Find user from the list since we don't have a GET /users/:id specifically exposed yet
      const foundUser = res.data.data.users.find(u => u._id === id);
      if (foundUser) {
        setUser(foundUser);
        setFormData({
          name: foundUser.name || '',
          phone: foundUser.phone || '',
          address: foundUser.address || '',
          bloodGroup: foundUser.bloodGroup || '',
          licenseNumber: foundUser.licenseNumber || '',
          emergencyContactName: foundUser.emergencyContactName || '',
          emergencyContactPhone: foundUser.emergencyContactPhone || ''
        });
      } else {
        toast.error('Team member not found');
        navigate('/distributor/team');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/users/${id}/profile`, formData);
      setUser(res.data.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button onClick={() => navigate('/distributor/team')} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Team
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Cover Area */}
        <div className="h-32 bg-emerald-600 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center text-4xl font-black text-emerald-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {user.role} ROLE
            </span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-8 pb-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500 w-full max-w-sm" 
                />
              ) : (
                <h1 className="text-3xl font-black text-slate-800">{user.name}</h1>
              )}
              <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} disabled={saving} className="btn btn-secondary py-2 px-4 flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-2 px-4 flex items-center gap-2">
                    {saving ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 flex items-center gap-2 font-bold transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Phone Number</p>
                      {isEditing ? (
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-1.5 mt-1" placeholder="e.g. +91 9876543210" />
                      ) : (
                        <p className="font-bold text-slate-800">{user.phone || <span className="text-slate-400 italic font-normal">Not provided</span>}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Full Address</p>
                      {isEditing ? (
                        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input py-1.5 mt-1" placeholder="Full residential address" />
                      ) : (
                        <p className="font-bold text-slate-800 leading-relaxed">{user.address || <span className="text-slate-400 italic font-normal">Not provided</span>}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {user.role === 'DRIVER' && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Driver Details</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">License Number</p>
                    {isEditing ? (
                      <input type="text" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="input py-1.5 uppercase font-bold" placeholder="License Number" />
                    ) : (
                      <p className="font-black text-slate-800 uppercase tracking-wider text-lg">
                        {user.licenseNumber || 'NOT PROVIDED'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Health & Emergency */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Health & Emergency</h3>
                
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Blood Group</p>
                      {isEditing ? (
                        <input type="text" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="input py-1.5 mt-1 font-bold text-red-600" placeholder="e.g. O+" />
                      ) : (
                        <p className="font-black text-red-600 text-lg">{user.bloodGroup || <span className="text-slate-400 italic font-normal text-sm">Not provided</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl text-white">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Emergency Contact</h4>
                  <div className="space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact Name</label>
                          <input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="Name" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact Phone</label>
                          <input type="text" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="Phone Number" />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-black text-xl">{user.emergencyContactName || <span className="text-slate-400 italic text-sm font-normal">No Name Provided</span>}</p>
                        <p className="font-medium text-emerald-400 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {user.emergencyContactPhone || <span className="text-slate-500 italic text-sm font-normal">No Phone Provided</span>}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
