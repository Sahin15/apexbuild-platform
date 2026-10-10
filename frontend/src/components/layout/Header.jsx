import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings, HelpCircle, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOSConfig } from '../../config/osThemes';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

export default function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  
  const osConfig = getOSConfig(user?.organizationId?.businessType, location.pathname);
  const isSuperAdmin = osConfig.key === 'SUPERADMIN' || user?.platformRole === 'SUPER_ADMIN';

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

  const getProfilePath = () => `${osConfig.baseRoute}/profile`;
  const getSettingsPath = () => `${osConfig.baseRoute}/settings`;
  const getSupportPath = () => `${osConfig.baseRoute}/support`;

  const initials = user?.name ? user.name.charAt(0) : (isSuperAdmin ? 'SA' : 'U');

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40 sticky top-0 shrink-0">
      
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center flex-1 max-w-xl">
        {setSidebarOpen && (
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 focus:outline-none lg:hidden mr-4 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
        
        {/* Global Search with OS-specific placeholder & focus ring */}
        <div className="w-full hidden sm:block relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50/80 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 sm:text-xs transition-all ${osConfig.theme.focusRing}`}
            placeholder={osConfig.searchPlaceholder}
          />
        </div>
      </div>

      {/* Right: Workspace Indicator, OS Pill, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Unified Workspace & OS Pill */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200/90 shadow-2xs">
          
          {/* Organization Name & Workspace Isolation Status */}
          <div className="flex flex-col text-right pr-3 border-r border-slate-200">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {isSuperAdmin ? 'Platform' : 'Workspace'}
              </span>
              {isSuperAdmin ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                  👑 HQ
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  🔒 Isolated
                </span>
              )}
            </div>
            <span 
              className="text-xs font-bold text-slate-800 truncate max-w-[160px]" 
              title={user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'ApexBuild')}
            >
              {user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'ApexBuild')}
            </span>
          </div>

          {/* OS Identifier Badge */}
          <div className="pr-3 border-r border-slate-200 flex items-center">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${osConfig.theme.badgeBg}`}>
              {osConfig.name}
            </span>
          </div>

          {/* Role Indicator */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Role</span>
            <span className={`text-xs font-bold capitalize ${osConfig.theme.roleColor}`}>
              {user?.role ? user.role.toLowerCase().replace('_', ' ') : (isSuperAdmin ? 'Super Admin' : 'Member')}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none rounded-xl hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs shadow-2xs hover:ring-2 hover:ring-offset-2 transition-all focus:outline-none cursor-pointer ${osConfig.theme.avatarBg} ${osConfig.theme.avatarRing}`}
          >
            {initials.toUpperCase()}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-xl bg-white ring-1 ring-black/5 divide-y divide-slate-100 overflow-hidden transform opacity-100 scale-100 transition-all z-50">
              
              {/* Profile Card Header */}
              <div className="px-4 py-3 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${osConfig.theme.badgeBg}`}>
                    {osConfig.name}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    {user?.role ? user.role.replace('_', ' ') : 'Member'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                  {user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'Organization')}
                </p>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getProfilePath());
                  }}
                  className={`group flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 ${osConfig.theme.hoverText} transition-colors cursor-pointer`}
                >
                  <UserIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:currentColor" />
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSettingsPath());
                  }}
                  className={`group flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 ${osConfig.theme.hoverText} transition-colors cursor-pointer`}
                >
                  <Settings className="mr-3 h-4 w-4 text-slate-400 group-hover:currentColor" />
                  Account Settings
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSupportPath());
                  }}
                  className={`group flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 ${osConfig.theme.hoverText} transition-colors cursor-pointer`}
                >
                  <HelpCircle className="mr-3 h-4 w-4 text-slate-400 group-hover:currentColor" />
                  Help & Support
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="py-1">
                <button
                  onClick={handleLogoutClick}
                  className="group flex items-center w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="mr-3 h-4 w-4 text-rose-400 group-hover:text-rose-600" />
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
