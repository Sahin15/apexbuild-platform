import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Package, Egg } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: 'CONTRACTOR',
    orgName: '',
    orgEmail: '',
    userName: '',
    userEmail: '',
    password: '',
    phone: ''
  });

  const businessTypes = [
    {
      id: 'CONTRACTOR',
      title: 'Construction / Contractor',
      desc: 'Manage projects, BOQs, site reports, and labor.',
      icon: Building2,
      color: 'bg-primary-50 text-primary-600 border-primary-200 hover:border-primary-500'
    },
    {
      id: 'MATERIAL_SUPPLIER',
      title: 'Material Supplier',
      desc: 'Manage inventory, purchase orders, and sales.',
      icon: Package,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-500'
    },
    {
      id: 'CHICKEN_DISTRIBUTOR',
      title: 'Poultry Distributor',
      desc: 'Manage farms, batches, and distribution.',
      icon: Egg,
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-500'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData);
    if (success) {
      if (formData.businessType === 'MATERIAL_SUPPLIER') {
        navigate('/supplier/dashboard');
      } else if (formData.businessType === 'CONTRACTOR') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard'); // fallback
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm">
            A
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Create your ApexBuild account</h2>
          <p className="mt-2 text-slate-600">Join the ultimate business management platform.</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 mt-8">
            <h3 className="text-lg font-bold text-slate-800 text-center">What type of business do you run?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessTypes.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => setFormData({ ...formData, businessType: type.id })}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    formData.businessType === type.id 
                      ? type.color.replace('border-', 'border-').replace('hover:', '') + ' ring-2 ring-offset-2 ring-' + type.color.split('-')[1]
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <type.icon className="w-8 h-8 mb-3" />
                  <h4 className="font-bold text-slate-900 mb-1">{type.title}</h4>
                  <p className="text-xs text-slate-500">{type.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full btn btn-primary py-3 text-lg mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Organization Details</h4>
                <div>
                  <label className="label">Company / Organization Name</label>
                  <input required type="text" className="input" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Company Email</label>
                  <input required type="email" className="input" value={formData.orgEmail} onChange={e => setFormData({...formData, orgEmail: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Admin User Details</h4>
                <div>
                  <label className="label">Your Full Name</label>
                  <input required type="text" className="input" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Your Login Email</label>
                  <input required type="email" className="input" value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input required type="password" minLength="6" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1 py-3">Back</button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3 disabled:opacity-70">
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-bold text-primary-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
