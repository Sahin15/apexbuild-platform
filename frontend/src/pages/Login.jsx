import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@apexbuild.com');
  const [password, setPassword] = useState('password');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // The context has been updated, but since we just awaited login, we can get user from localStorage or just wait for the router to redirect, 
      // but let's grab it from local storage directly to ensure we have the latest
      const user = JSON.parse(localStorage.getItem('user'));
      const bType = user?.organizationId?.businessType;
      if (bType === 'SUPERADMIN') {
         navigate('/superadmin/dashboard', { replace: true });
      } else if (bType === 'MATERIAL_SUPPLIER' || bType === 'SUPPLIER') {
         navigate('/supplier/dashboard', { replace: true });
      } else if (bType === 'CHICKEN_DISTRIBUTOR' || bType === 'DISTRIBUTOR') {
         navigate('/distributor/dashboard', { replace: true });
      } else if (bType === 'DIAGNOSTICS') {
         navigate('/diagnostics/dashboard', { replace: true });
      } else {
         navigate('/dashboard', { replace: true }); // Default Contractor
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm">
            A
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">ApexBuild</h2>
          <p className="mt-2 text-sm text-slate-600">Construction. Under Control.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input 
                type="email" 
                required 
                className="input py-2.5" 
                placeholder="admin@apexbuild.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input 
                type="password" 
                required 
                className="input py-2.5" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn btn-primary py-2.5 text-base shadow-sm disabled:opacity-70 flex justify-center"
            >
              {loading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </div>
        </form>

        {/* Multi-Business Tenant Isolation Switcher */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1-Click Multi-Business Isolation Demos
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              100% Isolated Data
            </span>
          </div>

          {/* Contractor OS Section */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Contractor OS (Compare 2 Contractors)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('apex.infra@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-blue-50/70 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-blue-900">
                  <span>🏗️</span> Apex Infra Ltd
                </div>
                <span className="text-[10px] text-blue-600 font-medium">3 Metro/Airport Projects</span>
              </button>

              <button
                type="button"
                onClick={() => { setEmail('bluestone@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <span>🏢</span> BlueStone Heights
                </div>
                <span className="text-[10px] text-slate-500 font-medium">2 Residential Tower Projects</span>
              </button>
            </div>
          </div>

          {/* Supplier OS Section */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Material Supplier OS (Compare 2 Suppliers)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('ganesh.steel@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-emerald-900">
                  <span>🚚</span> Ganesh Steel & Cement
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Steel Rebars & Cement Bags</span>
              </button>

              <button
                type="button"
                onClick={() => { setEmail('readymix@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-teal-50/70 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-teal-900">
                  <span>🚛</span> Apex ReadyMix Depot
                </div>
                <span className="text-[10px] text-teal-600 font-medium">RMC M25/M30 & Sand Fleet</span>
              </button>
            </div>
          </div>

          {/* Diagnostics OS Section */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Diagnostics OS (Compare 2 Labs)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('apex.pathology@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-purple-50/70 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-purple-900">
                  <span>🔬</span> Apex Pathology Lab
                </div>
                <span className="text-[10px] text-purple-600 font-medium">Blood/Lipid & Pathology</span>
              </button>

              <button
                type="button"
                onClick={() => { setEmail('metroscan@example.com'); setPassword('123456'); }}
                className="px-2.5 py-1.5 text-left text-xs bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-all flex flex-col"
              >
                <div className="flex items-center gap-1 font-bold text-indigo-900">
                  <span>🩻</span> Metro Scan Diagnostics
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">MRI & CT Scan Radiology</span>
              </button>
            </div>
          </div>

          {/* Superadmin Console Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => { setEmail('superadmin@example.com'); setPassword('123456'); }}
              className="w-full py-2 px-3 text-center text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>👑</span>
              <span>Superadmin Central Console (Manage All OSs & Businesses)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
