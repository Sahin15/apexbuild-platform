import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

export default function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const getBasePath = () => {
    const type = user?.organizationId?.businessType;
    if (type === 'MATERIAL_SUPPLIER') return '/supplier';
    if (type === 'CHICKEN_DISTRIBUTOR') return '/distributor';
    if (type === 'SUPERADMIN') return '/superadmin';
    return '';
  };

  const getProfilePath = () => `${getBasePath()}/profile`;
  const getSettingsPath = () => `${getBasePath()}/settings`;
  const getSupportPath = () => `${getBasePath()}/support`;

  const initials = user ? `${user.name?.charAt(0) || ''}` : 'U';
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-50 sticky top-0">
      <div className="flex items-center flex-1">
        <button
          type="button"
          className="text-slate-500 hover:text-slate-700 focus:outline-none lg:hidden mr-4"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        
        {/* Global Search */}
        <div className="max-w-md w-full hidden sm:block relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors"
            placeholder="Search projects, boq, materials..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Workspace Indicator */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex flex-col text-right mr-3 pr-3 border-r border-slate-200">
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Workspace</span>
              {user?.organizationId?.businessType !== 'SUPERADMIN' && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  🔒 Isolated
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-slate-800 truncate max-w-[180px]" title={user?.organizationId?.name}>
              {user?.organizationId?.name || 'ApexBuild'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Role</span>
            <span className="text-xs font-semibold text-emerald-600 capitalize">
              {user?.role ? user.role.toLowerCase().replace('_', ' ') : 'User'}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-500 focus:outline-none rounded-full hover:bg-slate-100 transition-colors">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 transition-all focus:outline-none"
          >
            {initials.toUpperCase() || 'U'}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 overflow-hidden transform opacity-100 scale-100 transition-all z-50">
              <div className="px-4 py-3 bg-slate-50">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getProfilePath());
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  <UserIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSettingsPath());
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                  Account Settings
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSupportPath());
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  <HelpCircle className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                  Help & Support
                </button>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogoutClick}
                  className="group flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </header>
  );
}
