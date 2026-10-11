import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      } else if (bType === 'RESTAURANT') {
         navigate('/restaurant/dashboard', { replace: true });
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

        {/* Registration Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">
              Register your business
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
